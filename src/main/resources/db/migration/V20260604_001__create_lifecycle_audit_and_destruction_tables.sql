-- =============================================================================
-- V20260604_001 — 회원 lifecycle 통합 정책 (USER_LIFECYCLE_TERMINATION_POLICY)
-- W1 P0 게이트: 컴플라이언스 추적 테이블 6종 신설
--
-- 입력 보고서: /tmp/fk-survey-report.md (core-debugger, 2026-05-27)
--   §1.2 — `audit_logs` / `notifications` / `personal_data_destruction_logs` /
--          `consultant_client_mapping_history` / `session_compensation_history` /
--          `client_satisfaction_surveys` 6 테이블이 운영 DB·마이그레이션 모두 부재.
--   §6 권고  — `CREATE TABLE IF NOT EXISTS` + `FOREIGN KEY` 동시 정의는 V21/V32
--             mismatch 재발 risk. 본 마이그레이션은 순수 `CREATE TABLE` + 분리
--             `ALTER TABLE ADD CONSTRAINT` 패턴으로 작성.
--   §7.3 권고 — anonymize/destruction 경로는 audit + destruction log 신설 선행 필요.
--
-- 운영 안전성: 6 테이블 모두 운영 DB 부재 (행 수 0). 신설 마이그레이션 안전 윈도우.
-- FK 정책: 운영 56/57 FK 가 NO ACTION (CASCADE 1건 제외) 인 점과 정합 — 모두 NO ACTION.
--
-- ⚠ 본 마이그레이션은 위임 명세상 V20260528_005 로 작성될 예정이었으나, develop 기준
--    V20260528_001~_006 가 이미 사용 중 (shedlock, ai_usage_logs rename 등).
--    충돌 회피를 위해 V20260604_001 로 채번. 후속 합의서 §8 정합 시 함께 정리.
--
-- 위임 출처: core-planner v1.1 합의서 §8 (병행 진행) — 본 위임은 그 가이드를 대기하지
--           않고 debugger §6 권고 직접 흡수로 P0 게이트 선행.
--
-- @author CoreSolution
-- @since 2026-06-04
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. audit_logs — 통일 감사 로그 SSOT (USER_ANONYMIZE / DORMANT / HARD_DELETE 등)
-- -----------------------------------------------------------------------------
CREATE TABLE audit_logs (
    id                BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id         VARCHAR(50)     NOT NULL,
    actor_user_id     BIGINT          NULL COMMENT '행위자 users.id — SYSTEM cron 일 때 NULL',
    actor_role        VARCHAR(40)     NULL COMMENT 'CLIENT / CONSULTANT / ADMIN / HQ_ADMIN / SYSTEM',
    target_user_id    BIGINT          NULL COMMENT '행위 대상 users.id — 사용자 무관 액션 시 NULL',
    action            VARCHAR(60)     NOT NULL COMMENT 'USER_ANONYMIZE / USER_DORMANT_TRANSITION / USER_HARD_DELETE / LIFECYCLE_STATE_CHANGE 등',
    entity_type       VARCHAR(60)     NULL COMMENT '대상 엔티티 타입 (USER / MAPPING / SCHEDULE 등)',
    entity_id         BIGINT          NULL COMMENT '대상 엔티티 PK',
    before_json       JSON            NULL COMMENT '변경 전 상태 스냅샷',
    after_json        JSON            NULL COMMENT '변경 후 상태 스냅샷',
    metadata_json     JSON            NULL COMMENT '액션별 부가 메타데이터',
    ip_address        VARCHAR(45)     NULL COMMENT 'IPv4/IPv6 호환',
    user_agent        VARCHAR(500)    NULL,
    created_at        TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_audit_logs_tenant_created (tenant_id, created_at),
    INDEX idx_audit_logs_actor (actor_user_id),
    INDEX idx_audit_logs_target (target_user_id),
    INDEX idx_audit_logs_action (action),
    INDEX idx_audit_logs_entity (entity_type, entity_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='통일 감사 로그 SSOT — lifecycle/anonymize/destruction/관리자 액션 추적 (USER_LIFECYCLE_TERMINATION_POLICY §4)';

ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_logs_actor_user
        FOREIGN KEY (actor_user_id) REFERENCES users (id);

ALTER TABLE audit_logs
    ADD CONSTRAINT fk_audit_logs_target_user
        FOREIGN KEY (target_user_id) REFERENCES users (id);

-- -----------------------------------------------------------------------------
-- 2. notifications — 사용자별 in-app 알림 (broadcast 인 system_notifications 와 분리)
-- -----------------------------------------------------------------------------
CREATE TABLE notifications (
    id                  BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id           VARCHAR(50)     NOT NULL,
    recipient_user_id   BIGINT          NOT NULL COMMENT '수신자 users.id',
    sender_user_id      BIGINT          NULL COMMENT '발신자 users.id — SYSTEM 일 때 NULL',
    notification_type   VARCHAR(40)     NOT NULL COMMENT 'SYSTEM / WITHDRAWAL / MAPPING / PAYMENT / WELLNESS 등',
    title               VARCHAR(255)    NOT NULL,
    body                TEXT            NULL,
    metadata_json       JSON            NULL,
    status              VARCHAR(20)     NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING / SENT / READ / CANCELLED',
    read_at             TIMESTAMP       NULL,
    cancelled_at        TIMESTAMP       NULL,
    cancel_reason       VARCHAR(255)    NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    is_deleted          BOOLEAN         NOT NULL DEFAULT FALSE,
    deleted_at          TIMESTAMP       NULL,
    PRIMARY KEY (id),
    INDEX idx_notifications_tenant_recipient_status_created
        (tenant_id, recipient_user_id, status, created_at),
    INDEX idx_notifications_sender (sender_user_id),
    INDEX idx_notifications_type (notification_type)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='사용자별 in-app 알림 — broadcast(system_notifications)와 분리된 수신자 단일 행';

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_recipient_user
        FOREIGN KEY (recipient_user_id) REFERENCES users (id);

ALTER TABLE notifications
    ADD CONSTRAINT fk_notifications_sender_user
        FOREIGN KEY (sender_user_id) REFERENCES users (id);

-- -----------------------------------------------------------------------------
-- 3. personal_data_destruction_logs — PIPA §16 파기 기록 의무
-- -----------------------------------------------------------------------------
CREATE TABLE personal_data_destruction_logs (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id               VARCHAR(50)     NOT NULL,
    target_user_id          BIGINT          NOT NULL COMMENT '파기 대상 users.id',
    destruction_type        VARCHAR(30)     NOT NULL COMMENT 'ANONYMIZE / TOMBSTONE / HARD_DELETE / DORMANT_TRANSITION',
    pii_columns_affected    JSON            NOT NULL COMMENT '컬럼별 처리 매트릭스 (어떤 컬럼이 어떻게 anonymize 되었는지)',
    before_email_hash       CHAR(64)        NULL COMMENT 'SHA256 — 추적용. PII 원본 보존 금지',
    before_name_hash        CHAR(64)        NULL COMMENT 'SHA256 — 추적용',
    before_phone_hash       CHAR(64)        NULL COMMENT 'SHA256 — 추적용',
    executed_by_user_id     BIGINT          NULL COMMENT '실행자 users.id — SYSTEM cron 일 때 NULL',
    execution_reason        VARCHAR(255)    NULL COMMENT 'WITHDRAWAL / 5_YEAR_EXPIRY / ADMIN_FORCED 등',
    legal_basis             VARCHAR(60)     NOT NULL COMMENT 'PIPA_§36 / PIPA_§39_6 / ADMIN_FORCED / MEDICAL_LAW_§22_10Y 등',
    executed_at             TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recovery_window_until   TIMESTAMP       NULL COMMENT '7일 복구 윈도우 만료 시각',
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_pdd_logs_tenant_executed (tenant_id, executed_at),
    INDEX idx_pdd_logs_target (target_user_id),
    INDEX idx_pdd_logs_type (destruction_type),
    INDEX idx_pdd_logs_executed_by (executed_by_user_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='PIPA §16 개인정보 파기 기록 의무 — anonymize/tombstone/hard_delete/dormant 전수 audit trail';

ALTER TABLE personal_data_destruction_logs
    ADD CONSTRAINT fk_pdd_logs_target_user
        FOREIGN KEY (target_user_id) REFERENCES users (id);

ALTER TABLE personal_data_destruction_logs
    ADD CONSTRAINT fk_pdd_logs_executed_by_user
        FOREIGN KEY (executed_by_user_id) REFERENCES users (id);

-- -----------------------------------------------------------------------------
-- 4. consultant_client_mapping_history — 매핑 변경 이력
-- -----------------------------------------------------------------------------
CREATE TABLE consultant_client_mapping_history (
    id                      BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id               VARCHAR(50)     NOT NULL,
    mapping_id              BIGINT          NOT NULL COMMENT '대상 consultant_client_mappings.id',
    client_id               BIGINT          NULL COMMENT '내담자 users.id (변경 시점 스냅샷)',
    consultant_id           BIGINT          NULL COMMENT '컨설턴트 users.id (변경 시점 스냅샷)',
    event_type              VARCHAR(40)     NOT NULL COMMENT 'CREATED / UPDATED / PARTIAL_REFUND / TERMINATED / RESTORED / SESSION_USED / SESSION_ADDED',
    before_state_json       JSON            NULL,
    after_state_json        JSON            NULL,
    triggered_by_user_id    BIGINT          NULL COMMENT '액션 트리거 users.id',
    reason                  VARCHAR(255)    NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_ccmh_tenant_mapping_created (tenant_id, mapping_id, created_at),
    INDEX idx_ccmh_client (client_id),
    INDEX idx_ccmh_consultant (consultant_id),
    INDEX idx_ccmh_event_type (event_type)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='consultant_client_mappings 의 변경 이력 (planner v1.1 합의서 §8 인용 가능)';

ALTER TABLE consultant_client_mapping_history
    ADD CONSTRAINT fk_ccmh_mapping
        FOREIGN KEY (mapping_id) REFERENCES consultant_client_mappings (id);

ALTER TABLE consultant_client_mapping_history
    ADD CONSTRAINT fk_ccmh_client_user
        FOREIGN KEY (client_id) REFERENCES users (id);

ALTER TABLE consultant_client_mapping_history
    ADD CONSTRAINT fk_ccmh_consultant_user
        FOREIGN KEY (consultant_id) REFERENCES users (id);

ALTER TABLE consultant_client_mapping_history
    ADD CONSTRAINT fk_ccmh_triggered_by_user
        FOREIGN KEY (triggered_by_user_id) REFERENCES users (id);

-- -----------------------------------------------------------------------------
-- 5. session_compensation_history — 회기 보상 이력 (no-show / late-cancel / extension)
-- -----------------------------------------------------------------------------
CREATE TABLE session_compensation_history (
    id                          BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id                   VARCHAR(50)     NOT NULL,
    mapping_id                  BIGINT          NOT NULL COMMENT '대상 consultant_client_mappings.id',
    client_id                   BIGINT          NOT NULL COMMENT '내담자 users.id',
    consultant_id               BIGINT          NULL COMMENT '컨설턴트 users.id',
    compensation_type           VARCHAR(40)     NOT NULL COMMENT 'NO_SHOW_COMP / LATE_CANCEL_COMP / EXTENSION / PARTIAL_REFUND_ROLLBACK',
    session_delta               DECIMAL(5,2)    NOT NULL COMMENT '보상 회기 (0.5 / 1.0 등)',
    before_remaining_sessions   INT             NOT NULL,
    after_remaining_sessions    INT             NOT NULL,
    triggered_by_user_id        BIGINT          NULL,
    reason                      VARCHAR(500)    NULL,
    created_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    INDEX idx_sch_tenant_mapping_created (tenant_id, mapping_id, created_at),
    INDEX idx_sch_client (client_id),
    INDEX idx_sch_type (compensation_type)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='회기 보상 이력 — no-show / late-cancel / extension / partial-refund-rollback';

ALTER TABLE session_compensation_history
    ADD CONSTRAINT fk_sch_mapping
        FOREIGN KEY (mapping_id) REFERENCES consultant_client_mappings (id);

ALTER TABLE session_compensation_history
    ADD CONSTRAINT fk_sch_client_user
        FOREIGN KEY (client_id) REFERENCES users (id);

ALTER TABLE session_compensation_history
    ADD CONSTRAINT fk_sch_triggered_by_user
        FOREIGN KEY (triggered_by_user_id) REFERENCES users (id);

-- -----------------------------------------------------------------------------
-- 6. client_satisfaction_surveys — 만족도 (planner v1.0 인용)
-- -----------------------------------------------------------------------------
CREATE TABLE client_satisfaction_surveys (
    id                         BIGINT       NOT NULL AUTO_INCREMENT,
    tenant_id                  VARCHAR(50)  NOT NULL,
    client_id                  BIGINT       NOT NULL COMMENT '내담자 users.id',
    consultant_id              BIGINT       NOT NULL COMMENT '컨설턴트 users.id',
    mapping_id                 BIGINT       NULL COMMENT '관련 consultant_client_mappings.id',
    schedule_id                BIGINT       NULL COMMENT '관련 schedules.id (논리 FK — schedules 는 FK 없음)',
    overall_rating             TINYINT      NOT NULL COMMENT '전체 평점 1~5',
    professionalism_rating     TINYINT      NULL COMMENT '전문성 평점 1~5',
    empathy_rating             TINYINT      NULL COMMENT '공감 평점 1~5',
    recommendation_rating      TINYINT      NULL COMMENT '추천 평점 1~5',
    comment                    TEXT         NULL,
    is_anonymous               BOOLEAN      NOT NULL DEFAULT FALSE,
    submitted_at               TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_deleted                 BOOLEAN      NOT NULL DEFAULT FALSE,
    deleted_at                 TIMESTAMP    NULL,
    PRIMARY KEY (id),
    INDEX idx_css_tenant_consultant_submitted (tenant_id, consultant_id, submitted_at),
    INDEX idx_css_client (client_id),
    INDEX idx_css_mapping (mapping_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='내담자 만족도 (planner v1.0 인용 — empathy/professionalism/recommendation 세분화)';

ALTER TABLE client_satisfaction_surveys
    ADD CONSTRAINT fk_css_client_user
        FOREIGN KEY (client_id) REFERENCES users (id);

ALTER TABLE client_satisfaction_surveys
    ADD CONSTRAINT fk_css_consultant_user
        FOREIGN KEY (consultant_id) REFERENCES users (id);

ALTER TABLE client_satisfaction_surveys
    ADD CONSTRAINT fk_css_mapping
        FOREIGN KEY (mapping_id) REFERENCES consultant_client_mappings (id);

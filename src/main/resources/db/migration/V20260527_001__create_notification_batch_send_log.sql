-- =============================================================================
-- notification_batch_send_log — 알림 발송 배치 + 회기 종료 안내 멱등성 로그 테이블
-- 기획: docs/project-management/2026-05-23/NOTIFICATION_BATCH_MESSAGE_DESIGN.md §4
-- 트랙 A·B — 예약 D-2 배치 / 단회기·D-2 미만 즉시 발송 / 회기 종료 안내 5종 템플릿 멱등성 보장.
-- 멱등 가드: (tenant_id, template_code, target_type, target_id, recipient_user_id) UNIQUE.
--   동일 키에 대한 재실행은 INSERT 충돌로 자동 차단.
-- 멱등 패턴: INFORMATION_SCHEMA 가드 (CREATE TABLE IF NOT EXISTS + ADD INDEX 가드).
-- 파일명: V20260527_001 — 최신 V20260526_004 이후 ordering 보장.
-- =============================================================================

CREATE TABLE IF NOT EXISTS notification_batch_send_log (
    id                       BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id                VARCHAR(50)     NOT NULL,
    template_code            VARCHAR(100)    NOT NULL COMMENT 'RESERVATION_REMINDER_D2 / RESERVATION_IMMEDIATE_SINGLE / RESERVATION_IMMEDIATE_LATE / SESSION_ENDING_SOON / SESSION_RENEW_PROMPT',
    target_type              VARCHAR(20)     NOT NULL COMMENT 'SCHEDULE / MAPPING / USER — 멱등 키 일부',
    target_id                BIGINT          NOT NULL COMMENT '대상 엔티티 PK (schedules.id 또는 consultant_client_mappings.id)',
    recipient_user_id        BIGINT          NOT NULL COMMENT '발송 수신자 users.id',
    recipient_phone_masked   VARCHAR(20)     NOT NULL COMMENT 'PhoneLogMasking 규칙 마스킹된 전화번호',
    channel_used             VARCHAR(20)     NOT NULL COMMENT 'ALIMTALK / SMS — 최종 발송 채널',
    fallback_to_sms          BOOLEAN         NOT NULL DEFAULT FALSE COMMENT '알림톡 실패 → SMS 폴백 여부',
    success                  BOOLEAN         NOT NULL DEFAULT FALSE,
    error_code               VARCHAR(50)     NULL,
    error_message            VARCHAR(1000)   NULL,
    solapi_group_id          VARCHAR(100)    NULL,
    solapi_message_id        VARCHAR(100)    NULL,
    sent_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at               TIMESTAMP       NULL,
    is_deleted               BOOLEAN         NOT NULL DEFAULT FALSE,
    version                  BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uq_nbsl_dispatch_idempotency (tenant_id, template_code, target_type, target_id, recipient_user_id),
    KEY idx_nbsl_tenant_sent (tenant_id, sent_at),
    KEY idx_nbsl_tenant_template (tenant_id, template_code)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='알림 배치/이벤트 발송 멱등성 로그 — 트랙 A·B (NOTIFICATION_BATCH_MESSAGE_DESIGN P1.2)';

-- 멱등 가드: 인덱스 존재 여부 재확인 (테이블이 이미 존재했던 환경에서 UNIQUE/INDEX 누락 보강).
SET @dbname = DATABASE();
SET @tablename = 'notification_batch_send_log';

SET @uq_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'uq_nbsl_dispatch_idempotency'
);
SET @uq_sql = IF(@uq_exists = 0,
    'ALTER TABLE notification_batch_send_log ADD UNIQUE KEY uq_nbsl_dispatch_idempotency (tenant_id, template_code, target_type, target_id, recipient_user_id)',
    'SELECT "uq_nbsl_dispatch_idempotency already exists"'
);
PREPARE stmt_uq FROM @uq_sql; EXECUTE stmt_uq; DEALLOCATE PREPARE stmt_uq;

SET @idx_sent_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_nbsl_tenant_sent'
);
SET @idx_sent_sql = IF(@idx_sent_exists = 0,
    'ALTER TABLE notification_batch_send_log ADD INDEX idx_nbsl_tenant_sent (tenant_id, sent_at)',
    'SELECT "idx_nbsl_tenant_sent already exists"'
);
PREPARE stmt_idx_sent FROM @idx_sent_sql; EXECUTE stmt_idx_sent; DEALLOCATE PREPARE stmt_idx_sent;

SET @idx_tpl_exists = (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = @dbname AND TABLE_NAME = @tablename AND INDEX_NAME = 'idx_nbsl_tenant_template'
);
SET @idx_tpl_sql = IF(@idx_tpl_exists = 0,
    'ALTER TABLE notification_batch_send_log ADD INDEX idx_nbsl_tenant_template (tenant_id, template_code)',
    'SELECT "idx_nbsl_tenant_template already exists"'
);
PREPARE stmt_idx_tpl FROM @idx_tpl_sql; EXECUTE stmt_idx_tpl; DEALLOCATE PREPARE stmt_idx_tpl;

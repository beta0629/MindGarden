-- =============================================================================
-- V20261127_001 — client_event 멱등 재생성 (D-1 동기화 후 .dev)
--
-- D-1 동기화로 테이블이 사라진 뒤 .dev BE 배포(Flyway)가 멱등으로 재생성한다.
-- 컬럼/인덱스/UK는 V20261126_002__create_client_event.sql 과 동일.
-- 기존 V20261126_002 수정 금지.
--
-- @author MindGarden
-- @since 2026-11-27
-- =============================================================================

CREATE TABLE IF NOT EXISTS client_event (
    id                          BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id                   VARCHAR(50)     NOT NULL,
    client_id                   BIGINT          NOT NULL COMMENT '내담자 users.id (스냅샷)',
    event_type                  VARCHAR(40)     NOT NULL COMMENT 'ClientEventType code',
    occurred_at                 DATETIME(6)     NOT NULL COMMENT '이벤트 발생 시각',
    actor_user_id               BIGINT          NULL COMMENT '행위자 users.id',
    actor_role                  VARCHAR(40)     NULL COMMENT '행위자 역할 코드',
    source                      VARCHAR(20)     NOT NULL COMMENT 'ClientEventSource code',
    reason                      VARCHAR(255)    NULL,
    before_json                 JSON            NULL COMMENT '변경 전 요약(민감값 제외)',
    after_json                  JSON            NULL COMMENT '변경 후 요약(민감값 제외)',
    schedule_id                 BIGINT          NULL COMMENT 'schedules.id 스냅샷',
    mapping_id                  BIGINT          NULL COMMENT 'consultant_client_mappings.id 스냅샷',
    payment_id                  BIGINT          NULL COMMENT 'payments.id 스냅샷',
    erp_transaction_id          VARCHAR(100)    NULL COMMENT 'ERP/전표 참조 키 스냅샷',
    sessions_remaining_before   INT             NULL,
    sessions_remaining_after    INT             NULL,
    sessions_used_before        INT             NULL,
    sessions_used_after         INT             NULL,
    amount                      DECIMAL(19, 2)  NULL COMMENT '결제/환불 금액(없으면 NULL)',
    currency                    VARCHAR(3)      NULL,
    idempotency_key             VARCHAR(191)    NULL COMMENT '백필·중복 방지 자연키',
    created_at                  DATETIME(6)     NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    PRIMARY KEY (id),
    UNIQUE KEY uk_client_event_tenant_idempotency (tenant_id, idempotency_key),
    INDEX idx_client_event_tenant_client_occurred (tenant_id, client_id, occurred_at),
    INDEX idx_client_event_tenant_mapping_occurred (tenant_id, mapping_id, occurred_at),
    INDEX idx_client_event_tenant_event_type (tenant_id, event_type)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='내담자 관리용 타임라인 append-only (결제·회기·배정·일정)';

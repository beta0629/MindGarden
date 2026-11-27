-- =============================================================================
-- V20261126_002 — client_event (내담자 관리용 타임라인, append-only)
--
-- 목적: 내담자 1명의 결제·회기 증감·배정·일정 흐름을 시간순으로 조회.
--       상담일지·문자(SMS) 이벤트는 본 테이블 범위 밖.
-- soft delete / updated_at / version 없음. 참조 ID는 스냅샷(느슨) — FK 미적용.
--
-- @author MindGarden
-- @since 2026-11-26
-- =============================================================================

CREATE TABLE client_event (
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

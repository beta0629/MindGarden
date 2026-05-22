-- =============================================================================
-- Admin Test Notification Logs — 어드민 테스트 발송 도구 감사로그
-- 기획: docs/project-management/2026-05-22/ADMIN_TEST_NOTIFICATION_TOOL_PLAN.md §4.X C6 (new_table)
-- 90일 보관 정책: 별도 스케줄러는 본 PR 범위 외 (TODO 후속 PR)
-- 파일명 규칙: timestamp V20260522_003__ (어제 V73 명명 사고 회피 — Flyway 적용 보장)
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_test_notification_logs (
    id                       BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id                VARCHAR(50)     NOT NULL,
    sent_by_user_id          BIGINT          NOT NULL,
    sent_by_username         VARCHAR(100)    NOT NULL,
    sent_at                  TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    recipient_mode           VARCHAR(20)     NOT NULL,
    recipient_user_id        BIGINT          NULL,
    recipient_phone_masked   VARCHAR(20)     NOT NULL,
    channel                  VARCHAR(20)     NOT NULL,
    template_code            VARCHAR(100)    NULL,
    template_params          JSON            NULL,
    message_content          TEXT            NULL,
    reason                   VARCHAR(500)    NOT NULL,
    success                  BOOLEAN         NOT NULL DEFAULT FALSE,
    error_code               VARCHAR(50)     NULL,
    error_message            VARCHAR(1000)   NULL,
    solapi_group_id          VARCHAR(100)    NULL,
    solapi_message_id        VARCHAR(100)    NULL,
    created_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at               TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at               TIMESTAMP       NULL,
    is_deleted               BOOLEAN         NOT NULL DEFAULT FALSE,
    version                  BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_atnl_tenant (tenant_id),
    KEY idx_atnl_sent_by_user (sent_by_user_id),
    KEY idx_atnl_sent_at (sent_at),
    KEY idx_atnl_tenant_user_sent (tenant_id, sent_by_user_id, sent_at),
    KEY idx_atnl_tenant_user_success (tenant_id, sent_by_user_id, success)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='어드민 SMS·알림톡 테스트 발송 감사로그 (90일 보관 — 별도 스케줄러 후속 PR)';

-- TODO: 90일 보관 스케줄러 — `personal-data-destruction` 또는 신규 `admin-test-notification-cleanup`
--       크론으로 `DELETE FROM admin_test_notification_logs WHERE sent_at < NOW() - INTERVAL 90 DAY`.
--       본 마이그레이션 범위 외(P2-a → P4 분리).

-- =============================================================================
-- 어드민 수동 다중 발송 비동기 작업 (PR AD, 2026-10-05)
--   manual_notification_jobs              : 발송 작업 1건(요청 멱등 키·확정 대상 해시·진행 집계·실행 점유)
--   manual_notification_job_recipients    : 발송 시점에 서버가 확정한 수신자 목록(작업당 수신자 1행)
--   manual_notification_dispatch_records  : 프로바이더 호출 직전 기록(수신자·시도별). dispatch_key 유니크로 중복 발송 차단
-- 재실행 안전: CREATE TABLE IF NOT EXISTS 만 사용. 기존 데이터 UPDATE/DELETE 없음.
-- =============================================================================

CREATE TABLE IF NOT EXISTS manual_notification_jobs (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    tenant_id             VARCHAR(50)   NOT NULL DEFAULT '',
    job_uuid              VARCHAR(36)   NOT NULL DEFAULT '',
    idempotency_key       VARCHAR(64)   NOT NULL DEFAULT '',
    created_by_user_id    BIGINT        NOT NULL DEFAULT 0,
    created_by_username   VARCHAR(100)  NULL,
    channel               VARCHAR(20)   NOT NULL DEFAULT '',
    recipient_mode        VARCHAR(20)   NOT NULL DEFAULT '',
    marketing             BOOLEAN       NOT NULL DEFAULT FALSE,
    status                VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    provider_mode         VARCHAR(20)   NULL,
    message_content       TEXT          NULL,
    push_title            VARCHAR(100)  NULL,
    template_code         VARCHAR(100)  NULL,
    template_source       VARCHAR(20)   NULL,
    template_params       TEXT          NULL,
    reason                VARCHAR(500)  NULL,
    snapshot_token        VARCHAR(64)   NULL,
    excluded_count        INT           NOT NULL DEFAULT 0,
    ineligible_count      INT           NOT NULL DEFAULT 0,
    total_count           INT           NOT NULL DEFAULT 0,
    sent_count            INT           NOT NULL DEFAULT 0,
    failed_count          INT           NOT NULL DEFAULT 0,
    skipped_count         INT           NOT NULL DEFAULT 0,
    chunk_size            INT           NOT NULL DEFAULT 0,
    chunk_count           INT           NOT NULL DEFAULT 0,
    execution_attempts    INT           NOT NULL DEFAULT 0,
    lease_owner           VARCHAR(100)  NULL,
    lease_until           DATETIME      NULL,
    started_at            DATETIME      NULL,
    finished_at           DATETIME      NULL,
    error_code            VARCHAR(50)   NULL,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at            TIMESTAMP     NULL,
    is_deleted            BOOLEAN       NOT NULL DEFAULT FALSE,
    version               BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_mnj_job_uuid (job_uuid),
    UNIQUE KEY uk_mnj_idempotency (tenant_id, created_by_user_id, idempotency_key),
    KEY idx_mnj_tenant_created (tenant_id, created_at),
    KEY idx_mnj_status_lease (status, lease_until)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='어드민 수동 다중 발송 비동기 작업';

CREATE TABLE IF NOT EXISTS manual_notification_job_recipients (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    tenant_id             VARCHAR(50)   NOT NULL DEFAULT '',
    job_id                BIGINT        NOT NULL DEFAULT 0,
    seq                   INT           NOT NULL DEFAULT 0,
    recipient_key         VARCHAR(80)   NOT NULL DEFAULT '',
    user_id               BIGINT        NULL,
    phone_masked          VARCHAR(20)   NULL,
    phone_encrypted       VARCHAR(512)  NULL,
    status                VARCHAR(20)   NOT NULL DEFAULT 'PENDING',
    chunk_index           INT           NULL,
    attempt_no            INT           NOT NULL DEFAULT 0,
    provider_result_code  VARCHAR(50)   NULL,
    error_code            VARCHAR(50)   NULL,
    error_message         VARCHAR(500)  NULL,
    audit_log_id          BIGINT        NULL,
    completed_at          DATETIME      NULL,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at            TIMESTAMP     NULL,
    is_deleted            BOOLEAN       NOT NULL DEFAULT FALSE,
    version               BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_mnjr_job_recipient (job_id, recipient_key),
    KEY idx_mnjr_job_status_seq (job_id, status, seq),
    KEY idx_mnjr_tenant (tenant_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='수동 발송 작업 확정 수신자(작업당 수신자 1행)';

CREATE TABLE IF NOT EXISTS manual_notification_dispatch_records (
    id                    BIGINT        NOT NULL AUTO_INCREMENT,
    tenant_id             VARCHAR(50)   NOT NULL DEFAULT '',
    job_id                BIGINT        NOT NULL DEFAULT 0,
    job_recipient_id      BIGINT        NOT NULL DEFAULT 0,
    user_id               BIGINT        NULL,
    phone_masked          VARCHAR(20)   NULL,
    channel               VARCHAR(20)   NOT NULL DEFAULT '',
    chunk_index           INT           NOT NULL DEFAULT 0,
    dispatch_key          VARCHAR(120)  NOT NULL DEFAULT '',
    attempt_no            INT           NOT NULL DEFAULT 0,
    provider_mode         VARCHAR(20)   NULL,
    status                VARCHAR(20)   NOT NULL DEFAULT 'DISPATCHING',
    provider_result_code  VARCHAR(50)   NULL,
    dispatched_at         DATETIME      NULL,
    completed_at          DATETIME      NULL,
    created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at            TIMESTAMP     NULL,
    is_deleted            BOOLEAN       NOT NULL DEFAULT FALSE,
    version               BIGINT        NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    UNIQUE KEY uk_mndr_dispatch_key (dispatch_key),
    UNIQUE KEY uk_mndr_job_recipient (job_id, job_recipient_id),
    KEY idx_mndr_job_chunk (job_id, chunk_index),
    KEY idx_mndr_tenant (tenant_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='수동 발송 프로바이더 호출 직전 기록(수신자·시도별)';

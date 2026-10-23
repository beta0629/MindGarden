-- =============================================================================
-- V20260914_002 — 타기관 연계 상담일지
--
-- 회기권 consultation_records 와 테이블을 분리한다. remaining_sessions 컬럼 없음.
-- V20260914_003 계약 테이블보다 먼저 적용되므로 contract_id FK 는 두지 않는다.
-- =============================================================================

CREATE TABLE IF NOT EXISTS institution_link_consultation_logs (
    id                          BIGINT          NOT NULL AUTO_INCREMENT,
    tenant_id                   VARCHAR(36)     NOT NULL,
    contract_id                 BIGINT          NULL COMMENT 'institution_link_contracts.id (FK 없음, 003 이후)',
    mapping_id                 BIGINT          NULL COMMENT 'consultant_client_mappings.id (최가을 등)',
    schedule_id                 BIGINT          NULL COMMENT 'schedules.id',
    client_id                   BIGINT          NOT NULL,
    consultant_id               BIGINT          NOT NULL,
    session_date                DATE            NOT NULL,
    billing_year_month          VARCHAR(7)      NOT NULL COMMENT 'yyyy-MM 월말 내역',
    monthly_occurrence          INT             NOT NULL COMMENT '해당 연월 내 회차(1-based)',
    client_condition            TEXT            NULL,
    main_issues                 TEXT            NULL,
    intervention_methods        TEXT            NULL,
    client_response              TEXT            NULL,
    next_session_plan           TEXT            NULL,
    homework_assigned           TEXT            NULL,
    consultant_observations     TEXT            NULL,
    consultant_assessment       TEXT            NULL,
    progress_evaluation         TEXT            NULL,
    special_considerations      TEXT            NULL,
    is_session_completed        BOOLEAN         NOT NULL DEFAULT FALSE,
    completed_at                DATETIME(6)      NULL,
    created_at                  DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                  DATETIME(6)      NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at                  DATETIME(6)      NULL,
    is_deleted                  BOOLEAN         NOT NULL DEFAULT FALSE,
    version                     BIGINT          NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_ilcl_tenant_mapping_month (tenant_id, mapping_id, billing_year_month),
    KEY idx_ilcl_tenant_contract_month (tenant_id, contract_id, billing_year_month),
    KEY idx_ilcl_tenant_session_date (tenant_id, session_date),
    KEY idx_ilcl_tenant_schedule (tenant_id, schedule_id)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='타기관 연계 상담일지 (회기권 consultation_records 와 분리)';

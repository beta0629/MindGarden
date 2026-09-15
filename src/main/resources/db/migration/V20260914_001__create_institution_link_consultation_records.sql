-- =============================================================================
-- V20260914_001__create_institution_link_consultation_records.sql
-- 타기관 연계 상담일지 (회기권 consultation_records 와 분리)
--
-- 운영 영향: 신규 테이블 1건. 기존 일지 테이블·프로시저 미변경.
-- =============================================================================

CREATE TABLE IF NOT EXISTS institution_link_consultation_records (
    id                         BIGINT         NOT NULL AUTO_INCREMENT,
    tenant_id                  VARCHAR(36)    NOT NULL,
    mapping_id                 BIGINT         NOT NULL,
    schedule_id                BIGINT         NOT NULL,
    consultant_id              BIGINT         NOT NULL,
    client_id                  BIGINT         NOT NULL,
    engagement_type            VARCHAR(32)    NOT NULL COMMENT 'INSTITUTION_LINK only',
    billing_year_month         CHAR(7)         NOT NULL COMMENT 'yyyy-MM 월말 상담내역 키',
    monthly_occurrence         INT            NOT NULL COMMENT '해당 월 내 회차 (회기권 sessionSequence 아님)',
    session_date               DATE           NOT NULL,
    client_condition           TEXT           NULL,
    main_issues                TEXT           NULL,
    intervention_methods       TEXT           NULL,
    client_response             TEXT           NULL,
    next_session_plan          TEXT           NULL,
    consultant_observations    TEXT           NULL,
    consultant_assessment      TEXT           NULL,
    session_duration_minutes   INT            NULL,
    is_session_completed        BOOLEAN        NOT NULL DEFAULT FALSE,
    completion_time            DATETIME(6)    NULL,
    created_at                 DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    updated_at                 DATETIME(6)    NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    deleted_at                 DATETIME(6)    NULL,
    is_deleted                 BOOLEAN        NOT NULL DEFAULT FALSE,
    version                    BIGINT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_ilcr_tenant_mapping_month (tenant_id, mapping_id, billing_year_month),
    KEY idx_ilcr_tenant_schedule (tenant_id, schedule_id),
    KEY idx_ilcr_tenant_deleted (tenant_id, is_deleted)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci
  COMMENT='타기관 연계 상담일지 (회기권 consultation_records 와 분리)';

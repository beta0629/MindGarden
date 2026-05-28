-- =============================================================================
-- ERP P0-2 PR-B (financial_period 테이블 신설)
--
-- 목적: 재무 마감(일/주/월) 결과 SSOT 테이블. 닫힌 기간의 KPI 불변성 확보.
-- 합의서: docs/project-management/2026-05-28/ERP_FINANCIAL_CLOSE_IMPLEMENTATION_PLAN.md §2 Q4
--
-- 핵심 정책:
--  - 멀티테넌트 격리: tenant_id NOT NULL + UNIQUE (tenant_id, period_type, period_start)
--  - 낙관적 락: version 컬럼 (@Version)
--  - 부가세 가드(Q8) 보조 컬럼: total_tax_amount, total_refund
--  - 재오픈(Q6) 추적: status='REOPENED' + reopened_at/by/reason
--  - idempotent: CREATE TABLE IF NOT EXISTS
-- =============================================================================
CREATE TABLE IF NOT EXISTS financial_period (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID (멀티테넌트 격리)',
    period_type VARCHAR(10) NOT NULL COMMENT 'DAY / WEEK / MONTH',
    period_start DATE NOT NULL COMMENT '기간 시작일(포함)',
    period_end DATE NOT NULL COMMENT '기간 종료일(포함)',
    status VARCHAR(10) NOT NULL DEFAULT 'OPEN' COMMENT 'OPEN / CLOSED / REOPENED',

    total_income DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '기간 INCOME 합계',
    total_expense DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '기간 EXPENSE 합계',
    net_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT 'income − expense (환불 반영)',
    total_tax_amount DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '기간 부가세 합계 (Q8 가드)',
    total_refund DECIMAL(15,2) NOT NULL DEFAULT 0 COMMENT '기간 환불(SUBCATEGORY=CONSULTATION_REFUND/PARTIAL) 합계',

    closed_at TIMESTAMP NULL COMMENT '마감 시각',
    closed_by VARCHAR(64) NULL COMMENT '마감 호출자(시스템 cron 또는 admin user_id)',
    reopened_at TIMESTAMP NULL COMMENT '재오픈 시각',
    reopened_by VARCHAR(64) NULL COMMENT '재오픈 호출자(HQ_ADMIN user_id)',
    reopen_reason VARCHAR(500) NULL COMMENT '재오픈 사유 (최소 20자)',

    version BIGINT NOT NULL DEFAULT 0 COMMENT '낙관적 락',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

    UNIQUE KEY uk_tenant_period (tenant_id, period_type, period_start),
    INDEX idx_tenant_status (tenant_id, status),
    INDEX idx_tenant_period_end (tenant_id, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  COMMENT='재무 마감 기간 SSOT (Q4 스키마, P0-2 PR-B)';

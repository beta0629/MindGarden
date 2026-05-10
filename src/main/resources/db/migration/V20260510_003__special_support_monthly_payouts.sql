-- 특별지원금: 정산 월(급여 기간 시작일 기준 YYYY-MM) × 상담사 × 내담자(매핑)당 1회 지급 추적
-- ProcessIntegratedSalaryCalculation 확정 시 INSERT, CalculateSalaryPreview 에서 동월 중복 제외

CREATE TABLE IF NOT EXISTS special_support_monthly_payouts (
    id BIGINT NOT NULL AUTO_INCREMENT,
    tenant_id VARCHAR(100) NOT NULL,
    consultant_id BIGINT NOT NULL,
    client_id BIGINT NOT NULL,
    salary_year_month VARCHAR(7) NOT NULL COMMENT 'YYYY-MM (p_period_start 기준)',
    amount DECIMAL(15, 2) NOT NULL,
    salary_calculation_id BIGINT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_ss_payout_tenant_consultant_client_ym (tenant_id, consultant_id, client_id, salary_year_month),
    KEY idx_ss_payout_tenant_consultant (tenant_id, consultant_id),
    KEY idx_ss_payout_calc (salary_calculation_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

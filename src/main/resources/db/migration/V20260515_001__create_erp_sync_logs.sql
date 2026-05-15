-- ERP 동기화 로그 (급여 승인/지급 프로시저 및 애플리케이션 공통)
-- ApproveSalaryWithErpSync / ProcessSalaryPaymentWithErpSync INSERT·UPDATE 컬럼과 정합
-- @author MindGarden
-- @since 2026-05-15

CREATE TABLE IF NOT EXISTS erp_sync_logs (
    id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(100) NOT NULL COMMENT '테넌트 ID',
    sync_type VARCHAR(50) NOT NULL COMMENT '동기화 유형 (SALARY_APPROVAL 등)',
    sync_date DATETIME(6) NOT NULL COMMENT '동기화 기준 시각',
    records_processed INT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL COMMENT 'PENDING, COMPLETED, FAILED 등',
    error_message TEXT NULL,
    started_at DATETIME(6) NULL,
    completed_at DATETIME(6) NULL,
    duration_seconds BIGINT NULL,
    sync_data JSON NULL COMMENT '부가 데이터(JSON)',
    created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    created_by VARCHAR(50) NULL,
    updated_at DATETIME(6) NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    updated_by VARCHAR(50) NULL,
    KEY idx_erp_sync_logs_tenant_date (tenant_id, sync_date),
    KEY idx_erp_sync_logs_tenant_status (tenant_id, status),
    KEY idx_erp_sync_logs_tenant_sync_type (tenant_id, sync_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='ERP 동기화 로그';

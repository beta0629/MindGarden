-- =====================================================
-- ERP 고도화: 원장 시스템 (Phase 1-2)
-- 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
-- =====================================================

-- erp_ledgers 테이블 생성 (원장)
CREATE TABLE IF NOT EXISTS erp_ledgers (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    account_id BIGINT NOT NULL COMMENT '계정 ID (accounts.id)',
    period_start DATE NOT NULL COMMENT '기간 시작일',
    period_end DATE NOT NULL COMMENT '기간 종료일',
    opening_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '기초 잔액',
    total_debit DECIMAL(15, 2) DEFAULT 0 COMMENT '총 차변',
    total_credit DECIMAL(15, 2) DEFAULT 0 COMMENT '총 대변',
    closing_balance DECIMAL(15, 2) DEFAULT 0 COMMENT '기말 잔액',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    FOREIGN KEY (account_id) REFERENCES accounts(id),
    
    UNIQUE KEY uk_erp_ledgers_account_period (tenant_id, account_id, period_start, period_end),
    INDEX idx_erp_ledgers_tenant_id (tenant_id),
    INDEX idx_erp_ledgers_account_id (account_id),
    INDEX idx_erp_ledgers_period (period_start, period_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='원장 테이블';


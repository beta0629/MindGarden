-- =====================================================
-- ERP 고도화: 정산 자동화 시스템 (Phase 2)
-- 표준 문서: docs/standards/ERP_ADVANCEMENT_STANDARD.md
-- =====================================================

-- erp_settlement_rules 테이블 생성 (정산 규칙)
CREATE TABLE IF NOT EXISTS erp_settlement_rules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    rule_name VARCHAR(100) NOT NULL COMMENT '규칙명',
    business_type VARCHAR(20) COMMENT '업종: ACADEMY, CONSULTATION, CAFE, FOOD_SERVICE',
    settlement_type VARCHAR(20) NOT NULL COMMENT '정산 유형: REVENUE, COMMISSION, ROYALTY',
    calculation_method VARCHAR(20) NOT NULL COMMENT '계산 방법: PERCENTAGE, FIXED, TIERED',
    calculation_params JSON COMMENT '계산 파라미터 (JSON)',
    is_active BOOLEAN DEFAULT TRUE,
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    INDEX idx_erp_settlement_rules_tenant_id (tenant_id),
    INDEX idx_erp_settlement_rules_business_type (business_type),
    INDEX idx_erp_settlement_rules_settlement_type (settlement_type),
    INDEX idx_erp_settlement_rules_is_active (is_active),
    INDEX idx_erp_settlement_rules_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='정산 규칙 테이블';

-- erp_settlements 테이블 생성 (정산 결과)
CREATE TABLE IF NOT EXISTS erp_settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    settlement_number VARCHAR(50) UNIQUE NOT NULL COMMENT '정산 번호',
    settlement_period VARCHAR(10) NOT NULL COMMENT '정산 기간 (YYYYMM)',
    total_revenue DECIMAL(15, 2) NOT NULL COMMENT '총 매출',
    commission_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '수수료',
    royalty_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '로열티',
    net_settlement_amount DECIMAL(15, 2) NOT NULL COMMENT '순 정산 금액',
    status VARCHAR(20) DEFAULT 'PENDING' COMMENT '상태: PENDING, APPROVED, PAID',
    approved_by BIGINT COMMENT '승인자',
    approved_at TIMESTAMP COMMENT '승인 시간',
    paid_at TIMESTAMP COMMENT '지급 시간',
    
    -- 감사 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by BIGINT COMMENT '생성자 ID',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by BIGINT COMMENT '수정자 ID',
    
    -- 소프트 삭제
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP NULL,
    deleted_by BIGINT COMMENT '삭제자 ID',
    
    UNIQUE KEY uk_erp_settlements_number (settlement_number),
    INDEX idx_erp_settlements_tenant_id (tenant_id),
    INDEX idx_erp_settlements_settlement_number (settlement_number),
    INDEX idx_erp_settlements_settlement_period (settlement_period),
    INDEX idx_erp_settlements_status (status),
    INDEX idx_erp_settlements_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='정산 결과 테이블';


-- ============================================
-- 학원 정산 시스템 테이블 생성
-- ============================================
-- 목적: 학원 시스템의 수강료/강사/본사 정산 관리
-- 작성일: 2025-11-24
-- ============================================

-- ============================================
-- 1. academy_settlements 테이블 (정산 결과)
-- ============================================
CREATE TABLE IF NOT EXISTS academy_settlements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    settlement_id VARCHAR(36) UNIQUE NOT NULL COMMENT '정산 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT COMMENT '지점 ID (레거시 호환용, NULL 허용, 새로운 코드에서는 사용 금지 - 표준화 2025-12-05)',
    
    -- 정산 기간
    settlement_period VARCHAR(10) NOT NULL COMMENT '정산 기간 (YYYYMM)',
    settlement_date DATE NOT NULL COMMENT '정산일',
    period_start DATE NOT NULL COMMENT '기간 시작일',
    period_end DATE NOT NULL COMMENT '기간 종료일',
    
    -- 매출 정보
    total_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '총 매출 (수강료 수입)',
    total_payments DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '총 결제 금액',
    refund_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '환불 금액',
    net_revenue DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '순 매출',
    
    -- 정산 정보
    teacher_settlement DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '강사 정산 금액',
    hq_royalty DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '본사 로열티',
    commission_rate DECIMAL(5, 2) DEFAULT 0 COMMENT '수수료율 (%)',
    royalty_rate DECIMAL(5, 2) DEFAULT 0 COMMENT '로열티율 (%)',
    
    -- 최종 정산 금액
    net_settlement DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '순 정산 금액 (순 매출 - 강사 정산 - 본사 로열티)',
    
    -- 상태 정보
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '상태: DRAFT, CALCULATED, APPROVED, PAID, CANCELLED',
    calculated_at TIMESTAMP NULL COMMENT '계산 일시',
    approved_at TIMESTAMP NULL COMMENT '승인 일시',
    paid_at TIMESTAMP NULL COMMENT '지급 일시',
    approved_by VARCHAR(100) COMMENT '승인자',
    paid_by VARCHAR(100) COMMENT '지급 처리자',
    
    -- 메모
    notes TEXT COMMENT '비고',
    calculation_details_json JSON COMMENT '계산 상세 정보 (JSON)',
    
    -- 공통 필드 (BaseEntity)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_settlement_id (settlement_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),  -- 레거시 호환용 (표준화 2025-12-05)
    -- 브랜치 개념 제거: idx_tenant_branch 인덱스 제거됨 (표준화 2025-12-05)
    INDEX idx_settlement_period (settlement_period),
    INDEX idx_settlement_date (settlement_date),
    INDEX idx_status (status),
    INDEX idx_is_deleted (is_deleted),
    UNIQUE KEY uk_tenant_branch_period (tenant_id, branch_id, settlement_period),
    
    -- 외래키
    CONSTRAINT fk_academy_settlements_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_settlements_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_academy_settlements_status CHECK (status IN ('DRAFT', 'CALCULATED', 'APPROVED', 'PAID', 'CANCELLED')),
    CONSTRAINT chk_academy_settlements_period CHECK (settlement_period REGEXP '^[0-9]{6}$'),
    CONSTRAINT chk_academy_settlements_dates CHECK (period_end >= period_start)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학원 정산 결과 테이블';

-- ============================================
-- 2. academy_settlement_items 테이블 (정산 항목 상세)
-- ============================================
CREATE TABLE IF NOT EXISTS academy_settlement_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    settlement_item_id VARCHAR(36) UNIQUE NOT NULL COMMENT '정산 항목 UUID',
    settlement_id VARCHAR(36) NOT NULL COMMENT '정산 ID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT COMMENT '지점 ID (레거시 호환용, 새로운 코드에서는 사용 금지 - 표준화 2025-12-05)',
    
    -- 정산 대상
    item_type VARCHAR(50) NOT NULL COMMENT '항목 유형: TEACHER, CLASS, COURSE, ENROLLMENT',
    item_id VARCHAR(36) COMMENT '항목 ID (teacher_id, class_id, course_id, enrollment_id)',
    item_name VARCHAR(255) COMMENT '항목명',
    
    -- 정산 금액
    revenue_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '매출 금액',
    settlement_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '정산 금액',
    commission_rate DECIMAL(5, 2) DEFAULT 0 COMMENT '수수료율 (%)',
    commission_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '수수료 금액',
    
    -- 통계 정보
    enrollment_count INT DEFAULT 0 COMMENT '수강 등록 수',
    payment_count INT DEFAULT 0 COMMENT '결제 건수',
    total_sessions INT DEFAULT 0 COMMENT '총 수업 횟수',
    completed_sessions INT DEFAULT 0 COMMENT '완료된 수업 횟수',
    
    -- 상세 정보 (JSON)
    details_json JSON COMMENT '상세 정보 (JSON)',
    
    -- 공통 필드 (BaseEntity)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_settlement_item_id (settlement_item_id),
    INDEX idx_settlement_id (settlement_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),  -- 레거시 호환용 (표준화 2025-12-05)
    INDEX idx_item_type (item_type),
    INDEX idx_item_id (item_id),
    -- 브랜치 개념 제거: idx_tenant_branch 인덱스 제거됨 (표준화 2025-12-05)
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_academy_settlement_items_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_settlement_items_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_settlement_items_settlements 
    FOREIGN KEY (settlement_id) REFERENCES academy_settlements(settlement_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_academy_settlement_items_type CHECK (item_type IN ('TEACHER', 'CLASS', 'COURSE', 'ENROLLMENT'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학원 정산 항목 상세 테이블';


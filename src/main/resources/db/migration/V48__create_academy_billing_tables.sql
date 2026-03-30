-- ============================================
-- 학원 수강료 청구 시스템 테이블 생성
-- ============================================
-- 목적: 학원 시스템의 월별 수강료 청구 및 결제 관리
-- 작성일: 2025-11-24
-- ============================================

-- ============================================
-- 1. academy_billing_schedules 테이블 (청구 스케줄)
-- ============================================
CREATE TABLE IF NOT EXISTS academy_billing_schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    billing_schedule_id VARCHAR(36) UNIQUE NOT NULL COMMENT '청구 스케줄 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT COMMENT '지점 ID (레거시 호환용, NULL 허용, 새로운 코드에서는 사용 금지 - 표준화 2025-12-05)',
    
    -- 청구 스케줄 정보
    name VARCHAR(255) NOT NULL COMMENT '청구 스케줄명',
    description TEXT COMMENT '설명',
    
    -- 청구 주기 설정
    billing_cycle VARCHAR(20) NOT NULL DEFAULT 'MONTHLY' COMMENT '청구 주기: MONTHLY, WEEKLY, CUSTOM',
    day_of_month INT COMMENT '월 중 청구일 (1-31)',
    day_of_week INT COMMENT '주 중 청구일 (0=일요일, 1=월요일, ..., 6=토요일)',
    billing_date_offset INT DEFAULT 0 COMMENT '청구일 오프셋 (일)',
    
    -- 청구 대상 필터
    target_filters_json JSON COMMENT '청구 대상 필터 (JSON): classId, courseId, enrollmentStatus 등',
    
    -- 청구 금액 설정
    billing_method VARCHAR(50) DEFAULT 'TUITION_AMOUNT' COMMENT '청구 방법: TUITION_AMOUNT, FIXED, CALCULATED',
    fixed_amount DECIMAL(15, 2) COMMENT '고정 금액 (billing_method가 FIXED인 경우)',
    calculation_rule_json JSON COMMENT '계산 규칙 (JSON)',
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    last_billing_date DATE COMMENT '마지막 청구일',
    next_billing_date DATE COMMENT '다음 청구일',
    
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
    INDEX idx_billing_schedule_id (billing_schedule_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),  -- 레거시 호환용 (표준화 2025-12-05)
    -- 브랜치 개념 제거: idx_tenant_branch 인덱스 제거됨 (표준화 2025-12-05)
    INDEX idx_billing_cycle (billing_cycle),
    INDEX idx_next_billing_date (next_billing_date),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_academy_billing_schedules_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_billing_schedules_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_billing_schedules_cycle CHECK (billing_cycle IN ('MONTHLY', 'WEEKLY', 'CUSTOM')),
    CONSTRAINT chk_billing_schedules_day_of_month CHECK (day_of_month IS NULL OR (day_of_month >= 1 AND day_of_month <= 31)),
    CONSTRAINT chk_billing_schedules_day_of_week CHECK (day_of_week IS NULL OR (day_of_week >= 0 AND day_of_week <= 6)),
    CONSTRAINT chk_billing_schedules_method CHECK (billing_method IN ('TUITION_AMOUNT', 'FIXED', 'CALCULATED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학원 청구 스케줄 테이블';

-- ============================================
-- 2. academy_invoices 테이블 (청구서)
-- ============================================
CREATE TABLE IF NOT EXISTS academy_invoices (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    invoice_id VARCHAR(36) UNIQUE NOT NULL COMMENT '청구서 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT NOT NULL COMMENT '지점 ID (레거시 호환용, 새로운 코드에서는 사용 금지 - 표준화 2025-12-05)',
    
    -- 청구 대상
    enrollment_id VARCHAR(36) COMMENT '수강 등록 ID',
    consumer_id BIGINT COMMENT '수강생 ID',
    billing_schedule_id VARCHAR(36) COMMENT '청구 스케줄 ID',
    
    -- 청구 정보
    invoice_number VARCHAR(50) NOT NULL COMMENT '청구서 번호',
    invoice_date DATE NOT NULL COMMENT '청구일',
    due_date DATE NOT NULL COMMENT '납기일',
    billing_period_start DATE COMMENT '청구 기간 시작일',
    billing_period_end DATE COMMENT '청구 기간 종료일',
    
    -- 금액 정보
    subtotal_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '소계 금액',
    discount_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '할인 금액',
    tax_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '세금',
    total_amount DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '총 금액',
    currency VARCHAR(10) DEFAULT 'KRW' COMMENT '통화',
    
    -- 청구 상세 (JSON)
    line_items_json JSON COMMENT '청구 항목 상세 (JSON)',
    notes TEXT COMMENT '비고',
    
    -- 상태 정보
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' COMMENT '상태: DRAFT, ISSUED, SENT, PAID, PARTIAL, OVERDUE, CANCELLED',
    issued_at TIMESTAMP NULL COMMENT '발행 일시',
    sent_at TIMESTAMP NULL COMMENT '발송 일시',
    paid_at TIMESTAMP NULL COMMENT '결제 완료 일시',
    
    -- 결제 정보
    paid_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '결제 완료 금액',
    payment_method VARCHAR(50) COMMENT '결제 수단',
    
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
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),  -- 레거시 호환용 (표준화 2025-12-05)
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_billing_schedule_id (billing_schedule_id),
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_invoice_date (invoice_date),
    INDEX idx_due_date (due_date),
    INDEX idx_status (status),
    -- 브랜치 개념 제거: idx_tenant_branch 인덱스 제거됨 (표준화 2025-12-05)
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_academy_invoices_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_invoices_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_invoices_enrollments 
    FOREIGN KEY (enrollment_id) REFERENCES class_enrollments(enrollment_id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_invoices_billing_schedules 
    FOREIGN KEY (billing_schedule_id) REFERENCES academy_billing_schedules(billing_schedule_id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_academy_invoices_status CHECK (status IN ('DRAFT', 'ISSUED', 'SENT', 'PAID', 'PARTIAL', 'OVERDUE', 'CANCELLED')),
    CONSTRAINT chk_academy_invoices_amounts CHECK (total_amount >= 0 AND subtotal_amount >= 0 AND discount_amount >= 0 AND tax_amount >= 0),
    CONSTRAINT chk_academy_invoices_dates CHECK (due_date >= invoice_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학원 청구서 테이블';

-- ============================================
-- 3. academy_tuition_payments 테이블 (수강료 결제)
-- ============================================
CREATE TABLE IF NOT EXISTS academy_tuition_payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(36) UNIQUE NOT NULL COMMENT '결제 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    branch_id BIGINT NOT NULL COMMENT '지점 ID (레거시 호환용, 새로운 코드에서는 사용 금지 - 표준화 2025-12-05)',
    
    -- 결제 대상
    invoice_id VARCHAR(36) NOT NULL COMMENT '청구서 ID',
    enrollment_id VARCHAR(36) COMMENT '수강 등록 ID',
    consumer_id BIGINT COMMENT '수강생 ID',
    
    -- 결제 정보
    amount DECIMAL(15, 2) NOT NULL COMMENT '결제 금액',
    currency VARCHAR(10) DEFAULT 'KRW' COMMENT '통화',
    payment_method VARCHAR(50) NOT NULL COMMENT '결제 수단: CARD, BANK_TRANSFER, CASH, ETC',
    
    -- PG 정보
    pg_provider VARCHAR(50) COMMENT 'PG 제공자: TOSS, STRIPE, OTHER',
    pg_transaction_id VARCHAR(100) COMMENT 'PG 거래 ID',
    pg_status VARCHAR(50) COMMENT 'PG 상태',
    
    -- 결제 상태
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, COMPLETED, FAILED, REFUNDED, CANCELLED',
    paid_at TIMESTAMP NULL COMMENT '결제 완료 일시',
    failed_at TIMESTAMP NULL COMMENT '결제 실패 일시',
    failure_reason TEXT COMMENT '실패 사유',
    
    -- 환불 정보
    refund_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '환불 금액',
    refunded_at TIMESTAMP NULL COMMENT '환불 일시',
    refund_reason TEXT COMMENT '환불 사유',
    
    -- 영수증 정보
    receipt_number VARCHAR(50) COMMENT '영수증 번호',
    receipt_issued_at TIMESTAMP NULL COMMENT '영수증 발급 일시',
    
    -- 메모
    notes TEXT COMMENT '비고',
    
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
    INDEX idx_payment_id (payment_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_branch_id (branch_id),  -- 레거시 호환용 (표준화 2025-12-05)
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_enrollment_id (enrollment_id),
    INDEX idx_consumer_id (consumer_id),
    INDEX idx_status (status),
    INDEX idx_paid_at (paid_at),
    -- 브랜치 개념 제거: idx_tenant_branch 인덱스 제거됨 (표준화 2025-12-05)
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_academy_tuition_payments_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_tuition_payments_branches 
    FOREIGN KEY (branch_id) REFERENCES branches(id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_tuition_payments_invoices 
    FOREIGN KEY (invoice_id) REFERENCES academy_invoices(invoice_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_academy_tuition_payments_enrollments 
    FOREIGN KEY (enrollment_id) REFERENCES class_enrollments(enrollment_id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_academy_tuition_payments_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED', 'CANCELLED')),
    CONSTRAINT chk_academy_tuition_payments_amount CHECK (amount > 0),
    CONSTRAINT chk_academy_tuition_payments_refund CHECK (refund_amount >= 0 AND refund_amount <= amount)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='학원 수강료 결제 테이블';


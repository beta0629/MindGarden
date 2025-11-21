-- ============================================
-- 결제 시스템 테이블 생성
-- ============================================
-- 목적: Phase 5 결제 시스템 구축을 위한 테이블 생성
-- 작성일: 2025-01-XX
-- ============================================

-- 1. ops_payment_method 테이블 (결제 수단 토큰 저장)
CREATE TABLE IF NOT EXISTS ops_payment_method (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_method_id VARCHAR(36) UNIQUE NOT NULL COMMENT '결제 수단 UUID',
    tenant_id VARCHAR(36) COMMENT '테넌트 ID (온보딩 중이면 NULL)',
    
    -- PG 토큰 정보 (암호화 저장)
    payment_method_token TEXT NOT NULL COMMENT 'PG에서 받은 토큰 (암호화)',
    pg_provider VARCHAR(50) NOT NULL COMMENT 'PG 제공자: TOSS, STRIPE, OTHER',
    
    -- 카드 정보 (마스킹 처리)
    card_brand VARCHAR(50) COMMENT '카드 브랜드: VISA, MASTERCARD, AMEX 등',
    card_last4 VARCHAR(4) COMMENT '카드 마지막 4자리',
    card_exp_month INT COMMENT '만료 월',
    card_exp_year INT COMMENT '만료 년도',
    cardholder_name VARCHAR(100) COMMENT '카드 소유자 이름',
    
    -- 상태 정보
    is_default BOOLEAN DEFAULT FALSE COMMENT '기본 결제 수단 여부',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    
    -- 인덱스
    INDEX idx_payment_method_id (payment_method_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_pg_provider (pg_provider),
    INDEX idx_is_default (is_default),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_ops_payment_method_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='결제 수단 토큰 테이블 (PCI DSS 준수)';

-- 2. ops_subscription_payment 테이블 (실제 결제 내역)
CREATE TABLE IF NOT EXISTS ops_subscription_payment (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    payment_id VARCHAR(36) UNIQUE NOT NULL COMMENT '결제 UUID',
    subscription_id VARCHAR(36) NOT NULL COMMENT '구독 ID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    
    -- 결제 정보
    amount DECIMAL(15, 2) NOT NULL COMMENT '결제 금액',
    currency VARCHAR(10) DEFAULT 'KRW' COMMENT '통화',
    payment_method_id VARCHAR(36) COMMENT '결제 수단 ID',
    
    -- PG 정보
    pg_transaction_id VARCHAR(100) COMMENT 'PG 거래 ID',
    pg_provider VARCHAR(50) COMMENT 'PG 제공자',
    pg_status VARCHAR(50) COMMENT 'PG 상태',
    
    -- 결제 상태
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, COMPLETED, FAILED, REFUNDED',
    paid_at TIMESTAMP NULL COMMENT '결제 완료 시각',
    failed_at TIMESTAMP NULL COMMENT '결제 실패 시각',
    failure_reason TEXT COMMENT '실패 사유',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_payment_id (payment_id),
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_payment_method_id (payment_method_id),
    INDEX idx_status (status),
    INDEX idx_paid_at (paid_at),
    
    -- 외래키
    CONSTRAINT fk_ops_subscription_payment_subscription 
    FOREIGN KEY (subscription_id) REFERENCES tenant_subscriptions(subscription_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_ops_subscription_payment_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_ops_subscription_payment_method 
    FOREIGN KEY (payment_method_id) REFERENCES ops_payment_method(payment_method_id) 
    ON DELETE SET NULL ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_subscription_payment_status CHECK (status IN ('PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='구독 결제 내역 테이블';

-- 3. tenant_subscriptions 테이블 상태 확장 (기존 테이블이 있으면 ALTER)
-- DRAFT, PENDING_ACTIVATION, TERMINATED 상태 추가

-- MySQL 버전에 따라 CHECK 제약조건 삭제 방법이 다름
-- MySQL 8.0.16 이상: DROP CHECK 사용
-- 그 이전 버전: 제약조건 이름을 찾아서 삭제

-- 먼저 컬럼 크기와 기본값 변경
ALTER TABLE tenant_subscriptions 
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' 
COMMENT '상태: DRAFT, PENDING_ACTIVATION, INACTIVE, ACTIVE, SUSPENDED, CANCELLED, TERMINATED';

-- 기존 제약조건 삭제 (MySQL 8.0.16 이상)
SET @sql = IF(
    (SELECT VERSION() >= '8.0.16'),
    'ALTER TABLE tenant_subscriptions DROP CHECK IF EXISTS chk_subscription_status',
    'SELECT "MySQL version < 8.0.16, skipping DROP CHECK" AS message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 제약조건 재생성
ALTER TABLE tenant_subscriptions 
ADD CONSTRAINT chk_subscription_status 
CHECK (status IN ('DRAFT', 'PENDING_ACTIVATION', 'INACTIVE', 'ACTIVE', 'SUSPENDED', 'CANCELLED', 'TERMINATED'));


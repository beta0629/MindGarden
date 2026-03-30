-- ============================================
-- Week 0.5 Day 3: 요금제 시스템 테이블 생성
-- ============================================
-- 목적: 온보딩 PL/SQL 프로시저가 사용하는 요금제 시스템 테이블 구축
-- 작성일: 2025-01-XX
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

-- 1. pricing_plans 테이블 (기본 요금제 정의)
CREATE TABLE IF NOT EXISTS pricing_plans (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id VARCHAR(36) UNIQUE NOT NULL COMMENT '요금제 UUID',
    plan_code VARCHAR(50) UNIQUE NOT NULL COMMENT '요금제 코드: STARTER, STANDARD, PREMIUM',
    name VARCHAR(255) NOT NULL COMMENT '요금제명',
    name_ko VARCHAR(255) COMMENT '요금제명 (한글)',
    name_en VARCHAR(255) COMMENT '요금제명 (영문)',
    
    -- 요금 정보
    base_fee DECIMAL(15, 2) NOT NULL DEFAULT 0 COMMENT '기본 요금',
    currency VARCHAR(10) DEFAULT 'KRW' COMMENT '통화',
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' COMMENT '청구 주기: MONTHLY, QUARTERLY, YEARLY',
    
    -- 한도 정보
    limits_json JSON COMMENT '한도 정보 (JSON)',
    features_json JSON COMMENT '포함 기능 목록',
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    description TEXT COMMENT '설명',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_plan_id (plan_id),
    INDEX idx_plan_code (plan_code),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order),
    INDEX idx_is_deleted (is_deleted),
    
    -- 제약조건
    CONSTRAINT chk_billing_cycle CHECK (billing_cycle IN ('MONTHLY', 'QUARTERLY', 'YEARLY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='요금제 정의 테이블';

-- 2. pricing_plan_features 테이블 (요금제별 기능/한도)
CREATE TABLE IF NOT EXISTS pricing_plan_features (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    plan_id VARCHAR(36) NOT NULL COMMENT '요금제 ID',
    feature_code VARCHAR(50) NOT NULL COMMENT '기능 코드',
    feature_name VARCHAR(255) NOT NULL COMMENT '기능명',
    feature_name_ko VARCHAR(255) COMMENT '기능명 (한글)',
    feature_name_en VARCHAR(255) COMMENT '기능명 (영문)',
    
    -- 기능 정보
    feature_level VARCHAR(50) COMMENT '기능 레벨: BASIC, STANDARD, PREMIUM, UNLIMITED',
    included_flag BOOLEAN DEFAULT TRUE COMMENT '포함 여부',
    limit_value BIGINT COMMENT '한도 값 (NULL이면 무제한)',
    limit_unit VARCHAR(50) COMMENT '한도 단위',
    notes TEXT COMMENT '비고',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_plan_id (plan_id),
    INDEX idx_feature_code (feature_code),
    INDEX idx_included_flag (included_flag),
    UNIQUE KEY uk_plan_feature (plan_id, feature_code),
    
    -- 외래키
    CONSTRAINT fk_pricing_plan_features_pricing_plans 
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(plan_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='요금제별 기능/한도 테이블';

-- 3. tenant_subscriptions 테이블 (테넌트별 활성 요금제)
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    subscription_id VARCHAR(36) UNIQUE NOT NULL COMMENT '구독 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    plan_id VARCHAR(36) NOT NULL COMMENT '요금제 ID',
    
    -- 구독 정보
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE' COMMENT '상태: INACTIVE, ACTIVE, SUSPENDED, CANCELLED',
    effective_from DATE NOT NULL COMMENT '유효 시작일',
    effective_to DATE COMMENT '유효 종료일',
    billing_cycle VARCHAR(20) DEFAULT 'MONTHLY' COMMENT '청구 주기',
    
    -- 결제 정보
    payment_method VARCHAR(50) COMMENT '결제 수단',
    auto_renewal BOOLEAN DEFAULT TRUE COMMENT '자동 갱신 여부',
    next_billing_date DATE COMMENT '다음 청구일',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    
    -- 인덱스
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_plan_id (plan_id),
    INDEX idx_status (status),
    INDEX idx_effective_dates (effective_from, effective_to),
    INDEX idx_next_billing (next_billing_date),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_tenant_subscriptions_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_tenant_subscriptions_pricing_plans 
    FOREIGN KEY (plan_id) REFERENCES pricing_plans(plan_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_subscription_status CHECK (status IN ('INACTIVE', 'ACTIVE', 'SUSPENDED', 'CANCELLED')),
    CONSTRAINT chk_subscription_billing_cycle CHECK (billing_cycle IN ('MONTHLY', 'QUARTERLY', 'YEARLY'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 구독 테이블';


-- ============================================
-- Week 0 Day 1: Tenant 테이블 생성
-- ============================================
-- 목적: 멀티테넌시의 최상위 엔티티 생성
-- 작성일: 2025-01-XX
-- ============================================

-- tenants 테이블 생성
CREATE TABLE IF NOT EXISTS tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '테넌트 내부 ID',
    tenant_id VARCHAR(36) UNIQUE NOT NULL COMMENT '테넌트 UUID (고유 식별자)',
    name VARCHAR(255) NOT NULL COMMENT '테넌트명',
    business_type VARCHAR(50) NOT NULL COMMENT '업종: CONSULTATION, ACADEMY, FOOD_SERVICE, RETAIL, SERVICE',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' COMMENT '상태: PENDING, ACTIVE, SUSPENDED, CLOSED',
    
    -- 구독 정보
    subscription_plan_id BIGINT NULL COMMENT '구독 요금제 ID',
    subscription_status VARCHAR(20) DEFAULT 'INACTIVE' COMMENT '구독 상태: INACTIVE, ACTIVE, SUSPENDED, CANCELLED',
    subscription_start_date DATE NULL COMMENT '구독 시작일',
    subscription_end_date DATE NULL COMMENT '구독 종료일',
    
    -- 연락처 정보
    contact_email VARCHAR(100) NULL COMMENT '연락 이메일',
    contact_phone VARCHAR(20) NULL COMMENT '연락 전화번호',
    contact_person VARCHAR(100) NULL COMMENT '담당자명',
    
    -- 주소 정보
    postal_code VARCHAR(10) NULL COMMENT '우편번호',
    address VARCHAR(255) NULL COMMENT '주소',
    address_detail VARCHAR(255) NULL COMMENT '상세 주소',
    
    -- 설정 정보
    settings_json JSON NULL COMMENT '테넌트별 설정 (JSON)',
    branding_json JSON NULL COMMENT '브랜딩 정보 (로고, 색상 등)',
    
    -- 메타데이터 (BaseEntity 필드)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '생성일시',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '수정일시',
    deleted_at TIMESTAMP NULL COMMENT '삭제일시 (소프트 삭제)',
    is_deleted BOOLEAN DEFAULT FALSE COMMENT '삭제 여부',
    version BIGINT DEFAULT 0 COMMENT '낙관적 잠금 버전',
    lang_code VARCHAR(10) DEFAULT 'ko' COMMENT '언어 코드',
    created_by VARCHAR(100) NULL COMMENT '생성자',
    updated_by VARCHAR(100) NULL COMMENT '수정자',
    
    -- 인덱스
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_business_type (business_type),
    INDEX idx_status (status),
    INDEX idx_subscription_plan (subscription_plan_id),
    INDEX idx_created_at (created_at),
    INDEX idx_is_deleted (is_deleted),
    INDEX idx_tenant_status (tenant_id, status),
    
    -- 제약조건
    CONSTRAINT chk_tenant_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'CLOSED')),
    CONSTRAINT chk_business_type CHECK (business_type IN ('CONSULTATION', 'ACADEMY', 'FOOD_SERVICE', 'RETAIL', 'SERVICE'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트(사업장) 정보 테이블 - 멀티테넌시 최상위 엔티티';


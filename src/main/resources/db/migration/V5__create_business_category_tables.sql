-- ============================================
-- Week 0.5 Day 1: 카테고리 시스템 테이블 생성
-- ============================================
-- 목적: 온보딩 PL/SQL 프로시저가 사용하는 카테고리 시스템 테이블 구축
-- 작성일: 2025-01-XX
-- ============================================

-- 1. business_categories 테이블 (대분류)
CREATE TABLE IF NOT EXISTS business_categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    category_id VARCHAR(36) UNIQUE NOT NULL COMMENT '카테고리 UUID',
    category_code VARCHAR(50) UNIQUE NOT NULL COMMENT '카테고리 코드',
    name_ko VARCHAR(255) NOT NULL COMMENT '카테고리명 (한글)',
    name_en VARCHAR(255) COMMENT '카테고리명 (영문)',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    icon_url VARCHAR(500) COMMENT '아이콘 URL',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 확장 필드 (다단계 계층 지원)
    parent_category_id VARCHAR(36) NULL COMMENT '상위 카테고리 (다단계 계층 지원)',
    level INT DEFAULT 1 COMMENT '계층 레벨 (1=대분류, 2=중분류, 3=소분류)',
    metadata_json JSON COMMENT '카테고리별 메타데이터 (컴포넌트 매핑, 요금제 추천 등)',
    settings_json JSON COMMENT '카테고리별 설정 (온보딩 플로우, 권한 템플릿 등)',
    
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
    INDEX idx_category_id (category_id),
    INDEX idx_category_code (category_code),
    INDEX idx_parent_category_id (parent_category_id),
    INDEX idx_level (level),
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_business_categories_parent 
    FOREIGN KEY (parent_category_id) REFERENCES business_categories(category_id) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='업종 대분류 카테고리 테이블';

-- 2. business_category_items 테이블 (소분류)
CREATE TABLE IF NOT EXISTS business_category_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    item_id VARCHAR(36) UNIQUE NOT NULL COMMENT '카테고리 아이템 UUID',
    category_id VARCHAR(36) NOT NULL COMMENT '대분류 카테고리 ID',
    item_code VARCHAR(50) UNIQUE NOT NULL COMMENT '아이템 코드',
    name_ko VARCHAR(255) NOT NULL COMMENT '아이템명 (한글)',
    name_en VARCHAR(255) COMMENT '아이템명 (영문)',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    business_type VARCHAR(50) NOT NULL COMMENT 'business_type 코드 (tenants.business_type과 매핑)',
    icon_url VARCHAR(500) COMMENT '아이콘 URL',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    
    -- 확장 필드 (자동 설정)
    default_components_json JSON COMMENT '기본 컴포넌트 목록 (자동 활성화)',
    recommended_plan_ids_json JSON COMMENT '추천 요금제 ID 목록',
    default_role_template_ids_json JSON COMMENT '기본 역할 템플릿 ID 목록',
    onboarding_flow_json JSON COMMENT '온보딩 플로우 설정',
    feature_flags_json JSON COMMENT '카테고리별 Feature Flag 기본값',
    metadata_json JSON COMMENT '추가 메타데이터 (통계, 분석 등)',
    
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
    INDEX idx_item_id (item_id),
    INDEX idx_category_id (category_id),
    INDEX idx_item_code (item_code),
    INDEX idx_business_type (business_type),
    INDEX idx_display_order (display_order),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_business_category_items_category 
    FOREIGN KEY (category_id) REFERENCES business_categories(category_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='업종 소분류 카테고리 아이템 테이블';

-- 3. tenant_category_mappings 테이블 (테넌트-카테고리 매핑)
CREATE TABLE IF NOT EXISTS tenant_category_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 UUID',
    category_item_id VARCHAR(36) NOT NULL COMMENT '카테고리 아이템 ID',
    is_primary BOOLEAN DEFAULT FALSE COMMENT '주 카테고리 여부 (테넌트는 여러 카테고리를 가질 수 있음)',
    
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
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_category_item_id (category_item_id),
    INDEX idx_is_primary (is_primary),
    INDEX idx_tenant_category (tenant_id, category_item_id),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_tenant_category_mappings_tenant 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_tenant_category_mappings_category_item 
    FOREIGN KEY (category_item_id) REFERENCES business_category_items(item_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 유니크 제약조건 (테넌트-카테고리 조합은 중복 불가)
    UNIQUE KEY uk_tenant_category (tenant_id, category_item_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트-카테고리 매핑 테이블 (다대다 관계)';


-- ============================================
-- Week 0.5 Day 2: 컴포넌트 카탈로그 시스템 테이블 생성
-- ============================================
-- 목적: 온보딩 PL/SQL 프로시저가 사용하는 컴포넌트 카탈로그 시스템 테이블 구축
-- 작성일: 2025-01-XX
-- ============================================

-- 1. component_catalog 테이블 (컴포넌트 메타데이터)
CREATE TABLE IF NOT EXISTS component_catalog (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component_id VARCHAR(36) UNIQUE NOT NULL COMMENT '컴포넌트 UUID',
    component_code VARCHAR(50) UNIQUE NOT NULL COMMENT '컴포넌트 코드',
    name VARCHAR(255) NOT NULL COMMENT '컴포넌트명',
    name_ko VARCHAR(255) COMMENT '컴포넌트명 (한글)',
    name_en VARCHAR(255) COMMENT '컴포넌트명 (영문)',
    
    -- 분류 정보
    category VARCHAR(50) NOT NULL COMMENT '카테고리: CORE, ADDON, INTEGRATION 등',
    description TEXT COMMENT '설명',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    
    -- 상태 정보
    is_core BOOLEAN DEFAULT FALSE COMMENT '핵심 컴포넌트 여부',
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    component_version VARCHAR(20) COMMENT '컴포넌트 버전',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    
    -- 리소스 정보
    icon_url VARCHAR(500) COMMENT '아이콘 URL',
    documentation_url VARCHAR(500) COMMENT '문서 URL',
    screenshot_urls JSON COMMENT '스크린샷 URL 목록',
    
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
    INDEX idx_component_id (component_id),
    INDEX idx_component_code (component_code),
    INDEX idx_category (category),
    INDEX idx_is_core (is_core),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 카탈로그 테이블';

-- 2. component_features 테이블 (컴포넌트 기능 정의)
CREATE TABLE IF NOT EXISTS component_features (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    feature_code VARCHAR(50) NOT NULL COMMENT '기능 코드',
    feature_name VARCHAR(255) NOT NULL COMMENT '기능명',
    feature_name_ko VARCHAR(255) COMMENT '기능명 (한글)',
    feature_name_en VARCHAR(255) COMMENT '기능명 (영문)',
    
    -- 의존성 정보
    dependency_json JSON COMMENT '의존성 정보 (JSON)',
    required_components_json JSON COMMENT '필수 컴포넌트 목록',
    conflicts_with_json JSON COMMENT '충돌 컴포넌트 목록',
    
    -- 설명
    notes TEXT COMMENT '비고',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_component_id (component_id),
    INDEX idx_feature_code (feature_code),
    UNIQUE KEY uk_component_feature (component_id, feature_code),
    
    -- 외래키
    CONSTRAINT fk_component_features_component_catalog 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 기능 정의 테이블';

-- 3. component_pricing 테이블 (컴포넌트 과금 정책)
CREATE TABLE IF NOT EXISTS component_pricing (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    pricing_type VARCHAR(50) NOT NULL COMMENT '과금 유형: FIXED, USAGE, TIERED 등',
    fee_amount DECIMAL(15, 2) DEFAULT 0 COMMENT '기본 요금',
    currency VARCHAR(10) DEFAULT 'KRW' COMMENT '통화',
    usage_unit VARCHAR(50) COMMENT '사용량 단위 (API_CALL, USER_COUNT, STORAGE_GB 등)',
    usage_limit INT COMMENT '사용량 한도',
    overage_rate DECIMAL(15, 2) COMMENT '초과 사용 요금률',
    is_included_in_plan BOOLEAN DEFAULT FALSE COMMENT '요금제에 기본 포함 여부',
    pricing_plan_ids_json JSON COMMENT '적용 가능한 요금제 ID 목록',
    metadata_json JSON COMMENT '추가 메타데이터',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_component_id (component_id),
    INDEX idx_pricing_type (pricing_type),
    INDEX idx_is_included_in_plan (is_included_in_plan),
    
    -- 외래키
    CONSTRAINT fk_component_pricing_component_catalog 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 과금 정책 테이블';

-- 4. component_dependency 테이블 (컴포넌트 의존성)
CREATE TABLE IF NOT EXISTS component_dependency (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    required_component_id VARCHAR(36) NOT NULL COMMENT '필수 컴포넌트 ID',
    dependency_type VARCHAR(50) NOT NULL DEFAULT 'REQUIRED' COMMENT '의존성 유형: REQUIRED, OPTIONAL, RECOMMENDED',
    is_optional BOOLEAN DEFAULT FALSE COMMENT '선택적 의존성 여부',
    notes TEXT COMMENT '비고',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_component_id (component_id),
    INDEX idx_required_component_id (required_component_id),
    INDEX idx_dependency_type (dependency_type),
    UNIQUE KEY uk_component_dependency (component_id, required_component_id),
    
    -- 외래키
    CONSTRAINT fk_component_dependency_component 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE CASCADE ON UPDATE CASCADE,
    
    CONSTRAINT fk_component_dependency_required_component 
    FOREIGN KEY (required_component_id) REFERENCES component_catalog(component_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='컴포넌트 의존성 테이블';

-- 5. tenant_components 테이블 (테넌트별 활성화된 컴포넌트)
CREATE TABLE IF NOT EXISTS tenant_components (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_component_id VARCHAR(36) UNIQUE NOT NULL COMMENT '테넌트 컴포넌트 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    component_id VARCHAR(36) NOT NULL COMMENT '컴포넌트 ID',
    subscription_id BIGINT COMMENT '구독 ID',
    
    -- 상태 정보
    status VARCHAR(20) NOT NULL DEFAULT 'INACTIVE' COMMENT '상태: INACTIVE, ACTIVE, SUSPENDED',
    activated_at TIMESTAMP NULL COMMENT '활성화 일시',
    deactivated_at TIMESTAMP NULL COMMENT '비활성화 일시',
    activated_by VARCHAR(100) COMMENT '활성화한 사용자',
    deactivated_by VARCHAR(100) COMMENT '비활성화한 사용자',
    
    -- 설정 정보
    feature_flags_json JSON COMMENT 'Feature Flag 설정',
    settings_json JSON COMMENT '컴포넌트별 설정',
    
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
    INDEX idx_tenant_component_id (tenant_component_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_component_id (component_id),
    INDEX idx_tenant_component (tenant_id, component_id),
    INDEX idx_status (status),
    INDEX idx_subscription_id (subscription_id),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_tenant_components_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_tenant_components_component_catalog 
    FOREIGN KEY (component_id) REFERENCES component_catalog(component_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- 제약조건
    CONSTRAINT chk_tenant_component_status CHECK (status IN ('INACTIVE', 'ACTIVE', 'SUSPENDED'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트별 활성화된 컴포넌트 테이블';


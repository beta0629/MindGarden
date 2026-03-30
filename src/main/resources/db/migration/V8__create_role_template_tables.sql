-- ============================================
-- Week 0.5 Day 4: 역할 템플릿 시스템 테이블 생성
-- ============================================
-- 목적: 온보딩 PL/SQL 프로시저가 사용하는 역할 템플릿 시스템 테이블 구축
-- 작성일: 2025-01-XX
-- 주의: 개발 서버 DB에 직접 적용
-- ============================================

-- 1. role_templates 테이블 (업종별 기본 역할 템플릿)
CREATE TABLE IF NOT EXISTS role_templates (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_template_id VARCHAR(36) UNIQUE NOT NULL COMMENT '역할 템플릿 UUID',
    template_code VARCHAR(50) UNIQUE NOT NULL COMMENT '템플릿 코드',
    name VARCHAR(255) NOT NULL COMMENT '템플릿명',
    name_ko VARCHAR(255) COMMENT '템플릿명 (한글)',
    name_en VARCHAR(255) COMMENT '템플릿명 (영문)',
    business_type VARCHAR(50) COMMENT '업종 (ACADEMY, CONSULTATION 등)',
    description TEXT COMMENT '설명',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    is_system_template BOOLEAN DEFAULT FALSE COMMENT '시스템 템플릿 여부 (HQ가 정의한 필수 템플릿)',
    
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
    INDEX idx_role_template_id (role_template_id),
    INDEX idx_template_code (template_code),
    INDEX idx_business_type (business_type),
    INDEX idx_is_active (is_active),
    INDEX idx_display_order (display_order),
    INDEX idx_is_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='업종별 기본 역할 템플릿 테이블';

-- 2. role_template_permissions 테이블 (템플릿 권한 목록)
CREATE TABLE IF NOT EXISTS role_template_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_template_id VARCHAR(36) NOT NULL COMMENT '역할 템플릿 ID',
    permission_code VARCHAR(100) NOT NULL COMMENT '권한 코드',
    scope VARCHAR(50) COMMENT '권한 범위: SELF, BRANCH, TENANT, ALL',
    default_flag BOOLEAN DEFAULT TRUE COMMENT '기본 권한 여부',
    notes TEXT COMMENT '비고',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_role_template_id (role_template_id),
    INDEX idx_permission_code (permission_code),
    INDEX idx_scope (scope),
    UNIQUE KEY uk_template_permission (role_template_id, permission_code),
    
    -- 외래키
    CONSTRAINT fk_role_template_permissions_role_templates 
    FOREIGN KEY (role_template_id) REFERENCES role_templates(role_template_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='템플릿 권한 목록 테이블';

-- 3. role_template_mappings 테이블 (업종별 템플릿 매핑)
CREATE TABLE IF NOT EXISTS role_template_mappings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    role_template_id VARCHAR(36) NOT NULL COMMENT '역할 템플릿 ID',
    business_type VARCHAR(50) NOT NULL COMMENT '업종 코드',
    priority INT DEFAULT 0 COMMENT '우선순위 (낮을수록 높음)',
    is_default BOOLEAN DEFAULT FALSE COMMENT '기본 템플릿 여부',
    notes TEXT COMMENT '비고',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_role_template_id (role_template_id),
    INDEX idx_business_type (business_type),
    INDEX idx_priority (priority),
    INDEX idx_is_default (is_default),
    UNIQUE KEY uk_template_business_type (role_template_id, business_type),
    
    -- 외래키
    CONSTRAINT fk_role_template_mappings_role_templates 
    FOREIGN KEY (role_template_id) REFERENCES role_templates(role_template_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='업종별 템플릿 자동 매핑 테이블';

-- 4. tenant_roles 테이블 (테넌트 커스텀 역할)
CREATE TABLE IF NOT EXISTS tenant_roles (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_role_id VARCHAR(36) UNIQUE NOT NULL COMMENT '테넌트 역할 UUID',
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    role_template_id VARCHAR(36) COMMENT '역할 템플릿 ID (템플릿 기반 복제 시)',
    name VARCHAR(255) NOT NULL COMMENT '역할명',
    name_ko VARCHAR(255) COMMENT '역할명 (한글)',
    name_en VARCHAR(255) COMMENT '역할명 (영문)',
    description TEXT COMMENT '설명',
    description_ko TEXT COMMENT '설명 (한글)',
    description_en TEXT COMMENT '설명 (영문)',
    
    -- 상태 정보
    is_active BOOLEAN DEFAULT TRUE COMMENT '활성화 여부',
    display_order INT DEFAULT 0 COMMENT '표시 순서',
    
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
    INDEX idx_tenant_role_id (tenant_role_id),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_role_template_id (role_template_id),
    INDEX idx_tenant_role (tenant_id, tenant_role_id),
    INDEX idx_is_active (is_active),
    INDEX idx_is_deleted (is_deleted),
    
    -- 외래키
    CONSTRAINT fk_tenant_roles_tenants 
    FOREIGN KEY (tenant_id) REFERENCES tenants(tenant_id) 
    ON DELETE RESTRICT ON UPDATE CASCADE,
    
    CONSTRAINT fk_tenant_roles_role_templates 
    FOREIGN KEY (role_template_id) REFERENCES role_templates(role_template_id) 
    ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 커스텀 역할 테이블';

-- 5. role_permissions 테이블 (테넌트 역할 권한)
CREATE TABLE IF NOT EXISTS role_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '테넌트 역할 ID',
    permission_code VARCHAR(100) NOT NULL COMMENT '권한 코드',
    policy_json JSON COMMENT 'ABAC 정책 (JSON) - branch_id, tenant_id 등 조건 포함',
    scope VARCHAR(50) COMMENT '권한 범위: SELF, BRANCH, TENANT, ALL',
    granted_by VARCHAR(100) COMMENT '권한 부여한 사용자',
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '권한 부여 일시',
    notes TEXT COMMENT '비고',
    
    -- 공통 필드
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- 인덱스
    INDEX idx_tenant_role_id (tenant_role_id),
    INDEX idx_permission_code (permission_code),
    INDEX idx_scope (scope),
    INDEX idx_granted_by (granted_by),
    UNIQUE KEY uk_role_permission (tenant_role_id, permission_code),
    
    -- 외래키
    CONSTRAINT fk_role_permissions_tenant_roles 
    FOREIGN KEY (tenant_role_id) REFERENCES tenant_roles(tenant_role_id) 
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='테넌트 역할 권한 테이블';


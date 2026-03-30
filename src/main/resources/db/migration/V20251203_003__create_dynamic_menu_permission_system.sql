-- ========================================
-- 동적 메뉴 권한 시스템 생성
-- 작성일: 2025-12-03
-- 목적: 관리자가 역할별로 메뉴 접근 권한을 동적으로 설정
-- ========================================

-- ========================================
-- 1. menus 테이블 확장
-- ========================================

-- min_required_role 컬럼 추가 (기본 요구 역할)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'core_solution' 
       AND TABLE_NAME = 'menus' 
       AND COLUMN_NAME = 'min_required_role') = 0,
    'ALTER TABLE menus ADD COLUMN min_required_role VARCHAR(50) NOT NULL DEFAULT ''CLIENT'' COMMENT ''최소 요구 역할 (ADMIN, STAFF, CONSULTANT, CLIENT)''',
    'SELECT ''min_required_role column already exists'''
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- menu_location 컬럼 추가 (메뉴 위치)
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS 
     WHERE TABLE_SCHEMA = 'core_solution' 
       AND TABLE_NAME = 'menus' 
       AND COLUMN_NAME = 'menu_location') = 0,
    'ALTER TABLE menus ADD COLUMN menu_location VARCHAR(20) NOT NULL DEFAULT ''DASHBOARD'' COMMENT ''메뉴 위치 (DASHBOARD, ADMIN_ONLY, BOTH)''',
    'SELECT ''menu_location column already exists'''
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 인덱스는 테이블 생성 후 별도로 추가 (필요시)
-- 이미 존재할 수 있으므로 에러 발생 시 무시

-- 기존 데이터 업데이트
UPDATE menus SET 
    min_required_role = CASE 
        WHEN is_admin_only = true THEN 'ADMIN'
        WHEN required_role = 'ADMIN' THEN 'ADMIN'
        WHEN required_role = 'STAFF' THEN 'STAFF'
        WHEN required_role = 'CONSULTANT' THEN 'CONSULTANT'
        ELSE 'CLIENT'
    END,
    menu_location = CASE
        WHEN is_admin_only = true THEN 'ADMIN_ONLY'
        ELSE 'DASHBOARD'
    END
WHERE min_required_role = 'CLIENT' OR menu_location = 'DASHBOARD';

-- ========================================
-- 2. role_menu_permissions 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS role_menu_permissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 역할-메뉴 매핑
    tenant_id VARCHAR(36) NOT NULL COMMENT '테넌트 ID',
    tenant_role_id VARCHAR(36) NOT NULL COMMENT '역할 ID',
    menu_id BIGINT NOT NULL COMMENT '메뉴 ID',
    
    -- 권한 설정
    can_view BOOLEAN DEFAULT true COMMENT '조회 권한',
    can_create BOOLEAN DEFAULT false COMMENT '생성 권한',
    can_update BOOLEAN DEFAULT false COMMENT '수정 권한',
    can_delete BOOLEAN DEFAULT false COMMENT '삭제 권한',
    
    -- 상태
    is_active BOOLEAN DEFAULT true,
    
    -- 감사
    assigned_by VARCHAR(100) COMMENT '부여자',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tenant_role_menu (tenant_id, tenant_role_id, menu_id),
    INDEX idx_tenant (tenant_id),
    INDEX idx_role (tenant_role_id),
    INDEX idx_menu (menu_id),
    INDEX idx_active (is_active),
    
    FOREIGN KEY (menu_id) REFERENCES menus(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='역할별 메뉴 권한 테이블';

-- ========================================
-- 3. 기존 메뉴 데이터 업데이트
-- ========================================

-- DASHBOARD 메뉴 업데이트
UPDATE menus SET 
    min_required_role = 'CLIENT',
    menu_location = 'DASHBOARD'
WHERE menu_code = 'DASHBOARD';

-- ADMIN 전용 메뉴 업데이트
UPDATE menus SET 
    min_required_role = 'ADMIN',
    menu_location = 'ADMIN_ONLY'
WHERE is_admin_only = true OR menu_code LIKE '%ADMIN%';

-- COMMON_CODE_MGMT는 STAFF도 가능하도록 설정
UPDATE menus SET 
    min_required_role = 'STAFF',
    menu_location = 'ADMIN_ONLY'
WHERE menu_code = 'COMMON_CODE_MGMT';

-- ========================================
-- 4. 메뉴 권한 설정 메뉴 추가
-- ========================================

INSERT INTO menus (
    menu_code, 
    menu_name, 
    menu_name_en, 
    menu_path, 
    parent_menu_id,
    min_required_role,
    menu_location,
    required_role, 
    is_admin_only, 
    icon, 
    sort_order, 
    depth,
    description
) 
SELECT 
    'MENU_PERMISSION_MGMT',
    '메뉴 권한 설정',
    'Menu Permission',
    '/admin/menu-permissions',
    (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN') AS tmp),
    'ADMIN',
    'ADMIN_ONLY',
    'ADMIN',
    true,
    'key-fill',
    4,
    1,
    '역할별 메뉴 접근 권한 설정'
WHERE NOT EXISTS (
    SELECT 1 FROM menus WHERE menu_code = 'MENU_PERMISSION_MGMT'
);

-- ========================================
-- 완료
-- ========================================


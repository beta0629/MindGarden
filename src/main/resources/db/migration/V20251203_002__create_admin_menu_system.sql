-- ========================================
-- 관리자 전용 메뉴 시스템 생성
-- 작성일: 2025-12-03
-- 목적: ADMIN 전용 메뉴 구조 및 권한 관리
-- ========================================

-- ========================================
-- 1. menus 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS menus (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    -- 메뉴 정보
    menu_code VARCHAR(50) NOT NULL UNIQUE COMMENT '메뉴 코드',
    menu_name VARCHAR(100) NOT NULL COMMENT '메뉴명',
    menu_name_en VARCHAR(100) COMMENT '영문 메뉴명',
    menu_path VARCHAR(200) COMMENT '경로',
    
    -- 계층 구조
    parent_menu_id BIGINT COMMENT '부모 메뉴 ID',
    depth INT DEFAULT 0 COMMENT '깊이 (0=최상위)',
    
    -- 권한
    required_role VARCHAR(50) NOT NULL COMMENT '필요 역할 (ADMIN, STAFF, etc)',
    is_admin_only BOOLEAN DEFAULT false COMMENT '관리자 전용 여부',
    
    -- 메타데이터
    icon VARCHAR(50) COMMENT '아이콘',
    description TEXT COMMENT '설명',
    sort_order INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    
    -- 감사
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_parent (parent_menu_id),
    INDEX idx_role (required_role),
    INDEX idx_admin_only (is_admin_only),
    INDEX idx_active (is_active),
    
    FOREIGN KEY (parent_menu_id) REFERENCES menus(id) ON DELETE CASCADE
    
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='메뉴 관리 테이블';

-- ========================================
-- 2. 일반 대시보드 메뉴 (모든 역할)
-- ========================================

INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, required_role, is_admin_only, icon, sort_order, description) VALUES
('DASHBOARD', '대시보드', 'Dashboard', '/dashboard', 'USER', false, 'speedometer2', 1, '통합 대시보드');

-- ========================================
-- 3. 관리자 전용 메뉴 (ADMIN만!)
-- ========================================

-- 최상위: 시스템 관리
INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, required_role, is_admin_only, icon, sort_order, depth, description) VALUES
('SYSTEM_ADMIN', '시스템 관리', 'System Admin', '/admin', 'ADMIN', true, 'gear-fill', 100, 0, '관리자 전용 시스템 관리');

-- ========================================
-- 4. 공통코드 관리
-- ========================================

INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order, depth, description) VALUES
('COMMON_CODE_MGMT', '공통코드 관리', 'Common Code', '/admin/common-codes', 
 (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN') AS tmp), 
 'ADMIN', true, 'list-ul', 1, 1, '테넌트 공통코드 관리');

-- ========================================
-- 5. 사용자 관리
-- ========================================

-- 사용자 관리 (부모)
INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order, depth, description) VALUES
('USER_MGMT', '사용자 관리', 'User Management', '/admin/users', 
 (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN') AS tmp), 
 'ADMIN', true, 'people-fill', 2, 1, '사용자 및 권한 관리');

-- 사용자 목록
INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, required_role, is_admin_only, sort_order, depth, description) VALUES
('USER_LIST', '사용자 목록', 'User List', '/admin/users/list', 
 (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'USER_MGMT') AS tmp), 
 'ADMIN', true, 1, 2, '전체 사용자 목록');

-- 역할 관리
INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, required_role, is_admin_only, sort_order, depth, description) VALUES
('ROLE_MGMT', '역할 관리', 'Role Management', '/admin/users/roles', 
 (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'USER_MGMT') AS tmp), 
 'ADMIN', true, 2, 2, '역할 생성 및 관리');

-- 권한 설정
INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, required_role, is_admin_only, sort_order, depth, description) VALUES
('PERMISSION_MGMT', '권한 설정', 'Permission Settings', '/admin/users/permissions', 
 (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'USER_MGMT') AS tmp), 
 'ADMIN', true, 3, 2, '역할별 권한 설정');

-- ========================================
-- 6. 조직 관리
-- ========================================

INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order, depth, description) VALUES
('ORG_MGMT', '조직 관리', 'Organization', '/admin/organization', 
 (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN') AS tmp), 
 'ADMIN', true, 'building', 3, 1, '조직 정보 및 설정');

-- ========================================
-- 7. 요금제 관리
-- ========================================

INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order, depth, description) VALUES
('SUBSCRIPTION_MGMT', '요금제 관리', 'Subscription', '/admin/subscription', 
 (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN') AS tmp), 
 'ADMIN', true, 'credit-card-fill', 4, 1, '요금제 및 결제 관리');

-- ========================================
-- 8. 시스템 설정
-- ========================================

INSERT IGNORE INTO menus (menu_code, menu_name, menu_name_en, menu_path, parent_menu_id, required_role, is_admin_only, icon, sort_order, depth, description) VALUES
('SYSTEM_SETTINGS', '시스템 설정', 'System Settings', '/admin/settings', 
 (SELECT id FROM (SELECT id FROM menus WHERE menu_code = 'SYSTEM_ADMIN') AS tmp), 
 'ADMIN', true, 'sliders', 5, 1, '시스템 기본 설정');

-- ========================================
-- 완료
-- ========================================


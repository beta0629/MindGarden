-- 매핑 관리 권한 추가
-- 동적 권한 시스템을 위한 권한 코드 및 역할별 권한 매핑

-- 1. 권한 코드 추가 (permissions 테이블)
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at) VALUES
('MAPPING_MANAGE', '매핑 관리', '상담사-내담자 매핑을 관리할 수 있는 권한', 'ADMIN', true, NOW(), NOW()),
('MAPPING_DELETE', '매핑 삭제', '상담사-내담자 매핑을 삭제할 수 있는 권한', 'ADMIN', true, NOW(), NOW()),
('MAPPING_UPDATE', '매핑 수정', '상담사-내담자 매핑 정보를 수정할 수 있는 권한', 'ADMIN', true, NOW(), NOW()),
('MAPPING_VIEW', '매핑 조회', '상담사-내담자 매핑 정보를 조회할 수 있는 권한', 'ADMIN', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    permission_name = VALUES(permission_name),
    permission_description = VALUES(permission_description),
    updated_at = NOW();

-- 2. 역할별 권한 매핑 (role_permissions 테이블)

-- HQ_MASTER: 모든 매핑 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('HQ_MASTER', 'MAPPING_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_MASTER', 'MAPPING_DELETE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_MASTER', 'MAPPING_UPDATE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_MASTER', 'MAPPING_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- BRANCH_MANAGER: 모든 매핑 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('BRANCH_MANAGER', 'MAPPING_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_MANAGER', 'MAPPING_DELETE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_MANAGER', 'MAPPING_UPDATE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_MANAGER', 'MAPPING_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- ADMIN: 모든 매핑 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('ADMIN', 'MAPPING_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('ADMIN', 'MAPPING_DELETE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('ADMIN', 'MAPPING_UPDATE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('ADMIN', 'MAPPING_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- BRANCH_SUPER_ADMIN: 모든 매핑 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('BRANCH_SUPER_ADMIN', 'MAPPING_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MAPPING_DELETE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MAPPING_UPDATE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MAPPING_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- HQ_ADMIN: 조회 및 관리 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('HQ_ADMIN', 'MAPPING_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_ADMIN', 'MAPPING_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- SUPER_HQ_ADMIN: 조회 및 관리 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('SUPER_HQ_ADMIN', 'MAPPING_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MAPPING_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- BRANCH_ADMIN: 조회 및 관리 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('BRANCH_ADMIN', 'MAPPING_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_ADMIN', 'MAPPING_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- CONSULTANT: 조회 권한만
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('CONSULTANT', 'MAPPING_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- 완료 메시지
SELECT '매핑 관리 권한이 성공적으로 추가되었습니다.' AS message;


-- 메시지 관리 권한 추가
-- 2025-01-27 메시지 관리 기능 권한 추가

-- 1. 권한 코드 추가
INSERT INTO permissions (permission_code, permission_name, category, permission_description, is_active, created_at, updated_at) 
VALUES 
('MESSAGE_MANAGE', '메시지 관리', 'MESSAGE', '모든 메시지를 조회하고 관리할 수 있는 권한', true, NOW(), NOW()),
('MESSAGE_VIEW', '메시지 조회', 'MESSAGE', '메시지를 조회할 수 있는 권한', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    permission_name=VALUES(permission_name), 
    permission_description=VALUES(permission_description),
    is_active=VALUES(is_active),
    category=VALUES(category),
    updated_at=NOW();

-- 2. 역할별 권한 부여

-- ADMIN: 메시지 관리 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES 
('ADMIN', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('ADMIN', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- BRANCH_SUPER_ADMIN: 메시지 관리 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES 
('BRANCH_SUPER_ADMIN', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- HQ_ADMIN: 메시지 관리 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES 
('HQ_ADMIN', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_ADMIN', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- SUPER_HQ_ADMIN: 메시지 관리 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES 
('SUPER_HQ_ADMIN', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- HQ_MASTER: 메시지 관리 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES 
('HQ_MASTER', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_MASTER', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- CONSULTANT: 메시지 조회 권한만
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES 
('CONSULTANT', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- CLIENT: 메시지 조회 권한만
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES 
('CLIENT', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- 완료 메시지
SELECT 'MESSAGE_MANAGE 권한이 성공적으로 추가되었습니다.' AS message;

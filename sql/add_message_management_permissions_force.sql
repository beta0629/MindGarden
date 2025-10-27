-- 메시지 관리 권한 강제 추가 (운영 서버용)
-- 2025-01-27 메시지 관리 기능 권한 추가

-- 1. 기존 권한 삭제 (중복 방지)
DELETE FROM role_permissions WHERE permission_code IN ('MESSAGE_MANAGE', 'MESSAGE_VIEW');

-- 2. 권한 코드 추가
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

-- 3. 역할별 권한 강제 추가
INSERT IGNORE INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES 
('ADMIN', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('ADMIN', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_ADMIN', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_ADMIN', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('SUPER_HQ_ADMIN', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_MASTER', 'MESSAGE_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_MASTER', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('CONSULTANT', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('CLIENT', 'MESSAGE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW());

-- 완료 메시지
SELECT 'MESSAGE_MANAGE 권한이 성공적으로 추가되었습니다.' AS message;
SELECT role_name, permission_code, is_active FROM role_permissions WHERE permission_code IN ('MESSAGE_MANAGE', 'MESSAGE_VIEW') ORDER BY role_name, permission_code;

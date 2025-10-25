-- 시스템 공지 관리 권한 추가 및 역할별 권한 부여

-- 1. 권한 추가
INSERT INTO permissions (permission_code, permission_name, category, permission_description, is_active, created_at, updated_at)
VALUES ('SYSTEM_NOTIFICATION_MANAGE', '시스템 공지 관리', 'SYSTEM', '시스템 공지 작성, 수정, 삭제, 게시 권한', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    permission_name = '시스템 공지 관리',
    category = 'SYSTEM',
    permission_description = '시스템 공지 작성, 수정, 삭제, 게시 권한',
    is_active = true,
    updated_at = NOW();

-- 2. 역할별 권한 부여

-- ADMIN 역할에 권한 부여
INSERT INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at)
VALUES ('ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = true,
    updated_at = NOW();

-- BRANCH_ADMIN 역할에 권한 부여
INSERT INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at)
VALUES ('BRANCH_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = true,
    updated_at = NOW();

-- BRANCH_SUPER_ADMIN 역할에 권한 부여
INSERT INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at)
VALUES ('BRANCH_SUPER_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE 
    is_active = true,
    updated_at = NOW();

-- 확인 쿼리
SELECT '권한 추가 완료' as status;
SELECT role_name, permission_code, is_active 
FROM role_permissions 
WHERE permission_code = 'SYSTEM_NOTIFICATION_MANAGE';

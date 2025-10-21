-- 시스템 공지 관리 권한 추가
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at) VALUES
('SYSTEM_NOTIFICATION_MANAGE', '시스템 공지 관리', '시스템 공지를 생성, 수정, 삭제할 수 있는 권한', 'SYSTEM', true, NOW(), NOW()),
('SYSTEM_NOTIFICATION_VIEW', '시스템 공지 조회', '시스템 공지를 조회할 수 있는 권한', 'SYSTEM', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    permission_name = VALUES(permission_name),
    permission_description = VALUES(permission_description),
    updated_at = NOW();

-- 역할별 권한 매핑 (관리자 역할들)
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('ADMIN', 'SYSTEM_NOTIFICATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_ADMIN', 'SYSTEM_NOTIFICATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_MANAGER', 'SYSTEM_NOTIFICATION_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_MANAGER', 'SYSTEM_NOTIFICATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'SYSTEM_NOTIFICATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_ADMIN', 'SYSTEM_NOTIFICATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('SUPER_HQ_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('SUPER_HQ_ADMIN', 'SYSTEM_NOTIFICATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_MASTER', 'SYSTEM_NOTIFICATION_MANAGE', true, 'SYSTEM', NOW(), NOW(), NOW()),
('HQ_MASTER', 'SYSTEM_NOTIFICATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

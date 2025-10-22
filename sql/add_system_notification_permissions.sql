-- 시스템 공지 관리 권한 추가 SQL 스크립트

-- 1. 시스템 공지 관련 권한 추가
INSERT IGNORE INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at) VALUES
('SYSTEM_NOTIFICATION_MANAGE', '시스템 공지 관리', '시스템 공지를 생성, 수정, 삭제, 게시할 수 있는 권한', 'SYSTEM', true, NOW(), NOW()),
('SYSTEM_NOTIFICATION_VIEW', '시스템 공지 조회', '시스템 공지를 조회할 수 있는 권한', 'SYSTEM', true, NOW(), NOW());

-- 2. 관리자 역할에 시스템 공지 관리 권한 부여
INSERT IGNORE INTO role_permissions (role_name, permission_code, granted_by, is_active, created_at, updated_at) VALUES
-- BRANCH_SUPER_ADMIN
('BRANCH_SUPER_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', 'SYSTEM', true, NOW(), NOW()),
('BRANCH_SUPER_ADMIN', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW()),

-- BRANCH_ADMIN
('BRANCH_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', 'SYSTEM', true, NOW(), NOW()),
('BRANCH_ADMIN', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW()),

-- BRANCH_MANAGER
('BRANCH_MANAGER', 'SYSTEM_NOTIFICATION_MANAGE', 'SYSTEM', true, NOW(), NOW()),
('BRANCH_MANAGER', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW()),

-- HQ_ADMIN
('HQ_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', 'SYSTEM', true, NOW(), NOW()),
('HQ_ADMIN', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW()),

-- SUPER_HQ_ADMIN
('SUPER_HQ_ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', 'SYSTEM', true, NOW(), NOW()),
('SUPER_HQ_ADMIN', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW()),

-- HQ_MASTER
('HQ_MASTER', 'SYSTEM_NOTIFICATION_MANAGE', 'SYSTEM', true, NOW(), NOW()),
('HQ_MASTER', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW()),

-- ADMIN
('ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', 'SYSTEM', true, NOW(), NOW()),
('ADMIN', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW());

-- 3. 일반 사용자에게는 조회 권한만 부여
INSERT IGNORE INTO role_permissions (role_name, permission_code, granted_by, is_active, created_at, updated_at) VALUES
-- CONSULTANT
('CONSULTANT', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW()),

-- CLIENT
('CLIENT', 'SYSTEM_NOTIFICATION_VIEW', 'SYSTEM', true, NOW(), NOW());

-- 4. 권한 추가 완료 로그
SELECT '시스템 공지 관리 권한이 성공적으로 추가되었습니다.' as message;

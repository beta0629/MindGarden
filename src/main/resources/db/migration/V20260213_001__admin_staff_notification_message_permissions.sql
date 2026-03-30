-- ADMIN/STAFF에 시스템 공지·메시지 관리 권한 보강
-- 1. 역할 정리: ADMIN, STAFF, CONSULTANT, CLIENT가 아닌 역할의 role_permissions 행 삭제
-- 2. ADMIN에 SYSTEM_NOTIFICATION_MANAGE, MESSAGE_MANAGE, MESSAGE_VIEW 없으면 INSERT
-- 3. STAFF에 SYSTEM_NOTIFICATION_MANAGE, MESSAGE_MANAGE, MESSAGE_VIEW 없으면 INSERT
-- (CONSULTANT, CLIENT 권한은 삭제하지 않음)

-- 1. 역할 정리: 4개 표준 역할이 아닌 모든 행 삭제
DELETE FROM role_permissions
WHERE role_name NOT IN ('ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT');

-- 2. permissions 테이블에 권한 코드가 없으면 등록 (idempotent)
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at)
SELECT 'SYSTEM_NOTIFICATION_MANAGE', '시스템 공지 관리', '시스템 공지 관리 권한', 'SYSTEM', TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'SYSTEM_NOTIFICATION_MANAGE');

INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at)
SELECT 'MESSAGE_MANAGE', '메시지 관리', '메시지 관리 권한', 'SYSTEM', TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MESSAGE_MANAGE');

INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at)
SELECT 'MESSAGE_VIEW', '메시지 조회', '메시지 조회 권한', 'SYSTEM', TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM permissions WHERE permission_code = 'MESSAGE_VIEW');

-- 3. ADMIN 권한 보강 (없을 때만 INSERT)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'ADMIN', 'SYSTEM_NOTIFICATION_MANAGE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'ADMIN' AND permission_code = 'SYSTEM_NOTIFICATION_MANAGE');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'ADMIN', 'MESSAGE_MANAGE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'ADMIN' AND permission_code = 'MESSAGE_MANAGE');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'ADMIN', 'MESSAGE_VIEW', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'ADMIN' AND permission_code = 'MESSAGE_VIEW');

-- 4. STAFF 권한 보강 (없을 때만 INSERT)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'SYSTEM_NOTIFICATION_MANAGE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'SYSTEM_NOTIFICATION_MANAGE');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'MESSAGE_MANAGE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'MESSAGE_MANAGE');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'MESSAGE_VIEW', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'MESSAGE_VIEW');

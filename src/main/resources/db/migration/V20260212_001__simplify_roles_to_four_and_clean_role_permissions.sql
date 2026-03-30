-- 역할 단순화: ADMIN, STAFF, CONSULTANT, CLIENT 4개만 사용
-- 1. role_permissions에서 위 4개 역할이 아닌 행 삭제
-- 2. STAFF 역할에 대한 기본 권한 추가 (기존 V34에는 STAFF 없음)

-- 1. 기존 레거시 역할 권한 삭제 (BRANCH_*, HQ_*, TENANT_ADMIN, PRINCIPAL, OWNER 등)
DELETE FROM role_permissions
WHERE role_name NOT IN ('ADMIN', 'STAFF', 'CONSULTANT', 'CLIENT');

-- 2. STAFF 기본 권한 추가 (메뉴/API/프로필 - ERP 제외, 원장이 권한 그룹으로 추가 부여 가능)
INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'MENU_GROUP_COMMON', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'MENU_GROUP_COMMON');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'MENU_GROUP_ADMIN', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'MENU_GROUP_ADMIN');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'API_ACCESS_AUTH', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'API_ACCESS_AUTH');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'API_ACCESS_MENU', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'API_ACCESS_MENU');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'API_ACCESS_USER', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'API_ACCESS_USER');

INSERT INTO role_permissions (role_name, permission_code, tenant_role_id, granted_by, granted_at, is_active, created_at, updated_at)
SELECT 'STAFF', 'VIEW_OWN_PROFILE', NULL, 'SYSTEM', NOW(), TRUE, NOW(), NOW()
FROM (SELECT 1) t
WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_name = 'STAFF' AND permission_code = 'VIEW_OWN_PROFILE');

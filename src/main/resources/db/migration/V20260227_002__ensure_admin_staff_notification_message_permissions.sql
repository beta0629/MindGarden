-- ============================================
-- ADMIN/STAFF 시스템 공지·메시지 권한 보강 (idempotent)
-- ============================================
-- 목적: role_permissions에 ADMIN/STAFF의 SYSTEM_NOTIFICATION_MANAGE, MESSAGE_MANAGE, MESSAGE_VIEW
--       없으면 INSERT, 있으나 is_active=0이면 활성화. 권한 부족 시 공지 화면 "접근 권한이 없습니다" 해결.
-- 작성일: 2026-02-27
-- 표준: DATABASE_MIGRATION_STANDARD.md 준수
-- 참조: docs/debug/DEBUG_ADMIN_SYSTEM_NOTIFICATION_PERMISSION_20260227.md
-- ============================================

-- ============================================
-- 1. permissions 테이블에 권한 코드 없으면 등록 (idempotent)
-- ============================================
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

-- ============================================
-- 2. role_permissions: 기존 행이 is_active=0이면 활성화 (idempotent)
-- ============================================
UPDATE role_permissions
SET is_active = TRUE, updated_at = NOW()
WHERE role_name IN ('ADMIN', 'STAFF')
  AND permission_code IN ('SYSTEM_NOTIFICATION_MANAGE', 'MESSAGE_MANAGE', 'MESSAGE_VIEW')
  AND (is_active = 0 OR is_active = FALSE);

-- ============================================
-- 3. ADMIN 권한 없을 때만 INSERT (idempotent)
-- ============================================
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

-- ============================================
-- 4. STAFF 권한 없을 때만 INSERT (idempotent)
-- ============================================
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

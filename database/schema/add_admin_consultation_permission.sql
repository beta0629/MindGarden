-- 관리자 상담 이력 조회 권한 추가 (영구 유지)
INSERT INTO permissions (permission_code, permission_name, category, permission_description, is_active, created_at, updated_at) 
VALUES ('ADMIN_CONSULTATION_VIEW', '관리자 상담 이력 조회', 'CONSULTATION', '관리자 상담 이력을 조회할 수 있는 권한', true, NOW(), NOW()) 
ON DUPLICATE KEY UPDATE 
    permission_name=VALUES(permission_name), 
    permission_description=VALUES(permission_description),
    is_active=VALUES(is_active),
    category=VALUES(category),
    updated_at=NOW();

-- ADMIN 역할에 권한 부여 (영구 유지)
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES ('ADMIN', 'ADMIN_CONSULTATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- BRANCH_SUPER_ADMIN 역할에 권한 부여 (영구 유지)
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES ('BRANCH_SUPER_ADMIN', 'ADMIN_CONSULTATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- BRANCH_ADMIN 역할에도 권한 부여
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at)
VALUES ('BRANCH_ADMIN', 'ADMIN_CONSULTATION_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    granted_by = 'SYSTEM',
    granted_at = COALESCE(granted_at, NOW()),
    updated_at = NOW();

-- 완료 메시지
SELECT 'ADMIN_CONSULTATION_VIEW 권한이 성공적으로 추가되었습니다.' AS message;

-- 마음건강 가이드 권한 추가
-- 2025-10-21 마음건강 가이드 기능 추가

-- 1. 권한 코드 추가 (permissions 테이블)
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at) VALUES
('MINDFULNESS_GUIDE_VIEW', '마음건강 가이드 조회', '마음건강 가이드 페이지를 조회할 수 있는 권한', 'CLIENT', true, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    permission_name = VALUES(permission_name),
    permission_description = VALUES(permission_description),
    updated_at = NOW();

-- 2. 역할별 권한 매핑 (role_permissions 테이블)

-- CLIENT: 마음건강 가이드 조회 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('CLIENT', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- ROLE_CLIENT: 마음건강 가이드 조회 권한 (호환성을 위해)
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('ROLE_CLIENT', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- 관리자들도 마음건강 가이드를 볼 수 있도록 권한 부여 (선택사항)
-- BRANCH_SUPER_ADMIN: 마음건강 가이드 조회 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('BRANCH_SUPER_ADMIN', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- BRANCH_ADMIN: 마음건강 가이드 조회 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('BRANCH_ADMIN', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- BRANCH_MANAGER: 마음건강 가이드 조회 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('BRANCH_MANAGER', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- HQ_ADMIN: 마음건강 가이드 조회 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('HQ_ADMIN', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- SUPER_HQ_ADMIN: 마음건강 가이드 조회 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('SUPER_HQ_ADMIN', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- HQ_MASTER: 마음건강 가이드 조회 권한
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('HQ_MASTER', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- CONSULTANT: 마음건강 가이드 조회 권한 (상담사도 참고할 수 있도록)
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('CONSULTANT', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

-- ROLE_CONSULTANT: 마음건강 가이드 조회 권한 (호환성을 위해)
INSERT INTO role_permissions (role_name, permission_code, is_active, granted_by, granted_at, created_at, updated_at) VALUES
('ROLE_CONSULTANT', 'MINDFULNESS_GUIDE_VIEW', true, 'SYSTEM', NOW(), NOW(), NOW())
ON DUPLICATE KEY UPDATE
    is_active = true,
    updated_at = NOW();

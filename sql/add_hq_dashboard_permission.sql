-- HQ_DASHBOARD_VIEW 권한 추가
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at) 
VALUES ('HQ_DASHBOARD_VIEW', '본사 대시보드 조회', '본사 대시보드에 접근할 수 있는 권한', 'DASHBOARD', 1, NOW(), NOW()) 
ON DUPLICATE KEY UPDATE permission_name='본사 대시보드 조회';

-- HQ_MASTER 역할에 HQ_DASHBOARD_VIEW 권한 부여
INSERT INTO role_permissions (role_code, permission_code, is_active, created_at, updated_at)
VALUES ('HQ_MASTER', 'HQ_DASHBOARD_VIEW', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_active=1;

-- BRANCH_SUPER_ADMIN 역할에도 HQ_DASHBOARD_VIEW 권한 부여 (필요시)
INSERT INTO role_permissions (role_code, permission_code, is_active, created_at, updated_at)
VALUES ('BRANCH_SUPER_ADMIN', 'HQ_DASHBOARD_VIEW', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE is_active=1;

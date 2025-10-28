-- HQ_ADMIN, SUPER_HQ_ADMIN, HQ_MASTER에 REPORT_VIEW, DASHBOARD_VIEW 권한 추가
-- 이 스크립트는 이미 존재하는 권한 매핑에 새로운 권한을 추가합니다

-- 먼저 권한이 존재하는지 확인하고 없으면 추가
INSERT INTO permission (permission_code, permission_name, category, created_at, updated_at)
SELECT 'REPORT_VIEW', '보고서 조회', 'STATISTICS', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission WHERE permission_code = 'REPORT_VIEW');

INSERT INTO permission (permission_code, permission_name, category, created_at, updated_at)
SELECT 'DASHBOARD_VIEW', '대시보드 조회', 'STATISTICS', NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM permission WHERE permission_code = 'DASHBOARD_VIEW');

-- HQ_ADMIN에 권한 추가
INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'HQ_ADMIN', 'REPORT_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'HQ_ADMIN' AND permission_code = 'REPORT_VIEW');

INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'HQ_ADMIN', 'DASHBOARD_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'HQ_ADMIN' AND permission_code = 'DASHBOARD_VIEW');

-- SUPER_HQ_ADMIN에 권한 추가
INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'SUPER_HQ_ADMIN', 'REPORT_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'SUPER_HQ_ADMIN' AND permission_code = 'REPORT_VIEW');

INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'SUPER_HQ_ADMIN', 'DASHBOARD_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'SUPER_HQ_ADMIN' AND permission_code = 'DASHBOARD_VIEW');

-- HQ_MASTER에 권한 추가
INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'HQ_MASTER', 'REPORT_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'HQ_MASTER' AND permission_code = 'REPORT_VIEW');

INSERT INTO role_permission (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'HQ_MASTER', 'DASHBOARD_VIEW', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM role_permission WHERE role_name = 'HQ_MASTER' AND permission_code = 'DASHBOARD_VIEW');

-- 결과 확인
SELECT role_name, permission_code, is_active 
FROM role_permission 
WHERE permission_code IN ('REPORT_VIEW', 'DASHBOARD_VIEW') 
  AND role_name IN ('HQ_ADMIN', 'SUPER_HQ_ADMIN', 'HQ_MASTER');


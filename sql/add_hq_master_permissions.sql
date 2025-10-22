-- HQ_MASTER 권한 부여 SQL 스크립트
-- 본사 대시보드 및 지점 관리 권한 추가

-- 1. HQ 관련 권한 추가
INSERT IGNORE INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_by, updated_by)
VALUES 
('HQ_DASHBOARD_VIEW', '본사 대시보드 조회', '본사 대시보드에 접근하고 조회할 수 있는 권한', 'DASHBOARD', TRUE, 'SYSTEM', 'SYSTEM'),
('HQ_BRANCH_MANAGE', '지점 관리', '지점 생성, 수정, 삭제 및 관리할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, 'SYSTEM', 'SYSTEM'),
('HQ_BRANCH_VIEW', '지점 조회', '지점 정보를 조회할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, 'SYSTEM', 'SYSTEM'),
('HQ_USER_MANAGE', '전사 사용자 관리', '전사 사용자 생성, 수정, 삭제 및 관리할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, 'SYSTEM', 'SYSTEM'),
('HQ_STATISTICS_VIEW', '전사 통계 조회', '전사 통계 및 분석 데이터를 조회할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, 'SYSTEM', 'SYSTEM'),
('HQ_FINANCIAL_MANAGE', '전사 재무 관리', '전사 재무 데이터를 관리할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, 'SYSTEM', 'SYSTEM');

-- 2. HQ_MASTER 역할에 모든 HQ 권한 매핑
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_by, updated_by)
SELECT 
    (SELECT id FROM roles WHERE role_name = 'HQ_MASTER'),
    p.id,
    'SYSTEM',
    'SYSTEM'
FROM permissions p 
WHERE p.permission_code IN (
    'HQ_DASHBOARD_VIEW',
    'HQ_BRANCH_MANAGE', 
    'HQ_BRANCH_VIEW',
    'HQ_USER_MANAGE',
    'HQ_STATISTICS_VIEW',
    'HQ_FINANCIAL_MANAGE'
);

-- 3. 기존 관리자 역할들에도 HQ 권한 추가 (선택적)
-- ADMIN 역할에 HQ 권한 추가
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_by, updated_by)
SELECT 
    (SELECT id FROM roles WHERE role_name = 'ADMIN'),
    p.id,
    'SYSTEM',
    'SYSTEM'
FROM permissions p 
WHERE p.permission_code IN (
    'HQ_DASHBOARD_VIEW',
    'HQ_BRANCH_VIEW',
    'HQ_STATISTICS_VIEW'
);

-- BRANCH_SUPER_ADMIN 역할에 HQ 권한 추가
INSERT IGNORE INTO role_permissions (role_id, permission_id, created_by, updated_by)
SELECT 
    (SELECT id FROM roles WHERE role_name = 'BRANCH_SUPER_ADMIN'),
    p.id,
    'SYSTEM',
    'SYSTEM'
FROM permissions p 
WHERE p.permission_code IN (
    'HQ_DASHBOARD_VIEW',
    'HQ_BRANCH_VIEW',
    'HQ_STATISTICS_VIEW'
);

-- 4. 권한 매핑 확인 쿼리
SELECT 
    r.role_name,
    p.permission_code,
    p.permission_name,
    p.permission_description
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.role_name = 'HQ_MASTER'
ORDER BY p.permission_code;

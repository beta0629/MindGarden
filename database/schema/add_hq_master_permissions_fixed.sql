-- HQ_MASTER 권한 부여 SQL 스크립트 (수정된 테이블 구조)
-- 본사 대시보드 및 지점 관리 권한 추가

-- 1. HQ 관련 권한 추가
INSERT IGNORE INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at)
VALUES 
('HQ_DASHBOARD_VIEW', '본사 대시보드 조회', '본사 대시보드에 접근하고 조회할 수 있는 권한', 'DASHBOARD', TRUE, NOW(), NOW()),
('HQ_BRANCH_MANAGE', '지점 관리', '지점 생성, 수정, 삭제 및 관리할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, NOW(), NOW()),
('HQ_BRANCH_VIEW', '지점 조회', '지점 정보를 조회할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, NOW(), NOW()),
('HQ_USER_MANAGE', '전사 사용자 관리', '전사 사용자 생성, 수정, 삭제 및 관리할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, NOW(), NOW()),
('HQ_STATISTICS_VIEW', '전사 통계 조회', '전사 통계 및 분석 데이터를 조회할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, NOW(), NOW()),
('HQ_FINANCIAL_MANAGE', '전사 재무 관리', '전사 재무 데이터를 관리할 수 있는 권한', 'HQ_MANAGEMENT', TRUE, NOW(), NOW());

-- 2. HQ_MASTER 역할에 모든 HQ 권한 매핑
INSERT IGNORE INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at, granted_at, granted_by)
VALUES 
('HQ_MASTER', 'HQ_DASHBOARD_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('HQ_MASTER', 'HQ_BRANCH_MANAGE', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('HQ_MASTER', 'HQ_BRANCH_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('HQ_MASTER', 'HQ_USER_MANAGE', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('HQ_MASTER', 'HQ_STATISTICS_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('HQ_MASTER', 'HQ_FINANCIAL_MANAGE', TRUE, NOW(), NOW(), NOW(), 'SYSTEM');

-- 3. 기존 관리자 역할들에도 HQ 권한 추가 (선택적)
-- ADMIN 역할에 HQ 권한 추가
INSERT IGNORE INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at, granted_at, granted_by)
VALUES 
('ADMIN', 'HQ_DASHBOARD_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('ADMIN', 'HQ_BRANCH_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('ADMIN', 'HQ_STATISTICS_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM');

-- BRANCH_SUPER_ADMIN 역할에 HQ 권한 추가
INSERT IGNORE INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at, granted_at, granted_by)
VALUES 
('BRANCH_SUPER_ADMIN', 'HQ_DASHBOARD_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'HQ_BRANCH_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM'),
('BRANCH_SUPER_ADMIN', 'HQ_STATISTICS_VIEW', TRUE, NOW(), NOW(), NOW(), 'SYSTEM');

-- 4. 권한 매핑 확인 쿼리
SELECT 
    rp.role_name,
    rp.permission_code,
    p.permission_name,
    p.permission_description
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'HQ_MASTER'
ORDER BY rp.permission_code;

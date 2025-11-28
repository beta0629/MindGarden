-- 운영 환경 HQ_MASTER 권한 설정 스크립트
-- 실행 전 반드시 백업을 수행하세요!

-- 1. 권한 추가 (이미 존재할 수 있으므로 IGNORE 사용)
INSERT IGNORE INTO permissions (permission_code, permission_name, permission_description, is_active, created_at, updated_at) VALUES 
('HQ_BRANCH_VIEW', '본사 지점 조회', '본사에서 지점 정보를 조회할 수 있는 권한', 1, NOW(), NOW()),
('HQ_STATISTICS_VIEW', '본사 통계 조회', '본사에서 통계 정보를 조회할 수 있는 권한', 1, NOW(), NOW()),
('HQ_FINANCIAL_MANAGE', '본사 재무 관리', '본사에서 재무 정보를 관리할 수 있는 권한', 1, NOW(), NOW());

-- 2. HQ_MASTER 역할에 권한 부여 (중복 방지)
INSERT IGNORE INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at) VALUES 
('HQ_MASTER', 'HQ_BRANCH_VIEW', 1, NOW(), NOW()),
('HQ_MASTER', 'HQ_STATISTICS_VIEW', 1, NOW(), NOW()),
('HQ_MASTER', 'HQ_FINANCIAL_MANAGE', 1, NOW(), NOW());

-- 3. 기존 권한이 비활성화되어 있다면 활성화
UPDATE role_permissions 
SET is_active = 1, updated_at = NOW()
WHERE role_name = 'HQ_MASTER' 
AND permission_code IN ('HQ_BRANCH_VIEW', 'HQ_STATISTICS_VIEW', 'HQ_FINANCIAL_MANAGE')
AND is_active = 0;

-- 4. 결과 확인
SELECT 
    rp.role_name,
    p.permission_code,
    p.permission_name,
    rp.is_active,
    rp.created_at
FROM role_permissions rp
JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'HQ_MASTER'
AND p.permission_code IN ('HQ_BRANCH_VIEW', 'HQ_STATISTICS_VIEW', 'HQ_FINANCIAL_MANAGE')
ORDER BY p.permission_code;

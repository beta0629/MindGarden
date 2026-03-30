-- 재무 거래 삭제 권한 확인 및 부여 스크립트

-- 1. 현재 BRANCH_SUPER_ADMIN 역할의 모든 권한 확인
SELECT 
    rp.role_name,
    rp.permission_code,
    p.permission_name,
    rp.is_active,
    rp.created_at,
    rp.updated_at
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'BRANCH_SUPER_ADMIN'
ORDER BY rp.created_at DESC;

-- 2. FINANCIAL_TRANSACTION_DELETE 권한이 존재하는지 확인
SELECT 
    rp.role_name,
    rp.permission_code,
    p.permission_name,
    rp.is_active,
    rp.created_at
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
  AND rp.permission_code = 'FINANCIAL_TRANSACTION_DELETE';

-- 3. 권한 코드가 존재하는지 확인
SELECT 
    permission_code,
    permission_name,
    permission_description,
    category,
    is_active,
    created_at
FROM permissions
WHERE permission_code = 'FINANCIAL_TRANSACTION_DELETE';

-- 4. 권한이 없으면 추가 (실행)
-- INSERT IGNORE INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at) 
-- VALUES ('FINANCIAL_TRANSACTION_DELETE', '재무 거래 삭제', 'ERP 재무 거래를 삭제할 수 있는 권한 (논리 삭제)', 'FINANCIAL', TRUE, NOW(), NOW());

-- 5. BRANCH_SUPER_ADMIN 역할에 권한 부여 (실행)
-- INSERT IGNORE INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at) 
-- VALUES ('BRANCH_SUPER_ADMIN', 'FINANCIAL_TRANSACTION_DELETE', TRUE, NOW(), NOW());

-- 6. 활성화되지 않은 권한이 있다면 활성화 (실행)
-- UPDATE role_permissions 
-- SET is_active = TRUE, updated_at = NOW()
-- WHERE role_name = 'BRANCH_SUPER_ADMIN' 
--   AND permission_code = 'FINANCIAL_TRANSACTION_DELETE'
--   AND is_active = FALSE;

-- 7. 최종 확인
SELECT 
    rp.role_name,
    rp.permission_code,
    p.permission_name,
    rp.is_active,
    CASE WHEN rp.is_active = TRUE THEN '✅ 활성화' ELSE '❌ 비활성화' END AS 상태
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
  AND rp.permission_code = 'FINANCIAL_TRANSACTION_DELETE';


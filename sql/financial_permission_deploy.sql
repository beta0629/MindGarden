-- 운영 DB에 재무 거래 삭제 권한 추가
-- 실행 방법: 운영 서버에서 mysql -u root -p mindgarden_prod < financial_permission_deploy.sql

-- 재무 거래 삭제 권한 추가
INSERT INTO permissions (permission_code, permission_name, permission_description, category, is_active, created_at, updated_at) 
VALUES (
    'FINANCIAL_TRANSACTION_DELETE',
    '재무 거래 삭제',
    '재무 거래 삭제 권한 (논리 삭제)',
    'FINANCIAL',
    true,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE
    permission_name = '재무 거래 삭제',
    permission_description = '재무 거래 삭제 권한 (논리 삭제)',
    updated_at = NOW();

-- 지점 수퍼 어드민에게 권한 부여
INSERT INTO role_permissions (role_name, permission_code, is_active, created_at, updated_at)
SELECT 'BRANCH_SUPER_ADMIN', 'FINANCIAL_TRANSACTION_DELETE', true, NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM role_permissions 
    WHERE role_name = 'BRANCH_SUPER_ADMIN' 
    AND permission_code = 'FINANCIAL_TRANSACTION_DELETE'
);

-- 권한 부여 확인
SELECT 
    rp.role_name,
    p.permission_code,
    p.permission_name,
    rp.is_active,
    rp.created_at
FROM role_permissions rp
JOIN permissions p ON rp.permission_code = p.permission_code
WHERE p.permission_code = 'FINANCIAL_TRANSACTION_DELETE';

SELECT '✅ 운영 DB 권한 추가 완료' as result;

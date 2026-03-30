-- 재무 거래 삭제 권한 확인 스크립트

-- 1. 권한 코드 존재 확인
SELECT 
    '권한 코드 확인' AS '검사항목',
    permission_code AS '권한코드',
    permission_name AS '권한명',
    is_active AS '활성화',
    created_at AS '생성일시'
FROM permissions
WHERE permission_code = 'FINANCIAL_TRANSACTION_DELETE';

-- 2. BRANCH_SUPER_ADMIN 역할의 권한 부여 확인
SELECT 
    '권한 부여 확인' AS '검사항목',
    rp.role_name AS '역할명',
    rp.permission_code AS '권한코드',
    p.permission_name AS '권한명',
    rp.is_active AS '활성화',
    CASE 
        WHEN rp.is_active = TRUE THEN '✅ 활성화됨' 
        ELSE '❌ 비활성화됨' 
    END AS '상태',
    rp.created_at AS '생성일시',
    rp.updated_at AS '수정일시'
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
  AND rp.permission_code = 'FINANCIAL_TRANSACTION_DELETE';

-- 3. BRANCH_SUPER_ADMIN 역할의 모든 활성 권한 (참고용)
SELECT 
    COUNT(*) AS '총 활성 권한 수'
FROM role_permissions
WHERE role_name = 'BRANCH_SUPER_ADMIN' 
  AND is_active = TRUE;

-- 4. FINANCIAL 관련 권한 모두 확인
SELECT 
    rp.role_name AS '역할명',
    rp.permission_code AS '권한코드',
    p.permission_name AS '권한명',
    rp.is_active AS '활성화',
    rp.updated_at AS '수정일시'
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
  AND rp.permission_code LIKE '%FINANCIAL%'
ORDER BY rp.updated_at DESC;


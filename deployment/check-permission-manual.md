# 운영 DB 권한 확인 및 부여 가이드

## 1. 운영 서버 접속

```bash
ssh root@beta74.cafe24.com
```

## 2. 권한 확인

```bash
cd /tmp
mysql -h localhost -u mindgard -p mindgarden << 'EOF'

-- 권한 코드 존재 확인
SELECT 
    permission_code,
    permission_name,
    CASE WHEN is_active = TRUE THEN '✅ 활성화' ELSE '❌ 비활성화' END AS '상태'
FROM permissions
WHERE permission_code = 'FINANCIAL_TRANSACTION_DELETE';

-- BRANCH_SUPER_ADMIN 역할의 권한 부여 확인
SELECT 
    rp.role_name AS '역할명',
    rp.permission_code AS '권한코드',
    p.permission_name AS '권한명',
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

EOF
```

## 3. 권한이 없거나 비활성화된 경우 권한 부여

```bash
mysql -h localhost -u mindgard -p mindgarden << 'EOF'

-- 1. 권한 코드 추가
INSERT IGNORE INTO permissions (
    permission_code, 
    permission_name, 
    permission_description, 
    category, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'FINANCIAL_TRANSACTION_DELETE', 
    '재무 거래 삭제', 
    'ERP 재무 거래를 삭제할 수 있는 권한 (논리 삭제)', 
    'FINANCIAL', 
    TRUE, 
    NOW(), 
    NOW()
);

-- 2. BRANCH_SUPER_ADMIN 역할에 권한 부여
INSERT IGNORE INTO role_permissions (
    role_name, 
    permission_code, 
    is_active, 
    created_at, 
    updated_at
) VALUES (
    'BRANCH_SUPER_ADMIN', 
    'FINANCIAL_TRANSACTION_DELETE', 
    TRUE, 
    NOW(), 
    NOW()
);

-- 3. 비활성화된 권한이 있다면 활성화
UPDATE role_permissions 
SET 
    is_active = TRUE, 
    updated_at = NOW()
WHERE 
    role_name = 'BRANCH_SUPER_ADMIN' 
    AND permission_code = 'FINANCIAL_TRANSACTION_DELETE'
    AND is_active = FALSE;

-- 4. 최종 확인
SELECT 
    rp.role_name AS '역할명',
    rp.permission_code AS '권한코드',
    p.permission_name AS '권한명',
    CASE 
        WHEN rp.is_active = TRUE THEN '✅ 활성화됨' 
        ELSE '❌ 비활성화됨' 
    END AS '상태'
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
  AND rp.permission_code = 'FINANCIAL_TRANSACTION_DELETE';

EOF
```

## 4. 한 번에 확인 및 부여

```bash
mysql -h localhost -u mindgard -p mindgarden < /tmp/verify_permission.sql
```


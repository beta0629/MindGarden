#!/bin/bash

# 운영 DB 접속 정보
DB_HOST="beta74.cafe24.com"
DB_NAME="mindgarden_prod"
DB_USER="root"  # 운영 환경에서는 root로 접속

echo "운영 DB 권한 추가 중..."

ssh root@$DB_HOST << 'REMOTE_SCRIPT'
mysql mindgarden_prod << 'SQL'
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

SELECT '운영 DB 권한 추가 완료' as result;
SQL
REMOTE_SCRIPT


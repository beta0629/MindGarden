#!/bin/bash

# 운영 DB에서 재무 거래 삭제 권한 확인 스크립트
# 사용법: ./deployment/verify-financial-delete-permission.sh

echo "========================================"
echo "재무 거래 삭제 권한 확인 스크립트"
echo "========================================"

# 운영 서버 정보
PROD_SERVER="beta74.cafe24.com"
SSH_USER="mindgard"

# SQL 파일 경로
SQL_FILE="sql/verify_financial_delete_permission.sql"

echo ""
echo "1. SQL 파일 확인..."
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL 파일을 찾을 수 없습니다: $SQL_FILE"
    exit 1
fi
echo "✅ SQL 파일 확인 완료"

echo ""
echo "2. 운영 서버로 SQL 파일 복사..."
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
scp "$SQL_FILE" ${SSH_USER}@${PROD_SERVER}:/home/mindgard/verify_financial_delete_permission_${TIMESTAMP}.sql
if [ $? -ne 0 ]; then
    echo "❌ SQL 파일 복사 실패"
    exit 1
fi
echo "✅ SQL 파일 복사 완료"

echo ""
echo "3. 운영 DB에서 권한 확인..."
echo "📝 데이터베이스 비밀번호를 입력하세요:"

ssh ${SSH_USER}@${PROD_SERVER} << EOF
cd /home/mindgard
echo ""
echo "========================================"
echo "1. 권한 코드 존재 확인"
echo "========================================"
mysql -h localhost -u mindgard -p mindgarden -e "
SELECT 
    '권한 코드 확인' AS '검사항목',
    permission_code AS '권한코드',
    permission_name AS '권한명',
    CASE WHEN is_active = TRUE THEN '✅ 활성화' ELSE '❌ 비활성화' END AS '상태',
    created_at AS '생성일시'
FROM permissions
WHERE permission_code = 'FINANCIAL_TRANSACTION_DELETE';
"

echo ""
echo "========================================"
echo "2. BRANCH_SUPER_ADMIN 역할의 권한 부여 확인"
echo "========================================"
mysql -h localhost -u mindgard -p mindgarden -e "
SELECT 
    '권한 부여 확인' AS '검사항목',
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
"

echo ""
echo "========================================"
echo "3. BRANCH_SUPER_ADMIN의 모든 FINANCIAL 관련 권한"
echo "========================================"
mysql -h localhost -u mindgard -p mindgarden -e "
SELECT 
    rp.role_name AS '역할명',
    rp.permission_code AS '권한코드',
    p.permission_name AS '권한명',
    CASE WHEN rp.is_active = TRUE THEN '✅' ELSE '❌' END AS '활성화',
    rp.updated_at AS '수정일시'
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
  AND rp.permission_code LIKE '%FINANCIAL%'
ORDER BY rp.updated_at DESC;
"

echo ""
echo "4. 임시 SQL 파일 삭제..."
rm -f verify_financial_delete_permission_*.sql
echo "✅ 완료"
EOF

echo ""
echo "========================================"
echo "권한 확인 완료!"
echo "========================================"
echo ""


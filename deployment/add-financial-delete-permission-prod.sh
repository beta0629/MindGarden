#!/bin/bash

# 운영 서버에 재무 거래 삭제 권한 추가 스크립트
# 사용법: ./deployment/add-financial-delete-permission-prod.sh

echo "========================================"
echo "재무 거래 삭제 권한 추가 스크립트"
echo "========================================"

# 운영 서버 정보
PROD_SERVER="beta74.cafe24.com"
SSH_USER="mindgard"

# SQL 파일 경로
SQL_FILE="sql/deploy_financial_delete_permission_prod.sql"

# 현재 날짜/시간
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo ""
echo "1. SQL 파일 확인..."
if [ ! -f "$SQL_FILE" ]; then
    echo "❌ SQL 파일을 찾을 수 없습니다: $SQL_FILE"
    exit 1
fi
echo "✅ SQL 파일 확인 완료"

echo ""
echo "2. 운영 서버에서 권한 존재 여부 확인..."
echo "📝 데이터베이스 비밀번호를 입력하세요:"

# 권한 존재 여부 확인
PERMISSION_EXISTS=$(ssh ${SSH_USER}@${PROD_SERVER} "mysql -h localhost -u mindgard -p mindgarden -N -e \"SELECT COUNT(*) FROM role_permissions WHERE role_name = 'BRANCH_SUPER_ADMIN' AND permission_code = 'FINANCIAL_TRANSACTION_DELETE' AND is_active = TRUE;\" 2>/dev/null")

if [ "$PERMISSION_EXISTS" -gt 0 ]; then
    echo ""
    echo "========================================"
    echo "⚠️  권한이 이미 존재합니다!"
    echo "========================================"
    echo ""
    echo "✅ FINANCIAL_TRANSACTION_DELETE 권한이 BRANCH_SUPER_ADMIN 역할에 이미 부여되어 있습니다."
    echo "📋 현재 권한 상태:"
    ssh ${SSH_USER}@${PROD_SERVER} << 'EOF'
mysql -h localhost -u mindgard -p mindgarden -e "
SELECT 
    rp.role_name AS '역할명',
    rp.permission_code AS '권한코드',
    p.permission_name AS '권한명',
    CASE 
        WHEN rp.is_active = TRUE THEN '✅ 활성화' 
        ELSE '❌ 비활성화' 
    END AS '상태',
    rp.updated_at AS '최종수정일시'
FROM role_permissions rp
LEFT JOIN permissions p ON rp.permission_code = p.permission_code
WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
  AND rp.permission_code = 'FINANCIAL_TRANSACTION_DELETE';
"
EOF
    echo ""
    echo "🛑 중복 배포를 방지하기 위해 스크립트를 종료합니다."
    echo "   권한 수정이 필요한 경우 SQL을 직접 실행하세요."
    echo ""
    exit 0
fi

echo "✅ 권한이 존재하지 않습니다. 배포를 진행합니다."
echo ""

echo ""
echo "3. 운영 서버로 SQL 파일 복사..."
scp "$SQL_FILE" ${SSH_USER}@${PROD_SERVER}:/home/mindgard/add_financial_delete_permission_${TIMESTAMP}.sql
if [ $? -ne 0 ]; then
    echo "❌ SQL 파일 복사 실패"
    exit 1
fi
echo "✅ SQL 파일 복사 완료"

echo ""
echo "4. 운영 서버에서 SQL 실행..."
echo "📝 데이터베이스 비밀번호를 다시 입력하세요:"

ssh ${SSH_USER}@${PROD_SERVER} << 'EOF'
cd /home/mindgard
echo ""
echo "운영 데이터베이스에 권한 추가 중..."
mysql -h localhost -u mindgard -p mindgarden < add_financial_delete_permission_*.sql

if [ $? -eq 0 ]; then
    echo "✅ 권한 추가 완료"
    echo ""
    echo "5. 권한 확인..."
    echo "SELECT rp.role_name, rp.permission_code, p.permission_name, rp.is_active 
          FROM role_permissions rp 
          LEFT JOIN permissions p ON rp.permission_code = p.permission_code 
          WHERE rp.role_name = 'BRANCH_SUPER_ADMIN' 
            AND rp.permission_code = 'FINANCIAL_TRANSACTION_DELETE';" | mysql -h localhost -u mindgard -p mindgarden
    
    echo ""
    echo "6. 임시 SQL 파일 삭제..."
    rm -f add_financial_delete_permission_*.sql
    echo "✅ 완료"
else
    echo "❌ 권한 추가 실패"
    exit 1
fi
EOF

echo ""
echo "========================================"
echo "재무 거래 삭제 권한 추가 완료!"
echo "========================================"
echo ""
echo "📋 추가된 권한:"
echo "  - FINANCIAL_TRANSACTION_DELETE (재무 거래 삭제)"
echo ""
echo "✅ BRANCH_SUPER_ADMIN 권한으로 재무 거래 삭제가 가능합니다."
echo ""


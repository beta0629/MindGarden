#!/bin/bash

# 운영 서버에 메시지 관리 권한 추가 스크립트
# 사용법: ./deployment/add-message-management-permissions-prod.sh

echo "========================================"
echo "메시지 관리 권한 추가 스크립트"
echo "========================================"

# 운영 서버 정보
PROD_SERVER="beta74.cafe24.com"
SSH_USER="beta74"

# SQL 파일 경로
SQL_FILE="sql/add_message_management_permissions.sql"

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
echo "2. 운영 서버로 SQL 파일 복사..."
scp "$SQL_FILE" ${SSH_USER}@${PROD_SERVER}:/tmp/add_message_management_permissions_${TIMESTAMP}.sql
if [ $? -ne 0 ]; then
    echo "❌ SQL 파일 복사 실패"
    exit 1
fi
echo "✅ SQL 파일 복사 완료"

echo ""
echo "3. 운영 서버에서 SQL 실행..."
ssh ${SSH_USER}@${PROD_SERVER} << 'EOF'
cd /tmp
echo ""
echo "운영 데이터베이스에 메시지 관리 권한 추가 중..."
mysql -u mindgarden -p'mindgarden2025' mind_garden < add_message_management_permissions_*.sql

if [ $? -eq 0 ]; then
    echo "✅ 권한 추가 완료"
    echo ""
    echo "4. 권한 확인..."
    mysql -u mindgarden -p'mindgarden2025' mind_garden -e "SELECT role_name, permission_code FROM role_permissions WHERE permission_code IN ('MESSAGE_MANAGE', 'MESSAGE_VIEW') AND role_name='BRANCH_SUPER_ADMIN' AND is_active=true;"
    
    echo ""
    echo "5. 임시 SQL 파일 삭제..."
    rm -f add_message_management_permissions_*.sql
    echo "✅ 완료"
else
    echo "❌ 권한 추가 실패"
    exit 1
fi
EOF

echo ""
echo "========================================"
echo "메시지 관리 권한 추가 완료!"
echo "========================================"
echo ""
echo "📋 추가된 권한:"
echo "  - MESSAGE_MANAGE (메시지 관리)"
echo "  - MESSAGE_VIEW (메시지 조회)"
echo ""
echo "✅ BRANCH_SUPER_ADMIN 권한으로 메시지 관리가 가능합니다."
echo ""

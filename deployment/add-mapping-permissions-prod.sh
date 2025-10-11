#!/bin/bash

# 운영 서버에 매핑 관리 권한 추가 스크립트
# 사용법: ./deployment/add-mapping-permissions-prod.sh

echo "========================================"
echo "매핑 관리 권한 추가 스크립트"
echo "========================================"

# 운영 서버 정보
PROD_SERVER="beta74.cafe24.com"
SSH_USER="mindgard"

# SQL 파일 경로
SQL_FILE="src/main/resources/sql/add_mapping_permissions.sql"

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
scp "$SQL_FILE" ${SSH_USER}@${PROD_SERVER}:/home/mindgard/add_mapping_permissions_${TIMESTAMP}.sql
if [ $? -ne 0 ]; then
    echo "❌ SQL 파일 복사 실패"
    exit 1
fi
echo "✅ SQL 파일 복사 완료"

echo ""
echo "3. 운영 서버에서 SQL 실행..."
echo "📝 데이터베이스 비밀번호를 입력하세요:"

ssh ${SSH_USER}@${PROD_SERVER} << 'EOF'
cd /home/mindgard
echo ""
echo "운영 데이터베이스에 권한 추가 중..."
mysql -h localhost -u mindgard -p mindgarden < add_mapping_permissions_*.sql

if [ $? -eq 0 ]; then
    echo "✅ 권한 추가 완료"
    echo ""
    echo "4. 권한 확인..."
    echo "SELECT * FROM role_permissions WHERE permission_code IN ('MAPPING_DELETE', 'MAPPING_UPDATE');" | mysql -h localhost -u mindgard -p mindgarden
    
    echo ""
    echo "5. 임시 SQL 파일 삭제..."
    rm -f add_mapping_permissions_*.sql
    echo "✅ 완료"
else
    echo "❌ 권한 추가 실패"
    exit 1
fi
EOF

echo ""
echo "========================================"
echo "매핑 관리 권한 추가 완료!"
echo "========================================"
echo ""
echo "📋 추가된 권한:"
echo "  - MAPPING_DELETE (매핑 삭제)"
echo "  - MAPPING_UPDATE (매핑 수정)"
echo ""
echo "✅ BRANCH_SUPER_ADMIN 권한으로 매핑 삭제/수정이 가능합니다."
echo ""


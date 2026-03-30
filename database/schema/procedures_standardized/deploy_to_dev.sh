#!/bin/bash
# 표준화된 프로시저를 개발 서버에 배포하는 스크립트

DEV_SERVER="beta0629.cafe24.com"
DEV_USER="root"
DB_HOST="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "🚀 표준화된 프로시저 배포 시작..."
echo "서버: $DEV_SERVER"
echo "DB: $DB_NAME"
echo ""

# 프로시저 파일 목록
PROCEDURES=(
    "CheckTimeConflict"
    "GetRefundableSessions"
    "GetRefundStatistics"
    "ValidateIntegratedAmount"
    "GetConsolidatedFinancialData"
)

# 프로시저 파일을 서버로 업로드
echo "📤 프로시저 파일 업로드 중..."
for proc in "${PROCEDURES[@]}"; do
    file="${SCRIPT_DIR}/${proc}_standardized.sql"
    if [ -f "$file" ]; then
        scp "$file" "$DEV_USER@$DEV_SERVER:/tmp/${proc}_standardized.sql" 2>&1 | grep -v "Warning"
        echo "✅ ${proc}_standardized.sql 업로드 완료"
    else
        echo "❌ 파일을 찾을 수 없습니다: $file"
    fi
done

echo ""
echo "📥 서버에서 프로시저 배포 중..."

# SSH로 접속하여 프로시저 배포
ssh "$DEV_USER@$DEV_SERVER" << ENDSSH
set -e

for proc in CheckTimeConflict GetRefundableSessions GetRefundStatistics ValidateIntegratedAmount GetConsolidatedFinancialData; do
    file="/tmp/\${proc}_standardized.sql"
    if [ -f "\$file" ]; then
        echo "배포 중: \$proc"
        mysql -h $DB_HOST -u $DB_USER -p'$DB_PASS' $DB_NAME < "\$file" 2>&1 | grep -v "Warning: Using a password" || true
        echo "✅ \$proc 배포 완료"
    fi
done

echo ""
echo "🔍 배포된 프로시저 확인..."
mysql -h $DB_HOST -u $DB_USER -p'$DB_PASS' $DB_NAME -e "SELECT ROUTINE_NAME FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = '$DB_NAME' AND ROUTINE_TYPE = 'PROCEDURE' AND ROUTINE_NAME IN ('CheckTimeConflict', 'GetRefundableSessions', 'GetRefundStatistics', 'ValidateIntegratedAmount', 'GetConsolidatedFinancialData') ORDER BY ROUTINE_NAME;" 2>&1 | grep -v "Warning\|ROUTINE_NAME"

ENDSSH

echo ""
echo "✅ 프로시저 배포 완료!"


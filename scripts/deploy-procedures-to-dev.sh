#!/bin/bash
# 개발 서버에 프로시저 배포 스크립트

set -e

DEV_SERVER="beta0629.cafe24.com"
DEV_USER="root"
SSH_KEY="$HOME/.ssh/github_actions_dev"
DB_HOST="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_PASSWORD="MindGardenDev2025!@#"
DB_NAME="mind_garden"

echo "🚀 개발 서버 프로시저 배포 시작..."
echo "서버: $DEV_SERVER"
echo ""

# 프로시저 파일을 개발 서버로 업로드
echo "📤 프로시저 파일 업로드 중..."

# 1. 환불 및 매핑 프로시저
if [ -f "sql/production_all_missing_procedures.sql" ]; then
    scp -i "$SSH_KEY" sql/production_all_missing_procedures.sql $DEV_USER@$DEV_SERVER:/tmp/
    echo "✅ production_all_missing_procedures.sql 업로드 완료"
else
    echo "⚠️  sql/production_all_missing_procedures.sql 파일을 찾을 수 없습니다"
fi

# 2. 매핑 수정 프로시저
if [ -f "sql/mapping_update_procedures_mysql.sql" ]; then
    scp -i "$SSH_KEY" sql/mapping_update_procedures_mysql.sql $DEV_USER@$DEV_SERVER:/tmp/
    echo "✅ mapping_update_procedures_mysql.sql 업로드 완료"
else
    echo "⚠️  sql/mapping_update_procedures_mysql.sql 파일을 찾을 수 없습니다"
fi

# 3. 재무 프로시저
if [ -f "sql-scripts/consolidated_financial_procedures.sql" ]; then
    scp -i "$SSH_KEY" sql-scripts/consolidated_financial_procedures.sql $DEV_USER@$DEV_SERVER:/tmp/
    echo "✅ consolidated_financial_procedures.sql 업로드 완료"
else
    echo "⚠️  sql-scripts/consolidated_financial_procedures.sql 파일을 찾을 수 없습니다"
fi

# 4. 재무 보고서 프로시저
if [ -f "sql-scripts/financial_reports_procedures.sql" ]; then
    scp -i "$SSH_KEY" sql-scripts/financial_reports_procedures.sql $DEV_USER@$DEV_SERVER:/tmp/
    echo "✅ financial_reports_procedures.sql 업로드 완료"
else
    echo "⚠️  sql-scripts/financial_reports_procedures.sql 파일을 찾을 수 없습니다"
fi

echo ""
echo "📥 개발 서버에서 프로시저 실행 중..."

# SSH로 접속하여 프로시저 실행
ssh -i "$SSH_KEY" $DEV_USER@$DEV_SERVER << ENDSSH
set -e

echo "🔧 프로시저 배포 시작..."

# 1. 환불 및 매핑 프로시저
if [ -f /tmp/production_all_missing_procedures.sql ]; then
    echo "📝 production_all_missing_procedures.sql 실행 중..."
    mysql -h $DB_HOST -u $DB_USER -p'$DB_PASSWORD' --default-character-set=utf8mb4 $DB_NAME < /tmp/production_all_missing_procedures.sql 2>&1 | grep -v "Warning" || true
    echo "✅ 환불 및 매핑 프로시저 배포 완료"
fi

# 2. 매핑 수정 프로시저
if [ -f /tmp/mapping_update_procedures_mysql.sql ]; then
    echo "📝 mapping_update_procedures_mysql.sql 실행 중..."
    mysql -h $DB_HOST -u $DB_USER -p'$DB_PASSWORD' --default-character-set=utf8mb4 $DB_NAME < /tmp/mapping_update_procedures_mysql.sql 2>&1 | grep -v "Warning" || true
    echo "✅ 매핑 수정 프로시저 배포 완료"
fi

# 3. 재무 프로시저
if [ -f /tmp/consolidated_financial_procedures.sql ]; then
    echo "📝 consolidated_financial_procedures.sql 실행 중..."
    mysql -h $DB_HOST -u $DB_USER -p'$DB_PASSWORD' --default-character-set=utf8mb4 $DB_NAME < /tmp/consolidated_financial_procedures.sql 2>&1 | grep -v "Warning" || true
    echo "✅ 재무 프로시저 배포 완료"
fi

# 4. 재무 보고서 프로시저
if [ -f /tmp/financial_reports_procedures.sql ]; then
    echo "📝 financial_reports_procedures.sql 실행 중..."
    mysql -h $DB_HOST -u $DB_USER -p'$DB_PASSWORD' --default-character-set=utf8mb4 $DB_NAME < /tmp/financial_reports_procedures.sql 2>&1 | grep -v "Warning" || true
    echo "✅ 재무 보고서 프로시저 배포 완료"
fi

echo ""
echo "🔍 배포된 프로시저 확인..."
mysql -h $DB_HOST -u $DB_USER -p'$DB_PASSWORD' $DB_NAME -e "SHOW PROCEDURE STATUS WHERE Db = '$DB_NAME';" 2>&1 | grep -v "Warning" | head -20

echo ""
echo "✅ 프로시저 배포 완료!"

ENDSSH

echo ""
echo "✅ 개발 서버 프로시저 배포 완료!"


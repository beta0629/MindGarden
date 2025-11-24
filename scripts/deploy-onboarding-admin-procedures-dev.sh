#!/bin/bash
# 개발 서버에 온보딩 관리자 계정 생성 프로시저 배포 스크립트

set -e

DEV_SERVER="beta0629.cafe24.com"
DEV_USER="root"
DB_HOST="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_PASSWORD="MindGardenDev2025!@#"
DB_NAME="core_solution"

echo "🚀 개발 서버 프로시저 배포 시작..."
echo "서버: $DEV_SERVER"
echo "DB: $DB_NAME"
echo ""

# 프로젝트 루트 디렉토리
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# SQL 파일 경로
SQL_FILE1="$PROJECT_ROOT/sql/create_tenant_admin_account_procedure.sql"
SQL_FILE2="$PROJECT_ROOT/sql/update_process_onboarding_approval_with_admin_account.sql"

# 파일 존재 확인
if [ ! -f "$SQL_FILE1" ]; then
    echo "❌ 오류: $SQL_FILE1 파일을 찾을 수 없습니다."
    exit 1
fi

if [ ! -f "$SQL_FILE2" ]; then
    echo "❌ 오류: $SQL_FILE2 파일을 찾을 수 없습니다."
    exit 1
fi

echo "📤 SQL 파일 업로드 중..."

# SQL 파일을 개발 서버의 /tmp로 업로드
scp "$SQL_FILE1" $DEV_USER@$DEV_SERVER:/tmp/create_tenant_admin_account_procedure.sql
echo "✅ create_tenant_admin_account_procedure.sql 업로드 완료"

scp "$SQL_FILE2" $DEV_USER@$DEV_SERVER:/tmp/update_process_onboarding_approval_with_admin_account.sql
echo "✅ update_process_onboarding_approval_with_admin_account.sql 업로드 완료"

echo ""
echo "📥 개발 서버에서 프로시저 실행 중..."

# SSH로 접속하여 프로시저 실행
ssh $DEV_USER@$DEV_SERVER << ENDSSH
set -e

echo "🔧 프로시저 배포 시작..."

# 1. CreateTenantAdminAccount 프로시저 생성
if [ -f /tmp/create_tenant_admin_account_procedure.sql ]; then
    echo "📝 CreateTenantAdminAccount 프로시저 생성 중..."
    mysql -h $DB_HOST -u $DB_USER -p'$DB_PASSWORD' --default-character-set=utf8mb4 $DB_NAME < /tmp/create_tenant_admin_account_procedure.sql 2>&1 | grep -v "Warning" || true
    echo "✅ CreateTenantAdminAccount 프로시저 생성 완료"
else
    echo "❌ create_tenant_admin_account_procedure.sql 파일을 찾을 수 없습니다"
    exit 1
fi

# 2. ProcessOnboardingApproval 프로시저 업데이트
if [ -f /tmp/update_process_onboarding_approval_with_admin_account.sql ]; then
    echo "📝 ProcessOnboardingApproval 프로시저 업데이트 중..."
    mysql -h $DB_HOST -u $DB_USER -p'$DB_PASSWORD' --default-character-set=utf8mb4 $DB_NAME < /tmp/update_process_onboarding_approval_with_admin_account.sql 2>&1 | grep -v "Warning" || true
    echo "✅ ProcessOnboardingApproval 프로시저 업데이트 완료"
else
    echo "❌ update_process_onboarding_approval_with_admin_account.sql 파일을 찾을 수 없습니다"
    exit 1
fi

echo ""
echo "🔍 배포된 프로시저 확인..."
mysql -h $DB_HOST -u $DB_USER -p'$DB_PASSWORD' $DB_NAME -e "SHOW PROCEDURE STATUS WHERE Db = '$DB_NAME' AND Name IN ('CreateTenantAdminAccount', 'ProcessOnboardingApproval');" 2>&1 | grep -v "Warning"

echo ""
echo "✅ 프로시저 배포 완료!"

ENDSSH

echo ""
echo "✅ 개발 서버 프로시저 배포 완료!"


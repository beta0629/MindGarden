#!/bin/bash

# ============================================
# 온보딩 관리자 계정 생성 프로시저 배포 스크립트
# ============================================
# 목적: 개발 서버에 PL/SQL 프로시저 배포
# 사용법: ./scripts/deploy-onboarding-admin-procedures.sh
# ============================================

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 프로젝트 루트 디렉토리
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}온보딩 관리자 계정 생성 프로시저 배포${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# DB 정보 확인 (환경 변수 또는 입력)
if [ -z "$DB_HOST" ]; then
    echo -e "${YELLOW}DB 정보를 입력해주세요:${NC}"
    read -p "DB Host (기본값: localhost): " DB_HOST
    DB_HOST=${DB_HOST:-localhost}
fi

if [ -z "$DB_USER" ]; then
    read -p "DB User: " DB_USER
fi

if [ -z "$DB_NAME" ]; then
    read -p "DB Name: " DB_NAME
fi

if [ -z "$DB_PASSWORD" ]; then
    read -s -p "DB Password: " DB_PASSWORD
    echo ""
fi

# SQL 파일 경로
SQL_FILE1="$PROJECT_ROOT/sql/create_tenant_admin_account_procedure.sql"
SQL_FILE2="$PROJECT_ROOT/sql/update_process_onboarding_approval_with_admin_account.sql"

# 파일 존재 확인
if [ ! -f "$SQL_FILE1" ]; then
    echo -e "${RED}오류: $SQL_FILE1 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

if [ ! -f "$SQL_FILE2" ]; then
    echo -e "${RED}오류: $SQL_FILE2 파일을 찾을 수 없습니다.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}배포할 SQL 파일:${NC}"
echo "  1. $SQL_FILE1"
echo "  2. $SQL_FILE2"
echo ""

read -p "계속하시겠습니까? (y/N): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo "배포가 취소되었습니다."
    exit 0
fi

echo ""
echo -e "${GREEN}1. CreateTenantAdminAccount 프로시저 생성 중...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE1"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ CreateTenantAdminAccount 프로시저 생성 완료${NC}"
else
    echo -e "${RED}✗ CreateTenantAdminAccount 프로시저 생성 실패${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}2. ProcessOnboardingApproval 프로시저 업데이트 중...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < "$SQL_FILE2"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ ProcessOnboardingApproval 프로시저 업데이트 완료${NC}"
else
    echo -e "${RED}✗ ProcessOnboardingApproval 프로시저 업데이트 실패${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}3. 프로시저 확인 중...${NC}"
mysql -h "$DB_HOST" -u "$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" <<EOF
SHOW PROCEDURE STATUS WHERE Db = '$DB_NAME' AND Name IN ('CreateTenantAdminAccount', 'ProcessOnboardingApproval');
EOF

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}배포 완료!${NC}"
echo -e "${GREEN}========================================${NC}"


#!/bin/bash
# 프로시저 마이그레이션 파일 테스트 스크립트
# 변환된 파일들이 올바르게 작동하는지 확인

set -e

DB_HOST="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"

echo "🔍 프로시저 마이그레이션 파일 테스트 시작..."
echo ""

# 1. 핵심 프로시저 존재 확인
echo "1️⃣ 핵심 프로시저 존재 확인"
PROCEDURES=("CreateOrActivateTenant" "ProcessOnboardingApproval" "ApplyDefaultRoleTemplates" "CreateTenantAdminAccount" "CopyDefaultTenantCodes" "CreateDefaultTenantUsers")

for proc in "${PROCEDURES[@]}"; do
    result=$(ssh root@${DB_HOST} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e \"SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_NAME = '${proc}' AND ROUTINE_TYPE = 'PROCEDURE';\" 2>&1" | tail -1)
    if [ "$result" = "1" ]; then
        echo "  ✅ ${proc} 존재"
    else
        echo "  ❌ ${proc} 없음"
    fi
done

echo ""

# 2. 변환된 파일 문법 검사
echo "2️⃣ 변환된 파일 문법 검사"
MIGRATION_DIR="src/main/resources/db/migration"
CONVERTED_FILES=$(git status --short | grep "\.sql$" | awk '{print $2}' | grep -v backup)

for file in $CONVERTED_FILES; do
    if [ -f "$file" ]; then
        # DELIMITER 명령어가 남아있는지 확인 (주석 제외)
        if grep -q "^[[:space:]]*DELIMITER[[:space:]]" "$file"; then
            echo "  ⚠️  ${file}: DELIMITER 명령어가 남아있음"
        else
            echo "  ✅ ${file}: DELIMITER 제거됨"
        fi
    fi
done

echo ""

# 3. 프로시저 정의 확인
echo "3️⃣ 프로시저 정의 확인"
for proc in "${PROCEDURES[@]}"; do
    definition=$(ssh root@${DB_HOST} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e \"SHOW CREATE PROCEDURE ${proc}\\G\" 2>&1" | grep -A 1 "Create Procedure" | tail -1)
    if [ -n "$definition" ]; then
        echo "  ✅ ${proc}: 정의 존재"
    else
        echo "  ❌ ${proc}: 정의 없음"
    fi
done

echo ""
echo "✅ 테스트 완료"


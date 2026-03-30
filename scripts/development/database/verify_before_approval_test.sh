#!/bin/bash
# 승인 테스트 전 최종 확인 스크립트

set -e

DB_HOST="beta0629.cafe24.com"
DB_USER="mindgarden_dev"
DB_PASS="MindGardenDev2025!@#"
DB_NAME="core_solution"

echo "🔍 승인 테스트 전 최종 확인..."
echo ""

# 1. 핵심 프로시저 존재 확인
echo "1️⃣ 핵심 프로시저 존재 확인"
PROCEDURES=("CreateOrActivateTenant" "ProcessOnboardingApproval" "ApplyDefaultRoleTemplates" "CreateTenantAdminAccount" "CopyDefaultTenantCodes" "CreateDefaultTenantUsers")

all_procedures_exist=true
for proc in "${PROCEDURES[@]}"; do
    result=$(ssh root@${DB_HOST} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e \"SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = DATABASE() AND ROUTINE_NAME = '${proc}' AND ROUTINE_TYPE = 'PROCEDURE';\" 2>&1" | tail -1)
    if [ "$result" = "1" ]; then
        echo "  ✅ ${proc}"
    else
        echo "  ❌ ${proc} 없음"
        all_procedures_exist=false
    fi
done

if [ "$all_procedures_exist" = false ]; then
    echo ""
    echo "⚠️  일부 프로시저가 없습니다. 애플리케이션 재시작이 필요할 수 있습니다."
fi

echo ""

# 2. 테스트 데이터 확인
echo "2️⃣ 테스트 데이터 확인"
pending_count=$(ssh root@${DB_HOST} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e \"SELECT COUNT(*) FROM onboarding_request WHERE status = 'PENDING';\" 2>&1" | tail -1)
on_hold_count=$(ssh root@${DB_HOST} "mysql -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e \"SELECT COUNT(*) FROM onboarding_request WHERE status = 'ON_HOLD';\" 2>&1" | tail -1)

echo "  📊 PENDING: ${pending_count}개"
echo "  📊 ON_HOLD: ${on_hold_count}개"

if [ "$pending_count" = "0" ] && [ "$on_hold_count" = "0" ]; then
    echo "  ⚠️  테스트 데이터가 없습니다."
else
    echo "  ✅ 테스트 데이터 존재"
fi

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
echo "✅ 확인 완료"
echo ""
echo "📋 다음 단계:"
echo "  1. 애플리케이션 재시작 (PlSqlInitializer가 프로시저 생성 확인)"
echo "  2. 승인 테스트 진행"
echo "  3. 로그 확인: PlSqlInitializer 로그 및 OnboardingApprovalService 로그"


#!/bin/bash
# 온보딩 전체 사이클 검증 스크립트
# 테넌트 생성 → 역할 생성 → 대시보드 생성 → 계정 생성 → 역할 할당

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# DB 연결 정보
DB_HOST="${DB_HOST:-114.202.247.246}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-core_solution}"
DB_USER="${DB_USERNAME:-mindgarden_dev}"
DB_PASS="${DB_PASSWORD:-MindGardenDev2025!@#}"

# API 정보
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}온보딩 전체 사이클 검증${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# 테스트용 변수
TEST_ID=$(date +%s)
TEST_TENANT_ID="test-tenant-${TEST_ID}"
TEST_TENANT_NAME="테스트 테넌트 ${TEST_ID}"
TEST_EMAIL="test${TEST_ID}@test.com"
TEST_PASSWORD="Test1234!@#"

echo -e "${YELLOW}테스트 정보:${NC}"
echo "  - Tenant ID: ${TEST_TENANT_ID}"
echo "  - Tenant Name: ${TEST_TENANT_NAME}"
echo "  - Email: ${TEST_EMAIL}"
echo ""

# MySQL 쿼리 실행 함수
run_query() {
  mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" \
    --default-character-set=utf8mb4 \
    -N -e "$1" 2>/dev/null
}

# ============================================
# 1단계: 온보딩 요청 생성
# ============================================
echo -e "${BLUE}[1단계] 온보딩 요청 생성${NC}"

ONBOARDING_REQUEST=$(cat <<EOF
{
  "tenantId": "${TEST_TENANT_ID}",
  "tenantName": "${TEST_TENANT_NAME}",
  "requestedBy": "${TEST_EMAIL}",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${TEST_PASSWORD}\", \"adminPasswordConfirm\": \"${TEST_PASSWORD}\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -X POST "${API_BASE_URL}/api/v1/onboarding/requests" \
  -H "Content-Type: application/json" \
  -d "${ONBOARDING_REQUEST}")

REQUEST_ID=$(echo "${REQUEST_RESPONSE}" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "${REQUEST_ID}" ]; then
  echo -e "${RED}❌ 온보딩 요청 생성 실패${NC}"
  echo "응답: ${REQUEST_RESPONSE}"
  exit 1
fi

echo -e "${GREEN}✅ 온보딩 요청 생성 성공: requestId=${REQUEST_ID}${NC}"
echo ""

# ============================================
# 2단계: 온보딩 승인
# ============================================
echo -e "${BLUE}[2단계] 온보딩 승인${NC}"

APPROVAL_REQUEST=$(cat <<EOF
{
  "status": "APPROVED",
  "note": "테스트 승인",
  "actorId": "system"
}
EOF
)

APPROVAL_RESPONSE=$(curl -s -X PUT "${API_BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decide" \
  -H "Content-Type: application/json" \
  -d "${APPROVAL_REQUEST}")

echo "승인 응답: ${APPROVAL_RESPONSE}"
echo ""

if echo "${APPROVAL_RESPONSE}" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ 온보딩 승인 성공${NC}"
else
  echo -e "${RED}❌ 온보딩 승인 실패${NC}"
  echo "응답: ${APPROVAL_RESPONSE}"
  exit 1
fi

echo ""
echo -e "${YELLOW}프로세스 완료 대기 중... (5초)${NC}"
sleep 5
echo ""

# ============================================
# 3단계: DB 상태 확인
# ============================================
echo -e "${BLUE}[3단계] DB 상태 확인${NC}"
echo ""

# 3.1 테넌트 확인
echo -e "${YELLOW}3.1 테넌트 생성 확인${NC}"
TENANT_COUNT=$(run_query "SELECT COUNT(*) FROM tenants WHERE tenant_id = '${TEST_TENANT_ID}' AND is_deleted = 0;")
if [ "${TENANT_COUNT}" -eq 1 ]; then
  echo -e "${GREEN}✅ 테넌트 생성 확인${NC}"
  TENANT_INFO=$(run_query "SELECT name, business_type, status FROM tenants WHERE tenant_id = '${TEST_TENANT_ID}';")
  echo "  ${TENANT_INFO}"
else
  echo -e "${RED}❌ 테넌트 생성 실패: ${TENANT_COUNT}개${NC}"
  exit 1
fi
echo ""

# 3.2 역할 생성 확인
echo -e "${YELLOW}3.2 역할 생성 확인${NC}"
ROLE_COUNT=$(run_query "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0);")
if [ "${ROLE_COUNT}" -ge 1 ]; then
  echo -e "${GREEN}✅ 역할 생성 확인: ${ROLE_COUNT}개${NC}"
  echo "  역할 목록:"
  run_query "SELECT name_ko, name_en, display_order FROM tenant_roles WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0) ORDER BY display_order;" | while IFS=$'\t' read -r name_ko name_en display_order; do
    echo "    - ${name_ko} (${name_en}) [순서: ${display_order}]"
  done
else
  echo -e "${RED}❌ 역할 생성 실패: ${ROLE_COUNT}개${NC}"
  echo -e "${YELLOW}⚠️  ApplyDefaultRoleTemplates 프로시저가 실행되지 않았을 수 있습니다.${NC}"
  exit 1
fi
echo ""

# 3.3 대시보드 생성 확인
echo -e "${YELLOW}3.3 대시보드 생성 확인${NC}"
DASHBOARD_COUNT=$(run_query "SELECT COUNT(*) FROM tenant_dashboards WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0);")
if [ "${DASHBOARD_COUNT}" -ge 1 ]; then
  echo -e "${GREEN}✅ 대시보드 생성 확인: ${DASHBOARD_COUNT}개${NC}"
  echo "  대시보드 목록:"
  run_query "SELECT dashboard_name, dashboard_type, is_default FROM tenant_dashboards WHERE tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0) ORDER BY display_order;" | while IFS=$'\t' read -r name type is_default; do
    echo "    - ${name} (${type}) [기본: ${is_default}]"
  done
else
  echo -e "${RED}❌ 대시보드 생성 실패: ${DASHBOARD_COUNT}개${NC}"
  echo -e "${YELLOW}⚠️  createDefaultDashboards() 메서드가 실행되지 않았을 수 있습니다.${NC}"
  exit 1
fi
echo ""

# 3.4 관리자 계정 확인
echo -e "${YELLOW}3.4 관리자 계정 생성 확인${NC}"
USER_COUNT=$(run_query "SELECT COUNT(*) FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}' AND (is_deleted IS NULL OR is_deleted = 0);")
if [ "${USER_COUNT}" -eq 1 ]; then
  echo -e "${GREEN}✅ 관리자 계정 생성 확인${NC}"
  USER_INFO=$(run_query "SELECT id, email, username, role, is_active FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}';")
  echo "  ${USER_INFO}"
else
  echo -e "${RED}❌ 관리자 계정 생성 실패: ${USER_COUNT}개${NC}"
  echo -e "${YELLOW}⚠️  createTenantAdminAccount() 메서드가 실행되지 않았을 수 있습니다.${NC}"
  exit 1
fi
echo ""

# 3.5 역할 할당 확인
echo -e "${YELLOW}3.5 역할 할당 확인${NC}"
USER_ID=$(run_query "SELECT id FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}' LIMIT 1;")
if [ -n "${USER_ID}" ]; then
  ASSIGNMENT_COUNT=$(run_query "SELECT COUNT(*) FROM user_role_assignments ura JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id WHERE ura.user_id = ${USER_ID} AND tr.tenant_id = '${TEST_TENANT_ID}' AND (ura.is_deleted IS NULL OR ura.is_deleted = 0) AND ura.is_active = b'1';")
  
  if [ "${ASSIGNMENT_COUNT}" -ge 1 ]; then
    echo -e "${GREEN}✅ 역할 할당 확인: ${ASSIGNMENT_COUNT}개${NC}"
    echo "  역할 할당 목록:"
    run_query "SELECT tr.name_ko, ura.effective_from, ura.effective_to FROM user_role_assignments ura JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id WHERE ura.user_id = ${USER_ID} AND tr.tenant_id = '${TEST_TENANT_ID}' AND (ura.is_deleted IS NULL OR ura.is_deleted = 0) AND ura.is_active = b'1';" | while IFS=$'\t' read -r role_name effective_from effective_to; do
      echo "    - ${role_name} (${effective_from} ~ ${effective_to:-무기한})"
    done
  else
    echo -e "${RED}❌ 역할 할당 실패: ${ASSIGNMENT_COUNT}개${NC}"
    echo -e "${YELLOW}⚠️  assignAdminRoleToUser() 메서드가 실행되지 않았을 수 있습니다.${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ 사용자 ID 조회 실패${NC}"
  exit 1
fi
echo ""

# ============================================
# 최종 결과
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 전체 사이클 검증 완료${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo -e "${YELLOW}검증 결과 요약:${NC}"
echo "  ✅ 테넌트 생성: 성공"
echo "  ✅ 역할 생성: ${ROLE_COUNT}개"
echo "  ✅ 대시보드 생성: ${DASHBOARD_COUNT}개"
echo "  ✅ 관리자 계정 생성: 성공"
echo "  ✅ 역할 할당: ${ASSIGNMENT_COUNT}개"
echo ""
echo -e "${YELLOW}테스트 데이터:${NC}"
echo "  - Tenant ID: ${TEST_TENANT_ID}"
echo "  - Request ID: ${REQUEST_ID}"
echo "  - Email: ${TEST_EMAIL}"
echo "  - Password: ${TEST_PASSWORD}"
echo ""
echo -e "${YELLOW}다음 단계:${NC}"
echo "  1. 프론트엔드에서 로그인 테스트"
echo "  2. 대시보드 접근 확인"
echo "  3. 역할 기반 권한 확인"
echo ""


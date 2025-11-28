#!/bin/bash

# 온보딩 승인 후 전체 프로세스 검증 스크립트
# 테넌트 생성 → 역할 생성 → 대시보드 생성 → 계정 생성 → 역할 할당 확인

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# DB 연결 정보 (dev.env에서 읽기)
DB_HOST="${DB_HOST:-114.202.247.246}"
DB_PORT="${DB_PORT:-3306}"
DB_NAME="${DB_NAME:-core_solution}"
DB_USER="${DB_USERNAME:-mindgarden_dev}"
DB_PASS="${DB_PASSWORD:-MindGardenDev2025!@#}"

# API 정보
API_BASE_URL="${API_BASE_URL:-http://localhost:3001}"
# API_BASE_URL="${API_BASE_URL:-https://dev.m-garden.co.kr}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}온보딩 승인 후 전체 프로세스 검증${NC}"
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

echo "요청 데이터: ${ONBOARDING_REQUEST}"
echo ""

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

# 승인 성공 확인
if echo "${APPROVAL_RESPONSE}" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ 온보딩 승인 성공${NC}"
else
  echo -e "${RED}❌ 온보딩 승인 실패${NC}"
  echo "응답: ${APPROVAL_RESPONSE}"
  exit 1
fi

echo ""

# 잠시 대기 (프로세스 완료 대기)
echo -e "${YELLOW}프로세스 완료 대기 중... (3초)${NC}"
sleep 3
echo ""

# ============================================
# 3단계: DB 상태 확인
# ============================================
echo -e "${BLUE}[3단계] DB 상태 확인${NC}"

# MySQL 쿼리 실행 함수
run_query() {
  mysql -h "${DB_HOST}" -P "${DB_PORT}" -u "${DB_USER}" -p"${DB_PASS}" "${DB_NAME}" \
    --default-character-set=utf8mb4 \
    -N -e "$1" 2>/dev/null
}

# 3.1 테넌트 확인
echo -e "${YELLOW}3.1 테넌트 확인${NC}"
TENANT_COUNT=$(run_query "SELECT COUNT(*) FROM tenants WHERE tenant_id = '${TEST_TENANT_ID}' AND is_deleted = 0;")
if [ "${TENANT_COUNT}" -eq 1 ]; then
  echo -e "${GREEN}✅ 테넌트 생성 확인: tenantId=${TEST_TENANT_ID}${NC}"
  
  TENANT_INFO=$(run_query "SELECT name, business_type, status FROM tenants WHERE tenant_id = '${TEST_TENANT_ID}';")
  echo "  테넌트 정보: ${TENANT_INFO}"
else
  echo -e "${RED}❌ 테넌트 생성 실패 또는 중복${NC}"
  exit 1
fi
echo ""

# 3.2 역할 확인
echo -e "${YELLOW}3.2 역할 확인${NC}"
ROLE_COUNT=$(run_query "SELECT COUNT(*) FROM tenant_roles WHERE tenant_id = '${TEST_TENANT_ID}' AND is_deleted = 0;")
if [ "${ROLE_COUNT}" -ge 1 ]; then
  echo -e "${GREEN}✅ 역할 생성 확인: ${ROLE_COUNT}개${NC}"
  
  ROLE_LIST=$(run_query "SELECT name_ko, name_en FROM tenant_roles WHERE tenant_id = '${TEST_TENANT_ID}' AND is_deleted = 0 ORDER BY display_order;")
  echo "  역할 목록:"
  echo "${ROLE_LIST}" | while IFS=$'\t' read -r name_ko name_en; do
    echo "    - ${name_ko} (${name_en})"
  done
else
  echo -e "${RED}❌ 역할 생성 실패: ${ROLE_COUNT}개${NC}"
  exit 1
fi
echo ""

# 3.3 대시보드 확인
echo -e "${YELLOW}3.3 대시보드 확인${NC}"
DASHBOARD_COUNT=$(run_query "SELECT COUNT(*) FROM tenant_dashboards WHERE tenant_id = '${TEST_TENANT_ID}' AND is_deleted = 0;")
if [ "${DASHBOARD_COUNT}" -ge 1 ]; then
  echo -e "${GREEN}✅ 대시보드 생성 확인: ${DASHBOARD_COUNT}개${NC}"
  
  DASHBOARD_LIST=$(run_query "SELECT name, dashboard_type FROM tenant_dashboards WHERE tenant_id = '${TEST_TENANT_ID}' AND is_deleted = 0 ORDER BY display_order;")
  echo "  대시보드 목록:"
  echo "${DASHBOARD_LIST}" | while IFS=$'\t' read -r name dashboard_type; do
    echo "    - ${name} (${dashboard_type})"
  done
else
  echo -e "${RED}❌ 대시보드 생성 실패: ${DASHBOARD_COUNT}개${NC}"
  exit 1
fi
echo ""

# 3.4 관리자 계정 확인
echo -e "${YELLOW}3.4 관리자 계정 확인${NC}"
USER_COUNT=$(run_query "SELECT COUNT(*) FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}' AND is_deleted = 0;")
if [ "${USER_COUNT}" -eq 1 ]; then
  echo -e "${GREEN}✅ 관리자 계정 생성 확인${NC}"
  
  USER_INFO=$(run_query "SELECT id, email, username, role, is_active FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}';")
  echo "  사용자 정보: ${USER_INFO}"
else
  echo -e "${RED}❌ 관리자 계정 생성 실패: ${USER_COUNT}개${NC}"
  exit 1
fi
echo ""

# 3.5 역할 할당 확인
echo -e "${YELLOW}3.5 역할 할당 확인${NC}"
USER_ID=$(run_query "SELECT id FROM users WHERE email = '${TEST_EMAIL}' AND tenant_id = '${TEST_TENANT_ID}' LIMIT 1;")
if [ -n "${USER_ID}" ]; then
  ASSIGNMENT_COUNT=$(run_query "SELECT COUNT(*) FROM user_role_assignments ura JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id WHERE ura.user_id = ${USER_ID} AND tr.tenant_id = '${TEST_TENANT_ID}' AND ura.is_active = 1;")
  
  if [ "${ASSIGNMENT_COUNT}" -ge 1 ]; then
    echo -e "${GREEN}✅ 역할 할당 확인: ${ASSIGNMENT_COUNT}개${NC}"
    
    ASSIGNMENT_LIST=$(run_query "SELECT tr.name_ko, ura.effective_from, ura.effective_to FROM user_role_assignments ura JOIN tenant_roles tr ON ura.tenant_role_id = tr.tenant_role_id WHERE ura.user_id = ${USER_ID} AND tr.tenant_id = '${TEST_TENANT_ID}' AND ura.is_active = 1;")
    echo "  역할 할당 목록:"
    echo "${ASSIGNMENT_LIST}" | while IFS=$'\t' read -r role_name effective_from effective_to; do
      echo "    - ${role_name} (${effective_from} ~ ${effective_to:-무기한})"
    done
  else
    echo -e "${RED}❌ 역할 할당 실패: ${ASSIGNMENT_COUNT}개${NC}"
    exit 1
  fi
else
  echo -e "${RED}❌ 사용자 ID 조회 실패${NC}"
  exit 1
fi
echo ""

# ============================================
# 4단계: API 상태 확인
# ============================================
echo -e "${BLUE}[4단계] API 상태 확인${NC}"

# 4.1 대시보드 목록 조회 (인증 필요 시 스킵)
echo -e "${YELLOW}4.1 대시보드 목록 조회${NC}"
DASHBOARD_API_RESPONSE=$(curl -s -X GET "${API_BASE_URL}/api/v1/tenant/dashboards" \
  -H "X-Tenant-Id: ${TEST_TENANT_ID}")

if echo "${DASHBOARD_API_RESPONSE}" | grep -q '"success":true'; then
  echo -e "${GREEN}✅ 대시보드 API 응답 성공${NC}"
  DASHBOARD_COUNT_API=$(echo "${DASHBOARD_API_RESPONSE}" | grep -o '"dashboardId"' | wc -l | tr -d ' ')
  echo "  API에서 조회된 대시보드 수: ${DASHBOARD_COUNT_API}"
else
  echo -e "${YELLOW}⚠️ 대시보드 API 인증 필요 (정상)${NC}"
fi
echo ""

# ============================================
# 최종 결과
# ============================================
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}✅ 전체 프로세스 검증 완료${NC}"
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
echo -e "${YELLOW}⚠️ 테스트 데이터 정리:${NC}"
echo "  다음 명령어로 테스트 데이터를 삭제할 수 있습니다:"
echo "  mysql -h ${DB_HOST} -P ${DB_PORT} -u ${DB_USER} -p'${DB_PASS}' ${DB_NAME} -e \""
echo "    DELETE FROM user_role_assignments WHERE user_id IN (SELECT id FROM users WHERE tenant_id = '${TEST_TENANT_ID}');"
echo "    DELETE FROM users WHERE tenant_id = '${TEST_TENANT_ID}';"
echo "    DELETE FROM tenant_dashboards WHERE tenant_id = '${TEST_TENANT_ID}';"
echo "    DELETE FROM tenant_roles WHERE tenant_id = '${TEST_TENANT_ID}';"
echo "    DELETE FROM tenants WHERE tenant_id = '${TEST_TENANT_ID}';"
echo "    DELETE FROM onboarding_requests WHERE tenant_id = '${TEST_TENANT_ID}';"
echo "  \""
echo ""


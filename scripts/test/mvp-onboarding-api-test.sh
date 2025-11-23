#!/bin/bash
# MVP 온보딩 플로우 API 테스트 스크립트 (Bash)
# 1월 심사/발표를 위한 최소 기능 테스트

set -e

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
BUSINESS_TYPE="${BUSINESS_TYPE:-CONSULTATION}"
OPS_USERNAME="${OPS_USERNAME:-superadmin@mindgarden.com}"
OPS_PASSWORD="${OPS_PASSWORD:-admin123}"

# 타임스탬프 생성
TIMESTAMP=$(date +%s%3N)
TENANT_ID="test-${BUSINESS_TYPE}-${TIMESTAMP}"
TENANT_NAME="테스트 ${BUSINESS_TYPE} ${TIMESTAMP}"
EMAIL="admin@${BUSINESS_TYPE}-${TIMESTAMP}.com"
PASSWORD="test1234"

echo "=== MVP 온보딩 플로우 API 테스트 시작 ==="
echo "테넌트 ID: ${TENANT_ID}"
echo "이메일: ${EMAIL}"
echo ""

# Step 1: 온보딩 요청 생성
echo "1. 온보딩 요청 생성..."
REQUEST_RESPONSE=$(curl -s -X POST "${BASE_URL}/onboarding/requests" \
  -H "Content-Type: application/json" \
  -d "{
    \"tenantId\": \"${TENANT_ID}\",
    \"tenantName\": \"${TENANT_NAME}\",
    \"requestedBy\": \"${EMAIL}\",
    \"riskLevel\": \"LOW\",
    \"businessType\": \"${BUSINESS_TYPE}\",
    \"checklistJson\": \"{\\\"adminPassword\\\": \\\"${PASSWORD}\\\"}\",
    \"adminPassword\": \"${PASSWORD}\"
  }")

REQUEST_ID=$(echo ${REQUEST_RESPONSE} | jq -r '.data.id')

if [ -z "${REQUEST_ID}" ] || [ "${REQUEST_ID}" = "null" ]; then
  echo "  ❌ 온보딩 요청 생성 실패"
  echo "  응답: ${REQUEST_RESPONSE}"
  exit 1
fi

echo "  ✅ 온보딩 요청 생성 성공 (ID: ${REQUEST_ID})"

# Step 1.5: Ops Portal 로그인 (승인 API 인증 필요)
echo "1.5. Ops Portal 로그인..."
OPS_LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/ops/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"username\": \"${OPS_USERNAME}\",
    \"password\": \"${OPS_PASSWORD}\"
  }")

OPS_TOKEN=$(echo ${OPS_LOGIN_RESPONSE} | jq -r '.data.token // empty')
OPS_ACTOR_ID=$(echo ${OPS_LOGIN_RESPONSE} | jq -r '.data.actorId // empty')
OPS_ACTOR_ROLE=$(echo ${OPS_LOGIN_RESPONSE} | jq -r '.data.actorRole // empty')

if [ -z "${OPS_TOKEN}" ]; then
  echo "  ❌ Ops Portal 로그인 실패"
  echo "  응답: ${OPS_LOGIN_RESPONSE}"
  echo "  ⚠️  승인 API는 인증이 필요합니다."
  exit 1
fi

echo "  ✅ Ops Portal 로그인 성공"

# Step 2: 온보딩 승인
echo "2. 온보딩 승인..."
APPROVE_RESPONSE=$(curl -s -X POST "${BASE_URL}/onboarding/requests/${REQUEST_ID}/decision" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPS_TOKEN}" \
  -H "X-Actor-Id: ${OPS_ACTOR_ID}" \
  -H "X-Actor-Role: ${OPS_ACTOR_ROLE}" \
  -d "{
    \"status\": \"APPROVED\",
    \"actorId\": \"${OPS_ACTOR_ID}\",
    \"note\": \"MVP 테스트 승인\"
  }")

SUCCESS=$(echo ${APPROVE_RESPONSE} | jq -r '.success')

if [ "${SUCCESS}" != "true" ]; then
  echo "  ❌ 온보딩 승인 실패"
  echo "  응답: ${APPROVE_RESPONSE}"
  exit 1
fi

echo "  ✅ 온보딩 승인 성공"

# 잠시 대기 (프로시저 실행 시간)
echo "  ⏳ 테넌트 생성 대기 중..."
sleep 5

# Step 3: 테넌트 확인 (재시도 로직 포함)
echo "3. 테넌트 확인..."
MAX_RETRIES=5
RETRY_DELAY=3
TENANT_STATUS=""

for i in $(seq 1 ${MAX_RETRIES}); do
  TENANT_LIST_RESPONSE=$(curl -s "${BASE_URL}/ops/tenants" \
    -H "Authorization: Bearer ${OPS_TOKEN}" \
    -H "X-Actor-Id: ${OPS_ACTOR_ID}" \
    -H "X-Actor-Role: ${OPS_ACTOR_ROLE}")

  TENANT_STATUS=$(echo ${TENANT_LIST_RESPONSE} | jq -r ".data[] | select(.tenantId == \"${TENANT_ID}\") | .status")

  if [ -n "${TENANT_STATUS}" ] && [ "${TENANT_STATUS}" != "null" ]; then
    if [ "${TENANT_STATUS}" = "ACTIVE" ]; then
      echo "  ✅ 테넌트 확인 성공 (상태: ${TENANT_STATUS}, 시도: ${i}/${MAX_RETRIES})"
      break
    else
      echo "  ⚠️  테넌트 상태가 ACTIVE가 아님: ${TENANT_STATUS} (시도: ${i}/${MAX_RETRIES})"
      if [ ${i} -lt ${MAX_RETRIES} ]; then
        sleep ${RETRY_DELAY}
      fi
    fi
  else
    if [ ${i} -lt ${MAX_RETRIES} ]; then
      echo "  ⏳ 테넌트를 찾을 수 없음. 재시도 중... (${i}/${MAX_RETRIES})"
      sleep ${RETRY_DELAY}
    else
      echo "  ❌ 테넌트를 찾을 수 없음: ${TENANT_ID} (최대 재시도 횟수 초과)"
      echo "  📋 현재 테넌트 목록:"
      echo ${TENANT_LIST_RESPONSE} | jq -r '.data[]? | "    - \(.tenantId) (\(.tenantName))"' || echo "    (테넌트 목록이 비어있음)"
      exit 1
    fi
  fi
done

if [ -z "${TENANT_STATUS}" ] || [ "${TENANT_STATUS}" = "null" ] || [ "${TENANT_STATUS}" != "ACTIVE" ]; then
  echo "  ❌ 테넌트 확인 실패 (최대 재시도 횟수 초과)"
  exit 1
fi

# settings_json은 목록 API에 포함되지 않으므로 별도 확인 생략

# Step 4: 관리자 계정 로그인
echo "4. 관리자 계정 로그인..."
LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\"
  }")

TOKEN=$(echo ${LOGIN_RESPONSE} | jq -r '.data.token // empty')
USER_ROLE=$(echo ${LOGIN_RESPONSE} | jq -r '.data.user.role // empty')

if [ -z "${TOKEN}" ]; then
  echo "  ❌ 관리자 로그인 실패"
  echo "  응답: ${LOGIN_RESPONSE}"
  echo "  ⚠️  관리자 계정이 생성되지 않았을 수 있습니다."
  exit 1
fi

echo "  ✅ 관리자 로그인 성공 (역할: ${USER_ROLE})"

# Step 5: 대시보드 조회
echo "5. 대시보드 조회..."
DASHBOARD_RESPONSE=$(curl -s "${BASE_URL}/dashboards" \
  -H "Authorization: Bearer ${TOKEN}")

DASHBOARD_COUNT=$(echo ${DASHBOARD_RESPONSE} | jq -r '.data | length')
WIDGET_COUNT=$(echo ${DASHBOARD_RESPONSE} | jq -r '.data[0].dashboardConfig.widgets | length // 0')

if [ "${DASHBOARD_COUNT}" -eq 0 ]; then
  echo "  ❌ 대시보드가 생성되지 않음"
  exit 1
fi

echo "  ✅ 대시보드 조회 성공 (대시보드 수: ${DASHBOARD_COUNT})"
echo "  ✅ 위젯 확인 (위젯 수: ${WIDGET_COUNT})"

echo ""
echo "=== 테스트 완료 ==="
echo "테넌트 ID: ${TENANT_ID}"
echo "관리자 이메일: ${EMAIL}"
echo "비밀번호: ${PASSWORD}"


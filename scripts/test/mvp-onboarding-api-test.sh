#!/bin/bash
# MVP 온보딩 플로우 API 테스트 스크립트 (Bash)
# 1월 심사/발표를 위한 최소 기능 테스트

set -e

BASE_URL="${BASE_URL:-http://localhost:8080/api/v1}"
BUSINESS_TYPE="${BUSINESS_TYPE:-CONSULTATION}"

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
    \"businessType\": \"${BUSINESS_TYPE}\",
    \"checklistJson\": \"{\\\"adminPassword\\\": \\\"${PASSWORD}\\\"}\"
  }")

REQUEST_ID=$(echo ${REQUEST_RESPONSE} | jq -r '.data.id')

if [ -z "${REQUEST_ID}" ] || [ "${REQUEST_ID}" = "null" ]; then
  echo "  ❌ 온보딩 요청 생성 실패"
  echo "  응답: ${REQUEST_RESPONSE}"
  exit 1
fi

echo "  ✅ 온보딩 요청 생성 성공 (ID: ${REQUEST_ID})"

# Step 2: 온보딩 승인
echo "2. 온보딩 승인..."
APPROVE_RESPONSE=$(curl -s -X PUT "${BASE_URL}/onboarding/requests/${REQUEST_ID}/decide" \
  -H "Content-Type: application/json" \
  -d "{
    \"status\": \"APPROVED\",
    \"decidedBy\": \"system-admin\",
    \"decisionNote\": \"MVP 테스트 승인\"
  }")

SUCCESS=$(echo ${APPROVE_RESPONSE} | jq -r '.success')

if [ "${SUCCESS}" != "true" ]; then
  echo "  ❌ 온보딩 승인 실패"
  echo "  응답: ${APPROVE_RESPONSE}"
  exit 1
fi

echo "  ✅ 온보딩 승인 성공"

# 잠시 대기 (프로시저 실행 시간)
sleep 2

# Step 3: 테넌트 확인
echo "3. 테넌트 확인..."
TENANT_RESPONSE=$(curl -s "${BASE_URL}/tenants/${TENANT_ID}")

TENANT_STATUS=$(echo ${TENANT_RESPONSE} | jq -r '.data.status')
CONSULTATION_ENABLED=$(echo ${TENANT_RESPONSE} | jq -r '.data.settingsJson.features.consultation // false')
ACADEMY_ENABLED=$(echo ${TENANT_RESPONSE} | jq -r '.data.settingsJson.features.academy // false')

if [ "${TENANT_STATUS}" != "ACTIVE" ]; then
  echo "  ❌ 테넌트 상태가 ACTIVE가 아님: ${TENANT_STATUS}"
  exit 1
fi

echo "  ✅ 테넌트 확인 성공 (상태: ${TENANT_STATUS})"
echo "  ✅ settings_json features 확인:"
echo "    - consultation: ${CONSULTATION_ENABLED}"
echo "    - academy: ${ACADEMY_ENABLED}"

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


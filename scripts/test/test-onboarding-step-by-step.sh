#!/bin/bash
# 온보딩 플로우 단계별 테스트 스크립트

set -e

BASE_URL="https://ops.dev.e-trinity.co.kr/api/v1"
BUSINESS_TYPE="CONSULTATION"
OPS_USERNAME="superadmin@mindgarden.com"
OPS_PASSWORD="admin123"

# 타임스탬프 생성
TIMESTAMP=$(date +%s%3N)
TENANT_ID="test-${BUSINESS_TYPE}-${TIMESTAMP}"
TENANT_NAME="테스트 ${BUSINESS_TYPE} ${TIMESTAMP}"
EMAIL="admin@${BUSINESS_TYPE}-${TIMESTAMP}.com"
PASSWORD="test1234"

echo "=========================================="
echo "온보딩 플로우 단계별 테스트"
echo "=========================================="
echo "Base URL: ${BASE_URL}"
echo "테넌트 ID: ${TENANT_ID}"
echo "이메일: ${EMAIL}"
echo "=========================================="
echo ""

# Step 1: 온보딩 요청 생성
echo "[Step 1] 온보딩 요청 생성..."
REQUEST_BODY=$(cat <<EOF
{
  "tenantId": null,
  "tenantName": "${TENANT_NAME}",
  "requestedBy": "${EMAIL}",
  "riskLevel": "LOW",
  "businessType": "${BUSINESS_TYPE}",
  "checklistJson": "{\"adminPassword\": \"${PASSWORD}\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -k -X POST "${BASE_URL}/onboarding/requests" \
  -H "Content-Type: application/json" \
  -d "${REQUEST_BODY}")

echo "응답: ${REQUEST_RESPONSE}"
REQUEST_ID=$(echo ${REQUEST_RESPONSE} | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2 || echo "")

if [ -z "${REQUEST_ID}" ]; then
  # JSON 응답 파싱 시도
  REQUEST_ID=$(echo ${REQUEST_RESPONSE} | grep -oE '"id"\s*:\s*[0-9]+' | head -1 | grep -oE '[0-9]+' || echo "")
fi

if [ -z "${REQUEST_ID}" ]; then
  echo "❌ 온보딩 요청 생성 실패 - ID를 찾을 수 없습니다"
  echo "전체 응답:"
  echo "${REQUEST_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${REQUEST_RESPONSE}"
  exit 1
fi

echo "✅ 온보딩 요청 생성 성공 (ID: ${REQUEST_ID})"
echo ""

# Step 2: Ops Portal 로그인
echo "[Step 2] Ops Portal 로그인..."
OPS_LOGIN_BODY=$(cat <<EOF
{
  "username": "${OPS_USERNAME}",
  "password": "${OPS_PASSWORD}"
}
EOF
)

OPS_LOGIN_RESPONSE=$(curl -s -k -X POST "${BASE_URL}/ops/auth/login" \
  -H "Content-Type: application/json" \
  -d "${OPS_LOGIN_BODY}")

echo "응답: ${OPS_LOGIN_RESPONSE}"

OPS_TOKEN=$(echo ${OPS_LOGIN_RESPONSE} | grep -oE '"token"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
OPS_ACTOR_ID=$(echo ${OPS_LOGIN_RESPONSE} | grep -oE '"actorId"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
OPS_ACTOR_ROLE=$(echo ${OPS_LOGIN_RESPONSE} | grep -oE '"actorRole"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -z "${OPS_TOKEN}" ]; then
  echo "❌ Ops Portal 로그인 실패 - 토큰을 찾을 수 없습니다"
  echo "전체 응답:"
  echo "${OPS_LOGIN_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${OPS_LOGIN_RESPONSE}"
  exit 1
fi

echo "✅ Ops Portal 로그인 성공"
echo "  Actor ID: ${OPS_ACTOR_ID}"
echo "  Actor Role: ${OPS_ACTOR_ROLE}"
echo ""

# Step 3: 온보딩 승인
echo "[Step 3] 온보딩 승인..."
APPROVE_BODY=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "${OPS_ACTOR_ID}",
  "note": "MVP 테스트 승인"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -k -X POST "${BASE_URL}/onboarding/requests/${REQUEST_ID}/decision" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPS_TOKEN}" \
  -H "X-Actor-Id: ${OPS_ACTOR_ID}" \
  -H "X-Actor-Role: ${OPS_ACTOR_ROLE}" \
  -d "${APPROVE_BODY}")

echo "응답: ${APPROVE_RESPONSE}"

# 승인 후 생성된 tenantId 확인
CREATED_TENANT_ID=$(echo ${APPROVE_RESPONSE} | grep -oE '"tenantId"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -n "${CREATED_TENANT_ID}" ] && [ "${CREATED_TENANT_ID}" != "null" ]; then
  TENANT_ID="${CREATED_TENANT_ID}"
  echo "✅ 온보딩 승인 성공"
  echo "  생성된 테넌트 ID: ${TENANT_ID}"
else
  echo "⚠️  온보딩 승인 응답에서 tenantId를 찾을 수 없습니다"
  echo "전체 응답:"
  echo "${APPROVE_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${APPROVE_RESPONSE}"
fi
echo ""

# 잠시 대기
echo "⏳ 테넌트 생성 대기 중... (5초)"
sleep 5
echo ""

# Step 4: 테넌트 확인
echo "[Step 4] 테넌트 확인..."
MAX_RETRIES=5
RETRY_DELAY=3
TENANT_FOUND=false

for i in $(seq 1 ${MAX_RETRIES}); do
  TENANT_LIST_RESPONSE=$(curl -s -k "${BASE_URL}/ops/tenants" \
    -H "Authorization: Bearer ${OPS_TOKEN}" \
    -H "X-Actor-Id: ${OPS_ACTOR_ID}" \
    -H "X-Actor-Role: ${OPS_ACTOR_ROLE}")
  
  # tenantId로 테넌트 찾기
  if echo "${TENANT_LIST_RESPONSE}" | grep -q "\"tenantId\"\s*:\s*\"${TENANT_ID}\""; then
    TENANT_STATUS=$(echo ${TENANT_LIST_RESPONSE} | grep -A 10 "\"tenantId\"\s*:\s*\"${TENANT_ID}\"" | grep -oE '"status"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    TENANT_NAME_FOUND=$(echo ${TENANT_LIST_RESPONSE} | grep -A 10 "\"tenantId\"\s*:\s*\"${TENANT_ID}\"" | grep -oE '"name"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
    
    if [ -n "${TENANT_STATUS}" ]; then
      echo "✅ 테넌트 확인 성공 (시도: ${i}/${MAX_RETRIES})"
      echo "  테넌트 ID: ${TENANT_ID}"
      echo "  테넌트명: ${TENANT_NAME_FOUND}"
      echo "  상태: ${TENANT_STATUS}"
      TENANT_FOUND=true
      break
    fi
  fi
  
  if [ ${i} -lt ${MAX_RETRIES} ]; then
    echo "⏳ 테넌트를 찾을 수 없음. 재시도 중... (${i}/${MAX_RETRIES})"
    sleep ${RETRY_DELAY}
  fi
done

if [ "${TENANT_FOUND}" = "false" ]; then
  echo "❌ 테넌트를 찾을 수 없음: ${TENANT_ID} (최대 재시도 횟수 초과)"
  echo "전체 응답:"
  echo "${TENANT_LIST_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${TENANT_LIST_RESPONSE}"
  exit 1
fi
echo ""

# Step 5: 관리자 계정 로그인
echo "[Step 5] 관리자 계정 로그인..."
LOGIN_BODY=$(cat <<EOF
{
  "email": "${EMAIL}",
  "password": "${PASSWORD}"
}
EOF
)

LOGIN_RESPONSE=$(curl -s -k -X POST "${BASE_URL}/auth/login" \
  -H "Content-Type: application/json" \
  -d "${LOGIN_BODY}")

echo "응답: ${LOGIN_RESPONSE}"

TOKEN=$(echo ${LOGIN_RESPONSE} | grep -oE '"token"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")
USER_ROLE=$(echo ${LOGIN_RESPONSE} | grep -oE '"role"\s*:\s*"[^"]*"' | head -1 | cut -d'"' -f4 || echo "")

if [ -z "${TOKEN}" ]; then
  echo "❌ 관리자 로그인 실패 - 토큰을 찾을 수 없습니다"
  echo "전체 응답:"
  echo "${LOGIN_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${LOGIN_RESPONSE}"
  exit 1
fi

echo "✅ 관리자 로그인 성공"
echo "  역할: ${USER_ROLE}"
echo ""

# Step 6: 대시보드 조회
echo "[Step 6] 대시보드 조회..."
DASHBOARD_RESPONSE=$(curl -s -k "${BASE_URL}/dashboards" \
  -H "Authorization: Bearer ${TOKEN}")

echo "응답: ${DASHBOARD_RESPONSE}"

# 대시보드 개수 확인 (간단한 방법)
DASHBOARD_COUNT=$(echo ${DASHBOARD_RESPONSE} | grep -o '"id"' | wc -l || echo "0")

if [ "${DASHBOARD_COUNT}" -eq 0 ]; then
  echo "❌ 대시보드가 생성되지 않음"
  echo "전체 응답:"
  echo "${DASHBOARD_RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${DASHBOARD_RESPONSE}"
  exit 1
fi

echo "✅ 대시보드 조회 성공"
echo "  대시보드 수: ${DASHBOARD_COUNT}"
echo ""

echo "=========================================="
echo "✅ 모든 테스트 완료!"
echo "=========================================="
echo "테넌트 ID: ${TENANT_ID}"
echo "관리자 이메일: ${EMAIL}"
echo "비밀번호: ${PASSWORD}"
echo "=========================================="


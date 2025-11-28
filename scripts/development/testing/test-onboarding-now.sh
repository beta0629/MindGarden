#!/bin/bash
# 온보딩 테스트 - 서버가 준비되면 실행

BASE_URL="http://beta0629.cafe24.com:8080"
TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트테넌트${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@test.com"
ADMIN_PASSWORD="Test1234!@#"

echo "=========================================="
echo "🧪 온보딩 테스트"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo "이메일: $EMAIL"
echo ""

# 서버 연결 확인
echo "서버 연결 확인 중..."
if ! timeout 5 curl -s "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
    echo "⚠️ 서버에 연결할 수 없습니다. 서버가 아직 시작 중일 수 있습니다."
    echo ""
    echo "수동 테스트 방법:"
    echo "1. 브라우저에서 http://beta0629.cafe24.com:8080 접속 확인"
    echo "2. 온보딩 요청 생성:"
    echo "   POST ${BASE_URL}/api/v1/onboarding/requests"
    echo "   Body: {"
    echo "     \"tenantId\": \"${TENANT_ID}\","
    echo "     \"tenantName\": \"${TENANT_NAME}\","
    echo "     \"requestedBy\": \"${EMAIL}\","
    echo "     \"businessType\": \"CONSULTATION\","
    echo "     \"checklistJson\": \"{\\\"adminPassword\\\":\\\"${ADMIN_PASSWORD}\\\"}\""
    echo "   }"
    echo ""
    echo "3. 온보딩 승인:"
    echo "   POST ${BASE_URL}/api/v1/onboarding/requests/{REQUEST_ID}/decision"
    echo "   Body: {"
    echo "     \"status\": \"APPROVED\","
    echo "     \"actorId\": \"superadmin@mindgarden.com\","
    echo "     \"note\": \"테스트 승인\""
    echo "   }"
    echo ""
    exit 1
fi

echo "✅ 서버 연결 확인"
echo ""

# 온보딩 요청 생성
echo "온보딩 요청 생성 중..."
REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantId": "${TENANT_ID}",
  "tenantName": "${TENANT_NAME}",
  "requestedBy": "${EMAIL}",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")

echo "$REQUEST_RESPONSE" | head -20

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" = "null" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    exit 1
fi

echo ""
echo "✅ 온보딩 요청 생성 완료: ID=$REQUEST_ID"
echo ""

# 온보딩 승인
echo "온보딩 승인 중..."
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "테스트 승인"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
    -H "Content-Type: application/json" \
    -d "$APPROVE_PAYLOAD")

echo "$APPROVE_RESPONSE" | head -20

if echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
    echo ""
    echo "✅ 온보딩 승인 완료!"
    echo ""
    echo "=========================================="
    echo "✅ 테스트 완료"
    echo "=========================================="
    echo "테넌트 ID: $TENANT_ID"
    echo "이메일: $EMAIL"
    echo "비밀번호: $ADMIN_PASSWORD"
    echo ""
    echo "다음 단계: 프론트엔드에서 로그인 테스트"
else
    echo ""
    echo "❌ 온보딩 승인 실패"
    echo "$APPROVE_RESPONSE"
fi


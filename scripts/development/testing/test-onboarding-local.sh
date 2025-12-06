#!/bin/bash
# 온보딩 테스트 - 로컬 서버용
# 서버가 준비되면 자동으로 실행

BASE_URL="http://localhost:8080"
TIMESTAMP=$(date +%s)
# 표준 형식: tenant-{지역코드}-{업종코드}-{순번}
# 테스트용: tenantId는 null로 보내서 자동 생성되도록 함 (표준 준수)
TENANT_ID=""  # null로 보내서 TenantIdGenerator가 자동 생성하도록 함
TENANT_NAME="TestTenant${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@test.com"
ADMIN_PASSWORD="Test1234!@#"

echo "=========================================="
echo "🧪 Onboarding Test (Local)"
echo "=========================================="
echo "Tenant ID: Auto-generated (Standard format: tenant-{region}-{businessType}-{sequence})"
echo "Email: $EMAIL"
echo ""

# 서버 연결 확인 (최대 60초 대기)
echo "Checking server connection..."
MAX_WAIT=60
WAIT_COUNT=0
while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    if curl -s "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
        echo "✅ 서버 연결 확인"
        break
    fi
    echo "   Waiting for server... ($WAIT_COUNT/$MAX_WAIT seconds)"
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "⚠️ Cannot connect to server. Server may still be starting."
    echo ""
    echo "Manual test method:"
    echo "1. Check http://localhost:8080 in browser"
    echo "2. Create onboarding request:"
    echo "   POST ${BASE_URL}/api/v1/onboarding/requests"
    echo "   Body: {"
    echo "     \"tenantId\": \"${TENANT_ID}\","
    echo "     \"tenantName\": \"${TENANT_NAME}\","
    echo "     \"requestedBy\": \"${EMAIL}\","
    echo "     \"businessType\": \"CONSULTATION\","
    echo "     \"checklistJson\": \"{\\\"adminPassword\\\":\\\"${ADMIN_PASSWORD}\\\"}\""
    echo "   }"
    echo ""
    exit 1
fi

echo ""

# 온보딩 요청 생성
echo "Creating onboarding request..."
# tenantId는 null로 보내서 자동 생성되도록 함 (표준 준수)
REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantName": "${TENANT_NAME}",
  "requestedBy": "${EMAIL}",
  "businessType": "CONSULTATION",
  "riskLevel": "LOW",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json; charset=UTF-8" \
    -H "Accept: application/json; charset=UTF-8" \
    --data-raw "$REQUEST_PAYLOAD")

echo "$REQUEST_RESPONSE" | head -20

# UUID 형식의 ID 추출 (Java UUID 형식)
REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -oE '"id":"[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"' | head -1 | cut -d'"' -f4)

if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" = "null" ]; then
    echo "❌ Failed to create onboarding request"
    echo "Response: $REQUEST_RESPONSE"
    exit 1
fi

echo ""
echo "✅ Onboarding request created: ID=$REQUEST_ID"
echo ""

# 온보딩 승인
echo "Approving onboarding request..."
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "Test approval"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
    -H "Content-Type: application/json; charset=UTF-8" \
    -H "Accept: application/json; charset=UTF-8" \
    --data-raw "$APPROVE_PAYLOAD")

echo "$APPROVE_RESPONSE" | head -20

if echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
    echo ""
    echo "✅ Onboarding approval completed!"
    echo ""
    echo "=========================================="
    echo "✅ Test completed"
    echo "=========================================="
    echo "Tenant ID: Auto-generated (Standard format)"
    echo "Email: $EMAIL"
    echo "Password: $ADMIN_PASSWORD"
    echo ""
    echo "Next step: Test login from frontend"
else
    echo ""
    echo "❌ Onboarding approval failed"
    echo "$APPROVE_RESPONSE"
    exit 1
fi



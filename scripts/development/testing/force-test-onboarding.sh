#!/bin/bash
# 강제 온보딩 테스트 - 서버 연결 재시도

BASE_URL="http://beta0629.cafe24.com:8080"
TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트테넌트${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@test.com"
ADMIN_PASSWORD="Test1234!@#"

echo "=========================================="
echo "🧪 온보딩 강제 테스트"
echo "=========================================="
echo ""

# 서버 연결 재시도 (최대 5회)
MAX_RETRIES=5
RETRY_DELAY=3

for i in $(seq 1 $MAX_RETRIES); do
    echo "서버 연결 시도 $i/$MAX_RETRIES..."
    if timeout 5 curl -s "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
        echo "✅ 서버 연결 성공!"
        break
    else
        if [ $i -lt $MAX_RETRIES ]; then
            echo "⏳ 서버 대기 중... ($RETRY_DELAY초 후 재시도)"
            sleep $RETRY_DELAY
        else
            echo "❌ 서버 연결 실패 (최대 재시도 횟수 초과)"
            echo ""
            echo "서버 상태 확인 필요:"
            echo "  ssh root@beta0629.cafe24.com 'systemctl status mindgarden-dev'"
            exit 1
        fi
    fi
done

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

echo "응답: $REQUEST_RESPONSE"
echo ""

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" = "null" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    echo "전체 응답:"
    echo "$REQUEST_RESPONSE"
    exit 1
fi

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

echo "응답: $APPROVE_RESPONSE"
echo ""

if echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
    echo "✅ 온보딩 승인 완료!"
    echo ""
    echo "=========================================="
    echo "✅ 테스트 완료!"
    echo "=========================================="
    echo "테넌트 ID: $TENANT_ID"
    echo "온보딩 요청 ID: $REQUEST_ID"
    echo "이메일: $EMAIL"
    echo "비밀번호: $ADMIN_PASSWORD"
    echo ""
    echo "다음 단계: 프론트엔드에서 로그인 테스트"
    echo "  - 이메일: $EMAIL"
    echo "  - 비밀번호: $ADMIN_PASSWORD"
    echo "  - 테넌트 ID: $TENANT_ID"
else
    echo "❌ 온보딩 승인 실패"
    echo "전체 응답:"
    echo "$APPROVE_RESPONSE"
    exit 1
fi


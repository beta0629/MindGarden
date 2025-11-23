#!/bin/bash
# 빠른 온보딩 테스트 - 프로시저 확인 후 테스트 진행

BASE_URL="http://beta0629.cafe24.com:8080"
TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트 테넌트 ${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@example.com"

echo "=========================================="
echo "🧪 빠른 온보딩 테스트"
echo "=========================================="
echo ""

# 1. 서버 상태 확인
echo "1. 서버 상태 확인..."
SERVER_STATUS=$(curl -s "${BASE_URL}/api/health/server")
if echo "$SERVER_STATUS" | grep -q "healthy"; then
    echo "✅ 서버 정상"
else
    echo "❌ 서버 오류"
    echo "$SERVER_STATUS"
    exit 1
fi
echo ""

# 2. 프로시저 확인
echo "2. 프로시저 확인..."
PROC_HEALTH=$(curl -s "${BASE_URL}/api/health/procedures/create-or-activate-tenant")
echo "$PROC_HEALTH" | grep -o '"exists":[^,]*' || echo "프로시저 상태 확인 중..."
echo ""

# 3. 온보딩 요청 생성
echo "3. 온보딩 요청 생성..."
REQUEST_PAYLOAD="{\"tenantId\":\"${TENANT_ID}\",\"tenantName\":\"${TENANT_NAME}\",\"requestedBy\":\"${EMAIL}\",\"businessType\":\"CONSULTATION\",\"checklistJson\":\"{\\\"adminPassword\\\":\\\"Test1234!@#\\\"}\"}"

REQUEST_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")

echo "$REQUEST_RESPONSE"
REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -n "$REQUEST_ID" ] && [ "$REQUEST_ID" != "null" ]; then
    echo "✅ 온보딩 요청 생성 완료: ID=$REQUEST_ID"
    
    # 4. 온보딩 승인
    echo ""
    echo "4. 온보딩 승인..."
    APPROVE_PAYLOAD="{\"status\":\"APPROVED\",\"actorId\":\"superadmin@mindgarden.com\",\"note\":\"테스트 승인\"}"
    
    APPROVE_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
        -H "Content-Type: application/json" \
        -d "$APPROVE_PAYLOAD")
    
    echo "$APPROVE_RESPONSE"
    
    if echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
        echo "✅ 온보딩 승인 완료"
        echo ""
        echo "=========================================="
        echo "✅ 테스트 완료!"
        echo "=========================================="
        echo "테넌트 ID: $TENANT_ID"
        echo "온보딩 요청 ID: $REQUEST_ID"
        echo "이메일: $EMAIL"
        echo "비밀번호: Test1234!@#"
        echo ""
        echo "다음 단계: 프론트엔드에서 로그인 테스트"
    else
        echo "❌ 온보딩 승인 실패"
        echo "$APPROVE_RESPONSE"
    fi
else
    echo "❌ 온보딩 요청 생성 실패"
    echo "$REQUEST_RESPONSE"
fi


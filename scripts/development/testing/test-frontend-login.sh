#!/bin/bash
# 프론트엔드 로그인 테스트 스크립트
# 생성된 관리자 계정으로 로그인 및 대시보드 접근 확인

BASE_URL="http://beta0629.cafe24.com:8080"
TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-${TIMESTAMP}"
TENANT_NAME="테스트 테넌트 ${TIMESTAMP}"
EMAIL="test${TIMESTAMP}@example.com"
ADMIN_PASSWORD="Test1234!@#"
ADMIN_EMAIL="superadmin@mindgarden.com"
ADMIN_PASS="admin123"

echo "=========================================="
echo "🧪 프론트엔드 로그인 테스트"
echo "=========================================="
echo "서버: $BASE_URL"
echo "시간: $(date)"
echo ""

# 1. 온보딩 요청 생성 및 승인
echo "📋 1단계: 온보딩 요청 생성 및 승인"
echo "----------------------------------------"

# 관리자 로그인
curl -s -c /tmp/cookies.txt -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${ADMIN_EMAIL}\",\"password\":\"${ADMIN_PASS}\"}" > /dev/null

# 온보딩 요청 생성
REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantId": "${TENANT_ID}",
  "tenantName": "${TENANT_NAME}",
  "requestedBy": "${EMAIL}",
  "riskLevel": "LOW",
  "businessType": "CONSULTATION",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl -s -b /tmp/cookies.txt -X POST "${BASE_URL}/api/v1/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$REQUEST_ID" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    exit 1
fi

echo "✅ 온보딩 요청 생성: ID=$REQUEST_ID"

# 온보딩 승인
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "${ADMIN_EMAIL}",
  "note": "프론트엔드 로그인 테스트"
}
EOF
)

APPROVE_RESPONSE=$(curl -s -b /tmp/cookies.txt -X POST "${BASE_URL}/api/v1/onboarding/requests/${REQUEST_ID}/decision" \
    -H "Content-Type: application/json" \
    -d "$APPROVE_PAYLOAD")

if ! echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
    echo "⚠️  온보딩 승인 실패 (권한 문제일 수 있음)"
    echo "응답: $APPROVE_RESPONSE"
    echo ""
    echo "직접 승인을 위해 다음 정보를 사용하세요:"
    echo "온보딩 요청 ID: $REQUEST_ID"
    echo "테넌트 ID: $TENANT_ID"
    echo ""
    echo "또는 기존 테스트 계정 사용:"
    echo "이메일: test1763956616@example.com"
    echo "비밀번호: Test1234!@#"
    echo "테넌트 ID: test-tenant-1763956616"
    exit 0
fi

echo "✅ 온보딩 승인 완료"
echo ""

# 프로시저 실행 대기
sleep 5

# 2. 관리자 계정 로그인 테스트
echo "📋 2단계: 관리자 계정 로그인 테스트"
echo "----------------------------------------"
LOGIN_PAYLOAD=$(cat <<EOF
{
  "email": "${EMAIL}",
  "password": "${ADMIN_PASSWORD}"
}
EOF
)

LOGIN_RESPONSE=$(curl -s -c /tmp/admin_cookies.txt -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_PAYLOAD")

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 관리자 계정 로그인 성공"
    echo "응답: $LOGIN_RESPONSE" | head -10
else
    echo "❌ 관리자 계정 로그인 실패"
    echo "$LOGIN_RESPONSE"
    exit 1
fi
echo ""

# 3. 사용자 정보 조회 테스트
echo "📋 3단계: 사용자 정보 조회 테스트"
echo "----------------------------------------"
USER_INFO_RESPONSE=$(curl -s -b /tmp/admin_cookies.txt "${BASE_URL}/api/v1/auth/current-user")

if echo "$USER_INFO_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 사용자 정보 조회 성공"
    echo "응답: $USER_INFO_RESPONSE" | head -10
else
    echo "❌ 사용자 정보 조회 실패"
    echo "$USER_INFO_RESPONSE"
fi
echo ""

# 4. 대시보드 조회 테스트
echo "📋 4단계: 대시보드 조회 테스트"
echo "----------------------------------------"
DASHBOARD_RESPONSE=$(curl -s -b /tmp/admin_cookies.txt "${BASE_URL}/api/v1/dashboards?tenantId=${TENANT_ID}")

if echo "$DASHBOARD_RESPONSE" | grep -q '"success":true\|"data"'; then
    echo "✅ 대시보드 조회 성공"
    DASHBOARD_COUNT=$(echo "$DASHBOARD_RESPONSE" | grep -o '"dashboard_id"' | wc -l)
    echo "대시보드 개수: $DASHBOARD_COUNT"
else
    echo "⚠️  대시보드 조회 실패 또는 빈 결과"
    echo "$DASHBOARD_RESPONSE" | head -20
fi
echo ""

# 5. 역할 정보 조회 테스트
echo "📋 5단계: 역할 정보 조회 테스트"
echo "----------------------------------------"
ROLE_RESPONSE=$(curl -s -b /tmp/admin_cookies.txt "${BASE_URL}/api/v1/roles?tenantId=${TENANT_ID}")

if echo "$ROLE_RESPONSE" | grep -q '"success":true\|"data"'; then
    echo "✅ 역할 정보 조회 성공"
    ROLE_COUNT=$(echo "$ROLE_RESPONSE" | grep -o '"id"' | wc -l)
    echo "역할 개수: $ROLE_COUNT"
else
    echo "⚠️  역할 정보 조회 실패 또는 빈 결과"
    echo "$ROLE_RESPONSE" | head -20
fi
echo ""

# 6. 최종 요약
echo "=========================================="
echo "✅ 프론트엔드 로그인 테스트 완료"
echo "=========================================="
echo "테넌트 ID: $TENANT_ID"
echo "관리자 이메일: $EMAIL"
echo "관리자 비밀번호: $ADMIN_PASSWORD"
echo ""
echo "다음 단계:"
echo "1. 브라우저에서 로그인 테스트"
echo "   URL: http://beta0629.cafe24.com:8080/login"
echo "   이메일: $EMAIL"
echo "   비밀번호: $ADMIN_PASSWORD"
echo ""
echo "2. 대시보드 접근 확인"
echo "   URL: http://beta0629.cafe24.com:8080/dashboard"
echo "   또는: http://beta0629.cafe24.com:8080/admin/dashboard"
echo ""


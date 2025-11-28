#!/bin/bash
# Ops Portal 로그인 테스트 스크립트

BASE_URL="http://beta0629.cafe24.com:8080"
OPS_USERNAME="${OPS_USERNAME:-superadmin@mindgarden.com}"
OPS_PASSWORD="${OPS_PASSWORD:-admin123}"

echo "=========================================="
echo "🧪 Ops Portal 로그인 테스트"
echo "=========================================="
echo "서버: $BASE_URL"
echo "사용자명: $OPS_USERNAME"
echo "시간: $(date)"
echo ""

# 1. Ops Portal 로그인 테스트
echo "📋 1단계: Ops Portal 로그인"
echo "----------------------------------------"
LOGIN_PAYLOAD=$(cat <<EOF
{
  "username": "${OPS_USERNAME}",
  "password": "${OPS_PASSWORD}"
}
EOF
)

LOGIN_RESPONSE=$(curl -s -X POST "${BASE_URL}/api/v1/ops/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_PAYLOAD")

echo "응답: $LOGIN_RESPONSE"
echo ""

# 토큰 추출
TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    # ApiResponse 래퍼 처리
    if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
        TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"data":{[^}]*"token":"[^"]*' | grep -o '"token":"[^"]*' | cut -d'"' -f4)
    fi
fi

if [ -z "$TOKEN" ]; then
    echo "❌ 로그인 실패: 토큰을 받을 수 없습니다"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ 로그인 성공: 토큰 발급됨 (길이: ${#TOKEN})"
echo ""

# 2. Ops Portal API 접근 테스트
echo "📋 2단계: Ops Portal API 접근 테스트"
echo "----------------------------------------"

# 온보딩 요청 목록 조회 (올바른 경로)
ONBOARDING_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/onboarding/requests" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")

if echo "$ONBOARDING_RESPONSE" | grep -q '"success":true\|"data"'; then
    echo "✅ 온보딩 요청 목록 조회 성공"
    echo "응답: $ONBOARDING_RESPONSE" | head -10
else
    echo "❌ 온보딩 요청 목록 조회 실패"
    echo "응답: $ONBOARDING_RESPONSE"
fi
echo ""

# 테넌트 목록 조회
TENANT_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/ops/tenants" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")

if echo "$TENANT_RESPONSE" | grep -q '"success":true\|"data"'; then
    echo "✅ 테넌트 목록 조회 성공"
    echo "응답: $TENANT_RESPONSE" | head -10
else
    echo "❌ 테넌트 목록 조회 실패"
    echo "응답: $TENANT_RESPONSE"
fi
echo ""

# 3. 권한 체크 테스트
echo "📋 3단계: 권한 체크 테스트"
echo "----------------------------------------"

# 현재 사용자 정보 조회
USER_INFO_RESPONSE=$(curl -s -X GET "${BASE_URL}/api/v1/ops/auth/me" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json")

if echo "$USER_INFO_RESPONSE" | grep -q '"success":true\|"data"'; then
    echo "✅ 사용자 정보 조회 성공"
    echo "응답: $USER_INFO_RESPONSE" | head -10
else
    echo "⚠️  사용자 정보 조회 실패 또는 엔드포인트 없음"
    echo "응답: $USER_INFO_RESPONSE"
fi
echo ""

# 4. 최종 요약
echo "=========================================="
echo "✅ Ops Portal 로그인 테스트 완료"
echo "=========================================="
echo "로그인: $([ -n "$TOKEN" ] && echo '✅ 성공' || echo '❌ 실패')"
echo ""


#!/bin/bash
# 대시보드 상세 페이지 권한 테스트

BASE_URL="http://localhost:8080"
TIMESTAMP=$(date +%s)
TENANT_ID="test-tenant-category-1763957121"
EMAIL="test-category1763957121@example.com"
ADMIN_PASSWORD="Test1234!@#"

echo "=========================================="
echo "🧪 대시보드 상세 페이지 권한 테스트"
echo "=========================================="
echo "서버: $BASE_URL"
echo "시간: $(date)"
echo ""

# 1. 관리자 계정 로그인
echo "📋 1단계: 관리자 계정 로그인"
echo "----------------------------------------"
LOGIN_PAYLOAD=$(cat <<EOF
{
  "email": "${EMAIL}",
  "password": "${ADMIN_PASSWORD}"
}
EOF
)

LOGIN_RESPONSE=$(curl -s -c /tmp/dashboard_cookies.txt -X POST "${BASE_URL}/api/v1/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_PAYLOAD")

if ! echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "❌ 관리자 계정 로그인 실패"
    echo "$LOGIN_RESPONSE"
    exit 1
fi

echo "✅ 관리자 계정 로그인 성공"
echo ""

# 2. 대시보드 목록 조회
echo "📋 2단계: 대시보드 목록 조회"
echo "----------------------------------------"
DASHBOARD_LIST_RESPONSE=$(curl -s -b /tmp/dashboard_cookies.txt "${BASE_URL}/api/v1/tenant/dashboards" \
    -H "Content-Type: application/json")

if echo "$DASHBOARD_LIST_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 대시보드 목록 조회 성공"
    
    # 첫 번째 대시보드 ID 추출
    DASHBOARD_ID=$(echo "$DASHBOARD_LIST_RESPONSE" | grep -o '"dashboardId":"[^"]*' | head -1 | cut -d'"' -f4)
    
    if [ -n "$DASHBOARD_ID" ]; then
        echo "대시보드 ID: $DASHBOARD_ID"
    else
        echo "⚠️  대시보드 ID를 찾을 수 없습니다"
        echo "응답: $DASHBOARD_LIST_RESPONSE" | head -20
        exit 1
    fi
else
    echo "❌ 대시보드 목록 조회 실패"
    echo "$DASHBOARD_LIST_RESPONSE"
    exit 1
fi
echo ""

# 3. 대시보드 상세 조회
echo "📋 3단계: 대시보드 상세 조회"
echo "----------------------------------------"
if [ -z "$DASHBOARD_ID" ]; then
    echo "❌ 대시보드 ID가 없어서 상세 조회를 건너뜁니다"
    exit 1
fi

DASHBOARD_DETAIL_RESPONSE=$(curl -s -b /tmp/dashboard_cookies.txt "${BASE_URL}/api/v1/tenant/dashboards/${DASHBOARD_ID}" \
    -H "Content-Type: application/json")

if echo "$DASHBOARD_DETAIL_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 대시보드 상세 조회 성공"
    echo "응답: $DASHBOARD_DETAIL_RESPONSE" | head -10
else
    echo "❌ 대시보드 상세 조회 실패"
    echo "응답: $DASHBOARD_DETAIL_RESPONSE"
    
    # 오류 분석
    if echo "$DASHBOARD_DETAIL_RESPONSE" | grep -q "접근 권한\|ACCESS_DENIED\|AccessDenied"; then
        echo ""
        echo "🔍 권한 오류 감지:"
        echo "  - 테넌트 접근 권한 문제일 수 있습니다"
        echo "  - TenantContextHolder에 tenantId가 설정되지 않았을 수 있습니다"
    fi
    
    exit 1
fi
echo ""

# 4. 현재 사용자 대시보드 조회
echo "📋 4단계: 현재 사용자 대시보드 조회"
echo "----------------------------------------"
CURRENT_DASHBOARD_RESPONSE=$(curl -s -b /tmp/dashboard_cookies.txt "${BASE_URL}/api/v1/tenant/dashboards/current" \
    -H "Content-Type: application/json")

if echo "$CURRENT_DASHBOARD_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 현재 사용자 대시보드 조회 성공"
    echo "응답: $CURRENT_DASHBOARD_RESPONSE" | head -10
else
    echo "⚠️  현재 사용자 대시보드 조회 실패 또는 없음"
    echo "응답: $CURRENT_DASHBOARD_RESPONSE"
fi
echo ""

# 5. 최종 요약
echo "=========================================="
echo "✅ 대시보드 상세 페이지 권한 테스트 완료"
echo "=========================================="
echo "대시보드 목록: $([ -n "$DASHBOARD_ID" ] && echo '✅ 성공' || echo '❌ 실패')"
echo "대시보드 상세: $(echo "$DASHBOARD_DETAIL_RESPONSE" | grep -q '"success":true' && echo '✅ 성공' || echo '❌ 실패')"
echo ""


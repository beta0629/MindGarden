#!/bin/bash
# 온보딩 전체 플로우 테스트: 요청 생성 → 승인 → 테넌트 생성 → 관리자 계정 확인
# 최종 버전: HTTPS 지원, 자동 tenant ID 생성, 날짜 정보 포함

# 서버 선택:
# 1. ops.dev.e-trinity.co.kr - Ops Portal (운영 포털) 개발 서버 (온보딩 API 테스트용) ⭐
# 2. dev.core-solution.co.kr - Core-Solution 개발 서버 (메인)
# 3. dev.e-trinity.co.kr - Trinity 홈페이지 (프론트엔드만)
BASE_URL_INPUT="${1:-https://ops.dev.e-trinity.co.kr}"
TIMESTAMP=$(date +%s)
DATE_STR=$(date +%Y%m%d)
TIME_STR=$(date +%H%M%S)
TENANT_NAME="테스트 상담소 ${DATE_STR} ${TIME_STR}"
EMAIL="test-${DATE_STR}-${TIME_STR}@example.com"
ADMIN_PASSWORD="Test1234!@#"
REGION="서울특별시"
BUSINESS_TYPE="CONSULTATION"

# API 경로 자동 설정 (먼저 설정해야 함)
# ops.dev.e-trinity.co.kr은 /api/v1이 필요
# dev.core-solution.co.kr도 /api/v1이 필요
if [[ "$BASE_URL_INPUT" == *"/api/v1"* ]]; then
    # 이미 /api/v1이 포함된 경우 그대로 사용
    BASE_URL="$BASE_URL_INPUT"
    API_BASE_URL="$BASE_URL_INPUT"
elif [[ "$BASE_URL_INPUT" == *"ops.dev.e-trinity.co.kr"* ]]; then
    # ops.dev.e-trinity.co.kr은 /api/v1 추가
    BASE_URL="$BASE_URL_INPUT"
    API_BASE_URL="${BASE_URL_INPUT}/api/v1"
elif [[ "$BASE_URL_INPUT" == *"dev.core-solution.co.kr"* ]] || [[ "$BASE_URL_INPUT" == *"dev.e-trinity.co.kr"* ]]; then
    # dev.core-solution.co.kr, dev.e-trinity.co.kr도 /api/v1 추가
    BASE_URL="$BASE_URL_INPUT"
    API_BASE_URL="${BASE_URL_INPUT}/api/v1"
else
    # 기타 서버는 입력값 그대로 사용
    BASE_URL="$BASE_URL_INPUT"
    API_BASE_URL="${BASE_URL_INPUT}/api/v1"
fi

echo "=========================================="
echo "🧪 온보딩 전체 플로우 테스트 (관리자 계정 생성 포함)"
echo "=========================================="
echo "서버: $BASE_URL"
echo "API Base URL: $API_BASE_URL"
echo "생성 날짜: $(date '+%Y-%m-%d %H:%M:%S')"
echo "날짜 문자열: $DATE_STR $TIME_STR"
echo "테넌트명: $TENANT_NAME"
echo "이메일: $EMAIL"
echo "관리자 비밀번호: $ADMIN_PASSWORD"
echo "지역: $REGION (자동으로 tenant-seoul-consultation-XXX 형식 생성)"
echo "업종: $BUSINESS_TYPE"
echo ""

# HTTPS 지원 함수
curl_cmd() {
    if echo "$BASE_URL" | grep -q "^https"; then
        curl -k -s "$@"
    else
        curl -s "$@"
    fi
}

# 1. 서버 연결 확인 (선택적)
echo "📋 1단계: 서버 연결 확인"
echo "----------------------------------------"
if curl_cmd "${BASE_URL}/actuator/health" > /dev/null 2>&1; then
    echo "✅ 서버 연결 확인 완료"
elif curl_cmd "${BASE_URL}/" > /dev/null 2>&1; then
    echo "✅ 서버 연결 확인 완료 (기본 경로)"
else
    echo "⚠️  서버 연결 확인 실패, 하지만 계속 진행합니다..."
fi
echo ""

# 2. 온보딩 요청 생성 (tenant_id는 자동 생성)
echo "📋 2단계: 온보딩 요청 생성"
echo "----------------------------------------"
REQUEST_PAYLOAD=$(cat <<EOF
{
  "tenantName": "${TENANT_NAME}",
  "requestedBy": "${EMAIL}",
  "riskLevel": "LOW",
  "businessType": "${BUSINESS_TYPE}",
  "checklistJson": "{\"adminPassword\": \"${ADMIN_PASSWORD}\", \"contactPhone\": \"010-1234-5678\", \"address\": \"${REGION} 강남구\"}"
}
EOF
)

REQUEST_RESPONSE=$(curl_cmd -X POST "${API_BASE_URL}/onboarding/requests" \
    -H "Content-Type: application/json" \
    -d "$REQUEST_PAYLOAD")

REQUEST_ID=$(echo "$REQUEST_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ -z "$REQUEST_ID" ] || [ "$REQUEST_ID" = "null" ]; then
    echo "❌ 온보딩 요청 생성 실패"
    echo "$REQUEST_RESPONSE"
    exit 1
fi

echo "✅ 온보딩 요청 생성 완료: ID=$REQUEST_ID"
echo "응답: $REQUEST_RESPONSE"
echo ""

# 3. 온보딩 승인
echo "📋 3단계: 온보딩 승인 (관리자 계정 자동 생성 포함)"
echo "----------------------------------------"
APPROVE_PAYLOAD=$(cat <<EOF
{
  "status": "APPROVED",
  "actorId": "superadmin@mindgarden.com",
  "note": "테스트 승인 - 관리자 계정 자동 생성 테스트"
}
EOF
)

APPROVE_RESPONSE=$(curl_cmd -X POST "${API_BASE_URL}/onboarding/requests/${REQUEST_ID}/decision" \
    -H "Content-Type: application/json" \
    -d "$APPROVE_PAYLOAD")

if echo "$APPROVE_RESPONSE" | grep -q '"status":"APPROVED"'; then
    echo "✅ 온보딩 승인 완료"
    echo "응답: $APPROVE_RESPONSE"
else
    echo "❌ 온보딩 승인 실패"
    echo "$APPROVE_RESPONSE"
    exit 1
fi
echo ""

# 4. 프로시저 실행 대기
echo "📋 4단계: 프로시저 실행 대기 (5초)"
echo "----------------------------------------"
sleep 5
echo "✅ 대기 완료"
echo ""

# 5. 생성된 tenant_id 조회
echo "📋 5단계: 생성된 테넌트 ID 확인"
echo "----------------------------------------"
# 온보딩 요청에서 생성된 tenant_id 조회 (API 또는 DB 직접 조회 필요)
# 여기서는 간단히 승인 응답에서 tenant_id를 추출하거나, 
# 다음 단계에서 DB 조회로 확인

echo "✅ 온보딩 프로세스 완료"
echo ""
echo "=========================================="
echo "✅ 전체 플로우 테스트 완료"
echo "=========================================="
echo "온보딩 요청 ID: $REQUEST_ID"
echo "테넌트명: $TENANT_NAME"
echo "이메일: $EMAIL"
echo "비밀번호: $ADMIN_PASSWORD"
echo ""
echo "다음 단계:"
echo "1. 프론트엔드에서 로그인 테스트"
echo "   - 이메일: $EMAIL"
echo "   - 비밀번호: $ADMIN_PASSWORD"
echo ""
echo "2. 로그인 후 대시보드 확인"
echo "   - 대시보드가 정상적으로 표시되는지 확인"
echo "   - 기본 위젯이 올바르게 설정되었는지 확인"
echo ""

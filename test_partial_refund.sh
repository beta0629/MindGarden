#!/bin/bash

# 부분 환불 테스트 스크립트
echo "🔧 부분 환불 기능 테스트 시작..."

# 서버 URL
SERVER_URL="http://localhost:8080"
COOKIES_FILE="test_cookies.txt"

# 1. 로그인
echo "1️⃣ 로그인 중..."
LOGIN_RESPONSE=$(curl -s -c $COOKIES_FILE -X POST $SERVER_URL/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@mindgarden.com","password":"admin123"}')

echo "로그인 응답: $LOGIN_RESPONSE"

# 로그인 성공 확인
if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 로그인 성공"
else
    echo "❌ 로그인 실패"
    exit 1
fi

# 2. 현재 사용자 정보 확인
echo "2️⃣ 현재 사용자 정보 확인..."
USER_RESPONSE=$(curl -s -b $COOKIES_FILE $SERVER_URL/api/auth/current-user)
echo "사용자 정보: $USER_RESPONSE"

# 3. 매핑 목록 조회 (테스트용 매핑 ID 찾기)
echo "3️⃣ 매핑 목록 조회..."
MAPPING_RESPONSE=$(curl -s -b $COOKIES_FILE "$SERVER_URL/api/admin/mappings?page=0&size=5")
echo "매핑 목록: $MAPPING_RESPONSE"

# 4. 부분 환불 테스트 (10회기)
echo "4️⃣ 부분 환불 테스트 (10회기)..."
REFUND_RESPONSE=$(curl -s -b $COOKIES_FILE -X POST "$SERVER_URL/api/admin/mappings/1/partial-refund" \
  -H "Content-Type: application/json" \
  -d '{"refundSessions": 10, "reason": "자동 테스트 부분 환불 10회기"}')

echo "부분 환불 응답: $REFUND_RESPONSE"

# 부분 환불 성공 확인
if echo "$REFUND_RESPONSE" | grep -q '"success":true'; then
    echo "✅ 부분 환불 성공"
else
    echo "❌ 부분 환불 실패"
    echo "오류 상세: $REFUND_RESPONSE"
fi

# 5. 환불 이력 확인
echo "5️⃣ 환불 이력 확인..."
HISTORY_RESPONSE=$(curl -s -b $COOKIES_FILE "$SERVER_URL/api/admin/refund-history?page=0&size=10&period=month&status=all")
echo "환불 이력: $HISTORY_RESPONSE"

# 6. 환불 통계 확인
echo "6️⃣ 환불 통계 확인..."
STATS_RESPONSE=$(curl -s -b $COOKIES_FILE "$SERVER_URL/api/admin/refund-statistics?period=month")
echo "환불 통계: $STATS_RESPONSE"

# 7. ERP 재무 대시보드 확인
echo "7️⃣ ERP 재무 대시보드 확인..."
ERP_RESPONSE=$(curl -s -b $COOKIES_FILE "$SERVER_URL/api/erp/finance/dashboard")
echo "ERP 대시보드: $ERP_RESPONSE"

echo "🎯 부분 환불 테스트 완료!"

# 쿠키 파일 정리
rm -f $COOKIES_FILE

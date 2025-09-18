#!/bin/bash

# OAuth2 콜백 URL 테스트 스크립트
# 카카오/네이버 로그인 콜백이 정상 작동하는지 확인

echo "🔍 OAuth2 콜백 URL 테스트 시작..."
echo "도메인: m-garden.co.kr"
echo ""

BASE_URL="http://m-garden.co.kr"
# HTTPS 적용 시: BASE_URL="https://m-garden.co.kr"

echo "📋 테스트할 콜백 URL:"
echo "1. 카카오: ${BASE_URL}/api/auth/kakao/callback"
echo "2. 네이버: ${BASE_URL}/api/auth/naver/callback"
echo ""

# 1. 기본 서버 연결 테스트
echo "🌐 1. 기본 서버 연결 테스트..."
if curl -s --connect-timeout 10 "${BASE_URL}/api/actuator/health" | grep -q "UP"; then
    echo "✅ 서버 연결 성공"
else
    echo "❌ 서버 연결 실패"
    exit 1
fi

# 2. OAuth2 엔드포인트 테스트
echo ""
echo "🔐 2. OAuth2 엔드포인트 테스트..."

# 카카오 콜백 엔드포인트 확인
echo "   카카오 콜백 테스트..."
KAKAO_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/auth/kakao/callback?code=test&state=test")
if [ "$KAKAO_RESPONSE" = "200" ] || [ "$KAKAO_RESPONSE" = "302" ] || [ "$KAKAO_RESPONSE" = "400" ]; then
    echo "   ✅ 카카오 콜백 엔드포인트 접근 가능 (HTTP: $KAKAO_RESPONSE)"
else
    echo "   ❌ 카카오 콜백 엔드포인트 접근 실패 (HTTP: $KAKAO_RESPONSE)"
fi

# 네이버 콜백 엔드포인트 확인
echo "   네이버 콜백 테스트..."
NAVER_RESPONSE=$(curl -s -w "%{http_code}" -o /dev/null "${BASE_URL}/api/auth/naver/callback?code=test&state=test")
if [ "$NAVER_RESPONSE" = "200" ] || [ "$NAVER_RESPONSE" = "302" ] || [ "$NAVER_RESPONSE" = "400" ]; then
    echo "   ✅ 네이버 콜백 엔드포인트 접근 가능 (HTTP: $NAVER_RESPONSE)"
else
    echo "   ❌ 네이버 콜백 엔드포인트 접근 실패 (HTTP: $NAVER_RESPONSE)"
fi

# 3. OAuth2 설정 정보 확인
echo ""
echo "🔧 3. OAuth2 설정 정보 확인..."
CONFIG_RESPONSE=$(curl -s "${BASE_URL}/api/oauth2/config")
if echo "$CONFIG_RESPONSE" | grep -q "kakao"; then
    echo "✅ OAuth2 설정 정보 로드 성공"
    echo "$CONFIG_RESPONSE" | jq . 2>/dev/null || echo "$CONFIG_RESPONSE"
else
    echo "❌ OAuth2 설정 정보 로드 실패"
fi

echo ""
echo "📋 다음 단계:"
echo "1. 카카오 개발자 콘솔에서 Redirect URI 등록:"
echo "   → http://m-garden.co.kr/api/auth/kakao/callback"
echo ""
echo "2. 네이버 개발자 센터에서 Callback URL 등록:"
echo "   → http://m-garden.co.kr/api/auth/naver/callback"
echo ""
echo "3. 실제 로그인 테스트:"
echo "   → http://m-garden.co.kr/login"
echo "   → 카카오/네이버 로그인 버튼 클릭하여 테스트"
echo ""
echo "🔒 HTTPS 적용 후에는 https:// URL로 재등록 필요"

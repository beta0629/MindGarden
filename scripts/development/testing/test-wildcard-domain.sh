#!/bin/bash

# 와일드카드 도메인 테스트 스크립트
# 사용법: ./test-wildcard-domain.sh [테스트_서브도메인]
# 예: ./test-wildcard-domain.sh test1

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 기본값 설정
TEST_SUBDOMAIN="${1:-test1}"
BASE_DOMAIN="dev.core-solution.co.kr"
FULL_DOMAIN="${TEST_SUBDOMAIN}.${BASE_DOMAIN}"
BASE_URL="https://${FULL_DOMAIN}"

echo "=========================================="
echo "와일드카드 도메인 테스트"
echo "=========================================="
echo ""
echo "테스트 서브도메인: ${FULL_DOMAIN}"
echo ""

# 1. DNS 확인
echo -e "${BLUE}1. DNS 확인${NC}"
echo "----------------------------------------"
if command -v nslookup &> /dev/null; then
    DNS_RESULT=$(nslookup ${FULL_DOMAIN} 2>&1 | grep -A 1 "Name:" | tail -n 1 | awk '{print $2}' || echo "")
    if [ -n "$DNS_RESULT" ]; then
        echo -e "${GREEN}✅ DNS 해석 성공: ${FULL_DOMAIN} → ${DNS_RESULT}${NC}"
    else
        echo -e "${RED}❌ DNS 해석 실패: ${FULL_DOMAIN}${NC}"
        echo "   DNS A 레코드가 설정되지 않았을 수 있습니다."
    fi
else
    echo -e "${YELLOW}⚠️  nslookup이 설치되어 있지 않습니다.${NC}"
fi

# dig로도 확인
if command -v dig &> /dev/null; then
    DIG_RESULT=$(dig +short ${FULL_DOMAIN} 2>&1 | head -n 1)
    if [ -n "$DIG_RESULT" ] && [[ ! "$DIG_RESULT" =~ "connection" ]]; then
        echo -e "${GREEN}✅ dig 확인: ${FULL_DOMAIN} → ${DIG_RESULT}${NC}"
    else
        echo -e "${YELLOW}⚠️  dig로 확인 불가${NC}"
    fi
fi
echo ""

# 2. SSL 인증서 확인
echo -e "${BLUE}2. SSL 인증서 확인${NC}"
echo "----------------------------------------"
if command -v openssl &> /dev/null; then
    SSL_INFO=$(echo | openssl s_client -connect ${FULL_DOMAIN}:443 -servername ${FULL_DOMAIN} 2>&1 | grep -E "subject=|issuer=|CN=" | head -3)
    if [ -n "$SSL_INFO" ]; then
        echo -e "${GREEN}✅ SSL 인증서 확인 성공${NC}"
        echo "$SSL_INFO" | sed 's/^/   /'
        
        # 인증서 만료일 확인
        EXPIRY=$(echo | openssl s_client -connect ${FULL_DOMAIN}:443 -servername ${FULL_DOMAIN} 2>&1 | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        if [ -n "$EXPIRY" ]; then
            echo -e "   만료일: ${EXPIRY}"
        fi
    else
        echo -e "${RED}❌ SSL 인증서 확인 실패${NC}"
        echo "   와일드카드 SSL 인증서가 발급되지 않았을 수 있습니다."
    fi
else
    echo -e "${YELLOW}⚠️  openssl이 설치되어 있지 않습니다.${NC}"
fi
echo ""

# 3. HTTP 접근 테스트
echo -e "${BLUE}3. HTTP 접근 테스트${NC}"
echo "----------------------------------------"
HTTP_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" --max-time 10 ${BASE_URL} 2>&1 || echo "000")
if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ]; then
    echo -e "${GREEN}✅ HTTP 접근 성공 (HTTP ${HTTP_CODE})${NC}"
elif [ "$HTTP_CODE" = "000" ]; then
    echo -e "${RED}❌ HTTP 접근 실패 (연결 불가)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP 응답: ${HTTP_CODE}${NC}"
fi

# 응답 헤더 확인
echo "응답 헤더:"
curl -k -I --max-time 10 ${BASE_URL} 2>&1 | head -10 | sed 's/^/   /' || echo "   헤더 확인 실패"
echo ""

# 4. HTTPS 접근 테스트
echo -e "${BLUE}4. HTTPS 접근 테스트${NC}"
echo "----------------------------------------"
HTTPS_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" --max-time 10 ${BASE_URL} 2>&1 || echo "000")
if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "301" ] || [ "$HTTPS_CODE" = "302" ]; then
    echo -e "${GREEN}✅ HTTPS 접근 성공 (HTTP ${HTTPS_CODE})${NC}"
elif [ "$HTTPS_CODE" = "000" ]; then
    echo -e "${RED}❌ HTTPS 접근 실패 (연결 불가)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTPS 응답: ${HTTPS_CODE}${NC}"
fi
echo ""

# 5. API 엔드포인트 테스트
echo -e "${BLUE}5. API 엔드포인트 테스트${NC}"
echo "----------------------------------------"
API_URL="${BASE_URL}/api/v1/health"
API_CODE=$(curl -k -s -o /dev/null -w "%{http_code}" --max-time 10 ${API_URL} 2>&1 || echo "000")
if [ "$API_CODE" = "200" ]; then
    echo -e "${GREEN}✅ API 엔드포인트 접근 성공 (HTTP ${API_CODE})${NC}"
    API_RESPONSE=$(curl -k -s --max-time 10 ${API_URL} 2>&1 || echo "")
    if [ -n "$API_RESPONSE" ]; then
        echo "   응답: $API_RESPONSE" | head -c 100
        echo ""
    fi
elif [ "$API_CODE" = "000" ]; then
    echo -e "${RED}❌ API 엔드포인트 접근 실패 (연결 불가)${NC}"
else
    echo -e "${YELLOW}⚠️  API 응답: ${API_CODE}${NC}"
fi
echo ""

# 6. 테넌트 라우팅 테스트
echo -e "${BLUE}6. 테넌트 라우팅 테스트${NC}"
echo "----------------------------------------"
echo "서브도메인에서 테넌트 ID 추출 테스트:"
echo "   서브도메인: ${TEST_SUBDOMAIN}"
echo "   예상 테넌트 ID: ${TEST_SUBDOMAIN} (또는 서브도메인 기반)"
echo ""

# 7. 요약
echo "=========================================="
echo "테스트 요약"
echo "=========================================="
echo ""
echo "테스트 도메인: ${FULL_DOMAIN}"
echo ""

if [ "$HTTP_CODE" = "200" ] || [ "$HTTPS_CODE" = "200" ]; then
    echo -e "${GREEN}✅ 와일드카드 도메인 기본 동작: 정상${NC}"
else
    echo -e "${RED}❌ 와일드카드 도메인 기본 동작: 실패${NC}"
fi

if [ -n "$SSL_INFO" ]; then
    echo -e "${GREEN}✅ SSL 인증서: 정상${NC}"
else
    echo -e "${RED}❌ SSL 인증서: 확인 필요${NC}"
fi

if [ -n "$DNS_RESULT" ] || [ -n "$DIG_RESULT" ]; then
    echo -e "${GREEN}✅ DNS 설정: 정상${NC}"
else
    echo -e "${RED}❌ DNS 설정: 확인 필요${NC}"
fi

echo ""
echo "=========================================="
echo "테스트 완료"
echo "=========================================="
echo ""
echo "다음 단계:"
echo "  1. 서버에서 SSL 인증서 확인: sudo certbot certificates"
echo "  2. Nginx 설정 확인: sudo nginx -t"
echo "  3. Nginx 로그 확인: sudo tail -f /var/log/nginx/tenant.dev.core-solution.co.kr.error.log"
echo ""


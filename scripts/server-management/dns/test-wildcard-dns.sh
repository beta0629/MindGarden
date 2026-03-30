#!/bin/bash

# 와일드카드 DNS 레코드 설정 후 테스트 스크립트
# 사용법: ./test-wildcard-dns.sh [서브도메인]
# 예: ./test-wildcard-dns.sh mindgarden

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

SUBDOMAIN="${1:-mindgarden}"
FULL_DOMAIN="${SUBDOMAIN}.dev.core-solution.co.kr"
EXPECTED_IP="114.202.247.246"

echo "=========================================="
echo "와일드카드 DNS 테스트"
echo "=========================================="
echo ""
echo "테스트 도메인: ${FULL_DOMAIN}"
echo "예상 IP: ${EXPECTED_IP}"
echo ""

# 1. DNS 해석 확인
echo -e "${BLUE}1. DNS 해석 확인${NC}"
echo "----------------------------------------"

DNS_SERVERS=(
    "기본 DNS:"
    "Google DNS (8.8.8.8):"
    "Gabia 네임서버 (ns.gabia.co.kr):"
)

DNS_IPS=(
    ""
    "8.8.8.8"
    "ns.gabia.co.kr"
)

ALL_RESOLVED=true

for i in "${!DNS_SERVERS[@]}"; do
    SERVER_NAME="${DNS_SERVERS[$i]}"
    DNS_IP="${DNS_IPS[$i]}"
    
    echo -n "  ${SERVER_NAME} "
    
    if [ -z "$DNS_IP" ]; then
        RESULT=$(dig +short "$FULL_DOMAIN" 2>&1 | head -1)
    else
        RESULT=$(dig @${DNS_IP} +short "$FULL_DOMAIN" 2>&1 | head -1)
    fi
    
    if [ -n "$RESULT" ] && [[ "$RESULT" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        if [ "$RESULT" == "$EXPECTED_IP" ]; then
            echo -e "${GREEN}✅ $RESULT${NC}"
        else
            echo -e "${YELLOW}⚠️  $RESULT (예상: $EXPECTED_IP)${NC}"
            ALL_RESOLVED=false
        fi
    else
        echo -e "${RED}❌ 해석 불가${NC}"
        ALL_RESOLVED=false
    fi
done

echo ""

if [ "$ALL_RESOLVED" = false ]; then
    echo -e "${YELLOW}⚠️  일부 DNS 서버에서 해석되지 않습니다.${NC}"
    echo "   DNS 전파가 완료되지 않았을 수 있습니다. 잠시 후 다시 시도하세요."
    echo ""
fi

# 2. HTTPS 접근 테스트
echo -e "${BLUE}2. HTTPS 접근 테스트${NC}"
echo "----------------------------------------"

echo -n "  로컬 curl 테스트: "
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -k --max-time 10 "https://${FULL_DOMAIN}/" 2>&1 || echo "000")
HTTP_CODE=$(echo "$HTTP_CODE" | tr -d '\n' | grep -oE '[0-9]{3}' || echo "000")

if [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ HTTP 200${NC}"
elif [ "$HTTP_CODE" == "000" ] || [ -z "$HTTP_CODE" ]; then
    echo -e "${RED}❌ 연결 실패 (DNS 해석 불가 또는 서버 접근 불가)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP $HTTP_CODE${NC}"
fi

echo -n "  서버 내부 curl 테스트: "
SERVER_RESULT=$(ssh root@beta0629.cafe24.com "curl -s -o /dev/null -w '%{http_code}' -k --max-time 10 'https://${FULL_DOMAIN}/' 2>&1" || echo "000")

if [ "$SERVER_RESULT" == "200" ]; then
    echo -e "${GREEN}✅ HTTP 200${NC}"
elif [ "$SERVER_RESULT" == "000" ]; then
    echo -e "${YELLOW}⚠️  연결 실패 (서버 내부에서도 실패)${NC}"
else
    echo -e "${YELLOW}⚠️  HTTP $SERVER_RESULT${NC}"
fi

echo ""

# 3. SSL 인증서 확인
echo -e "${BLUE}3. SSL 인증서 확인${NC}"
echo "----------------------------------------"

echo -n "  인증서 유효성: "
CERT_CHECK=$(echo | openssl s_client -servername "$FULL_DOMAIN" -connect "${FULL_DOMAIN}:443" 2>&1 | grep -c "Verify return code: 0" || echo "0")

if [ "$CERT_CHECK" -gt 0 ]; then
    echo -e "${GREEN}✅ 유효함${NC}"
else
    echo -e "${YELLOW}⚠️  확인 불가 (DNS 해석 필요)${NC}"
fi

echo ""

# 4. 최종 결과
echo "=========================================="
if [ "$ALL_RESOLVED" = true ] && [ "$HTTP_CODE" == "200" ]; then
    echo -e "${GREEN}✅ 와일드카드 DNS 설정 완료!${NC}"
    echo ""
    echo "브라우저에서 접근 가능합니다:"
    echo "  https://${FULL_DOMAIN}/"
    echo ""
else
    echo -e "${YELLOW}⚠️  DNS 설정이 완료되지 않았거나 전파 중입니다.${NC}"
    echo ""
    echo "다음 단계:"
    echo "1. Gabia DNS 관리 페이지에서 와일드카드 A 레코드 확인"
    echo "2. DNS 전파 대기 (5분 ~ 1시간)"
    echo "3. 이 스크립트를 다시 실행하여 확인"
    echo ""
fi
echo "=========================================="
echo ""


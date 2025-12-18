#!/bin/bash

# 와일드카드 DNS 레코드 설정 가이드 스크립트
# 사용법: ./setup-wildcard-dns-guide.sh

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo "=========================================="
echo "와일드카드 DNS 레코드 설정 가이드"
echo "=========================================="
echo ""
echo "도메인: *.dev.core-solution.co.kr"
echo "서버 IP: 114.202.247.246"
echo ""

# 1. 현재 DNS 상태 확인
echo -e "${BLUE}1. 현재 DNS 상태 확인${NC}"
echo "----------------------------------------"

TEST_DOMAINS=("dev.core-solution.co.kr" "mindgarden.dev.core-solution.co.kr" "test1.dev.core-solution.co.kr")

for domain in "${TEST_DOMAINS[@]}"; do
    echo -n "  ${domain}: "
    RESULT=$(dig +short "$domain" 2>&1 | head -1)
    if [ -n "$RESULT" ] && [[ "$RESULT" =~ ^[0-9]+\.[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
        echo -e "${GREEN}✅ $RESULT${NC}"
    else
        echo -e "${RED}❌ 해석 불가${NC}"
    fi
done

echo ""
echo -e "${YELLOW}⚠️  와일드카드 DNS 레코드가 설정되지 않았습니다.${NC}"
echo ""

# 2. Gabia DNS 설정 방법 안내
echo -e "${BLUE}2. Gabia DNS 관리 페이지 설정 방법${NC}"
echo "----------------------------------------"
echo ""
echo "1. Gabia 홈페이지 접속: https://www.gabia.com"
echo "2. 로그인 후 '도메인 관리' 메뉴 선택"
echo "3. 'core-solution.co.kr' 도메인 선택"
echo "4. 'DNS 관리' 또는 '네임서버 관리' 메뉴 선택"
echo "5. 'A 레코드 추가' 클릭"
echo ""
echo -e "${CYAN}DNS 레코드 정보:${NC}"
echo "  타입: A"
echo "  호스트: *.dev (또는 * - Gabia 인터페이스에 따라 다름)"
echo "  값/IP: 114.202.247.246"
echo "  TTL: 3600 (또는 기본값)"
echo ""
echo -e "${YELLOW}참고:${NC}"
echo "  - Gabia DNS 관리 인터페이스에 따라 와일드카드 입력 방식이 다를 수 있습니다."
echo "  - '*.dev' 또는 '*' 또는 '*.dev.core-solution.co.kr' 형식으로 입력해야 할 수 있습니다."
echo "  - 정확한 입력 방식이 불확실하면 Gabia 고객센터에 문의하세요."
echo ""

# 3. DNS 전파 확인 방법
echo -e "${BLUE}3. DNS 전파 확인 방법${NC}"
echo "----------------------------------------"
echo ""
echo "DNS 레코드 설정 후 다음 명령어로 전파를 확인하세요:"
echo ""
echo "  # 일반 DNS 서버로 확인"
echo "  dig mindgarden.dev.core-solution.co.kr"
echo "  nslookup mindgarden.dev.core-solution.co.kr"
echo ""
echo "  # Gabia 네임서버로 직접 확인"
echo "  dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr"
echo ""
echo "  # Google DNS로 확인"
echo "  dig @8.8.8.8 mindgarden.dev.core-solution.co.kr"
echo ""
echo -e "${GREEN}예상 결과:${NC}"
echo "  mindgarden.dev.core-solution.co.kr → 114.202.247.246"
echo ""
echo -e "${YELLOW}전파 시간:${NC} 보통 5분 ~ 1시간 (TTL 값에 따라 다름)"
echo ""

# 4. 설정 후 테스트 방법
echo -e "${BLUE}4. 설정 후 테스트 방법${NC}"
echo "----------------------------------------"
echo ""
echo "DNS 전파 확인 후 다음 명령어로 테스트하세요:"
echo ""
echo "  # HTTPS 접근 테스트"
echo "  curl -I https://mindgarden.dev.core-solution.co.kr/"
echo ""
echo "  # 브라우저에서 접근"
echo "  https://mindgarden.dev.core-solution.co.kr/"
echo ""
echo "  # 서버 로그 확인"
echo "  ssh root@beta0629.cafe24.com 'tail -f /var/log/nginx/tenant.dev.core-solution.co.kr.access.log'"
echo ""

# 5. 현재 서버 설정 상태
echo -e "${BLUE}5. 현재 서버 설정 상태${NC}"
echo "----------------------------------------"

echo -n "  Nginx 설정: "
if ssh root@beta0629.cafe24.com "nginx -t" &>/dev/null; then
    echo -e "${GREEN}✅ 정상${NC}"
else
    echo -e "${RED}❌ 오류${NC}"
fi

echo -n "  SSL 인증서: "
if ssh root@beta0629.cafe24.com "test -f /etc/letsencrypt/live/dev.core-solution.co.kr-0001/fullchain.pem" 2>/dev/null; then
    EXPIRY=$(ssh root@beta0629.cafe24.com "openssl x509 -in /etc/letsencrypt/live/dev.core-solution.co.kr-0001/fullchain.pem -noout -enddate 2>/dev/null | cut -d= -f2")
    echo -e "${GREEN}✅ 정상 (만료일: $EXPIRY)${NC}"
else
    echo -e "${RED}❌ 없음${NC}"
fi

echo -n "  Nginx 서비스: "
if ssh root@beta0629.cafe24.com "systemctl is-active nginx" &>/dev/null; then
    echo -e "${GREEN}✅ 실행 중${NC}"
else
    echo -e "${RED}❌ 중지됨${NC}"
fi

echo ""
echo "=========================================="
echo -e "${CYAN}다음 단계:${NC}"
echo "1. Gabia DNS 관리 페이지에서 와일드카드 A 레코드 추가"
echo "2. DNS 전파 대기 (5분 ~ 1시간)"
echo "3. DNS 전파 확인 (위 명령어 사용)"
echo "4. 브라우저 접근 테스트"
echo "=========================================="
echo ""


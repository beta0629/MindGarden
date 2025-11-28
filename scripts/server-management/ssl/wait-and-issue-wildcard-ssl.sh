#!/bin/bash

# DNS TXT 레코드 확인 후 Wildcard SSL 인증서 자동 발급
# 사용법: sudo ./wait-and-issue-wildcard-ssl.sh

set -e

DOMAIN="*.dev.core-solution.co.kr"
CHALLENGE_DOMAIN="_acme-challenge.dev.core-solution.co.kr"
EXPECTED_VALUE="BE1YFRe-tXUOry088u-vpSbeIkXlNmqrStCTJqQTGNY"

echo "=========================================="
echo "Wildcard SSL 인증서 자동 발급"
echo "도메인: $DOMAIN"
echo "=========================================="
echo ""

echo "📋 DNS TXT 레코드 정보:"
echo "  호스트: _acme-challenge.dev"
echo "  타입: TXT"
echo "  값: $EXPECTED_VALUE"
echo "  전체 도메인: $CHALLENGE_DOMAIN"
echo ""

echo "⚠️  DNS 관리자 페이지에서 TXT 레코드를 추가하세요."
echo "DNS 추가 후 이 스크립트가 자동으로 확인하고 진행합니다."
echo ""

# DNS TXT 레코드 확인 대기
echo "DNS TXT 레코드 확인 중..."
MAX_RETRIES=30
RETRY_COUNT=0

while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    RESULT=$(dig +short TXT "$CHALLENGE_DOMAIN" 2>&1)
    
    if [ -n "$RESULT" ] && echo "$RESULT" | grep -q "$EXPECTED_VALUE"; then
        echo "✅ DNS TXT 레코드 확인 완료!"
        echo "값: $RESULT"
        break
    fi
    
    RETRY_COUNT=$((RETRY_COUNT + 1))
    echo "대기 중... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 10
done

if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "❌ DNS TXT 레코드가 확인되지 않았습니다."
    echo "DNS 관리자 페이지에서 TXT 레코드를 추가한 후 다시 실행하세요."
    exit 1
fi

echo ""
echo "SSL 인증서 발급 진행..."
echo ""

# Certbot 실행 (대화형)
# DNS TXT 레코드가 확인되었으므로 바로 진행
sudo certbot certonly \
    --manual \
    --preferred-challenges dns \
    -d "$DOMAIN" \
    --email admin@e-trinity.co.kr \
    --agree-tos \
    --no-eff-email

echo ""
echo "=========================================="
echo "Wildcard SSL 인증서 발급 완료"
echo "=========================================="
echo ""
echo "인증서 위치:"
echo "  Certificate: /etc/letsencrypt/live/*.dev.core-solution.co.kr/fullchain.pem"
echo "  Private Key: /etc/letsencrypt/live/*.dev.core-solution.co.kr/privkey.pem"
echo ""


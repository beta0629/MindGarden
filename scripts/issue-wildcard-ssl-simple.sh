#!/bin/bash

# Wildcard SSL 인증서 발급 스크립트 (간단 버전)
# DNS TXT 레코드 추가 후 수동으로 Enter 키 입력
# 사용법: sudo ./issue-wildcard-ssl-simple.sh

set -e

DOMAIN="*.dev.core-solution.co.kr"

echo "=========================================="
echo "Wildcard SSL 인증서 발급"
echo "도메인: $DOMAIN"
echo "=========================================="
echo ""

echo "⚠️  DNS TXT 레코드 추가 필요:"
echo ""
echo "도메인: core-solution.co.kr"
echo "호스트: _acme-challenge.dev"
echo "타입: TXT"
echo "값: (Certbot이 안내하는 값)"
echo ""
echo "DNS 추가 후 Enter 키를 눌러주세요."
echo ""

# Certbot 실행
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


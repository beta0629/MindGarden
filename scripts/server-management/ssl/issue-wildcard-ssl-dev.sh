#!/bin/bash

# Wildcard SSL 인증서 발급 스크립트 (개발 서버)
# 도메인: *.dev.core-solution.co.kr
# 사용법: sudo ./issue-wildcard-ssl-dev.sh

set -e

echo "=========================================="
echo "Wildcard SSL 인증서 발급 (개발 서버)"
echo "도메인: *.dev.core-solution.co.kr"
echo "=========================================="
echo ""

# DNS-01 challenge를 사용한 수동 인증서 발급
# Let's Encrypt는 Wildcard 인증서 발급 시 DNS-01 challenge만 지원

echo "⚠️  주의: Wildcard SSL 인증서 발급은 DNS TXT 레코드 확인이 필요합니다."
echo ""
echo "다음 단계를 따라주세요:"
echo "1. Certbot이 DNS TXT 레코드를 생성하라고 안내합니다."
echo "2. DNS 관리자 페이지에서 해당 TXT 레코드를 추가합니다."
echo "3. DNS 전파를 기다립니다 (보통 1-5분)."
echo "4. Certbot이 자동으로 확인합니다."
echo ""

read -p "계속하시겠습니까? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "취소되었습니다."
    exit 1
fi

echo ""
echo "Certbot 실행 중..."
echo ""

# DNS-01 challenge를 사용한 수동 인증서 발급
sudo certbot certonly \
    --manual \
    --preferred-challenges dns \
    -d "*.dev.core-solution.co.kr" \
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
echo "다음 단계:"
echo "  1. Nginx 설정에 wildcard server_name 추가"
echo "  2. SSL 인증서 경로 업데이트"
echo "  3. Nginx 재시작"
echo ""


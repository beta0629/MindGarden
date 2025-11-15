#!/bin/bash
# SSL 인증서 발급 문제 해결 스크립트

set -e

echo "🔧 SSL 인증서 발급 문제 해결 중..."
echo ""

# 1. DNS 확인
echo "📡 DNS 확인 중..."
DEV_IP=$(hostname -I | awk '{print $1}')
DNS_IP=$(nslookup dev.m-garden.co.kr | grep -A 1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)

echo "개발 서버 IP: $DEV_IP"
echo "DNS IP: $DNS_IP"

if [ "$DNS_IP" != "$DEV_IP" ] && [ -n "$DNS_IP" ]; then
    echo "⚠️  경고: DNS가 다른 IP를 가리키고 있습니다!"
    echo "   DNS 설정을 확인하세요: dev.m-garden.co.kr → $DEV_IP"
    read -p "계속하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 2. 디렉토리 생성 및 권한
echo ""
echo "📁 디렉토리 생성 및 권한 설정 중..."
sudo mkdir -p /var/www/html-dev/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html-dev
sudo chmod -R 755 /var/www/html-dev

# 3. 테스트 파일 생성
echo ""
echo "🧪 테스트 파일 생성 중..."
TEST_FILE="/var/www/html-dev/.well-known/acme-challenge/test-certbot"
echo "certbot-test-$(date +%s)" | sudo tee $TEST_FILE > /dev/null
sudo chown www-data:www-data $TEST_FILE

# 4. HTTP 접근 테스트
echo ""
echo "🔍 HTTP 접근 테스트 중..."
HTTP_TEST=$(curl -s http://dev.m-garden.co.kr/.well-known/acme-challenge/test-certbot 2>&1)

if echo "$HTTP_TEST" | grep -q "certbot-test"; then
    echo "✅ HTTP 접근 성공!"
    echo "   응답: $HTTP_TEST"
else
    echo "❌ HTTP 접근 실패!"
    echo "   응답: $HTTP_TEST"
    echo ""
    echo "⚠️  문제 해결 방법:"
    echo "   1. Nginx 설정 확인: sudo nginx -t"
    echo "   2. Nginx 재시작: sudo systemctl reload nginx"
    echo "   3. 방화벽 확인: sudo ufw status"
    exit 1
fi

# 5. Nginx 설정 확인
echo ""
echo "📝 Nginx 설정 확인 중..."
if sudo nginx -t; then
    echo "✅ Nginx 설정 파일 문법 검사 통과"
    sudo systemctl reload nginx
    echo "✅ Nginx 재시작 완료"
else
    echo "❌ Nginx 설정 파일 오류"
    exit 1
fi

# 6. 최종 확인
echo ""
echo "✅ 준비 완료!"
echo ""
echo "📋 다음 단계:"
echo "   sudo certbot certonly --webroot -w /var/www/html-dev -d dev.m-garden.co.kr"
echo ""
echo "💡 만약 여전히 실패하면:"
echo "   1. DNS가 올바른 서버를 가리키는지 확인"
echo "   2. 방화벽에서 HTTP(80) 포트가 열려있는지 확인"
echo "   3. Nginx 로그 확인: sudo tail -f /var/log/nginx/dev.m-garden.co.kr.error.log"


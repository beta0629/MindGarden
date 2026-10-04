#!/bin/bash
# 개발 서버 Nginx 설정 스크립트
# Usage: ./scripts/setup-dev-nginx.sh

set -e

DEV_SERVER="${DEV_SERVER_HOST:?DEV_SERVER_HOST 환경변수를 설정하세요}"
DEV_USER="root"
DOMAIN="dev.m-garden.co.kr"

echo "🔧 개발 서버 Nginx 설정 시작..."
echo "서버: $DEV_SERVER"
echo "도메인: $DOMAIN"
echo ""

# SSH로 개발 서버에 접속하여 설정
ssh -i ~/.ssh/github_actions_dev $DEV_USER@$DEV_SERVER << 'ENDSSH'
set -e

echo "📦 Nginx 설치 확인 중..."
if ! command -v nginx &> /dev/null; then
    echo "📦 Nginx 설치 중..."
    apt update
    apt install -y nginx
    echo "✅ Nginx 설치 완료"
else
    echo "✅ Nginx 이미 설치됨"
fi

echo ""
echo "📦 Certbot 설치 확인 중..."
if ! command -v certbot &> /dev/null; then
    echo "📦 Certbot 설치 중..."
    apt update
    apt install -y certbot python3-certbot-nginx
    echo "✅ Certbot 설치 완료"
else
    echo "✅ Certbot 이미 설치됨"
    certbot --version
fi

echo ""
echo "📝 Nginx 설정 파일 생성 중..."

# 설정 파일 생성
sudo tee /etc/nginx/sites-available/dev.m-garden.co.kr.conf > /dev/null << 'NGINXCONF'
# MindGarden 개발 서버 Nginx 설정
# 서버: $DEV_SERVER_HOST
# 도메인: dev.m-garden.co.kr

# HTTP 서버 (Let's Encrypt 인증서 발급용)
server {
    listen 80;
    server_name dev.m-garden.co.kr;
    
    # Let's Encrypt 인증서 발급/갱신을 위한 경로 (최우선)
    location /.well-known/acme-challenge/ {
        root /var/www/html-dev;
        try_files $uri =404;
    }
    
    # HTTPS로 리다이렉트 (인증서 발급 후 활성화)
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# HTTPS 서버 설정 (SSL 인증서 발급 전까지 주석 처리)
# server {
#     listen 443 ssl http2;
#     server_name dev.m-garden.co.kr;
#     
#     # SSL 인증서 설정 (Let's Encrypt)
#     ssl_certificate /etc/letsencrypt/live/dev.m-garden.co.kr/fullchain.pem;
#     ssl_certificate_key /etc/letsencrypt/live/dev.m-garden.co.kr/privkey.pem;
#     
#     # SSL 보안 설정
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
#     ssl_prefer_server_ciphers off;
#     ssl_session_cache shared:SSL:10m;
#     ssl_session_timeout 10m;
#     
#     # HSTS
#     add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
#     
#     # 보안 헤더
#     add_header X-Frame-Options "SAMEORIGIN" always;
#     add_header X-Content-Type-Options "nosniff" always;
#     add_header X-XSS-Protection "1; mode=block" always;
#     
#     # 프론트엔드
#     location / {
#         root /var/www/html-dev;
#         index index.html;
#         try_files $uri $uri/ /index.html;
#         
#         add_header Cache-Control "no-cache, no-store, must-revalidate";
#         add_header Pragma "no-cache";
#         add_header Expires "0";
#     }
#     
#     # 정적 파일
#     location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
#         root /var/www/html-dev;
#         expires 1h;
#         add_header Cache-Control "public, max-age=3600";
#     }
#     
#     # 백엔드 API 프록시
#     location /api/ {
#         proxy_pass http://localhost:8080;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#         
#         proxy_connect_timeout 60s;
#         proxy_send_timeout 60s;
#         proxy_read_timeout 60s;
#         
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection "upgrade";
#         
#         proxy_buffering off;
#         proxy_request_buffering off;
#     }
#     
#     # Actuator
#     location /actuator/ {
#         proxy_pass http://localhost:8080;
#         proxy_set_header Host $host;
#         proxy_set_header X-Real-IP $remote_addr;
#         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
#         proxy_set_header X-Forwarded-Proto $scheme;
#     }
#     
#     access_log /var/log/nginx/dev.m-garden.co.kr.access.log;
#     error_log /var/log/nginx/dev.m-garden.co.kr.error.log;
# }

# SSL 인증서 발급 전까지 HTTP로만 서비스
server {
    listen 80;
    server_name dev.m-garden.co.kr;
    
    # 프론트엔드
    location / {
        root /var/www/html-dev;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # 정적 파일
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/html-dev;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }
    
    # 백엔드 API 프록시
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Actuator
    location /actuator/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    access_log /var/log/nginx/dev.m-garden.co.kr.access.log;
    error_log /var/log/nginx/dev.m-garden.co.kr.error.log;
}
NGINXCONF

# 심볼릭 링크 생성
sudo ln -sf /etc/nginx/sites-available/dev.m-garden.co.kr.conf /etc/nginx/sites-enabled/

# 기본 설정 비활성화 (선택사항)
if [ -f /etc/nginx/sites-enabled/default ]; then
    sudo rm /etc/nginx/sites-enabled/default
fi

# 디렉토리 생성
sudo mkdir -p /var/www/html-dev
sudo chown -R www-data:www-data /var/www/html-dev
sudo chmod -R 755 /var/www/html-dev

# Nginx 설정 테스트
echo ""
echo "🔍 Nginx 설정 테스트 중..."
if sudo nginx -t; then
    echo "✅ Nginx 설정 파일 문법 검사 통과"
    
    # Nginx 재시작
    echo "🔄 Nginx 재시작 중..."
    sudo systemctl reload nginx
    echo "✅ Nginx 재시작 완료"
else
    echo "❌ Nginx 설정 파일 오류"
    exit 1
fi

# 방화벽 포트 열기 (ufw가 설치되어 있는 경우)
if command -v ufw &> /dev/null; then
    echo ""
    echo "🔥 방화벽 포트 설정 중..."
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    echo "✅ 방화벽 포트 설정 완료"
fi

echo ""
echo "✅ 개발 서버 Nginx 설정 완료!"
echo ""
echo "📝 다음 단계:"
echo "1. DNS 서브도메인 A 레코드 추가: dev.m-garden.co.kr → [서버 IP]"
echo "2. DNS 전파 확인: nslookup dev.m-garden.co.kr"
echo "3. Let's Encrypt SSL 인증서 발급 (운영 서버와 동일):"
echo "   sudo certbot --nginx -d dev.m-garden.co.kr"
echo "4. 브라우저에서 접속 확인: https://dev.m-garden.co.kr"
echo ""
echo "💡 참고: 운영 서버(m-garden.co.kr)와 동일하게 Let's Encrypt 무료 인증서를 사용합니다."

ENDSSH

echo ""
echo "✅ 개발 서버 Nginx 설정 스크립트 실행 완료!"


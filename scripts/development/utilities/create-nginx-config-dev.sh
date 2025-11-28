#!/bin/bash

# 개발 서버 Nginx 설정 파일 생성 스크립트
# 서버 IP: 114.202.247.246
# 사용법: sudo ./create-nginx-config-dev.sh

set -e

NGINX_CONFIG="/etc/nginx/sites-available/core-solution-dev"

echo "=========================================="
echo "개발 서버 Nginx 설정 파일 생성"
echo "=========================================="
echo ""

# 백업 (기존 파일이 있는 경우)
if [ -f "$NGINX_CONFIG" ]; then
    echo "기존 설정 파일 백업 중..."
    sudo cp $NGINX_CONFIG ${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)
    echo "백업 완료: ${NGINX_CONFIG}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# Nginx 설정 파일 생성
echo "Nginx 설정 파일 생성 중: $NGINX_CONFIG"
sudo tee $NGINX_CONFIG > /dev/null <<'EOF'
# ============================================
# 개발 서버: dev.core-solution.co.kr
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name dev.core-solution.co.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev.core-solution.co.kr;

    ssl_certificate /etc/letsencrypt/live/dev.core-solution.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.core-solution.co.kr/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;

        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 로그 설정
    access_log /var/log/nginx/dev.core-solution.co.kr.access.log;
    error_log /var/log/nginx/dev.core-solution.co.kr.error.log;
}

# ============================================
# 테넌트 서브도메인 (Wildcard): *.dev.core-solution.co.kr
# ============================================
# 예: tenant1.dev.core-solution.co.kr, tenant2.dev.core-solution.co.kr
server {
    listen 80;
    listen [::]:80;
    server_name ~^[^.]+\.dev\.core-solution\.co\.kr$;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ~^[^.]+\.dev\.core-solution\.co\.kr$;

    # Wildcard SSL 인증서 사용
    # 실제 경로: /etc/letsencrypt/live/dev.core-solution.co.kr-0001/
    ssl_certificate /etc/letsencrypt/live/dev.core-solution.co.kr-0001/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.core-solution.co.kr-0001/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # 보안 헤더
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;

        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 로그 설정
    access_log /var/log/nginx/tenant.dev.core-solution.co.kr.access.log;
    error_log /var/log/nginx/tenant.dev.core-solution.co.kr.error.log;
}

# ============================================
# 개발 API 서버: api.dev.core-solution.co.kr
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name api.dev.core-solution.co.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.dev.core-solution.co.kr;

    ssl_certificate /etc/letsencrypt/live/api.dev.core-solution.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.dev.core-solution.co.kr/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # API 전용 설정
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS 헤더 (개발 환경)
        add_header Access-Control-Allow-Origin * always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;

        # OPTIONS 요청 처리
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
            add_header Access-Control-Max-Age 3600;
            add_header Content-Type 'text/plain charset=UTF-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # 로그 설정
    access_log /var/log/nginx/api.dev.core-solution.co.kr.access.log;
    error_log /var/log/nginx/api.dev.core-solution.co.kr.error.log;
}

# ============================================
# 개발 회사 홈페이지: dev.e-trinity.co.kr
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name dev.e-trinity.co.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev.e-trinity.co.kr;

    ssl_certificate /etc/letsencrypt/live/dev.e-trinity.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.e-trinity.co.kr/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 로그 설정
    access_log /var/log/nginx/dev.e-trinity.co.kr.access.log;
    error_log /var/log/nginx/dev.e-trinity.co.kr.error.log;
}

# ============================================
# 개발 온보딩: apply.dev.e-trinity.co.kr
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name apply.dev.e-trinity.co.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name apply.dev.e-trinity.co.kr;

    ssl_certificate /etc/letsencrypt/live/apply.dev.e-trinity.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/apply.dev.e-trinity.co.kr/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 로그 설정
    access_log /var/log/nginx/apply.dev.e-trinity.co.kr.access.log;
    error_log /var/log/nginx/apply.dev.e-trinity.co.kr.error.log;
}

# ============================================
# 개발 운영 포털: ops.dev.e-trinity.co.kr
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name ops.dev.e-trinity.co.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ops.dev.e-trinity.co.kr;

    ssl_certificate /etc/letsencrypt/live/ops.dev.e-trinity.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ops.dev.e-trinity.co.kr/privkey.pem;

    # SSL 설정
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 운영 포털 전용 설정
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # 보안 헤더 (운영 포털)
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # 로그 설정
    access_log /var/log/nginx/ops.dev.e-trinity.co.kr.access.log;
    error_log /var/log/nginx/ops.dev.e-trinity.co.kr.error.log;
}

EOF

echo "✅ Nginx 설정 파일 생성 완료: $NGINX_CONFIG"
echo ""

# 심볼릭 링크 생성
if [ ! -L "/etc/nginx/sites-enabled/core-solution-dev" ]; then
    echo "심볼릭 링크 생성 중..."
    sudo ln -s $NGINX_CONFIG /etc/nginx/sites-enabled/
    echo "✅ 심볼릭 링크 생성 완료"
else
    echo "✅ 심볼릭 링크 이미 존재"
fi

# Nginx 설정 테스트
echo ""
echo "Nginx 설정 테스트 중..."
if sudo nginx -t; then
    echo "✅ Nginx 설정 테스트 통과"
    echo ""
    read -p "Nginx를 재시작하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo systemctl restart nginx
        echo "✅ Nginx 재시작 완료"
    fi
else
    echo "❌ Nginx 설정 오류가 있습니다."
    exit 1
fi

echo ""
echo "=========================================="
echo "Nginx 설정 완료"
echo "=========================================="


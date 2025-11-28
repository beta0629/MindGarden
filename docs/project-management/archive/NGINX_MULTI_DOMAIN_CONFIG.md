# Nginx 다중 도메인 설정 가이드

**작성일**: 2025-11-18  
**목적**: 같은 IP, 같은 포트(80/443)에서 여러 도메인 처리 방법

## 1. 개요

**같은 IP 주소와 포트에서 여러 도메인을 사용할 수 있습니다.**

Nginx는 `server_name` 지시어를 통해 요청된 도메인에 따라 다른 설정을 적용합니다.

### 1.1 시나리오

**운영 서버:**
- IP: `211.37.179.204` (동일)
- 포트: `80` (HTTP), `443` (HTTPS) (동일)
- 도메인:
  - `app.core-solution.co.kr` (신규)
  - `m-garden.co.kr` (기존)
  - `api.core-solution.co.kr` (API)

**개발 서버:**
- IP: `114.202.247.246` (동일)
- 포트: `80` (HTTP), `443` (HTTPS) (동일)
- 도메인:
  - `dev.core-solution.co.kr` (신규)
  - `api.dev.core-solution.co.kr` (개발 API)
  - `dev.m-garden.co.kr` (기존)

## 2. Nginx 설정 구조

### 2.1 기본 구조

각 도메인별로 `server` 블록을 생성합니다:

```nginx
# 신규 도메인 (app.core-solution.co.kr)
server {
    listen 80;
    listen [::]:80;
    server_name app.core-solution.co.kr;

    # HTTP → HTTPS 리디렉션
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.core-solution.co.kr;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/app.core-solution.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.core-solution.co.kr/privkey.pem;

    # 프록시 설정
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# 기존 도메인 (m-garden.co.kr)
server {
    listen 80;
    listen [::]:80;
    server_name m-garden.co.kr;

    # HTTP → HTTPS 리디렉션
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name m-garden.co.kr;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/m-garden.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/m-garden.co.kr/privkey.pem;

    # 프록시 설정
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2.2 운영 서버 전체 설정 예시

**파일 위치**: `/etc/nginx/sites-available/core-solution`

```nginx
# ============================================
# 신규 도메인: app.core-solution.co.kr
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name app.core-solution.co.kr www.app.core-solution.co.kr;

    # Let's Encrypt 인증을 위한 경로
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # HTTP → HTTPS 리디렉션
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.core-solution.co.kr www.app.core-solution.co.kr;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/app.core-solution.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/app.core-solution.co.kr/privkey.pem;

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

    # 프록시 설정
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
    access_log /var/log/nginx/app.core-solution.co.kr.access.log;
    error_log /var/log/nginx/app.core-solution.co.kr.error.log;
}

# ============================================
# 기존 도메인: m-garden.co.kr
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name m-garden.co.kr www.m-garden.co.kr;

    # Let's Encrypt 인증을 위한 경로
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # HTTP → HTTPS 리디렉션
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name m-garden.co.kr www.m-garden.co.kr;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/m-garden.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/m-garden.co.kr/privkey.pem;

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

    # 프록시 설정
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
    access_log /var/log/nginx/m-garden.co.kr.access.log;
    error_log /var/log/nginx/m-garden.co.kr.error.log;
}

# ============================================
# API 도메인: api.core-solution.co.kr (선택)
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name api.core-solution.co.kr;

    # Let's Encrypt 인증을 위한 경로
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # HTTP → HTTPS 리디렉션
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.core-solution.co.kr;

    # SSL 인증서
    ssl_certificate /etc/letsencrypt/live/api.core-solution.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.core-solution.co.kr/privkey.pem;

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

        # CORS 헤더 (필요한 경우)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
    }

    # 로그 설정
    access_log /var/log/nginx/api.core-solution.co.kr.access.log;
    error_log /var/log/nginx/api.core-solution.co.kr.error.log;
}
```

## 3. 설정 적용 방법

### 3.1 설정 파일 생성

```bash
# 설정 파일 생성
sudo nano /etc/nginx/sites-available/core-solution

# 위의 설정 내용 복사/붙여넣기
```

### 3.2 심볼릭 링크 생성

```bash
# sites-enabled에 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/core-solution /etc/nginx/sites-enabled/

# 기존 default 설정 비활성화 (필요한 경우)
sudo rm /etc/nginx/sites-enabled/default
```

### 3.3 Nginx 설정 테스트

```bash
# 설정 파일 문법 확인
sudo nginx -t

# 출력 예시:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 3.4 Nginx 재시작

```bash
# Nginx 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

## 4. SSL 인증서 발급

### 4.1 여러 도메인 인증서 발급

**각 도메인별로 인증서 발급:**

```bash
# 신규 도메인 인증서
sudo certbot certonly --nginx -d app.core-solution.co.kr -d www.app.core-solution.co.kr

# 기존 도메인 인증서 (이미 있을 수 있음)
sudo certbot certonly --nginx -d m-garden.co.kr -d www.m-garden.co.kr

# API 도메인 인증서
sudo certbot certonly --nginx -d api.core-solution.co.kr
```

### 4.2 와일드카드 인증서 (선택)

여러 서브도메인을 사용하는 경우 와일드카드 인증서 사용 가능:

```bash
# 와일드카드 인증서 발급 (DNS 인증 필요)
sudo certbot certonly --manual --preferred-challenges dns -d "*.core-solution.co.kr" -d "core-solution.co.kr"
```

## 5. 동작 원리

### 5.1 요청 처리 흐름

1. 클라이언트가 `app.core-solution.co.kr`로 요청
2. DNS가 운영 서버 IP로 해석
3. Nginx가 80/443 포트에서 요청 수신
4. `Host` 헤더의 도메인 확인 (`app.core-solution.co.kr`)
5. `server_name`이 일치하는 `server` 블록 찾기
6. 해당 블록의 설정 적용 (SSL, 프록시 등)
7. 백엔드 애플리케이션으로 프록시

### 5.2 도메인별 독립성

- **각 도메인은 독립적인 설정 가능**
- **각 도메인은 독립적인 SSL 인증서 사용**
- **각 도메인은 독립적인 로그 파일 사용**
- **같은 백엔드 애플리케이션(포트 8080)으로 프록시 가능**

## 6. 주의사항

### 6.1 포트 충돌

- **같은 IP, 같은 포트에서 여러 도메인 사용 가능** ✅
- **각 도메인은 `server_name`으로 구분**
- **포트 충돌 없음**

### 6.2 SSL 인증서

- **각 도메인별로 SSL 인증서 필요**
- **와일드카드 인증서 사용 시 여러 서브도메인 커버 가능**
- **Let's Encrypt는 무료이므로 각 도메인별 발급 가능**

### 6.3 백엔드 애플리케이션

- **같은 백엔드 애플리케이션(포트 8080) 사용 가능**
- **애플리케이션에서 `Host` 헤더로 도메인 구분 가능**
- **환경 변수로 도메인별 설정 분리 가능**

## 7. 개발 서버 설정

개발 서버도 동일한 방식으로 설정:

**파일 위치**: `/etc/nginx/sites-available/core-solution-dev`

```nginx
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

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
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

    # API 전용 설정
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # CORS 헤더 (개발 환경)
        add_header Access-Control-Allow-Origin *;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
        add_header Access-Control-Allow-Headers "Authorization, Content-Type";
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

# ============================================
# 기존 개발 도메인: dev.m-garden.co.kr
# ============================================
server {
    listen 80;
    listen [::]:80;
    server_name dev.m-garden.co.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name dev.m-garden.co.kr;

    ssl_certificate /etc/letsencrypt/live/dev.m-garden.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.m-garden.co.kr/privkey.pem;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 8. 체크리스트

### 8.1 설정 전

- [ ] DNS 레코드 설정 완료 (모든 도메인)
- [ ] DNS 전파 확인 완료
- [ ] 포트 80, 443 오픈 확인

### 8.2 SSL 인증서

- [ ] 각 도메인별 SSL 인증서 발급
- [ ] SSL 인증서 경로 확인

### 8.3 Nginx 설정

- [ ] 각 도메인별 `server` 블록 생성
- [ ] `server_name` 정확히 설정
- [ ] SSL 인증서 경로 설정
- [ ] 프록시 설정 확인
- [ ] Nginx 설정 테스트 (`nginx -t`)
- [ ] Nginx 재시작

### 8.4 테스트

- [ ] 각 도메인 HTTPS 접근 확인
- [ ] HTTP → HTTPS 리디렉션 확인
- [ ] 백엔드 애플리케이션 연결 확인
- [ ] 로그 파일 확인

## 9. 문제 해결

### 9.1 502 Bad Gateway

**원인**: 백엔드 애플리케이션이 실행되지 않음

**해결**:
```bash
# 백엔드 애플리케이션 상태 확인
sudo systemctl status mindgarden.service

# 백엔드 애플리케이션 재시작
sudo systemctl restart mindgarden.service
```

### 9.2 SSL 인증서 오류

**원인**: SSL 인증서 경로 오류 또는 인증서 만료

**해결**:
```bash
# SSL 인증서 경로 확인
ls -la /etc/letsencrypt/live/[도메인]/

# SSL 인증서 갱신
sudo certbot renew
```

### 9.3 도메인별 라우팅 실패

**원인**: `server_name` 설정 오류

**해결**:
```bash
# Nginx 설정 확인
sudo nginx -t

# 로그 확인
sudo tail -f /var/log/nginx/error.log
```

## 10. 요약

✅ **같은 IP, 같은 포트(80/443)에서 여러 도메인 사용 가능**

✅ **Nginx의 `server_name`으로 도메인별 라우팅**

✅ **각 도메인별로 독립적인 SSL 인증서 사용**

✅ **같은 백엔드 애플리케이션으로 프록시 가능**

✅ **도메인별 독립적인 설정 및 로그 관리**


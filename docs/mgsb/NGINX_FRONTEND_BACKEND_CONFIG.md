# Nginx 프론트엔드 + 백엔드 통합 설정 가이드

**작성일**: 2025-11-21  
**목적**: 프론트엔드 정적 파일 서빙 + 백엔드 API 프록시 통합 설정

## 1. 개요

Nginx는 다음과 같이 동작해야 합니다:
- **프론트엔드 정적 파일**: `/var/www/html-dev` (또는 `/var/www/html-prod`)에서 서빙
- **백엔드 API**: `http://127.0.0.1:8080`으로 프록시
- **정적 파일 캐싱**: JS, CSS, 이미지 등은 캐싱 적용
- **SPA 라우팅**: React Router 등 SPA를 위한 `try_files` 설정

## 2. 개발 서버 설정

### 2.1 dev.core-solution.co.kr 설정

**파일 위치**: `/etc/nginx/sites-available/core-solution-dev`

```nginx
# HTTP → HTTPS 리디렉션
server {
    listen 80;
    listen [::]:80;
    server_name dev.core-solution.co.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

# HTTPS 서버
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

    # 프론트엔드 파일 서빙 (SPA 라우팅 지원)
    location / {
        root /var/www/html-dev;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 개발 환경: 캐싱 비활성화
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # 정적 파일 캐싱 (JS, CSS, 이미지 등)
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/html-dev;
        expires 1h;
        add_header Cache-Control "public, max-age=3600";
    }
    
    # 백엔드 API 프록시
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket 지원
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 버퍼링 비활성화 (실시간 통신)
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Actuator 프록시 (헬스체크 등)
    location /actuator/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 로그 설정
    access_log /var/log/nginx/dev.core-solution.co.kr.access.log;
    error_log /var/log/nginx/dev.core-solution.co.kr.error.log;
}
```

### 2.2 dev.m-garden.co.kr 설정 (기존 - 참고용)

**파일 위치**: `/etc/nginx/sites-available/dev.m-garden.co.kr.conf`

```nginx
# HTTP → HTTPS 리디렉션
server {
    listen 80;
    server_name dev.m-garden.co.kr;
    
    location /.well-known/acme-challenge/ {
        root /var/www/html-dev;
        try_files $uri =404;
    }
    
    return 301 https://$server_name$request_uri;
}

# HTTPS 서버
server {
    listen 443 ssl http2;
    server_name dev.m-garden.co.kr;
    
    ssl_certificate /etc/letsencrypt/live/dev.m-garden.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.m-garden.co.kr/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # 보안 헤더
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # 프론트엔드 파일 서빙
    location / {
        root /var/www/html-dev;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # 정적 파일 캐싱
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
```

## 3. 운영 서버 설정

### 3.1 app.core-solution.co.kr 설정

**파일 위치**: `/etc/nginx/sites-available/core-solution`

```nginx
# HTTP → HTTPS 리디렉션
server {
    listen 80;
    listen [::]:80;
    server_name app.core-solution.co.kr;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    return 301 https://$server_name$request_uri;
}

# HTTPS 서버
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name app.core-solution.co.kr;

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

    # 프론트엔드 파일 서빙 (SPA 라우팅 지원)
    location / {
        root /var/www/html-prod;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # 운영 환경: 캐싱 활성화 (HTML은 캐싱 안 함)
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
    
    # 정적 파일 캐싱 (JS, CSS, 이미지 등) - 운영 환경: 더 긴 캐싱
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /var/www/html-prod;
        expires 7d;
        add_header Cache-Control "public, max-age=604800";
    }
    
    # 백엔드 API 프록시
    location /api/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $server_name;
        
        # 타임아웃 설정
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
        
        # WebSocket 지원
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # 버퍼링 비활성화
        proxy_buffering off;
        proxy_request_buffering off;
    }
    
    # Actuator 프록시
    location /actuator/ {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # 로그 설정
    access_log /var/log/nginx/app.core-solution.co.kr.access.log;
    error_log /var/log/nginx/app.core-solution.co.kr.error.log;
}
```

## 4. 핵심 설정 포인트

### 4.1 프론트엔드 서빙 설정

```nginx
location / {
    root /var/www/html-dev;  # 개발: html-dev, 운영: html-prod
    index index.html;
    try_files $uri $uri/ /index.html;  # SPA 라우팅 지원
}
```

**중요**: `try_files $uri $uri/ /index.html;`은 React Router 등 SPA 라우팅을 위해 필수입니다.

### 4.2 정적 파일 캐싱

```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
    root /var/www/html-dev;
    expires 1h;  # 개발: 1시간, 운영: 7일
    add_header Cache-Control "public, max-age=3600";
}
```

### 4.3 백엔드 API 프록시

```nginx
location /api/ {
    proxy_pass http://127.0.0.1:8080;  # IPv4 명시 (IPv6 문제 방지)
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

**중요**: `proxy_pass`는 `http://127.0.0.1:8080`을 사용해야 합니다. `localhost`는 IPv6/IPv4 해석 문제가 발생할 수 있습니다.

### 4.4 경로 우선순위

Nginx location 블록 우선순위:
1. `location /actuator/` - Actuator 경로 (가장 구체적)
2. `location /api/` - API 경로
3. `location ~* \.(js|css|...)$` - 정적 파일 (정규식)
4. `location /` - 프론트엔드 파일 (가장 일반적)

## 5. 프론트엔드 배포 경로

### 5.1 개발 서버

```bash
# 프론트엔드 빌드 파일 배포 경로
/var/www/html-dev/
├── index.html
├── static/
│   ├── js/
│   ├── css/
│   └── media/
├── favicon.ico
└── manifest.json
```

### 5.2 운영 서버

```bash
# 프론트엔드 빌드 파일 배포 경로
/var/www/html-prod/
├── index.html
├── static/
│   ├── js/
│   ├── css/
│   └── media/
├── favicon.ico
└── manifest.json
```

## 6. 설정 적용 방법

### 6.1 개발 서버

```bash
# 1. 설정 파일 수정
sudo nano /etc/nginx/sites-available/core-solution-dev

# 2. 설정 테스트
sudo nginx -t

# 3. Nginx 재시작
sudo systemctl reload nginx

# 4. 확인
curl -I https://dev.core-solution.co.kr
curl -I https://dev.core-solution.co.kr/api/health
```

### 6.2 운영 서버

```bash
# 1. 설정 파일 수정
sudo nano /etc/nginx/sites-available/core-solution

# 2. 설정 테스트
sudo nginx -t

# 3. Nginx 재시작
sudo systemctl reload nginx

# 4. 확인
curl -I https://app.core-solution.co.kr
curl -I https://app.core-solution.co.kr/api/health
```

## 7. 문제 해결

### 7.1 404 에러 발생 시

**증상**: 도메인 접속 시 404 에러

**원인**:
- 프론트엔드 파일이 배포되지 않음
- Nginx 설정에서 프론트엔드 서빙 설정이 없음
- `root` 경로가 잘못됨

**해결**:
```bash
# 1. 프론트엔드 파일 확인
ls -la /var/www/html-dev/

# 2. Nginx 설정 확인
grep -A 10 "location /" /etc/nginx/sites-available/core-solution-dev

# 3. root 경로 확인
grep "root /var/www" /etc/nginx/sites-available/core-solution-dev
```

### 7.2 API 프록시 실패 시

**증상**: `/api/` 경로 접속 시 502 Bad Gateway

**원인**:
- 백엔드 서비스가 실행되지 않음
- `proxy_pass` 주소가 잘못됨 (IPv6/IPv4 문제)

**해결**:
```bash
# 1. 백엔드 서비스 확인
systemctl status mindgarden-dev.service

# 2. 포트 확인
netstat -tlnp | grep :8080

# 3. 프록시 주소 확인 (IPv4 명시)
grep "proxy_pass" /etc/nginx/sites-available/core-solution-dev
# 반드시 http://127.0.0.1:8080 이어야 함
```

### 7.3 SPA 라우팅 실패 시

**증상**: 직접 URL 접속 시 404, 브라우저 새로고침 시 404

**원인**:
- `try_files` 설정이 없음
- `location /` 블록이 없음

**해결**:
```nginx
location / {
    root /var/www/html-dev;
    index index.html;
    try_files $uri $uri/ /index.html;  # 이 줄이 필수!
}
```

## 8. 체크리스트

### 개발 서버 배포 전

- [ ] 프론트엔드 빌드 완료 (`npm run build`)
- [ ] 빌드 파일을 `/var/www/html-dev/`에 배포
- [ ] Nginx 설정 파일에 프론트엔드 서빙 설정 추가
- [ ] `location /api/` 블록이 백엔드로 프록시되도록 설정
- [ ] `location /actuator/` 블록이 백엔드로 프록시되도록 설정
- [ ] `try_files $uri $uri/ /index.html;` 설정 확인
- [ ] `proxy_pass`가 `http://127.0.0.1:8080`으로 설정되어 있는지 확인
- [ ] Nginx 설정 테스트: `nginx -t`
- [ ] Nginx 재시작: `systemctl reload nginx`

### 운영 서버 배포 전

- [ ] 프론트엔드 빌드 완료 (`npm run build`)
- [ ] 빌드 파일을 `/var/www/html-prod/`에 배포
- [ ] Nginx 설정 파일에 프론트엔드 서빙 설정 추가
- [ ] 정적 파일 캐싱 시간 조정 (운영: 7일)
- [ ] 보안 헤더 확인
- [ ] Nginx 설정 테스트: `nginx -t`
- [ ] Nginx 재시작: `systemctl reload nginx`

## 9. 참조 문서

- `NGINX_MULTI_DOMAIN_CONFIG.md` - 다중 도메인 설정 가이드
- `DEV_SERVER_DOMAIN_CONFIGURATION.md` - 개발 서버 도메인 설정
- `DEPLOYMENT_CHECKLIST.md` - 배포 체크리스트

---

**마지막 업데이트**: 2025-11-21


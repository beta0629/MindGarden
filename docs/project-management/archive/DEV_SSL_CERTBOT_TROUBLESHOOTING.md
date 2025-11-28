# 개발 서버 SSL 인증서 발급 문제 해결 가이드

작성일: 2025-01-XX

---

## 문제: Certbot 인증서 발급 실패

### 오류 메시지

```
Domain: dev.m-garden.co.kr
Type:   unauthorized
Detail: Invalid response from https://dev.m-garden.co.kr/.well-known/acme-challenge/...
```

### 원인

Let's Encrypt가 도메인 검증을 위해 `.well-known/acme-challenge/` 경로에 접근했지만, HTML 페이지가 반환되어 검증에 실패했습니다.

**주요 원인:**
1. Nginx 설정에서 `.well-known/acme-challenge/` 경로가 제대로 설정되지 않음
2. HTTP(80) 포트에서 리다이렉트가 먼저 실행되어 챌린지 파일에 접근할 수 없음
3. 디렉토리 권한 문제

---

## 해결 방법

### 방법 1: Nginx 설정 수정 후 재시도

**1. Nginx 설정 파일 확인**

```bash
sudo nano /etc/nginx/sites-available/dev.m-garden.co.kr.conf
```

**2. HTTP 서버 블록 확인**

다음과 같이 설정되어 있어야 합니다:

```nginx
server {
    listen 80;
    server_name dev.m-garden.co.kr;
    
    # Let's Encrypt 인증서 발급/갱신을 위한 경로 (최우선)
    location /.well-known/acme-challenge/ {
        root /var/www/html-dev;
        try_files $uri =404;
    }
    
    # HTTPS로 리다이렉트
    location / {
        return 301 https://$server_name$request_uri;
    }
}
```

**3. 디렉토리 생성 및 권한 설정**

```bash
# 디렉토리 생성
sudo mkdir -p /var/www/html-dev/.well-known/acme-challenge

# 권한 설정
sudo chown -R www-data:www-data /var/www/html-dev
sudo chmod -R 755 /var/www/html-dev
```

**4. Nginx 설정 테스트 및 재시작**

```bash
# 설정 파일 문법 검사
sudo nginx -t

# Nginx 재시작
sudo systemctl reload nginx
```

**5. Certbot 재시도**

```bash
sudo certbot --nginx -d dev.m-garden.co.kr
```

---

### 방법 2: Webroot 방식 사용 (권장)

Nginx 플러그인이 작동하지 않는 경우, Webroot 방식을 사용하세요:

```bash
# 1. 디렉토리 생성 및 권한 설정
sudo mkdir -p /var/www/html-dev/.well-known/acme-challenge
sudo chown -R www-data:www-data /var/www/html-dev
sudo chmod -R 755 /var/www/html-dev

# 2. Webroot 방식으로 인증서 발급 (Nginx 플러그인 사용 안 함)
sudo certbot certonly --webroot -w /var/www/html-dev -d dev.m-garden.co.kr

# 3. 인증서 발급 확인
sudo certbot certificates

# 4. 인증서 발급 후 Nginx 설정에 SSL 추가
sudo certbot --nginx -d dev.m-garden.co.kr
```

**참고**: Webroot 방식은 Nginx를 중지할 필요가 없고, HTTP만 사용하므로 더 안전합니다.

---

### 방법 3: Standalone 방식 사용 (Nginx 중지 필요)

```bash
# 1. Nginx 중지
sudo systemctl stop nginx

# 2. Standalone 방식으로 인증서 발급
sudo certbot certonly --standalone -d dev.m-garden.co.kr

# 3. Nginx 재시작
sudo systemctl start nginx

# 4. Nginx 설정에 SSL 설정 추가
```

---

## 확인 사항

### 1. DNS 설정 확인

```bash
# DNS 전파 확인
nslookup dev.m-garden.co.kr
dig dev.m-garden.co.kr

# IP 주소가 개발 서버 IP와 일치하는지 확인
```

### 2. 방화벽 확인

```bash
# HTTP(80) 포트가 열려있는지 확인
sudo ufw status
sudo netstat -tlnp | grep :80
```

### 3. Nginx 접근 확인

```bash
# HTTP로 직접 접근 테스트
curl -I http://dev.m-garden.co.kr/.well-known/acme-challenge/test

# HTML이 아닌 404 오류가 나와야 정상
```

---

## 예방 방법

### 1. Nginx 설정 파일 업데이트

최신 설정 파일을 사용하면 자동으로 올바르게 설정됩니다:

```bash
# 설정 파일 업데이트
sudo cp /path/to/config/nginx/dev.m-garden.co.kr.conf /etc/nginx/sites-available/dev.m-garden.co.kr.conf
sudo nginx -t
sudo systemctl reload nginx
```

### 2. 스크립트 사용

`setup-dev-nginx.sh` 스크립트를 사용하면 자동으로 올바른 설정이 적용됩니다:

```bash
./scripts/setup-dev-nginx.sh
```

---

## 추가 참고

- [Let's Encrypt 공식 문서](https://letsencrypt.org/docs/)
- [Certbot 공식 문서](https://certbot.eff.org/)
- [Nginx SSL 설정 가이드](./DEV_SERVER_NGINX_SETUP.md)


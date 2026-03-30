# SSL 인증서 발급 가이드 (Let's Encrypt)

**작성일**: 2025-11-18  
**목적**: 모든 도메인에 대한 무료 SSL 인증서(Let's Encrypt) 발급 가이드

## 1. 개요

**Let's Encrypt**는 무료 SSL/TLS 인증서를 제공하는 인증 기관입니다. 모든 도메인에 대해 무료로 SSL 인증서를 발급받을 수 있습니다.

### 1.1 발급 대상 도메인

**e-trinity.co.kr (회사 도메인):**
- `e-trinity.co.kr` (운영)
- `dev.e-trinity.co.kr` (개발)
- `apply.e-trinity.co.kr` (운영)
- `apply.dev.e-trinity.co.kr` (개발)
- `ops.e-trinity.co.kr` (운영)
- `ops.dev.e-trinity.co.kr` (개발)
- `www.e-trinity.co.kr` (CNAME, 선택)

**core-solution.co.kr (솔루션 도메인):**
- `dev.core-solution.co.kr` (개발)
- `api.dev.core-solution.co.kr` (개발)
- `app.core-solution.co.kr` (운영)
- `api.core-solution.co.kr` (운영)

**m-garden.co.kr (기존 도메인):**
- `dev.m-garden.co.kr` (개발)
- `m-garden.co.kr` (운영)

## 2. 사전 준비

### 2.1 Certbot 설치 확인

```bash
# Certbot 설치 확인
which certbot

# 설치되어 있지 않다면 설치
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# 또는 Nginx 플러그인 없이 설치
sudo apt-get install certbot
```

### 2.2 DNS 전파 확인

**중요**: SSL 인증서 발급 전에 DNS 전파가 완료되어야 합니다.

```bash
# 각 도메인 DNS 확인
nslookup dev.e-trinity.co.kr
nslookup apply.dev.e-trinity.co.kr
nslookup dev.core-solution.co.kr
nslookup api.dev.core-solution.co.kr
# ... (모든 도메인 확인)
```

### 2.3 포트 확인

Let's Encrypt 인증을 위해 포트 80이 열려있어야 합니다.

```bash
# 포트 80 확인
sudo netstat -tlnp | grep :80
# 또는
sudo ss -tlnp | grep :80
```

## 3. SSL 인증서 발급 방법

### 3.1 방법 1: Nginx 플러그인 사용 (권장)

Nginx가 이미 설정되어 있고 도메인이 Nginx로 연결되어 있는 경우:

```bash
# 단일 도메인
sudo certbot --nginx -d dev.e-trinity.co.kr

# 여러 도메인 동시 발급
sudo certbot --nginx -d dev.e-trinity.co.kr -d www.dev.e-trinity.co.kr
```

**장점:**
- Nginx 설정 자동 업데이트
- SSL 설정 자동 구성

### 3.2 방법 2: Standalone 모드

Nginx가 아직 설정되지 않았거나, 수동으로 설정하고 싶은 경우:

```bash
# Nginx 중지 (포트 80 사용)
sudo systemctl stop nginx

# 인증서 발급
sudo certbot certonly --standalone -d dev.e-trinity.co.kr

# Nginx 재시작
sudo systemctl start nginx
```

**장점:**
- Nginx 설정 파일을 직접 제어 가능
- 더 세밀한 설정 가능

### 3.3 방법 3: Webroot 모드

웹 서버가 실행 중이고 특정 경로에 파일을 배치할 수 있는 경우:

```bash
sudo certbot certonly --webroot \
  -w /var/www/html \
  -d dev.e-trinity.co.kr
```

## 4. 도메인별 SSL 인증서 발급

### 4.1 e-trinity.co.kr (회사 도메인)

#### 개발 서버 (114.202.247.246)

```bash
# 개발 회사 홈페이지
sudo certbot --nginx -d dev.e-trinity.co.kr

# 개발 온보딩
sudo certbot --nginx -d apply.dev.e-trinity.co.kr

# 개발 운영 포털
sudo certbot --nginx -d ops.dev.e-trinity.co.kr
```

#### 운영 서버 (211.37.179.204)

```bash
# 운영 회사 홈페이지
sudo certbot --nginx -d e-trinity.co.kr -d www.e-trinity.co.kr

# 운영 온보딩
sudo certbot --nginx -d apply.e-trinity.co.kr

# 운영 포털
sudo certbot --nginx -d ops.e-trinity.co.kr
```

### 4.2 core-solution.co.kr (솔루션 도메인)

#### 개발 서버 (114.202.247.246)

```bash
# 개발 서버
sudo certbot --nginx -d dev.core-solution.co.kr

# 개발 API 서버
sudo certbot --nginx -d api.dev.core-solution.co.kr
```

#### 운영 서버 (211.37.179.204)

```bash
# 운영 서버
sudo certbot --nginx -d app.core-solution.co.kr

# 운영 API 서버
sudo certbot --nginx -d api.core-solution.co.kr
```

### 4.3 m-garden.co.kr (기존 도메인)

#### 개발 서버 (114.202.247.246)

```bash
# 개발 서버 (기존)
sudo certbot --nginx -d dev.m-garden.co.kr
```

#### 운영 서버 (211.37.179.204)

```bash
# 운영 서버 (기존)
sudo certbot --nginx -d m-garden.co.kr
```

## 5. 인증서 발급 스크립트

### 5.1 개발 서버 SSL 인증서 발급 스크립트

**파일**: `scripts/issue-ssl-dev.sh`

```bash
#!/bin/bash

# 개발 서버 SSL 인증서 발급 스크립트
# 서버 IP: 114.202.247.246

echo "=== 개발 서버 SSL 인증서 발급 시작 ==="

# e-trinity.co.kr 도메인
echo "1. dev.e-trinity.co.kr"
sudo certbot --nginx -d dev.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr

echo "2. apply.dev.e-trinity.co.kr"
sudo certbot --nginx -d apply.dev.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr

echo "3. ops.dev.e-trinity.co.kr"
sudo certbot --nginx -d ops.dev.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr

# core-solution.co.kr 도메인
echo "4. dev.core-solution.co.kr"
sudo certbot --nginx -d dev.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr

echo "5. api.dev.core-solution.co.kr"
sudo certbot --nginx -d api.dev.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr

# m-garden.co.kr 도메인 (기존)
echo "6. dev.m-garden.co.kr"
sudo certbot --nginx -d dev.m-garden.co.kr --non-interactive --agree-tos --email admin@m-garden.co.kr

echo "=== 개발 서버 SSL 인증서 발급 완료 ==="
```

### 5.2 운영 서버 SSL 인증서 발급 스크립트

**파일**: `scripts/issue-ssl-prod.sh`

```bash
#!/bin/bash

# 운영 서버 SSL 인증서 발급 스크립트
# 서버 IP: 211.37.179.204

echo "=== 운영 서버 SSL 인증서 발급 시작 ==="

# e-trinity.co.kr 도메인
echo "1. e-trinity.co.kr"
sudo certbot --nginx -d e-trinity.co.kr -d www.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr

echo "2. apply.e-trinity.co.kr"
sudo certbot --nginx -d apply.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr

echo "3. ops.e-trinity.co.kr"
sudo certbot --nginx -d ops.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr

# core-solution.co.kr 도메인
echo "4. app.core-solution.co.kr"
sudo certbot --nginx -d app.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr

echo "5. api.core-solution.co.kr"
sudo certbot --nginx -d api.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr

# m-garden.co.kr 도메인 (기존)
echo "6. m-garden.co.kr"
sudo certbot --nginx -d m-garden.co.kr --non-interactive --agree-tos --email admin@m-garden.co.kr

echo "=== 운영 서버 SSL 인증서 발급 완료 ==="
```

## 6. 인증서 위치 및 확인

### 6.1 인증서 저장 위치

Let's Encrypt 인증서는 다음 위치에 저장됩니다:

```
/etc/letsencrypt/live/[도메인]/
├── cert.pem          # 인증서
├── chain.pem         # 중간 인증서
├── fullchain.pem     # 인증서 + 중간 인증서 (Nginx에서 사용)
└── privkey.pem       # 개인 키
```

### 6.2 인증서 확인

```bash
# 인증서 목록 확인
sudo certbot certificates

# 특정 도메인 인증서 확인
sudo certbot certificates | grep dev.e-trinity.co.kr

# 인증서 만료일 확인
sudo openssl x509 -in /etc/letsencrypt/live/dev.e-trinity.co.kr/fullchain.pem -noout -dates
```

## 7. 자동 갱신 설정

### 7.1 자동 갱신 테스트

```bash
# 자동 갱신 테스트 (실제 갱신하지 않음)
sudo certbot renew --dry-run
```

### 7.2 자동 갱신 활성화

Certbot은 자동으로 systemd 타이머를 설정합니다:

```bash
# 타이머 상태 확인
sudo systemctl status certbot.timer

# 타이머 활성화 (이미 활성화되어 있을 수 있음)
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 타이머 목록 확인
sudo systemctl list-timers | grep certbot
```

### 7.3 수동 갱신

```bash
# 모든 인증서 갱신
sudo certbot renew

# 특정 인증서만 갱신
sudo certbot renew --cert-name dev.e-trinity.co.kr
```

## 8. Nginx 설정 확인

### 8.1 Certbot이 자동으로 추가한 설정

Certbot은 Nginx 설정 파일에 다음과 같은 설정을 자동으로 추가합니다:

```nginx
server {
    listen 443 ssl http2;
    server_name dev.e-trinity.co.kr;

    ssl_certificate /etc/letsencrypt/live/dev.e-trinity.co.kr/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/dev.e-trinity.co.kr/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # ... 기타 설정
}
```

### 8.2 HTTP → HTTPS 리디렉션

Certbot은 자동으로 HTTP → HTTPS 리디렉션을 설정합니다:

```nginx
server {
    listen 80;
    server_name dev.e-trinity.co.kr;
    return 301 https://$server_name$request_uri;
}
```

## 9. 문제 해결

### 9.1 인증서 발급 실패

**증상**: `Failed to obtain certificate`

**해결 방법:**
1. DNS 전파 확인
   ```bash
   nslookup [도메인]
   dig [도메인]
   ```

2. 포트 80 확인
   ```bash
   sudo netstat -tlnp | grep :80
   ```

3. 방화벽 확인
   ```bash
   sudo ufw status
   sudo iptables -L -n
   ```

4. 이전 인증서 삭제 후 재시도
   ```bash
   sudo certbot delete --cert-name [도메인]
   sudo certbot --nginx -d [도메인]
   ```

### 9.2 인증서 갱신 실패

**증상**: 자동 갱신 실패

**해결 방법:**
1. 로그 확인
   ```bash
   sudo journalctl -u certbot.timer
   sudo journalctl -u certbot.service
   ```

2. 수동 갱신 시도
   ```bash
   sudo certbot renew --force-renewal
   ```

### 9.3 Nginx 설정 오류

**증상**: `nginx -t` 실패

**해결 방법:**
1. 설정 파일 문법 확인
   ```bash
   sudo nginx -t
   ```

2. Certbot이 추가한 설정 확인
   ```bash
   sudo grep -r "letsencrypt" /etc/nginx/
   ```

## 10. 체크리스트

### 10.1 개발 서버 (114.202.247.246)

- [ ] `dev.e-trinity.co.kr` SSL 인증서 발급
- [ ] `apply.dev.e-trinity.co.kr` SSL 인증서 발급
- [ ] `ops.dev.e-trinity.co.kr` SSL 인증서 발급
- [ ] `dev.core-solution.co.kr` SSL 인증서 발급
- [ ] `api.dev.core-solution.co.kr` SSL 인증서 발급
- [ ] `dev.m-garden.co.kr` SSL 인증서 발급 (기존)
- [ ] 자동 갱신 설정 확인

### 10.2 운영 서버 (211.37.179.204)

- [ ] `e-trinity.co.kr` SSL 인증서 발급
- [ ] `apply.e-trinity.co.kr` SSL 인증서 발급
- [ ] `ops.e-trinity.co.kr` SSL 인증서 발급
- [ ] `app.core-solution.co.kr` SSL 인증서 발급
- [ ] `api.core-solution.co.kr` SSL 인증서 발급
- [ ] `m-garden.co.kr` SSL 인증서 발급 (기존)
- [ ] 자동 갱신 설정 확인

## 11. 참고 사항

### 11.1 Let's Encrypt 제한사항

- **인증서 유효기간**: 90일
- **자동 갱신**: 만료 30일 전부터 갱신 가능
- **주간 발급 제한**: 도메인당 주당 50개 (갱신 제외)
- **Rate Limit**: https://letsencrypt.org/docs/rate-limits/

### 11.2 이메일 알림

Certbot은 인증서 만료 전에 이메일로 알림을 보냅니다. 이메일 주소는 발급 시 입력한 주소로 전송됩니다.

### 11.3 인증서 갱신 로그

```bash
# 갱신 로그 확인
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

## 12. 빠른 참조

### 12.1 단일 도메인 발급

```bash
sudo certbot --nginx -d [도메인]
```

### 12.2 여러 도메인 동시 발급

```bash
sudo certbot --nginx -d [도메인1] -d [도메인2] -d [도메인3]
```

### 12.3 인증서 목록 확인

```bash
sudo certbot certificates
```

### 12.4 인증서 갱신

```bash
sudo certbot renew
```

### 12.5 인증서 삭제

```bash
sudo certbot delete --cert-name [도메인]
```


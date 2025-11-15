# 개발 서버 Nginx 및 서브도메인 설정 가이드

작성일: 2025-01-XX

---

## 1. 개요

개발 서버에 Nginx 웹서버를 설정하고 서브도메인(`dev.m-garden.co.kr`)을 적용하는 가이드입니다.

### 목표
- 개발 서버에 Nginx 설치 및 설정
- 서브도메인 `dev.m-garden.co.kr` 설정
- SSL 인증서 설정 (Let's Encrypt)
- 프론트엔드 정적 파일 서빙
- 백엔드 API 프록시 설정

---

## 2. 사전 준비

### 2.1 서버 정보

- **서버 호스트**: `beta0629.cafe24.com`
- **서브도메인**: `dev.m-garden.co.kr`
- **프론트엔드 경로**: `/var/www/html-dev`
- **백엔드 포트**: `8080`

### 2.2 필요한 권한

- root 또는 sudo 권한
- DNS 관리 권한 (서브도메인 설정)

---

## 3. DNS 설정

### 3.1 서브도메인 A 레코드 추가

도메인 관리 페이지에서 다음 A 레코드를 추가하세요:

```
Type: A
Name: dev
Value: [개발 서버 IP 주소]
TTL: 3600
```

**개발 서버 IP 확인:**
```bash
ssh root@beta0629.cafe24.com
hostname -I
# 또는
ip addr show
```

### 3.2 DNS 전파 확인

```bash
# DNS 전파 확인
nslookup dev.m-garden.co.kr
dig dev.m-garden.co.kr

# 또는
ping dev.m-garden.co.kr
```

---

## 4. Nginx 설치

### 4.1 Nginx 설치

```bash
ssh root@beta0629.cafe24.com

# Ubuntu/Debian
apt update
apt install -y nginx

# CentOS/RHEL
yum install -y nginx
# 또는
dnf install -y nginx
```

### 4.2 Nginx 서비스 시작

```bash
systemctl start nginx
systemctl enable nginx
systemctl status nginx
```

---

## 5. Nginx 설정

### 5.1 설정 파일 생성

```bash
# 설정 파일 복사
sudo cp /path/to/mindGarden/config/nginx/dev.m-garden.co.kr.conf /etc/nginx/sites-available/dev.m-garden.co.kr.conf

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/dev.m-garden.co.kr.conf /etc/nginx/sites-enabled/

# 기본 설정 비활성화 (선택사항)
sudo rm /etc/nginx/sites-enabled/default
```

### 5.2 설정 파일 수정

필요한 경우 설정 파일을 수정:

```bash
sudo nano /etc/nginx/sites-available/dev.m-garden.co.kr.conf
```

### 5.3 Nginx 설정 테스트

```bash
# 설정 파일 문법 검사
sudo nginx -t

# 설정 파일 재로드
sudo systemctl reload nginx
```

---

## 6. SSL 인증서 설정

### 6.1 Let's Encrypt 인증서 발급

```bash
# Certbot 설치
apt install -y certbot python3-certbot-nginx

# 인증서 발급 (Nginx 플러그인 사용)
sudo certbot --nginx -d dev.m-garden.co.kr

# 또는 수동으로
sudo certbot certonly --nginx -d dev.m-garden.co.kr
```

### 6.2 인증서 자동 갱신 설정

```bash
# Certbot 자동 갱신 테스트
sudo certbot renew --dry-run

# Cron 작업 확인 (자동 설정됨)
sudo systemctl status certbot.timer
```

### 6.3 인증서 경로 확인

Let's Encrypt 인증서는 다음 경로에 저장됩니다:

```
/etc/letsencrypt/live/dev.m-garden.co.kr/fullchain.pem
/etc/letsencrypt/live/dev.m-garden.co.kr/privkey.pem
```

---

## 7. 프론트엔드 디렉토리 설정

### 7.1 디렉토리 생성

```bash
sudo mkdir -p /var/www/html-dev
sudo chown -R www-data:www-data /var/www/html-dev
sudo chmod -R 755 /var/www/html-dev
```

### 7.2 프론트엔드 파일 배포

GitHub Actions 워크플로우가 자동으로 `/var/www/html-dev/`에 배포합니다.

수동 배포가 필요한 경우:

```bash
# 프론트엔드 빌드 파일 복사
sudo cp -r /path/to/frontend/build/* /var/www/html-dev/
sudo chown -R www-data:www-data /var/www/html-dev
```

---

## 8. 백엔드 서비스 확인

### 8.1 백엔드 서비스 상태 확인

```bash
# 서비스 상태 확인
sudo systemctl status mindgarden-dev.service

# 포트 확인
sudo netstat -tlnp | grep 8080
# 또는
sudo ss -tlnp | grep 8080
```

### 8.2 백엔드 헬스체크

```bash
# 로컬에서 헬스체크
curl http://localhost:8080/actuator/health

# Nginx를 통한 헬스체크
curl https://dev.m-garden.co.kr/actuator/health
```

---

## 9. 방화벽 설정

### 9.1 포트 열기

```bash
# HTTP (80)
sudo ufw allow 80/tcp

# HTTPS (443)
sudo ufw allow 443/tcp

# 방화벽 상태 확인
sudo ufw status
```

**⚠️ 주의**: 운영 서버와 달리 개발 서버는 방화벽 설정을 변경할 수 있습니다.

---

## 10. 최종 확인

### 10.1 서비스 상태 확인

```bash
# Nginx 상태
sudo systemctl status nginx

# 백엔드 서비스 상태
sudo systemctl status mindgarden-dev.service

# 포트 리스닝 확인
sudo netstat -tlnp | grep -E '80|443|8080'
```

### 10.2 웹 접속 테스트

```bash
# HTTP → HTTPS 리다이렉트 확인
curl -I http://dev.m-garden.co.kr

# HTTPS 접속 확인
curl -I https://dev.m-garden.co.kr

# 프론트엔드 확인
curl https://dev.m-garden.co.kr

# API 프록시 확인
curl https://dev.m-garden.co.kr/api/actuator/health
```

### 10.3 브라우저에서 확인

- 프론트엔드: `https://dev.m-garden.co.kr`
- API 헬스체크: `https://dev.m-garden.co.kr/api/actuator/health`

---

## 11. 문제 해결

### 11.1 Nginx 시작 실패

```bash
# 에러 로그 확인
sudo tail -f /var/log/nginx/error.log

# 설정 파일 문법 검사
sudo nginx -t
```

### 11.2 SSL 인증서 오류

```bash
# 인증서 만료 확인
sudo certbot certificates

# 인증서 수동 갱신
sudo certbot renew
```

### 11.3 프록시 연결 실패

```bash
# 백엔드 서비스 확인
sudo systemctl status mindgarden-dev.service

# 포트 확인
sudo netstat -tlnp | grep 8080

# 로컬에서 API 테스트
curl http://localhost:8080/api/actuator/health
```

### 11.4 502 Bad Gateway

**원인**: 백엔드 서비스가 실행되지 않음

**해결**:
```bash
# 백엔드 서비스 시작
sudo systemctl start mindgarden-dev.service

# 서비스 로그 확인
sudo journalctl -u mindgarden-dev.service -f
```

---

## 12. 자동화 스크립트

### 12.1 Nginx 설정 자동화 스크립트

```bash
#!/bin/bash
# scripts/setup-dev-nginx.sh

set -e

echo "🔧 개발 서버 Nginx 설정 시작..."

# Nginx 설치 확인
if ! command -v nginx &> /dev/null; then
    echo "📦 Nginx 설치 중..."
    apt update
    apt install -y nginx
fi

# 설정 파일 복사
echo "📝 Nginx 설정 파일 복사 중..."
sudo cp config/nginx/dev.m-garden.co.kr.conf /etc/nginx/sites-available/dev.m-garden.co.kr.conf

# 심볼릭 링크 생성
sudo ln -sf /etc/nginx/sites-available/dev.m-garden.co.kr.conf /etc/nginx/sites-enabled/

# 디렉토리 생성
sudo mkdir -p /var/www/html-dev
sudo chown -R www-data:www-data /var/www/html-dev

# Nginx 설정 테스트
echo "🔍 Nginx 설정 테스트..."
sudo nginx -t

# Nginx 재시작
echo "🔄 Nginx 재시작..."
sudo systemctl reload nginx

echo "✅ Nginx 설정 완료!"
```

---

## 13. 체크리스트

개발 서버 Nginx 설정 완료 체크리스트:

- [ ] DNS 서브도메인 A 레코드 추가 (`dev.m-garden.co.kr`)
- [ ] DNS 전파 확인
- [ ] Nginx 설치 완료
- [ ] Nginx 설정 파일 생성 및 활성화
- [ ] SSL 인증서 발급 (Let's Encrypt)
- [ ] 프론트엔드 디렉토리 생성 (`/var/www/html-dev`)
- [ ] 백엔드 서비스 실행 확인 (포트 8080)
- [ ] 방화벽 포트 열기 (80, 443)
- [ ] HTTP → HTTPS 리다이렉트 확인
- [ ] 프론트엔드 접속 확인
- [ ] API 프록시 동작 확인
- [ ] SSL 인증서 자동 갱신 설정

---

## 14. 관련 문서

- [개발 서버 설정 가이드](./DEV_SERVER_SETUP.md)
- [GitHub 개발 서버 설정 가이드](./GITHUB_DEV_SERVER_SETUP.md)
- [CI/CD 워크플로우 가이드](./CI_CD_WORKFLOW.md)
- [아키텍처 개요](./ARCHITECTURE_OVERVIEW.md)


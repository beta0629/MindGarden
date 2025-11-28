# 개발 서버 세팅 가이드

**작성일**: 2025-11-18  
**목적**: 개발 서버(114.202.247.246) 전체 세팅 가이드

## 1. 서버 정보

- **서버 IP**: `114.202.247.246`
- **운영체제**: Linux (Ubuntu/Debian 계열)
- **웹 서버**: Nginx
- **애플리케이션**: Spring Boot (포트 8080)

## 2. 사전 준비 체크리스트

### 2.1 서버 접속 확인

```bash
# SSH 접속
ssh root@114.202.247.246
# 또는
ssh [사용자명]@114.202.247.246
```

### 2.2 필수 패키지 설치 확인

```bash
# Nginx 설치 확인
nginx -v

# Certbot 설치 확인
certbot --version

# Java 설치 확인
java -version

# Maven 설치 확인 (필요한 경우)
mvn -version
```

### 2.3 포트 확인

```bash
# 포트 80, 443, 8080 확인
sudo netstat -tlnp | grep -E ':(80|443|8080)'
# 또는
sudo ss -tlnp | grep -E ':(80|443|8080)'
```

## 3. DNS 전파 확인

### 3.1 개발 서버 도메인 DNS 확인

```bash
# e-trinity.co.kr 도메인
nslookup dev.e-trinity.co.kr
nslookup apply.dev.e-trinity.co.kr
nslookup ops.dev.e-trinity.co.kr

# core-solution.co.kr 도메인
nslookup dev.core-solution.co.kr
nslookup api.dev.core-solution.co.kr

# m-garden.co.kr 도메인 (기존)
nslookup dev.m-garden.co.kr
```

**확인 사항:**
- 모든 도메인이 `114.202.247.246`로 해석되는지 확인
- DNS 전파가 완료되었는지 확인 (1-24시간 소요 가능)

### 3.2 온라인 DNS 확인 도구

- https://www.whatsmydns.net/
- https://dnschecker.org/

## 4. SSL 인증서 발급

### 4.1 Certbot 설치 (미설치 시)

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

### 4.2 SSL 인증서 발급

**방법 1: 스크립트 사용 (권장)**

```bash
# 스크립트 업로드 후 실행
sudo chmod +x issue-ssl-dev.sh
sudo ./issue-ssl-dev.sh
```

**방법 2: 개별 발급**

```bash
# e-trinity.co.kr 도메인
sudo certbot --nginx -d dev.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr
sudo certbot --nginx -d apply.dev.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr
sudo certbot --nginx -d ops.dev.e-trinity.co.kr --non-interactive --agree-tos --email admin@e-trinity.co.kr

# core-solution.co.kr 도메인
sudo certbot --nginx -d dev.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr
sudo certbot --nginx -d api.dev.core-solution.co.kr --non-interactive --agree-tos --email admin@core-solution.co.kr

# m-garden.co.kr 도메인 (기존)
sudo certbot --nginx -d dev.m-garden.co.kr --non-interactive --agree-tos --email admin@m-garden.co.kr
```

### 4.3 인증서 발급 확인

```bash
# 발급된 인증서 목록 확인
sudo certbot certificates

# 자동 갱신 설정 확인
sudo systemctl status certbot.timer
```

## 5. Nginx 설정

### 5.1 Nginx 설정 파일 생성

**파일 위치**: `/etc/nginx/sites-available/core-solution-dev`

```bash
sudo nano /etc/nginx/sites-available/core-solution-dev
```

**설정 내용**: `docs/mgsb/NGINX_MULTI_DOMAIN_CONFIG.md` 참조

### 5.2 심볼릭 링크 생성

```bash
# sites-enabled에 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/core-solution-dev /etc/nginx/sites-enabled/

# 기존 default 설정 비활성화 (필요한 경우)
sudo rm /etc/nginx/sites-enabled/default
```

### 5.3 Nginx 설정 테스트

```bash
# 설정 파일 문법 확인
sudo nginx -t

# 출력 예시:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### 5.4 Nginx 재시작

```bash
# Nginx 재시작
sudo systemctl restart nginx

# 상태 확인
sudo systemctl status nginx
```

## 6. 환경 변수 설정

### 6.1 환경 변수 파일 생성

**파일 위치**: `/etc/mindgarden/dev.env`

```bash
sudo mkdir -p /etc/mindgarden
sudo nano /etc/mindgarden/dev.env
```

### 6.2 필수 환경 변수 설정

```bash
# ============================================
# 서버 기본 URL (개발 서버 도메인)
# ============================================
SERVER_BASE_URL=https://dev.core-solution.co.kr

# ============================================
# WebAuthn/Passkey 설정
# ============================================
WEBAUTHN_RP_ID=dev.core-solution.co.kr
WEBAUTHN_CHALLENGE_TIMEOUT=60000

# ============================================
# 프론트엔드 URL
# ============================================
FRONTEND_BASE_URL=https://dev.core-solution.co.kr

# ============================================
# 회사 도메인 URL
# ============================================
COMPANY_URL=https://e-trinity.co.kr
ONBOARDING_URL=https://apply.e-trinity.co.kr
LEGACY_URL=https://dev.m-garden.co.kr

# ============================================
# 데이터베이스 설정 (기존과 동일)
# ============================================
DB_HOST=[기존 DB 호스트]
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=[기존 DB 사용자명]
DB_PASSWORD=[기존 DB 비밀번호]

# ============================================
# JWT 설정
# ============================================
JWT_SECRET=[JWT Secret Key]
JWT_EXPIRATION=3600000
JWT_REFRESH_EXPIRATION=604800000

# ============================================
# 개인정보 암호화 설정
# ============================================
PERSONAL_DATA_ENCRYPTION_ACTIVE_KEY_ID=dev-key-1
PERSONAL_DATA_ENCRYPTION_KEY=[암호화 키]
PERSONAL_DATA_ENCRYPTION_IV=[IV 값]

# ============================================
# OAuth2 설정
# ============================================
KAKAO_CLIENT_ID=[카카오 클라이언트 ID]
KAKAO_CLIENT_SECRET=[카카오 클라이언트 Secret]
KAKAO_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/kakao/callback

NAVER_CLIENT_ID=[네이버 클라이언트 ID]
NAVER_CLIENT_SECRET=[네이버 클라이언트 Secret]
NAVER_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/naver/callback

GOOGLE_CLIENT_ID=[Google 클라이언트 ID] (선택)
GOOGLE_CLIENT_SECRET=[Google 클라이언트 Secret] (선택)
GOOGLE_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/google/callback

APPLE_CLIENT_ID=[Apple 클라이언트 ID] (선택)
APPLE_CLIENT_SECRET=[Apple 클라이언트 Secret] (선택)
APPLE_REDIRECT_URI=https://dev.core-solution.co.kr/api/auth/apple/callback

# ============================================
# CORS 설정
# ============================================
CORS_ALLOWED_ORIGINS=https://dev.core-solution.co.kr,https://dev.m-garden.co.kr,https://dev.e-trinity.co.kr,https://apply.dev.e-trinity.co.kr,https://ops.dev.e-trinity.co.kr

# ============================================
# 이메일 설정
# ============================================
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=[이메일 주소]
MAIL_PASSWORD=[이메일 비밀번호]
```

### 6.3 환경 변수 파일 권한 설정

```bash
# 보안을 위해 소유자만 읽기 가능하도록 설정
sudo chmod 600 /etc/mindgarden/dev.env
sudo chown root:root /etc/mindgarden/dev.env
```

## 7. Systemd 서비스 설정

### 7.1 서비스 파일 생성

**파일 위치**: `/etc/systemd/system/mindgarden-dev.service`

```bash
sudo nano /etc/systemd/system/mindgarden-dev.service
```

### 7.2 서비스 파일 내용

```ini
[Unit]
Description=MindGarden Development Server
After=network.target mysql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/mindgarden
EnvironmentFile=/etc/mindgarden/dev.env
ExecStart=/usr/bin/java -jar /opt/mindgarden/mindgarden.jar --spring.profiles.active=dev
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=mindgarden-dev

[Install]
WantedBy=multi-user.target
```

### 7.3 서비스 활성화

```bash
# systemd 재로드
sudo systemctl daemon-reload

# 서비스 활성화
sudo systemctl enable mindgarden-dev.service

# 서비스 시작
sudo systemctl start mindgarden-dev.service

# 서비스 상태 확인
sudo systemctl status mindgarden-dev.service
```

## 8. 애플리케이션 배포

### 8.1 빌드 (로컬)

```bash
# 로컬에서 빌드
mvn clean package -DskipTests

# JAR 파일 확인
ls -lh target/mindgarden-*.jar
```

### 8.2 서버 업로드

```bash
# SCP로 서버에 업로드
scp target/mindgarden-*.jar root@114.202.247.246:/opt/mindgarden/mindgarden.jar

# 또는 rsync 사용
rsync -avz target/mindgarden-*.jar root@114.202.247.246:/opt/mindgarden/mindgarden.jar
```

### 8.3 서버에서 디렉토리 생성

```bash
# 애플리케이션 디렉토리 생성
sudo mkdir -p /opt/mindgarden
sudo chown root:root /opt/mindgarden
```

### 8.4 서비스 재시작

```bash
# 서비스 재시작
sudo systemctl restart mindgarden-dev.service

# 로그 확인
sudo journalctl -u mindgarden-dev.service -f
```

## 9. 기능 테스트

### 9.1 기본 접근 테스트

```bash
# HTTPS 접근 확인
curl -I https://dev.core-solution.co.kr
curl -I https://dev.e-trinity.co.kr
curl -I https://apply.dev.e-trinity.co.kr
curl -I https://ops.dev.e-trinity.co.kr
curl -I https://api.dev.core-solution.co.kr
curl -I https://dev.m-garden.co.kr
```

### 9.2 API 테스트

```bash
# Health Check
curl https://dev.core-solution.co.kr/api/health

# CORS 테스트
curl -H "Origin: https://dev.e-trinity.co.kr" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS \
     https://dev.core-solution.co.kr/api/health
```

### 9.3 브라우저 테스트

- [ ] `https://dev.core-solution.co.kr` 접근 정상
- [ ] `https://dev.e-trinity.co.kr` 접근 정상
- [ ] `https://apply.dev.e-trinity.co.kr` 접근 정상
- [ ] `https://ops.dev.e-trinity.co.kr` 접근 정상
- [ ] `https://api.dev.core-solution.co.kr` 접근 정상
- [ ] `https://dev.m-garden.co.kr` 접근 정상
- [ ] HTTP → HTTPS 리디렉션 정상

## 10. 문제 해결

### 10.1 Nginx 오류

```bash
# Nginx 로그 확인
sudo tail -f /var/log/nginx/error.log

# 설정 파일 문법 확인
sudo nginx -t
```

### 10.2 애플리케이션 오류

```bash
# 서비스 로그 확인
sudo journalctl -u mindgarden-dev.service -n 100

# 애플리케이션 로그 확인
sudo tail -f /var/log/mindgarden/dev.log
```

### 10.3 SSL 인증서 오류

```bash
# 인증서 확인
sudo certbot certificates

# 인증서 경로 확인
ls -la /etc/letsencrypt/live/[도메인]/
```

## 11. 체크리스트

### 11.1 사전 준비

- [ ] 서버 접속 확인
- [ ] 필수 패키지 설치 확인 (Nginx, Certbot, Java)
- [ ] 포트 확인 (80, 443, 8080)

### 11.2 DNS 설정

- [ ] 모든 도메인 DNS 전파 확인
- [ ] DNS 조회 테스트 (nslookup, dig)

### 11.3 SSL 인증서

- [ ] `dev.e-trinity.co.kr` SSL 인증서 발급
- [ ] `apply.dev.e-trinity.co.kr` SSL 인증서 발급
- [ ] `ops.dev.e-trinity.co.kr` SSL 인증서 발급
- [ ] `dev.core-solution.co.kr` SSL 인증서 발급
- [ ] `api.dev.core-solution.co.kr` SSL 인증서 발급
- [ ] `dev.m-garden.co.kr` SSL 인증서 발급
- [ ] 자동 갱신 설정 확인

### 11.4 Nginx 설정

- [ ] Nginx 설정 파일 생성
- [ ] 모든 도메인 server 블록 설정
- [ ] SSL 인증서 경로 설정
- [ ] 프록시 설정 확인
- [ ] Nginx 설정 테스트
- [ ] Nginx 재시작

### 11.5 환경 변수

- [ ] 환경 변수 파일 생성
- [ ] 모든 필수 환경 변수 설정
- [ ] 파일 권한 설정

### 11.6 애플리케이션 배포

- [ ] JAR 파일 빌드
- [ ] 서버 업로드
- [ ] Systemd 서비스 설정
- [ ] 서비스 시작 및 확인

### 11.7 테스트

- [ ] 모든 도메인 HTTPS 접근 확인
- [ ] API 동작 확인
- [ ] CORS 동작 확인
- [ ] OAuth2 로그인 테스트
- [ ] Passkey 인증 테스트

## 12. 빠른 참조

### 12.1 주요 명령어

```bash
# Nginx 재시작
sudo systemctl restart nginx

# 애플리케이션 재시작
sudo systemctl restart mindgarden-dev.service

# 로그 확인
sudo journalctl -u mindgarden-dev.service -f

# SSL 인증서 목록
sudo certbot certificates
```

### 12.2 주요 파일 위치

- Nginx 설정: `/etc/nginx/sites-available/core-solution-dev`
- 환경 변수: `/etc/mindgarden/dev.env`
- 애플리케이션: `/opt/mindgarden/mindgarden.jar`
- 서비스 파일: `/etc/systemd/system/mindgarden-dev.service`
- SSL 인증서: `/etc/letsencrypt/live/[도메인]/`


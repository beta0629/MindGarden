# DNS 설정 가이드

**작성일**: 2025-11-18  
**목적**: 신규 도메인 DNS 설정 및 배포 준비

## 1. DNS 설정 필요 도메인

### 1.1 솔루션 도메인 (core-solution.co.kr)

**개발 서버:**
- `dev.core-solution.co.kr` → `114.202.247.246`
- `api.dev.core-solution.co.kr` → `114.202.247.246`
- `www.dev.core-solution.co.kr` → `114.202.247.246` (선택)

**운영 서버:**
- `app.core-solution.co.kr` → `211.37.179.204`
- `core-solution.co.kr` → `211.37.179.204` (선택)
- `api.core-solution.co.kr` → `211.37.179.204`
- `www.core-solution.co.kr` → `211.37.179.204` (선택)

**스테이징 서버:**
- `staging.core-solution.co.kr` → 스테이징 서버 IP (선택)

### 1.2 회사 도메인 (e-trinity.co.kr)

**회사 홈페이지:**
- `e-trinity.co.kr` → 회사 홈페이지 서버 IP (운영)
- `dev.e-trinity.co.kr` → `114.202.247.246` (개발 서버)
- `www.e-trinity.co.kr` → `e-trinity.co.kr` (CNAME 또는 A 레코드)

**온보딩:**
- `apply.e-trinity.co.kr` → 온보딩 서버 IP (운영)
- `apply.dev.e-trinity.co.kr` → `114.202.247.246` (개발 서버)

**운영 포털:**
- `ops.e-trinity.co.kr` → 운영 포털 서버 IP (운영)
- `ops.dev.e-trinity.co.kr` → `114.202.247.246` (개발 서버)

### 1.3 기존 도메인 (m-garden.co.kr) - 유지

**기존 도메인은 현재 설정 유지:**
- `dev.m-garden.co.kr` → 개발 서버 IP (기존 설정 유지)
- `m-garden.co.kr` → 운영 서버 IP (기존 설정 유지)
- `app.m-garden.co.kr` → 운영 서버 IP (기존 설정 유지)

## 2. DNS 레코드 설정 방법

### 2.1 DNS 관리자 접속

도메인 등록 업체(예: 가비아, 후이즈, 카페24 등)의 DNS 관리 페이지에 접속합니다.

### 2.2 A 레코드 설정

**개발 서버 (core-solution.co.kr):**
```
타입: A
호스트: dev
값(IP): 114.202.247.246
TTL: 3600 (또는 기본값)
```

**개발 API 서버 (core-solution.co.kr):**
```
타입: A
호스트: api.dev
값(IP): 114.202.247.246
TTL: 3600 (또는 기본값)
```

**운영 서버 (core-solution.co.kr):**
```
타입: A
호스트: app
값(IP): 211.37.179.204
TTL: 3600 (또는 기본값)
```

**운영 API 서버 (core-solution.co.kr):**
```
타입: A
호스트: api
값(IP): 211.37.179.204
TTL: 3600 (또는 기본값)
```

**회사 홈페이지 - 운영 (e-trinity.co.kr):**
```
타입: A
호스트: @ (또는 공백)
값(IP): [회사 홈페이지 서버 IP 주소]
TTL: 3600 (또는 기본값)
```

**회사 홈페이지 - 개발 (e-trinity.co.kr):**
```
타입: A
호스트: dev
값(IP): 114.202.247.246 (개발 서버 IP)
TTL: 3600 (또는 기본값)
```

**온보딩 - 운영 (e-trinity.co.kr):**
```
타입: A
호스트: apply
값(IP): [온보딩 서버 IP 주소] (또는 회사 홈페이지 서버 IP 주소)
TTL: 3600 (또는 기본값)
```

**온보딩 - 개발 (e-trinity.co.kr):**
```
타입: A
호스트: apply.dev
값(IP): 114.202.247.246 (개발 서버 IP)
TTL: 3600 (또는 기본값)
```

✅ **설정 완료**: `apply.dev` 레코드가 추가되었습니다 (2025-11-18).

**운영 포털 - 운영 (e-trinity.co.kr):**
```
타입: A
호스트: ops
값(IP): [운영 포털 서버 IP 주소]
TTL: 3600 (또는 기본값)
```

**운영 포털 - 개발 (e-trinity.co.kr):**
```
타입: A
호스트: ops.dev
값(IP): 114.202.247.246 (개발 서버 IP)
TTL: 3600 (또는 기본값)
```

### 2.3 CNAME 레코드 설정 (선택)

**www 서브도메인:**
```
타입: CNAME
호스트: www
값: e-trinity.co.kr. (마지막에 점(.) 필수 - FQDN 형식)
TTL: 3600 (또는 기본값)
```

⚠️ **중요**: CNAME 레코드의 값은 FQDN(Fully Qualified Domain Name) 형식이므로 **마지막에 점(.)을 반드시 포함**해야 합니다.
- ✅ 올바른 형식: `e-trinity.co.kr.`
- ❌ 잘못된 형식: `e-trinity.co.kr`

## 3. DNS 전파 확인

### 3.1 DNS 전파 확인 명령어

```bash
# 개발 서버 DNS 확인
nslookup dev.core-solution.co.kr
dig dev.core-solution.co.kr

# 운영 서버 DNS 확인
nslookup app.core-solution.co.kr
dig app.core-solution.co.kr

# 회사 홈페이지 DNS 확인
nslookup e-trinity.co.kr
dig e-trinity.co.kr

# 온보딩 DNS 확인
nslookup apply.e-trinity.co.kr
dig apply.e-trinity.co.kr
```

### 3.2 온라인 DNS 확인 도구

- https://www.whatsmydns.net/
- https://dnschecker.org/
- https://mxtoolbox.com/DNSLookup.aspx

**확인 사항:**
- DNS 전파는 보통 1-24시간 소요
- TTL 값에 따라 전파 시간이 달라짐
- 전 세계 DNS 서버에 전파되었는지 확인

## 4. SSL 인증서 발급 준비

### 4.1 SSL 인증서 발급 전 확인

DNS 설정이 완료되고 전파된 후 SSL 인증서를 발급해야 합니다.

**확인 사항:**
- [ ] DNS 레코드 설정 완료
- [ ] DNS 전파 확인 (nslookup, dig 명령어로 확인)
- [ ] 서버 포트 80, 443 오픈 확인
- [ ] Certbot 설치 확인 (Let's Encrypt 사용 시)

### 4.2 SSL 인증서 발급 명령어

**개발 서버:**
```bash
# Let's Encrypt 인증서 발급
certbot certonly --nginx -d dev.core-solution.co.kr

# 또는 standalone 모드
certbot certonly --standalone -d dev.core-solution.co.kr
```

**운영 서버:**
```bash
# 여러 도메인 포함
certbot certonly --nginx \
  -d app.core-solution.co.kr \
  -d api.core-solution.co.kr \
  -d core-solution.co.kr
```

**회사 홈페이지:**
```bash
certbot certonly --nginx \
  -d e-trinity.co.kr \
  -d www.e-trinity.co.kr \
  -d apply.e-trinity.co.kr
```

### 4.3 SSL 인증서 자동 갱신 설정

```bash
# Certbot 자동 갱신 테스트
certbot renew --dry-run

# systemd 타이머 설정 (이미 설정되어 있을 수 있음)
systemctl status certbot.timer
systemctl enable certbot.timer
```

## 5. 배포 준비 체크리스트

### 5.1 DNS 설정

- [ ] `dev.core-solution.co.kr` DNS A 레코드 설정
- [ ] `app.core-solution.co.kr` DNS A 레코드 설정
- [ ] `api.core-solution.co.kr` DNS A 레코드 설정 (선택)
- [ ] `e-trinity.co.kr` DNS A 레코드 설정
- [ ] `apply.e-trinity.co.kr` DNS A 레코드 설정
- [ ] `ops.e-trinity.co.kr` DNS A 레코드 설정 (선택)
- [ ] DNS 전파 확인 완료

### 5.2 SSL 인증서

- [ ] `dev.core-solution.co.kr` SSL 인증서 발급
- [ ] `app.core-solution.co.kr` SSL 인증서 발급
- [ ] `e-trinity.co.kr` SSL 인증서 발급
- [ ] `apply.e-trinity.co.kr` SSL 인증서 발급
- [ ] SSL 자동 갱신 설정 확인

### 5.3 서버 설정

- [ ] Nginx 설정 파일 생성
- [ ] SSL 인증서 경로 설정
- [ ] 프록시 설정 확인
- [ ] CORS 설정 확인
- [ ] Nginx 설정 테스트 (`nginx -t`)
- [ ] Nginx 재시작

### 5.4 환경 변수 설정

- [ ] 개발 서버 환경 변수 파일 생성
- [ ] 운영 서버 환경 변수 파일 생성
- [ ] OAuth2 클라이언트 ID/Secret 설정
- [ ] 데이터베이스 연결 정보 확인 (기존과 동일)
- [ ] JWT Secret 설정
- [ ] 암호화 키 설정

### 5.5 OAuth2 개발자 센터 설정

- [ ] 카카오 개발자 센터: 콜백 URL 등록
- [ ] 네이버 개발자 센터: 콜백 URL 등록
- [ ] Google Cloud Console: 콜백 URL 등록
- [ ] Apple Developer: 콜백 URL 등록

### 5.6 배포 전 테스트

- [ ] 로컬에서 빌드 성공 확인
- [ ] 통합 테스트 통과 확인
- [ ] 환경 변수 검증
- [ ] 데이터베이스 연결 테스트

## 6. 배포 순서

### 6.1 Phase 1: DNS 설정 (1일)

1. DNS 레코드 설정
2. DNS 전파 대기 (1-24시간)
3. DNS 전파 확인

### 6.2 Phase 2: SSL 인증서 발급 (1일)

1. Certbot 설치 확인
2. SSL 인증서 발급
3. SSL 자동 갱신 설정

### 6.3 Phase 3: 서버 설정 (1일)

1. Nginx 설정 파일 생성
2. SSL 인증서 경로 설정
3. 프록시 설정
4. Nginx 재시작

### 6.4 Phase 4: 환경 변수 설정 (1일)

1. 환경 변수 파일 생성
2. OAuth2 설정
3. 데이터베이스 연결 확인 (기존과 동일)

### 6.5 Phase 5: 배포 및 테스트 (1일)

1. 애플리케이션 배포
2. 기능 테스트
3. OAuth2 로그인 테스트
4. Passkey 인증 테스트

## 7. 기존 데이터베이스 접근

**기존 데이터베이스 접근은 동일하게 유지합니다.**

```yaml
# application-dev.yml
spring:
  datasource:
    url: jdbc:mysql://${DB_HOST}:${DB_PORT:3306}/${DB_NAME:core_solution}?...
    username: ${DB_USERNAME}
    password: ${DB_PASSWORD}
```

**환경 변수:**
```bash
# 기존과 동일한 DB 접근 정보 사용
DB_HOST=[기존 DB 호스트]
DB_PORT=3306
DB_NAME=core_solution
DB_USERNAME=[기존 DB 사용자명]
DB_PASSWORD=[기존 DB 비밀번호]
```

## 8. 문제 해결

### 8.1 DNS 전파 지연

**증상**: DNS 조회 시 이전 IP 주소 반환

**해결 방법:**
- DNS TTL 값 확인 (너무 크면 줄이기)
- 로컬 DNS 캐시 클리어: `sudo systemd-resolve --flush-caches` (Linux)
- 여러 DNS 서버에서 확인

### 8.2 SSL 인증서 발급 실패

**증상**: Certbot 인증서 발급 실패

**해결 방법:**
- DNS 전파 완료 확인
- 포트 80, 443 오픈 확인
- 방화벽 설정 확인
- 이전 인증서 삭제 후 재시도

### 8.3 Nginx 설정 오류

**증상**: `nginx -t` 실패

**해결 방법:**
- 설정 파일 문법 확인
- SSL 인증서 경로 확인
- 로그 파일 확인: `/var/log/nginx/error.log`

## 9. 다음 단계

DNS 설정 완료 후:
1. SSL 인증서 발급
2. Nginx 설정
3. 환경 변수 설정
4. 애플리케이션 배포
5. 기능 테스트


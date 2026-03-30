# 개발 서버 배포 체크리스트

**작성일**: 2025-11-18  
**목적**: 개발 서버 배포 전 필수 확인 사항

## 서버 IP 주소

- **개발 서버**: `114.202.247.246`
- **운영 서버**: `211.37.179.204`

## 1. DNS 설정 확인

### 1.1 솔루션 도메인 (core-solution.co.kr)

**개발 서버:**
- [ ] `dev.core-solution.co.kr` DNS A 레코드 설정 완료
- [ ] `api.dev.core-solution.co.kr` DNS A 레코드 설정 완료
- [ ] DNS 전파 확인 (nslookup, dig 명령어)
- [ ] 전 세계 DNS 서버 전파 확인 (whatsmydns.net)

**운영 서버:**
- [ ] `app.core-solution.co.kr` DNS A 레코드 설정 완료
- [ ] `api.core-solution.co.kr` DNS A 레코드 설정 완료

### 1.2 회사 도메인 (e-trinity.co.kr)

**개발 서버:**
- [ ] `dev.e-trinity.co.kr` DNS A 레코드 설정 완료 (개발 회사 홈페이지)
- [ ] `apply.dev.e-trinity.co.kr` DNS A 레코드 설정 완료 (개발 온보딩)
- [ ] `ops.dev.e-trinity.co.kr` DNS A 레코드 설정 완료 (개발 운영 포털)

**운영 서버:**
- [ ] `e-trinity.co.kr` DNS A 레코드 설정 완료
- [ ] `apply.e-trinity.co.kr` DNS A 레코드 설정 완료
- [ ] `ops.e-trinity.co.kr` DNS A 레코드 설정 완료

- [ ] DNS 전파 확인

### 1.3 기존 도메인 (m-garden.co.kr)

- [ ] 기존 DNS 설정 유지 확인
- [ ] `dev.m-garden.co.kr` 접근 정상 확인

## 2. SSL 인증서 발급

### 2.1 개발 서버 SSL

- [ ] `dev.core-solution.co.kr` SSL 인증서 발급 완료
- [ ] `api.dev.core-solution.co.kr` SSL 인증서 발급 완료
- [ ] SSL 인증서 경로 확인
- [ ] SSL 자동 갱신 설정 확인

### 2.2 운영 서버 SSL

- [ ] `app.core-solution.co.kr` SSL 인증서 발급 완료
- [ ] `api.core-solution.co.kr` SSL 인증서 발급 완료

### 2.2 회사 홈페이지 SSL

**개발 서버:**
- [ ] `dev.e-trinity.co.kr` SSL 인증서 발급 완료 (개발 회사 홈페이지)
- [ ] `apply.dev.e-trinity.co.kr` SSL 인증서 발급 완료 (개발 온보딩)
- [ ] `ops.dev.e-trinity.co.kr` SSL 인증서 발급 완료 (개발 운영 포털)

**운영 서버:**
- [ ] `e-trinity.co.kr` SSL 인증서 발급 완료
- [ ] `apply.e-trinity.co.kr` SSL 인증서 발급 완료
- [ ] `ops.e-trinity.co.kr` SSL 인증서 발급 완료

## 3. Nginx 설정

### 3.1 개발 서버 Nginx

- [ ] `/etc/nginx/sites-available/core-solution-dev` 설정 파일 생성
- [ ] `dev.core-solution.co.kr` server 블록 설정
- [ ] `api.dev.core-solution.co.kr` server 블록 설정
- [ ] `dev.e-trinity.co.kr` server 블록 설정 (개발 회사 홈페이지)
- [ ] `apply.dev.e-trinity.co.kr` server 블록 설정 (개발 온보딩)
- [ ] `ops.dev.e-trinity.co.kr` server 블록 설정 (개발 운영 포털)
- [ ] SSL 인증서 경로 설정
- [ ] 프록시 설정 (백엔드: localhost:8080)
- [ ] CORS 헤더 설정 확인 (API 서버)
- [ ] 보안 헤더 설정 확인 (운영 포털)
- [ ] Nginx 설정 테스트: `nginx -t`
- [ ] Nginx 재시작: `sudo systemctl restart nginx`

### 3.2 운영 서버 Nginx

- [ ] `/etc/nginx/sites-available/core-solution` 설정 파일 생성
- [ ] `app.core-solution.co.kr` server 블록 설정
- [ ] `api.core-solution.co.kr` server 블록 설정
- [ ] SSL 인증서 경로 설정
- [ ] 프록시 설정 (백엔드: localhost:8080)
- [ ] CORS 헤더 설정 확인 (API 서버)
- [ ] Nginx 설정 테스트: `nginx -t`
- [ ] Nginx 재시작: `sudo systemctl restart nginx`

### 3.2 기존 도메인 Nginx (유지)

- [ ] 기존 `dev.m-garden.co.kr` Nginx 설정 유지 확인

## 4. 환경 변수 설정

### 4.1 필수 환경 변수

- [ ] `SERVER_BASE_URL` 설정 (신규 도메인 또는 기존 도메인)
- [ ] `WEBAUTHN_RP_ID` 설정 (서버 도메인과 일치)
- [ ] `FRONTEND_BASE_URL` 설정
- [ ] `COMPANY_URL` 설정: `https://e-trinity.co.kr`
- [ ] `ONBOARDING_URL` 설정: `https://apply.e-trinity.co.kr`

### 4.2 데이터베이스 설정 (기존과 동일)

- [ ] `DB_HOST` 설정 (기존과 동일)
- [ ] `DB_PORT` 설정: `3306`
- [ ] `DB_NAME` 설정: `core_solution`
- [ ] `DB_USERNAME` 설정 (기존과 동일)
- [ ] `DB_PASSWORD` 설정 (기존과 동일)

### 4.3 보안 설정

- [ ] `JWT_SECRET` 설정
- [ ] `PERSONAL_DATA_ENCRYPTION_KEY` 설정
- [ ] `PERSONAL_DATA_ENCRYPTION_IV` 설정

### 4.4 OAuth2 설정

- [ ] `KAKAO_CLIENT_ID` 설정
- [ ] `KAKAO_CLIENT_SECRET` 설정
- [ ] `KAKAO_REDIRECT_URI` 설정 (서버 도메인 기반)
- [ ] `NAVER_CLIENT_ID` 설정
- [ ] `NAVER_CLIENT_SECRET` 설정
- [ ] `NAVER_REDIRECT_URI` 설정
- [ ] `GOOGLE_CLIENT_ID` 설정 (선택)
- [ ] `GOOGLE_CLIENT_SECRET` 설정 (선택)
- [ ] `APPLE_CLIENT_ID` 설정 (선택)
- [ ] `APPLE_CLIENT_SECRET` 설정 (선택)

### 4.5 CORS 설정

- [ ] `CORS_ALLOWED_ORIGINS` 설정
  - 신규 도메인: `https://dev.core-solution.co.kr`
  - 기존 도메인: `https://dev.m-garden.co.kr`
  - 회사 도메인: `https://e-trinity.co.kr`, `https://apply.e-trinity.co.kr`

## 5. OAuth2 개발자 센터 설정

### 5.1 카카오 개발자 센터

- [ ] 콜백 URL 등록:
  - `https://dev.core-solution.co.kr/api/auth/kakao/callback` (신규 도메인)
  - `https://dev.m-garden.co.kr/api/auth/kakao/callback` (기존 도메인, 유지)

### 5.2 네이버 개발자 센터

- [ ] 콜백 URL 등록:
  - `https://dev.core-solution.co.kr/api/auth/naver/callback` (신규 도메인)
  - `https://dev.m-garden.co.kr/api/auth/naver/callback` (기존 도메인, 유지)

### 5.3 Google Cloud Console

- [ ] 콜백 URL 등록:
  - `https://dev.core-solution.co.kr/api/auth/google/callback` (신규 도메인)
  - `https://dev.m-garden.co.kr/api/auth/google/callback` (기존 도메인, 유지)

### 5.4 Apple Developer

- [ ] 콜백 URL 등록:
  - `https://dev.core-solution.co.kr/api/auth/apple/callback` (신규 도메인)
  - `https://dev.m-garden.co.kr/api/auth/apple/callback` (기존 도메인, 유지)

## 6. 애플리케이션 배포

### 6.1 빌드

- [ ] 로컬에서 빌드 성공 확인: `mvn clean package -DskipTests`
- [ ] JAR 파일 생성 확인: `target/mindgarden-*.jar`

### 6.2 배포

- [ ] JAR 파일 서버 업로드
- [ ] systemd 서비스 파일 확인/생성
- [ ] 환경 변수 파일 설정 (`/etc/mindgarden/dev.env`)
- [ ] 서비스 시작: `sudo systemctl start mindgarden-dev.service`
- [ ] 서비스 상태 확인: `sudo systemctl status mindgarden-dev.service`

### 6.3 로그 확인

- [ ] 애플리케이션 로그 확인: `tail -f /var/log/mindgarden/dev.log`
- [ ] Nginx 로그 확인: `tail -f /var/log/nginx/access.log`
- [ ] 에러 로그 확인: `tail -f /var/log/nginx/error.log`

## 7. 기능 테스트

### 7.1 기본 접근 테스트

- [ ] `https://dev.core-solution.co.kr` 접근 정상
- [ ] `https://dev.m-garden.co.kr` 접근 정상 (기존 도메인)
- [ ] `https://e-trinity.co.kr` 접근 정상 (회사 홈페이지)
- [ ] HTTPS 리디렉션 정상 동작

### 7.2 API 테스트

- [ ] `https://dev.core-solution.co.kr/api/health` 응답 정상
- [ ] `https://dev.m-garden.co.kr/api/health` 응답 정상 (기존 도메인)
- [ ] CORS 정상 동작 (모든 도메인에서 API 호출)

### 7.3 인증 테스트

- [ ] 카카오 로그인 정상 동작
- [ ] 네이버 로그인 정상 동작
- [ ] Google 로그인 정상 동작 (설정된 경우)
- [ ] Apple 로그인 정상 동작 (설정된 경우)
- [ ] Passkey 등록/인증 정상 동작

### 7.4 데이터베이스 연결 테스트

- [ ] 데이터베이스 연결 정상 (기존과 동일)
- [ ] Flyway 마이그레이션 정상
- [ ] 테넌트 데이터 조회 정상

## 8. 롤백 계획

### 8.1 배포 실패 시

1. 서비스 중지: `sudo systemctl stop mindgarden-dev.service`
2. 이전 버전 JAR 파일로 복원
3. 환경 변수 파일 확인
4. 서비스 재시작
5. 로그 확인

### 8.2 DNS 문제 시

1. 기존 도메인(`dev.m-garden.co.kr`)으로 전환
2. 환경 변수 `SERVER_BASE_URL` 변경
3. 서비스 재시작

## 9. 배포 후 모니터링

### 9.1 서비스 모니터링

- [ ] 서비스 상태 모니터링: `systemctl status mindgarden-dev.service`
- [ ] 메모리 사용량 확인
- [ ] CPU 사용량 확인
- [ ] 디스크 사용량 확인

### 9.2 로그 모니터링

- [ ] 애플리케이션 로그 모니터링
- [ ] 에러 로그 확인
- [ ] 성능 로그 확인

### 9.3 사용자 피드백

- [ ] 사용자 접근 테스트
- [ ] 기능 동작 확인
- [ ] 에러 리포트 수집

## 10. 체크리스트 요약

### 필수 항목 (배포 전 완료)

1. ✅ DNS 설정 완료
2. ✅ SSL 인증서 발급 완료
3. ✅ Nginx 설정 완료
4. ✅ 환경 변수 설정 완료
5. ✅ OAuth2 콜백 URL 등록 완료
6. ✅ 데이터베이스 연결 확인 완료
7. ✅ 빌드 성공 확인 완료

### 배포 후 확인

1. ✅ 서비스 정상 동작 확인
2. ✅ 기능 테스트 통과
3. ✅ 로그 확인 (에러 없음)
4. ✅ 모니터링 설정 완료

---

**다음 단계**: DNS 설정 완료 후 SSL 인증서 발급 및 배포 진행


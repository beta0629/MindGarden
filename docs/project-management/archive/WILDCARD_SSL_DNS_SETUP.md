# 와일드카드 SSL 인증서 DNS 설정 가이드

## 운영 서버 와일드카드 도메인 등록

### 대상 도메인
1. `*.core-solution.co.kr` - CoreSolution 서비스용
2. `*.e-trinity.co.kr` - Trinity 회사 홈페이지 및 온보딩용

---

## 1. 운영 서버: *.core-solution.co.kr

### DNS TXT 레코드 설정

**도메인:** `core-solution.co.kr`

**DNS 레코드 정보:**
- **레코드 타입:** TXT
- **호스트/이름:** `_acme-challenge.core-solution.co.kr`
- **값:** (Certbot 실행 시 제공되는 값)

### 설정 방법

1. DNS 관리 페이지에 접속
2. `core-solution.co.kr` 도메인 선택
3. TXT 레코드 추가:
   - 이름: `_acme-challenge.core-solution.co.kr` (또는 `_acme-challenge`)
   - 값: Certbot에서 제공하는 TXT 값
   - TTL: 기본값 또는 300

### 인증서 발급 명령

DNS TXT 레코드 설정 후 다음 명령 실행:

```bash
ssh root@beta74.cafe24.com
sudo certbot certonly --manual --preferred-challenges dns \
  -d "*.core-solution.co.kr" \
  -d "core-solution.co.kr" \
  --email admin@e-trinity.co.kr \
  --agree-tos \
  --manual-public-ip-logging-ok
```

### 주의사항

- DNS TXT 레코드가 전파되는데 시간이 걸릴 수 있습니다 (보통 5-10분)
- DNS 전파 확인: `dig TXT _acme-challenge.core-solution.co.kr`
- TXT 레코드 설정 후 Certbot 명령 실행 시 Enter를 눌러 진행

### 인증서 발급 후 Nginx 설정

인증서 발급 완료 후:
1. `/etc/nginx/sites-available/core-solution` 파일에서 Wildcard 서버 블록 주석 해제
2. SSL 인증서 경로 확인
3. `sudo nginx -t` 로 설정 테스트
4. `sudo systemctl reload nginx` 로 Nginx 재시작

---

## 2. 운영 서버: *.e-trinity.co.kr

### DNS TXT 레코드 설정

**도메인:** `e-trinity.co.kr`

**DNS 레코드 정보:**
- **레코드 타입:** TXT
- **호스트/이름:** `_acme-challenge.e-trinity.co.kr`
- **값:** (Certbot 실행 시 제공되는 값)

### 설정 방법

1. DNS 관리 페이지에 접속 (Gabia 등)
2. `e-trinity.co.kr` 도메인 선택
3. TXT 레코드 추가:
   - 이름: `_acme-challenge.e-trinity.co.kr` (또는 `_acme-challenge`)
   - 값: Certbot에서 제공하는 TXT 값
   - TTL: 기본값 또는 300

### 인증서 발급 명령

DNS TXT 레코드 설정 후 다음 명령 실행:

```bash
# 운영 서버 접속
ssh root@beta74.cafe24.com

# 와일드카드 인증서 발급 (DNS-01 인증 방식)
sudo certbot certonly --manual --preferred-challenges dns \
  -d "*.e-trinity.co.kr" \
  -d "e-trinity.co.kr" \
  --email admin@e-trinity.co.kr \
  --agree-tos \
  --manual-public-ip-logging-ok
```

### 주의사항

- DNS TXT 레코드가 전파되는데 시간이 걸릴 수 있습니다 (보통 5-10분)
- DNS 전파 확인: `dig TXT _acme-challenge.e-trinity.co.kr`
- TXT 레코드 설정 후 Certbot 명령 실행 시 Enter를 눌러 진행
- Certbot이 TXT 레코드 값을 제공하면, DNS에 설정 후 다시 Enter를 눌러야 합니다

### 인증서 발급 후 Nginx 설정

인증서 발급 완료 후:
1. `/etc/nginx/sites-available/e-trinity` 파일에서 Wildcard 서버 블록 주석 해제
2. SSL 인증서 경로 확인:
   - 인증서: `/etc/letsencrypt/live/e-trinity.co.kr/fullchain.pem`
   - 개인키: `/etc/letsencrypt/live/e-trinity.co.kr/privkey.pem`
3. `sudo nginx -t` 로 설정 테스트
4. `sudo systemctl reload nginx` 로 Nginx 재시작

### 적용 가능한 서브도메인

와일드카드 인증서로 다음 서브도메인 모두 사용 가능:
- `e-trinity.co.kr` (루트 도메인)
- `www.e-trinity.co.kr`
- `dev.e-trinity.co.kr`
- `apply.e-trinity.co.kr`
- `ops.e-trinity.co.kr`
- `apply.dev.e-trinity.co.kr`
- `ops.dev.e-trinity.co.kr`
- 기타 모든 `*.e-trinity.co.kr` 서브도메인

---

## 3. 작업 체크리스트

### *.core-solution.co.kr
- [ ] DNS TXT 레코드 설정 (`_acme-challenge.core-solution.co.kr`)
- [ ] Certbot으로 와일드카드 인증서 발급
- [ ] DNS 전파 확인 (`dig TXT _acme-challenge.core-solution.co.kr`)
- [ ] Nginx 설정 업데이트
- [ ] SSL 인증서 경로 확인
- [ ] Nginx 설정 테스트 (`nginx -t`)
- [ ] Nginx 재시작 및 확인

### *.e-trinity.co.kr
- [ ] DNS TXT 레코드 설정 (`_acme-challenge.e-trinity.co.kr`)
- [ ] Certbot으로 와일드카드 인증서 발급
- [ ] DNS 전파 확인 (`dig TXT _acme-challenge.e-trinity.co.kr`)
- [ ] Nginx 설정 업데이트
- [ ] SSL 인증서 경로 확인
- [ ] Nginx 설정 테스트 (`nginx -t`)
- [ ] Nginx 재시작 및 확인

### 자동 갱신 설정
- [ ] Certbot 자동 갱신 설정 확인 (`certbot renew --dry-run`)
- [ ] Cron 작업 설정 (월 1회 자동 갱신)


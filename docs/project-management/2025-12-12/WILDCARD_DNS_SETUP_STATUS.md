# 와일드카드 DNS 설정 상태 및 테스트 결과

**작성일**: 2025-12-12  
**테스트 일시**: 2025-12-12  
**상태**: ⚠️ **DNS 레코드 설정 필요**

---

## 테스트 결과 요약

### ✅ 서버 설정 상태

| 항목 | 상태 | 상세 |
|------|------|------|
| Nginx 설정 | ✅ 정상 | 설정 파일 문법 검증 통과 |
| Nginx 서비스 | ✅ 실행 중 | Active (running) |
| SSL 인증서 | ✅ 정상 | 만료일: 2026-02-16 (62일 남음) |
| 와일드카드 인증서 | ✅ 정상 | `*.dev.core-solution.co.kr` |

### ❌ DNS 레코드 상태

| 도메인 | DNS 해석 결과 | 상태 |
|--------|--------------|------|
| `dev.core-solution.co.kr` | `114.202.247.246` | ✅ 정상 |
| `mindgarden.dev.core-solution.co.kr` | `NXDOMAIN` | ❌ 해석 불가 |
| `test1.dev.core-solution.co.kr` | `NXDOMAIN` | ❌ 해석 불가 |
| `test123.dev.core-solution.co.kr` | `NXDOMAIN` | ❌ 해석 불가 |

**DNS 서버별 확인 결과**:
- 기본 DNS: 해석 불가
- Google DNS (8.8.8.8): 해석 불가
- Gabia 네임서버 (ns.gabia.co.kr): 해석 불가

**결론**: 와일드카드 DNS 레코드(`*.dev.core-solution.co.kr`)가 DNS 제공자(Gabia)에 설정되지 않았습니다.

---

## 서버 내부 테스트 결과

### 서버 내부 접근 테스트

**서버 내부에서의 접근** (임시 `/etc/hosts` 설정 사용):

```bash
# mindgarden.dev.core-solution.co.kr
HTTP/2 200
server: nginx/1.18.0 (Ubuntu)
content-type: text/html
content-length: 6131

# test123.dev.core-solution.co.kr
HTTP/2 200
server: nginx/1.18.0 (Ubuntu)
```

**결론**: 서버 내부에서는 정상적으로 접근 가능합니다. Nginx 설정과 SSL 인증서가 올바르게 구성되어 있습니다.

---

## 외부 접근 테스트 결과

### 클라이언트 측 접근 테스트

**로컬 curl 테스트**:
```bash
curl -I -k https://mindgarden.dev.core-solution.co.kr/
# 결과: curl: (6) Could not resolve host
```

**브라우저 도구 테스트**:
- DNS 해석 실패로 접근 불가
- `chrome-error://chromewebdata/` 오류

**결론**: 외부 클라이언트는 DNS 해석 실패로 접근할 수 없습니다.

---

## 현재 구성 상태

### Nginx 설정

**와일드카드 서버 블록**: ✅ 정상
- 서버 블록: `server_name ~^[^.]+\.dev\.core-solution\.co\.kr$;`
- SSL 인증서 경로: `/etc/letsencrypt/live/dev.core-solution.co.kr-0001/`
- 프론트엔드 파일 서빙: `/var/www/html-dev`
- API 프록시: `http://127.0.0.1:8080`

**설정 파일**: `/etc/nginx/sites-enabled/core-solution-dev`

### SSL 인증서

**와일드카드 인증서**: ✅ 정상
```
Certificate Name: dev.core-solution.co.kr-0001
Domains: *.dev.core-solution.co.kr
Expiry Date: 2026-02-16 03:10:50+00:00 (VALID: 62 days)
Certificate Path: /etc/letsencrypt/live/dev.core-solution.co.kr-0001/fullchain.pem
```

**자동 갱신 설정**: ✅ 정상
- Certbot 타이머: 활성화됨
- 다음 실행 예정: 매일 2회 (오전/오후)

---

## 필요한 작업

### 1. DNS 레코드 설정 (필수)

**Gabia DNS 관리 페이지에서 설정**:

1. Gabia 홈페이지 접속: https://www.gabia.com
2. 로그인 후 "도메인 관리" 메뉴 선택
3. `core-solution.co.kr` 도메인 선택
4. "DNS 관리" 또는 "네임서버 관리" 메뉴 선택
5. "A 레코드 추가" 클릭

**DNS 레코드 정보**:
```
타입: A
호스트: *.dev (또는 * - Gabia 인터페이스에 따라 다름)
값/IP: 114.202.247.246
TTL: 3600 (또는 기본값)
```

### 2. DNS 전파 확인

DNS 레코드 설정 후 전파를 확인:

```bash
# 테스트 스크립트 실행
./scripts/server-management/dns/test-wildcard-dns.sh mindgarden

# 또는 수동 확인
dig mindgarden.dev.core-solution.co.kr
nslookup mindgarden.dev.core-solution.co.kr
dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr
```

**예상 결과**:
```
mindgarden.dev.core-solution.co.kr → 114.202.247.246
```

**전파 시간**: 보통 5분 ~ 1시간 (TTL 값에 따라 다름)

### 3. 브라우저 접근 테스트

DNS 전파 확인 후:

```bash
# HTTPS 접근 테스트
curl -I https://mindgarden.dev.core-solution.co.kr/

# 브라우저에서 접근
# https://mindgarden.dev.core-solution.co.kr/
```

---

## 테스트 스크립트

### 1. DNS 설정 가이드 스크립트

```bash
./scripts/server-management/dns/setup-wildcard-dns-guide.sh
```

**기능**:
- 현재 DNS 상태 확인
- Gabia DNS 설정 방법 안내
- 서버 설정 상태 확인

### 2. DNS 테스트 스크립트

```bash
./scripts/server-management/dns/test-wildcard-dns.sh [서브도메인]
# 예: ./scripts/server-management/dns/test-wildcard-dns.sh mindgarden
```

**기능**:
- DNS 해석 확인 (여러 DNS 서버)
- HTTPS 접근 테스트
- SSL 인증서 확인
- 최종 결과 보고

---

## 문제 해결

### DNS 전파가 안 되는 경우

1. **TTL 값 확인**: TTL이 너무 크면 전파가 느릴 수 있습니다.
2. **DNS 캐시 클리어**: 로컬 DNS 캐시를 클리어합니다.
   ```bash
   # macOS
   sudo dscacheutil -flushcache
   sudo killall -HUP mDNSResponder
   
   # Linux
   sudo systemd-resolve --flush-caches
   ```
3. **다른 DNS 서버로 확인**: Google DNS (8.8.8.8) 또는 Cloudflare DNS (1.1.1.1)로 확인합니다.

### 여전히 접근이 안 되는 경우

1. **Nginx 설정 확인**: `ssh root@beta0629.cafe24.com "nginx -t"`
2. **Nginx 재시작**: `ssh root@beta0629.cafe24.com "systemctl reload nginx"`
3. **방화벽 확인**: 포트 80, 443이 열려있는지 확인
4. **SSL 인증서 확인**: `ssh root@beta0629.cafe24.com "certbot certificates"`

---

## 완료 체크리스트

- [x] Nginx 설정 완료
- [x] SSL 인증서 발급 완료
- [x] 자동 갱신 설정 완료
- [x] 서버 내부 테스트 완료
- [ ] **DNS 레코드 설정** (Gabia DNS 관리 페이지)
- [ ] DNS 전파 확인
- [ ] 브라우저 접근 테스트
- [ ] 서버 `/etc/hosts` 임시 설정 제거 (선택사항)

---

## 결론

**서버 설정은 완료되었습니다**. Nginx, SSL 인증서, 자동 갱신 모두 정상입니다.

**DNS 레코드만 설정하면 됩니다**. Gabia DNS 관리 페이지에서 와일드카드 A 레코드(`*.dev` → `114.202.247.246`)를 추가하면 모든 서브도메인이 정상적으로 작동합니다.

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-12


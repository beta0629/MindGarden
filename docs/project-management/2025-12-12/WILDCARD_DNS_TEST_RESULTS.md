# 와일드카드 DNS 테스트 결과

**테스트 일시**: 2025-12-12  
**테스트 목적**: 와일드카드 도메인 설정 및 SSL 인증서 만료 확인

---

## 테스트 결과 요약

### ✅ SSL 인증서 상태

**와일드카드 SSL 인증서**: 정상 (만료되지 않음)

```
Certificate Name: dev.core-solution.co.kr-0001
Domains: *.dev.core-solution.co.kr
Expiry Date: 2026-02-16 03:10:50+00:00 (VALID: 62 days)
Certificate Path: /etc/letsencrypt/live/dev.core-solution.co.kr-0001/fullchain.pem
```

**상세 정보**:
- **발급일**: 2025-11-18
- **만료일**: 2026-02-16
- **남은 기간**: 62일
- **상태**: ✅ 유효함

**Subject Alternative Name**:
- `DNS:*.dev.core-solution.co.kr`

---

### ❌ DNS 레코드 상태

**와일드카드 DNS 레코드**: 설정되지 않음

**테스트 결과**:

| 도메인 | DNS 해석 결과 | 상태 |
|--------|--------------|------|
| `dev.core-solution.co.kr` | `114.202.247.246` | ✅ 정상 |
| `mindgarden.dev.core-solution.co.kr` | `NXDOMAIN` | ❌ 해석 불가 |
| `test1.dev.core-solution.co.kr` | `NXDOMAIN` | ❌ 해석 불가 |
| `test2.dev.core-solution.co.kr` | `NXDOMAIN` | ❌ 해석 불가 |

**DNS 서버 확인**:
- Gabia 네임서버 (`ns.gabia.co.kr`)에서도 해석 불가
- Google DNS (8.8.8.8)에서도 해석 불가

**결론**: 와일드카드 DNS 레코드(`*.dev.core-solution.co.kr`)가 DNS 제공자(Gabia)에 설정되지 않았습니다.

---

### ✅ 서버 내부 테스트

**서버 내부 접근**: 정상 (임시 `/etc/hosts` 설정 사용)

```bash
# 서버 내부에서 테스트
ssh root@beta0629.cafe24.com "curl -I -k https://mindgarden.dev.core-solution.co.kr/"
```

**결과**:
```
HTTP/2 200
server: nginx/1.18.0 (Ubuntu)
content-type: text/html
```

**참고**: 서버의 `/etc/hosts`에 임시로 `mindgarden.dev.core-solution.co.kr`가 설정되어 있어서 서버 내부에서는 접근 가능합니다. 하지만 외부 클라이언트는 DNS를 통해 해석해야 하므로 접근할 수 없습니다.

---

### ✅ Nginx 설정

**와일드카드 서버 블록**: 정상

- ✅ 와일드카드 서버 블록 구성 완료
- ✅ SSL 인증서 경로 설정 완료
- ✅ 프론트엔드 파일 서빙 설정 완료
- ✅ API 프록시 설정 완료

**설정 파일**: `/etc/nginx/sites-enabled/core-solution-dev`

---

## 문제점 및 해결 방법

### 문제점

1. **와일드카드 DNS 레코드 미설정**
   - `*.dev.core-solution.co.kr` → `114.202.247.246` 레코드가 DNS 제공자에 설정되지 않음
   - 외부 클라이언트가 서브도메인을 해석할 수 없음

2. **임시 해결책 사용 중**
   - 서버의 `/etc/hosts`에 임시 설정이 있음
   - 서버 내부에서만 접근 가능

### 해결 방법

**Gabia DNS 관리 페이지에서 와일드카드 A 레코드 추가 필요**:

```
타입: A
호스트: *.dev (또는 * - Gabia 인터페이스에 따라 다름)
값/IP: 114.202.247.246
TTL: 3600
```

**상세 가이드**: `docs/project-management/2025-12-12/WILDCARD_DNS_SETUP_REQUIRED.md`

---

## 테스트 명령어

### DNS 해석 확인

```bash
# 일반 DNS 서버로 확인
nslookup mindgarden.dev.core-solution.co.kr
dig mindgarden.dev.core-solution.co.kr

# Gabia 네임서버로 직접 확인
dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr

# Google DNS로 확인
nslookup mindgarden.dev.core-solution.co.kr 8.8.8.8
```

### SSL 인증서 확인

```bash
# 인증서 목록 확인
ssh root@beta0629.cafe24.com "certbot certificates"

# 인증서 만료일 확인
ssh root@beta0629.cafe24.com "openssl x509 -in /etc/letsencrypt/live/dev.core-solution.co.kr-0001/fullchain.pem -noout -dates"

# 인증서 상세 정보 확인
ssh root@beta0629.cafe24.com "openssl x509 -in /etc/letsencrypt/live/dev.core-solution.co.kr-0001/fullchain.pem -noout -text | grep -A 5 'Subject Alternative Name'"
```

### 서버 내부 접근 테스트

```bash
# 서버 내부에서 curl 테스트
ssh root@beta0629.cafe24.com "curl -I -k https://mindgarden.dev.core-solution.co.kr/"

# 다른 서브도메인 테스트
ssh root@beta0629.cafe24.com "curl -I -k https://test123.dev.core-solution.co.kr/"
```

---

## 결론

1. ✅ **SSL 인증서**: 정상, 만료되지 않음 (62일 남음)
2. ❌ **DNS 레코드**: 와일드카드 레코드 미설정
3. ✅ **서버 설정**: 정상 (Nginx, SSL 인증서 경로 등)
4. ⚠️ **외부 접근**: DNS 레코드 설정 전까지 불가능

**다음 단계**: Gabia DNS 관리 페이지에서 와일드카드 A 레코드(`*.dev` → `114.202.247.246`)를 추가해야 합니다.

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-12


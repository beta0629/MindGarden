# 와일드카드 DNS 레코드 설정 필요

**작성일**: 2025-12-12  
**목적**: `*.dev.core-solution.co.kr` 와일드카드 DNS 레코드 설정  
**상태**: ⚠️ **필수 설정 필요**

---

## 문제 상황

현재 `mindgarden.dev.core-solution.co.kr` 및 기타 서브도메인에 접근할 수 없습니다.

**원인**: 와일드카드 DNS 레코드(`*.dev.core-solution.co.kr`)가 DNS 제공자(Gabia)에 설정되지 않았습니다.

**현재 상태**:
- ✅ Nginx 설정 완료 (와일드카드 서버 블록 구성)
- ✅ SSL 인증서 발급 완료 (`/etc/letsencrypt/live/dev.core-solution.co.kr-0001/`)
- ✅ 서버 `/etc/hosts` 임시 설정 완료 (서버 내부 테스트용)
- ❌ **DNS 레코드 미설정** (클라이언트 접근 불가)

---

## DNS 레코드 설정 방법

### 1. Gabia DNS 관리 페이지 접속

1. Gabia 홈페이지 (https://www.gabia.com) 접속
2. 로그인 후 "도메인 관리" 메뉴 선택
3. `core-solution.co.kr` 도메인 선택
4. "DNS 관리" 또는 "네임서버 관리" 메뉴 선택

### 2. 와일드카드 A 레코드 추가

**DNS 레코드 정보**:
- **레코드 타입**: A
- **호스트/이름**: `*.dev` (또는 `*` - Gabia 인터페이스에 따라 다를 수 있음)
- **값/IP**: `114.202.247.246`
- **TTL**: `3600` (또는 기본값)

**참고**: 
- Gabia DNS 관리 인터페이스에 따라 와일드카드 레코드 입력 방식이 다를 수 있습니다.
- `*.dev` 또는 `*` 또는 `*.dev.core-solution.co.kr` 형식으로 입력해야 할 수 있습니다.
- Gabia 고객센터에 문의하여 정확한 입력 방식을 확인하세요.

### 3. DNS 전파 확인

DNS 레코드 설정 후 전파를 확인합니다:

```bash
# DNS 전파 확인 (일반 DNS 서버)
nslookup mindgarden.dev.core-solution.co.kr
dig mindgarden.dev.core-solution.co.kr

# 특정 DNS 서버로 확인 (Gabia 네임서버)
dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr
```

**예상 결과**:
```
mindgarden.dev.core-solution.co.kr → 114.202.247.246
```

**전파 시간**: 보통 5분 ~ 1시간 (TTL 값에 따라 다름)

---

## 설정 후 확인 사항

### 1. DNS 해석 확인

```bash
# 로컬에서 확인
nslookup mindgarden.dev.core-solution.co.kr
dig mindgarden.dev.core-solution.co.kr

# 서버에서 확인
ssh root@beta0629.cafe24.com "nslookup mindgarden.dev.core-solution.co.kr"
```

### 2. HTTPS 접근 확인

```bash
# curl로 확인
curl -I https://mindgarden.dev.core-solution.co.kr/

# 브라우저에서 확인
# https://mindgarden.dev.core-solution.co.kr/
```

### 3. Nginx 로그 확인

```bash
ssh root@beta0629.cafe24.com "tail -f /var/log/nginx/tenant.dev.core-solution.co.kr.access.log"
```

---

## 현재 서버 설정 상태

### Nginx 설정
- ✅ 와일드카드 서버 블록 구성 완료
- ✅ 프론트엔드 파일 서빙 설정 완료
- ✅ API 프록시 설정 완료
- ✅ SSL 인증서 경로 설정 완료

**설정 파일**: `/etc/nginx/sites-enabled/core-solution-dev`

### SSL 인증서
- ✅ 와일드카드 SSL 인증서 발급 완료
- **경로**: `/etc/letsencrypt/live/dev.core-solution.co.kr-0001/`
- **도메인**: `*.dev.core-solution.co.kr`

### 서버 내부 테스트
- ✅ `/etc/hosts` 임시 설정 완료 (서버 내부에서만 동작)
- ✅ `curl` 테스트 성공 (HTTP/2 200)

---

## 참고 사항

### 와일드카드 DNS 레코드의 필요성

와일드카드 DNS 레코드(`*.dev.core-solution.co.kr`)를 설정하면:
- 모든 서브도메인 (`mindgarden`, `tenant1`, `tenant2` 등)이 자동으로 `114.202.247.246`으로 해석됩니다.
- 개별 서브도메인마다 DNS 레코드를 추가할 필요가 없습니다.
- Nginx의 와일드카드 서버 블록과 함께 사용하여 동적 서브도메인 라우팅이 가능합니다.

### DNS 제공자별 와일드카드 레코드 설정 방법

**Gabia**:
- DNS 관리 페이지에서 "A 레코드 추가" 선택
- 호스트: `*.dev` 또는 `*` (인터페이스에 따라 다름)
- 값: `114.202.247.246`

**다른 DNS 제공자**:
- 대부분의 DNS 제공자는 와일드카드 레코드를 지원합니다.
- `*` 또는 `*.dev` 형식으로 입력하면 됩니다.

---

## 다음 단계

1. ✅ **DNS 레코드 설정** (Gabia DNS 관리 페이지)
2. ⏳ **DNS 전파 대기** (5분 ~ 1시간)
3. ⏳ **DNS 전파 확인** (`nslookup`, `dig` 명령어)
4. ⏳ **브라우저 접근 테스트** (`https://mindgarden.dev.core-solution.co.kr/`)
5. ⏳ **서버 `/etc/hosts` 임시 설정 제거** (DNS 전파 후)

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
   ```bash
   dig @8.8.8.8 mindgarden.dev.core-solution.co.kr
   ```

### 여전히 접근이 안 되는 경우

1. **Nginx 설정 확인**: `ssh root@beta0629.cafe24.com "nginx -t"`
2. **Nginx 재시작**: `ssh root@beta0629.cafe24.com "systemctl reload nginx"`
3. **방화벽 확인**: 포트 80, 443이 열려있는지 확인
4. **SSL 인증서 확인**: `ssh root@beta0629.cafe24.com "certbot certificates"`

---

## 완료 체크리스트

- [ ] Gabia DNS 관리 페이지 접속
- [ ] 와일드카드 A 레코드 추가 (`*.dev` → `114.202.247.246`)
- [ ] DNS 전파 확인 (`nslookup`, `dig`)
- [ ] 브라우저 접근 테스트
- [ ] 서버 `/etc/hosts` 임시 설정 제거 (선택사항)

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-12


# 와일드카드 DNS 레코드 추가 가이드

**작성일**: 2025-12-12  
**목적**: Gabia DNS 관리 페이지에서 와일드카드 A 레코드 추가

---

## 현재 DNS 레코드 상태

현재 설정된 레코드:
- ✅ `dev` → `114.202.247.246` (A 레코드)
- ✅ `app` → `211.37.179.204` (A 레코드)
- ✅ `api` → `211.37.179.204` (A 레코드)
- ✅ `api.dev` → `114.202.247.246` (A 레코드)
- ❌ **와일드카드 레코드 없음** (`*.dev` 또는 `*`)

---

## 와일드카드 레코드 추가 방법

### 1. 레코드 추가 버튼 클릭

DNS 관리 페이지 하단의 **"+ 레코드 추가"** 버튼을 클릭합니다.

### 2. 레코드 정보 입력

다음 정보를 입력합니다:

**레코드 타입**: `A`

**호스트/이름**: 
- `*.dev` 또는
- `*` (Gabia 인터페이스에 따라 다를 수 있음)

**값/IP 주소**: `114.202.247.246`

**TTL**: `3600` (또는 기본값)

### 3. 저장

**"저장"** 버튼을 클릭하여 레코드를 저장합니다.

---

## Gabia 인터페이스별 입력 방법

Gabia DNS 관리 인터페이스에 따라 와일드카드 입력 방식이 다를 수 있습니다:

### 방법 1: `*.dev` 형식
```
호스트/이름: *.dev
```

### 방법 2: `*` 형식
```
호스트/이름: *
```

### 방법 3: 전체 도메인 형식
```
호스트/이름: *.dev.core-solution.co.kr
```

**참고**: 정확한 입력 방식이 불확실하면 Gabia 고객센터에 문의하거나, 먼저 `*.dev` 형식으로 시도해보세요.

---

## 추가 후 확인

레코드 추가 후 다음 명령어로 확인하세요:

```bash
# DNS 해석 확인
dig mindgarden.dev.core-solution.co.kr
nslookup mindgarden.dev.core-solution.co.kr

# 여러 DNS 서버로 확인
dig @8.8.8.8 mindgarden.dev.core-solution.co.kr
dig @ns.gabia.co.kr mindgarden.dev.core-solution.co.kr

# 테스트 스크립트 실행
./scripts/server-management/dns/test-wildcard-dns.sh mindgarden
```

**예상 결과** (설정 후):
```
mindgarden.dev.core-solution.co.kr → 114.202.247.246
```

**전파 시간**: 보통 5분 ~ 1시간 (TTL 값에 따라 다름)

---

## 추가 후 테스트

DNS 전파 확인 후:

```bash
# HTTPS 접근 테스트
curl -I https://mindgarden.dev.core-solution.co.kr/

# 브라우저에서 접근
# https://mindgarden.dev.core-solution.co.kr/
```

---

## 문제 해결

### 레코드 추가가 안 되는 경우

1. **호스트 이름 형식 확인**: `*.dev`, `*`, 또는 `*.dev.core-solution.co.kr` 중 하나를 시도
2. **Gabia 고객센터 문의**: 와일드카드 레코드 지원 여부 확인
3. **기존 레코드와 충돌 확인**: 동일한 호스트 이름이 있는지 확인

### DNS 전파가 안 되는 경우

1. **TTL 값 확인**: TTL이 너무 크면 전파가 느릴 수 있습니다
2. **DNS 캐시 클리어**: 로컬 DNS 캐시를 클리어합니다
3. **다른 DNS 서버로 확인**: Google DNS (8.8.8.8) 또는 Cloudflare DNS (1.1.1.1)로 확인

---

## 완료 체크리스트

- [ ] "+ 레코드 추가" 버튼 클릭
- [ ] 레코드 타입: A 선택
- [ ] 호스트/이름: `*.dev` (또는 `*`) 입력
- [ ] 값/IP 주소: `114.202.247.246` 입력
- [ ] TTL: `3600` 설정
- [ ] "저장" 버튼 클릭
- [ ] DNS 전파 확인 (5분 ~ 1시간 대기)
- [ ] DNS 해석 확인 (`dig`, `nslookup`)
- [ ] 브라우저 접근 테스트

---

**작성자**: AI Assistant  
**최종 업데이트**: 2025-12-12


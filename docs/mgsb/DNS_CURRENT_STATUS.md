# DNS 설정 현황 확인

**작성일**: 2025-11-18  
**목적**: 현재 DNS 설정 상태 확인 및 누락된 레코드 점검

## 1. e-trinity.co.kr (회사 도메인) - 현재 설정

### ✅ 설정 완료된 레코드 (모든 레코드 완료)

| 타입 | 호스트 | 값/위치 | TTL | 상태 |
|------|--------|---------|-----|------|
| A | @ | 211.37.179.204 | 3600 | ✅ 설정 완료 |
| A | apply | 211.37.179.204 | 3600 | ✅ 설정 완료 |
| A | ops | 211.37.179.204 | 3600 | ✅ 설정 완료 |
| A | ops.dev | 114.202.247.246 | 3600 | ✅ 설정 완료 |
| A | dev | 114.202.247.246 | 3600 | ✅ 설정 완료 |
| CNAME | www | e-trinity.co.kr. | 3600 | ✅ 설정 완료 (마지막 점 포함) |
| A | apply.dev | 114.202.247.246 | 3600 | ✅ 설정 완료 (2025-11-18 추가) |

## 2. core-solution.co.kr (솔루션 도메인) - 현재 설정

### ✅ 설정 완료된 레코드

| 타입 | 호스트 | 값/위치 | TTL | 상태 |
|------|--------|---------|-----|------|
| A | dev | 114.202.247.246 | 3600 | ✅ 설정 완료 |
| A | app | 211.37.179.204 | 3600 | ✅ 설정 완료 |
| A | api | 211.37.179.204 | 3600 | ✅ 설정 완료 |
| A | api.dev | 114.202.247.246 | 3600 | ✅ 설정 완료 |

### ✅ 모든 필수 레코드 설정 완료

**core-solution.co.kr 도메인은 모든 필수 레코드가 설정되어 있습니다.**

## 3. DNS 설정 요약

### e-trinity.co.kr (회사 도메인)

**운영 서버 (211.37.179.204):**
- ✅ `e-trinity.co.kr` (@)
- ✅ `apply.e-trinity.co.kr` (apply)
- ✅ `ops.e-trinity.co.kr` (ops)

**개발 서버 (114.202.247.246):**
- ✅ `dev.e-trinity.co.kr` (dev)
- ✅ `ops.dev.e-trinity.co.kr` (ops.dev)
- ✅ `apply.dev.e-trinity.co.kr` (apply.dev) - **설정 완료**

**CNAME:**
- ✅ `www.e-trinity.co.kr` → `e-trinity.co.kr.` (TTL: 600)

### core-solution.co.kr (솔루션 도메인)

**개발 서버 (114.202.247.246):**
- ✅ `dev.core-solution.co.kr` (dev)
- ✅ `api.dev.core-solution.co.kr` (api.dev)

**운영 서버 (211.37.179.204):**
- ✅ `app.core-solution.co.kr` (app)
- ✅ `api.core-solution.co.kr` (api)

## 4. 다음 단계

### e-trinity.co.kr 도메인

✅ **모든 필수 레코드 설정 완료**

1. **DNS 전파 확인** (1시간 이내)
   ```bash
   nslookup apply.dev.e-trinity.co.kr
   dig apply.dev.e-trinity.co.kr
   ```

2. **SSL 인증서 발급**
   - `apply.dev.e-trinity.co.kr` SSL 인증서 발급 필요
   ```bash
   sudo certbot certonly --nginx -d apply.dev.e-trinity.co.kr
   ```

### core-solution.co.kr 도메인

✅ **모든 필수 레코드 설정 완료** - 추가 작업 불필요

## 5. 참고 사항

### CNAME 레코드 마지막 점(.)

✅ **올바르게 설정됨**: `www` → `e-trinity.co.kr.` (마지막에 점 포함)

**설명:**
- CNAME 레코드의 값은 FQDN(Fully Qualified Domain Name) 형식이어야 합니다
- FQDN은 마지막에 점(.)으로 끝나야 합니다
- 예: `e-trinity.co.kr.` ✅ (올바름)
- 예: `e-trinity.co.kr` ❌ (잘못됨)

### TTL 값

- **일반 레코드**: 3600초 (1시간)
- **CNAME 레코드**: 600초 (10분) - 더 짧은 TTL로 빠른 변경 가능

### 네임서버

- **e-trinity.co.kr**: ns.gabia.co.kr
- **core-solution.co.kr**: ns.gabia.co.kr

## 6. 완료 체크리스트

### e-trinity.co.kr
- [x] @ (운영 회사 홈페이지)
- [x] apply (운영 온보딩)
- [x] ops (운영 포털)
- [x] ops.dev (개발 포털)
- [x] dev (개발 회사 홈페이지)
- [x] www (CNAME)
- [x] **apply.dev (개발 온보딩) - 설정 완료 ✅**

### core-solution.co.kr
- [x] dev (개발 서버)
- [x] app (운영 서버)
- [x] api (운영 API 서버)
- [x] api.dev (개발 API 서버)

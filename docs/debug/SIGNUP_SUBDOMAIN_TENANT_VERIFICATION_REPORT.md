# 회원가입 시 서브도메인 → tenantId 흐름 검증 보고서

**목적**: "회원가입 시 서브도메인 정보를 가져와서 회원가입 시켜야 한다" 로직의 전체 흐름 추적, 공백(gap) 식별, 수정 제안 정리.  
**역할**: 디버거 분석 전용 (코드 수정 없음).

---

## 1. 전체 흐름 (프론트 제출 → 백엔드 register)

### 1.1 흐름 단계 요약

```
[1] 프론트 (TabletRegister.js)
    → handleSubmit → csrfTokenManager.post('/api/v1/auth/register', payload)
    → payload: name, email, password, confirmPassword, phone, gender, agreeTerms, agreePrivacy
    → tenantId / subdomain 미포함, X-Tenant-Id는 getTenantId() 결과만 사용

[2] csrfTokenManager (frontend/src/utils/csrfTokenManager.js)
    → fullUrl = API_BASE_URL + '/api/v1/auth/register'
    → getTenantId() 호출 → 비로그인 시 sessionManager/localStorage에 사용자 없음 → null
    → X-Tenant-Id 헤더: tenantId가 있을 때만 추가 → 회원가입 시점에는 대부분 없음

[3] 실제 요청이 나가는 호스트
    → API_BASE_URL (environment.js):
       - REACT_APP_API_BASE_URL 빈 문자열 또는 미설정 + 서버 환경 → ''
       - 프로덕션/서버: '' → 상대 경로 → 요청 호스트 = 현재 페이지 호스트 (예: mindgarden.dev.core-solution.co.kr)
       - 로컬: 'http://localhost:8080' → 요청 호스트 = localhost

[4] TenantContextFilter (공개 API 분기)
    → requestURI = /api/v1/auth/register
    → isPublicApi() → "/api/v1/auth"로 시작 → true
    → tenantId = extractTenantId(request, session)
    → finally 블록에서 TenantContextHolder.clear() → chain.doFilter() 반환 **후** 실행 (컨트롤러 실행 중에는 clear 되지 않음)

[5] extractTenantId 순서
    ① 세션 User의 tenantId → 비로그인 시 없음
    ② 세션 SESSION_TENANT_ID / SessionConstants.TENANT_ID → 없음
    ③ X-Tenant-Id 헤더 → 회원가입 시 보통 없음
    ④ Host 헤더
       → host 예: mindgarden.dev.core-solution.co.kr
       → extractTenantSubdomain(host): 포트 제거, 패턴 매칭 (.dev.core-solution.co.kr 등), 접미사 제거
       → subdomain = "mindgarden" (기본 서브도메인 dev, app, api, staging, www 제외)
    ⑤ tenantRepository.findBySubdomainIgnoreCase("mindgarden") → Optional<Tenant>
       → 있으면 tenant.getTenantId() 반환, 없으면 null
    ⑥ 로컬: localhost + local 프로파일 + localDefaultTenantId 설정 시 해당 값 사용

[6] 공개 API 분기 내부
    → tenantId != null 이면 TenantContextHolder.setTenantId(tenantId)
    → chain.doFilter(request, response) 호출 → AuthController.register() 실행
    → finally: TenantContextHolder.clear()

[7] AuthController.register() (약 263라인~)
    → tenantId = TenantContextHolder.getTenantId()
    → tenantId == null 이면 로그 경고만, 계속 진행
    → user.setTenantId(tenantId) 는 tenantId != null 일 때만 수행
    → generateUniqueUserId(email, tenantId): tenantId 없으면 테넌트별 중복 검사 건너뜀
    → User 저장 (BaseEntity.tenant_id nullable 이므로 tenant_id = null 로 저장 가능)
```

### 1.2 tenantId가 null이 되는 경우 (왜 그런지)

| 조건 | 원인 |
|------|------|
| 요청이 **다른 호스트**로 감 (예: api.dev.core-solution.co.kr) | Host = api.dev.core-solution.co.kr → extractTenantSubdomain → "api" → 기본 서브도메인 제외 → null. 프론트가 X-Tenant-Id도 보내지 않음. |
| 로컬에서 API_BASE_URL이 localhost:8080 이고, localDefaultTenantId 미설정 | Host = localhost → 서브도메인 패턴 불일치 → subdomain null. localDefaultTenantId 없으면 null. |
| tenants 테이블에 해당 subdomain 없음 | findBySubdomainIgnoreCase(subdomain) → empty → null. |
| 프론트가 같은 호스트지만 Nginx 등에서 Host가 변경됨 | 실제 수신 Host가 테넌트 서브도메인이 아니면 null. |

---

## 2. 갭(Gap) 정리

### 2.1 API 호스트가 서브도메인과 다를 때

- **갭**: 프론트는 회원가입 시 **X-Tenant-Id 또는 subdomain을 보내지 않음**. `getTenantId()`는 세션/로그인 사용자 기반이라 비로그인 시 null.
- **결과**: 요청이 `https://api.dev.core-solution.co.kr` 등으로 가면 Host = api.dev.core-solution.co.kr → 서브도메인 "api" 제외 → tenantId = null → **테넌트 지정 회원가입 실패**.

### 2.2 TenantContextHolder.clear() 시점

- **확인**: 공개 API 분기의 `finally`에서 `TenantContextHolder.clear()` 호출.
- **동작**: `finally`는 `chain.doFilter(request, response)` **반환 후** 실행되므로, Controller 실행 중에는 TenantContext가 유지됨. **clear가 컨트롤러보다 먼저 실행되는 문제 없음.**

### 2.3 기타

- **백엔드 register**: tenantId가 null이어도 예외를 던지지 않고 경고 로그만 남기며 진행. `user.setTenantId(tenantId)`는 null이면 호출하지 않아, **User가 tenant_id = null로 저장될 수 있음**. (BaseEntity.tenant_id는 nullable)
- **멀티테넌트 표준**: tenantId 필수 원칙과 충돌. tenant_id null 사용자는 테넌트 격리 대상에서 이탈.
- **테넌트 테이블**: `tenants.subdomain` 컬럼 및 데이터 존재 여부, 도메인 패턴(.dev.core-solution.co.kr 등)과의 일치 여부가 동작 전제.

---

## 3. 검증 결과 요약

### 3.1 현재 구성에서의 동작

| 시나리오 | 동작 |
|----------|------|
| 사용자가 **https://mindgarden.dev.core-solution.co.kr/register** 에서 제출하고, **같은 호스트로** API 요청이 감 (API_BASE_URL = '' 등) | **동작함**. Host = mindgarden.dev.core-solution.co.kr → subdomain "mindgarden" → findBySubdomainIgnoreCase → tenantId 설정 → register에서 해당 테넌트로 가입. |
| 사용자가 **mindgarden** 서브도메인에서 접속하지만, API 요청만 **api.dev.core-solution.co.kr** 등 다른 호스트로 감 | **동작 안 함**. Host가 API 호스트 기준이라 subdomain이 "api" 등으로 나와 제외되고, 프론트는 X-Tenant-Id를 보내지 않아 tenantId = null. |
| 로컬(localhost) + localDefaultTenantId 설정됨 | **동작함**. Filter에서 localDefaultTenantId 반환. |
| 로컬(localhost) + localDefaultTenantId 미설정 | **동작 안 함**. tenantId = null. |

### 3.2 흐름 다이어그램 (요약)

```
[브라우저] mindgarden.dev.core-solution.co.kr/register
    ↓ POST /api/v1/auth/register (Host: ???)
[요청 호스트가 mindgarden.dev.core-solution.co.kr 인가?]
    YES → Filter: Host → subdomain "mindgarden" → DB 조회 → tenantId 설정
        → Controller: getTenantId() 사용 → user.setTenantId(tenantId) → 동작함
    NO (예: api.dev.core-solution.co.kr) → subdomain "api" 제외 → tenantId = null
        → Controller: tenantId null → user.setTenantId 미호출 → 동작 안 함
```

---

## 4. 수정 제안 및 체크리스트 (core-coder 전달용)

### 4.1 권장 수정 사항

1. **백엔드 register 시 tenantId null 처리**
   - **파일**: `AuthController.java` (register 메서드, tenantId 사용 구간).
   - **내용**: `TenantContextHolder.getTenantId()`가 null이면 400 응답 반환 (또는 명시적 에러 코드/메시지). 예: "회원가입을 위해서는 테넌트 정보가 필요합니다. 올바른 주소(서브도메인)에서 접속했는지 확인해 주세요."
   - **이유**: tenant_id null 가입 방지, 멀티테넌트 표준 준수.

2. **프론트: API 호스트가 서브도메인과 다를 때 tenantId/서브도메인 전달**
   - **파일**: `TabletRegister.js` 및/또는 `csrfTokenManager.js` / `apiHeaders.js`.
   - **내용**: 회원가입 요청 시, 현재 창의 호스트에서 서브도메인을 추출해  
     - **옵션 A**: `X-Tenant-Id`에 tenantId를 넣어 전달 (tenantId를 알 수 있는 경우, 예: 공개 API로 tenant 조회 후),  
     - **옵션 B**: `X-Tenant-Subdomain` 같은 헤더에 서브도메인(예: "mindgarden") 전달하고, 백엔드 Filter에서 이 헤더를 Host 대신(또는 보조로) 사용해 tenantId 조회.
   - **전제**: 백엔드 Filter에 서브도메인 헤더 처리 추가 (예: Host 이후 fallback으로 `X-Tenant-Subdomain` → `findBySubdomainIgnoreCase`).

3. **tenants 테이블 및 subdomain 데이터**
   - 운영/스테이징 도메인 패턴(.dev.core-solution.co.kr, .core-solution.co.kr 등)과 일치하는 subdomain 값이 `tenants` 테이블에 존재하는지 확인.
   - Filter의 `extractTenantSubdomain` 패턴과 실제 도메인 구조 일치 여부 점검.

### 4.2 수정 후 확인 체크리스트

- [ ] `https://{tenant-subdomain}.dev.core-solution.co.kr/register` 에서 가입 시, 해당 테넌트의 `tenant_id`로 사용자 저장되는지 확인.
- [ ] API를 별도 호스트(예: api.dev.core-solution.co.kr)로 두고, 프론트에서 서브도메인 또는 tenantId를 넘기도록 변경한 뒤, 동일 서브도메인에서 가입 시 tenantId가 설정되는지 확인.
- [x] register 시 tenantId가 null이면 400(또는 명시적 에러)이 반환되는지 확인. **(구현됨: AuthController.register()에서 tenantId null/empty 시 IllegalArgumentException → 400)**
- [ ] 로컬 개발: `local.default-tenant-id`(또는 `LOCAL_DEFAULT_TENANT_ID`) 설정 시 로컬에서도 회원가입 시 tenantId가 설정되는지 확인.

**구현 완료 항목 (core-coder 적용)**  
- AuthController: tenantId null/empty 시 400 + 메시지 "회원가입을 위해서는 테넌트 정보가 필요합니다. 올바른 주소(서브도메인)에서 접속했는지 확인해 주세요." 반환, 가입 진행 차단.  
- TenantContextFilter: `X-Tenant-Subdomain` 헤더 지원 (Host 기반 추출 후 fallback으로 헤더 값으로 `findBySubdomainIgnoreCase` 조회).  
- TabletRegister.js: 현재 창 호스트에서 서브도메인 추출 후 회원가입 요청 시 `X-Tenant-Subdomain` 헤더 전달 (패턴: .dev.core-solution.co.kr, .core-solution.co.kr, .dev.m-garden.co.kr, .m-garden.co.kr, 기본 서브도메인 dev/app/api/staging/www 제외).

---

## 5. 참고 코드 위치

| 구분 | 파일 경로 |
|------|-----------|
| Filter | `src/main/java/com/coresolution/core/filter/TenantContextFilter.java` |
| 공개 API 경로 | `isPublicApi()` → `/api/v1/auth` 포함 |
| extractTenantId / extractTenantSubdomain | 동일 Filter 내 |
| register | `src/main/java/com/coresolution/consultation/controller/AuthController.java` (register, TenantContextHolder.getTenantId()) |
| 프론트 회원가입 | `frontend/src/components/auth/TabletRegister.js` (csrfTokenManager.post) |
| API BASE URL | `frontend/src/constants/environment.js` (getBaseUrl) |
| X-Tenant-Id 부여 | `frontend/src/utils/csrfTokenManager.js` (getTenantId), `frontend/src/utils/apiHeaders.js` (getTenantId) |
| Tenant 조회 | `TenantRepository.findBySubdomainIgnoreCase` |

---

*문서 작성: 디버그 분석 전용. 코드 수정은 core-coder에 위임.*

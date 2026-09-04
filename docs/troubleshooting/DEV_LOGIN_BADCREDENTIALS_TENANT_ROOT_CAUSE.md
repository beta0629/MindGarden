# .dev 로그인 BadCredentials — 테넌트 컨텍스트 루트코즈

## 증상

- `.dev`에서 로그인만 `BadCredentials` / 자격 증명 오류.
- `duplicate-check/email` 등에서는 동일 이메일이 존재하는 것처럼 보임.
- journal에 `로컬 프로파일에서 테넌트 정보가 없습니다` 가 보일 수 있음.

## 가설 병렬 요약

| 가설 | 상태 | 요약 |
|------|------|------|
| **A** 테넌트 missing → BadCredentials | **코드 확정** (수정 유지) | `isLocalProfile`이 `dev`를 local로 취급 + Host=`localhost` 시 `X-Forwarded-Host` 미사용 → tenant 없음 → `findByEmail` 실패 → BadCredentials |
| **B** 실사용자 치환/시드가 실비번 덮어씀 | **코드 위험경로 확정 · Flyway/시드 반증 · 런타임 SSH 대기** | `reset-password`+`findAllByEmail`+`get(0)` 위험경로 YES. Flyway V202609\*/#815~#821·anonymize·온보딩 INSERT는 password UPDATE 아님. 호출 여부는 diagnose workflow |

⚠️ **비밀번호 UPDATE / 리셋 코드 추가·실행 금지.** 확정 전 DB 해시를 바꾸지 말 것.

---

## 가설 A (코드 확정): tenant missing → BadCredentials

### 루트코즈

1. `TenantContextFilter` / `AuthController` / `OAuth2Controller` 의 `isLocalProfile()` 가 **`local`뿐 아니라 `dev`도 true** 로 취급했음.
2. `.dev`는 `--spring.profiles.active=dev` 로 기동. Host가 `localhost`(헬스/내부 curl/프록시)이고 `LOCAL_DEFAULT_TENANT_ID`가 없으면 테넌트 컨텍스트가 비게 됨.
3. 로그인: `CustomUserDetailsService` → `findByLoginPrincipal` → `findByEmail` → `TenantContextHolder.getRequiredTenantId()`  
   tenant 없음 → `IllegalStateException` → `UsernameNotFoundException` → Spring Security **BadCredentials**.
4. 이메일 중복 검사 등은 tenant 없을 때 `existsByEmailAll` 경로를 타서 **이메일은 있는데 로그인만 실패**처럼 보임.

서브도메인 추출 자체는 Host가 `mindgarden.dev.core-solution.co.kr` 이면 동작한다. 문제는 (1) `dev`를 local로 취급한 폴백/경고, (2) Host=`localhost`일 때 `X-Forwarded-Host`를 보지 않던 점.

### 수정 요약 (유지 — 건드리지 말 것)

- `isLocalProfile()`: **`local`만 true**. 공유 `.dev`는 운영과 같이 Host/서브도메인 기반 테넌트만 사용. `LOCAL_DEFAULT_TENANT_ID` 폴백은 진짜 `local` 프로파일 전용.
- Host가 localhost이거나 서브도메인을 못 뽑으면 **`X-Forwarded-Host`** 로 서브도메인 조회 재시도 (nginx `X-Forwarded-Host` 설정과 정합).
- 비밀번호 리셋/UPDATE **하지 않음** — 자격 증명 해시 문제가 아니라 테넌트 스코프 조회 실패가 BadCredentials로 포장된 것.

### 비밀번호 리셋이 아닌 이유 (가설 A 관점)

증상은 “비밀번호 불일치”가 아니라 **tenant 없는 `findByEmail` → UsernameNotFound → BadCredentials** 매핑이다.  
해시 UPDATE는 원인을 가리고 prod/dev 데이터 무결성을 해친다. 테넌트 컨텍스트를 고친 뒤에도 실패하면 그때 별도로 password 형태(bcrypt prefix)만 SELECT로 확인한다.

---

## 사용자 가설: 실사용자 치환으로 비번 변경 — 조사 결과표

재검증일: 2026-09-04 (브랜치 `cursor/dev-login-badcredentials-tenant-21c9`, PR #823).  
범위: 코드·git·PR·Flyway·시드 스크립트·diagnose workflow. **비밀번호 UPDATE/실행 없음. .dev SSH 런타임은 미실행(대기).**

| # | 조사 항목 | 판정 | 근거 (파일:라인 · 커밋) | 비고 |
|---|-----------|------|-------------------------|------|
| B1 | `TestDataController.reset-password`가 실계정 password를 덮을 수 있는가 | **확정(코드 위험 경로 존재)** | `TestDataController.java:749-787` — `findAllByEmail`→`users.get(0)`→`encodeSecret`→`setPassword`→`save`. 도입/테넌트우회: `678e3235e` / `e80c3b934`. encodeSecret 통일: `7acdda11f` | 호출·`.dev` 빈 로드 여부는 SSH 미확정 |
| B2 | `ConditionalOnProperty(isDev=true)` + 메서드 가드 허점 | **확정(코드)** | L51 `@ConditionalOnProperty` (`7f044effc`). 가드 `!isDev && !"local"` → `isDev=true`면 `dev` 프로파일도 통과 (`2d47f5ff4` 계열). `application-dev.yml`에 `isDev` 키 **없음**; `application-local.yml:isDev:true` / `application-prod.yml:isDev:false`. systemd `EnvironmentFile=-/etc/mindgarden/dev.env` (`config/systemd/mindgarden-dev.service:10`) | env에 `IS_DEV`/`isDev` 있으면 `.dev` 빈 로드 가능 |
| B3 | `create-test-data`가 기존 실비번 UPDATE인가 | **반증(코드)** | L72-96 INSERT `admin@mindgarden.com` + `encodeSecret("admin123")` (`c44a89681`/`7acdda11f`). 기존 행 UPDATE 아님(충돌 시 예외 가능) | 실계정 덮어쓰기 경로 아님 |
| B4 | `findAllByEmail`+`get(0)` 사용처 | **확정(위험)** | `reset-password` L766/774; `delete-user` L640/648; `verify-password` L699/707(읽기만). `UserRepository.java:224-225` `@Deprecated` 테넌트 미필터 | 첫 행이 실계정이면 쓰기 API가 실계정 타격 |
| B5 | 클래스 `@RequestMapping("/api/v1/test")` | **확정(현재 HEAD 없음)** | `f336ab933`에서 `@RequestMapping("/api/v1/test")` 제거. 메서드는 `/reset-password` 등 **루트 상대** | 과거 JAR이 `/api/v1/test`면 호출 가능 — SSH로 JAR/매핑 확인 |
| B6 | `createTestConsultant` (`POST /consultant`) 가드 없음 | **확정(코드)** | L488-507 — 메서드 내 `isDev`/`local` 가드 없음. 빈 로드 시에만 노출 | 신규 등록 경로(실비번 UPDATE 아님) |
| B7 | Flyway `V202609*` / #815~#821이 `users.password` 변경 | **반증(코드·머지)** | 전 `V202609*.sql`에 `password`/`users` 쓰기 **0건**. 머지: #815 `cf07ae1c1`, #817 `5cb399b93`, #818 `0c6ab84ed`, #819 `59163c2bc`, #820 `1af0f1ef3`, #821 `401e0765a`. #816 **OPEN(미머지)**. #819 diff의 `encodeSecret`은 **테스트 mock만** | 배포 마이그로 비번 변경 불가 |
| B8 | `post-dev-sync-anonymize.sql`이 password 치환 | **반증(코드)** | `scripts/database/sync/post-dev-sync-anonymize.sql:8-11,25,36-56` — **password/email KEEP** (`16ee61b25`). name 등만 UPDATE. 단 `updated_at=CURRENT_TIMESTAMP`는 **전 users**에 찍힘 | `updated_at`만으로 비번 변경 단정 금지 |
| B9 | 온보딩 `CreateTenantAdminAccount` / Ops `TempPassword` | **반증(기존 실계정 UPDATE 아님)** | `V20251223_001__...:45-79` — 동일 tenant+email 있으면 **skip**, 없으면 **INSERT**. Ops `OnboardingService.java` `TempPassword123!` → 해시 후 프로시저 INSERT. `OnboardingApprovalServiceImpl.java:1244`도 INSERT | 신규 테넌트 관리자만 |
| B10 | 수동/유틸 SQL `UPDATE users SET password` | **반증(자동 경로 아님)** | `scripts/database/update_password_hash.sql` UPDATE는 **주석 처리**. `database/schema/add_test_data_for_tenant.sql`은 테스트 테넌트 **INSERT** | 사람이 수동 실행하면 별도(SSH/audit) |
| B11 | E2E/`agisunny`가 DB 해시를 덮어씀 | **반증(코드)** | testing skill·스크립트는 UI 로그인 자격만. TestData `reset-password` 자동 호출 없음 | 사람/수동 API 호출은 SSH |
| B12 | `AdminUserController` 관리자 리셋 | **확정(의도적 별경로)** | `AdminUserController.java:365-402` — `PUT .../reset-password`, 로그 `관리자 권한으로 사용자 비밀번호 초기화`. 인증 필요 | 가설 B(TestData)와 구분. journal 패턴 보강됨 |
| B13 | #815~#821 전후 develop이 로그인/비번 코드 변경 | **반증** | 해당 PR 파일 목록에 `TestDataController`/Auth password/`users.password` 없음. 주제: 일지 SSOT·FE CSS·LazyInit·차량번호·LNB·Flyway rename | BadCredentials 트리거로 보기 어려움 |
| B14 | `.dev` DB `updated_at` / journal 호출 사실 | **미확정(SSH 대기)** | workflow 섹션 6(journal 오늘 00:00 KST+7일), 8(SELECT prefix/length/`updated_at`/agisunny), 9(nginx). **해시 전문·이메일 평문·UPDATE 없음** | `workflow_dispatch` 실행 후 판정 |

### 종합 판정 (코드 기준)

1. **코드상 위험 경로 존재: YES** — `TestDataController.reset-password` + `isDev=true` 빈 로드 시 실이메일로 실비번 덮기 가능 (`findAllByEmail`+`get(0)`).
2. **Flyway / #815~#821로 비번이 바뀌었다: NO (반증)** — `V202609*` 및 해당 머지 커밋에 `users.password` 변경 없음.
3. **시드·익명화·온보딩이 기존 실비번을 UPDATE: NO (반증)** — KEEP/INSERT-only/skip. (익명화는 `updated_at`만 전량 갱신 가능)
4. **`.dev`에서 실제로 호출·해시 변경됐는지: 미확정** — diagnose workflow SSH 증거 필요. **비밀번호 UPDATE 금지 유지.**

---

## 대안 가설 B (조사 중): TestDataController / 시드가 비밀번호를 덮어썼는가

### 경고

- **아직 `users.password` UPDATE 하지 말 것.**
- 진단 workflow·SSH는 **SELECT / journal / access log / 키 이름** 만.
- 실계정 이메일을 테스트 API에 넣으면 실비번이 덮일 수 있는 **코드 경로가 존재**한다. 호출 여부는 SSH 증거로만 확정.

### 1. `TestDataController` 전수 (엔드포인트)

파일: `src/main/java/com/coresolution/consultation/controller/TestDataController.java`  
빈: `@ConditionalOnProperty(name = "isDev", havingValue = "true")` (L51, `7f044effc`)  
가드 공통: `if (!isDev && !"local".equals(activeProfile))` — **`isDev=true`이면 `dev` 프로파일도 통과**.

| 메서드 | 매핑 | 가드 | password/실계정 영향 | 커밋 힌트 |
|--------|------|------|----------------------|-----------|
| `createTestData` | `POST /create-test-data` L72 | 있음 | INSERT `admin@mindgarden.com` + `encodeSecret("admin123")` L88 — **UPDATE 아님** | `c44a89681` / `7acdda11f` |
| `createConsultant` | `POST /create-consultant` L174 | 있음 | 신규 등록 | — |
| `createClient` | `POST /create-client` L199 | 있음 | 신규 등록 | — |
| `createMapping` | `POST /create-mapping` L224 | 있음 | 매핑만 | — |
| `getTestData` | `GET /data` L250 | 있음 | 읽기 | — |
| `migrateUserRoles` | `POST /migrate-user-roles` L281 | 있음 | role 계열(본 조사 password 외) | — |
| `createTestClient` | `POST /client` L312 | 있음 | 신규 | — |
| `createTestMapping` | `POST /mapping` L379 | 있음 | 매핑 | — |
| `createTestConsultant` | `POST /consultant` L488 | **없음** | 신규 등록만 (빈 로드 시 노출) | `c44a89681` |
| `createTestConsultation` | `POST /consultation` L533 | 있음 | 상담 데이터 | — |
| `deleteTestUser` | `POST /delete-user` L627 | 있음 | `findAllByEmail`→`get(0)` soft-delete L640-655 | `e80c3b934` 계열 |
| `verifyPassword` | `POST /verify-password` L680 | 있음 | 읽기만. bypass+`findAllByEmail` L699 | — |
| **`resetTestUserPassword`** | **`POST /reset-password` L749** | 있음 | **bypass → findAllByEmail → get(0) → encodeSecret → setPassword → save L766-787**. 로그: `테스트 사용자 비밀번호 재설정` | `678e3235e` / `e80c3b934` / `7acdda11f` |

`isDev` yml: local=`true`, prod=`false`, **dev yml 키 없음**. env `IS_DEV`/`isDev` + `dev.env` 가능.

#### 경로 매핑 주의

- 주석/프론트는 `/api/v1/test/...` 가정. **현재 HEAD는 클래스 `@RequestMapping` 없음** (`f336ab933` 제거).
- 과거 배포 JAR이 `/api/v1/test`·`/api/test`이면 호출 가능 → SSH로 확인.

### 2. 시드·치환·Flyway·온보딩·PR #815~#821

| 경로 / PR | password 영향 | 판정 |
|-----------|---------------|------|
| Flyway `V20260902_*`~`V20260904_*` | `users`/`password` 문자열 **없음** | **반증** |
| #815 `cf07ae1c1` — 일지 SSOT + `V20260904_002` (consultation_record repair) | users 미언급 | **반증** |
| #816 | **OPEN, 미머지** | 해당 없음 |
| #817 `5cb399b93` FE CSS | — | **반증** |
| #818 `0c6ab84ed` LazyInit DTO | — | **반증** |
| #819 `59163c2bc` 차량번호 + `V20260904_003` consultants | 테스트 mock `encodeSecret`만 | **반증** |
| #820 `1af0f1ef3` LNB (초기 `V20260904_003` LNB) | menu 코드 | **반증** |
| #821 `401e0765a` LNB → `V20260904_004` rename | rename only | **반증** |
| `post-dev-sync-anonymize.sql` | password/email **KEEP**; name 치환; **전 users `updated_at` 갱신** | 비번 덮어쓰기 **반증**; updated_at 해석 주의 |
| `CreateTenantAdminAccount` (`V20251223_001` L45-79) | 존재 시 skip / 없으면 **INSERT** | 기존 UPDATE **반증** |
| Ops `OnboardingService` `TempPassword123!` | 해시 후 프로시저 **INSERT** | 기존 UPDATE **반증** |
| `scripts/database/update_password_hash.sql` | UPDATE **주석** | 자동 경로 **반증** |
| E2E `agisunny@...` | UI 로그인만 | 자동 덮어쓰기 **반증** |
| `AdminUserController` `PUT .../reset-password` L365 | 인증된 관리자 리셋 | 가설 B와 **별개** |

### 3. 확정/반증에 필요한 SSH 증거 (가설 B)

workflow: `.github/workflows/diagnose-dev-login-badcredentials.yml` (섹션 6~9).

1. **journalctl** — **오늘(Asia/Seoul 00:00:00~)** + 최근 7일:  
   `테스트 사용자 비밀번호 재설정` / `verify-password` / `create-test-data` / `reset-password` / `TempPassword|임시 비밀번호|비밀번호 변경|setPassword` / **`관리자 권한으로 사용자 비밀번호 초기화`** / `agisunny`
2. **`isDev` / `IS_DEV` 키 이름만** (값 redact): systemctl Environment, `/etc/mindgarden/dev.env`, 디스크상 `application-*.yml` 키.
3. **SQL SELECT only** (이메일 평문·해시 전문 금지):  
   - id, role, `LEFT(password,7)`, `CHAR_LENGTH(password)`, is_active, lifecycle_state, updated_at, is_password_changed, email 마스킹/`SHA2`  
   - `password NOT LIKE '$2%'` count  
   - `updated_at DESC LIMIT 10`  
   - `updated_at >= '2026-09-04 14:00:00'` 카운트/샘플  
   - **agisunny**: `email LIKE '%agisunny%' OR email = 'agisunny@daum.net'` → prefix/length/updated_at + BEFORE/AFTER_OR_EQ 코멘트 (암호화 이메일이면 0행 가능)
4. **nginx access**: `/reset-password` `/api/v1/test` `/api/test` (오늘/7일). 경로만, `newPassword` sed 마스킹.

**해석 주의**: `post-dev-sync-anonymize` 실행 시 password는 KEEP이어도 **전 users `updated_at`이 갱신**되므로, updated_at만으로 가설 B를 확정하지 말 것. journal/nginx 히트와 교차 확인.

### 4. 가설 B 판정 가이드

| 증거 | 판정 |
|------|------|
| journal에 `테스트 사용자 비밀번호 재설정` + 해당 시각 users.updated_at 변화 | **가설 B 유력** |
| nginx에 `/api/v1/test/reset-password` 또는 `/api/test/reset-password` 또는 루트 `/reset-password` 2xx | **호출 사실 확정** |
| journal에 `관리자 권한으로 사용자 비밀번호 초기화`만 | TestData B 약화 → **의도적 관리자 리셋** 쪽 |
| `isDev`/`IS_DEV` 키 없음 + 빈 미로드 + journal/nginx 무히트 | **가설 B 약화** (과거 배포·수동 SQL은 별도) |
| Flyway V2026090\* / #815~#821만으로는 B 불가 | 코드상 이미 **반증** |

테넌트 수정(가설 A) 배포 후에도 동일 계정만 비밀번호 불일치(해시 prefix는 `$2a$`/`$2b$` 정상)이고 journal에 tenant missing이 없으면 → 가설 B를 우선 재검증.

### 5. 가드 제안만 (코드 미적용 — 우선순위는 진단)

안전한 최소 가드 후보(구현은 별도 승인 후):

1. `reset-password` / `delete-user` / `create-test-data`: **`local` 프로파일만** 허용 (`"local".equals(activeProfile)`), `isDev`만으로는 부족.
2. 또는 `.dev`/`prod`에서 `@ConditionalOnProperty`가 절대 true가 되지 않도록 **env에 `isDev` 금지**를 배포 체크리스트에 명시.
3. `findAllByEmail`+`get(0)` 제거 → tenantId 필수 또는 이메일 화이트리스트(테스트 도메인만).
4. 클래스 `@RequestMapping("/api/v1/test")` 복구 여부는 **보안 가드와 함께**만 (경로만 복구하면 위험 증가).

**지금은 진단 보강만. 비밀번호 UPDATE·리셋 API 추가 금지.**

---

## 진단 workflow

GitHub Actions → **Diagnose .dev login BadCredentials (tenant)**  
(`.github/workflows/diagnose-dev-login-badcredentials.yml`)

- `workflow_dispatch` only.
- SSH로 profile/tenant/`isDev` 키 이름, journal(테넌트 + TestData + **관리자 리셋** 패턴, **오늘 00:00 KST + 7일**), Host 지정 더미 login probe, SELECT-only password shape(**agisunny updated_at 포함**), nginx test-API 호출.
- 시크릿·이메일 평문·비밀번호 UPDATE 없음.

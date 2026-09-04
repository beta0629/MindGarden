# .dev 로그인 BadCredentials — 테넌트 컨텍스트 루트코즈

## 증상

- `.dev`에서 로그인만 `BadCredentials` / 자격 증명 오류.
- `duplicate-check/email` 등에서는 동일 이메일이 존재하는 것처럼 보임.
- journal에 `로컬 프로파일에서 테넌트 정보가 없습니다` 가 보일 수 있음.

## 가설 병렬 요약

| 가설 | 상태 | 요약 |
|------|------|------|
| **A** 테넌트 missing → BadCredentials | **코드 확정** (수정 유지) | `isLocalProfile`이 `dev`를 local로 취급 + Host=`localhost` 시 `X-Forwarded-Host` 미사용 → tenant 없음 → `findByEmail` 실패 → BadCredentials |
| **B** TestDataController / 시드가 실비번 덮어씀 | **조사 중** (SSH 증거 필요) | `reset-password`가 `findAllByEmail` → `users.get(0)`에 `setPassword`+save. `isDev=true`면 빈 로드·메서드 가드 통과. Flyway V2026090\*는 password 미수정 |

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

## 대안 가설 B (조사 중): TestDataController / 시드가 비밀번호를 덮어썼는가

### 경고

- **아직 `users.password` UPDATE 하지 말 것.**
- 진단 workflow·SSH는 **SELECT / journal / access log / 키 이름** 만.
- 실계정 이메일을 테스트 API에 넣으면 실비번이 덮일 수 있는 **코드 경로가 존재**한다. 호출 여부는 SSH 증거로만 확정.

### 1. `TestDataController` 근거

| 항목 | 근거 |
|------|------|
| 파일 | `src/main/java/com/coresolution/consultation/controller/TestDataController.java` |
| 빈 활성 조건 | `@ConditionalOnProperty(name = "isDev", havingValue = "true")` |
| 런타임 가드 | 대부분 `if (!isDev && !"local".equals(activeProfile))` → **`isDev=true`이면 profile이 `dev`여도 통과** |
| `isDev` yml SSOT | `application-local.yml`: `isDev: true` / `application-prod.yml`: `isDev: false` / **`application-dev.yml`에는 `isDev` 키 없음** |
| 환경변수 바인딩 | Spring relaxed binding → `IS_DEV` / `isDev` 가 env·`/etc/mindgarden/dev.env`에 있으면 `.dev`에서도 빈 로드 가능 |
| systemd | `config/systemd/mindgarden-dev.service` → `EnvironmentFile=-/etc/mindgarden/dev.env` |

#### 위험 엔드포인트

| 메서드 | 매핑(의도) | 동작 |
|--------|------------|------|
| `resetTestUserPassword` | `POST .../reset-password?email=&newPassword=` | `TenantContext.setBypassTenantFilter(true)` → `userRepository.findAllByEmail(email)` → **`users.get(0)`** → `passwordService.encodeSecret(newPassword)` → `user.setPassword` → `save`. 로그: `테스트 사용자 비밀번호 재설정` |
| `createTestData` | `POST .../create-test-data` | `admin@mindgarden.com` 등 테스트 계정 INSERT (`encodeSecret("admin123")` 등). 기존 실계정 UPDATE는 아님(이메일 충돌 시 예외 가능) |
| `deleteTestUser` | `POST .../delete-user?email=` | `findAllByEmail` → `get(0)` soft-delete |
| `verifyPassword` | `POST .../verify-password` | 테넌트 우회 조회 후 matches (쓰기 없음). 로그: 비밀번호 검증 |

`findAllByEmail` (`UserRepository`, `@Deprecated`): 테넌트 필터 없이 동일 이메일 전 테넌트 목록. **첫 행이 실계정이면 실비번 덮임.**

#### 경로 매핑 주의 (코드 상태)

- 주석/프론트(`AdminDashboard.js`: `/api/v1/test/create-test-data`)·과거 커밋은 `@RequestMapping("/api/v1/test")` (한때 `/api/test` 병행).
- **현재 소스에는 클래스 `@RequestMapping`이 없음** (`f336ab933` 스크립트 리팩터에서 제거된 흔적). 메서드만 `@PostMapping("/reset-password")` 등이면 **루트 경로**에 붙음.
- 과거에 `/api/v1/test`·`/api/test` 로 배포된 빌드가 `.dev`에 남아 있었다면 호출 가능했음. **현재 HEAD vs 서버 JAR 경로 일치 여부도 SSH로 확인.**

#### 메서드 가드 허점

- `createTestConsultant` (`POST /consultant`)는 **메서드 내 `isDev`/`local` 가드가 없음** (빈이 로드되면 가드 없이 등록 시도).
- 빈이 로드되려면 여전히 `isDev=true` 필요.

### 2. 시드·치환·Flyway·온보딩 (password 덮어쓰기 검색)

| 경로 | password 영향 | 판정 |
|------|---------------|------|
| Flyway `V2026090*.sql` (#815~#821 전후: LNB, vehicle_plate, schedule repair 등) | `users.password` / 해당 이메일 UPDATE **없음** | **반증(코드)** — 이번 배포 마이그로는 비번 미변경 |
| `scripts/database/sync/post-dev-sync-anonymize.sql` | name 등만 치환, **password/email KEEP** 명시 | 비번 덮어쓰기 아님 |
| 온보딩 `CreateTenantAdminAccount` (`V20251223_001__...`) | **신규 INSERT** only. 동일 tenant+email 있으면 skip | 기존 실계정 password UPDATE 아님 |
| `OnboardingService` (backend-ops) | 승인 시 `TempPassword123!` 등 **해시 생성 후 프로시저 INSERT** | 신규 테넌트 관리자용. 기존 사용자 UPDATE 경로 아님 |
| E2E 기본 계정 (`agisunny@daum.net` 등, testing skill) | UI 로그인만. **「DB 비밀번호 해시를 기본값으로 덮어쓰지 않는다」** 명시 | 코드상 E2E가 reset-password 호출하지 않음(단, 사람이 TestData API를 쓴 경우는 SSH 필요) |
| `AdminUserController` `PUT .../reset-password` | 관리자 UI 정상 경로 (인증 필요) | 가설 B와 별개 — 의도적 관리자 리셋이면 journal/access에 다른 패턴 |

### 3. 확정/반증에 필요한 SSH 증거 (가설 B)

workflow: `.github/workflows/diagnose-dev-login-badcredentials.yml` (섹션 6~9 추가분).

1. **journalctl** (오늘 + 최근 7일):  
   `테스트 사용자 비밀번호 재설정` / `verify-password` / `create-test-data` / `reset-password` / `TempPassword|임시 비밀번호|비밀번호 변경|setPassword`
2. **`isDev` / `IS_DEV` 키 이름만** (값 redact): systemctl Environment, `/etc/mindgarden/dev.env`, 가능하면 서버의 `application-*.yml` 키 (jar 내부 덤보다 env/yml).
3. **SQL SELECT only** (이메일 평문·해시 전문 금지):  
   - 샘플: id, role, `LEFT(password,7)`, `LENGTH(password)`, is_active, lifecycle_state, updated_at, (`is_password_changed` — `password_changed_at` 컬럼은 엔티티에 없음)  
   - `password NOT LIKE '$2%'` count  
   - 최근 `updated_at DESC LIMIT 10` (email 마스킹: 앞 2자+`***` 또는 `SHA2(email,256)`)  
   - 배포 시각(대략 2026-09-04 14:39 KST) 기준 `updated_at >= '2026-09-04 14:00:00'` 인 users 중 password 관련으로 보이는 행 카운트/샘플
4. **nginx access**:  
   `/var/log/nginx/mindgarden.dev.core-solution.co.kr.access.log`, `api.dev.core-solution.co.kr.access.log`, `dev.core-solution.co.kr.access.log` 등에서  
   `/reset-password` 또는 `/api/v1/test` 또는 `/api/test` (오늘/7일). **경로만**, `newPassword` 쿼리는 sed 마스킹.

### 4. 가설 B 판정 가이드

| 증거 | 판정 |
|------|------|
| journal에 `테스트 사용자 비밀번호 재설정` + 해당 시각 users.updated_at 변화 | **가설 B 유력** |
| nginx에 `/api/v1/test/reset-password` 또는 `/api/test/reset-password` 2xx | **호출 사실 확정** |
| `isDev`/`IS_DEV` 키 없음 + 빈 미로드 + journal/nginx 무히트 | **가설 B 약화** (그래도 과거 배포·수동 SQL은 별도) |
| Flyway V2026090\*만으로는 B 불가 | 코드상 이미 반증 |

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
- SSH로 profile/tenant/`isDev` 키 이름, journal(테넌트 + TestData 패턴), Host 지정 더미 login probe, SELECT-only password shape, nginx test-API 호출.
- 시크릿·이메일 평문·비밀번호 UPDATE 없음.

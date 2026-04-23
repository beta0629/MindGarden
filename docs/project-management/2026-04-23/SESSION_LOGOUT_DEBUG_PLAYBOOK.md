# Phase 1: 「에러 없이 로그아웃 → /login」 디버그 플레이북

**날짜:** 2026-04-23  
**범위:** 콘솔에 눈에 띄는 예외/5xx가 없이 로그인 화면(` /login `)으로 돌아가는 현상의 **재현·관측·가설 정리** (코드 수정 없음, 분석·위임용).  
**연계:** [SESSION_LOGOUT_INVESTIGATION_RUNBOOK.md](./SESSION_LOGOUT_INVESTIGATION_RUNBOOK.md) Phase 0 인벤토리 반영.

---

## 1. 증상 정의

| 관점 | 설명 |
|------|------|
| **사용자 언어** | "알림도 없이 갑자기 로그인 화면이 떴다", "에러 팝업은 없는데 튕겼다", "아무것도 안 건드렸는데 로그아웃된 것 같다" |
| **기술적 동치(가정)** | 브라우저가 ` /login `으로 이동하거나, 보호된 라우트가 비로그인으로 처리되며, **UI에 빨간 에러/500 토스트가 없을 수 있음**. 내부적으로는 `401/403` 응답, `current-user` 실패, 주기/idle 기반 `checkSession` 분기, `redirectToLoginPageOnce`·세션 쿠키 만료, 테넌트/헤더 부재(400) 등이 **콘솔에 '에러'로 눈에 띄지 않고** 흐를 수 있음(※ 단정하지 않음). |

**Phase 0 인벤토리(요지)**  
프론트: `sessionManager.js` → `checkSession` 시 ` /api/v1/auth/current-user` 401이면(공개 경로·`justLoggedIn` 등 제외) `redirectToLoginPageOnce` 호출, ` /api/v1/auth/session-info` 는 idle/표시용 후속. `SessionContext`는 주기적 확인·로그인 시 기존 세션 `logout`, `mg_post_logout` 게이트. `ajax.js`는 401/403 시 `checkSessionAndRedirect`로 `current-user` 재검증 후 실패 시 리다이렉트, 로컬호스트는 분기 있음. `apiHeaders.js` 는 **`window.sessionManager` 를 참조하나, 저장소 전역 `window.sessionManager = …` 대입은 검색상 없음** — 테넌트/세션 보조가 스킵될 수 있어 **런타임 주입·번들 주입 여부**를 DevTools/소스맵에서 별도 확인. 백엔드: `SecurityConfig`, `JwtAuthenticationFilter`, `SessionBasedAuthenticationFilter`, `TenantContextFilter`(tenant 없으면 400), `CustomAuthenticationEntryPoint`, `AuthController`(`current-user` 401, `session-info`, `logout`), `application.yml`의 세션/쿠키 설정.

---

## 2. 재현 시도 시나리오 (역할·상황별 5개)

각 시나리오마다 **시작 URL(테넌트 서브도메인/localhost), 역할(ADMIN/CONSULTANT/CLIENT 등), 직전 조작 1문장**을 기록한다. 성공/실패만이 아니라 **Network 타임라인**을 캡처(PII·토큰 제외, 경로+status만).

1. **장시간 idle (모든 로그인 역할)**  
   로그인 후 문서/대시보드에 두고 **입력·탭 전환 없이** `constants/session` 기준 5~10분 이상(주기 `checkSession`·idle 경고 모달 직전/직후) 경과. idle 모달이 뜨는지, 뜨기 전에 `/login`으로 바뀌는지 기록.

2. **백그라운드 탭 (브라우저 절전·쓰로틀)**  
   탭을 **배경으로 둔 채 30~60분** 후 복귀. 복귀 직후 첫 XHR/페치 5건과 `current-user`·`session-info` 순서를 기록.

3. **API 연속 호출 직후 (관리·목록 화면)**  
   필터/저장/목록 갱신 등으로 **짧은 시간에 요청이 연속**된 뒤 곧바로 idle 또는 다른 화면 전환. 401/403/400(tenant)이 **다른 API에 먼저** 났는지 확인.

4. **멀티탭: 한쪽에서 로그아웃/중복 로그인**  
   동일 계정 **2탭** — 한 탭에서 로그아웃 또는 `duplicateLoginManager`가 개입하는 흐름(제품에 따름). 다른 탭의 `current-user`·리다이렉트 시점.

5. **tenant 서브도메인 전환/불일치**  
   (가능한 환경에서) 북마크·수동 URL로 **다른 서브도메인**으로 이동하거나, 개발·스테이징에서 호스트/헤더 불일치를 의도하지 않고 유발. `400` + 테넌트 관련 메시지(ajax의 TENANT 경로) 후 동작.

---

## 3. 관측 체크리스트 (DevTools)

| 항목 | 관측 방법·기록 |
|------|-----------------|
| **Network — 마지막 5요청** | 시간순·역순으로 **끝에서 5건** URL(경로 중심), **HTTP status**, initiator(선택). 리다이렉트 직전에 `current-user`·`session-info`·`logout` 중 무엇이 있었는지. |
| **Application → Storage** | `localStorage`: `userInfo`·`user`·`accessToken`·`refreshToken` 등 `SESSION_KEYS` 관련 키 **유지/삭제 시점**. `sessionStorage`: `mg_post_logout`, `subdomain_*`, `justLoggedIn` **변화**. |
| **`/api/v1/auth/current-user`** | **직전/직후** status(200/401), 응답이 없는지(빨간 줄은 Network에서 확인). `sessionManager.checkSession` 경로와 `ajax`의 verify 경로 **둘 다** 나올 수 있음. |
| **`/api/v1/auth/session-info`** | `checkSession` 성공 분기 뒤 호출 타이밍(차단·CORS·401 여부). idle 모달·남은 시간과의 상관(정성). |
| **Console** | `console.error` 대신 `console.log`/`console.warn`만 보일 수 있음(🔍/🔐 등). **빨간 스택** 없이 `redirectToLoginPageOnce` 류 메시지가 있는지. |

**로컬(`localhost`/`127.0.0.1`)**  
`ajax.js`의 401 2차 확인·`sessionManager`의 401 리다이렉트는 **환경/플래그에 따라 스킵**될 수 있으므로, 재현은 **스테이징·서브도메인과 동일 조건**에서 한 번 더 시도한다.

---

## 4. 가설 ↔ 증거 매핑 (단정 금지)

| ID | 가설(요지) | 찾을 만한 증거(관측) | 반례·주의 |
|----|-------------|----------------------|-----------|
| **P1** | 액세스/리프레시·쿠키 `JSESSIONID` 만료·무효로 API가 401 | `current-user` 401, 직전 API 401/403, `localStorage` 토큰 정리( `sessionRedirect` ) | 401이 콘솔에 "에러"로 안 보일 수 있음 |
| **P2** | **idle**·`session-info`·주기 `checkSession`(5분/10분)·활동 ping(90초) 상호작용으로 세션 만료 또는 클라이언트만 로그아웃 처리 | idle 모달 직전 이동, `session-info`·`checkSession` 호출 패턴, `SessionIdleWarningModal` | 서버/클라 타이밍 어긋남만으로도 착시 가능 |
| **P3** | **401 한 번**이 `ajax`/`checkSession`에서 **연쇀 리다이렉트** (전역 401 핸들링) | 동일 시각에 여러 API 401, 그 직후 `current-user` 실패, `redirectToLoginPageOnce` 1회 | 중복 클릭·중복 fetch와 구분 |
| **P4** | **멀티탭**·`duplicateLoginManager`·한쪽 `logout`이 다른 탭 세션에 영향 | 한 탭 `logout`·다른 탭 `current-user` 401, Storage 동시 비움 | 탭마다 쿠키는 공유·스토리지는 다를 수 있음 |
| **P5** | **tenant 헤더/서브도메인** 누락·불일치 → 400 + ajax 메시지 → 로그인 유도 | 400, TENANT/사용자 메시지(ajax 상수), 호스트·`subdomain_tenant_id` | 사용자에게 "에러 없음"으로 느껴질 수 있음 |
| **P6** | **백엔드 401/인증 필터**만 발생하고 UI는 토스트 없음 | 서버 로그(상관 ID) `Unauthorized`, `JwtAuthenticationFilter` 직전 요청 | 프록시/타임아웃과 구분하려면 서버 측 로그 필요 |
| **P7** | **모바일/태블릿**·`SessionBasedAuthenticationFilter` 쿠키 파싱 이슈 | Cookie에 세션·모바일 전용 흐름, User-Agent, 동일 계정 **태블릿 로그인** 경로 | 데스크톱만 재현되면 P7 우선순위 낮춤 |
| **갭(P0)** | `window.sessionManager` **미할당** → `apiHeaders`·`consultantHelper`·`ConsultantDashboardV2` 등에서 **의도한 tenant/refresh 누락** | `window.sessionManager` in console → `false`/undefined, 헤더에 tenantId 누락(Network Request Headers) | 대시보드는 import `sessionManager` 쓰는 코드도 있어 **화면마다 다름** |

---

## 5. core-coder에 넘길 때만 — 추가 로그·상관 ID 제안 (파일 경로만)

패치 본문은 여기에 적지 않는다. **필요 시** 아래 후보에 **짧은 구조화 로그**(이유코드, 요청 ID, 마스킹 tenant) 추가를 요청한다.

- `frontend/src/utils/sessionManager.js` — `checkSession` 401/리다이렉트 직전, `logout` / `setPostLogoutGateBeforeRedirect` / `consumePostLogoutGate`
- `frontend/src/utils/ajax.js` — `checkSessionAndRedirect` 내부, `current-user` 재시도 루프
- `frontend/src/utils/apiHeaders.js` — `forceRefresh`·`window.sessionManager` 미존재 시 **1회 warn**(과다 로그 방지 가드와 함께)
- `frontend/src/utils/sessionRedirect.js` — `redirectToLoginPageOnce` 호출 시 **reason** 쿼리(제품 합의 후)
- `frontend/src/contexts/SessionContext.js` — 주기 `checkSession`, 로그인 시 기존 세션 `logout` 분기
- `src/main/java/.../SecurityConfig.java`, `JwtAuthenticationFilter.java`, `SessionBasedAuthenticationFilter.java`, `TenantContextFilter.java` — 401/400/거부 **요청 ID·마스킹 식별자** 로그(백엔드 로깅 표준 준수)
- `src/main/java/.../AuthController.java` — `current-user`, `session-info`, `logout` 응답 직전(민감 필드 제외)

---

## 6. core-tester용 E2E 후보 (1~3줄)

- **E1:** idle 타이머/모의 — 실제 60분 대기는 비용 큼; **Playwright**에서 타이머·API 목(mock)으로 `checkSession` 주기·idle 경로를 **중간 난이도**로 검증(환경·플로크에 따라 flaky 가능).
- **E2:** `401` → `current-user` 재확인 → `/login` **순서**를 Network assertions로 **중~상 난이도**(타이밍·병렬 요청).
- **E3:** 멀티 컨텍스트(2탭) 로그아웃 전파 **상 난이도**(브라우저·세션 쿠키 공유 전제).

---

## core-coder 위임용 체크리스트 (수정 후)

- [ ] 동일 시나리오(§2에서 재현됐던 것)로 **Network 5건 + Storage + `current-user`** 재홀인
- [ ] 서브도메인·로컬 **양쪽**에서 `redirect` 조건이 의도대로인지(개발용 스킵 포함)
- [ ] `window.sessionManager` **필요 시 단일 주입** 또는 `apiHeaders`를 import 기반으로 통일했는지(§4 P0 갭)
- [ ] 백엔드 로그에 **상관 ID**로 401/400이 추적되는지(§5)
- [ ] **core-tester** E2E/스모크 통과(프로젝트 위임 순서)

---

**문서 위치:** `docs/project-management/2026-04-23/SESSION_LOGOUT_DEBUG_PLAYBOOK.md`

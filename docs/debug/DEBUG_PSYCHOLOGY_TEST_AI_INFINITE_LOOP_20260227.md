# 심리검사 AI 메뉴 무한 루프 및 로그인 리다이렉트 원인 분석

**작성일**: 2026-02-27  
**분석 범위**: 라우트·컴포넌트 추적, 무한 루프 가능 원인, 로그인 리다이렉트 경로  
**역할**: core-debugger (코드 수정 없음, 수정 제안만)

---

## 1. 라우트·컴포넌트 추적

### 1.1 URL 및 컴포넌트 매핑

| 구분 | 값 |
|------|-----|
| **메뉴 표시명** | 심리검사 리포트(AI) |
| **URL** | `/admin/psych-assessments` |
| **라우트 정의** | `App.js` 489행: `<Route path="/admin/psych-assessments" element={<PsychAssessmentManagement user={user} />} />` |
| **페이지 컴포넌트** | `PsychAssessmentManagement` (`frontend/src/components/admin/PsychAssessmentManagement.js`) |
| **실제 콘텐츠** | `PsychAssessmentAdminWidget` (위젯을 페이지에서 재사용) |

- **라우트 보호**: `/admin/psych-assessments`는 **ProtectedRoute로 감싸져 있지 않음**. 전체 앱이 `SessionGuard` 안에 있으므로, 이 경로만 별도 인증 가드는 없음.
- **진입 경로**: 관리자 대시보드·LNB에서 `ADMIN_ROUTES.PSYCH_ASSESSMENTS` (`/admin/psych-assessments`)로 `navigate()` 호출.

### 1.2 마운트 시 동작

**PsychAssessmentManagement**

- `useSession()`으로 `user` 사용, `propUser || sessionUser`.
- **useEffect 없음.** 권한만 체크: `RoleUtils.isAdmin(user) || RoleUtils.hasRole(user, 'HQ_MASTER')` 아니면 "접근 권한이 없습니다" + `ComingSoon` 반환.
- 권한 있으면 `AdminCommonLayout` + `PsychAssessmentAdminWidget` 렌더.

**AdminCommonLayout**

- **useEffect 1회**: `getLnbMenus()` 호출 (LNB 메뉴 API). 실패 시 `DEFAULT_MENU_ITEMS` 사용. 의존성 `[]`.
- `getLnbMenus`는 **axios** 사용 (`menuApi.js`). 401 시 axios 전역 리다이렉트는 없음; throw 후 catch에서 폴백 메뉴만 설정.

**PsychAssessmentAdminWidget**

- **useWidget** 사용: `useWidget(widgetWithDataSource.config, user, { immediate: true, cache: false, retryCount: 2 })`.
- `immediate: true`이므로 마운트 시 곧바로 **multi-api** 로드:
  - `GET /api/v1/assessments/psych/stats`
  - `GET /api/v1/assessments/psych/documents/recent`
- 위 두 요청은 **ajax.js의 apiGet (fetch)** 사용 → 401/403 시 `checkSessionAndRedirect` → 필요 시 **로그인 페이지로 리다이렉트**.

**인증 체크·리다이렉트**

- **App.js (AppContent)**  
  - `useEffect`에서 공개 경로가 아니면 `checkSession()` 호출. 의존성: `[location.pathname, checkSession]`. `checkSession`은 SessionContext에서 `useCallback(..., [])`로 고정.
- **SessionGuard**  
  - `useEffect` 의존성: `[location.pathname, checkSession]` (의도적으로 `user` 제외).  
  - 공개 경로가 아니고 `lastPathRef.current !== currentPath`일 때만 100ms 후 `checkSession(false)` 실행.  
  - 콜백 안에서 `user`(클로저)로 `tenantId` 검사. 비정상/미설정이면 `checkSession(true)` 호출.  
  - **리다이렉트 컴포넌트는 없음.** 로그인으로 보내는 것은 **sessionManager.checkSession()** 내부에서 401 시 `window.location.href = .../login` 하는 부분.

---

## 2. 무한 루프 가능 원인

### 2.1 useEffect 의존성으로 인한 반복 실행

- **PsychAssessmentManagement / PsychAssessmentAdminWidget**: 마운트 시 한 번만 도는 useEffect에 **상태를 바꿔서 매 렌더마다 effect가 다시 도는 패턴은 없음**.
- **useWidget** (`frontend/src/hooks/useWidget.js`):
  - 초기 로드 effect 의존성: `[immediate, type, config.defaultValue, loadData]`.
  - `loadData`는 `useCallback`으로, `getCacheKey` 등에 묶여 있고 `getCacheKey`는 `user?.id`에 의존. **user 참조가 바뀌면** `loadData`가 바뀌어 effect가 다시 실행될 수 있음.
  - 단, 401 시 useWidget은 재시도하지 않고 종료(`isClientError` 분기). 따라서 **401 자체가 retryAttempt를 올리며 loadData를 반복 호출하는 구조는 아님**.

### 2.2 인증 체크·세션 갱신과의 상호작용

- **동시 다발 요청**:  
  - `/admin/psych-assessments` 진입 시 **AppContent**의 `checkSession()`과 **SessionGuard**의 `checkSession(false)` (및 필요 시 `checkSession(true)`)가 **같은 pathname 변경 한 번에** 둘 다 실행될 수 있음.
- **SessionGuard**:
  - `user`를 의존성에서 뺀 이유가 “무한 루프 방지”이므로, **세션 갱신으로 user가 바뀌어도** SessionGuard effect는 pathname이 같으면 `lastPathRef.current === currentPath`로 더 이상 돌지 않음.
  - 다만 **tenantId가 비정상일 때** `checkSession(true)`를 호출하고, 이때 **sessionManager.checkSession(force)** 가 `/api/v1/auth/current-user`를 호출. 여기서 **401**이 나면 sessionManager가 **즉시 `window.location.href = .../login`** 실행.
- **위젯 API 401**:
  - useWidget이 호출하는 **apiGet** 두 개(stats, documents/recent)가 **401**을 받으면 **ajax.js**의 `checkSessionAndRedirect`가 실행되고, 그 안에서 다시 **current-user**를 호출. 실패 시 **같이 로그인으로 리다이렉트**.

즉, “무한 루프”는 **React 상태 의존성 루프**보다는 아래 조합 가능성이 큼:

1. **동시에 여러 401 발생**  
   (위젯 2개 API + getLnbMenus 또는 current-user) → 리다이렉트 로직이 **여러 번** 돌거나, 리다이렉트 전에 **여러 번 재렌더/재요청**이 겹쳐 “도는 것처럼” 보일 수 있음.
2. **tenantId 검사 → checkSession(true) → current-user 401**  
   → SessionGuard가 강제 갱신을 시도했다가 401 받고 리다이렉트.
3. **세션은 유효한데 Psych API만 401**  
   (예: 백엔드에서 해당 경로/권한만 401 반환) → 위젯의 apiGet 401 → checkSessionAndRedirect → current-user까지 가서 최종 리다이렉트.

### 2.3 라우터 구조

- `/admin/psych-assessments`는 단일 Route이며, 같은 경로로 되돌아오는 **순환 리다이렉트** 구조는 없음.
- **ProtectedRoute**는 이 경로에 적용되지 않으므로, “비로그인 시 Navigate to /login”에 의한 반복 리다이렉트 가능성은 없음.

---

## 3. 로그인으로 나가는 경로

### 3.1 실행 위치별 정리

| 위치 | 조건 | 동작 |
|------|------|------|
| **ajax.js** | apiGet 등에서 **401/403** 수신 시 | `checkSessionAndRedirect(response)` → current-user 재확인 후 실패 시 `window.location.href = origin + '/login'` |
| **ajax.js** | **400** + 메시지에 tenant/로그인 관련 문구 | TENANT_ID 등으로 판단 후 동일하게 `window.location.href = .../login` |
| **ajax.js** | **Failed to fetch** (네트워크 오류) + 비공개 경로 | 동일 리다이렉트 (localhost 제외) |
| **sessionManager.js** | **checkSession()** 중 **current-user 401** | `window.location.href = .../login` (공개 경로·로컬·justLoggedIn 제외) |
| **ProtectedRoute** | `!user` (세션 체크 후) | `<Navigate to="/login" replace />` (단, 이 경로는 psych-assessments에 미적용) |

### 3.2 심리검사 AI 페이지와의 관계

- **직접적인 리다이렉트**:  
  - **useWidget**이 호출하는 **apiGet** (`/api/v1/assessments/psych/stats`, `/api/v1/assessments/psych/documents/recent`)에서 **401**이 나면 → ajax 쪽에서 current-user 확인 후 로그인으로 이동.
  - **SessionGuard**에서 tenantId 문제로 **checkSession(true)** → **sessionManager**가 current-user 401 받으면 → 로그인으로 이동.
- **axios (getLnbMenus)**  
  - 401이 나도 현재 코드에는 **전역 401 → 로그인** 처리 없음. 에러 throw 후 AdminCommonLayout catch에서 폴백 메뉴만 적용.

### 3.3 백엔드 (참고)

- **PsychAssessmentController** (`/api/v1/assessments/psych/*`):
  - 모든 메서드에 `@PreAuthorize("isAuthenticated()")`.
  - `stats()`, `recentDocuments()` 등에서 `TenantContextHolder.getRequiredTenantId()` 사용.
  - **tenantId가 없으면** `IllegalStateException("Tenant ID is not set in current context")` → GlobalExceptionHandler에서 **RuntimeException**으로 500 반환.  
  - 500은 ajax에서 **로그인 리다이렉트 유발하지 않음**.  
  - 따라서 **로그인 페이지로 가는 직접 원인은 401(또는 400 tenant 관련)** 이다.

---

## 4. 원인 분석 요약

- **직접 원인(가설)**  
  1. **심리검사 API(stats / documents/recent)에서 401 반환**  
     → useWidget → apiGet → checkSessionAndRedirect → current-user 실패 시 로그인 리다이렉트.  
  2. **SessionGuard의 tenantId 검사**  
     → 비정상 tenantId로 `checkSession(true)` 호출 → current-user 401 → sessionManager가 로그인으로 리다이렉트.  
  3. **동시 다발 요청**  
     → path 변경 한 번에 App + SessionGuard의 checkSession + 위젯 2개 API(+ LNB)가 겹치면서, 401과 리다이렉트가 짧은 시간에 여러 번 시도되어 “무한 루프처럼” 보일 수 있음.

- **무한 루프처럼 보이는 이유**  
  - React 의존성으로 인한 **진짜 무한 effect 루프**는 찾기 어렵고,  
  - **여러 401 + 여러 리다이렉트 시도 + 로딩/재렌더**가 겹쳐서, 화면이 계속 도는 것처럼 보이다가 결국 로그인으로 나가는 상황에 가깝다.

---

## 5. 재현 절차

1. **관리자(또는 HQ_MASTER) 계정**으로 로그인.
2. **(선택)** 서브도메인/비로컬 환경에서 재현 시, tenantId가 비정상(unknown/default 등)인 계정이면 SessionGuard가 강제 갱신을 시도할 수 있음.
3. **심리검사 AI** 메뉴 클릭 (또는 직접 `/admin/psych-assessments` 이동).
4. **관찰**:
   - Network 탭에서 **401**이 나는 요청 확인:  
     `GET /api/v1/assessments/psych/stats`,  
     `GET /api/v1/assessments/psych/documents/recent`,  
     `GET /api/v1/auth/current-user`,  
     (선택) `GET .../menus/lnb`.
   - Console에서 **SessionGuard / 세션 체크 / tenantId** 관련 로그 확인.
5. **결과**: 짧은 시간 동안 로딩·재시도처럼 보이다가 **로그인 페이지**로 이동.

---

## 6. 수정 제안 (체크리스트) — core-coder 위임용

- 아래는 **코드 수정은 하지 않고** 제안만 정리한 항목이다. 실제 수정은 **core-coder**에 위임.

### 6.1 확인·로그

- [ ] **브라우저 Network**: `/admin/psych-assessments` 접속 시 **어느 URL이 401을 반환하는지** 확인 (psych/stats, psych/documents/recent, auth/current-user, menus/lnb 등).
- [ ] **백엔드 로그**: 해당 요청에서 **인증 실패(401)** 또는 **Tenant ID is not set** 등 예외 로그가 있는지 확인.

### 6.2 프론트엔드

- [ ] **SessionGuard**  
  - tenantId가 비정상일 때 **무조건 checkSession(true)** 하지 않도록,  
    “같은 path에서 이미 한 번 실패했으면 재시도 안 함” 같은 **플래그/ref**로 중복 호출 완화 검토.
- [ ] **ajax.js**  
  - 401 시 **리다이렉트 전에** “이미 리다이렉트 예약됨” 플래그를 두어, **여러 API가 동시에 401**일 때 **한 번만** `window.location.href` 하도록 정리.
- [ ] **useWidget**  
  - 401/403 시 **재시도/반복 호출**이 일어나지 않았는지 확인(이미 클라이언트 에러 시 재시도 안 함으로 되어 있음).  
  - 필요 시 **해당 경로(/admin/psych-assessments)** 에서만 **immediate**를 늦추거나, **한 번 실패 시** 같은 세션에서는 반복 호출을 막는 옵션 검토.

### 6.3 백엔드

- [ ] **PsychAssessmentController**  
  - `TenantContextHolder.getRequiredTenantId()` 호출 전에 **세션/필터에서 tenantId가 설정되는지** 확인.  
  - tenantId 미설정 시 **500 대신 401 또는 400**을 내도록 하면, 프론트의 “401 → 로그인” 동작과 일치시킬 수 있음 (의도에 따라 선택).
- [ ] **세션/인증 필터**  
  - `/api/v1/assessments/psych/*` 요청에 대해 **TenantContextHolder**에 tenantId가 설정되는지 확인.  
  - 미설정이면 원인 수정(필터 순서, 세션에서 tenantId 추출 등).

### 6.4 권한·메뉴

- [ ] **LNB 메뉴 API** (`/api/v1/menus/lnb`)  
  - 해당 메뉴(심리검사 AI)가 **역할/권한**에 따라 401을 반환하는지 확인.  
  - 401이면 axios 사용처에 **401 시 리다이렉트하지 않고** 폴백만 쓰도록 이미 되어 있는지 재확인.

---

## 7. core-coder용 태스크 설명 초안

- **목표**: 심리검사 AI 메뉴(`/admin/psych-assessments`) 접근 시 무한 루프처럼 보이다가 로그인으로 나가는 문제 제거.
- **방향**:
  1. Network/로그로 **401을 반환하는 API**를 특정한 뒤,  
     - 해당 API가 **인증/tenantId**를 올바르게 받도록 백엔드 수정하거나,  
     - 프론트에서 해당 API 401 시 **즉시 로그인 리다이렉트** 대신 **에러 메시지/재시도 한 번** 등으로 처리할지 결정.
  2. **동시 401**에 의해 리다이렉트가 여러 번 시도되지 않도록, **ajax.js** 또는 공통 처리에서 **한 번만** 로그인으로 보내도록 수정.
  3. **SessionGuard**에서 tenantId 검사 후 `checkSession(true)` 호출이 **같은 페이지에서 반복**되지 않도록 제한.
- **참고 문서**: `docs/debug/DEBUG_PSYCHOLOGY_TEST_AI_INFINITE_LOOP_20260227.md` (본 문서).

---

**문서 끝.**

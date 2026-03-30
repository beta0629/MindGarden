# 테넌트 프로필 페이지 접근 오류 — 기획 주관 오케스트레이션

**문서 버전**: 1.0.0  
**작성일**: 2026-03-21  
**주관**: 기획 (core-planner)  
**상태**: core-debugger 1차 확정 완료  

---

## 1. 범위·증상

- **메뉴/경로**: LNB 설정 > 테넌트 프로필 → `/tenant/profile` (및 `/tenant/settings`)
- **화면**: `frontend/src/components/tenant/TenantProfile.js`
- **사용자 표기**: 테넌트 프로필 접근 시 오류 발생 (콘솔 런타임 예외, API 4xx/5xx, React #130, 빈 화면 등 — 현장 증상은 **core-debugger**가 캡처해 §5에 기입)

---

## 2. 현황 파악 (기획 정리)

### 2.1 관련 경로·컴포넌트

| 구분 | 경로/파일 | 비고 |
|------|-----------|------|
| 라우트 | `/tenant/profile`, `/tenant/settings` | 둘 다 `TenantProfile` 컴포넌트 사용 |
| 컴포넌트 | `frontend/src/components/tenant/TenantProfile.js` | AdminCommonLayout, SafeText, StatusBadge 사용 |
| API | `GET /api/v1/auth/tenant/current` | 테넌트 정보 (fetch, credentials: 'include') |
| API | `getSubscriptions(tenantId)`, `getPaymentMethods(tenantId)` | billingService (apiGet → credentials 포함) |
| LNB 메뉴 | `ADM_SETTINGS_TENANT` → `/tenant/profile` | `docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md` |

### 2.2 라우트 보호

- `/tenant/profile`는 **ProtectedRoute 미적용** (App.js 455행)
- TenantProfile 내부에서 `useSession`으로 `isLoggedIn`, `user`, `tenantId` 검사 후 `/login` 또는 `/dashboard`로 리다이렉트

### 2.3 의존 컴포넌트·서비스

- `AdminCommonLayout`, `UnifiedLoading`, `StatusBadge`, `SafeText`, `toDisplayString` (safeDisplay)
- `PaymentMethodRegistration`, `SubscriptionManagement` (탭별)
- `getPaymentMethods`, `getSubscriptions` (billingService.js)
- SessionContext (`user`, `sessionInfo`, `tenantId`)

---

## 3. 기획 판단 — 가능 원인 (우선순위)

코드·백엔드 정적 분석 결과, 아래 순으로 **의심도가 높음**. **실제 원인은 core-debugger가 재현·스택·로그로 확정**한다.

| 순위 | 가설 | 근거 | 확인 방법 |
|------|------|------|-----------|
| **P0** | **`/api/v1/auth/tenant/current` 4xx/5xx 또는 응답 형식 불일치** | `loadTenantInfo`에서 `data.success && data.tenant` 가정. 성공이 아니거나 tenant 누락 시 `tenantInfo` null → 에러 UI 표시 또는 이후 로직 실패. | 네트워크 탭: `/api/v1/auth/tenant/current` 상태 코드·응답 바디. 백엔드 `MultiTenantController` 로그. |
| **P1** | **세션/테넌트 컨텍스트 미설정(tenantId 없음)** | `tenantId = sessionInfo?.tenantId || user?.tenantId` 없으면 대시보드 리다이렉트. 단, 세션 로딩 타이밍에 따라 일시적 undefined로 인한 예외 가능. | 콘솔 `🔐 인증되지 않은 사용자` / `⚠️ 테넌트 ID 없음` 로그. 리다이렉트 전 크래시 여부. |
| **P2** | **구독/결제 수단 API 실패·응답 형식** | `getSubscriptions`, `getPaymentMethods`가 `response.data` 배열 가정. 비표준 응답 시 `subscriptions.map`, `paymentMethods.map`에서 예외. | billing API `/api/v1/billing/subscriptions`, `/api/v1/billing/payment-methods` 응답 형식. |
| **P3** | **React #130 (객체를 자식으로 렌더)** | `subscription.amount.toLocaleString()` — `amount`가 객체일 때 `.toLocaleString` 없음 → TypeError. 일부 필드가 객체로 오면 SafeText 외부 경로에서 #130 가능. | `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` 기준. API 응답의 `amount`, `planName`, `status` 타입 확인. |
| **P4** | **ProtectedRoute 미적용으로 인한 접근·초기화 순서** | 인증 전 컴포넌트 마운트 → `useSession` 로딩 중 race로 인한 예외. | 미로그인·역할별 접근 시 동작. ACCOUNT_MANAGEMENT 패턴 참고. |
| **P5** | **AdminCommonLayout·DEFAULT_MENU_ITEMS 의존성** | 레이아웃 내부에서 `menuItems` 등 필수 prop 미전달 시 오류. | 레이아웃 마운트 시점 스택 확인. |

---

## 4. 서브에이전트 분배 (수정·검증)

### 4.1 core-debugger (1차, **필수**)

**의뢰 사항**

- [ ] 브라우저: `/tenant/profile` 접근 재현, **콘솔 스택트레이스·네트워크 탭(HAR 또는 요청/응답)** 정리.
- [ ] `/api/v1/auth/tenant/current` — 상태 코드·응답 바디 기록.
- [ ] `/api/v1/billing/subscriptions?tenantId=...`, `/api/v1/billing/payment-methods?tenantId=...` — 상태 코드·응답 바디(형식) 기록.
- [ ] 서버 로그: 동일 시각의 스택트레이스·예외 메시지 유무.
- [ ] React DevTools·소스맵: #130 발생 시 **문제의 컴포넌트·라인** 후보 기록.

**산출물**: 이 문서 **§5 이슈 확정 표** 채움 → core-coder에게 전달.

**전달할 프롬프트 초안**  
> 테넌트 프로필 페이지(`/tenant/profile`) 접근 시 발생하는 오류를 조사해 주세요.  
> - 재현: 로그인 후 LNB 설정 > 테넌트 프로필 클릭 또는 직접 `/tenant/profile` 접근  
> - 확인: 브라우저 콘솔 스택, 네트워크 탭 `/api/v1/auth/tenant/current`, billing API 응답  
> - 산출: `docs/project-management/TENANT_PROFILE_ACCESS_ERROR_ORCHESTRATION.md` §5 이슈 확정 표 기입  
> - 참조: §2 현황 파악, §3 기획 판단 가설, `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`

---

### 4.2 core-coder (2차, **디버거 확정 후에만**)

**전제**: core-debugger가 P0~P5 중 확정 원인을 보고한 뒤에만 수정. **임의 수정 금지.**

**예상 수정 방향 (확정 시)**

- [ ] `TenantProfile.js`: API 응답 가드 — `Array.isArray`(구독/결제 수단), `data.success && data.tenant` 실패 시 사용자 메시지 정리.
- [ ] `subscription.amount` 등 수치·객체 필드: `toSafeNumber`/`toDisplayString` 적용 (`COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` §1 (C) 규칙).
- [ ] (정책 합의 시) `/tenant/profile`에 `ProtectedRoute` 적용 — `USER_ROLES.ADMIN`, `USER_ROLES.STAFF` 등. ACCOUNT_MANAGEMENT 패턴 참고.
- [ ] `loadTenantInfo` 실패 시 `tenantInfo` null 유지·에러 UI 개선.

**산출물**: PR 링크, 변경 파일 목록.

---

### 4.3 core-tester (3차)

- [ ] ADMIN/STAFF: 테넌트 프로필 접근, 개요·구독 관리·결제 수단 탭 스모크.
- [ ] CLIENT 등 비허용 역할: 접근 시 리다이렉트 또는 403 동작 확인(정책 확정 후).
- [ ] 회귀: billing 연동(SubscriptionManagement, PaymentMethodRegistration) 동작 확인.

---

## 5. 이슈 확정 표 (core-debugger가 기입)

| 항목 | 내용 |
|------|------|
| 확정 원인 코드 | **P0** — `/api/v1/auth/tenant/current` **응답 형식 불일치**. TenantProfile이 `fetch`로 호출 후 `data.tenant`를 기대하나, 표준 ApiResponse는 `data.data.tenant` 구조. |
| HTTP 증거 | API 200 OK 정상. 응답 바디: `{ success: true, data: { tenant: {...}, message?: "..." } }`. `data.tenant`는 undefined → tenantInfo 미설정 → "테넌트 정보를 찾을 수 없습니다" 표시. |
| 스택 트레이스 요약 | 런타임 예외 없음. 정적 분석으로 확정. `loadTenantInfo` 89행 `if (data.success && data.tenant)` 조건 실패 → setTenantInfo 미호출 → 215행 `if (!tenantInfo)` 분기 진입. |
| 조치 PR | *(core-coder 수정 후 링크)* |

### 5.1 보조 이슈 (선택 수정)

| 항목 | 내용 |
|------|------|
| **P3 (React #130)** | 304행 `subscription.amount.toLocaleString()` — `amount`가 객체(`{ value, currency }` 등)일 경우 TypeError. `toSafeNumber`/`toDisplayString` 적용 권장. |
| **API 호출 일관성** | `loadTenantInfo`가 `fetch` 대신 `apiGet`(또는 StandardizedApi) 사용 시 자동 언래핑으로 `response.tenant` 사용 가능. DashboardFormModal과 동일 패턴. |

### 5.2 권장 수정 요약 (core-coder 전달)

| 우선순위 | 파일 | 수정 내용 |
|----------|------|-----------|
| **P0** | `frontend/src/components/tenant/TenantProfile.js` | `loadTenantInfo`(76~98행): `fetch` → `apiGet`로 변경하고 `response.tenant` 사용, 또는 `data.data?.tenant` 경로로 tenant 추출. `data.success && (data.data?.tenant ?? data.tenant)` 형태로 이중 방어. |
| P3 | `frontend/src/components/tenant/TenantProfile.js` | 304행: `subscription.amount.toLocaleString()` → `toSafeNumber(subscription.amount, 0)` 또는 `Number(subscription?.amount?.value ?? subscription?.amount ?? 0)` 후 `toLocaleString()`. `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md` (C) 규칙 준수. |

**core-coder에게 넘길 파일 목록**

- `frontend/src/components/tenant/TenantProfile.js`

**참조 문서**

- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
- `frontend/src/utils/ajax.js` (apiGet 언래핑 로직)
- `frontend/src/components/admin/DashboardFormModal.js` (91행 tenant API 사용 패턴)

---

## 6. SSOT·연관 문서

- 라우트·LNB: `docs/standards/GNB_LNB_LINK_AUDIT_GUIDE.md`, `docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`
- 표시 경계·React #130: `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
- 배치·위임: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- 유사 오케스트레이션: `docs/project-management/ACCOUNT_MANAGEMENT_MENU_ERROR_ORCHESTRATION.md`, `docs/project-management/ERP_ADMIN_DASHBOARD_REACT_ERROR_130_ORCHESTRATION.md`
- DB 메뉴 시드: `src/main/resources/db/migration/V20260225_001__lnb_menu_structure.sql` (`ADM_SETTINGS_TENANT` → `/tenant/profile`)

---

## 7. 실행 요청문

**다음 순서로 서브에이전트를 호출해 주세요.**

1. **Phase 1 (core-debugger)**  
   - subagent_type: `core-debugger`  
   - 전달 프롬프트: 위 §4.1 "전달할 프롬프트 초안" + `docs/project-management/TENANT_PROFILE_ACCESS_ERROR_ORCHESTRATION.md` 참조  
   - 산출: §5 이슈 확정 표 작성

2. **Phase 2 (core-coder)** — **Phase 1 완료(원인 확정) 후**  
   - subagent_type: `core-coder`  
   - 전달: core-debugger 산출물(§5) + §4.2 예상 수정 방향  
   - 참조: `docs/standards/`, `/core-solution-frontend`, `COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`

3. **Phase 3 (core-tester)** — **Phase 2 완료 후**  
   - subagent_type: `core-tester`  
   - 전달: §4.3 체크리스트, 변경 파일 범위

---

## 8. 변경 이력

| 버전 | 일자 | 내용 |
|------|------|------|
| 1.0.0 | 2026-03-21 | 초안: 현황 파악·가설·분배실행 표·core-debugger 의뢰 |

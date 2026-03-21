# PG 설정 페이지 접근 오류 — 기획 주관 오케스트레이션

**문서 버전**: 1.1.0  
**작성일**: 2026-03-21  
**주관**: 기획 (core-planner)  
**상태**: core-debugger 확정 완료 → core-coder 수정 대기  

---

## 1. 범위·증상

- **메뉴/경로**: LNB 설정 > PG 설정 → DB 메뉴 `menu_path`: `/tenant/pg-configuration` (단수)
- **실제 화면 경로**: 컴포넌트 내부 내비게이션은 `/tenant/pg-configurations` (복수), 상세·등록·수정: `/tenant/pg-configurations/new`, `/tenant/pg-configurations/:id`, `/tenant/pg-configurations/:id/edit`
- **화면 컴포넌트**: `PgConfigurationList.js`, `PgConfigurationDetail.js`, `PgConfigurationCreate.js`, `PgConfigurationEdit.js`, `PgConfigurationForm.js`
- **사용자 표기**: PG 설정 페이지 접근 시 오류 발생 (404, 빈 화면, API 4xx/5xx, 콘솔 런타임 예외, React #130 등 — 현장 증상은 **core-debugger**가 캡처해 §5에 기입)

---

## 2. 현황 파악 (기획 정리)

### 2.1 관련 경로·컴포넌트

| 구분 | 경로/파일 | 비고 |
|------|-----------|------|
| LNB 메뉴 (DB) | `ADM_SETTINGS_PG` → `/tenant/pg-configuration` | `V20260225_001__lnb_menu_structure.sql` |
| 라우트 (App.js) | **미등록** | `/tenant/profile`, `/tenant/settings`만 존재. **PG 설정 라우트 전부 없음** |
| 목록 | `/tenant/pg-configurations` | `PgConfigurationList.js` |
| 등록 | `/tenant/pg-configurations/new` | `PgConfigurationCreate.js` |
| 상세 | `/tenant/pg-configurations/:id` | `PgConfigurationDetail.js` |
| 수정 | `/tenant/pg-configurations/:id/edit` | `PgConfigurationEdit.js` |
| API | `GET/POST/PUT/DELETE /api/v1/tenants/{tenantId}/pg-configurations` | 백엔드 `TenantPgConfigurationController` |

### 2.2 경로·API 불일치 (정적 분석)

| 구분 | 현황 | 기대 |
|------|------|------|
| **라우트** | App.js에 PG 설정 관련 라우트 **없음** | `/tenant/pg-configurations` 등 최소 4개 라우트 등록 필요 |
| **LNB 경로** | DB: `/tenant/pg-configuration` (단수) | 컴포넌트·내비게이션: `/tenant/pg-configurations` (복수). **리다이렉트 또는 DB 메뉴 경로 수정** 필요 |
| **pgApi URL** | `GET /api/v1/tenants/pg-configurations/{tenantId}` | 백엔드: `GET /api/v1/tenants/{tenantId}/pg-configurations`. **경로 세그먼트 순서 반대** |

### 2.3 pgApi 경로 오류 상세

`frontend/src/utils/pgApi.js` 기준:

| 함수 | 현재 호출 경로 | 백엔드 기대 경로 |
|------|----------------|------------------|
| getPgConfigurations | `/api/v1/tenants/pg-configurations/{tenantId}` | `/api/v1/tenants/{tenantId}/pg-configurations` |
| getPgConfigurationDetail | `/api/v1/tenants/pg-configurations/{tenantId}/{configId}` | `/api/v1/tenants/{tenantId}/pg-configurations/{configId}` |
| createPgConfiguration | `POST .../pg-configurations/{tenantId}` | `POST .../tenants/{tenantId}/pg-configurations` |
| updatePgConfiguration | `PUT .../pg-configurations/{tenantId}/{configId}` | `PUT .../tenants/{tenantId}/pg-configurations/{configId}` |
| deletePgConfiguration | `DELETE .../pg-configurations/{tenantId}/{configId}` | `DELETE .../tenants/{tenantId}/pg-configurations/{configId}` |
| testPgConnection | `POST .../pg-configurations/{tenantId}/{configId}/test-connection` | `POST .../tenants/{tenantId}/pg-configurations/{configId}/test-connection` |

→ **tenantId가 pg-configurations 뒤에 있음. 백엔드는 tenants 뒤에 tenantId를 기대함.**

### 2.4 라우트 보호

- 현재 `/tenant/profile`은 **ProtectedRoute 미적용** (TenantProfile 참고).
- PG 설정은 어드민(ADMIN/STAFF) 전용으로 `ADM_SETTINGS_PG` 권한 명세 존재. **ProtectedRoute 적용 권장**(ACCOUNT_MANAGEMENT 패턴 참고).

### 2.5 의존 컴포넌트·서비스

- `AdminCommonLayout`, `UnifiedLoading`, `StatusBadge`, `toDisplayString` (safeDisplay)
- `useSession` → `user`, `tenantId` (`user?.tenantId || user?.tenant_id`)
- `pgApi.js` (getPgConfigurations, getPgConfigurationDetail, createPgConfiguration, updatePgConfiguration, deletePgConfiguration, testPgConnection)
- SessionContext

---

## 3. 기획 판단 — 가능 원인 (우선순위)

코드·백엔드 정적 분석 결과, 아래 순으로 **의심도가 높음**. **실제 원인은 core-debugger가 재현·스택·로그로 확정**한다.

| 순위 | 가설 | 근거 | 확인 방법 |
|------|------|------|-----------|
| **P0-a** | **라우트 미등록(404)** | App.js에 `/tenant/pg-configurations` 관련 라우트 없음. LNB 클릭 시 404 또는 fallback. | 직접 `/tenant/pg-configurations` 접근 시 404 여부. App.js 라우트 목록 검증. |
| **P0-b** | **pgApi URL 경로 순서 오류** | pgApi가 `tenants/pg-configurations/{tenantId}` 형태로 호출. 백엔드는 `tenants/{tenantId}/pg-configurations`. 404 또는 400 가능. | 네트워크 탭: 실제 요청 URL. 백엔드 로그: 매핑 실패/404. |
| **P1** | **LNB 메뉴 경로 불일치** | DB: `/tenant/pg-configuration`(단수). 컴포넌트: `/tenant/pg-configurations`(복수). LNB 클릭 시 존재하지 않는 경로로 이동 가능. | LNB 메뉴 클릭 시 이동 경로. DB menu_path vs 프론트 경로 비교. |
| **P2** | **세션/테넌트 컨텍스트 미설정(tenantId 없음)** | `tenantId = user?.tenantId || user?.tenant_id` 없으면 API 호출 생략 또는 오류. | 콘솔 로그. API 호출 여부. |
| **P3** | **API 응답 형식 불일치** | `getPgConfigurations`가 배열 가정. ApiResponse 래퍼 시 `response.data` 등 추출 필요. | `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`. apiGet 언래핑 로직. |
| **P4** | **React #130 (객체를 자식으로 렌더)** | config 필드(pgName, pgProvider, status 등)가 객체일 때 `.toLowerCase()`, `toLocaleString()` 등에서 TypeError. | COMMON_DISPLAY_BOUNDARY_MEETING §1 (C) 규칙. SafeText/toDisplayString 적용 여부. |
| **P5** | **ProtectedRoute 미적용** | 인증 전·권한 부족 시 컴포넌트 마운트 → race·예외 가능. | ACCOUNT_MANAGEMENT, TENANT_PROFILE 패턴 참고. |

---

## 4. 서브에이전트 분배 (수정·검증)

### 4.1 core-debugger (1차, **필수**)

**의뢰 사항**

- [ ] 브라우저: LNB 설정 > PG 설정 클릭 및 직접 `/tenant/pg-configurations` 접근 재현.
- [ ] **콘솔 스택트레이스·네트워크 탭** (요청 URL, 상태 코드, 응답 바디) 정리.
- [ ] `/api/v1/tenants/.../pg-configurations` 호출 시 **실제 요청 URL** 기록 (tenantId 위치 확인).
- [ ] 서버 로그: 동일 시각의 스택트레이스·예외 메시지 유무.
- [ ] React DevTools·소스맵: #130 발생 시 **문제의 컴포넌트·라인** 후보 기록.

**산출물**: 이 문서 **§5 이슈 확정 표** 채움 → core-coder에게 전달.

**전달할 프롬프트 초안**  
> PG 설정 페이지(`/tenant/pg-configurations`) 접근 시 발생하는 오류를 조사해 주세요.  
> - 재현: 로그인 후 LNB 설정 > PG 설정 클릭, 또는 직접 `/tenant/pg-configurations` 접근  
> - 확인: 브라우저 콘솔 스택, 네트워크 탭 요청 URL 및 응답, App.js 라우트 등록 여부, pgApi.js 경로 구문  
> - 산출: `docs/project-management/PG_SETTINGS_PAGE_ERROR_ORCHESTRATION.md` §5 이슈 확정 표 기입  
> - 참조: §2 현황 파악, §3 기획 판단 가설, `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`

---

### 4.2 core-coder (2차, **디버거 확정 후에만**)

**전제**: core-debugger가 P0~P5 중 확정 원인을 보고한 뒤에만 수정. **임의 수정 금지.**

**예상 수정 방향 (확정 시)**

- [ ] **App.js**: `/tenant/pg-configurations`, `/tenant/pg-configurations`(LNB 리다이렉트), `/tenant/pg-configurations/new`, `/tenant/pg-configurations/:id`, `/tenant/pg-configurations/:id/edit` 라우트 등록. `PgConfigurationList`, `PgConfigurationCreate`, `PgConfigurationDetail`, `PgConfigurationEdit` 컴포넌트 매핑.
- [ ] **pgApi.js**: URL 경로를 `/api/v1/tenants/${tenantId}/pg-configurations` 형식으로 수정 (tenantId를 pg-configurations 앞에 배치).
- [ ] **LNB/DB**: `menu_path`를 `/tenant/pg-configurations`로 통일하거나, `/tenant/pg-configuration` → `/tenant/pg-configurations` 리다이렉트 라우트 추가.
- [ ] (정책 합의 시) PG 설정 라우트에 `ProtectedRoute` 적용 — `USER_ROLES.ADMIN`, `USER_ROLES.STAFF`. ACCOUNT_MANAGEMENT 패턴 참고.
- [ ] `PgConfigurationList` 등: API 응답 `Array.isArray` 가드, config 필드 `toDisplayString`/`toSafeNumber` 적용 (COMMON_DISPLAY_BOUNDARY_MEETING §1 (C)).

**산출물**: PR 링크, 변경 파일 목록.

---

### 4.3 core-tester (3차)

- [ ] ADMIN/STAFF: PG 설정 목록·등록·상세·수정·삭제·연결 테스트 스모크.
- [ ] CLIENT 등 비허용 역할: 접근 시 리다이렉트 또는 403 동작 확인(정책 확정 후).
- [ ] 회귀: 테넌트 프로필, 계좌 관리 등 인접 설정 메뉴 동작 확인.

---

## 5. 이슈 확정 표 (core-debugger가 기입)

| 항목 | 내용 |
|------|------|
| **확정 원인 코드** | **P0-a** App.js에 PG 설정 라우트 4개 미등록. **P0-b** pgApi.js URL 경로 세그먼트 순서 오류 (tenantId가 pg-configurations 뒤에 배치). **P1** LNB DB menu_path `/tenant/pg-configuration`(단수), 컴포넌트는 `/tenant/pg-configurations`(복수). |
| **HTTP 증거** | *(현장 스택·네트워크 없음 — 코드 정적 분석으로 확정)* LNB 클릭 또는 직접 `/tenant/pg-configurations` 접근 시 매칭 라우트 없음 → 404/fallback. API 호출 시 `GET /api/v1/tenants/pg-configurations/{tenantId}` → 백엔드 `tenants/{tenantId}/pg-configurations` 매핑과 불일치 → 404. |
| **스택 트레이스 요약** | *(미캡처)* 라우트 미등록 시 React Router가 fallback 또는 404 렌더. pgApi 호출 시 404 응답. |
| **조치 PR** | — |

### 5.1 보조 이슈 (선택 수정)

| 항목 | 내용 |
|------|------|
| **P2-a** | `PgConfigurationList.js` L108: `showNotification` 미 import. `notificationManager.success('PG 설정이 삭제되었습니다.')` 사용해야 함. 삭제 성공 시 ReferenceError 발생. |
| **P2-b** | LNB DB `menu_path` `/tenant/pg-configuration`(단수) → 컴포넌트 경로 `/tenant/pg-configurations`(복수)와 불일치. 메뉴 클릭 시 404 가능 (라우트 등록 후에도 리다이렉트 필요). |

### 5.2 권장 수정 요약 (core-coder 전달)

| 우선순위 | 파일 | 수정 내용 |
|----------|------|-----------|
| **P0-a** | `frontend/src/App.js` | `/tenant/pg-configurations`, `/tenant/pg-configurations/new`, `/tenant/pg-configurations/:id`, `/tenant/pg-configurations/:id/edit` 라우트 4개 등록. `PgConfigurationList`, `PgConfigurationCreate`, `PgConfigurationDetail`, `PgConfigurationEdit` lazy import·매핑. ProtectedRoute(ADMIN/STAFF) 적용 권장. |
| **P0-b** | `frontend/src/utils/pgApi.js` | PG_API base를 `/api/v1/tenants`로 변경. 호출 시 `/api/v1/tenants/${tenantId}/pg-configurations` 형태 사용 (tenantId를 pg-configurations 앞에 배치). getPgConfigurationDetail, create, update, delete, testPgConnection, decryptPgKeys 모두 동일 패턴 적용. |
| **P1** | DB 또는 LNB | `V20260225_001__lnb_menu_structure.sql` 또는 API/메뉴 시드: `ADM_SETTINGS_PG` menu_path를 `/tenant/pg-configurations`로 수정. 또는 App.js에 `/tenant/pg-configuration` → `/tenant/pg-configurations` 리다이렉트 추가. |
| **P2-a** | `frontend/src/components/tenant/PgConfigurationList.js` | L108: `showNotification(...)` → `notificationManager.success(...)` 변경. |

**core-coder에게 넘길 파일 목록 (확정)**

- `frontend/src/App.js` (라우트 등록)
- `frontend/src/utils/pgApi.js` (URL 경로 수정)
- `frontend/src/components/tenant/PgConfigurationList.js` (showNotification 버그 수정)
- (정책 확정 시) `src/main/resources/db/migration/V20260225_001__lnb_menu_structure.sql` 또는 신규 마이그레이션

**참조 문서**

- `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
- `docs/project-management/TENANT_PROFILE_ACCESS_ERROR_ORCHESTRATION.md`
- `docs/project-management/ACCOUNT_MANAGEMENT_MENU_ERROR_ORCHESTRATION.md`
- `frontend/src/utils/ajax.js` (apiGet 언래핑 로직)

---

## 6. SSOT·연관 문서

- 라우트·LNB: `docs/standards/GNB_LNB_LINK_AUDIT_GUIDE.md`, `docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`
- 표시 경계·React #130: `docs/project-management/COMMON_DISPLAY_BOUNDARY_MEETING_20260322.md`
- 배치·위임: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`
- 유사 오케스트레이션: `TENANT_PROFILE_ACCESS_ERROR_ORCHESTRATION.md`, `ACCOUNT_MANAGEMENT_MENU_ERROR_ORCHESTRATION.md`
- DB 메뉴 시드: `src/main/resources/db/migration/V20260225_001__lnb_menu_structure.sql` (`ADM_SETTINGS_PG` → `/tenant/pg-configuration`)

---

## 7. 실행 요청문

**다음 순서로 서브에이전트를 호출해 주세요.**

1. **Phase 1 (core-debugger)**  
   - subagent_type: `core-debugger`  
   - 전달 프롬프트: 위 §4.1 "전달할 프롬프트 초안" + `docs/project-management/PG_SETTINGS_PAGE_ERROR_ORCHESTRATION.md` 참조  
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
| 1.0.0 | 2026-03-21 | 초안: 현황 파악·가설·분배실행 표·core-debugger 의뢰 준비 |
| 1.1.0 | 2026-03-21 | core-debugger 확정: §5 이슈 확정 표·권장 수정 요약 기입. P0-a 라우트 미등록, P0-b pgApi 경로 순서 오류, P1 LNB 경로 불일치 확정. P2-a showNotification 미 import. |

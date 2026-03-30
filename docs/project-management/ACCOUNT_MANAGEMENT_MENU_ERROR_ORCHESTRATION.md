# 계좌 관리 메뉴 오류 — 기획 주관 오케스트레이션

**문서 버전**: 1.0.1  
**작성일**: 2026-02-12  
**주관**: 기획 (core-planner)  
**상태**: core-coder 1차 수정 반영 (2026-02-12)  

---

## 1. 범위·증상

- **메뉴**: LNB/레거시 메뉴 기준 **「계좌 관리」** → 경로 `/admin/accounts`
- **화면**: `frontend/src/components/admin/AccountManagement.js` (`AccountForm`, `AccountTable`)
- **사용자 표기**: 화면 오류, 목록/폼 비정상, 콘솔 런타임 예외, API 4xx/5xx 등 (현장 증상은 **core-debugger**가 캡처해 아래 표에 기입)

---

## 2. 기획 판단 — 가능 원인 (우선순위)

코드·백엔드 정적 분석 결과, 아래 순으로 **의심도가 높음**.

| 순위 | 가설 | 근거 | 확인 방법 |
|------|------|------|-----------|
| **P0** | **인증·테넌트 컨텍스트 미전달** | `AccountManagement.loadAccounts` / `loadBanks`의 `fetch`에 **`credentials: 'include'` 없음**. 동일 API는 `IntegratedFinanceDashboard`에서 `axios`+`withCredentials: true` 사용 (`ACCOUNT_API_ENDPOINTS.ACTIVE`). 크로스 오리진(예: 프론트 `:3000` / API `:8080`)에서는 **세션·테넌트 헤더/쿠키 누락** 가능. | 네트워크 탭: `/api/v1/accounts/active` 요청에 쿠키 포함 여부, 응답 코드(401/403/500). 백엔드 로그: `TenantContextHolder.getRequiredTenantId()` 관련 예외. |
| **P1** | **응답 형태·상태와 UI 가정 불일치** | `setAccounts(data)` 직후 `AccountTable`에서 **`accounts.map`**. `data`가 배열이 아니면 **즉시 런타임 크래시**. 백엔드 `AccountController`는 raw `List` 반환이나, **게이트웨이/프록시/추후 표준 래퍼(ApiResponse)** 도입 시 불일치 가능. | 응답 바디가 순수 배열인지, `{ success, data }` 인지 확인. 프론트에 **`Array.isArray` 가드** 권장. |
| **P2** | **라우팅·권한 일관성** | `/admin/accounts`는 `App.js`에서 **`ProtectedRoute` 미적용** (인접 `/admin/user-management` 등과 상이). 직접 URL 접근 시 세션 역할과 무관하게 컴포넌트 마운트 → API에서 막히거나 빈 화면. | 미로그인·STAFF·ADMIN 각각 접근 시 기대 동작 정의 후 라우트 정합성 수정. |
| **P3** | **Spring 경로 매핑** | `GET /api/v1/accounts/{id}` vs `GET .../active` — 환경에 따라 리터럴 경로 해석 이슈가 드물게 보고됨(버전별 점검). | 실제 호출이 `/active`로 나가는지, 400/404와 바디 메시지 확인. |
| **P4** | **기타 UX/코드 품질** | `AccountManagement` **미사용 import** (`DEFAULT_MENU_ITEMS`). 등록 버튼 **중복 `className` 속성**(후자만 적용). 런타임 치명도는 낮음. | 린트·리뷰 시 정리. |

백엔드 참고: `AccountServiceImpl.getActiveAccounts()` → `TenantContextHolder.getRequiredTenantId()` 사용 — **테넌트 미설정 시 서버 예외** 가능.

---

## 3. 서브에이전트 분배 (수정·검증)

### 3.1 core-debugger (1차, **필수**)

- [ ] 브라우저: `/admin/accounts` 재현, **콘솔 스택·네트워크 HAR** 정리.
- [ ] `/api/v1/accounts/active`, `/api/v1/accounts/banks` 상태 코드·응답 바디 기록.
- [ ] 서버 로그: 동일 시각의 스택트레이스 유무.
- 산출물: 이 문서 **§5 이슈 확정 표** 채움 → core-coder에게 전달.

### 3.2 core-coder (2차, 구현)

**전제**: debugger가 P0~P1 중 무엇인지 확정한 뒤 PR 분리 권장.

- [ ] `AccountManagement.js`의 **모든 `fetch`에 `credentials: 'include'`** 적용 (GET/DELETE/PATCH 포함), 프로젝트 표준 API 클라이언트(`StandardizedApi` / `apiGet` 등)와 **패턴 통일** 검토.
- [ ] `loadAccounts` 등: 응답 파싱 시 **`Array.isArray` 가드**, 비배열이면 `[]` + 사용자 알림(또는 로그).
- [ ] (기획·보안 정책 합의 시) `/admin/accounts`에 **`ProtectedRoute`** 및 `USER_ROLES`를 인접 관리자 라우트와 동일하게 적용.
- [ ] 미사용 import 제거, 등록 버튼 JSX **단일 `className`** 정리.
- 산출물: PR 링크, 변경 파일 목록.

### 3.3 core-tester (3차)

- [ ] ADMIN(및 정책상 허용 역할): 계좌 목록 로드, 등록·수정·토글·주계좌·삭제 스모크.
- [ ] 크로스 오리진/동일 오리진 각각 쿠키 시나리오(가능하면 스테이징).
- [ ] 회귀: `IntegratedFinanceDashboard` 계좌 선택 연동.

### 3.4 core-designer (선택)

- [ ] 오류·빈 목록·로딩 상태 메시지 가독성(어드민 샘플 기준) — 코드 변경은 코더와 역할 분리.

---

## 4. SSOT·연관 문서

- 라우트·LNB 경로: `docs/standards/GNB_LNB_LINK_AUDIT_GUIDE.md`, `docs/design-system/LNB_MENU_STRUCTURE_AND_PERMISSION_SPEC.md`
- DB 메뉴 시드: `src/main/resources/db/migration/V20260225_001__lnb_menu_structure.sql` (`ADM_ACCOUNTS` → `/admin/accounts`)

---

## 5. 이슈 확정 표 (테이블러가 채움)

| 항목 | 내용 |
|------|------|
| 확정 원인 코드 | *(예: P0 credentials 누락 / P1 비배열 응답 / 기타)* |
| HTTP 증거 | |
| 스택 트레이스 요약 | |
| 조치 PR | |

---

## 6. 변경 이력

| 버전 | 일자 | 내용 |
|------|------|------|
| 1.0.1 | 2026-02-12 | core-coder: `AccountManagement` fetch에 `credentials: 'include'`, `normalizeListResponse`, 오류 시 토스트; 미사용 import·버튼 JSX 정리; `App.js` `/admin/accounts`에 `ProtectedRoute`(ADMIN, STAFF) |
| 1.0.0 | 2026-02-12 | 초안: 정적 분석 기반 가설·에이전트 분배 |

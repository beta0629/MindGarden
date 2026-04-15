# 어드민 LNB 레이아웃 통일 — 멀티 역할 회의 합의 & 코더 위임서

**일자**: 2026-02-12  
**오케스트레이션**: core-planner (사용자 요청에 따른 가상 회의 취합)  
**참석 역할**: core-designer · core-publisher · core-component-manager · core-coder

---

## 1. 회의 목적

`DEFAULT_MENU_ITEMS` / DB LNB에 노출되는 **어드민·설정·ERP 메뉴 경로**의 본문을 **시스템 표준 레이아웃**으로 통일한다.

---

## 2. core-designer 합의 (비주얼·UX)

- **기준 스펙**: `docs/design-system/UNIFIED_LAYOUT_SPEC.md`, 어드민 샘플 B0KlA (`AdminDashboardB0KlA.css` 계열).
- **본문 골격**: `AdminCommonLayout` 하위에 **`mg-v2-ad-b0kla` → `mg-v2-ad-b0kla__container` → `ContentArea` → `ContentHeader`(제목·부제·actions)**.
- **탭**: 기존 `mg-v2-tab-buttons` / `mg-v2-ad-b0kla__tab` 등 **이미 쓰는 토큰·클래스를 우선 재사용**. 신규 색·간격은 **unified-design-tokens** 준수.
- **예외**: 통합 스케줄(좌 목록·우 캘린더)은 **2열 그리드는 유지**하되, **상단만** ContentHeader/ContentArea로 정렬해 다른 메뉴와 시각적 정렬을 맞춘다.

---

## 3. core-publisher 합의 (마크업 구조)

- 각 페이지 **최상위 본문**을 다음 순서로 맞춘다:
  1. (선택) `ContentHeader`용 보조 툴바 행 — 상세 페이지만
  2. `ContentArea` 단일 래퍼(aria-label 한글)
  3. `ContentHeader`
  4. 기존 비즈니스 블록(카드·그리드·탭)
- **시맨틱**: 본문 집합은 가능하면 `<main>` + `aria-labelledby` (페이지 제목 id와 연결).

---

## 4. core-component-manager 합의 (적재적소)

- **신규 래퍼 컴포넌트 남발 금지**. `ContentHeader` / `ContentArea` / `ContentSection`이 이미 있으면 **페이지별로 직접 조합**.
- **중복 패턴**이 3개 이상 페이지에서 반복되면 후속 Phase에서 `TenantSettingsPageShell` 같은 **얇은 셸**만 검토 (이번 Phase에서는 도입하지 않음).
- **PG 설정 메뉴 링크**: 폴백 메뉴에서 PG가 `/tenant/profile`로 잘못 연결된 경우 **`/tenant/pg-configurations`로 수정** (레이아웃과 별도 버그).

---

## 5. core-coder 위임 — Phase 1 구현 범위 (시작)

다음은 인벤토리상 **레거시·부분 통일**로 분류된 항목의 **1차 개선** 대상이다.

| 우선순위 | 경로 | 컴포넌트 | 작업 |
|---------|------|----------|------|
| P0 | `/admin/integrated-schedule` | `IntegratedMatchingSchedule.js` | B0KlA 컨테이너 + `ContentArea` + `ContentHeader` 추가, 기존 2열 레이아웃은 그 아래 유지 |
| P0 | `/admin/notifications` | `AdminNotificationsPage.js` | `ContentArea`로 본문 감싸기, 구조는 기존 탭 유지 |
| P0 | `/admin/user-management` | `UserManagementPage.js` | `ContentHeader` 추가(제목·부제), 기존 타입 pill은 헤더 아래 유지 |
| P1 | `/admin/permissions` | `PermissionManagement.js` (+ App 라우트 래핑 필요 시) | `AdminCommonLayout`만이 아니라 **본문**에 B0KlA + ContentArea + ContentHeader |
| P1 | `/admin/accounts` | `AccountManagement.js` | 동일 패턴 적용 |
| P1 | `/admin/compliance` | `ComplianceMenu.js` (및 하위 진입 화면이 있으면 동일 원칙) | B0KlA + ContentArea + ContentHeader |
| P1 | 폴백 메뉴 | `menuItems.js` | PG 설정 `to` → `/tenant/pg-configurations` |

**참고 구현**: `SystemConfigManagement.js`, `CommonCodeManagement.js`, `TenantProfile.js`, `PgConfigurationDetail.js`.

**완료 조건**: `frontend`에서 `npm run build:ci` 성공, 변경 파일 린트 치명적 오류 없음.

---

## 6. 후속 Phase (회의 예고)

- DB LNB `menu_path` 전체와 `App.js` 라우트 **전수 대조** 후 표 갱신.
- `MappingManagement`, `SessionManagement`, `WellnessManagement` 등 메뉴·즐겨찾기에 자주 노출되는 경로 동일 패턴 적용.

---

## 7. 참조 문서

- `docs/project-management/SETTINGS_PAGES_LAYOUT_UNIFICATION_ORCHESTRATION.md`
- `docs/design-system/UNIFIED_LAYOUT_SPEC.md`
- `frontend/src/components/dashboard-v2/content/ContentHeader.js`, `ContentArea.js`

---

## 8. Phase 2 완료 (2026-03-21)

**적용 패턴**: `AdminCommonLayout` 하위에 `mg-v2-ad-b0kla` → `mg-v2-ad-b0kla__container` → `ContentArea`(한글 `ariaLabel`) → `ContentHeader` → (선택) `<main aria-labelledby>` 본문. `unified-design-tokens.css` + `AdminDashboardB0KlA.css` 로드. 잘못된 `<button className="mg-button" variant=...>` → `MGButton`.

**변경 파일**

| 파일 | 비고 |
|------|------|
| `frontend/src/components/admin/MappingManagement.js` | B0KlA CSS import |
| `frontend/src/components/admin/mapping-management/pages/MappingManagementPage.js` | `ContentArea` ariaLabel, `titleId`, 본문 `<main>` |
| `frontend/src/components/admin/SessionManagement.js` | B0KlA 셸, `ContentArea`/`ContentHeader`, `MGButton` 일괄 |
| `frontend/src/components/admin/WellnessManagement.js` | 동일 + 헤더 액션 `MGButton` |
| `frontend/src/components/admin/MenuPermissionManagement.js` | (선택 과제) B0KlA + `ContentHeader` + 저장 버튼을 actions로 이동 |
| `frontend/src/components/admin/PermissionGroupManagement.js` | (선택 과제) B0KlA + `ContentHeader`, 역할별 부제 |
| `frontend/src/components/ui/MenuPermissionManagementUI.js` | 중복 `mg-header` 제거 |
| `frontend/src/components/ui/PermissionGroupManagementUI.js` | 중복 `mg-header` 제거 |

**라우트**

- `/admin/mapping-management`
- `/admin/sessions`
- `/admin/wellness`
- `/admin/menu-permissions` (중첩 `AdminLayout` + 페이지 `AdminCommonLayout` — 이중 GNB/LNB 없음 유지)
- `/admin/permission-groups`

**검증**: `cd frontend && npm run build:ci` 통과.

---

## 9. Phase 3 (예정) — 운영·모니터링·브랜딩·컴플라이언스

`App.js` 기준 아래는 **B0KlA + ContentArea + ContentHeader** 미적용 또는 부분만 적용된 관리 화면으로 분류됨.

| 경로 | 컴포넌트 |
|------|----------|
| `/admin/dashboards` | `DashboardManagement.js` |
| `/admin/cache-monitoring` | `CacheMonitoringDashboard.js` |
| `/admin/security-monitoring` | `SecurityMonitoringDashboard.js` |
| `/admin/branding` | `BrandingManagementPage.js` |
| `/admin/compliance/*` (하위 전부) | `ComplianceDashboard.js` |
| `/admin/tenant-common-codes` | `TenantCommonCodeManager.js` |
| `/admin/erp/financial` | `IntegratedFinanceDashboard.js` (B0KlA 있음, ContentHeader/ContentArea 정렬) |

**완료 후**: 본 절 하단에 **Phase 3 완료** 요약 추가, `npm run build:ci` 통과.

---

## 10. Phase 3 완료 (2026-03-21)

**적용 패턴**: `AdminCommonLayout` 하위에 `mg-v2-ad-b0kla` → `mg-v2-ad-b0kla__container` → `ContentArea`(한글 `ariaLabel`) → `ContentHeader`(제목·부제·actions) → `<main aria-labelledby>` 본문. `unified-design-tokens.css` + `AdminDashboardB0KlA.css` 로드. 잘못된 `<button className="mg-button" variant=...>` → `MGButton`(대상 파일 내).

**변경 파일**

| 파일 | 비고 |
|------|------|
| `frontend/src/components/admin/DashboardManagement.js` | B0KlA 셸, `ContentHeader`·actions(새 대시보드), 카드·필터 `MGButton` |
| `frontend/src/components/admin/CacheMonitoringDashboard.js` | B0KlA + `ContentHeader`(헤더 컨트롤은 actions) |
| `frontend/src/components/admin/SecurityMonitoringDashboard.js` | B0KlA + `ContentHeader`, 뒤로·보고서·새로고침 `MGButton`, 상태 띠는 본문 유지 |
| `frontend/src/components/admin/CacheMonitoringDashboard.css` | 본문 `min-height` 조정(중첩 뷰포트 왜곡 완화) |
| `frontend/src/components/admin/SecurityMonitoringDashboard.css` | 헤더 actions·컴팩트 `page-header` 보조 |
| `frontend/src/components/admin/BrandingManagement.js` | B0KlA + `ContentHeader`, 중복 타이틀 블록 제거 |
| `frontend/src/components/compliance/ComplianceDashboard.js` | 공통 `complianceShell`, 경로별 부제(`useLocation`), 액션·재시도 `MGButton` |
| `frontend/src/components/admin/TenantCommonCodeManager.js` | B0KlA + `ContentHeader` |
| `frontend/src/components/ui/TenantCommonCodeManagerUI.js` | 상단 중복 헤더 제거(제목은 컨테이너 `ContentHeader`) |
| `frontend/src/components/erp/IntegratedFinanceDashboard.js` | 단일 B0KlA 트리: `ContentArea` + `ContentHeader`(퀵 액션) + `main` 내 탭·콘텐츠, 오류 시에도 동일 셸 |
| `frontend/src/components/erp/IntegratedFinanceDashboard.css` | `ContentHeader` 액션 영역 flex |

**라우트**

- `/admin/dashboards`
- `/admin/cache-monitoring`
- `/admin/security-monitoring`
- `/admin/branding` (`BrandingManagementPage` → `BrandingManagement`)
- `/admin/compliance/dashboard`, `/admin/compliance/personal-data-processing`, `/admin/compliance/impact-assessment`, `/admin/compliance/breach-response`, `/admin/compliance/education`, `/admin/compliance/policy`, `/admin/compliance/destruction`, `/admin/compliance/audit`
- `/admin/tenant-common-codes`
- `/admin/erp/financial`

**검증**: `cd frontend && npm run build:ci` 통과.

---

## 11. Phase 4 (예정) — 통계·스케줄·학원·ERP 일부

| 경로 | 컴포넌트 | 비고 |
|------|----------|------|
| `/admin/statistics`, `/admin/statistics-dashboard` | `StatisticsDashboard.js` | **이중 `AdminCommonLayout`** 제거 후 B0KlA + `ContentArea` + `ContentHeader` |
| `/admin/schedules` | `App.js` + 신규 얇은 래퍼 | ACL 내 `UnifiedScheduleComponent`에 표준 셸(`ContentArea`+`ContentHeader`) 추가 |
| `/academy`, `/admin/academy` | `AcademyDashboard.js` | 커스텀 헤더 → B0KlA + `ContentHeader` + 탭 |
| `/erp/purchase-requests` | `PurchaseRequestForm.js` | `ErpHeader` → `ContentHeader`, B0KlA + `ContentArea` |
| `/erp/items` | `ItemManagement.js` | `mg-v2-ad-b0kla` 래퍼 및 로딩/오류 셸 정리 |

**완료 후**: **§12 Phase 4 완료** 추가, `npm run build:ci` 통과.

---

## 12. Phase 4 완료 (2026-03-21)

**적용 패턴**: `AdminCommonLayout`(App·라우트 단일) 하위에 `mg-v2-ad-b0kla` → `mg-v2-ad-b0kla__container` → `ContentArea`(한글 `ariaLabel`) → `ContentHeader` → (선택) `<main aria-labelledby>`. `unified-design-tokens.css` + `AdminDashboardB0KlA.css` 로드. 통계 오류 재시도는 `MGButton` 사용.

**변경 파일**

| 파일 | 비고 |
|------|------|
| `frontend/src/components/admin/StatisticsDashboard.js` | 이중 ACL 제거, B0KlA 셸·`ContentHeader`·로딩/오류 동일 셸, API 실패 시 오류+재시도 |
| `frontend/src/components/schedule/AdminSchedulesPage.js` | 신규 얇은 래퍼: B0KlA + `ContentArea` + `ContentHeader` + `UnifiedScheduleComponent` |
| `frontend/src/App.js` | `/admin/schedules` → `AdminSchedulesPage` |
| `frontend/src/components/academy/AcademyDashboard.js` | B0KlA + `ContentHeader`, `mg-v2-tab-buttons` / `mg-v2-tab-button`, `DEFAULT_MENU_ITEMS` 제거 |
| `frontend/src/components/erp/PurchaseRequestForm.js` | `ErpHeader` → `ContentHeader` + `MGButton` 뒤로, B0KlA + `ContentArea`, 초기 로딩 `UnifiedLoading`, JSX 내 잘못된 `//` 줄 제거 |
| `frontend/src/components/erp/ItemManagement.js` | B0KlA 래퍼, 초기 로딩을 ACL `loading` 대신 셸 내부 `UnifiedLoading` |

**라우트**

- `/admin/statistics`, `/admin/statistics-dashboard`
- `/admin/schedules`
- `/academy`, `/admin/academy`
- `/erp/purchase-requests`
- `/erp/items`

**검증**: `cd frontend && npm run build:ci` 통과.

---

## 13. Phase 5 (예정) — 클라이언트·상담사 포털·마이페이지·학원 등록

`CLIENT_MENU_ITEMS` / `CONSULTANT_MENU_ITEMS` 등 역할 포털에서 B0KlA + `ContentArea` + `ContentHeader` 미적용·부분 적용 화면.

| 경로 | 컴포넌트 | 비고 |
|------|----------|------|
| `/client/schedule` | `ClientSchedule.js` | 표준 셸 |
| `/client/session-management` | `ClientSessionManagement.js` | 표준 셸 |
| `/client/payment-history` | `ClientPaymentHistory.js` | 표준 셸 |
| `/client/settings` | `ClientSettings.js` | 표준 셸 |
| `/consultant/schedule` | `ConsultantSchedule.js` | 표준 셸 |
| `/consultant/availability` | `ConsultantAvailability.js` | 표준 셸 |
| `/consultation-history` | `ConsultationHistory.js` | 표준 셸 |
| `/academy/register` | `AcademyRegister.js` | 표준 셸 |
| `/*/mypage` | `MyPage.js` | `AdminCommonLayout` 유지, 본문에 B0KlA + `ContentArea` + `ContentHeader` |
| `/consultant/clients` | `ConsultantClientList.js` | `mg-v2-ad-b0kla` 래퍼·토큰/CSS 정렬 |

**제외(Phase 6 예정)**: `ClientDashboard.js`, `ConsultantDashboardV2.js`.

**완료 후**: **§14 Phase 5 완료** 추가, `npm run build:ci` 통과.

---

## 14. Phase 5 완료 (2026-03-21)

**적용 패턴**: 단일 `AdminCommonLayout` 유지. 본문은 `mg-v2-ad-b0kla` → `mg-v2-ad-b0kla__container` → `ContentArea`(한글 `ariaLabel`) → `ContentHeader`(`titleId`) → (선택) `nav` 탭 → `<main aria-labelledby>`. 초기 로딩은 ACL `loading` + 빈 div 대신 **동일 셸 + `UnifiedLoading`**. `unified-design-tokens.css` + `AdminDashboardB0KlA.css`는 신규·누락 분만 보강.

**§13 행별**

| §13 행 | 결과 |
|--------|------|
| `/client/schedule` `ClientSchedule.js` | **이미** B0KlA·`ContentArea`·`ContentHeader` 적용됨 → **로딩만** ACL `loading` 제거, 셸+`UnifiedLoading`으로 정렬 |
| `/client/session-management` `ClientSessionManagement.js` | 동일 → 로딩 셸만 정렬 |
| `/client/payment-history` `ClientPaymentHistory.js` | 동일 → 로딩 셸만 정렬 |
| `/client/settings` `ClientSettings.js` | **이미** B0KlA 셸 → `pageShell` 추출, 초기 로딩을 셸+`UnifiedLoading`으로 통일 |
| `/consultation-history` `ConsultationHistory.js` | **이미** B0KlA 셸 → 세션/데이터 로딩 분기 셸+`UnifiedLoading`으로 통일 |
| `/*/mypage` `MyPage.js` | **갱신**: 커스텀 `mypage-header` 제거, B0KlA+`ContentHeader`+`mg-v2-tab-buttons`, 로딩 분기 동일 셸, 미사용 `DEFAULT_MENU_ITEMS` import 제거 |
| `/consultant/clients` `ConsultantClientList.js` | **갱신**: B0KlA 래퍼·토큰/B0KlA CSS·`titleId`·`main`, 세션/비로그인 분기 동일 셸 |
| `/consultant/schedule` `ConsultantSchedule.js` | **검증만**: 이미 B0KlA+`ContentHeader` — 변경 없음 |
| `/consultant/availability` `ConsultantAvailability.js` | **검증만**: 이미 B0KlA+`ContentHeader` — 변경 없음 |
| `/academy/register` `AcademyRegister.js` | **검증만**: 이미 B0KlA+`ContentHeader` — 변경 없음 |

**변경 파일 (이번 배치)**

- `frontend/src/components/mypage/MyPage.js`
- `frontend/src/components/mypage/MyPage.css` (탭 아이콘 정렬용 `mg-v2-mypage__tabs`)
- `frontend/src/components/consultant/ConsultantClientList.js`
- `frontend/src/components/client/ClientSchedule.js`
- `frontend/src/components/client/ClientSessionManagement.js`
- `frontend/src/components/client/ClientPaymentHistory.js`
- `frontend/src/components/client/ClientSettings.js`
- `frontend/src/components/consultation/ConsultationHistory.js`
- `docs/project-management/ADMIN_LNB_LAYOUT_UNIFICATION_MEETING_HANDOFF.md` (본 절)

**라우트 (직접 영향)**

- `/mypage` 및 역할별 마이페이지 경로(동일 컴포넌트)
- `/consultant/clients`
- `/client/schedule`, `/client/session-management`, `/client/payment-history`, `/client/settings`
- `/consultation-history`

**검증**: `cd frontend && npm run build:ci` 통과.

---

## 15. Phase 6 (예정) — 역할 대시보드

| 경로 | 컴포넌트 | 비고 |
|------|----------|------|
| `/client/dashboard` | `ClientDashboard.js` | B0KlA + `ContentArea` + `ContentHeader`; 기존 카드·위젯·클라이언트 테마 CSS 유지 |
| `/consultant/dashboard` | `ConsultantDashboardV2.js` | 동일; `QuickActionBar` 등 기존 블록은 헤더 아래 `<main>` |

**완료 후**: **§16 Phase 6 완료** 추가, `npm run build:ci` 통과.

---

## 16. Phase 6 완료 (2026-03-21)

**적용 패턴**: 단일 `AdminCommonLayout` 유지. 본문은 `mg-v2-ad-b0kla` → `mg-v2-ad-b0kla__container` → `ContentArea`(한글 `ariaLabel`) → `ContentHeader`(`titleId`, 상담사는 `QuickActionBar`를 `actions`) → `<main aria-labelledby>`. 세션·데이터 로딩은 **동일 셸** 안 `UnifiedLoading`. `unified-design-tokens.css` + `AdminDashboardB0KlA.css` 로드. 클라이언트 빠른 메뉴는 `MGButton`으로 정리(잘못된 네이티브 `button`+variant 패턴 제거).

**변경 파일**

| 파일 | 비고 |
|------|------|
| `frontend/src/components/client/ClientDashboard.js` | B0KlA 셸·`ContentHeader`(부제에 인사·이름·퀵 비주얼, actions에 시각·시간), 중복 웰컴 `h1` 제거, 로딩 분기 동일 셸, 미사용 `CLIENT_MENU_ITEMS`·`API_BASE_URL` import 제거 |
| `frontend/src/components/dashboard-v2/consultant/ConsultantDashboardV2.js` | B0KlA 셸·`ContentHeader`·`main`, 인라인 스타일 웰컴 카드 제거·헤더로 이관, `user?.id` 있을 때 초기 로딩 `UnifiedLoading`, `tenantId` 오류는 `main` 내부 배너 유지, 모달은 `main` 바깥 유지 |

**라우트**

- `/client/dashboard`
- `/consultant/dashboard`

**빌드**: `cd frontend && npm run build:ci` 통과 필요.

---

## 17. 운영 반영 준비 — 하드코딩 제거 (필수)

**본 레이아웃 통일 작업을 운영에 반영하기 전**, 아래를 **반드시** 충족한다.  
**검색·스캔·훅에 하드코딩으로 잡히는 항목은 예외 없이 수정**한다. “개발 중 허용” 커밋 훅 메시지에만 의존하지 않는다.

### 17.1 원칙

| 구분 | 요구 |
|------|------|
| **색상·스타일** | `#hex`, `rgb(a)` 직접 값, 인라인 색상 등 → **`unified-design-tokens.css` 및 `var(--mg-*)` 등 토큰**으로 치환. 훅/스크립트가 지적한 줄은 **전부** 처리. |
| **도메인·URL·포트** | 코드·설정에 박힌 고정값 → **환경 변수·상수 모듈** (`docs/standards`, `ENVIRONMENT_SEPARATION` 계열 참고). |
| **상태값·코드값** | 비즈니스 상태 문자열 하드코딩 → **공통코드/API 조회** 등 표준 경로 (기존 `getCommonCodes` 주석이 붙은 구간 포함). |
| **비밀·키** | 절대 저장소에 두지 않음 (`SECURITY_AUTHENTICATION_STANDARD` 준수). |

### 17.2 반드시 돌릴 검사 (예시)

- 저장소 표준 스크립트: `config/shell-scripts/check-hardcode.sh`(저장소 루트에서 실행; 내부적으로 `node scripts/design-system/css-tools/check-hardcoding-enhanced.js` — `.github/workflows/code-quality-check.yml`과 동일). `config-old/shell-scripts/check-hardcode.sh`는 Ops(frontend-ops 등) 전용 레거시로 목적이 다를 수 있음.
- 커밋 시 동작하는 **MindGarden CI/BI 하드코딩 검사**(프론트 변경 파일 스캔) — **출력에 나온 파일·라인은 전부 수정 후 재실행**한다.
- 색상 일괄 보조: `node scripts/design-system/color-management/convert-hardcoded-colors.js` (문서/스크립트 존재 시).

### 17.3 완료 조건 (운영 배포 게이트)

- [ ] 위 검사들에서 **하드코딩 위반 0건**(또는 팀이 합의한 예외 목록만 명시 문서화).
- [ ] `frontend` **`npm run build:ci`** 통과.
- [ ] `docs/project-management/2025-12-03/CHECKLIST.md` 등 **배포 체크리스트**의 CSS/하드코딩 항목과 정합.

**요약**: **검색·자동 검사·리뷰에서 하드코딩으로 보이면 운영 반영 전까지 전부 수정한다.**

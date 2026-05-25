# D5 P4 i18n Phase 2 — P0-inv 인벤토리 보고서 (2026-05-26)

> **산출 유형**: 인벤토리 보고서 (read-only). 운영 코드(컴포넌트/locale/i18n/index.js/scripts) 0줄 수정.
> **위임 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §4.1 P0-inv + §6.1 PR-INV.
> **산출물 동반**: `reports/d5-p4-i18n-inventory-{trackA,trackB,trackC,namespace}-20260526.json`.

---

## §0 메타

| 항목 | 값 |
|---|---|
| 측정 일자 | 2026-05-26 |
| 측정 브랜치 | `develop` |
| 측정 SHA | `9e22d9e4c` (HEAD: "test(d11): P3 시각 회귀 검수 정합 (gemini-3.1-pro, 운영 push GO)") |
| 합의서 SHA (참조) | `8b89df494` (D5 P4 합의서 §5.8 일괄 채택본) |
| 측정 도구 | Node 18+ (재귀 파일 탐색 + 라인 단위 [가-힣] 매칭 + 분류 스크립트), 보조: `grep -rE` (POSIX) — `rg` 미설치 (Grep 도구는 내부적으로 ripgrep 사용) |
| 분류 우선순위 | **A > C > B > D** (단일 카테고리, 중복 매칭 금지) |
| 스캔 범위 | `frontend/src/**/*.{js,jsx,ts,tsx}` 전체 |
| 한국어 매칭 패턴 | `[\u3131-\u318F\uAC00-\uD7A3]` (한글 자모·완성형) |
| 주석 제외 패턴 | `^\s*(//\|\*\|/\*)` (라인 시작 // / 블록주석 본문 *) |

---

## §1 한국어 라인 단일 카테고리 분류 결과 (A/B/C/D)

### 1.1 트랙 합계 + 합의서 §1.1 비교

| 트랙 | 기준 | 한국어 라인 (총) | 실효 i18n 대상 (주석 제외) | 파일 수 | 합의서 §1.5 가늠 |
|---|---|---:|---:|---:|---|
| **A** | admin · layout · components/common · error/toast/notify 파일 | **9,181** | 6,494 | 355 | ~11,000 (admin 6,087 + common 1,698 + layout 179 + error/toast 3,247, 중복 포함) |
| **B** | settings · statistics · report 파일 (A 외 잔여) | **461** | 358 | 18 | ~1,000 |
| **C** | window.alert/confirm + bare alert/confirm 호출 한국어 라인 (A 파일 외) | **11** | 11 | 8 | (라인 수 미세, 메시지 위주) |
| **D** | 잔여 (A/B/C 외) | **20,245** | 13,229 | 630 | ~17,066 |
| **합계** | — | **29,898** | 20,092 | **1,011** | 29,279 (합의서 §1.1 시점 `c31a498df`) |

> **단일 카테고리 분류 정의**: 파일 경로가 A 패턴이면 **파일 전체** 한국어 라인을 A 로 흡수. 그 외 파일에서 window/bare alert·confirm 호출이 한국어를 포함하는 **라인만** C, 그 외 라인은 파일 경로 기준 B 또는 D. 한 라인은 한 카테고리에만 귀속 (합산 = 총합 29,898).

### 1.2 합의서 §1.1 (`c31a498df`, 2026-05-23) 대비 변화

| 항목 | 합의서 §1.1 | 현재 (`9e22d9e4c`, 2026-05-26) | 변화 |
|---|---:|---:|---:|
| 한국어 라인 (JS/TS) 총 | 29,279 | **29,898** | +619 (+2.1%) |
| 한국어 매칭 파일 수 | 987 | **1,011** | +24 (+2.4%) |
| 전체 JS/TS 파일 수 | 1,034 | **1,058** | +24 (+2.3%) |

> develop HEAD 가 D11 라운드 진척으로 D5 P4 합의서 시점(c31a498df) 대비 +24 파일 증가. 한국어 라인은 +2.1% 증가 (신규 컴포넌트·테스트 동반). KPI 기준선은 본 인벤토리 시점(29,898) 기준으로 보정 권장.

### 1.3 실효 i18n 대상 (주석 제외) — 트랙별

전체 29,898 라인 중 **주석 라인 9,806 (32.8%) 제외 → 실효 20,092 (67.2%)**. 주석 비율은 admin 영역이 가장 낮고 (admin 5,028/6,691 = 75%), common-modal 영역이 가장 높다 (1,013/1,753 = 58%, JSDoc 다수). 트랙별 실효 라인 수가 P2 코더의 실제 치환 작업량 가늠치이다.

---

## §2 트랙 A 상세 (Top-20 + 영역별)

### 2.1 트랙 A 서브카테고리 분포

| 서브카테고리 | 파일 수 | 한국어 라인 (총) | 실효 i18n 대상 | 비고 |
|---|---:|---:|---:|---|
| **admin** | 225 | 6,691 | 5,028 | `/admin/` 경로 + `Admin*` 파일명 매칭. PR-A 1순위 영역. |
| **common-modal** | 97 | 1,753 | 1,013 | `/components/common/` 디렉터리. UnifiedModal 류·Header·Print 류. |
| **error/toast** | 22 | 565 | 345 | error/toast/notify/notifi/notification 키워드 (NotificationContext·NotificationDropdown 등). |
| **layout** | 11 | 172 | 108 | `/layout/` 디렉터리 (TabletBottomNavigation·SimpleHamburgerMenu 등). |
| **합계** | **355** | **9,181** | **6,494** | A 트랙 전체 — 합의서 §3 KPI N=15,000 도달 시 본 영역 1순위 치환. |

### 2.2 Top-20 한국어 라인 컴포넌트

| 순위 | 파일 | 한국어 라인 | 실효 | 서브카테고리 |
|---:|---|---:|---:|---|
| 1 | `frontend/src/components/admin/AdminDashboard.js` | 275 | 265 | admin |
| 2 | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` | 270 | 223 | admin |
| 3 | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` | 211 | 181 | admin |
| 4 | `frontend/src/components/admin/DashboardFormModal.js` | 181 | 93 | admin |
| 5 | `frontend/src/components/admin/PermissionManagement.js` | 129 | 114 | admin |
| 6 | `frontend/src/components/admin/SystemConfigManagement.js` | 120 | 65 | admin |
| 7 | `frontend/src/components/admin/VacationManagementModal.js` | 119 | 82 | admin |
| 8 | `frontend/src/constants/adminWebScaffold.js` | 104 | 85 | admin |
| 9 | `frontend/src/components/admin/SessionManagement.js` | 102 | 87 | admin |
| 10 | `frontend/src/components/admin/ClientComprehensiveManagement.js` | 97 | 78 | admin |
| 11 | `frontend/src/components/admin/DashboardManagement.js` | 97 | 73 | admin |
| 12 | `frontend/src/components/admin/WellnessManagement.js` | 96 | 73 | admin |
| 13 | `frontend/src/components/common/UnifiedHeader.js` | 96 | 41 | common-modal |
| 14 | `frontend/src/components/admin/VacationStatistics.js` | 95 | 65 | admin |
| 15 | `frontend/src/components/admin/MappingCreationModal.js` | 86 | 82 | admin |
| 16 | `frontend/src/components/admin/WidgetBasedAdminDashboard.js` | 82 | 64 | admin |
| 17 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | 80 | 76 | admin |
| 18 | `frontend/src/components/admin/DashboardWidgetEditor.js` | 79 | 63 | admin |
| 19 | `frontend/src/components/admin/system/TestNotificationForm.js` | 76 | 67 | admin |
| 20 | `frontend/src/components/admin/UserManagement.js` | 74 | 64 | admin |

> Top-20 합계 2,489 라인 / 트랙 A 9,181 의 27.1% — 어드민 광역 컴포넌트 20개 치환만으로 트랙 A 1/4 진척 가능.

> **공통(common-modal) Top 5** (참고): UnifiedHeader 96 · UnifiedModal 27 · ChatScreen 18 · ConsultantApplicationModal 49 · StatisticsModal 41.

---

## §3 트랙 B 상세 (settings / statistics / report 분포)

### 3.1 트랙 B 서브카테고리 분포

| 서브카테고리 | 파일 수 | 한국어 라인 | 실효 |
|---|---:|---:|---:|
| **report** | 7 | 242 | 198 |
| **statistics** | 7 | 127 | 85 |
| **settings** | 4 | 92 | 75 |
| **합계** | **18** | **461** | **358** |

### 3.2 트랙 B 전체 파일

| 파일 | 한국어 라인 | 서브카테고리 |
|---|---:|---|
| `frontend/src/components/consultation/ConsultationReport.js` | 71 | report |
| `frontend/src/components/clinical/DiagnosticReportEditor.js` | 62 | report |
| `frontend/src/components/erp/ErpReportModal.js` | 58 | report |
| `frontend/src/components/statistics/PerformanceMetricsModal.js` | 53 | statistics |
| `frontend/src/components/settings/UserSettings.js` | 41 | settings |
| `frontend/src/components/client/ClientSettings.js` | 30 | settings |
| `frontend/src/components/consultant/ConsultantIncomeReport.js` | 22 | report |
| `frontend/src/components/ui/Statistics/ConsultantRatingStatisticsView.js` | 21 | statistics |
| `frontend/src/components/ui/Statistics/ConsultationCompletionStatsView.js` | 17 | statistics |
| `frontend/src/utils/psychReportHeadingChecks.js` | 16 | report |
| (나머지 8건) | … | … |

> **관측**: 합의서 §1.5 의 B 가늠 1,002 라인은 **다중 카테고리 광역 매칭** (admin · 보조 화면 키워드 중복) 으로 산출된 값. 단일 카테고리 분류 (admin 파일은 A 흡수) 적용 시 461 라인으로 감소. **A → B 진척 시 추가로 흡수되는 admin/dashboard 영역 통계·보고서 화면** 은 트랙 A 또는 후속 namespace (statistics/report) 신설로 흡수.

> **권고**: PR-B 진입 시 단순 18 파일 치환에 머무르지 말고, 트랙 D 의 `dashboard`·`statistics 키워드 admin 외 영역` (예: `IntegratedFinanceDashboard.js` 338 라인 등 dashboard ns) 의 보고서·통계 부분을 보조로 흡수 권장.

---

## §4 트랙 C alert/confirm 인벤토리

### 4.1 window.alert / window.confirm 정확 인벤토리

| 유형 | 호출 수 | 비고 |
|---|---:|---|
| `window.alert(` | **1** | `frontend/src/utils/notification.js:191` (wrapper 함수 내부 — fallback) |
| `window.confirm(` | **10** | 합의서 §1.4 9건 대비 **+1** (academy 3 + admin 2 + clinical 2 + schedule 1 + utils 1 + onboarding 1) |
| **window 호출 합계** | **11** | 모두 트랙 C 흡수 대상 |

**`window.confirm` 호출 위치 (10건 전수)**:

| # | 파일 | 라인 | 메시지 (snippet) |
|---:|---|---:|---|
| 1 | `frontend/src/components/academy/ClassList.js` | 72 | `if (!window.confirm('정말 삭제하시겠습니까?'))` |
| 2 | `frontend/src/components/academy/CourseList.js` | 75 | `if (!window.confirm('정말 삭제하시겠습니까?'))` |
| 3 | `frontend/src/components/academy/EnrollmentList.js` | 69 | `if (!window.confirm('정말 수강을 취소하시겠습니까?'))` |
| 4 | `frontend/src/components/admin/DashboardManagement.js` | 173 | `const confirmed = window.confirm(...)` |
| 5 | `frontend/src/components/admin/aiProvider/sections/ApiKeyManager.js` | 62 | `const ok = window.confirm(API 키를 삭제하시겠습니까?)` |
| 6 | `frontend/src/components/admin/onboarding/AdminOnboarding.jsx` | 59 | `if (!window.confirm(ONBOARDING_MESSAGES.CONFIRM_APPROVE))` |
| 7 | `frontend/src/components/clinical/DiagnosticReportEditor.js` | 112 | `const confirmed = window.confirm(...)` |
| 8 | `frontend/src/components/clinical/SOAPNoteEditor.js` | 70 | `const confirmed = window.confirm(...)` |
| 9 | `frontend/src/components/schedule/ScheduleClientNotesSection.js` | 233 | `const ok = window.confirm('이 특이사항을 삭제할까요?')` |
| 10 | `frontend/src/utils/notification.js` | 176 | `const result = window.confirm(message)` (wrapper) |

**`window.alert` 호출 위치 (1건)**: `frontend/src/utils/notification.js:191` `window.alert(message);` — wrapper.

### 4.2 bare `alert(` / `confirm(` 호출 분리

| 유형 | 총 호출 | 한국어 포함 | 도메인 호출 (notification.js method 제외) | 테스트/storybook | 운영 도메인 |
|---|---:|---:|---:|---:|---:|
| bare `alert(` | 12 | 6 | 11 | 5 (Icon.stories 4 + Card.test 1) | 6 |
| bare `confirm(` | 2 | 1 | 1 | 0 | 1 |
| **합계** | **14** | **7** | **12** | **5** | **7** |

**운영 도메인 bare 호출 (P2-c 트랙 C 직접 치환 대상)**:

| # | 파일 | 라인 | 호출 (snippet) | 카테고리 |
|---:|---|---:|---|---|
| 1 | `frontend/src/components/community/CommunityFeed.js` | 140 | `alert('신고가 접수되었습니다. 관리자가 검토 후 처리합니다.');` | 도메인 한국어 |
| 2 | `frontend/src/components/admin/onboarding/AdminOnboarding.jsx` | 68 | `alert(ONBOARDING_MESSAGES.APPROVE_SUCCESS);` | 도메인 상수 |
| 3 | `frontend/src/components/admin/onboarding/AdminOnboarding.jsx` | 72 | `alert(ONBOARDING_MESSAGES.ERROR_DECISION);` | 도메인 상수 |
| 4 | `frontend/src/components/admin/onboarding/AdminOnboarding.jsx` | 80 | `alert(ONBOARDING_MESSAGES.REJECT_REASON_REQUIRED);` | 도메인 상수 |
| 5 | `frontend/src/components/admin/onboarding/AdminOnboarding.jsx` | 91 | `alert(ONBOARDING_MESSAGES.REJECT_SUCCESS);` | 도메인 상수 |
| 6 | `frontend/src/components/admin/onboarding/AdminOnboarding.jsx` | 96 | `alert(ONBOARDING_MESSAGES.ERROR_DECISION);` | 도메인 상수 (중복) |
| 7 | `frontend/src/components/tenant/TenantProfile.js` | 223 | `if (!confirm('정말 이 결제 수단을 삭제하시겠습니까?'))` | 도메인 한국어 |

**테스트/storybook (치환 우선순위 낮음)**:
- `frontend/src/components/ui/Icon/Icon.stories.js` 90~93 — 4건 (스토리북 데모)
- `frontend/src/components/ui/Card/Card.test.example.js` 35 — 1건 (테스트 예시)

**method shorthand 정의 (호출 아님, 보고만)**:
- `frontend/src/utils/notification.js:175` `confirm(message, callback) {` — wrapper method
- `frontend/src/utils/notification.js:190` `alert(message, callback) {` — wrapper method

> **합의서 §1.4 가늠 (bare 50) 와의 차이**: 합의서 50건은 `alert\|confirm` 식별자 광역 매칭 (정의·호출·import·테스트 헬퍼 포함)으로 추정. 본 인벤토리는 **호출 라인** (정규식 `(?<![\w.])(alert|confirm)\s*\(`) 만 측정 → 14건. 운영 치환 대상은 **7건** (P2-c 위임 시 본 7건을 우선).

### 4.3 UnifiedModal 사용처 인벤토리

| 항목 | 값 |
|---|---:|
| UnifiedModal 총 출현 (import + JSX + prop) | **450** |
| `<UnifiedModal` JSX + `useConfirm/useAlert` 호출 라인 | **142** |
| UnifiedModal 활성 사용 파일 | **112** |
| `useConfirm()` 훅 사용 파일 | **0** |
| `useAlert()` 훅 사용 파일 | **0** |

> 합의서 §1.4 "UnifiedModal 사용 422 라인" 은 광역 occurrence (450 와 근사) 측정. 실제 JSX 사용은 142 라인. **`useConfirm`/`useAlert` 훅은 현재 0건** — 트랙 C 진입 시 SSOT 훅 신설 + 142 JSX 사용처 i18n props (`titleKey`, `messageKey`, `confirmLabelKey`) 정합 필요 (P2-c 위임 프롬프트 §4.1).

---

## §5 namespace 분할 후보

### 5.1 현재 ko leaves (Phase 1 부트스트랩 정착 + D11 이전 확장 분)

| 파일 | leaves | 합의서 §1.3 |
|---|---:|---:|
| `frontend/src/locales/ko/admin.json` | **350** | 230 (+120) |
| `frontend/src/locales/ko/common.json` | **60** | 60 (동일) |
| **합계** | **410** | 290 (+120, +41.4%) |

> Phase 1 정착 후 admin namespace 가 230 → 350 leaves 로 +120 확장됨 (D9~D11 라운드 동안 산발적 추가 추정). common namespace 는 60 leaves 그대로 유지.

### 5.2 합의서 §3 권장 7개 namespace — 한국어 라인 검증

| namespace | 파일 수 | 한국어 라인 | 실효 i18n 대상 | 합의서 권장 | PR 트랙 |
|---|---:|---:|---:|---|---|
| **admin** | 210 | 6,349 | 4,765 | ✅ (확장 — 350 → ~1,200 leaves 가늠) | PR-A |
| **common** | 97 | 1,753 | 1,013 | ✅ (확장 — 60 → ~250 leaves) | PR-A |
| **error** | 22 | 565 | 345 | ✅ (신설) | PR-A |
| **settings** | 4 | 92 | 75 | ✅ (신설) | PR-B |
| **statistics** | 7 | 127 | 85 | ✅ (신설) | PR-B |
| **report** | 7 | 242 | 198 | ✅ (신설) | PR-B |
| **schedule** | 40 | 1,509 | 1,002 | ✅ (신설 — 후속 라운드 권장) | PR-B+ 또는 D5 P5 |
| **payment** | 16 | 908 | 610 | ✅ (신설 — 후속 라운드) | D5 P5 |
| **consultation** | 82 | 2,494 | 1,870 | ✅ (신설 — 후속 라운드) | D5 P5 |
| **합계 (권장 7개)** | **485** | **14,039** | **9,963** | — | — |

> 권장 7개 namespace 한국어 라인 14,039 / 전체 29,898 = **47.0%** — D5 P4 KPI N=15,000 (-49%) 도달 시 본 영역 광역 흡수가 필수 조건.

### 5.3 추가 분할 후보 (합의서 §3 미포함, 본 인벤토리 권장)

| namespace | 파일 수 | 한국어 라인 | 실효 | 비고 |
|---|---:|---:|---:|---|
| **dashboard** | 92 | 2,889 | 2,094 | dashboard / dashboard-v2 광역. admin 흡수 가능하나 분리 권장 |
| **system** | 76 | 1,966 | 1,429 | ops/ui/tenant/super-admin/compliance — 시스템 관리 |
| **erp** | 58 | 1,407 | 1,117 | erp/finance/salary/purchase/budget |
| **auth** | 23 | 1,095 | 708 | 로그인/회원가입 |
| **client** | 47 | 939 | 787 | client/mypage — 내담자 영역 |
| **wellness** | 25 | 552 | 418 | wellness/emotion/healing/psych/clinical/prediction |
| **layout** | 11 | 172 | 108 | LNB/GNB — common 흡수 가능 |
| **misc** | 183 | 6,675 | 3,323 | utils/constants/services 등 — namespace 신설보다 라인별 흡수 |

### 5.4 PR 트랙별 namespace 결정 권고

- **PR-A** (트랙 A 1순위): `admin` 확장 + `common` 확장 + `error` 신설. 3개 namespace 로 트랙 A 9,181 라인 + ONBOARDING_MESSAGES 상수 흡수.
- **PR-B** (트랙 B 2순위): `settings` + `statistics` + `report` 3개 namespace 신설. + `schedule` 신설 권장 (B 가늠 461 라인은 schedule 1,509 라인을 흡수하면 ~2,000 으로 확장).
- **PR-C** (트랙 C 3순위): 별도 namespace 신설보다 `error` (PR-A 신설) + `common` (PR-A 확장) 흡수. UnifiedModal i18n props 키는 `common.modal.*` + `error.message.*` 패턴.
- **후속 라운드 (D5 P5 / D12+)**: `payment`, `consultation`, `dashboard`, `erp`, `wellness` 등 도메인 namespace 신설.

---

## §6 KPI 기준선 갱신

### 6.1 KPI 매트릭스 (합의서 §3 vs 현재 vs Phase 2 권장 목표)

| KPI | 합의서 §3 기준선 (`c31a498df`, 2026-05-23) | **현재 (`9e22d9e4c`, 2026-05-26)** | 변화 | Phase 2 종료 권장 목표 (§5.8 C4=a) | 도달률 (현재→목표) |
|---|---:|---:|---:|---|---:|
| 한국어 라인 (JS/TS) | 29,279 | **29,898** | +619 (+2.1%) | **< 15,000 (-49.8% from current)** | 0% (PR-A~C 진입 전) |
| 한국어 매칭 파일 수 | 987 | **1,011** | +24 (+2.4%) | — (지표 외) | — |
| `t(` 호출 라인 | 932 | **1,012** | +80 (+8.6%) | **> 3,000 (+196%)** | 33.7% |
| `useTranslation` 사용 파일 | 275 | **275** | 0 | **> 500 (+81.8%)** | 55.0% |
| ko leaves (common + admin) | 290 (60 + 230) | **410 (60 + 350)** | +120 (+41.4%) | **> 1,500 (+265.9%)** | 27.3% |
| `window.alert` | 1 | **1** | 0 | 0 | 0% |
| `window.confirm` | 9 | **10** | **+1** | 0 | 0% |
| UnifiedModal 사용 (광역) | 422 | **450** | +28 (+6.6%) | — (모달 SSOT 유지) | — |
| UnifiedModal JSX 활성 사용 | (미측정) | **142** | — | — | — |
| `useConfirm`/`useAlert` 훅 사용 | (미측정) | **0** | — | (PR-C 신설 후 > 50) | 0% |

### 6.2 KPI 권고 (P0-inv 후 보정)

- **한국어 라인 목표**: 합의서 §5.8 C4=a (N=15,000) 는 합의서 시점 29,279 기준 -49% 였음. 현재 29,898 기준으로는 **-49.8%** 와 동등 — 합의서 N=15,000 유지 권장 (절대값).
- **ko leaves 목표**: 합의서 §3 K=1,500 은 290 기준 +1,210. 현재 410 기준으로 **+1,090 leaves 신설** 필요. PR-A 확장 +400 (admin 350→750 + common 60→260 + error 0→190) + PR-B 신설 +200 (settings 75 + statistics 80 + report 150) + PR-C 흡수 +50 + 후속 라운드 +400 가늠.
- **`t()` 호출**: 합의서 +222% (932 → 3,000). 현재 1,012 기준으로 **+1,988 호출** 필요. 트랙 A 6,494 실효 라인 → ~50% 가 `t()` 치환 가능 ≒ 3,250 신규 호출 — PR-A 만으로 목표 도달 가능.
- **`useTranslation` 사용 파일**: 275 → 500 (+225 파일). PR-A 트랙 A 355 파일 중 `useTranslation` 미사용 추가 분이 +200~+250 가늠.

---

## §7 P1 디자이너 핸드오프 입력 (트랙 A 카피 합의 영역)

> **주의**: 본 §7 은 P1 (`core-designer`, `gemini-3.1-pro`) 핸드오프 시 입력으로 사용. P0-inv 단계는 인벤토리만 산출, 카피·키 명명은 P1 결정 사항.

### 7.1 디자이너 카피 합의 필요 영역 (트랙 A 1순위)

| 영역 | 한국어 라인 | 합의 필요 항목 |
|---|---:|---|
| **LNB / GNB / 헤더** | layout 172 + common UnifiedHeader 96 + dashboard-v2 GNB 211 ≒ **480** | 메뉴명·서브메뉴명·계정 메뉴·알림 헤더 (LNB 260px 너비 / GNB 64px 높이 제약) |
| **UnifiedModal 제목·라벨** | common-modal 1,753 (UnifiedModal 활성 142 + 관련 모달·헤더) | 모달 제목 / 확인·취소 라벨 / 표준 메시지 톤 (확인/주의/오류) |
| **AdminDashboard / 위젯** | admin 275 (AdminDashboard) + 위젯 군 (BaseWidget 43 등) | 위젯 제목·요약·버튼 라벨·빈 상태(empty state) 메시지 |
| **AdminUser / ConsultantComprehensive 류** | admin 270 + 97 + … | 사용자 관리 / 상담사 관리 폼 필드 라벨·검증 메시지·테이블 헤더 |
| **error / toast / notification** | 565 (NotificationContext 68 + NotificationDropdown 44 + AdminMessageListBlock 41 등) | 에러 메시지 톤(표준화: 일반/주의/심각) + 토스트 길이 제약(40자) + 알림 표준 카피 |

### 7.2 P1 결정 사항 (P0-inv 후 즉시 핸드오프)

1. **키 명명 규약 적용 검증**: Phase 1 패턴 `domain.feature.element.purpose` (admin.dashboard.widget.title) 답습 + 신설 namespace (`error`) 의 키 구조 결정.
2. **error namespace 톤 합의**: `error.validation.*` (폼 검증) / `error.api.*` (서버 에러) / `error.network.*` (네트워크) / `error.business.*` (비즈니스 로직) — 톤·심각도 표준.
3. **UnifiedModal 표준 카피**: `common.modal.confirm.title` / `common.modal.confirm.message` / `common.modal.alert.title` / `common.action.{confirm,cancel,close,save,delete}` — useConfirm/useAlert 훅 신설 시 기본 카피 SSOT.
4. **LNB 메뉴명 SSOT**: `MenuConstants.js` 115 라인 (한국어) 매핑 — `layout.lnb.{key}` 또는 `admin.lnb.{key}`. 메뉴명 SSOT 와 i18n 키 정합 필요.
5. **AdminOnboarding ONBOARDING_MESSAGES**: 상수 5건 (APPROVE_SUCCESS / ERROR_DECISION / REJECT_REASON_REQUIRED / REJECT_SUCCESS / CONFIRM_APPROVE) — `error.onboarding.*` 키로 흡수 vs 상수 유지 + 키 매핑 결정.

---

## §8 관측 사항 / 위험 / 권장

### 8.1 관측 사항

1. **트랙 D 잔여 20,245 라인이 큼**: 합의서 §1.5 가늠 17,066 보다 +3,179 증가. dashboard/consultation/schedule/erp/auth 도메인 광역 (~10,000 라인) — 본 라운드(PR-A~C) 미포함, **D5 P5 / D12+ 후속 라운드 필수**.
2. **`useTranslation` 사용 파일 275 변동 없음**: 합의서 시점 동일. D11 라운드는 디자인 토큰 트랙으로 i18n 미진척. PR-A 진입 시 +200~250 가늠.
3. **ko admin.json 230 → 350 leaves 증가**: 합의서 시점 이후 D10~D11 사이 +120 leaves 신설됨 (D11 라운드 부산물 추정). 본 인벤토리는 현재 410 leaves 를 기준선으로 채택.
4. **window.confirm 10건 vs 합의서 9건**: ApiKeyManager(API 키 삭제) 가 합의서 측정 이후 추가됨. P2-c 트랙 C 진입 시 본 10건 + bare 7건 = 17건 일괄 치환 대상.
5. **UnifiedModal 활성 JSX 142 라인 / useConfirm·useAlert 훅 0건**: 합의서 §1.4 "useConfirm/useAlert 훅 SSOT 통합" 권고는 현 시점 **훅 미정착** 상태 — P2-c 위임 시 훅 신설 + 142 JSX 사용처 i18n props 일괄 치환 필요.

### 8.2 위험

- **D11 라운드 정착 SHA 와 D5 P4 P0-inv SHA 정합**: 본 측정은 develop `9e22d9e4c` (HEAD: D11 P3 시각 회귀 검수 정합). D11 P4 운영 push 직전 시점. 본 인벤토리는 D11 정착 이후에도 안정 (i18n 측정값은 D11 디자인 토큰 트랙과 독립 — §0.3 영역 분리).
- **AdminOnboarding ONBOARDING_MESSAGES 상수 흡수 정책 미합의**: P1 에서 상수 유지 + 키 매핑 vs 상수 제거 + i18n 직접 결정 필요. P2-c 진입 전 합의 우선순위.
- **constants 디렉터리 (트랙 D 일부) 한국어 라인 ~1,000**: `constants/messages.js` 157 + `constants/integratedFinanceDashboardStrings.js` 214 + `constants/MenuConstants.js` 115 + `constants/financialManagementStrings.js` 182 등. 본 라운드 미포함, **constants SSOT i18n 정합** 후속 별도 합의 필요.
- **사용자 정의 `useAlert`/`useConfirm` 훅 식별 정확성**: 본 인벤토리는 `function alert\|const alert =\|export ... useAlert\|useConfirm` 패턴 단순 매칭. 객체 method shorthand (`alert(message, callback) {`) 는 호출과 구분 불가하여 bare 호출에 false positive 1건 포함 — `notification.js` 의 method 정의 2건은 트랙 C 치환 대상에서 명시 제외 권고.
- **테스트/storybook 한국어 라인 포함**: Icon.stories.js 4건 / Card.test.example.js 1건 등은 운영 영향 무. 트랙 C 치환 우선순위 낮음. 별도 lint 규칙(`*.stories.js`/`*.test.example.js` 제외) 권고.

### 8.3 권장

1. **PR-A 진입 시 Top-20 우선 치환**: §2.2 의 상위 20 컴포넌트 (2,489 라인, 트랙 A 27%) 를 우선 (단일 PR 또는 PR-A 1차 청크). 잔여 트랙 A 335 파일은 PR-A 2~3차 청크로 분할.
2. **namespace 신설 순서**: PR-A 시 `error` 신설 → `common` 확장 → `admin` 확장 동시 진행. 신설 namespace 는 `i18n/index.js` `resources.ko.{ns}` + `ns` 배열 1줄 추가만 필요.
3. **constants 디렉터리 처리**: `constants/messages.js`·`MenuConstants.js`·`integratedFinanceDashboardStrings.js` 등은 한국어 문자열 SSOT 가 이미 상수로 정착. P2-a 위임 시 상수 → i18n 키 매핑 정책 합의 필요 (상수 유지 + 키 매핑 vs 상수 제거 + i18n 직접).
4. **테스트/storybook 제외 lint 권장**: 본 라운드 P3 검수에 `*.stories.js`/`*.test.*` 한국어 매칭 제외 lint 규칙 신설 권고 — 향후 KPI 측정 정합.
5. **D11 P4 운영 push 완료 후 즉시 P1 핸드오프**: 본 P0-inv 산출 4개 JSON + 본 마크다운을 입력으로 `core-designer` (gemini-3.1-pro) 위임. P1 산출은 `docs/project-management/2026-05-{XX}/D5_P4_P1_DESIGN_HANDOFF_I18N.md`.

---

## §9 후속 (PR-A 진입 시 우선 치환 컴포넌트)

### 9.1 PR-A 1차 청크 — Top-20 (어드민 광역)

| # | 파일 | 라인 | namespace 매핑 | 비고 |
|---:|---|---:|---|---|
| 1 | `components/admin/AdminDashboard.js` | 275 | admin | 어드민 메인 — 위젯/요약/상태 카드 |
| 2 | `components/admin/ConsultantComprehensiveManagement.js` | 270 | admin | 상담사 종합 관리 — 폼·테이블·필터 |
| 3 | `components/dashboard-v2/AdminDashboardV2.js` | 211 | admin (or dashboard) | v2 어드민 대시보드 |
| 4 | `components/admin/DashboardFormModal.js` | 181 | admin | 대시보드 폼 모달 (다수 주석) |
| 5 | `components/admin/PermissionManagement.js` | 129 | admin | 권한 관리 |
| 6 | `components/admin/SystemConfigManagement.js` | 120 | admin | 시스템 설정 |
| 7 | `components/admin/VacationManagementModal.js` | 119 | admin | 휴가 관리 모달 |
| 8 | `constants/adminWebScaffold.js` | 104 | admin | 어드민 메뉴 스캐폴드 (상수) |
| 9 | `components/admin/SessionManagement.js` | 102 | admin | 세션 관리 |
| 10 | `components/admin/ClientComprehensiveManagement.js` | 97 | admin | 내담자 종합 관리 |
| 11 | `components/admin/DashboardManagement.js` | 97 | admin | 대시보드 관리 |
| 12 | `components/admin/WellnessManagement.js` | 96 | admin | 웰니스 관리 |
| 13 | `components/common/UnifiedHeader.js` | 96 | common | 통합 헤더 (1순위) |
| 14 | `components/admin/VacationStatistics.js` | 95 | admin | 휴가 통계 |
| 15 | `components/admin/MappingCreationModal.js` | 86 | admin | 매핑 생성 모달 |
| 16 | `components/admin/WidgetBasedAdminDashboard.js` | 82 | admin | 위젯 기반 어드민 |
| 17 | `components/admin/ClientComprehensiveManagement/ClientModal.js` | 80 | admin | 내담자 모달 |
| 18 | `components/admin/DashboardWidgetEditor.js` | 79 | admin | 위젯 편집기 |
| 19 | `components/admin/system/TestNotificationForm.js` | 76 | admin (system) | 테스트 알림 폼 |
| 20 | `components/admin/UserManagement.js` | 74 | admin | 사용자 관리 |

**Top-20 합계**: 2,489 한국어 라인 / 트랙 A 9,181 의 **27.1%**.

### 9.2 PR-A 2차 청크 (참고)

상위 21~50위 + `components/common/` Top 10 + `error/toast` 22 파일 전수. 가늠 ~3,000 라인. PR-A 누적 ~5,500 라인 흡수 — 트랙 A 60% 도달.

### 9.3 PR-A 3차 청크 + PR-B/C 잔여

PR-A 잔여 ~3,700 라인 (트랙 A 잔여) + PR-B 461 + PR-C 11 (라인 단위) + 트랙 D 부분 흡수 (constants/messages 류 ~600 라인) ≒ **+4,800 라인**. PR-A~C 누적 ~10,300 라인 흡수 → 한국어 라인 29,898 - 10,300 ≒ **19,600** — KPI N=15,000 도달 위해 후속 라운드(D5 P5)에서 트랙 D 도메인 namespace (dashboard/schedule/consultation/erp) 신설 필요.

---

## §10 산출물 절대 경로 (신규 5건)

| # | 절대 경로 | 종류 |
|---:|---|---|
| 1 | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-trackA-20260526.json` | JSON (트랙 A) |
| 2 | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-trackB-20260526.json` | JSON (트랙 B) |
| 3 | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-trackC-20260526.json` | JSON (트랙 C) |
| 4 | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-namespace-20260526.json` | JSON (namespace 분할 후보) |
| 5 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY.md` | 본 문서 |

> **가드 확인**: 운영 코드(`frontend/src/**`·`scripts/**`·`docs/standards/**`·`frontend/src/i18n/index.js`·`frontend/src/locales/**`) **0줄 수정**. `develop` 브랜치 커밋·푸시 없음 (산출 파일만 생성).

# D5 P4 i18n Phase 2 — P0-inv-c2 2차 청크 인벤토리 보고서 (2026-05-26)

> **산출 유형**: 인벤토리 보고서 (read-only). 운영 코드 `frontend/src/**`, `frontend/src/i18n/index.js`, `frontend/src/locales/**`, `scripts/**` 0줄 수정.
> **위임 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §4.1 P0-inv + §6.1 PR-INV (2차 청크 PR-D/E/F 분배 사전 측정)
> **선행 산출물**: `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY.md` (1차 청크 시작 시점 = `c31a498df` 보정 → `9e22d9e4c`)
> **산출물 동반**:
> - `reports/d5-p4-i18n-inventory-c2-trackA-20260526.json`
> - `reports/d5-p4-i18n-inventory-c2-trackD-20260526.json`

---

## §0 메타

| 항목 | 값 |
|---|---|
| 측정 일자 | 2026-05-26 (KST 03:47 ±) |
| 측정 브랜치 | `develop` (working tree clean) |
| 측정 SHA (develop HEAD) | `d3586eab8` |
| 운영 main HEAD (1차 청크 정착) | `20e3a2012` (Frontend deploy `26413867294` success) |
| 1차 청크 P0-inv 기준 SHA (비교 기준) | `9e22d9e4c` (이전 보고서) |
| 합의서 SHA | `8b89df494` (D5 P4 §5.8 일괄 채택본) |
| 측정 도구 | Python 3.9 재귀 스캔 (`/tmp/i18n_inventory_c2.py`) + 보조 Grep tool (ripgrep 내부) |
| 분류 우선순위 | **A > C > B > D** (단일 카테고리, A 파일은 전체 라인 흡수, C 는 alert/confirm 라인 단위) |
| 스캔 범위 | `frontend/src/**/*.{js,jsx,ts,tsx}` (총 1,060 파일) |
| 한국어 매칭 패턴 | `[\u3131-\u318F\uAC00-\uD7A3]` (한글 자모·완성형) |
| 주석 제외 패턴 | `^\s*(//\|\*\|/\*)` |
| C 트랙 라인 기준 | `window\.(alert\|confirm)` 또는 bare `alert\|confirm` (단, `notificationManager.alert/confirm` 제외) + 동일 라인 한국어 포함 |

게이트 준수: 운영 코드 수정 0건, develop commit/push 0건, Flyway/DB 변경 0건. 본 보고서·JSON 만 신규 생성.

---

## §1 트랙별 잔존 라인 매트릭스 (1차 청크 시작 vs 2차 청크 시작 = 현재)

### 1.1 트랙 합계 변화

| 트랙 | 기준 | 1차 청크 시작 (`9e22d9e4c`) | 현재 (`d3586eab8`) | Δ (라인) | Δ (실효) | 비고 |
|---|---|---:|---:|---:|---:|---|
| **A** | admin · layout · components/common · error/toast/notify 파일 | 9,181 / 6,494 (355 파일) | **8,863 / 6,255 (340 파일)** | **−318 (−3.5%)** | −239 (−3.7%) | 1차 청크 PR-A/B 흡수 결과: admin·common·layout·error 6 namespace 정착. ko leaves +975 (410→1,385). |
| **B** | settings · statistics · report 파일 (A 외) | 461 / 358 (18 파일) | **450 / 351 (18 파일)** | **−11 (−2.4%)** | −7 (−2.0%) | settings/statistics/report 신규 namespace 정착 (113+112+145 leaves) 후 잔존. |
| **C** | bare/window alert·confirm 한국어 호출 라인 (A 외) | 11 / 11 (8 파일) | **6 / 6 (3 파일)** | **−5 (−45%)** | −5 (−45%) | useConfirm/useAlert 훅 정착 결과. window.* 운영 0 도달. |
| **D** | 잔여 (A/B/C 외) | 20,245 / 13,229 (630 파일) | **20,583 / 13,477 (655 파일)** | **+338 (+1.7%)** | +248 (+1.9%) | 2차 청크 주력 영역. constants/_Strings.js 군집 + erp/auth/schedule/dashboard 광역. 1차 청크 동안 D11/D5-P4 외 신규 코드 증가 반영. |
| **합계** | — | **29,898 / 20,092 (1,011 파일)** | **29,902 / 20,089 (1,013 파일)** | **+4 (+0.013%)** | −3 | 총량은 사실상 정체. A→i18n key 이관 ↔ D 신규 증가로 상쇄. |

> **해석**: 1차 청크는 **A 영역 318 라인을 i18n key 로 흡수** (admin·common·layout·error 6 namespace 정착) 했고, 동기간 D 영역(erp·auth·dashboard·schedule·constants/_Strings 군집) 에 +338 라인 신규/잔존이 발생해 총량은 +4 라인으로 정체. 2차 청크의 진짜 KPI 추진 영역은 **D 트랙 + A 트랙 Top-20 잔존** 이다.

### 1.2 트랙별 파일 수 분포

| 트랙 | 전체 파일 수 | 한국어 포함 파일 수 | 평균 라인/파일 |
|---|---:|---:|---:|
| A | 349 | 340 | 26.1 |
| B | 19 | 18 | 25.0 |
| C | — | 3 (라인 단위 6) | — |
| D | 692 | 655 | 31.4 |
| **합계** | **1,060** | **1,016** | 29.4 |

> 평균이 가장 높은 D 트랙은 광역 분포 + 일부 거대 파일(IntegratedFinanceDashboard.js 338줄, integratedFinanceDashboardStrings.js 214줄) 영향.

### 1.3 실효 i18n 대상 (주석 제외)

전체 29,902 라인 중 **주석 라인 9,813 (32.8%) 제외 → 실효 20,089 (67.2%)**. 트랙별 주석 비중은 A 29% (admin JSDoc 다수) / D 35% (constants 파일이 JSDoc·블록주석 다용). P2 코더 실제 치환 작업량 가늠치는 실효 라인 기준.

---

## §2 트랙 A 잔존 Top-20 (한국어 라인 내림차순)

| # | 파일 경로 | 라인 (총) | 실효 | namespace 후보 | 비고 |
|---:|---|---:|---:|---|---|
| 1 | `frontend/src/components/admin/AdminDashboard.js` | 275 | 265 | `admin.dashboard.*` | 1차 청크 정착 보강 필요 (관리자 메인) |
| 2 | `frontend/src/components/admin/ConsultantComprehensiveManagement.js` | 270 | 223 | `admin.consultant.*` | 상담사 종합관리 (필터·테이블 다수) |
| 3 | `frontend/src/components/dashboard-v2/AdminDashboardV2.js` | 211 | 181 | `admin.dashboardV2.*` | v2 신규 대시보드 (notificationManager 1건 포함) |
| 4 | `frontend/src/components/admin/DashboardFormModal.js` | 181 | 93 | `admin.dashboard.form.*` | 위젯 폼 모달 (JSDoc 비중 ↑) |
| 5 | `frontend/src/components/admin/PermissionManagement.js` | 129 | 114 | `admin.permission.*` | 권한 관리 |
| 6 | `frontend/src/components/admin/SystemConfigManagement.js` | 120 | 65 | `admin.systemConfig.*` | 시스템 설정 (테스트 케이스 보유) |
| 7 | `frontend/src/components/admin/VacationManagementModal.js` | 119 | 82 | `admin.vacation.*` | 휴가 관리 모달 |
| 8 | `frontend/src/components/admin/SessionManagement.js` | 102 | 87 | `admin.session.*` | 세션 관리 |
| 9 | `frontend/src/components/admin/ClientComprehensiveManagement.js` | 97 | 78 | `admin.client.*` | 내담자 종합관리 (Top-16 의 ClientModal 동반) |
| 10 | `frontend/src/components/common/UnifiedHeader.js` | 96 | 41 | `common.header.*` | 통합 헤더 (메뉴/알림 토글) |
| 11 | `frontend/src/components/admin/DashboardManagement.js` | 96 | 72 | `admin.dashboard.management.*` | 대시보드 레이아웃 관리 |
| 12 | `frontend/src/components/admin/WellnessManagement.js` | 96 | 73 | `admin.wellness.*` | 웰니스 관리 |
| 13 | `frontend/src/components/admin/VacationStatistics.js` | 95 | 65 | `admin.vacation.statistics.*` (또는 `statistics.vacation.*`) | 휴가 통계 — B/A 경계, A 우선 |
| 14 | `frontend/src/components/admin/MappingCreationModal.js` | 86 | 82 | `admin.mapping.*` | 매핑 생성 모달 |
| 15 | `frontend/src/components/admin/WidgetBasedAdminDashboard.js` | 82 | 64 | `admin.dashboard.widget.*` | 위젯 기반 대시보드 |
| 16 | `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js` | 80 | 76 | `admin.client.modal.*` | 내담자 상세 모달 |
| 17 | `frontend/src/components/admin/DashboardWidgetEditor.js` | 79 | 63 | `admin.dashboard.widget.editor.*` | 위젯 편집기 |
| 18 | `frontend/src/components/admin/system/TestNotificationForm.js` | 76 | 67 | `admin.system.notification.*` | 테스트 알림 폼 |
| 19 | `frontend/src/components/admin/UserManagement.js` | 74 | 64 | `admin.user.*` | 사용자 관리 |
| 20 | `frontend/src/components/common/TermsOfService.js` | 72 | 70 | `common.terms.*` | 이용약관 (long-form 텍스트) |
| **소계** | — | **2,436** | **1,949** | — | A 트랙 8,863 라인 중 **27.5%** 가 Top-20 에 집중 |

> **PR-D 환수 가늠**: Top-20 잔존 2,436 라인 중 실효 1,949 라인을 namespace 키로 치환 시 t() 호출 +600~800, ko leaves +500~700 예상. admin.json (현재 703 leaves) 가 ~1,200~1,400 으로 확장될 수 있음.

---

## §3 트랙 D 흡수 가능 Top-20 (한국어 라인 내림차순) + 메시지 상수 군집

### 3.1 트랙 D Top-20 (개별 파일)

| # | 파일 경로 | 라인 (총) | 실효 | 흡수 namespace 후보 | 영역 |
|---:|---|---:|---:|---|---|
| 1 | `frontend/src/components/erp/IntegratedFinanceDashboard.js` | 338 | 290 | `erp.finance.dashboard.*` (신설) | erp |
| 2 | `frontend/src/components/dashboard/DynamicDashboard.js` | 227 | 136 | `dashboard.dynamic.*` (신설 또는 common) | dashboard |
| 3 | `frontend/src/constants/integratedFinanceDashboardStrings.js` | 214 | 192 | `erp.finance.dashboard.strings.*` (위 1과 묶음) | erp constants |
| 4 | `frontend/src/components/auth/TabletLogin.js` | 190 | 110 | `auth.tabletLogin.*` (신설) | auth |
| 5 | `frontend/src/components/auth/UnifiedLogin.js` | 185 | 101 | `auth.unifiedLogin.*` (신설) | auth |
| 6 | `frontend/src/constants/financialManagementStrings.js` | 182 | 178 | `erp.finance.management.strings.*` | erp constants |
| 7 | `frontend/src/constants/schedule.js` | 179 | 117 | `schedule.constants.*` (신설) | schedule constants |
| 8 | `frontend/src/components/dashboard/CommonDashboard.js` | 178 | 171 | `dashboard.common.*` | dashboard |
| 9 | `frontend/src/components/schedule/UnifiedScheduleComponent.js` | 177 | 119 | `schedule.unified.*` | schedule |
| 10 | `frontend/src/utils/widgetVisibilityUtils.js` | 166 | 48 | `common.widget.visibility.*` (또는 utils 잔류) | utils |
| 11 | `frontend/src/components/schedule/ScheduleDetailModal.js` | 161 | 130 | `schedule.detail.*` | schedule |
| 12 | `frontend/src/constants/messages.js` | 157 | 144 | `common.messages.*` 또는 `error.*` 확장 | common/error |
| 13 | `frontend/src/constants/tenantCommonCodeManagerStrings.js` | 155 | 151 | `admin.tenantCommonCode.*` (트랙 A 경계 — 운영 측 A) | admin constants |
| 14 | `frontend/src/constants/commonCodeManagementStrings.js` | 152 | 148 | `admin.commonCode.*` | admin constants |
| 15 | `frontend/src/components/erp/SalaryManagement.js` | 144 | 119 | `erp.salary.*` | erp |
| 16 | `frontend/src/components/tenant/PgConfigurationForm.js` | 144 | 139 | `admin.tenant.pg.*` | tenant/admin |
| 17 | `frontend/src/components/consultant/ConsultationRecordScreen.js` | 139 | 134 | `consultant.record.*` (신설) | consultant |
| 18 | `frontend/src/components/erp/BudgetManagement.js` | 135 | 131 | `erp.budget.*` | erp |
| 19 | `frontend/src/utils/sessionManager.js` | 131 | 57 | `common.session.*` 또는 `error.session.*` | utils |
| 20 | `frontend/src/components/ops/PgApprovalManagement.js` | 124 | 103 | `admin.ops.pg.*` | ops |
| **소계** | — | **3,478** | **2,818** | — | D 트랙 20,583 라인 중 **16.9%** 가 Top-20 에 집중 |

### 3.2 트랙 D — `frontend/src/constants/**` 메시지 상수 군집 (60개 파일, 라인 ≥10 우선)

`*Strings.js` / `*Constants.js` / `messages.js` / `*Config.js` 패턴이 Track D 의 거의 절반을 차지한다. 군집 흡수 시 PR-E 의 ko leaves +300~500 / t() +400~600 달성 가능.

| 군집 카테고리 | 대표 파일 (라인) | 합계 라인 | 권장 namespace |
|---|---|---:|---|
| **erp/finance 상수** | `integratedFinanceDashboardStrings.js` (214), `financialManagementStrings.js` (182) | **396** | `erp.finance.*` (신설) |
| **admin/commonCode 상수** | `tenantCommonCodeManagerStrings.js` (155), `commonCodeManagementStrings.js` (152) | **307** | `admin.commonCode.*` |
| **schedule 상수** | `schedule.js` (179) | **179** | `schedule.*` (신설) |
| **공통 메시지** | `messages.js` (157) | **157** | `common.messages.*` 또는 `error.*` |
| **dashboard 관련 상수** | `dashboardFormModalStrings.js` (114), `pageConfigs.js` (108), `widgetConstants.js` (106), `charts.js` (104) | **432** | `admin.dashboard.*` 또는 `dashboard.*` |
| **메뉴 상수** | `MenuConstants.js` (115), `menu.js` (38), `menuPermissionManagementStrings.js` (46), `quickActionsConfig.js` (44), `gnbQuickActions.js` (11) | **254** | `common.menu.*` |
| **api 메시지/엔드포인트** | `api.js` (105, 실효 10 — 대부분 주석), `apiEndpoints.js` (6) | **111** | (대부분 주석 — 이관 우선순위 낮음) |
| **adminWebScaffold/staffManagement** | `adminWebScaffold.js` (104), `staffManagementStrings.js` (101), `salaryProfileFormModalStrings.js` (90) | **295** | `admin.*` 확장 |
| **session/auth 상수** | `sessionManagement.js` (56), `salaryConstants.js` (83), `account.js` (55), `oauth2.js` (13) | **207** | `common.session.*` / `auth.*` |
| **billing/payment 상수** | `billing.js` (78), `cardTypes.js` (57), `paymentTest.js` (67), `portonePgConfiguration.js` (13), `mapping.js` (85) | **300** | `admin.billing.*` (신설) |
| **stats/dashboard 컨피그** | `stats.js` (55), `dashboard.js` (54), `widgetClasses.js` (33 — 실효 0) | **142** | `statistics.*` 확장 |
| **academy 상수** | `academy.js` (53) | **53** | `academy.*` (신설 또는 common) |
| **adminDashboard 가시성** | `adminDashboard.js` (74), `adminDashboardCardVisibility.js` (15) | **89** | `admin.dashboard.*` |
| **client/mypage 상수** | `clientShopConstants.js` (50), `mypageUi.js` (20), `mypageProfileRoles.js` (4) | **74** | `client.*` / `mypage.*` (신설) |
| **vacation/professional 상수** | `vacation.js` (33), `professionalProviderRoles.js` (32 — 실효 4) | **65** | `admin.vacation.*` |
| **psychAssessment 상수** | `psychAssessmentReasonLabels.js` (25), `psychAssessmentClientConstants.js` (4) | **29** | `admin.psychAssessment.*` |
| **css/디자인 토큰** | `css-variables.js` (84, 실효 58 — 대부분 주석), `designTokens.js` (34, 실효 0), `unifiedDesignTokens.js` (13, 실효 0), `colorThemes.js` (19) | **150** | (D11 토큰 트랙 — i18n 대상 아님, 다수 주석) |
| **로그인/온보딩 상수** | `loginDisplay.js` (24), `onboarding.js` (25), `adminOnboarding.js` (17), `passwordPolicyUi.js` (22), `magicNumbers.js` (87, 실효 19) | **175** | `auth.*` / `admin.onboarding.*` |
| **소소한 상수 (≤15)** | 30+ 파일 (`adminRoutes.js`, `roles.js`, `breakpoints.js`, `layout.js`, `adminShopCatalog.js`, ...) | **~150** | 다수 주석 또는 라우트 명칭 — 우선순위 낮음 |
| **합계 (≥10 라인)** | — | **~3,565** | — |

> **권장 흡수 전략 (PR-E)**: erp/finance 군집 (396) + admin/commonCode (307) + schedule 상수 (179) + common.messages (157) + admin.dashboard 상수 (432) 우선 → **약 1,471 라인**, t() 호출 +500~700 / ko leaves +400~500 예상.

---

## §4 트랙 C 운영 도메인 0 도달 검증 + notification.js wrapper

### 4.1 window.alert / window.confirm 운영 도메인 잔존 = 0

`frontend/src/**/*.{js,jsx,ts,tsx}` 전 스캔 결과 `window\.(alert|confirm)\s*\(` 한국어 동반 라인 = **0건** (이전 11건 → 0건 도달 ✅).

### 4.2 bare `alert` / `confirm` 한국어 동반 잔존 = 6건 (3 파일, 운영 1건만 남음)

| # | 파일 | 라인 | 운영 여부 | 호출 라인 |
|---:|---|---:|---|---|
| 1 | `frontend/src/components/tenant/TenantProfile.js` | 223 | **운영 잔존 (PR-F 흡수 권장)** | `if (!confirm('정말 이 결제 수단을 삭제하시겠습니까?')) {` |
| 2 | `frontend/src/components/ui/Card/Card.test.example.js` | 35 | 예제/스토리 (비운영) | `<Card variant="border" onClick={() => alert('카드 클릭!')}>` |
| 3 | `frontend/src/components/ui/Icon/Icon.stories.js` | 90 | 스토리북 (비운영) | `<Icon name="CALENDAR" onClick={() => alert('달력 클릭!')} />` |
| 4 | `frontend/src/components/ui/Icon/Icon.stories.js` | 91 | 스토리북 (비운영) | `<Icon name="SETTINGS" onClick={() => alert('설정 클릭!')} />` |
| 5 | `frontend/src/components/ui/Icon/Icon.stories.js` | 92 | 스토리북 (비운영) | `<Icon name="BELL" onClick={() => alert('알림 클릭!')} />` |
| 6 | `frontend/src/components/ui/Icon/Icon.stories.js` | 93 | 스토리북 (비운영) | `<Icon name="SEARCH" onClick={() => alert('검색 클릭!')} />` |

> **결론**: window.* 운영 0 달성. 단 `tenant/TenantProfile.js:223` 의 bare `confirm()` 1건은 PR-F 에서 `useConfirm` 으로 흡수 권장. stories/test 5건은 비운영(Card.test.example/Icon.stories) — i18n 대상 외, ESLint 룰 `no-alert` 도 `'off'` 상태라 게이트 미해당.

### 4.3 `frontend/src/utils/notification.js` wrapper 2건 (라인 176, 191)

`utils/notification.js` `NotificationManager` 클래스 안의 두 wrapper:

| 라인 | 메서드 | 코드 (요약) | 권장 처리 |
|---:|---|---|---|
| 176 | `confirm(message, callback)` | `const result = window.confirm(message);` | PR-F 에서 `useConfirm` 으로 대체 또는 `console.warn + UnifiedModal` 위임 |
| 191 | `alert(message, callback)` | `window.alert(message);` | PR-F 에서 `useAlert` 으로 대체 또는 deprecated 마킹 |

> `notificationManager.alert/confirm` 호출처는 총 **25건** (대부분 1건씩). 운영 측 코드에서 직접 `window.*` 을 부르지 않고 wrapper 를 거치므로 §4.1 운영 0 도달이 가능했음. 그러나 wrapper 내부는 여전히 `window.*` → P2 (PR-F) 정합 대상.

### 4.4 `notificationManager.confirm / .alert` 호출처 Top (PR-F 흡수 가늠)

| 파일 | 호출 수 |
|---|---:|
| `frontend/src/components/admin/organisms/SystemNotificationListBlock.js` | 3 |
| `frontend/src/components/dashboard-v2/AdminDashboardV2.js` | 1 |
| `frontend/src/components/admin/{MenuPermissionManagement, VacationManagementModal, TenantCodeManagement, AdminDashboard, CommonCodeManagement, WidgetBasedAdminDashboard, AccountManagement, CacheMonitoringDashboard, ConsultantManagement, TenantCommonCodeManager, DashboardFormModal, UserManagement, ApiPerformanceMonitoring}.js` | 각 1 |
| `frontend/src/components/admin/mapping/PartialRefundModal.js` | 1 |
| `frontend/src/components/admin/mapping-management/pages/MappingManagementPage.js` | 1 |
| `frontend/src/components/dashboard/DashboardWidgetManager/DashboardWidgetManagerContainer.js` | 1 |
| `frontend/src/components/super-admin/PaymentManagement.js` | 1 |
| `frontend/src/components/finance/RecurringExpenseModal.js` | 1 |
| **합계** | **25** |

> **PR-F 정합 시**: `notificationManager.confirm/alert` 25 호출 → `useConfirm/useAlert` 훅 직접 사용으로 마이그레이션 + `notification.js` wrapper 2건 deprecate. 추가 t() 흡수 +25~40, ko leaves 변화 미미 (메시지 키는 이미 admin/common 안에 있음).

---

## §5 trailing comma (ESLint `comma-dangle`) 현황 + PR-F 영향 범위

### 5.1 ESLint 룰 현황 (`frontend/.eslintrc.js`)

```javascript
'comma-dangle': ['warn', 'never']
```

- 1차 위치: `frontend/.eslintrc.js:138`
- 위반 시 **warning** (error 아님 → CI 빌드 차단은 아니나 IDE 노이즈 발생)
- 보조 룰: `comma-spacing`, `comma-style` 모두 `warn`
- 별도 `.eslintrc.widget-standards.js` 는 위젯 표준 룰 (comma-dangle 미정의)

### 5.2 i18n hook 영역 위반 위치

**`frontend/src/hooks/useConfirm.js`**:
- L71: `success: 'modal.success.defaultTitle',` → 객체 마지막 키 trailing comma (warn)
- L81: `success: 'modal.confirm.defaultConfirmButton',` → 동일 (warn)

**`frontend/src/hooks/useAlert.js`**:
- L62: `success: 'modal.success.defaultTitle',` → 동일 (warn)

> 합계 **3건 warning** (운영 차단 X). PR-F 일괄 정합 시 trailing comma 제거 ↔ 룰을 `['warn', 'always-multiline']` 으로 변경 두 옵션 중 선택. 1차 청크 정착물 무수정 원칙상 PR-F 단계에서 단일 commit 으로 처리 권장.

### 5.3 PR-F 영향 범위 확장 검토

전체 `frontend/src/**` 에 `comma-dangle: ['warn', 'never']` 위반은 산발적으로 다수 존재할 가능성 있으나 (warning 으로 분류되어 빌드 차단 아님), **i18n hook 2 파일에 한정해 즉시 정합** 권장. 광역 적용은 별도 PR (PR-F+ 또는 D11 클린업 라운드) 로 분리.

---

## §6 KPI 매트릭스 (현재 → 2차 청크 종료 목표)

| KPI | 1차 청크 시작 (`9e22d9e4c`) | 1차 청크 종료 (현재, `d3586eab8`) | 2차 청크 목표 | 현재 도달률 (목표 기준) | 차이 (-/+ to target) |
|---|---:|---:|---|---:|---:|
| 한국어 라인 (JS/TS) | 29,898 | **29,902** | ≤15,000 | **49.8%** (감축 미진척: −1.3%p 회복 필요) | +14,902 감축 필요 |
| 실효 한국어 라인 (주석 제외) | 20,092 | **20,089** | ≤10,000 (참고치) | **49.8%** | +10,089 감축 필요 |
| t() 호출 | 1,012 | **1,272** (사용자 보고 1,312) | ≥3,000 | **42.4%** (사용자 기준 43.7%) | +1,728 ~ 1,988 필요 |
| useTranslation 파일 | 275 | **285** (사용자 보고 290) | ≥500 | **57.0%** (사용자 기준 58.0%) | +210 ~ 215 필요 |
| ko leaves | 410 | **1,385** (admin 703 + common 269 + error 151 + report 113 + statistics 82 + settings 67) | ≥1,500 | **92.3%** | +115 필요 (소폭) |
| window.alert/confirm 운영 | 11 | **0** ✅ | 0 | **100%** | 0 |
| bare alert/confirm 운영 | (포함) | **1** (tenant/TenantProfile.js:223) | 0 | — | −1 필요 |
| notificationManager.alert/confirm 호출 | (측정 없음) | **25** | 0 (PR-F 흡수) | — | −25 필요 |

> **측정 노트**: t() 호출 / useTranslation 파일 수의 사용자 보고치 (1,312 / 290) 와 본 측정치 (1,272 / 285) 간 약 ~3% 격차는 regex 패턴 차이 (본 측정은 `\bt\s*\(\s*['"\`]` 사용 — 동적 키 인자 등 일부 누락 가능). 어느 쪽이든 도달률 ~42~58% 범위로 KPI 추세는 동일.
>
> **결론**:
> 1. **ko leaves 는 거의 도달** (92.3%) — 키 인프라는 충분. 2차 청크는 **t() 호출 / useTranslation 파일** 추진 중심.
> 2. **한국어 라인 감축이 핵심 격차** (현재 49.8% → 목표 100%). PR-D + PR-E 가 라인 ~7,000~10,000 감축을 책임져야 함.
> 3. **window.\* 운영 0 ✅** 달성. PR-F 는 bare `confirm` 1건 + notification wrapper 2건 + 호출처 25건 흡수 + trailing comma 3건 정합으로 마무리.

---

## §7 PR-D / PR-E / PR-F 작업 범위 권장

### 7.1 PR-D — 트랙 A Top-20 잔존 흡수 (예상 ko leaves +500~700 / t() +600~800)

**대상 파일** (상위 20개, 합계 라인 2,436 / 실효 1,949):

```
frontend/src/components/admin/AdminDashboard.js                                   (275)
frontend/src/components/admin/ConsultantComprehensiveManagement.js                (270)
frontend/src/components/dashboard-v2/AdminDashboardV2.js                          (211)
frontend/src/components/admin/DashboardFormModal.js                               (181)
frontend/src/components/admin/PermissionManagement.js                             (129)
frontend/src/components/admin/SystemConfigManagement.js                           (120)
frontend/src/components/admin/VacationManagementModal.js                          (119)
frontend/src/components/admin/SessionManagement.js                                (102)
frontend/src/components/admin/ClientComprehensiveManagement.js                    ( 97)
frontend/src/components/common/UnifiedHeader.js                                   ( 96)
frontend/src/components/admin/DashboardManagement.js                              ( 96)
frontend/src/components/admin/WellnessManagement.js                               ( 96)
frontend/src/components/admin/VacationStatistics.js                               ( 95)
frontend/src/components/admin/MappingCreationModal.js                             ( 86)
frontend/src/components/admin/WidgetBasedAdminDashboard.js                        ( 82)
frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.js        ( 80)
frontend/src/components/admin/DashboardWidgetEditor.js                            ( 79)
frontend/src/components/admin/system/TestNotificationForm.js                      ( 76)
frontend/src/components/admin/UserManagement.js                                   ( 74)
frontend/src/components/common/TermsOfService.js                                  ( 72)
```

**namespace**: 기존 `admin.json` (703 → ~1,200) + `common.json` (269 → ~330). 신규 namespace 신설 불필요.

**예상 증가량**: ko leaves +500~700 / t() +600~800 / useTranslation 파일 +15~20.

**검증**: `npm run lint && npm run build` + Storybook 영향 확인 + admin 영역 시각 회귀 스냅 (P3).

### 7.2 PR-E — 트랙 D constants/_Strings/messages 군집 흡수 (예상 ko leaves +300~500 / t() +400~600)

**우선 흡수 군집** (합계 라인 ~1,471):

```
# erp/finance (396)
frontend/src/constants/integratedFinanceDashboardStrings.js                       (214)
frontend/src/constants/financialManagementStrings.js                              (182)

# admin/commonCode (307)
frontend/src/constants/tenantCommonCodeManagerStrings.js                          (155)
frontend/src/constants/commonCodeManagementStrings.js                             (152)

# schedule (179)
frontend/src/constants/schedule.js                                                (179)

# common.messages (157)
frontend/src/constants/messages.js                                                (157)

# admin.dashboard 상수 (432)
frontend/src/constants/dashboardFormModalStrings.js                               (114)
frontend/src/constants/pageConfigs.js                                             (108)
frontend/src/constants/widgetConstants.js                                         (106)
frontend/src/constants/charts.js                                                  (104)
```

**namespace 신설 결정**:
- `erp.json` **신설** (erp.finance.*, erp.budget.*, erp.salary.*) — 운영 도메인 큰 신규 영역
- `schedule.json` **신설** (schedule.*, schedule.unified.*, schedule.detail.*)
- `common.messages` 확장 (또는 `error.json` 확장 — `messages.js` 가 toast/alert 메시지 위주이면 `error.json` 흡수 권장)
- `admin.json` 의 `dashboard.*` 서브트리 확장

**예상 증가량**: ko leaves +300~500 / t() +400~600 / useTranslation 파일 +10~15 (대부분 constants 파일은 import 측에서 t() 사용).

**검증**: erp / schedule / dashboard 영역 시각 회귀 + 단위 테스트 (constants/__tests__/*.test.js 영향 확인).

### 7.3 PR-F — 룰 정합 + 잔존 B/C + notification.js wrapper (예상 라인 +50~100 / t() +30~50)

**작업 항목**:
1. `frontend/src/hooks/useConfirm.js` L71/L81 trailing comma 제거 (3건 warning → 0)
2. `frontend/src/hooks/useAlert.js` L62 trailing comma 제거
3. `frontend/src/components/tenant/TenantProfile.js:223` bare `confirm()` → `useConfirm` 마이그레이션 (한국어 메시지 1개 → `admin.tenant.payment.deleteConfirm` 또는 `common.confirm.deletePaymentMethod` 추가)
4. `frontend/src/utils/notification.js` L176/L191 wrapper deprecate 또는 `useConfirm/useAlert` 위임 (호출처 25곳은 별도 후속 또는 batch 마이그레이션)
5. (선택) `notificationManager.confirm/.alert` 25 호출처 일괄 마이그레이션 — PR-F 1차에서는 admin organisms 영역 3건만 시범 흡수, 나머지는 PR-F+ 후속
6. 트랙 B 잔존 (450 / 18 파일) 일부 흡수 — settings/statistics/report 신규 namespace 정착 보강 (예: salaryManagement, salaryConfig 등 큰 settings 파일 1~2건)

**예상 증가량**: ko leaves +30~80 / t() +30~50 / useTranslation 파일 +5 / window·bare alert 잔존 운영 → 0.

**검증**: ESLint warning 감소 확인 + tenant/PG 영역 시각 회귀 + Storybook 영향 (Icon.stories/Card.test.example bare alert 는 비운영이므로 유지).

### 7.4 PR-D/E/F 합산 예상 결과

| KPI | 현재 | +PR-D | +PR-E | +PR-F | 2차 청크 종료 예상 | 2차 청크 목표 | 도달 여부 |
|---|---:|---:|---:|---:|---:|---|---|
| 한국어 라인 | 29,902 | ~28,000 | ~26,000 | ~25,900 | **~25,900** | ≤15,000 | ❌ (2차 단독으로는 불충분 — 3차 청크 추가 필요) |
| t() 호출 | 1,272 | ~2,000 | ~2,500 | ~2,540 | **~2,540** | ≥3,000 | ❌ (84.7% 도달, 3차 청크 +500 필요) |
| useTranslation 파일 | 285 | ~305 | ~318 | ~323 | **~323** | ≥500 | ❌ (64.6% 도달) |
| ko leaves | 1,385 | ~2,000 | ~2,400 | ~2,450 | **~2,450** | ≥1,500 | ✅ (163%) |
| window/bare alert 운영 | 0/1 | 0/1 | 0/1 | **0/0** | 0/0 | 0/0 | ✅ |

> **2차 청크 단독 KPI 도달은 한국어 라인·t()·useTranslation 3개 KPI 가 모두 미달**. ko leaves / window.* 운영 0 은 도달. **3차 청크 (PR-G/H) 필요성 확정**: D 트랙 잔여 (~17,000 라인) + auth/erp/schedule/dashboard 컴포넌트 직접 라인 흡수가 핵심.

---

## §8 위험 + 권장 사항

### 8.1 위험

1. **R-1 (중)**: D 트랙 `erp/IntegratedFinanceDashboard.js` (338줄), `dashboard/DynamicDashboard.js` (227줄) 등 거대 파일은 한 PR 에서 전체 흡수 시 충돌 위험 ↑ → 파일 단위 분할 PR 권장.
2. **R-2 (중)**: PR-E 의 `constants/messages.js` (157줄) 는 toast/alert 메시지 중심으로 추정되며, 기존 `error.json` (151 leaves) 과 충돌 가능. namespace 합병 정책 사전 합의 필요.
3. **R-3 (저)**: PR-F 의 `notification.js` wrapper deprecate 는 25 호출처 동시 마이그레이션 필요 — 시범(3건)만 PR-F 에 포함하고 나머지는 후속 별도 PR 권장.
4. **R-4 (저)**: t() 호출 KPI 의 사용자 보고치(1,312) vs 본 측정치(1,272) 격차 40건은 regex 차이 — 운영 영향 없음. 측정 합의 필요 시 합의서 §1.6 측정 도구 동기화 항목 추가.
5. **R-5 (저)**: 트랙 A `VacationStatistics.js` (95줄) 는 admin/statistics 경계 — 단일 카테고리 원칙상 A 우선, namespace 도 `admin.vacation.statistics.*` 권장 (statistics.json 분산 회피).

### 8.2 권장 사항

1. **P1 designer SKIP 권장**: 1차 청크 P1 design handoff 가 이미 완료(`D5_P4_P1_DESIGN_HANDOFF_I18N_TRACK_A.md`)되었고, 2차 청크는 동일 패턴(키→텍스트 1:1 치환) 반복 + 신규 namespace 2건(erp/schedule)만 추가이므로 별도 디자이너 핸드오프 불요. namespace 신설 합의는 **P0-inv-c2 본 보고서 §7.2** 로 갈음.
2. **PR-D/E/F 병렬 가능**: 파일 영역이 서로 다르므로 (PR-D = admin/common 컴포넌트, PR-E = constants/_Strings, PR-F = hooks/utils) 동시 진행 안전. 단 PR-D 와 PR-E 모두 `admin.json` 을 확장하므로 leaves 추가 시 키 네임스페이스 충돌 검토 필요.
3. **3차 청크 사전 계획**: 2차 청크로는 한국어 라인 KPI (≤15,000) 미달 확실 → 3차 청크 (PR-G/H) 에서 auth (TabletLogin/UnifiedLogin), schedule 컴포넌트, dashboard/consultant 영역 ~10,000 라인 추가 흡수 필요.
4. **시각 회귀 (P3) 범위 확장**: 2차 청크 P3 에서는 admin / common (PR-D) + erp / schedule / dashboard (PR-E) + tenant / hooks (PR-F) 영역 모두 커버 필요. Storybook 갱신 동반.
5. **운영 push (P4) 게이트**: window.\*/bare alert 운영 0 도달 유지 + ko leaves ≥1,500 유지 + ESLint warning 회복 (PR-F 트레일링 콤마 3건 → 0) 을 명시적 게이트로.

---

## §9 산출물 절대 경로

| 산출물 | 절대 경로 | 비고 |
|---|---|---|
| 본 마크다운 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C2.md` | 신규 생성 |
| 트랙 A 보조 JSON | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-c2-trackA-20260526.json` | 신규 생성 |
| 트랙 D 보조 JSON | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-c2-trackD-20260526.json` | 신규 생성 |
| 선행 1차 청크 P0-inv | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY.md` | 참조 |
| 합의서 | `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` | SHA `8b89df494` |

---

**보고서 작성**: 자율 실행 에이전트 (Opus 4.7)
**산출 시각**: 2026-05-26 KST 03:47 ±
**게이트 준수**: 운영 코드 수정 0건 / develop commit·push 0건 / Flyway·DB 변경 0건 / 신규 산출 파일 3건

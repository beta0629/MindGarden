# D5 P4 i18n Phase 2 — P0-inv-c3 3차 청크 인벤토리 보고서 (2026-05-26)

> **산출 유형**: 인벤토리 보고서 (read-only). 운영 코드 `frontend/src/**`, `frontend/src/i18n/index.js`, `frontend/src/locales/**`, `scripts/**` 0줄 수정.
> **위임 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §4.1 P0-inv + §6.1 PR-INV (3차 청크 PR-G/H/I/J/K 분배 사전 측정)
> **선행 산출물**: `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C2.md` (2차 청크 시작 SHA `d3586eab8`)
> **2차 청크 정착**: main `cb2f218c8` (Frontend deploy `26417873357` success, 2026-05-26 05:13 KST)
> **산출물 동반**:
> - `reports/d5-p4-i18n-inventory-c3-trackA-20260526.json`
> - `reports/d5-p4-i18n-inventory-c3-trackD-20260526.json`
> - `reports/d5-p4-i18n-inventory-c3-notificationManager-20260526.json`

---

## §0 메타

| 항목 | 값 |
|---|---|
| 측정 일자 | 2026-05-26 (KST 05:20 ±) |
| 측정 브랜치 | `develop` (working tree clean) |
| 측정 SHA (develop HEAD) | `a011a8a44` |
| 운영 main HEAD (2차 청크 정착) | `cb2f218c8` (Frontend deploy `26417873357` success) |
| 1차 청크 P0-inv 기준 SHA | `9e22d9e4c` |
| 2차 청크 P0-inv 기준 SHA | `d3586eab8` |
| 합의서 SHA | `8b89df494` (D5 P4 §5.8 일괄 채택본) |
| 측정 도구 | Python 3 재귀 스캔 + 보조 Grep (ripgrep) + ESLint warn 카운트 |
| 분류 우선순위 | **A > C > B > D** (단일 카테고리; 2차와 동일) |
| 스캔 범위 | `frontend/src/**/*.{js,jsx,ts,tsx}` (총 1,060 파일) |
| 한국어 매칭 패턴 | `[\u3131-\u318F\uAC00-\uD7A3]` (한글 자모·완성형) |
| 주석 제외 패턴 | `^\s*(//|\*|/\*)` |
| C 트랙 라인 기준 | `window\.(alert\|confirm)` 또는 bare `alert\|confirm` (단, `notificationManager.alert/confirm` 제외) + 동일 라인 한국어 포함 |

게이트 준수: 운영 코드 수정 0건, develop commit/push 0건 (본 P0-inv-c3 보고서·JSON 만 신규 commit), Flyway/DB 변경 0건.

---

## §1 트랙별 잔존 라인 매트릭스 (1차 시작 → 2차 시작 → 3차 시작 = 현재)

### 1.1 트랙 합계 변화 (3개 시점 비교)

| 트랙 | 기준 | 1차 청크 시작 (`9e22d9e4c`) | 2차 청크 시작 (`d3586eab8`) | 현재 3차 청크 시작 (`a011a8a44`) | Δ (2차→3차) | 비고 |
|---|---|---:|---:|---:|---:|---|
| **A** | admin · layout · components/common · notifications · error/toast/notify · contexts(Notification) | 9,181 / 6,494 (355 파일) | 8,863 / 6,255 (340 파일) | **8,865 / 6,257 (340 파일)** | **+2 / +2 / 0** | c2 PR-D Top-19 + PR-E Wave-1 (DashboardFormModal) 흡수에도 fallback 인자 (`t('key', '한국어')`) 유지로 라인 정체. **본질 원인 확인**. |
| **B** | settings · statistics · report (A 외) | 461 / 358 (18 파일) | 450 / 351 (18 파일) | **450 / 351 (18 파일)** | **0 / 0 / 0** | 2차 청크 미접근. 기존 3 namespace (report 113 + statistics 82 + settings 67 leaves) 내 흡수 가능. |
| **C** | bare/window alert·confirm 한국어 라인 (A 외) | 11 / 11 (8 파일) | 6 / 6 (3 파일) | **6 / 6 (3 파일)** | **0 / 0 / 0** | 1건 (TenantProfile) c2 PR-F 흡수 완료. 5건 (Icon.stories/Card.test.example) 은 비운영 stories — 흡수 대상 아님. |
| **D** | 잔여 (A/B/C 외) | 20,245 / 13,229 (630 파일) | 20,583 / 13,477 (655 파일) | **20,454 / 13,350 (653 파일)** | **−129 / −127 / −2** | c2 PR-E Wave-1 + PR-F notification.js wrapper deprecate 영향. constants 디렉토리 +503 라인 (신규 *Strings 추가) 와 컴포넌트 흡수분 상쇄. |
| **합계** | — | 29,898 / 20,092 (1,011 파일) | 29,902 / 20,089 (1,013 파일) | **29,775 / 19,964 (1,014 파일)** | **−127 / −125 / +1** | **재측정 보정**: c2 P4 보고서 표기 29,798 와 격차 23 라인은 측정 도구 차이. 본 측정 기준 채택. |

> **해석**: 2차 청크 흡수 작업에도 **한국어 라인 총량 변화 −127 (−0.4%)** 에 그침. 본질 원인은 c2 PR-D 가 `t('admin:users.delete', '사용자를 삭제하시겠습니까?')` 형태의 **fallback 인자 패턴**을 채택해 한국어 라인이 **잔존**한 것. 3차 청크 KPI 도달을 위해서는 (a) **신규 파일 흡수** (PR-G/H/I/J) 와 (b) **fallback 인자 제거** (PR-L 4차 청크 분리 예정) 가 모두 필요.

### 1.2 측정 도구 격차 노트

- 2차 P4 보고서 표기 29,798 vs 본 3차 P0-inv 재측정 29,775 = **격차 23 라인 (0.08%)**. regex 패턴/주석 처리 미세 차이.
- t() 호출 측정도 2차 P4 보고서 2,135 vs 본 측정 2,180 추정 (+45). 추세 일치.

---

## §2 트랙 A — PR-G 후보 (Top-30 + auth/schedule/dashboard 직접 흡수)

### 2.1 Top-30 한국어 라인 잔존 (c2 흡수분 식별 포함)

상위 30 파일 합계 **3,088 라인 / 실효 2,375 / 평균 102.9 라인/파일**. 트랙 A 8,865 라인 중 **34.8%** 가 Top-30 에 집중.

상위 19 파일은 **c2 PR-D 에서 이미 흡수 완료**되었으나 fallback 인자 패턴으로 한국어 라인이 잔존. PR-D 시점 t() 호출 수 평균 65~70 으로 정착 검증됨 (보조 JSON `top30_files[].t_calls` 필드 참조).

### 2.2 FRESH PR-G Wave-1 후보 (c2 흡수 외, 9 파일)

| # | 파일 | ko 라인 | 실효 | namespace 후보 | 비고 |
|---:|---|---:|---:|---|---|
| 1 | `components/notifications/UnifiedNotifications.js` | 71 | 45 | `common.notification.*` (신설 가능) | 알림 통합 뷰 |
| 2 | `contexts/NotificationContext.js` | 68 | 31 | `common.notification.context.*` | NotificationProvider |
| 3 | `components/admin/manual-notification/ManualNotificationForm.js` | 68 | 52 | `admin.manualNotification.*` | 수동 알림 폼 |
| 4 | `components/admin/mapping-management/pages/MappingManagementPage.js` | 66 | 62 | `admin.mapping.page.*` | 매핑 페이지 (notificationManager 1건 포함) |
| 5 | `components/admin/mapping/PartialRefundModal.js` | 65 | 55 | `admin.mapping.refund.*` | 부분 환불 모달 (notificationManager 1건 포함) |
| 6 | `components/admin/aiProvider/constants.js` | 65 | 49 | `admin.aiProvider.*` | AI 공급자 상수 |
| 7 | `components/layout/SimpleHamburgerMenu.js` | 64 | 43 | `common.menu.*` | 햄버거 메뉴 |
| 8 | `components/admin/DashboardLayoutEditor.js` | 64 | 49 | `admin.dashboard.layout.*` | 대시보드 레이아웃 편집 |
| 9 | `components/common/BusinessTypeGuard.js` | 64 | 18 | `common.businessGuard.*` | 사업자 타입 가드 (주석 비중 ↑) |
| **소계** | — | **595** | **404** | — | test 파일 1건 (`SystemConfigManagement.aiHealth.test.js`, 66 라인) 흡수 대상 외 (SKIP). |

### 2.3 PR-G Wave-2/3/4 — auth + schedule + dashboard 컴포넌트 (Track D 경계)

D 트랙의 auth/schedule/dashboard 영역은 운영 진입점/주력 컴포넌트로, PR-G 캠페인의 핵심:

| Wave | 영역 | 대표 파일 (라인) | 합계 (추정) | 신설 namespace |
|---|---|---|---:|---|
| Wave-2 | **auth** | TabletLogin (190) · UnifiedLogin (185) · 외 12 파일 | **~883 라인** | `auth.json` (신설) |
| Wave-3 | **schedule 컴포넌트** | UnifiedScheduleComponent (177) · ScheduleDetailModal (161) · TimeSlotGrid (122) · 외 15 파일 | **~980 라인** | `schedule.*` 확장 (c2 정착분) |
| Wave-4 | **dashboard 컴포넌트** | DynamicDashboard (227) · CommonDashboard (178) · 외 63 파일 | **~2,257 라인** | `admin.dashboard.*` + `dashboard.json` (신설) |

> Wave-2/3/4 는 D 트랙 영역이지만 PR-G 캠페인 일관성을 위해 PR-G 안에 포함. **PR-G 합산 = 595 (Wave-1) + 883 + 980 + 372 (dashboard 일부 — 거대 dashboard 전체는 PR-G+ 분리) ≈ 2,830 라인 / 예상 t() +610~780 / useTranslation +35~50**.

### 2.4 namespace 신설 결정 (P1 디자이너 SKIP 갈음)

- **`auth.json` 신설** (TabletLogin/UnifiedLogin/외 12 파일) — 약 80~100 leaves
- **`dashboard.json` 신설** (admin 외 dashboard 컴포넌트 흡수용) — 약 60~80 leaves
- 기존 `common.json` 확장 (notification 군집) — 약 30~40 leaves

> 본 §2.4 namespace 결정으로 P1 designer handoff 갈음. 디자이너 별도 호출 불요.

---

## §3 트랙 D — PR-H 후보 (PR-E SKIP 5군집 caller 마이그레이션)

### 3.1 PR-E SKIP 5 (실제 6) 클러스터 — 키 적재 완료, caller 만 마이그

c2 PR-E Wave-1 에서 `DashboardFormModal` (114) 만 흡수하고 나머지 5(+1) 클러스터는 SKIP. 본 PR-H 에서 caller 측 컴포넌트를 마이그.

| 클러스터 | constants 파일 | 라인 | 적재된 namespace | caller (예상 마이그 라인) |
|---|---|---:|---|---|
| **IFS** | `integratedFinanceDashboardStrings.js` | 214 | `erp.finance.dashboard.*` | `IntegratedFinanceDashboard.js` (~338 라인) |
| **FMG** | `financialManagementStrings.js` | 182 | `erp.finance.management.*` | `SalaryManagement.js` (144) + `BudgetManagement.js` (135) + `FinancialTransactionForm.js` (추정) |
| **CommonCode-tenant** | `tenantCommonCodeManagerStrings.js` | 155 | `admin.tenantCommonCode.*` | `TenantCommonCodeManager.js` |
| **CommonCode-mgmt** | `commonCodeManagementStrings.js` | 152 | `admin.commonCode.*` | `CommonCodeManagement.js` |
| **widget** | `widgetConstants.js` | 106 | `admin.dashboard.widget.*` | `CacheMonitoringDashboard.js` + dashboard/widgets/** |
| **charts** | `charts.js` | 104 | `admin.dashboard.charts.*` | admin/** 차트 사용처 |
| **소계 (constants)** | — | **913** | — | caller ~1,140 라인 |

> **PR-H 합산 = 913 (constants 본체 한국어 라인 제거) + 1,140 (caller 마이그) ≈ 2,053 라인 / 예상 t() +400~540 / useTranslation +17~23**.

### 3.2 트랙 D Top-30 잔존 (PR-G Wave-2/3/4 와 일부 중첩)

상위 30 파일 합계 **4,318 라인 / 실효 3,416 / 평균 144 라인/파일**. D 트랙 20,454 라인 중 **21.1%** 가 Top-30 에 집중. 보조 JSON `top30_files` 필드 전수 참조.

### 3.3 D 트랙 신규 발생분 (constants/* +503 라인)

c2 시작 대비 `frontend/src/constants/*` 디렉토리에 **+503 라인 신규** 발생. 추정 파일:
- `consultantMindWeatherInboxStrings.js` (신규)
- `packagePricingConstants.js` (신규)
- 그 외 *Strings 6 파일 (정확한 목록은 PR-H Wave-4 작업 시 재측정)

> **PR-H Wave-4 (후속)**: 신규 *Strings 파일 8개 흡수 — 약 500 라인 / 예상 t() +150~200. **3차 청크 단독으로 PR-H Wave-4 포함 여부는 PR-G/H/I 정착 후 잔여 시간으로 결정**.

---

## §4 notificationManager.alert/confirm 호출처 23건 (PR-I 후보)

### 4.1 전수 위치 (25 매칭 / 23 유니크 — SystemNotificationListBlock 3 호출 동일 파일)

보조 JSON `callsites[]` 필드 전수 참조. 카테고리별 분류:

| 카테고리 | 호출 수 | 대표 파일 |
|---|---:|---|
| **admin** | **17** | AdminDashboard, AccountManagement, ApiPerformanceMonitoring, CacheMonitoringDashboard, CommonCodeManagement, ConsultantManagement, DashboardFormModal, MenuPermissionManagement, TenantCodeManagement, TenantCommonCodeManager, UserManagement, VacationManagementModal, WidgetBasedAdminDashboard, SystemNotificationListBlock (×3) |
| **mapping** | **2** | MappingManagementPage, PartialRefundModal |
| **dashboard** | **2** | AdminDashboardV2, DashboardWidgetManagerContainer |
| **erp** | **2** | BudgetManagement, ItemManagement |
| **finance** | 1 | RecurringExpenseModal |
| **billing** | 1 | SubscriptionManagement |
| **super-admin** | 1 | PaymentManagement |
| **합계** | **23 (25 라인)** | — |

### 4.2 인자 패턴 분포 (마이그레이션 복잡도)

| 인자 패턴 | 건수 | 마이그 난이도 |
|---|---:|---|
| **상수** (CONFIRM.DELETE 등) | 9 | 낮음 — 상수 참조 유지하며 useConfirm Promise 패턴 적용 |
| **한국어 인라인** ('정말로 ...' 등) | 7 | 중간 — i18n 키 신설 + useConfirm 적용 |
| **변수** (confirmMessage) | 4 | 낮음 — 변수만 전달 |
| **멀티라인** (multi-arg) | 3 | 중간 — Promise 패턴 재작성 |
| **t-fallback** (`t('key', '한국어')`) | 2 | 낮음 — fallback 제거 + useConfirm |
| **t-키** (`t(KEY)`) | 1 | 낮음 — useConfirm 직결 |
| **템플릿** (backtick) | 1 | 중간 — 동적 메시지 처리 |
| **합계** | **23 (25 라인)** | — |

### 4.3 모두 `.confirm` (`.alert` 0건)

- `notificationManager.confirm`: **23 호출 / 25 라인**
- `notificationManager.alert`: **0 호출** ✅ (2차 청크 P4 보고서의 25 표기는 wrapper 호출 수가 아닌 호출처 + wrapper 합산. 실제 운영 호출은 confirm 23 + wrapper 2 = 25)

### 4.4 PR-I 권장 분할

3차 청크 PR-I 는 단일 PR 또는 4단계 Wave 분할 가능:
- Wave-A: admin 17건
- Wave-B: mapping 2건
- Wave-C: dashboard 2건 + erp 2건
- Wave-D: finance 1 + billing 1 + super-admin 1

> **PR-I 합산 = 23 호출처 마이그 / 라인 변경 70~100 / 예상 t() +10~15 / useTranslation +5~8 / MEDIUM 회귀 해소 ✅**.

---

## §5 트랙 B 잔존 18 파일 정확 위치 (PR-J 후보)

### 5.1 18 파일 namespace 분포 (3 namespace 안에서 100% 흡수)

| namespace | 파일 수 | 합계 라인 | 대표 파일 |
|---|---:|---:|---|
| **report** | 8 | ~248 | (`components/report/*` 한국어 잔존) |
| **statistics** | 7 | ~130 | (`components/statistics/*` 한국어 잔존) |
| **settings** | 4 | ~86 | (`components/settings/*` 한국어 잔존) |
| **utils (SKIP)** | 3 | ~ (실효 0~10) | 주석/변수명만 — i18n 대상 외 |
| **합계** | **18 파일 / 15 실효 흡수** | **~440 라인** | 신규 namespace 0건 |

### 5.2 PR-J 작업 범위

기존 `report.json` (113) + `statistics.json` (82) + `settings.json` (67) 의 **각 namespace 확장**. 신규 namespace 신설 0건.

> **PR-J 합산 = 18 파일 (utils 3 SKIP) / 약 440 라인 흡수 / 예상 t() +60~100 / useTranslation +12~18 / ko leaves +50~80**.

> **선택 PR**: 3차 청크 KPI 핵심 (한국어 라인 ≤15,000) 도달이 우선이므로, PR-J 는 시간 여유 시에만 실행. PR-G/H/I 우선.

---

## §6 ESLint warning 잔존 카운트 (PR-K 후보)

### 6.1 룰별 위반 카운트

| 룰 | 위반 카운트 | 영향 파일 수 | eslint --fix 자동 해결 가능 |
|---|---:|---:|---|
| `comma-dangle: ['warn', 'never']` | **156** | 37 | ✅ 가능 |
| `comma-spacing: ['warn', { before: false, after: true }]` | **0** | 0 | ✅ 이미 클린 (c2 PR-F 정합 효과) |
| `space-before-function-paren` | **67** | 27 | ✅ 가능 |
| `semi-spacing` | **3** | 3 | ✅ 가능 |
| **합계** | **226** | 약 50 (중복 제거) | **226건 모두 자동 해결 가능** |

### 6.2 PR-K 작업 범위

`eslint --fix` 실행 단일 commit + 영향 파일 50건 검토 + Production Build PASS 확인. 운영 코드 영향 미미 (warning → 0).

> **PR-K 합산 = ESLint warning 0 도달 / 라인 변경 ~250 (대부분 trailing comma 추가/제거) / KPI 영향 없음 (한국어 라인/t() 미변경)**.

> **선택 PR**: 운영 게이트 외부 작업이나, 후속 PR (특히 PR-L fallback 제거) 의 diff noise 감소를 위해 PR-K 선행 권장.

---

## §7 KPI 매트릭스 + 3차 청크 단독 도달 가능성 추정

### 7.1 PR 별 KPI 변화 예측

| KPI | 2차 종료 (`cb2f218c8`) | +PR-G | +PR-H | +PR-I | +PR-J | +PR-K | 3차 청크 종료 예상 | 목표 | 도달 여부 |
|---|---:|---:|---:|---:|---:|---:|---:|---|---|
| ko leaves | 2,854 | +400~600 | +300~400 | +5~10 | +50~80 | 0 | **~3,610~3,944** | ≥1,500 | ✅ **240%+** |
| 한국어 라인 (JS/TS) | 29,775 | −600 | −900 | −80 | −400 | 0 | **~27,795** | ≤15,000 | ❌ **미달 (185%)** |
| t() 호출 | ~2,180 | +610~780 | +400~540 | +10~15 | +60~100 | 0 | **~3,260~3,615** | ≥3,000 | ✅ **109~120%** |
| useTranslation 파일 | 293 | +35~50 | +17~23 | +5~8 | +12~18 | 0 | **~362~392** | ≥500 | ❌ **미달 (72~78%)** |
| window.alert/confirm 운영 | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 | ✅ |
| bare alert/confirm 운영 | 0 | 0 | 0 | 0 | 0 | 0 | **0** | 0 | ✅ |
| notificationManager 호출처 | 23 | 0 | 0 | −23 | 0 | 0 | **0** | 0 | ✅ (MEDIUM 해소) |
| ESLint warning (3종) | 226 | 0 | 0 | 0 | 0 | −226 | **0** | 0 | ✅ |
| Production Build / lint:codemod-mappings | PASS / 57/57 | PASS | PASS | PASS | PASS | PASS | **PASS / 57/57** | PASS / 57/57 | ✅ |

### 7.2 3차 청크 단독 KPI 도달 결과 추정

| KPI | 도달 여부 | 격차 | 4차 청크 (PR-L) 필요성 |
|---|---|---:|---|
| ko leaves ≥1,500 | ✅ **도달 (240%+)** | +2,110~2,444 | 불필요 |
| t() 호출 ≥3,000 | ✅ **도달 (109~120%)** | +260~615 | 불필요 |
| useTranslation 파일 ≥500 | ❌ **미달 (72~78%)** | −108~138 | **필요** (PR-L 에서 추가 파일 흡수) |
| 한국어 라인 ≤15,000 | ❌ **미달 (185%)** | +12,795 | **필수** (PR-L fallback 인자 제거 트랙) |
| MEDIUM 회귀 해소 | ✅ **해소** | — | 불필요 |
| ESLint warning 0 | ✅ **도달** | — | 불필요 |

### 7.3 본질 원인 — fallback 인자 패턴

3차 청크 PR-G/H/I/J 모두 완료해도 **한국어 라인 ≤15,000 도달 불가**. 본질 원인:

- c2 PR-D Wave-19 마이그 패턴: `t('admin:users.delete', '사용자를 삭제하시겠습니까?')`
- → 한국어 fallback 인자가 잔존 라인으로 측정됨
- 트랙 A 8,865 라인 중 추정 **~5,500 라인이 fallback 인자**

**PR-L (4차 청크 분리 필수)**: fallback 인자 일괄 제거 codemod
- 영향 라인: ~5,500~7,000 (fallback 인자 제거 시 한국어 라인 단번 감소)
- 위험: 키 부재 시 i18n 런타임 오류 → key resolution test 선행 필수
- 예상 도달: 한국어 라인 ~22,000 → ~14,500~15,500 (목표 도달 가능)

### 7.4 권장 4차 청크 (PR-L) 사전 합의 항목

본 3차 청크 P0-inv-c3 종결과 함께 **합의서 §5.8 추가 결정 요청** (사용자 컨펌 필요):
- C9 (신규): 4차 청크 PR-L 진행 합의 (fallback 인자 제거 + 누락 키 보완)
- C10 (신규): 한국어 라인 ≤15,000 KPI 의 PR-L 의존성 확정 (3차 청크는 t()/ko leaves KPI 우선)

> 본 합의는 3차 청크 P4 정착 후 사용자에게 별도 보고 + 컨펌 요청. **3차 청크는 게이트 §C8=b 조항 (사용자 추가 컨펌 요청 금지) 무중단 진행 후 4차 청크 진입 시점에서만 컨펌 요청**.

---

## §8 위험 + 권장 사항

### 8.1 위험

1. **R-1 (중)**: PR-G Wave-2 auth (TabletLogin/UnifiedLogin) 는 운영 진입점 — 라우팅·세션 영향 회귀 검증 필수. 시각 회귀 P3 에서 로그인 플로우 전체 (3 도메인 × 3 역할) 커버 필요.
2. **R-2 (중)**: PR-I notificationManager 23 호출처 일괄 마이그 시 콜백 패턴 (Promise resolve) 차이 — `useConfirm()` 의 Promise 반환 시그니처와 기존 콜백 패턴 동시 지원 필요. 시범 1 호출처 (admin 작은 컴포넌트) 마이그 후 패턴 합의 → 잔여 22 일괄.
3. **R-3 (중)**: PR-G/H/I 의 누적 diff 가 ~6,000 라인 — 단일 PR 충돌 위험. 각 PR 별도 commit + develop 정착 + lint:codemod-mappings 검증 사이클 필수.
4. **R-4 (저)**: PR-K ESLint 광역 정합의 diff 가 ~250 라인 — 후속 PR 의 cherry-pick·rebase 시 충돌 가능. PR-K 는 PR-G/H/I/J 완료 후 마지막 commit 권장.
5. **R-5 (저)**: PR-H constants 흡수 시 caller 임포트 제거 — 미참조 임포트 lint warning 발생 가능. `eslint --fix` 동반 권장.
6. **R-6 (저)**: 3차 청크 단독 KPI (한국어 라인 ≤15,000) 미도달 — 사용자 보고 시 4차 청크 PR-L 필요성 명시. 단 합의서 §5.8 게이트 위반은 없음 (3차 청크 자체는 무중단 진행 약정 유지).

### 8.2 권장 사항

1. **P1 designer SKIP 권장 (확정)**: 2차 청크 패턴 답습 + 신규 namespace 2종 (auth, dashboard) 만 추가 — 본 P0-inv-c3 §2.4 namespace 결정으로 갈음. 별도 디자이너 핸드오프 불요.
2. **PR-G/H/I/J/K 순차 진행 권장**: 자원 경합 회피 + 검증 게이트 (lint:codemod-mappings 57/57 PASS) 매 PR 후 확인. 병렬 가능 영역 (PR-G admin 컴포넌트 vs PR-H erp constants caller) 은 시간 여유 시에만 병렬.
3. **PR-K 마지막 commit 권장**: PR-G/H/I/J 의 diff noise 회피 + lint --fix 일괄 적용 효과 극대화.
4. **시각 회귀 (P3) 범위**: auth 로그인 (3 도메인 × 3 역할) + erp/finance/dashboard (3 영역) + admin notification (5 영역) + 트랙 B (settings/statistics/report) — Storybook 갱신 동반.
5. **운영 push (P4) 게이트**: window.\*/bare alert 운영 0 유지 + ko leaves ≥3,500 (3차 목표 240%+) + t() ≥3,000 (목표 109%+) + notificationManager 0 + ESLint warning 0 + lint:codemod-mappings 57/57 PASS.
6. **4차 청크 PR-L 사전 안내**: P4 정착 보고 시 사용자에게 (a) 3차 KPI 도달 결과 + (b) 4차 청크 (PR-L fallback 제거) 필요성 + (c) 합의서 §5.8 추가 결정 (C9/C10) 요청.

---

## §9 산출물 절대 경로

| 산출물 | 절대 경로 | 비고 |
|---|---|---|
| 본 마크다운 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C3.md` | 신규 생성 |
| 트랙 A 보조 JSON | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-c3-trackA-20260526.json` | 신규 생성 |
| 트랙 D 보조 JSON | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-c3-trackD-20260526.json` | 신규 생성 |
| notificationManager 보조 JSON | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-c3-notificationManager-20260526.json` | 신규 생성 |
| 선행 2차 청크 P0-inv | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C2.md` | 참조 |
| 선행 1차 청크 P0-inv | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY.md` | 참조 |
| 2차 청크 P4 정착 보고서 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_P4_PRODUCTION_PUSH_REPORT_C2.md` | 참조 |
| 합의서 | `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` | SHA `8b89df494` |

---

**보고서 작성**: core-planner (Opus 4.7) + explore 서브에이전트 측정 결과 기획자 적재
**산출 시각**: 2026-05-26 KST 05:20 ±
**게이트 준수**: 운영 코드 수정 0건 / develop commit 1건 (본 P0-inv-c3 문서 + reports JSON 3건) / Flyway·DB 변경 0건 / 사용자 추가 컨펌 요청 0건

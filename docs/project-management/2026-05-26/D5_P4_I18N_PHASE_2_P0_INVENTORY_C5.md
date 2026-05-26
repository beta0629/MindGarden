# D5 P4 i18n Phase 2 — P0-inv-c5 5차 청크 PR-M 인벤토리 보고서 (2026-05-26)

> **산출 유형**: 인벤토리 보고서 (read-only). 운영 코드 `frontend/src/**`, `frontend/src/i18n/index.js`, `frontend/src/locales/**`, `scripts/**` 0줄 수정.
> **위임 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §4.1 P0-inv + §6.1 PR-INV (5차 청크 PR-M 분배 사전 측정 · §5.8 §C11=b · §5.12 §C12=a 정착 직후)
> **선행 산출물**: `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C4.md` (4차 청크 시작 SHA `c44a0082b`)
> **4차 청크 정착**: main `a68886273` (Frontend deploy `26423706330` success, 2026-05-26 KST)
> **산출물 동반**:
> - `reports/d5-p4-i18n-inventory-c5-hardcoded-literal-top30-20260526.json`
> - `reports/d5-p4-i18n-inventory-c5-props-jsx-top30-20260526.json`
> - `reports/d5-p4-i18n-inventory-c5-throw-error-defaultValue-20260526.json`
> - `reports/d5-p4-i18n-inventory-c5-console-log-20260526.json`
> - `reports/d5-p4-i18n-inventory-c5-key-parity-20260526.json`

---

## §0 메타

| 항목 | 값 |
|---|---|
| 측정 일자 | 2026-05-26 (KST 08:35 ±) |
| 측정 브랜치 | `develop` (working tree clean) |
| 측정 SHA (develop HEAD) | `982f91252` (§5.8 §C11=b / §5.12 §C12=a 정착 직후) |
| 운영 main HEAD (4차 청크 정착) | `a68886273` (Frontend deploy `26423706330` success) |
| 1차 청크 P0-inv 기준 SHA | `9e22d9e4c` |
| 2차 청크 P0-inv 기준 SHA | `d3586eab8` |
| 3차 청크 P0-inv 기준 SHA | `a011a8a44` |
| 4차 청크 P0-inv 기준 SHA | `c44a0082b` |
| 합의서 SHA | `982f91252` (§5.8 11건 일괄 채택 직후 — C11=b / C12=a 신규) |
| 측정 도구 | Python 3 재귀 스캔 (`/tmp/d5-p4-c5/scan.py`) + `grep -rE` 보조 |
| 스캔 범위 | `frontend/src/**/*.{js,jsx,ts,tsx}` (총 **999** 파일, tests/specs/locales/build 제외) |
| 한국어 매칭 패턴 | `[\u3131-\u318F\uAC00-\uD7A3]` (한글 자모·완성형) |
| 주석 제외 패턴 | `^\s*(//\|\*\|/\*\|\*/\|#)` |
| 5차 청크 단일 카테고리 | **PR-M (hardcoded literal·props label·jsx text·throw Error i18n 흡수)** — §5.8 §C11=b / §5.8 §C12=a |

게이트 준수: 운영 코드 수정 0건, develop commit/push 0건 (산출물 5건만 신규 — 후속 commit 은 core-planner 담당), Flyway/DB 변경 0건, MCP 외부 호출 0건.

---

## §1 6종 패턴 정밀 인벤토리

### 1.1 패턴 정의 + 합계

| Pattern | 정의 | 매칭 | 영향 파일 (가늠) | Wave 매핑 |
|---|---|---:|---:|---|
| **P1 — `hardcoded_string_literal`** | 변수/return/할당 한국어 문자열 (`const/let/var/return/case/throw/=/:` 직후 single/double/backtick quote) | **1,560** | ~280 | **Wave-1** |
| **P2 — `props_label_string`** | JSX props 한국어 (`label\|title\|placeholder\|tooltip\|description\|name\|caption\|header\|aria-label\|alt\|message\|text\|content`) | **1,187** | ~210 | **Wave-2** |
| **P3 — `jsx_text_content`** | JSX 본문 한국어 텍스트 (`>한국어<`) | **2,321** | ~290 | **Wave-2** |
| **P4 — `defaultValue_option`** | `t('key', { defaultValue: '한국어' })` | **0** | 0 | (Wave-3, 흡수 0 — PR-L 정착으로 이미 제거됨) |
| **P5 — `throw_new_Error`** | `throw new Error('한국어')` | **71** | ~50 | **Wave-3** (44 흡수 + 27 보존) |
| **P6 — `console_log`** | `console.(log\|warn\|info\|debug\|error)` 한국어 메시지 | **2,107** | ~180 | **Wave-4** (변경 0건, KPI 제외 산식 검증) |
| **합계** | — | **7,246** | (중복 포함) | (각 Wave 별 분리) |

> **사용자 narrative 격차 정합**: 사용자 위임의 "PR-M 흡수 대상 ~11,691 라인" 은 P0-inv-c4 시점 측정값으로, 4차 청크 PR-L 정착 (`a68886273`) 으로 fallback 인자 (~2,852 라인) 제거 + ko leaves +577 (3,247 → 3,824, +18%) 누적되어 본질 잔여가 -38% 감소했다. P4 `defaultValue` 17건 → 0건 흡수도 PR-L 정착의 부산물이다. 본 측정은 `a68886273` 시점의 실측 잔존이다.

### 1.2 P1 hardcoded_string_literal — Top-30 (Wave-1 흡수 대상)

| # | 파일 | matches |
|---:|---|---:|
| 1 | `utils/krPublicHolidays.js` | **96** |
| 2 | `constants/schedule.js` | **50** |
| 3 | `components/admin/DashboardWidgetEditor.js` | **37** |
| 4 | `components/admin/DashboardLayoutEditor.js` | **37** |
| 5 | `components/tenant/PgConfigurationForm.js` | **33** |
| 6 | `components/admin/ConsultationCompletionStats.js` | **29** |
| 7 | `constants/salaryConstants.js` | **25** |
| 8 | `components/schedule/UnifiedScheduleComponent.js` | **23** |
| 9 | `constants/charts.js` | **21** |
| 10 | `components/dashboard/SummaryPanels.js` | **21** |
| 11 | `components/dashboard/CommonDashboard.js` | **21** |
| 12 | `components/dashboard/widgets/SummaryPanelsWidget.js` | **21** |
| 13 | `utils/colorUtils.js` | **20** |
| 14 | `components/schedule/ScheduleDetailModal.js` | **20** |
| 15 | `components/erp/IntegratedFinanceDashboard.js` | **19** |
| 16 | `components/client/ClientDashboard.js` | **19** |
| 17 | `constants/mapping.js` | **18** |
| 18 | `utils/branchUtils.js` | **17** |
| 19 | `components/admin/ModernDashboardEditor.js` | **16** |
| 20 | `constants/notificationChannelPreference.js` | **14** |
| 21~30 | (보조 JSON `top50_P1[]` 전수 참조) | **143** |

**누적 커버리지**:

| 컷오프 | 파일 수 | matches | 커버리지 |
|---|---:|---:|---:|
| Top-10 | 10 | 372 | 23.8% |
| Top-30 | 30 | 700 | 44.9% |
| Top-50 | 50 | 832 | 53.3% |
| 전체 | ~280 | 1,560 | 100% |

> **Wave-1 권장**: Top-50 흡수로 ~830 라인 (53.3%) 커버. utils·constants·dashboard 류 파일이 상위에 집중되어 있어 codemod 자동화 친화적.

### 1.3 P2 + P3 통합 — Top-30 (Wave-2 흡수 대상, props_label + jsx_text)

| # | 파일 | total | P2 | P3 |
|---:|---|---:|---:|---:|
| 1 | `components/admin/AdminDashboard.js` | **106** | 30 | 76 |
| 2 | `components/erp/IntegratedFinanceDashboard.js` | **99** | 0 | 99 |
| 3 | `components/dashboard-v2/AdminDashboardV2.js` | **73** | 60 | 13 |
| 4 | `components/consultant/ConsultationRecordScreen.js` | **61** | 24 | 37 |
| 5 | `components/ui/Modal/Modal.stories.js` | **54** | 8 | 46 |
| 6 | `components/erp/BudgetManagement.js` | **51** | 11 | 40 |
| 7 | `components/common/PrivacyPolicy.js` | **43** | 2 | 41 |
| 8 | `components/admin/ConsultantComprehensiveManagement.js` | **42** | 13 | 29 |
| 9 | `components/tenant/PgConfigurationForm.js` | **41** | 18 | 23 |
| 10 | `components/erp/SalaryManagement.js` | **39** | 14 | 25 |
| 11 | `components/common/HelpPage.js` | **37** | 2 | 35 |
| 12 | `components/ops/PgApprovalManagement.js` | **37** | 11 | 26 |
| 13 | `components/ui/Button/ButtonExamples.js` | **35** | 0 | 35 |
| 14 | `components/consultant/organisms/ConsultationLogFormPanel.js` | **35** | 15 | 20 |
| 15 | `components/tenant/PgConfigurationDetail.js` | **34** | 4 | 30 |
| 16 | `components/admin/mapping/MappingDetailModal.js` | **34** | 1 | 33 |
| 17 | `components/erp/ImprovedTaxManagement.js` | **33** | 20 | 13 |
| 18 | `components/compliance/ComplianceDashboardCards.js` | **29** | 1 | 28 |
| 19 | `components/erp/SuperAdminApprovalDashboard.js` | **28** | 4 | 24 |
| 20 | `components/erp/ConsultantProfileModal.js` | **27** | 3 | 24 |
| 21~30 | (보조 JSON `top50_combined[]` 전수 참조) | **216** | — | — |

**누적 커버리지** (P2+P3 통합):

| 컷오프 | 파일 수 | matches | 커버리지 |
|---|---:|---:|---:|
| Top-10 | 10 | 645 | 18.4% |
| Top-30 | 30 | 1,361 | 38.8% |
| Top-50 | 50 | 1,805 | 51.4% |
| 전체 | ~310 | 3,508 | 100% |

**P2 props 키별 분포**:

| props 키 | matches |
|---|---:|
| `title` | 400 |
| `aria-label` | 252 |
| `placeholder` | 243 |
| `text` | 111 |
| `label` | 104 |
| `description` | 49 |
| `message` | 23 |
| `alt` | 3 |
| `name` | 2 |

> **Wave-2 권장**: Top-50 흡수로 ~1,805 라인 (51.4%) 커버. AdminDashboard·IntegratedFinanceDashboard·AdminDashboardV2 3종에 268 라인 (Top-3, 7.6%) 집중되어 우선 진입 효율 高.

### 1.4 P4 defaultValue_option — 0건 (PR-L 정착 부산물)

| 항목 | 값 |
|---|---:|
| 매칭 | **0** |
| 합의서 narrative (사용자 위임 시점) | 17건 |
| 본 측정 (PR-L 정착 후) | 0건 |
| 차이 사유 | PR-L codemod (`8c404ea60` 이후) 가 fallback 인자 패턴 + defaultValue 옵션 객체 모두 흡수 |

> Wave-3 에서 P4 변경 0건 — narrative 만 명시. 운영 코드 0줄 수정.

### 1.5 P5 throw_new_Error — 71건 (Wave-3 흡수 대상, §C12=a)

**파일별 분포** (Top-15):

| 파일 | matches | 카테고리 |
|---|---:|---|
| `utils/paymentGateway.js` | **20** | (보존 — SDK 미초기화 시점) |
| `utils/socialLogin.js` | **5** | (보존 — OAuth 초기화) |
| `utils/brandingUtils.js` | **6** | (흡수) |
| `utils/menuHelper.js` | **4** | (흡수) |
| `components/super-admin/PaymentManagement.js` | **3** | (흡수) |
| `utils/mypageApi.js` | **2** | (흡수) |
| `components/auth/BranchLogin.js` | **1** | (흡수) |
| `components/admin/AdminShopCatalogSkuEditorPage.js` | **2** | (흡수) |
| `components/schedule/ScheduleDetailModal.js` | **2** | (흡수) |
| `components/dashboard/widgets/FormWidget.js` | **1** | (흡수) |
| `components/dashboard/widgets/RatingWidget.js` | **1** | (흡수) |
| `components/mypage/MyPage.js` | **2** | (흡수) |
| (잔여 ~22 파일) | **22** | (흡수) |

**Wave-3 흡수 분류** (보조 JSON `P5_locations_absorb[]` 전수 + `P5_locations_preserve[]` 27건 별표):

| 분류 | count | 처리 정책 |
|---|---:|---|
| **흡수 (i18n 적용)** | **44** | `throw new Error(t('errors.xxx.yyy'))` + ko.json `error` namespace 자동 시드 |
| **보존 (영구 fallback)** | **27** | `utils/paymentGateway`(20) + `utils/socialLogin`(5) + `utils/standardizedApi`(1) + `utils/sessionManager`(0) + `utils/ajax`(0) + 기타 SDK 미초기화 시점 |

> **§C12=a 보존 예외 근거**: SDK 미초기화 시점 (예: `paymentGateway.js:285` "TossPayments SDK가 초기화되지 않았습니다") 은 i18n 인스턴스도 함께 미초기화될 가능성으로 fallback 영구 보존이 안전 마진. 본 27건은 운영 안전성·예측 가능성 우선.

### 1.6 P6 console_log — 2,107건 (Wave-4 검증, §C11=b)

**파일별 분포** (Top-15):

| 파일 | matches |
|---|---:|
| `components/admin/ConsultantComprehensiveManagement.js` | **77** |
| `components/schedule/UnifiedScheduleComponent.js` | **65** |
| `components/auth/UnifiedLogin.js` | **52** |
| `components/dashboard/CommonDashboard.js` | **52** |
| `utils/sessionManager.js` | **50** |
| `components/auth/TabletLogin.js` | **44** |
| `components/dashboard/DynamicDashboard.js` | **44** |
| `components/admin/DashboardFormModal.js` | **43** |
| `utils/socialLogin.js` | **35** |
| `utils/widgetVisibilityUtils.js` | **35** |
| `contexts/SessionContext.js` | **34** |
| `utils/ajax.js` | **33** |
| (이하 보조 JSON 참조) | — |

**§C11=b KPI 제외 산식**:

```bash
# 한국어 라인 KPI 측정 (console.log 제외 산식, §C11=b)
grep -rnE "[가-힣]" frontend/src --include="*.js" --include="*.jsx" --include="*.ts" --include="*.tsx" \
  | grep -v "__tests__/" | grep -v "\.test\." | grep -v "\.spec\." \
  | grep -vE "console\.(log|warn|info|debug|error)" \
  | wc -l
```

| 항목 | 값 |
|---|---:|
| 한국어 라인 (console 포함) | **16,926** |
| 한국어 라인 (console 제외, §C11=b) | **14,819** |
| console-only 한국어 라인 | **2,107** |

> **Wave-4 변경 0건**: console.log 한국어 메시지는 보존. KPI 측정 산식만 위 grep 명령으로 통일. 본 산식 적용 시 한국어 라인 KPI **≤15,000 이미 달성 (14,819)**.

---

## §2 Wave 매핑 + 누적 커버리지

| Wave | 대상 패턴 | 흡수 라인 (가늠) | 한국어 라인 감축 |
|---|---|---:|---:|
| **Wave-1** | P1 hardcoded_literal Top-50 | ~830 | -830 (P1 잔존 ~730) |
| **Wave-2** | P2 + P3 Top-50 | ~1,805 | -1,805 (P2+P3 잔존 ~1,700) |
| **Wave-3** | P5 throw Error 흡수 44 + P4 0 | ~44 | -44 (P5 보존 27건 잔존) |
| **Wave-4** | P6 console.log (변경 0건, 산식 검증) | 0 | 0 (이미 §C11=b 산식으로 제외) |
| **합계** | — | **~2,679** | **-2,679** |

---

## §3 i18n 키 누락 검증 + 자동 시드 정책

### 3.1 14 namespace 기존 분포

| namespace | leaves | 비고 |
|---|---:|---|
| `admin` | **2,008** | 1차~4차 청크 누적 (어드민 LNB/GNB/dashboard/...) |
| `common` | **486** | UnifiedModal/action/state/nav |
| `erp` | **379** | ERP 도메인 (회계/세무/예산) |
| `settings` | 138 | 사용자/시스템 설정 |
| `error` | 151 | validation/api/network/business 4분류 |
| `report` | 130 | 보고서·진단 |
| `statistics` | 100 | 통계·대시보드 |
| `manualNotification` | 81 | 수동 알림 |
| `schedule` | 74 | 일정·예약 |
| `terms` | 73 | 약관 |
| `testNotification` | 63 | 테스트 알림 |
| `auth` | 59 | 로그인/OAuth |
| `systemConfig` | 46 | 시스템 설정 |
| `smsTemplate` | 36 | SMS 템플릿 |
| **합계** | **3,824** | (4차 청크 PR-L 정착 후) |

### 3.2 자동 시드 추정

| Wave | 패턴 | 추정 신규 키 |
|---|---|---:|
| Wave-1 | P1 (~830 라인) × 0.85 | **~706** |
| Wave-2 | P2+P3 (~1,805 라인) × 0.90 | **~1,624** |
| Wave-3 | P5 (44건) × 1.0 | **~44** |
| **합계** | — | **~2,374** |

> 보수적 추정 (~30% 키 중복 고려). 실제 자동 시드 후 ko leaves 3,824 → ~6,200 (KPI K=1,500 의 **413%** ✅ 압도적 도달).

### 3.3 자동 시드 정책 (PR-L Wave-1 답습)

1. codemod 적용 직전 ko.json 키 정합성 사전 검증 (재귀 leaf scan).
2. 누락 키는 fallback 문자열 자동 시드 (PR-L `auto_seed_keys.py` 답습).
3. JSON valid 검증 (`jq` / `node -e`).
4. `lint:codemod-mappings` 57/57 PASS 게이트 유지.
5. namespace 분할 충돌 회피 — 첫 segment 가 기존 14 namespace 중 하나면 해당 ns 에 배치 (Pattern-G 답습).

---

## §4 namespace 분할 후보 — 신규 0건 권고 (P1 디자이너 SKIP 근거)

| 도메인 | 추가 namespace 후보 | 결정 |
|---|---|:---:|
| dashboard 류 | `dashboard` 신규 | **❌ admin/common 분할 답습** |
| form/validation | `form` 신규 | **❌ error.validation 답습** |
| utils/helpers | `util` 신규 | **❌ common 답습** |

**결정**: 14 namespace 유지. P1 디자이너 SKIP. 근거 — (1) ko leaves 3,824 (목표 1,500의 255%) 이미 압도적 도달 / (2) Wave-1/2/3 codemod 흡수 키는 기존 namespace 첫 segment 매핑으로 흡수 가능 (Pattern-G 답습) / (3) 신규 namespace 도입 시 lint:codemod-mappings 가드 갱신 + Phase 1 정착물 i18n/index.js 변경 발생 — 합의서 §0/§3 무수정 원칙 위배 / (4) 카피·시안 결정도 PR-L Wave-1 답습 (자동 시드 + 사후 검수) 으로 정합 가능.

---

## §5 KPI 시뮬레이션 (Wave 누적)

### 5.1 한국어 라인 (JS/TS, §C11=b 산식)

| 시점 | 한국어 라인 | 격차 (목표 ≤15,000) |
|---|---:|---:|
| Baseline (`982f91252`, console 제외) | **14,819** | **이미 달성 ✅** |
| Wave-1 흡수 후 | ~13,989 | -1,011 (도달) |
| Wave-2 흡수 후 | ~12,184 | -2,816 (도달) |
| Wave-3 흡수 후 | ~12,140 | -2,860 (도달) |
| Wave-4 (변경 0) | 12,140 | -2,860 (유지) |

### 5.2 t() 호출

| 시점 | t() 호출 | 격차 (목표 ≥3,000) |
|---|---:|---:|
| Baseline | **3,049** | **이미 달성 ✅** |
| Wave-1 후 | ~3,879 | +879 (도달) |
| Wave-2 후 | ~5,684 | +2,684 (도달) |
| Wave-3 후 | ~5,728 | +2,728 (도달) |

### 5.3 useTranslation 파일

| 시점 | useTranslation | 격차 (목표 ≥500) |
|---|---:|---:|
| Baseline | **295** | -205 ❌ |
| Wave-1 후 (가늠) | ~340 | -160 |
| Wave-2 후 (가늠) | ~415 | -85 |
| Wave-3 후 (가늠) | ~430 | **-70 ⚠️** |

> **⚠️ KPI 도달 불가 가늠**: Wave-1+2+3 누적 흡수 후에도 useTranslation **~430** 으로 목표 500 격차 -70. utils/constants 류 파일은 React hook 미사용 (function helper) 으로 useTranslation 추가 불가. 운영 보고 시 사유 명시 권고.

### 5.4 ko leaves

| 시점 | ko leaves | 격차 (목표 ≥1,500) |
|---|---:|---:|
| Baseline | **3,824** | **+2,324 (압도적 ✅, 255%)** |
| Wave-1 후 | ~4,530 | **+3,030 (302%)** |
| Wave-2 후 | ~6,154 | **+4,654 (410%)** |
| Wave-3 후 | ~6,198 | **+4,698 (413%)** |

### 5.5 KPI 종합 도달표

| KPI | 목표 | Baseline | Wave-1 | Wave-2 | Wave-3 | 도달 |
|---|---:|---:|---:|---:|---:|:---:|
| 한국어 라인 (§C11=b) | ≤15,000 | 14,819 | 13,989 | 12,184 | 12,140 | ✅ Baseline 부터 |
| t() 호출 | ≥3,000 | 3,049 | 3,879 | 5,684 | 5,728 | ✅ Baseline 부터 |
| useTranslation 파일 | ≥500 | 295 | ~340 | ~415 | **~430** | **⚠️ -70 미달** |
| ko leaves | ≥1,500 | 3,824 | 4,530 | 6,154 | 6,198 | ✅ Baseline 부터 |
| t() 한국어 fallback | 0 | 0 | 0 | 0 | 0 | ✅ PR-L 완수 |
| window.alert/confirm + bare + notificationManager 운영 | 0 | 0 | 0 | 0 | 0 | ✅ |
| ESLint warning 3종 | 0 | 0 | 0 | 0 | 0 | ✅ |
| `lint:codemod-mappings` | 57/57 PASS | 57/57 | 57/57 | 57/57 | 57/57 | ✅ |
| Production Build | PASS | PASS | PASS | PASS | PASS | ✅ |
| HIGH 회귀 | 0 | 0 | 0 | 0 | 0 | ✅ |

**종합 도달**: 9/10 KPI ✅. **useTranslation 만 격차 -70 잔존**.

---

## §6 P1 디자이너 SKIP 결정 + 새 namespace

### 6.1 SKIP 결정

P1 디자이너 핸드오프 **SKIP** — §4 namespace 분할 후보 신규 0건 (14 namespace 유지). PR-L Wave-1 답습으로 자동 시드 정책 + 사후 검수로 카피·시안 결정 가능.

### 6.2 자동 시드 키 추정

Wave-1 ~706 키 + Wave-2 ~1,624 키 + Wave-3 44 키 = **~2,374 신규 키**. ko leaves 3,824 → ~6,198 (KPI 1,500 의 413%).

### 6.3 디자이너 후속 라운드 권고

D5 P5 다국어 진입 시 영문/일본어/중국어 카피 1차 시안 P1 디자이너 핸드오프 권고. 본 5차 청크 PR-M 은 한국어 단일 언어 SSOT 표준화 완결.

---

## §7 게이트 준수 검증

| 게이트 | 검증 |
|---|:---:|
| 운영 코드 (`frontend/src/**`) 0줄 수정 | ✅ |
| `frontend/src/i18n/index.js` 0줄 수정 | ✅ |
| `frontend/src/locales/**` 0줄 수정 | ✅ |
| DB UPDATE / Flyway 0건 | ✅ |
| MCP 외부 호출 0건 | ✅ |
| working tree 산출물 5건 신규 (1 보고서 + 4 JSON + 1 key-parity) | ✅ |
| read-only 측정 + Python 스캔 | ✅ |
| 1~4차 청크 정착물 무수정 | ✅ |
| `lint:codemod-mappings` 57/57 PASS 가드 보존 | ✅ |

---

## §8 PR-M 진입 권고

### 8.1 Wave 진행 순서

**직렬 권장** (3 Wave + 검증 1):

```text
Wave-1 (P1 hardcoded_literal Top-50)
   │
   ▼
Wave-2 (P2 props_label + P3 jsx_text Top-50)
   │
   ▼
Wave-3 (P5 throw new Error 44 흡수, §C12=a)
   │
   ▼
Wave-4 (P6 console.log 보존 + KPI 산식 검증, §C11=b)
   │
   ▼
P3 core-tester (회귀 + KPI 도달 종합 검수)
   │
   ▼
P4 core-deployer (develop → main fast-forward + 운영 외부 HTTPS 검증)
```

### 8.2 5-commit 분할 권고

각 Wave 별 1 commit + Wave-4 검증 1 commit + 종합 KPI 보고 1 commit = **5 commits**:

1. `feat(d5-p4-i18n): PR-M Wave-1 (hardcoded literal Top-50, ~830 라인 + ~706 키 시드)`
2. `feat(d5-p4-i18n): PR-M Wave-2 (props label + jsx text Top-50, ~1,805 라인 + ~1,624 키 시드)`
3. `feat(d5-p4-i18n): PR-M Wave-3 (throw new Error 44 흡수, §C12=a, ~44 키 시드)`
4. `chore(d5-p4-i18n): PR-M Wave-4 console.log 보존 검증 + KPI 산식 통일 (§C11=b)`
5. `docs(d5-p4-i18n): PR-M 종합 KPI 보고서 (한국어 라인 ≤15,000 / t() ≥3,000 / ko leaves ≥1,500 도달)`

### 8.3 KPI 도달 가늠

PR-M 정착 후:
- ✅ 한국어 라인 (§C11=b) 14,819 → ~12,140 (≤15,000 도달)
- ✅ t() 호출 3,049 → ~5,728 (≥3,000 도달)
- ⚠️ useTranslation 295 → ~430 (≥500 격차 -70, utils/constants 한계)
- ✅ ko leaves 3,824 → ~6,198 (≥1,500 도달, 413%)
- ✅ t() fallback 0 (PR-L 완수 보존)
- ✅ alert/confirm/notificationManager 0
- ✅ HIGH 회귀 0

**9/10 KPI 도달**. useTranslation 격차 -70 만 잔존 — D5 P5 다국어 진입 게이트는 본 한국어 SSOT 표준화 완료를 우선 조건으로 하므로 본 차이 ESLint 경계는 운영 보고 + D5 P5 진입 가능 권고.

### 8.4 자원 경합 회피

- Wave-1/2/3/4 순차 진행 (병렬 금지, codemod 자동화 + ko.json 동시 시드 충돌 회피).
- 1~4차 청크 정착물 (`a68886273`) 보존 — 무수정 검증.
- D11 가드 `lint:codemod-mappings` 57/57 PASS 유지.
- `gemini-3.1-pro` 자원 P3 단계만 사용 (P2 코더는 기본 모델).

---

## §9 후속 권고

PR-M 정착 후:
- **즉시 (D5 P4 i18n Phase 2 종료 권고)**: 9/10 KPI 도달 + useTranslation 격차 -70 운영 무지장 + 한국어 SSOT 표준화 완수 → D5 P4 i18n Phase 2 **종결 보고**.
- **D5 P5 다국어 진입 게이트**: 본 한국어 SSOT 정착 (Wave-3 후) → 영문/일본어/중국어 1차 카피 시안 P1 핸드오프 → 별도 라운드.
- **D12 진입**: 사용자 C8=b 컨펌 별도 필요 — 본 인벤토리 범위 외.

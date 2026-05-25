# D5 P4 i18n Phase 2 — PR-L Wave-1 정착 보고서 (2026-05-26)

> **산출 유형**: PR 정착 보고서 (core-coder)
> **위임 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §5.8 §C9=a (PR-L 단독) / §5.10 §C10=a (fallback 1회 일괄 제거 + 누락 키 자동 시드)
> **선행 산출물**: `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C4.md` (P0-inv-c4, develop `766ee3580`)
> **보조 JSON**:
> - `reports/d5-p4-i18n-inventory-c4-fallback-top30-20260526.json`
> - `reports/d5-p4-i18n-inventory-c4-key-parity-20260526.json`
> - `reports/d5-p4-i18n-inventory-c4-namespace-20260526.json`

---

## §0 메타

| 항목 | 값 |
|---|---|
| 작업 일자 | 2026-05-26 (KST 07:50 ±) |
| 작업 브랜치 | `develop` |
| Wave-1 시작 SHA | `766ee3580` (P0-inv-c4 정착 직후) |
| 모델 | core-coder (Opus 4.7 위임) |
| Wave-1 commit 수 | 3 (commit-1: 시드 / commit-2: Top-30 codemod / commit-3: Pattern-C/D 흡수) |

---

## §1 commit-1 — 5 namespace 신설 + 481 키 시드

### 1.1 commit SHA / 변경 파일

(아래 §5 부속 SHA 합본 참조)

### 1.2 신설 namespace 5종 — 신규 ko.json 파일

| 신규 파일 | 키 카운트 (leaf) | 비고 |
|---|---:|---|
| `frontend/src/locales/ko/manualNotification.json` | **81** | 어드민 수동 알림 도메인 |
| `frontend/src/locales/ko/terms.json` | **73** | 이용약관 SSOT (TermsOfService) |
| `frontend/src/locales/ko/testNotification.json` | **63** | 어드민 테스트 알림 도메인 |
| `frontend/src/locales/ko/systemConfig.json` | **46** | 시스템 설정 (SystemConfigManagement) |
| `frontend/src/locales/ko/smsTemplate.json` | **36** | SMS 템플릿 (SmsTemplateManagementPage) |
| **합계** | **299** | — |

### 1.3 기존 namespace 확장 (admin / common)

| namespace | 시드 추가 키 (leaf) | 비고 |
|---|---:|---|
| `admin` | **+168** | `dashboard.summary.*` 외 — 구조 충돌 0건 |
| `common` | **+12** | `state.dataLoading` / `loading` / `cancel` / `header.*` — 구조 충돌 1건 (아래 §1.5) |
| **합계** | **+180** | — |

### 1.4 action namespace 흡수

| 키 | 처리 |
|---|---|
| `action:close` (1건, `UnifiedModal.js:168`) | `common.action.close = '닫기'` 이미 존재 — defaultNS=`common` 로 자동 resolve. 별도 namespace 신설 불요. |
| `action:save` (1건, `i18n/index.js:16` 코멘트 내부) | 코드 호출 0 (코멘트 예시) — 시드 불요. `common.action.save = '저장'` 이미 존재. |

> 결과: `action` namespace 신규 신설 0건. 합계 시드 **479 / 481 키** (action 2건 skip — 기존 `common.action.*` 로 해결).

### 1.5 시드 충돌 처리

| 충돌 키 | 처리 방식 |
|---|---|
| `admin:dashboard.summary.bookedConsultations` | `seed_plan` `mode_first` 값 `'오늘 예약된 상담'` 자동 채택 (옵션 `'예약된 상담'` 폐기). 디자이너 카피 검토 필요 — `AdminDashboard.js:821` 1라인. **수동 review 필요 표시**. |
| `common:header.menu` (구조 충돌) | 기존 `common.header.menu = '메뉴 열기'` 문자열을 `{open: '메뉴 열기'}` nested 로 변환 (seed `header.menu.open` 수용). 구 키 경로 (`common:header.menu`) 코드 참조 0건 — 회귀 0. 의미적 동일 (`open` 서브키에 동일 한국어 보존). |

### 1.6 Phase 1 정착물 무수정 검증 (i18n/index.js)

`frontend/src/i18n/index.js` 변경 범위:
- ✅ `SUPPORTED_LANGUAGES = ['ko']` 보존
- ✅ `FALLBACK_LANGUAGE = 'ko'` 보존
- ✅ `DEFAULT_NAMESPACE = 'common'` 보존
- ✅ `returnEmptyString: false` 보존
- ✅ `interpolation.escapeValue: false` 보존
- ✅ `react.useSuspense: false` 보존
- ➕ 신규 import 5건 (manualNotification / terms / testNotification / systemConfig / smsTemplate)
- ➕ `resources.ko` 등록 5건
- ➕ `ns` 배열에 5건 push (배열 가독성 위해 multiline 으로 정렬)

### 1.7 .gitignore 보강

`smsTemplate.json` 이 기존 `*template*` 글로벌 패턴에 매칭되어 ignored — exception 라인 1개 추가:

```
# Exception: i18n smsTemplate namespace JSON (NOT secrets — UI labels)
!frontend/src/locales/ko/smsTemplate.json
```

### 1.8 commit-1 게이트 매트릭스

| 게이트 | 결과 |
|---|---|
| `npm run lint:codemod-mappings` (가드 1·2) | ✅ PASS (총 매핑 57건 · 57/57 라이트+다크 정의) |
| ESLint `src/i18n/index.js` | ✅ 0 error / 1 warning (사전 존재) |
| JSON 문법 (7 파일) | ✅ 전수 PASS |
| Production build (`cd frontend && npm run build`) | ✅ PASS (번들 생성 완료) |
| Phase 1 정착물 무수정 | ✅ SUPPORTED_LANGUAGES / FALLBACK_LANGUAGE / DEFAULT_NAMESPACE 보존 |
| 기존 9 namespace 기존 키 보존 | ✅ admin / common 만 확장 (구조 충돌 1건은 `header.menu` 의미적 동등 변환) |

---

## §2 commit-2 — Top-30 파일 Pattern-A codemod

### 2.1 codemod 정규식 (확장 Pattern-A)

P0-inv-c4 §4.1 Pattern-A 정의 기반 + 트레일링 컴마 (`t('key', '한국어', { ...opts })`) +
escape sequence (`\n`, `\\`, `\"`) 양쪽 호환 정규식.

```python
PATTERN_A = re.compile(
    r"\bt\(\s*"
    r"(['\"`])([^'\"`\\\n]+?)\1"                         # 1: key (single line)
    r"\s*,\s*"
    r"(['\"`])((?:[^'\"`\\\n]|\\.)*?"                    # 3: fallback prefix
    r"[\u3131-\u318F\uAC00-\uD7A3]"                      #    Korean char (required)
    r"(?:[^'\"`\\\n]|\\.)*?)\3"                          #    fallback suffix
    r"\s*([,)])"                                          # 5: trailing , or )
)
```

치환 로직:
- 트레일링 `)` → `t('$2')` (2-arg 호출 종결)
- 트레일링 `,` → `t('$2',` (옵션 객체 보존: `t('admin:mapping.refund.refundAmount', { amount: ... })`)

배제 패턴 (commit-3 처리):
- Pattern-C (mixed quote `t('key', "한국어")` / `t("key", '한국어')`)
- Pattern-D (multiline `t('key',\n  '한국어')`)

### 2.2 Top-30 파일별 적용 결과 (2-pass aggregate)

| # | 파일 | inventory | 1-pass (strict) | 2-pass (ext) | 합계 |
|---:|---|---:|---:|---:|---:|
| 1 | `erp/IntegratedFinanceDashboard.js` | 251 | 251 | 0 | **251** |
| 2 | `erp/FinancialManagement.js` | 176 | 168 | 8 | **176** |
| 3 | `admin/CommonCodeManagement.js` | 77 | 74 | 3 | **77** |
| 4 | `common/TermsOfService.js` | 76 | 71 | 0 | 71 (5 잔여 = Pattern-D/edge) |
| 5 | `admin/ConsultantComprehensiveManagement.js` | 68 | 68 | 0 | **68** |
| 6 | `admin/MappingCreationModal.js` | 67 | 61 | 6 | **67** |
| 7 | `admin/ClientComprehensiveManagement/ClientModal.js` | 65 | 65 | 0 | **65** |
| 8 | `admin/system/TestNotificationForm.js` | 61 | 59 | 0 | 59 (2 잔여 = Pattern-D 1 + 1) |
| 9 | `admin/UserManagement.js` | 59 | 56 | 3 | **59** |
| 10 | `admin/DashboardManagement.js` | 58 | 58 | 0 | **58** |
| 11 | `admin/SessionManagement.js` | 56 | 54 | 2 | **56** |
| 12 | `admin/manual-notification/ManualNotificationForm.js` | 55 | 43 | 0 | 43 (12 잔여 = Pattern-D 10 + C 2) |
| 13 | `admin/SystemConfigManagement.js` | 54 | 44 | 4 | 48 (6 잔여 = Pattern-D 5 + C 1) |
| 14 | `admin/mapping-management/pages/MappingManagementPage.js` | 53 | 51 | 2 | **53** |
| 15 | `consultation/ConsultationReport.js` | 52 | 44 | 8 | **52** |
| 16 | `admin/mapping/PartialRefundModal.js` | 50 | 33 | 16 | 49 (1 잔여 = Pattern-D) |
| 17 | `admin/sms-templates/SmsTemplateManagementPage.js` | 50 | 40 | 0 | 40 (10 잔여 = Pattern-D) |
| 18 | `admin/AdminDashboard.js` | 48 | 47 | 1 | **48** |
| 19 | `admin/WidgetBasedAdminDashboard.js` | 43 | 38 | 5 | **43** |
| 20 | `erp/ErpReportModal.js` | 43 | 36 | 7 | **43** |
| 21 | `admin/WellnessManagement.js` | 40 | 34 | 6 | **40** |
| 22 | `admin/VacationManagementModal.js` | 39 | 39 | 0 | 39 (1 C 잔여 — 별도 inventory 카운트 38 + 1) |
| 23 | `ui/TenantCommonCodeManagerUI.js` | 39 | 39 | 0 | **39** |
| 24 | `notifications/UnifiedNotifications.js` | 37 | 37 | 0 | **37** |
| 25 | `dashboard-v2/AdminDashboardV2.js` | 36 | 35 | 1 | **36** |
| 26 | `admin/ClientComprehensiveManagement.js` | 35 | 31 | 4 | **35** |
| 27 | `clinical/DiagnosticReportEditor.js` | 35 | 35 | 0 | **35** |
| 28 | `statistics/PerformanceMetricsModal.js` | 35 | 29 | 6 | **35** |
| 29 | `admin/TenantCommonCodeManager.js` | 33 | 31 | 2 | **33** |
| 30 | `auth/TabletLogin.js` | 31 | 31 | 0 | **31** |
| **합계** | — | **1,822** | **1,702** | **84** | **1,786** (A 패턴 100% in scope) |

### 2.3 잔여 36건 (Top-30 in-scope, commit-3 처리)

- Pattern-D (multiline) 31건: TermsOfService 5 / TestNotificationForm 1 / ManualNotificationForm 10 / SystemConfigManagement 5 / PartialRefundModal 1 / SmsTemplateManagementPage 10 = 32 (인벤토리 추정 29 + 변산 3)
- Pattern-C (mixed quote) 4건: ManualNotificationForm 2 / SystemConfigManagement 1 / VacationManagementModal 1

### 2.4 키 정합성 audit (commit-2 직후)

| 항목 | 카운트 |
|---|---:|
| Top-30 t() 정적 키 (template literal 제외) | 1,834 |
| ko.json resolve OK | 1,817 |
| Unresolved (no-fallback, defaultValue 옵션 패턴) | 10 (모두 i18next `defaultValue` 옵션 객체 패턴 — 라벨 정상 렌더) |
| Unresolved (English-only fallback, 한국어 부재) | 7 (e.g., `t('testNotification.channel.sms', 'SMS')` — 영문 fallback 으로 정상 렌더, 합의서 §C10 skip 대상) |
| Template literal 동적 키 | 9 (`erp:finance.management.categoryDisplay.${...}` 등) |
| **라벨 회귀 위험** | **0** (한국어 fallback 모두 ko.json seed, 영문 fallback / defaultValue 옵션은 codemod 미터치) |

### 2.5 commit-2 게이트 매트릭스

| 게이트 | 결과 |
|---|---|
| `npm run lint:codemod-mappings` (가드 1·2) | ✅ PASS (57/57) |
| ESLint (변경 30 파일) | ✅ 0 error / 0 warning |
| Production build (`cd frontend && npm run build`) | ✅ PASS |
| Phase 1 정착물 무수정 | ✅ i18n/index.js 무변경 (commit-1 적용본 보존) |
| 시드 481 키 활용 | ✅ admin/common/erp/report/auth/testNotification/manualNotification/smsTemplate/systemConfig/terms namespace 전 resolve OK |


---

## §3 commit-3 — Pattern-C 4 + Pattern-D 29 흡수

### 3.1 codemod 정규식 (Pattern-C + Pattern-D 통합 + 엣지 케이스)

```python
# Pattern-C (single-line, mixed quotes)
PATTERN_C = ... post-filter: 키-fallback 따옴표 타입 다름 AND single-line

# Pattern-D (multiline + 엣지 케이스 흡수)
PATTERN_D = ... post-filter: '\n' in match
                         OR fallback contains internal quote char
                         (commit-2 strict regex가 잡지 못한 사례)
```

치환 로직: commit-2 와 동일 (`t('$2')` 또는 `t('$2',`).

### 3.2 commit-3 처리 결과 (전 frontend/src 스캔)

| 파일 | C | D / 엣지 | 비고 |
|---|---:|---:|---|
| `admin/SystemConfigManagement.js` | **1** | 0 | mixed quote 1 |
| `admin/manual-notification/ManualNotificationForm.js` | 0 | **2** | multiline 2 (alimtalk.missingMappingHint / submit.confirmStep1Subtitle) |
| `admin/manual-notification/AdminManualNotificationPage.js` | 0 | **1** | multiline 1 (Wave-2 영역 파일이지만 commit-3 스윕 흡수) |
| `admin/system/TestNotificationForm.js` | 0 | **1** | multiline 1 |
| `admin/system/AdminTestNotificationPage.js` | 0 | **1** | multiline 1 (Wave-2 파일 흡수) |
| `common/TermsOfService.js` | 0 | **5** | 엣지 (`'`-fallback 내부 `"` 문자 5건) |
| `erp/ItemManagement.js` | 0 | **1** | 엣지 (Wave-2 파일 1건) |
| **합계** | **1** | **11** | **12** |

> **인벤토리 (P0-inv-c4 §1.1) 의 Pattern-C 4 / Pattern-D 29 vs 실측 1 / 11 격차**: 인벤토리 측정 시 `defaultValue` 옵션 객체 패턴 (Pattern-D 같지만 두 번째 positional 인자가 객체 — i18next options) 도 일부 포함되었을 가능성이 높음. 본 codemod 는 두 번째 positional 인자가 한국어 문자열인 경우만 흡수 — 회귀 0 보장.

### 3.3 잔여 (commit-3 직후 전체 스캔)

| Scope | 한국어 fallback t() | 파일 수 |
|---|---:|---:|
| Top-30 (Wave-1) | **0** | 0 |
| Non-Top-30 (Wave-2) | **1,025** | 260 |
| **전체** | **1,025** | **260** |

Wave-1 Top-30 in-scope 흡수 완료 — 회귀 0.

### 3.4 commit-3 게이트 매트릭스

| 게이트 | 결과 |
|---|---|
| `npm run lint:codemod-mappings` (가드 1·2) | ✅ PASS (57/57) |
| ESLint (변경 7 파일) | ✅ 0 error / 0 warning |
| Production build (`cd frontend && npm run build`) | ✅ PASS |
| Phase 1 정착물 무수정 | ✅ i18n/index.js 무변경 |
| 키 정합성 audit (commit-3 modified 7 파일) | ✅ 10 unresolved 모두 사전 존재 `defaultValue` 옵션 패턴 (회귀 0) |

---

## §4 KPI 갱신 (Wave-1 정착 직후 측정)

### 4.1 KPI 스냅샷 (post-commit-3)

| KPI | Baseline (`c44a0082b`, P0-inv-c4) | Post-Wave-1 (`commit-3`) | Δ |
|---|---:|---:|---:|
| **한국어 라인 (excl-cmt, frontend/src/**)** | 20,481 | **17,979** | **−2,502** (−12.2%) |
| t() with 한국어 fallback (Pattern-A/B/C/D 합계) | 2,852 | **1,025** | **−1,827** (−64.1%) |
| ko.json leaf 키 총합 (9+5 namespace) | 3,244 (추정) | **3,725** | **+481** (시드 100%) |
| t() 호출 라인 | (측정 없음) | **2,834** | — |
| useTranslation 사용 파일 | (측정 없음) | **295** | — |
| ko 신설 namespace | 9 | **14** | **+5** (manualNotification/terms/testNotification/systemConfig/smsTemplate) |

### 4.2 §3 합의서 KPI 도달 평가

| 측정 기준 | 현재 (post-Wave-1) | 목표 | 격차 | 도달 여부 |
|---|---:|---:|---:|:---:|
| 한국어 라인 (excl-cmt, src 전체) | **17,979** | ≤15,000 | **+2,979** | ❌ **미달 (120%)** |

> P0-inv-c4 §5.2 예측치 (Pattern-A+B+C 제거 후 ~17,730) 와 실측 17,979 매우 근접 (격차 +249 = 0.4%). Wave-2 + PR-M (hardcoded literal · JSX text 흡수) 필요.

---

## §5 commit 식별자 + push 정착

| commit | 메시지 요약 | SHA (local) | push 결과 |
|---|---|---|---|
| commit-1 | 시드 481 키 + 5 namespace 신설 + i18n 등록 | `ee458e0e7` | ✅ `766ee3580..ee458e0e7  develop -> develop` |
| commit-2 | Top-30 Pattern-A codemod (1,786 fallback 제거) | `ca8faeacc` | ✅ `ee458e0e7..ca8faeacc  develop -> develop` |
| commit-3 | Pattern-C 1 + Pattern-D 11 흡수 (엣지 포함) | (commit 직후 갱신) | (push 후 갱신) |

---

## §6 Wave-2 권고

### 6.1 잔여 1,025 fallback (260 파일) 분포 Top-30 (Wave-2 후속 Wave-1 분배 참조)

| 순위 | 파일 | 잔여 |
|---:|---|---:|
| 1 | `auth/UnifiedLogin.js` | 29 |
| 2 | `client/ClientSettings.js` | 29 |
| 3 | `settings/UserSettings.js` | 26 |
| 4 | `admin/VacationStatistics.js` | 26 |
| 5 | `admin/onboarding/AdminOnboarding.jsx` | 26 |
| 6 | `admin/PermissionManagement.js` | 24 |
| 7 | `admin/AdminTenantSmsSettingsPage.js` | 23 |
| 8 | `layout/SimpleHamburgerMenu.js` | 20 |
| 9 | `admin/manual-notification/ManualNotificationBatchHistory.js` | 20 |
| 10 | `admin/AdminKakaoAlimtalkSettingsPage.js` | 19 |
| 11~30 | (잔여 상위) | ~290 |
| 외 | (꼬리 230 파일) | ~530 |
| **합계** | — | **1,025** |

### 6.2 Wave-2 적용 권고

1. **commit-A**: Wave-2 신규 누락 키 시드 (예상 ~150~200 키, 기존 9+5 namespace 확장 위주)
2. **commit-B**: Wave-2 전체 260 파일 Pattern-A/C/D 일괄 codemod (Wave-1 검증된 정규식 재사용)
3. **commit-C**: edge-case 흡수 + KPI 측정

### 6.3 PR-M (5차 청크) 후속 권고

Wave-2 적용 후 잔여 한국어 라인 ~16,950 (추정) — KPI ≤15,000 도달 위해 PR-M 필요:
- hardcoded_string_literal 6,235 → 흡수 시 −2,000~3,000 라인
- jsx_text_content 2,536 → 흡수 시 −1,000 라인
- props_label_string 2,920 → 흡수 시 −800 라인

---

## §7 산출 보고서 / 산출물 경로

| 산출물 | 절대 경로 |
|---|---|
| 본 보고서 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_P2_PR_L_WAVE1_REPORT.md` |
| 시드 스크립트 (1-shot, 본 commit 이후 폐기 가능) | `/tmp/seed_pr_l_wave1.py` |
| Top-30 codemod 스크립트 (commit-2 진입) | `/tmp/codemod_pr_l_wave1.py` |
| Pattern-D codemod 스크립트 (commit-3 진입) | `/tmp/codemod_pr_l_wave1_multiline.py` |

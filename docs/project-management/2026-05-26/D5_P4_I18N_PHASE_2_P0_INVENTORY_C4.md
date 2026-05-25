# D5 P4 i18n Phase 2 — P0-inv-c4 4차 청크 인벤토리 보고서 (2026-05-26)

> **산출 유형**: 인벤토리 보고서 (read-only). 운영 코드 `frontend/src/**`, `frontend/src/i18n/index.js`, `frontend/src/locales/**`, `scripts/**` 0줄 수정.
> **위임 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §4.1 P0-inv + §6.1 PR-INV (4차 청크 PR-L 분배 사전 측정 · §5.8 §C9=a · §5.10 §C10=a 정착 직후)
> **선행 산출물**: `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C3.md` (3차 청크 시작 SHA `a011a8a44`)
> **3차 청크 정착**: main `ec273de76` (Frontend deploy `26421811625` success, 2026-05-26 KST)
> **산출물 동반**:
> - `reports/d5-p4-i18n-inventory-c4-fallback-top30-20260526.json`
> - `reports/d5-p4-i18n-inventory-c4-key-parity-20260526.json`
> - `reports/d5-p4-i18n-inventory-c4-namespace-20260526.json`

---

## §0 메타

| 항목 | 값 |
|---|---|
| 측정 일자 | 2026-05-26 (KST 07:30 ±) |
| 측정 브랜치 | `develop` (working tree clean) |
| 측정 SHA (develop HEAD) | `c44a0082b` (§5.8 §C9=a / §5.10 §C10=a 정착 직후) |
| 운영 main HEAD (3차 청크 정착) | `ec273de76` (Frontend deploy `26421811625` success) |
| 1차 청크 P0-inv 기준 SHA | `9e22d9e4c` |
| 2차 청크 P0-inv 기준 SHA | `d3586eab8` |
| 3차 청크 P0-inv 기준 SHA | `a011a8a44` |
| 합의서 SHA | `c44a0082b` (§5.8 9건 일괄 채택 직후) |
| 측정 도구 | Python 3 재귀 스캔 + ko.json AST 키 검증 + 7 정규식 패턴 (A/B/C×2/D×2/E) |
| 스캔 범위 | `frontend/src/**/*.{js,jsx,ts,tsx}` (총 **1,061** 파일) |
| 한국어 매칭 패턴 | `[\u3131-\u318F\uAC00-\uD7A3]` (한글 자모·완성형) |
| 주석 제외 패턴 | `^\s*(//|\*|/\*)` |
| 4차 청크 단일 카테고리 | **PR-L (fallback 인자 일괄 제거 + 누락 키 자동 시드)** — §5.8 §C9=a / §5.10 §C10=a |

게이트 준수: 운영 코드 수정 0건, develop commit/push 0건 (working tree 에 산출물 4건만 신규 — 후속 commit 은 core-planner 담당), Flyway/DB 변경 0건, MCP 외부 호출 0건.

---

## §1 Fallback 인자 패턴 정밀 인벤토리 (Pattern-A~G)

### 1.1 패턴 정의 + 합계

| Pattern | 정의 | 매칭 | 영향 파일 | 한국어 fallback 한정 |
|---|---|---:|---:|---|
| **A (inline single-quote)** | `t('ns:key', '한국어 fallback')` 단일 라인, 양쪽 single-quote | **2,819** | 290 | 100% |
| **B (inline double-quote)** | `t("ns:key", "한국어 fallback")` 양쪽 double-quote | **0** | 0 | — |
| **C (mixed quote)** | `t('ns:key', "한국어")` 또는 `t("ns:key", '한국어')` | **4** (sd 4 + ds 0) | 3 | 100% |
| **D (multiline)** | `t('ns:key',\n  '한국어')` — 인자가 줄 바꿈 | **29** (single 29 + double 0) | 7 | 100% |
| **E (template literal)** | `` t(`ns:key`, `한국어`) `` | **0** | 0 | — |
| **합계** | — | **2,852** | **290** (유니크) | — |

> 사용자 narrative `2,814 in 291 files` 와 ±0.4% 격차 — `\bt\(` 단어경계 + JSX/TS 인자 escape 차이 (`\\.`) 처리로 본 측정 채택. 운영 fallback 인자 ~5,500~7,000 라인 narrative 는 **fallback 인자 라인** (다중 fb/라인 포함) 가늠치 — 본 측정 fallback 매칭 라인 유니크 ~2,750 라인 (refined scenario 일치).

### 1.2 키 prefix 분류 (Pattern-F / Pattern-G)

| 분류 | 정의 | 카운트 | 비율 |
|---|---|---:|---:|
| `colon` (Pattern 정상) | `'admin:lnb.dashboard'` — `:` 구분자 | **1,788** | 62.7% |
| `dot` (**Pattern-G**) | `'admin.lnb.dashboard'` — `:` 없음, 첫 segment 를 namespace 로 추정 | **1,064** | 37.3% |
| `plain` (**Pattern-F**) | `'dashboard'` — namespace prefix 0 | **0** | 0% |

> **Pattern-G 1,064 건** 은 `t('admin.users.delete', ...)` 형태로 `:` 가 없음. PR-L codemod 정규식은 `:` 와 `.` 둘 다 인식하므로 영향 없음. ko.json 키 정합성 검증 시 첫 segment 를 namespace 로 매핑 (이미 admin/common/erp 등 모두 첫 segment 가 기존 namespace).

### 1.3 패턴 분포 — Pattern-A 우월적 (99% 이상)

- **Pattern-A 가 99.0% 점유 (2,819/2,852)** — 1~3차 청크 PR-D 정착 패턴 그대로.
- Pattern-B (double-quote) 0건 — 코드베이스에서 double-quote fallback 채택된 적 없음.
- Pattern-C (mixed) 4건 — 3 파일에 분산 (수동 검토 가능 수준).
- Pattern-D (multiline) 29건 — 7 파일에 집중 (`SmsTemplateManagementPage.js` 10건 + `ManualNotificationForm.js` 11건 + `SystemConfigManagement.js` 5건 + 외).
- Pattern-E (template literal) 0건 — 향후 channel/dynamic key 도입 전까지 0 유지.

> **PR-L codemod 단일 정규식 정합성 ✅**: `t\(\s*(['"`])([^'"`\\]+)\1\s*,\s*(['"`])([^'"`\\]*[\u3131-\u318F\uAC00-\uD7A3][^'"`\\]*)\3\s*[,)]` → `t('$2')` 1패스로 A+B+C+E 모두 흡수. Pattern-D (multiline 29건) 만 별도 정규식 (`re.MULTILINE`/`\n`) 또는 수작업 흡수 필요.

---

## §2 파일별 분포 (Top-30) + 누적 커버리지

### 2.1 Wave 커버리지 (전체 290 파일 대비)

| 컷오프 | 파일 수 | fallback 합계 | 커버리지 |
|---|---:|---:|---:|
| Top-30 | 30 | 1,822 | **63.9%** |
| Top-50 | 50 | 2,208 | 77.4% |
| Top-100 | 100 | 2,525 | 88.5% |
| Top-150 | 150 | 2,663 | 93.4% |
| Top-200 | 200 | 2,762 | 96.8% |
| 전체 | **290** | **2,852** | 100% |

### 2.2 Top-30 핵심 (보조 JSON 전수 참조)

| # | 파일 | fb total | by_pattern | t() 라인 | ko 라인 (excl-cmt) | 주 namespace |
|---:|---|---:|---|---:|---:|---|
| 1 | `components/erp/IntegratedFinanceDashboard.js` | **251** | A 247 / D 4 | 245 | 513 | erp 229 + common 22 |
| 2 | `components/erp/FinancialManagement.js` | **176** | A 176 | 172 | 182 | erp 176 |
| 3 | `components/admin/CommonCodeManagement.js` | **77** | A 77 | 79 | 84 | admin 77 |
| 4 | `components/common/TermsOfService.js` | **76** | A 76 | 70 | 70 | **terms 76 (신규)** |
| 5 | `components/admin/ConsultantComprehensiveManagement.js` | **68** | A 68 | 68 | 223 | admin 64 + common 4 |
| 6 | `components/admin/MappingCreationModal.js` | **67** | A 67 | 66 | 83 | admin 62 + common 5 |
| 7 | `components/admin/ClientComprehensiveManagement/ClientModal.js` | **65** | A 65 | 69 | 76 | admin 62 + common 3 |
| 8 | `components/admin/system/TestNotificationForm.js` | **61** | A 61 | 55 | 67 | **testNotification 61 (신규)** |
| 9 | `components/admin/UserManagement.js` | **59** | A 59 | 55 | 60 | admin 57 + common 2 |
| 10 | `components/admin/DashboardManagement.js` | **58** | A 58 | 57 | 74 | admin 57 + common 1 |
| 11~30 | (보조 JSON `top30_files[]` 전수) | **864** | A 핵심 + D 21 + C 1 | 919 | 1,539 | admin/common/auth/erp/manualNotification 혼합 |
| **합계** | — | **1,822** | A 1,793 + D 25 + C 4 | 1,785 | 2,941 | — |

- Top-30 평균 fb/파일: **60.7**
- Top-30 평균 ko 라인 (excl-cmt): **98.0**
- Top-30 합계 fallback **1,822 / 2,852 = 63.9% 커버리지** — PR-L Wave-1 단독으로 한국어 라인 ~1,700~1,800 라인 감축 가능.

> JSON 산출: `reports/d5-p4-i18n-inventory-c4-fallback-top30-20260526.json` (13 KB, Top-30 전수 + by_pattern + by_namespace).

---

## §3 ko.json 키 정합성 검증

### 3.1 매칭 / 누락 (occurrence 기준 587건 / 유니크 키 481개)

| 항목 | 값 |
|---|---:|
| 전체 fallback 매칭 occurrence | **2,852** |
| ko.json 키 매칭 (`matched`) | **2,265** (79.4%) |
| ko.json 키 부재 (`missing`) | **587** (20.6%) |
| 누락 유니크 키 (mode-resolved 시드 대상) | **481** |
| 시드 충돌 (동일 키 다중 fallback) | **1** (admin:dashboard.summary.bookedConsultations) |

### 3.2 namespace 별 정합성 분포

| namespace | ko/ 존재 | fallback 합계 | matched | missing occ | missing 유니크 | 파일 |
|---|:---:|---:|---:|---:|---:|---:|
| **admin** | ✅ | 1,175 | 974 (82.9%) | 201 | **168** | 125 |
| **common** | ✅ | 531 | 508 (95.7%) | 23 | **12** | 199 |
| **erp** | ✅ | 406 | 406 (100%) | 0 | 0 | 3 |
| **report** | ✅ | 120 | 120 (100%) | 0 | 0 | 4 |
| **settings** | ✅ | 119 | 119 (100%) | 0 | 0 | 6 |
| **statistics** | ✅ | 78 | 78 (100%) | 0 | 0 | 9 |
| **auth** | ✅ | 60 | 60 (100%) | 0 | 0 | 2 |
| `error` | ✅ | 0 | 0 | 0 | 0 | 0 |
| `schedule` | ✅ | 0 | 0 | 0 | 0 | 0 |
| **manualNotification** | ❌ (신규) | 103 | 0 | 103 | **81** | 5 |
| **testNotification** | ❌ (신규) | 82 | 0 | 82 | **63** | 4 |
| **terms** | ❌ (신규) | 76 | 0 | 76 | **73** | 1 |
| **systemConfig** | ❌ (신규) | 54 | 0 | 54 | **46** | 1 |
| **smsTemplate** | ❌ (신규) | 46 | 0 | 46 | **36** | 1 |
| **action** | ❌ (신규) | 2 | 0 | 2 | **2** | 2 |
| **합계** | — | **2,852** | **2,265** | **587** | **481** | **290** |

### 3.3 신규 namespace 필요 — 6종

PR-L 시드 단계 사전에 `frontend/src/locales/ko/` 신규 파일 6종 생성 + `frontend/src/i18n/index.js` 등록 필요:

| 신규 namespace | 시드 키 수 | 대표 사용처 | 분리 사유 |
|---|---:|---|---|
| `manualNotification` | **81** | `admin/manual-notification/ManualNotificationForm.js`, `ManualNotificationBatchHistory.js` 외 3 파일 | 어드민 수동 알림 도메인 — admin 분리 (도메인 응집) |
| `testNotification` | **63** | `admin/system/TestNotificationForm.js` 외 3 파일 | 어드민 테스트 알림 도메인 — admin 분리 |
| `terms` | **73** | `components/common/TermsOfService.js` | 약관·이용 정책 SSOT — common 분리 (다국어 번역 시 별도 톤) |
| `systemConfig` | **46** | `admin/SystemConfigManagement.js` (1 파일) | 시스템 설정 도메인 — admin 분리 |
| `smsTemplate` | **36** | `admin/sms-templates/SmsTemplateManagementPage.js` (1 파일) | SMS 템플릿 도메인 — admin 분리 |
| `action` | **2** | (2 파일 산발, `'action:save'` 형태) | 검토 필요 — `common.action.*` 흡수 권고 (action 신설 vs common 통합) |
| **합계** | **301** | — | — |

> **결정 권고**: `action` 2건은 신규 namespace 신설 회피 → **common 흡수** (`common:action.save` 등) 권장. 나머지 5종 신설 — `manualNotification`/`testNotification` 은 `admin:notification.manual.*` / `admin:notification.test.*` 흡수 옵션도 있음 (PR-L 진입 직전 core-planner 결정).

### 3.4 시드 충돌 1건 (mode-resolved)

| namespace:sub_key | 옵션 (count) | 시드 채택값 | 비고 |
|---|---|---|---|
| `admin:dashboard.summary.bookedConsultations` | `오늘 예약된 상담` (1x) / `예약된 상담` (1x) | (mode = 첫 등장값) `오늘 예약된 상담` | 1:1 동률 — 디자이너 카피 검토 권고. PR-L 적용 후 사용자 검수 1건. |

> 시드 충돌 1건만 발생 — codemod 안정성 매우 높음. mode-resolved 자동 시드 + 충돌 케이스 1건은 manual review 로 마무리.

> JSON 산출: `reports/d5-p4-i18n-inventory-c4-key-parity-20260526.json` (264 KB) — matched 50건 샘플 + missing 587건 전수 + seed_plan 481키 + seed_conflicts 1건.

---

## §4 자동 시드 정책 (§5.10 §C10=a 적용)

### 4.1 시드 정책 (4-step PR-L 워크플로)

#### Step 1 — 사전 시드 (PR-L Step-1, 코드 적용 전)

```
입력: reports/d5-p4-i18n-inventory-c4-key-parity-20260526.json (seed_plan)
적용:
  1. 신규 namespace 6종 (action/manualNotification/testNotification/terms/systemConfig/smsTemplate)
     중 추가 채택 5종 — 각 frontend/src/locales/ko/{ns}.json 신설 (action 은 common 흡수)
  2. frontend/src/i18n/index.js 에 namespace 5종 등록 (+15줄 가량)
  3. 기존 namespace (admin 168 + common 12 = 180키) 확장
  4. 신규 namespace (manualNotification 81 + testNotification 63 + terms 73 + systemConfig 46 + smsTemplate 36 + action 2(common 흡수) = 299~301 키) 신설
  5. 시드 값: fallback 인자 문자열 그대로 (mode-resolved)
```

- 시드 총 keys: **481** (180 기존 namespace 확장 + 301 신규)
- 시드 conflict 1건 (`admin:dashboard.summary.bookedConsultations`) — 첫 등장값 채택 + 사용자 검수 1건 별첨

#### Step 2 — codemod 정규식 일괄 제거

```regex
정규식: \bt\(\s*(['"])([^'"\\]+)\1\s*,\s*(['"`])([^'"`\\]*[\u3131-\u318F\uAC00-\uD7A3][^'"`\\]*)\3\s*[,)]
대체:   t('$2')
```

- 영향: Pattern-A 2,819 + Pattern-B 0 + Pattern-C 4 + Pattern-E 0 = **2,823 매칭** (single-line)
- Pattern-D (multiline 29건) 은 별도 정규식 (`re.MULTILINE` + `\n` 매칭) 또는 7 파일 수작업 흡수

#### Step 3 — `lint:codemod-mappings 57/57 PASS` 검증

- 적용 후 D11 가드 (`npm run lint:codemod-mappings`) — i18n 영역과 영역 무관하지만 회귀 0 확인 필수
- ESLint warning/error 추가 0 검증

#### Step 4 — Production Build PASS 검증

- `cd frontend && npm run build` — JS/CSS 번들 PASS
- 라벨 표시 회귀 0 (시드 481키 적용 후 모든 t() 호출이 ko.json 키 매칭 — namespace 6종 register 정합 필수)

### 4.2 시드 정책 부가 옵션

| 옵션 | 권고 | 영향 |
|---|---|---|
| 충돌 1건 처리 | **mode-first (PR-L 자동) + 후속 manual review** | 1키 1라인 수동 패치 |
| `action` namespace | **common 흡수** (`common:action.save`) — 신규 namespace 최소화 | `common.json` +2키 |
| Pattern-D 29건 처리 | **별도 정규식 1패스 + 수작업 검증** (7 파일) | PR-L 내 sub-commit 1건 |
| Pattern-G (dot prefix) 1,064건 | **PR-L 그대로 흡수** (정규식은 separator 무관) | 별도 처리 불요 |

### 4.3 라벨 표시 회귀 차단 (핵심)

- 시드 481키 + 6 신규 namespace 등록을 **Step 2 codemod 전에 commit 분리** 적용 → 시드 commit 단독 build PASS 후 codemod commit 적용
- 누락 키 0 보장: codemod 전 ko.json 매칭율 100% (`scripts/i18n-key-audit.js` 신설 권장 — read-only)
- React i18next `fallbackLng` / `returnEmptyString: false` 정합 — `i18n/index.js` 설정 유지 시 키 부재 시에도 키 자체가 표시됨 (회귀 가시화 ✅)

---

## §5 한국어 라인 감축 예상 (시나리오)

### 5.1 다중 시나리오 (baseline + 3 시나리오)

| 시나리오 | 가정 | ko (excl-cmt, src) | ko (excl-cmt, components) | ko (raw, src) | ko (raw, components) | Δ src (excl-cmt) | 목표 격차 |
|---|---|---:|---:|---:|---:|---:|---:|
| **Baseline** | 현재 (`c44a0082b`) | **20,481** | 15,919 | 30,306 | 21,350 | — | +5,481 |
| **Pattern-A 만 제거** | single-quote single-line fallback | 17,734 | 13,175 | 27,558 | 18,606 | **−2,747** | +2,734 |
| **Pattern-A+B+C 제거 (권장 codemod 1패스)** | 모든 quoted single-line fallback | 17,730 | 13,171 | 27,554 | 18,602 | **−2,751** | +2,730 |
| **모든 fallback (incl. Pattern-D)** | + multiline (29건) | 17,730 | 13,171 | 27,554 | 18,602 | **−2,751** | +2,730 |

### 5.2 KPI 도달 가능성 평가

| 측정 기준 | PR-L 후 (예상) | 목표 | 격차 | 도달 여부 |
|---|---:|---:|---:|:---:|
| **한국어 라인 (excl-cmt, src 전체)** = 합의서 KPI 기준 | **17,730** | ≤15,000 | **+2,730** | ❌ **미달 (118%)** |
| 한국어 라인 (excl-cmt, components 한정) | 13,171 | (참고) ≤9,000 추정 | +4,171 | ❌ (참고) |
| 한국어 라인 (raw, src 전체) | 27,554 | (참고) | — | (참고) |

> **결론**: **PR-L 단독으로 한국어 라인 ≤15,000 KPI 미달 (격차 +2,730).** PR-L 흡수 후에도 fallback 외 한국어 잔존 17,730 라인 — 추가 작업 필요. 본질 원인은 fallback 외 한국어 잔존 (hardcoded literal · JSX text · console.log 등).

### 5.3 잔여 17,730 라인 (post-PR-L) 분류

| 카테고리 | 라인 수 | 비율 | i18n 흡수 필요 여부 |
|---|---:|---:|---|
| `hardcoded_string_literal` (변수·return·prop 할당 문자열) | **6,235** | 35.2% | ✅ 필요 (PR-M/N 후속) |
| `other_or_template` (template literal·기타) | **3,340** | 18.8% | ✅ 부분 필요 |
| `props_label_string` (label/placeholder/title/text/message/description/tooltip) | **2,920** | 16.5% | ✅ 필요 (UX 일관성) |
| `jsx_text_content` (`>한국어<`) | **2,536** | 14.3% | ✅ 필요 (가장 visible) |
| `console_log` (디버깅·로그) | **2,203** | 12.4% | ⚠️ 정책 결정 — i18n 면제 가능 |
| `notification_or_dispatch` (notify/toast/dispatch) | **364** | 2.1% | ✅ 필요 |
| `throw_new_error` (Error 메시지) | **118** | 0.7% | ⚠️ 정책 결정 — 개발자 메시지 vs 사용자 메시지 |
| `t_call_interp_or_key_with_korean` (edge case) | **8** | 0.0% | ⚠️ codemod skip 대상 (§5.4) |
| `alert_confirm_raw` (잔존 alert/confirm) | **6** | 0.0% | ✅ stories/test 잔존 (운영 0) |
| **합계** | **17,730** | 100% | — |

### 5.4 PR-L codemod skip 대상 — Edge case 8건

PR-L 정규식 적용 시 **fallback 제거 후에도 t() 같은 라인에 한국어 잔존** = JSX text 또는 defaultValue 패턴:

```
frontend/src/components/ui/Table/TableExamples.js:135,145,155
  <td data-label={t('common.labels.name', '이름')}>샘플</td>   ← '샘플' JSX text 잔존
frontend/src/components/admin/manual-notification/ManualNotificationBatchHistory.js:220,221
  t('manualNotification.result.statSuccess', { count: '', defaultValue: '성공' })   ← defaultValue 객체 인자
frontend/src/components/dashboard/widgets/consultation/ConsultantRegistrationWidget.js:535,536,541
  <option value="부부상담">{t('common.labels.coupleConsultation', '부부상담')}</option>   ← option value+JSX text 잔존
```

- TableExamples 3 / ConsultantRegistrationWidget 3 = stories/option 영역 (운영 회귀 LOW)
- ManualNotificationBatchHistory 2 = **defaultValue 객체 패턴** — PR-L 정규식 미인식 → **별도 codemod** 또는 수작업 흡수 (defaultValue 객체 → `t('key')` 1인자 단순화 후 시드 키 추가)
- 시드 정책: `defaultValue` 값 → `t()` 키 시드값 채택 (mode-first 일치)

### 5.5 한국어 라인 ≤15,000 도달 경로

PR-L 단독 미달 — 추가 라운드 필요:

1. **PR-L (4차 청크)**: fallback 일괄 제거 → 17,730 라인 (-2,751)
2. **PR-M (5차 청크 가정)**: hardcoded_string_literal + props_label_string + jsx_text_content 흡수 (목표 -3,000~-4,000) → ~13,730~14,730
3. **정책 검토 (사용자 결정 필요)**:
   - `console_log` 2,203 라인 — 디버그 로그 한국어 → 영문 전환 또는 i18n 면제 정책 결정
   - `throw_new_error` 118 라인 — 사용자 노출 여부에 따라 i18n 흡수 결정

> **PR-L 4차 청크 KPI 도달 단독 불가 — 합의서 §3 KPI N=15,000 도달은 5~6차 청크 (PR-M/N) 까지 누적 필요**. 본 P0-inv-c4 §5.4 §5.5 사용자 보고 필수 (C8=b 게이트 정착 후 4차 청크 자체는 무중단 진행).

---

## §6 트랙·namespace 별 분포

### 6.1 14 namespace 분포 (기존 9 + 신규 6 — 1개 중복 제외)

| namespace | ko/ 존재 | fb 매칭 | 매칭율 | 시드 유니크 | 파일 수 |
|---|:---:|---:|---:|---:|---:|
| admin | ✅ | 1,175 | 82.9% | 168 | 125 |
| common | ✅ | 531 | 95.7% | 12 | 199 |
| erp | ✅ | 406 | 100% | 0 | 3 |
| report | ✅ | 120 | 100% | 0 | 4 |
| settings | ✅ | 119 | 100% | 0 | 6 |
| manualNotification | ❌ (신설) | 103 | 0% | 81 | 5 |
| testNotification | ❌ (신설) | 82 | 0% | 63 | 4 |
| statistics | ✅ | 78 | 100% | 0 | 9 |
| terms | ❌ (신설) | 76 | 0% | 73 | 1 |
| auth | ✅ | 60 | 100% | 0 | 2 |
| systemConfig | ❌ (신설) | 54 | 0% | 46 | 1 |
| smsTemplate | ❌ (신설) | 46 | 0% | 36 | 1 |
| action | ❌ (common 흡수 권고) | 2 | 0% | 2 | 2 |
| error | ✅ | 0 | — | 0 | 0 |
| schedule | ✅ | 0 | — | 0 | 0 |
| **합계** | — | **2,852** | **79.4%** | **481** | **290** (유니크) |

> JSON 산출: `reports/d5-p4-i18n-inventory-c4-namespace-20260526.json` (6.6 KB) — distribution + seed_plan + scenarios + new_namespaces.

### 6.2 신규 namespace 5종 신설 영향

- `frontend/src/locales/ko/` 신규 5 JSON 파일 신설 (action 은 common 흡수)
- `frontend/src/i18n/index.js` namespace 5종 등록 (+5~10줄)
- 라벨 표시 회귀 0 — 모든 시드 키가 fallback 값 그대로 등록되므로 사용자 노출 텍스트 변화 0

---

## §7 PR-L Wave-1 / Wave-2 분배 권고

### 7.1 분배 원칙

- **Wave-1 (Top-30 흡수)**: 30 파일 / fallback **1,822 (63.9%)** / 누락 키 시드 ~300+ / ko 라인 감축 ~1,750
- **Wave-2 (잔여 흡수)**: 260 파일 / fallback **1,030 (36.1%)** / 누락 키 시드 ~180 / ko 라인 감축 ~1,000

### 7.2 Wave-1 (Top-30, 권장 단일 commit)

| 항목 | 값 |
|---|---:|
| 파일 수 | 30 |
| fallback 제거 | **1,822** |
| ko 라인 감축 예상 | **~1,750** (Top-30 fallback_lines 평균 비율) |
| 시드 키 (Top-30 영향) | ~300+ (admin 168 中 ~120 + 신규 namespace 핵심 ~180) |
| 영향 namespace | admin / common / erp / terms / testNotification / manualNotification 외 |
| 대표 파일 (Top-5) | IntegratedFinanceDashboard (251) / FinancialManagement (176) / CommonCodeManagement (77) / TermsOfService (76) / ConsultantComprehensiveManagement (68) |

### 7.3 Wave-2 (잔여 260 파일, 단일 commit 또는 namespace 별 분할)

| 항목 | 값 |
|---|---:|
| 파일 수 | 260 |
| fallback 제거 | **1,030** |
| ko 라인 감축 예상 | **~1,000** |
| 시드 키 (Wave-2 영향) | ~180 (admin 168-120 + common 12 + 잔여 신규 namespace 분산) |

### 7.4 분할 합 (Wave-1 + Wave-2 = PR-L 전체)

| 항목 | Wave-1 | Wave-2 | 합계 |
|---|---:|---:|---:|
| 파일 수 | 30 | 260 | **290** |
| fallback 제거 | 1,822 | 1,030 | **2,852** |
| ko 라인 감축 | ~1,750 | ~1,000 | **~2,751** |
| 시드 유니크 키 | ~300 | ~180 | **481** |
| 신규 namespace 신설 | (5종 모두 Wave-1 사전 적용) | — | 5 (+`i18n/index.js` 등록) |

### 7.5 권고 — Step 분할 (시드/codemod 별 commit 분리)

```
PR-L commit graph (4 commits in single PR):
  ① feat(i18n-locale): 5 신규 namespace 신설 + 481 키 시드 (manual conflict 1건 review)
     - frontend/src/locales/ko/{manualNotification,testNotification,terms,systemConfig,smsTemplate}.json 신설
     - frontend/src/locales/ko/{admin,common}.json 확장 (admin +168 / common +12+2 action 흡수)
     - frontend/src/i18n/index.js namespace 5종 등록
     - Step 검증: build PASS + lint:codemod-mappings 57/57 PASS
  ② chore(i18n-codemod): PR-L Wave-1 Top-30 fallback 제거 (1,822 매칭)
     - 30 파일 codemod 적용 (정규식 단일 패스)
     - Step 검증: build PASS + lint:codemod-mappings 57/57 PASS + 라벨 회귀 0
  ③ chore(i18n-codemod): PR-L Wave-2 잔여 260 파일 fallback 제거 (1,030 매칭)
     - 260 파일 codemod 적용
     - Step 검증: build PASS + lint:codemod-mappings 57/57 PASS + 라벨 회귀 0
  ④ chore(i18n-codemod): PR-L Pattern-D multiline 29건 + edge case 8건 흡수
     - 7 파일 수작업 (Pattern-D) + 3 파일 (edge case)
     - Step 검증: build PASS + lint:codemod-mappings 57/57 PASS + 사용자 검수 1건 (시드 충돌)
```

---

## §8 리스크·게이트

### 8.1 게이트 (PR-L 운영 push 사전)

| 게이트 | 통과 조건 | 검증 방법 |
|---|---|---|
| **G-PR-L-1** D11 가드 lint:codemod-mappings | 57/57 PASS | `npm run lint:codemod-mappings` |
| **G-PR-L-2** ESLint 신규 warning/error 0 | 0 추가 | `npm run lint` |
| **G-PR-L-3** Phase 1 정착물 무수정 | `i18n/index.js` 정합 + 기존 namespace 무파괴 | git diff 검증 |
| **G-PR-L-4** Production Build PASS | JS/CSS 번들 PASS | `cd frontend && npm run build` |
| **G-PR-L-5** 라벨 표시 회귀 0 | 시드 481키 100% 적용 후 codemod 적용 | i18n key audit script + 시각 회귀 P3 |
| **G-PR-L-6** 시드 충돌 1건 manual review | `admin:dashboard.summary.bookedConsultations` 디자이너 컨펌 | core-designer 또는 사용자 1건 review |

### 8.2 리스크

1. **R-1 (중)**: PR-L codemod 광역 적용 (290 파일, 2,852 매칭) — diff ~3,000+ 라인. 단일 PR 충돌 위험 (D11 라운드 동시 진행 시).
   - 완화: §7.5 4-commit 분할 + Step별 검증 게이트 + `gemini-3.1-pro` 단독 가동.

2. **R-2 (중)**: 신규 namespace 5종 신설 (i18n/index.js 등록 + 5 JSON 파일 신설) — Phase 1 정착물 영역 진입.
   - 완화: 신규 등록만 — 기존 namespace 9종 무수정 / 시드 commit 단독 build PASS 검증 후 codemod 적용.

3. **R-3 (저)**: Pattern-D (multiline 29건) + Edge case 8건 수작업 — 자동화 미흡 영역.
   - 완화: 7+3 = 10 파일 — 사람이 1시간 내 처리 가능 / 정규식 별도 1패스로 흡수 가능.

4. **R-4 (저)**: 시드 충돌 1건 (`admin:dashboard.summary.bookedConsultations`) — 동일 키에 `오늘 예약된 상담` / `예약된 상담` 1:1 동률.
   - 완화: mode-first 자동 채택 + 사용자 검수 1건 보고 (PR-L 진입 직전 1라인 수동 패치).

5. **R-5 (중)**: KPI 한국어 라인 ≤15,000 단독 미달 (격차 +2,730) — 사용자 보고 필요.
   - 완화: §5.4 §5.5 잔여 분류 + PR-M 후속 라운드 필요성 사전 안내 (C8=b 게이트 정착 후 4차 청크 무중단 진행).

6. **R-6 (저)**: `console.log` 2,203 라인 + `throw_new_error` 118 라인 i18n 면제 정책 미합의.
   - 완화: PR-M 진입 직전 합의서 §C11 (console.log 정책) / §C12 (Error 메시지 정책) 사용자 컨펌 별도 진행.

### 8.3 회귀 안전 마진

- 시드 481키 적용 후 codemod 적용 → 라벨 표시 회귀 0 보장 (시드 = fallback 값 동일).
- React i18next `fallbackLng: 'ko'` + `returnEmptyString: false` 유지 — 키 부재 시 키 자체 표시 (회귀 가시화 ✅).
- 시각 회귀 P3: Top-30 + 신규 namespace 5종 사용처 (terms 1 + testNotification 4 + manualNotification 5 + systemConfig 1 + smsTemplate 1 = 12 파일 + Top-30 30 = ~42 파일) 스크린샷 회귀 권장.

---

## §9 산출물 절대 경로

| 산출물 | 절대 경로 | 비고 |
|---|---|---|
| 본 마크다운 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C4.md` | 신규 생성 |
| fallback Top-30 JSON | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-c4-fallback-top30-20260526.json` | 신규 생성 (13 KB) |
| ko 키 정합성 JSON | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-c4-key-parity-20260526.json` | 신규 생성 (264 KB, matched 50 sample + missing 587 + seed_plan 481) |
| namespace JSON | `/Users/mind/mindGarden/reports/d5-p4-i18n-inventory-c4-namespace-20260526.json` | 신규 생성 (6.6 KB, distribution + scenarios) |
| 선행 3차 청크 P0-inv | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C3.md` | 참조 |
| 선행 2차 청크 P0-inv | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C2.md` | 참조 |
| 선행 1차 청크 P0-inv | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY.md` | 참조 |
| 3차 청크 P4 정착 보고서 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_P4_PRODUCTION_PUSH_REPORT_C3.md` | 참조 |
| 합의서 | `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` | SHA `c44a0082b` (§5.8 §C9=a / §5.10 §C10=a 정착) |

---

## §10 후속 위임 권고 (core-planner 인계)

본 P0-inv-c4 인벤토리는 **working tree 산출물만 4건** — 후속 commit 은 core-planner 담당:

1. **commit**: `chore(d5-p4-i18n): P0-inv-c4 4차 청크 인벤토리 보고서 + reports JSON 3건 신규 (read-only 측정)` (본 문서 + 3 JSON)
2. **PR-L 진입 사전 정책 결정**:
   - `action` namespace 신설 vs `common` 흡수 — **common 흡수 권고** (§3.3)
   - Pattern-D multiline 29건 처리 방식 — **별도 정규식 1패스 권고** (§4.2)
   - 시드 충돌 1건 manual review 시점 — PR-L commit ① 직전
3. **PR-L 진입 (core-coder, `gemini-3.1-pro`)**:
   - §7.5 4-commit 분할 적용
   - 각 commit Step 검증 게이트 통과 후 다음 commit 진입
4. **사용자 보고 필수 항목** (C8=b 게이트 정착 후 4차 청크 P4 운영 push 시점):
   - 한국어 라인 ≤15,000 단독 미달 (격차 +2,730) — §5.2 §5.5
   - PR-M 후속 라운드 필요성 (hardcoded literal/JSX text/console.log/Error 메시지 분류)
   - 신규 namespace 5종 신설 (Phase 1 정착물 등록 + 신규 시드 481키)

---

**보고서 작성**: core-planner (Opus 4.7) + Python 3 측정 도구 (7 정규식 패턴 + ko.json AST 매칭)
**산출 시각**: 2026-05-26 KST 07:35 ±
**게이트 준수**: 운영 코드 수정 0건 / develop commit 0건 (working tree 산출물 4건만, 후속 commit core-planner 담당) / Flyway·DB 변경 0건 / 사용자 추가 컨펌 요청 0건 (C8=b 게이트 준수)

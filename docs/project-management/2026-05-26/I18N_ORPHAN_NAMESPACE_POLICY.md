# i18n 고아 namespace 5개 파일 정책 옵션 비교 보고서

> **산출 유형**: 정책 보고서 (옵션 비교 + 권고). 실제 채택은 사용자 컴펜 필요.
> **위임 출처**: 2026-05-26 D5 P4 i18n 전수 인벤토리 (Agent `17485f32`) → core-coder `hotfix/i18n-full-audit-batch` §F
> **작성 일자**: 2026-05-26 (KST 11:25 ±)
> **선행 산출물**: `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C5.md`
> **본 위임 정착물**: `hotfix(i18n): CRIT 13 + HIGH 7 + MED 8 + Pattern B/C/D + 자기참조 4건` (단일 PR `hotfix/i18n-full-audit-batch`)

---

## §0 메타 + 게이트

| 항목 | 값 |
|---|---|
| 측정 일자 | 2026-05-26 (KST 08:35 → 11:20 측정 확정) |
| 측정 SHA | develop `57492e7de` (직전 systemConfig 시드 보강 핫픽스 정착 직후) |
| 측정 대상 | `frontend/src/locales/ko/*.json` 14 namespace |
| 본 보고 범위 | **정책 옵션 비교 + 권고만**. 실제 namespace 통합/삭제는 별도 PR. |
| 게이트 | 본 위임 범위 외 — 옵션 채택은 사용자 컴펜 |

---

## §1 발견 사실

### 1.1 14 namespace 누적 leaves (2026-05-26 기준)

| namespace | leaves | 상태 |
|---|---:|---|
| `admin` | **2,008+** | ✅ SSOT 운영 (어드민 LNB/GNB/dashboard) |
| `common` | **1,840+** | ✅ SSOT 운영 (Modal/action/state/nav/terms) |
| `erp` | **379** | ✅ SSOT 운영 (ERP 회계/세무/예산) |
| `error` | 151 | ✅ SSOT 운영 |
| `settings` | 138 | ✅ SSOT 운영 |
| `report` | 130 | ✅ SSOT 운영 |
| `statistics` | 100 | ✅ SSOT 운영 |
| `schedule` | 74 | ✅ SSOT 운영 |
| `auth` | 59 | ✅ SSOT 운영 |
| **`manualNotification`** | **81** | ⚠️ **고아** — `useTranslation([...])` / `t('manualNotification:...')` 0 회 |
| **`terms`** | **73** | ⚠️ **고아** — 모든 호출이 `common.terms.*` 로 resolve (defaultNS=common 컴포넌트가 점 표기로 nested 경로 사용) |
| **`testNotification`** | **63** | ⚠️ **반(半)고아** — 본 위임 §C Pattern A 수정으로 `t('testNotification:...')` 6 회 신규 직접 호출 추가됨, 그 외 모든 호출은 `admin.testNotification.*` resolve |
| **`systemConfig`** | **46** | ⚠️ **고아** — 모든 호출이 `admin.systemConfig.*` resolve (직전 핫픽스 `57492e7de` 사유) |
| **`smsTemplate`** | **36** | ⚠️ **고아** — 모든 호출이 `admin.smsTemplate.*` resolve |

### 1.2 고아 5 파일 = 299 키 + admin.json 중복 매핑

| ns 파일 | standalone leaves | `admin.<ns>` 중복 leaves | 교집합 (= 중복) |
|---|---:|---:|---:|
| `systemConfig.json` | 46 | 58 | **46** (100% 중복) |
| `smsTemplate.json` | 36 | 37 | **36** (100% 중복) |
| `testNotification.json` | 63 | 76 | **57** (90% 중복) |
| `manualNotification.json` | 81 | 132 | **81** (100% 중복) |
| `terms.json` | 73 | 0 (`common.terms.*` 으로 SSOT 이동) | **0** |
| **합계** | **299** | **303** (`terms` 제외) | **220** |

> **핵심**: 5 파일 299 키 중 220 키가 `admin.json` 의 같은 nested 경로에 중복 시드되어 있으며, 컴포넌트가 실제로 사용하는 SSOT 는 `admin.json` 측. 본 5 파일은 i18n config (`frontend/src/i18n/index.js`) 에서 ns 로 등록되어 있고 webpack 번들에 포함되지만 **호출 0 회**. 회귀 매개체 — 인덱스만 일치하고 값이 어긋난 시드가 추가되면 정합성 오류 발견 어려움.

### 1.3 본 위임 §C 직후 측정

| `t('<ns>:...')` 직접 호출 | 본 위임 전 | 본 위임 후 |
|---|---:|---:|
| `systemConfig:` | 0 | 0 |
| `smsTemplate:` | 0 | 0 |
| `testNotification:` | 0 | **6** (Pattern A 수정 부산물) |
| `manualNotification:` | 0 | 0 |
| `terms:` | 0 | 0 |

> 본 위임 §C 후 `testNotification:` 만 직접 호출 진입. 정책 결정 시 이 6 회 호출처 (전부 `TestNotificationForm.js`) 만 별도 처리.

---

## §2 옵션 비교

### 옵션 (a) — 콜론 prefix 표준화 (5 ns 채택, `admin.json` deprecate)

#### 처리 절차

1. 5 파일 (`systemConfig.json`, `smsTemplate.json`, `testNotification.json`, `manualNotification.json`, `terms.json`) 을 SSOT 로 격상.
2. `admin.json` 의 5 도메인 nested 영역 (`admin.systemConfig.*`, `admin.smsTemplate.*`, `admin.testNotification.*`, `admin.manualNotification.*`) deprecate + 신규 키 추가 금지.
3. 모든 호출처 codemod:
   - `t('systemConfig.xxx')` → `t('systemConfig:xxx')` (defaultNS=admin 컴포넌트에서)
   - `t('terms.xxx')` → `t('terms:xxx')` (defaultNS=common 컴포넌트에서)
   - 동일 패턴 5 ns 전수
4. `useTranslation('admin')` → `useTranslation(['admin', 'systemConfig', 'smsTemplate', ...])` 다중 ns 로 변경 (필요 시).
5. `admin.json` 5 영역 정리 (별도 archive 보존).

#### 영향 범위 (추정)

| 항목 | 카운트 (추정) |
|---|---:|
| 호출 codemod 회 수 | ~70 (`t('terms.xxx')`) + ~25 (`t('systemConfig.xxx')`) + ~30 (`t('smsTemplate.xxx')`) + ~50 (`t('manualNotification.xxx')`) + ~40 (`t('testNotification.xxx')`) = **~215** |
| 영향 컴포넌트 | ~15 ~ ~25 파일 |
| admin.json 삭제 leaves | ~220 |
| 신규 namespace 가드 | i18n config 변경 0건, 단 SSOT 분리 가드 추가 권장 |

#### 장점

- ✅ 진정한 SSOT 분리 — namespace 별 도메인 독립
- ✅ 후속 D5 P5 다국어 진입 시 namespace 단위로 en/ja 시드 분배 명료
- ✅ admin.json 비대화 차단 (현재 2,008 leaves → ~1,790 leaves)
- ✅ webpack 번들 크기 최적화 (현재 5 파일이 lazy load 후보)

#### 단점

- ❌ ~215 회 호출 codemod 필요 (회귀 위험 高)
- ❌ defaultNS=admin 컴포넌트에서 `useTranslation` 다중 ns 등록 누락 시 raw key 노출 회귀
- ❌ `terms.xxx` 의 경우 defaultNS=common 컴포넌트가 점 표기로 nested 경로를 자연스럽게 쓰던 패턴 (TermsOfService.js 70 회) 을 모두 변경 필요
- ❌ 사용자 컴펜 + tester P3 시각 회귀 검수 별도 1 라운드 필요

#### 적용 위임 추정 부담

- core-coder: 5 ~ 8 commits + codemod 자동화 + 회귀 fallback 검증
- core-tester: 시각 회귀 검수 1 라운드 (gemini-3.1-pro)
- core-deployer: Frontend 단일 재배포

---

### 옵션 (b) — admin.json 단일화 (고아 5 파일 삭제)

#### 처리 절차

1. `frontend/src/i18n/index.js` 의 ns 등록 + import 5 건 (`koSystemConfig`, `koSmsTemplate`, `koTestNotification`, `koManualNotification`, `koTerms`) 제거.
2. `frontend/src/locales/ko/systemConfig.json` `smsTemplate.json` `testNotification.json` `manualNotification.json` `terms.json` 5 파일 삭제.
3. 본 위임 §C 직후 신규 `t('testNotification:xxx')` 6 회 호출처 (`TestNotificationForm.js`) 만 `t('testNotification.xxx')` 점 표기로 복원 — defaultNS=admin 컴포넌트라 `admin.testNotification.xxx` resolve 정상.
4. `admin.json` 의 5 영역이 SSOT — 추가 작업 없음.

#### 영향 범위 (추정)

| 항목 | 카운트 |
|---|---:|
| 파일 삭제 | 5 (locales) |
| i18n config 라인 | 10 (import 5 + ns 등록 5) |
| 호출 codemod 회 수 | **6** (TestNotificationForm.js 만, 본 위임 §C 직후 추가된 콜론 prefix 6 건 복원) |
| 영향 컴포넌트 | 1 파일 + i18n/index.js |

#### 장점

- ✅ **최소 회귀** — 사실상 i18n config + locale 파일 5 건 + 컴포넌트 1 파일만 변경
- ✅ webpack 번들 크기 -299 leaves (1 단계 즉각 효과)
- ✅ admin.json SSOT 명료화 — 시드 추가/수정 단일 진입점
- ✅ 본 위임 §A 시드 추가 흐름과 정합 (`admin.json` 에 모두 추가)

#### 단점

- ❌ admin.json 비대화 가속 — 2,008 → 2,008 (현재 이미 5 도메인 포함, 신규 leaves 증가 X 단 향후 leaves 증가 시 admin.json 단일 파일 비대화)
- ❌ namespace 단위 lazy load 불가 (이미 lazy load 안 함, 영향 없음)
- ❌ 직전 PR-L Wave-1 (`ee458e0e7`) "5 namespace 신설 + 481 키 자동 시드" 정착 정책 역행 — 명시적 합의 필요

---

### 옵션 (c) — 보류 (D5 P5 다국어 진입 라운드에서 결정)

#### 처리 절차

1. 본 위임에서는 변경 없음.
2. D5 P5 다국어 진입 (en/ja 카피 시안 P1 핸드오프) 시점에 옵션 (a) / (b) 재평가.
3. 임시 가드: `check:i18n-seed` 에 namespace 호출 통계 추가 (옵션 — 본 위임 범위 외).

#### 장점

- ✅ 본 위임 + deployer 위임 빠른 정착 가능
- ✅ D5 P5 진입 시 영문/일본어 카피 분배 정책과 한꺼번에 결정 가능 (namespace 단위 codemod 1 라운드)

#### 단점

- ❌ 회귀 매개체 (299 키 0회 참조) 잔존 — 다음 시드 추가 PR 에서 다시 동일 결함 진입 위험
- ❌ webpack 번들에 사용 안 되는 299 키 잔존 (실제 측정: ~12KB minified)

---

## §3 권고

### 단기 권고 (본 PR + deployer 다음 단계)

**옵션 (b) — `admin.json` 단일화** 권고. 사유:

1. 본 위임 §A 시드 추가가 모두 `admin.json` 의 `admin.labels.*`, `admin.actions.*` 영역에 정착됨. SSOT 단일화와 정합.
2. 직전 핫픽스 `57492e7de` 사유와 정합 — `systemConfig.json` 신규 namespace 가 회귀 매개체였음을 인정.
3. 본 위임 §C 직후 `testNotification:` 6 회만 호출 진입 — codemod 부담 최소.
4. webpack 번들 크기 -299 leaves 즉시 효과.
5. PR-L Wave-1 (`ee458e0e7`) 결정과 명시적 역행이지만, 인벤토리 추적이 명확하므로 정책 재평가 정당화 가능.

### 장기 권고 (D5 P5 다국어 진입 시)

옵션 (b) 정착 후 D5 P5 에서:

1. admin.json 의 도메인별 nested 영역 (`admin.systemConfig.*`, `admin.testNotification.*` 등) 을 logical sub-namespace 로 유지.
2. 영문/일본어 시드는 `en/admin.json`, `ja/admin.json` 단일 파일로 분배 (현재 ko 와 동일 구조).
3. namespace 분리 정책은 사용자 데이터 규모 (admin.json > 5,000 leaves 도달) 시점에 재평가.

### 본 PR 범위 외 작업

- 옵션 (b) 채택 시 후속 PR 분리:
  1. `chore(d5-p4-i18n): orphan namespace 5 파일 삭제 + i18n config slim down` (1 commit)
  2. `fix(d5-p4-i18n): TestNotificationForm.js testNotification: → testNotification. (6 회)` (1 commit)
- 옵션 (a) 채택 시: codemod 자동화 위임 (별도 1 라운드).

---

## §4 사용자 컴펜 대기

본 보고는 옵션 (a) / (b) / (c) 비교 + (b) 권고만 정착. **실제 선택은 사용자 컴펜**:

- (a) 콜론 prefix 표준화 — 진정한 SSOT 분리, 회귀 부담 高
- (b) admin.json 단일화 — 최소 회귀, 본 위임 흐름과 정합 ⭐ **권고**
- (c) 보류 — D5 P5 진입 라운드에서 결정

사용자가 옵션 결정 후 별도 위임으로 진입.

---

## §5 게이트 + 가드 보존

본 보고서는 정책 비교 문서 단일 산출. 운영 코드 0 줄 변경. D11 가드 (`check:token-ssot` + `lint:codemod-mappings` 57/57 + `build:ci`) PASS 보존. 본 위임 §D 신규 가드 `check:i18n-seed` 도 PASS 보존.

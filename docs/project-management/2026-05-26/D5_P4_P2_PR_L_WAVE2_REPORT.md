# D5 P4 i18n Phase 2 — PR-L Wave-2 정착 보고서 (2026-05-26)

> **산출 유형**: PR 정착 보고서 (core-coder)
> **위임 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §5.8 §C9=a (PR-L 단독) / §5.10 §C10=a (fallback 1회 일괄 제거)
> **선행 산출물**: `docs/project-management/2026-05-26/D5_P4_P2_PR_L_WAVE1_REPORT.md` (Wave-1 정착 직후, develop `746a06972`)
> **본 산출물**: PR-L (4차 청크) 종결 — Wave-1 + Wave-2 = 6 commit 통합

---

## §0 메타

| 항목 | 값 |
|---|---|
| 작업 일자 | 2026-05-26 (KST 08:00 ±) |
| 작업 브랜치 | `develop` |
| Wave-2 시작 SHA | `746a06972` (Wave-1 정착 + 보고서 직후) |
| 모델 | core-coder (Opus 4.7 위임) |
| Wave-2 commit 수 | 3 (commit-A: 시드 / commit-B: codemod / commit-C: 보고서) |
| Wave-2 적용 파일 | 259 (i18n/index.js 코멘트 라인 1건 보존 — Phase 1 무수정 게이트) |

---

## §1 commit-A — Wave-2 누락 키 99개 자동 시드

### 1.1 누락 키 분포 (Wave-1 외 잔여 1,025 fallback 분석)

| 측정 항목 | 카운트 |
|---|---:|
| 잔여 fallback pair (Pattern-A 단일라인) | **1,025** |
| 잔여 파일 | **260** |
| 키 정합성 OK (ko.json resolve OK, codemod 안전) | **399** |
| 누락 키 (시드 필요) | **626 occurrences** |
| 누락 unique 키 | **99** |

> **per-file ns 자동 추론**: `useTranslation('xxx')` 패턴 검출 → 명시 없을 시 default `common` ns 적용. `'ns:key'` 명시 prefix 우선.

### 1.2 시드 분배 (namespace 별 +99)

| namespace | 추가 키 (leaf) | 비고 |
|---|---:|---|
| `common` | **+69** | `common.actions.*` / `common.messages.*` / `common.labels.*` / `admin.*` prefix 패턴 (default ns 호출에서 잘못된 prefix 사용 — 시드 verbatim 으로 해결) |
| `admin` | **+9** | `actions.*` / `labels.*` 잔여 |
| `erp` | **+9** | erp 도메인 (`common.actions.*` prefix 흡수) |
| `statistics` | **+7** | 지표 화면 잔여 |
| `settings` | **+5** | 설정 화면 잔여 |
| **합계** | **+99** | — |

### 1.3 시드 정책 (Wave-1 §1.5 답습)

- **fallback 문자열 verbatim 시드** (수정·번역 0건)
- 충돌 처리: string ↔ nested object 충돌 0건 (Wave-1 의 `common.header.menu` 같은 케이스 부재)
- 기존 키 보존 (덮어쓰기 0건)
- `skipped_exists`: 0건 / `conflicts_resolved`: 0건

### 1.4 키 정합성 audit (commit-A 직후)

```
Total Wave-2 fallback pairs: 1025
Present (with file ns): 1025
Missing: 0
```

→ 1,025 fallback 전수 ko.json resolve OK 검증 → commit-B codemod 진입 안전 보장.

### 1.5 commit-A 게이트 매트릭스

| 게이트 | 결과 |
|---|---|
| `npm run lint:codemod-mappings` (가드 1·2) | ✅ PASS (57/57) |
| Production build (`cd frontend && npm run build`) | ✅ PASS |
| Phase 1 정착물 무수정 | ✅ i18n/index.js 무변경 |
| 1·2·3차 청크 + Wave-1 정착물 무수정 | ✅ 기존 키 보존 (admin/common/erp/statistics/settings 확장만) |
| ko.json leaf 키 변화 | 3,725 → **3,824** (+99) |

---

## §2 commit-B — 잔여 259 파일 Pattern-A codemod (1,024 → 0 in scope)

### 2.1 codemod 정규식 (Wave-1 commit-2 검증된 정규식 재사용)

```python
PATTERN_A = re.compile(
    r"\bt\(\s*"
    r"(['\"`])([^'\"`\\\n]+?)\1"                          # key
    r"\s*,\s*"
    r"(['\"`])((?:[^'\"`\\\n]|\\.)*?"                     # fallback prefix
    r"[\u3131-\u318F\uAC00-\uD7A3]"                       # required Korean
    r"(?:[^'\"`\\\n]|\\.)*?)\3"                           # fallback suffix
    r"\s*([,)])"                                           # trailing , or )
)
```

치환:
- 트레일링 `)` → `t('$2')` (2-arg 호출 종결)
- 트레일링 `,` → `t('$2',` (옵션 객체 보존)

### 2.2 Top-30 파일 적용 결과 (Wave-2 in-scope)

| # | 파일 | 적용 | 잔여 |
|---:|---|---:|---:|
| 1 | `auth/UnifiedLogin.js` | 29 | 0 |
| 2 | `client/ClientSettings.js` | 29 | 0 |
| 3 | `admin/VacationStatistics.js` | 26 | 0 |
| 4 | `admin/onboarding/AdminOnboarding.jsx` | 26 | 0 |
| 5 | `settings/UserSettings.js` | 26 | 0 |
| 6 | `admin/PermissionManagement.js` | 24 | 0 |
| 7 | `admin/AdminTenantSmsSettingsPage.js` | 23 | 0 |
| 8 | `admin/manual-notification/ManualNotificationBatchHistory.js` | 20 | 0 |
| 9 | `layout/SimpleHamburgerMenu.js` | 20 | 0 |
| 10 | `admin/AdminKakaoAlimtalkSettingsPage.js` | 19 | 0 |
| 11 | `common/NotificationSettings.js` | 19 | 0 |
| 12 | `common/UnifiedHeader.js` | 18 | 0 |
| 13 | `admin/DashboardWidgetEditor.js` | 15 | 0 |
| 14 | `ui/Modal/ModalExamples.js` | 15 | 0 |
| 15 | `admin/manual-notification/BatchResultModal.js` | 13 | 0 |
| 16 | `admin/system/TestNotificationHistory.js` | 13 | 0 |
| 17 | `consultant/ConsultantIncomeReport.js` | 13 | 0 |
| 18 | `erp/BudgetManagement.js` | 13 | 0 |
| 19 | `tenant/PgConfigurationList.js` | 13 | 0 |
| 20 | `mypage/components/SettingsSection.js` | 12 | 0 |
| 21 | `tenant/PgConfigurationDetail.js` | 12 | 0 |
| 22 | `ui/Statistics/ConsultantRatingStatisticsView.js` | 12 | 0 |
| 23 | `ui/Table/TableExamples.js` | 12 | 0 |
| 24 | `admin/manual-notification/RecipientPicker.js` | 11 | 0 |
| 25 | `admin/DashboardLayoutEditor.js` | 10 | 0 |
| 26 | `ui/Statistics/ConsultationCompletionStatsView.js` | 10 | 0 |
| 27 | `ops/PgApprovalManagement.js` | 9 | 0 |
| 28 | `super-admin/PaymentManagement.js` | 9 | 0 |
| 29 | `ui/Statistics/TodayStatisticsView.js` | 9 | 0 |
| 30 | `admin/mapping-management/organisms/MappingTableView.js` | 8 | 0 |
| **Top-30 부분합** | — | **474** | 0 |
| 꼬리 229 파일 | — | **550** | 0 |
| **합계 (in-scope)** | — | **1,024** | **0** |

### 2.3 i18n/index.js 코멘트 라인 보존 (Phase 1 무수정 게이트)

Wave-1 §1.4 답습. codemod 1차 적용 시 코멘트 예시 1건이 자동 잡혔으나 즉시 되돌림:

```js
// frontend/src/i18n/index.js:16 (commit-B 직후 되돌림)
 *   <button>{t('action.save', '저장')}</button>
```

- 코드 호출 0 (코멘트 예시)
- `common.action.save = '저장'` 사전 존재 (Wave-1 commit-1 §1.4)
- Pattern-A 전체 잔여 1건 (코드 호출 0건)으로 카운트.

### 2.4 키 정합성 audit (commit-B 직후 전체 frontend/src 스캔)

| Scope | Pattern-A 잔여 | Pattern-D 잔여 |
|---|---:|---:|
| 전체 frontend/src | **1** (i18n/index.js 코멘트) | **0** |
| 코드 호출 | **0** | **0** |
| defaultValue 옵션 패턴 (Wave-1 답습 — 회귀 안전, 미터치) | 17 | — |

### 2.5 commit-B 게이트 매트릭스

| 게이트 | 결과 |
|---|---|
| `npm run lint:codemod-mappings` (가드 1·2) | ✅ PASS (57/57) |
| ESLint (변경 259 파일) | ✅ 0 errors / 7 warnings (모두 pre-existing — 6 trailing comma in `AdminOnboarding.jsx` + 1 named export in `i18n/index.js`) |
| Production build (`cd frontend && npm run build`) | ✅ PASS |
| Phase 1 정착물 무수정 | ✅ i18n/index.js 무변경 (코멘트 1건 자동 되돌림) |
| 1~3차 청크 + Wave-1 정착물 무수정 | ✅ 기존 키 보존, 기존 namespace 무변경 |

---

## §3 commit-C — 엣지 케이스 흡수 + KPI 갱신 보고서

### 3.1 엣지 케이스 처리 결과

| 엣지 카테고리 | Wave-2 잔여 | 처리 |
|---|---:|---|
| Pattern-D multiline (Wave-1 commit-3 외) | **0** | Wave-1 정규식 후 신규 발생 0 |
| Pattern-C mixed quote 잔여 | **0** | Wave-1 commit-3 흡수 후 잔여 0 |
| 옵션 객체 패턴 (`t('key', '한국어', { ... })`) | **0** | Wave-1 검증된 정규식 트레일링 `,` 처리로 자동 흡수 |
| `defaultValue` 옵션 객체 패턴 (`t('key', { defaultValue: '한국어' })`) | **17** | **codemod 미터치** (Wave-1 답습 — 회귀 안전, PR-M 후속 평가) |
| i18n/index.js 코멘트 예시 (`/* ... t('action.save', '저장') ... */`) | **1** | Phase 1 무수정 게이트 — 보존 |

**defaultValue 옵션 패턴 17건 PR-M 평가**:
- `t('key', { defaultValue: '한국어', ...opts })` 형태 — i18next 표준 옵션 (회귀 안전)
- 라벨 정상 렌더 (defaultValue 가 fallback 역할)
- PR-M 5차 청크 진입 시 별도 codemod 또는 ko.json 시드 + defaultValue 제거 일괄 평가 권고

### 3.2 KPI 스냅샷 (Wave-2 정착 직후 측정)

> **측정 메서드 A**: 한국어 유니코드 (`U+3131-U+318F` / `U+AC00-U+D7A3`) 포함 라인. Block comment / line comment 트래킹 후 trim. test/spec 미제외 (Wave-1 보고서 메서드와 ~750 라인 오프셋 — 같은 메서드로 일관 측정).

| KPI | Wave-1 final (`746a06972`) | Post-Wave-2 (`2e11cdbcf`) | Δ |
|---|---:|---:|---:|
| **한국어 라인 (excl-cmt, frontend/src/**, Method A)** | 18,737 | **17,725** | **−1,012** (−5.4%) |
| 한국어 라인 (Wave-1 보고서 메서드 환산 추정) | 17,979 | **~16,967** (−1,012 추정) | **−1,012** |
| t() with 한국어 fallback (Pattern-A 코드 호출) | 1,025 | **0** (코멘트 1건 제외) | **−1,025** |
| t() with 한국어 fallback (Pattern-A 전체) | 1,025 | **1** (i18n/index.js 코멘트) | **−1,024** |
| ko.json leaf 키 총합 (14 namespace) | 3,725 | **3,824** | **+99** |
| t() 호출 라인 (총) | 2,834 | **2,902** | +68 (Wave-2 keys 분리 호출 영향) |
| useTranslation 사용 파일 | 295 | **295** | 0 |
| ko 신설 namespace | 14 | 14 | 0 |

### 3.3 PR-L 종합 KPI (Wave-1 + Wave-2 누적)

| KPI | P0-inv-c4 baseline (`c44a0082b`) | Post-Wave-1 (`746a06972`) | Post-Wave-2 (`2e11cdbcf`) | Δ 누적 |
|---|---:|---:|---:|---:|
| 한국어 라인 (excl-cmt, src 전체, 인벤토리 메서드) | 20,481 | 17,979 | **~16,967** | **−3,514** (−17.2%) |
| t() with 한국어 fallback (전 Pattern A/B/C/D 합계) | 2,852 | 1,025 | **0** (코드 호출) | **−2,852** (-100%) |
| ko.json leaf 키 (9 → 14 namespace) | 3,244 | 3,725 | **3,824** | **+580** |

### 3.4 합의서 §3 KPI 도달 평가 (post-PR-L)

| 측정 기준 | 현재 (post-PR-L) | 목표 | 격차 | 도달 여부 |
|---|---:|---:|---:|:---:|
| **한국어 라인 (excl-cmt, src 전체)** = 합의서 KPI 기준 | **~16,967** (Wave-1 메서드 환산) / **17,725** (Method A) | ≤15,000 | **+1,967 ~ +2,725** | ❌ **미달 (113~118%)** |
| t() 한국어 fallback 잔존 | **0 (코드 호출)** | 0 | 0 | ✅ **도달** |
| ko leaf 키 (시드 정착) | 3,824 | — | — | — |

> **결론**: PR-L (4차 청크) 단독으로 fallback KPI = 0 도달. 한국어 라인 ≤15,000 KPI 미달 (격차 +1,967~2,725) — P0-inv-c4 §5.2 §5.5 예측대로 PR-M 후속 필요.

### 3.5 Wave-2 게이트 매트릭스

| 게이트 | commit-A | commit-B | commit-C |
|---|:---:|:---:|:---:|
| `npm run lint:codemod-mappings` | ✅ 57/57 | ✅ 57/57 | (변경 없음) |
| ESLint (변경 파일) | (JSON only) | ✅ 0E/7W (pre-existing) | (docs) |
| Production Build | ✅ PASS | ✅ PASS | (해당 없음) |
| Phase 1 정착물 무수정 | ✅ | ✅ (코멘트 1건 자동 되돌림) | ✅ |
| 1~3차 청크 + Wave-1 정착물 무수정 | ✅ | ✅ | ✅ |
| DB UPDATE / Flyway 신규 | ❌ 금지 | ❌ 금지 | ❌ 금지 |
| test/spec 파일 수정 | ❌ 금지 | ❌ 금지 | ❌ 금지 |

---

## §4 commit 식별자 + push 정착

| commit | 메시지 요약 | SHA (local & remote) | push 결과 |
|---|---|---|---|
| commit-A | Wave-2 누락 키 99개 자동 시드 | `8a601c3b6` | ✅ `746a06972..8a601c3b6  develop -> develop` |
| commit-B | 잔여 259 파일 fallback codemod (1,024 → 0 in scope) | `2e11cdbcf` | ✅ `8a601c3b6..2e11cdbcf  develop -> develop` |
| commit-C | 엣지 흡수 + 종합 KPI 보고서 | (본 commit) | (본 push 직후) |

---

## §5 D5 P5 진입 게이트 평가

### 5.1 PR-L (4차 청크) 종결 KPI 평가

| 측정 기준 | 결과 |
|---|:---:|
| **t() 한국어 fallback 잔존 (코드 호출) = 0** | ✅ **도달** |
| Pattern-A/B/C/D 전수 흡수 | ✅ 1,025 + 12 (Wave-1 commit-3) = **1,037 / 2,852 누적 (Wave-1 + Wave-2)** |
| Phase 1 / 1~3차 청크 / Wave-1 정착물 무수정 | ✅ 게이트 엄수 |
| 게이트 매트릭스 (lint:codemod-mappings + ESLint + Build) | ✅ 6 commit 전수 PASS |

### 5.2 합의서 §3 한국어 라인 ≤15,000 KPI 도달 평가

| 시나리오 | 추정 라인 | 격차 | 평가 |
|---|---:|---:|---|
| Post-PR-L (Method A) | 17,725 | +2,725 | ❌ **미달** |
| Post-PR-L (Wave-1 메서드 환산) | ~16,967 | +1,967 | ❌ **미달** |

### 5.3 PR-M (5차 청크) 후속 필요성 평가 — **✅ 필요**

P0-inv-c4 §5.5 권고 답습:

| 카테고리 | 라인 수 (P0-inv-c4 §5.3) | i18n 흡수 필요 |
|---|---:|---|
| `hardcoded_string_literal` | 6,235 | ✅ 필요 |
| `props_label_string` | 2,920 | ✅ 필요 (UX 일관성) |
| `jsx_text_content` | 2,536 | ✅ 필요 (가장 visible) |
| `console_log` | 2,203 | ⚠️ 정책 결정 |
| `notification_or_dispatch` | 364 | ✅ 필요 |
| `throw_new_error` | 118 | ⚠️ 정책 결정 |
| `t_call_interp_or_key_with_korean` | 8 | ⚠️ codemod skip 대상 |
| `alert_confirm_raw` | 6 | ✅ stories/test 잔존 (운영 0) |
| **defaultValue 옵션 패턴** (Wave-2 추가 발견) | **17** | ⚠️ PR-M 진입 시 별도 codemod 평가 |

**PR-M 권고 진입 조건**:
1. **PR-M 5차 청크 진입** (P0-inv-c4 §5.5 / §7 권고 답습)
2. defaultValue 옵션 패턴 17건 별도 codemod 평가 (Wave-2 신규 인벤토리)
3. `console_log` / `throw_new_error` 정책 결정 (사용자 보고 필요)
4. **PR-N 6차 청크 가능성**: PR-M 후 잔여 한국어 라인 ≥15,500 시 console_log + throw 정책 변경 후속

### 5.4 D5 P5 진입 결정 (사용자 보고 필요)

- **PR-L 종결 게이트 통과**: ✅ (fallback 0 / 게이트 6 commit PASS)
- **합의서 §3 KPI ≤15,000 미달**: ❌ (PR-M 후속 필수 — P0-inv-c4 답습)
- **권고 옵션**:
  - **(a)** PR-L 종결 + D5 P3 회귀 검수 진입 → PR-M 별도 5차 청크 분리 (권장 — 본 위임 답습)
  - **(b)** PR-L Wave-3 추가 (defaultValue 패턴 + 흡수 가능 hardcoded 일부) → KPI 격차 점진 축소 (스콥 확장 — 합의서 §C9=a 단독 PR 원칙과 충돌)

---

## §6 산출 보고서 / 산출물 경로

| 산출물 | 절대 경로 |
|---|---|
| 본 보고서 (Wave-2) | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_P2_PR_L_WAVE2_REPORT.md` |
| Wave-1 보고서 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_P2_PR_L_WAVE1_REPORT.md` |
| P0-inv-c4 인벤토리 | `/Users/mind/mindGarden/docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY_C4.md` |
| Wave-2 시드 스크립트 (1-shot) | `/tmp/seed_pr_l_wave2.py` |
| Wave-2 codemod 스크립트 (1-shot) | `/tmp/codemod_pr_l_wave2.py` |
| Wave-2 누락 키 측정 데이터 | `/tmp/wave2_missing_keys.json` / `/tmp/wave2_seed_plan.json` / `/tmp/wave2_pairs.json` |
| Wave-2 변경 파일 목록 | `/tmp/wave2_modified_files.json` (259 entries) |

---

## §7 본 PR-L (4차 청크) 후속 위임 권고

### 7.1 D5 P3 회귀 검수 위임 (대기 중)

본 commit-C 정착 + push 직후 D5 P3 회귀 검수 (core-tester) 위임 가능:
- 라벨 표시 회귀 검수 (특히 Wave-2 적용 259 파일 빈도 높은 화면)
- t() 키 resolve 검수 (`scripts/i18n-key-audit.js` 신설 권장)
- Production build 가시성 검수 (스모크)

### 7.2 PR-M (5차 청크) 위임 권고

P0-inv-c4 §7 / Wave-2 §5.3 답습:
- **scope**: hardcoded_string_literal + props_label_string + jsx_text_content (≈ 11,691 라인 잠재 흡수)
- **추가 인벤토리**: defaultValue 옵션 패턴 17건 별도 codemod 평가
- **방법론**: 자동 codemod 어렵 — 수작업 + AST-aware codemod 혼용 (Wave-1/2 정규식 답습 불가)
- **목표**: 한국어 라인 ≤15,000 KPI 도달 (현 격차 +1,967~2,725)

### 7.3 합의서 갱신 권고

`docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` §C10 a → 진행 완료 (PR-L Wave-1 + Wave-2 = 6 commit 통합).
PR-M 5차 청크 진입 전 §C11 신규 항목 추가 권고 (사용자 결정 필요).

---

> **본 commit-C 정착으로 PR-L (4차 청크) 종결.**
> **D5 P3 회귀 검수 위임 대기 / PR-M 5차 청크 별도 위임 권고.**

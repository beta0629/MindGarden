# D5 P4 합의서 — T-C i18n Phase 2 진입 (namespace 분할·도메인 확장·다국어 합의) (2026 Q2)

> **작성**: 2026-05-23 (core-planner 오케스트레이션, 구현 금지·문서 산출만)
> **갱신**: 2026-05-26 (§5.8 컨펌 11건 일괄 채택 — C11=b / C12=a 신규 + §5.11 / §5.12 추가, 5차 청크 PR-M 진입 전 hardcoded literal · props label · jsx text · throw Error 본문 i18n 흡수 합의)
> **상태**: **컨펌 완료 (11건) — 5차 청크 PR-M (hardcoded literal·props·jsx·throw Error 흡수) 진입 가동**
> **유형**: 의사결정 합의서 (코드·D1~D10 SSOT·D5 P1~P3 정착물 무수정, PR 분할 골격 + ETA 고정 — §5.8 일괄 채택 11건 완료, 5차 청크 PR-M 가동 — 잔존 hardcoded_string_literal 6,235 + props_label_string 2,920 + jsx_text_content 2,536 + throw new Error 한국어 ~196 = ~11,887 라인 흡수 + 한국어 라인 ≤15,000 / t() ≥3,000 / useTranslation ≥500 KPI 동시 도달)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_DIRECTION.md` §3.4 (4순위 별도 트랙) + §4 P4 (T-C 별도 합의서 + `core-coder`) + §6 C5 (i18n Phase 2 진입 조건)
> **선행 라운드**: D5 P1·P2·P3 정착 (T-D 가드 + T-E alias 5종 + T-B 테마 6종 + T-A rgba/3자리) → D6~D10 누적 정착 (운영 main `e88a264a9`, 2026-05-23 push 완료, T-D 가드 54 PASS / 0 WARN / 0 ERROR)
> **병행 라운드**: D11 라운드 합의서 초안 (`0d226f0c2`, 디자인 토큰 metric 재정의 + R-2/R-3/R-4 잔여, 사용자 컨펌 8건 대기) — **본 합의서와 트랙 영역 분리 (라벨 SSOT vs 디자인 토큰 SSOT)**
> **연계**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md` (Task 모델 — 디자인·비주얼 변경 배치 `gemini-3.1-pro`), `frontend/src/i18n/index.js` (Phase 1 부트스트랩 정착), `frontend/src/locales/README.md` (Phase 1 가이드 SSOT)

---

## §0 라운드 정합 (D5 P1~P3 정착 + D10/D11 경계)

### 0.1 D5 P1~P3 정착 결과 (디자인 토큰 트랙 SSOT)

D5_DIRECTION §4 분배실행 표 기준의 P1~P3 트랙은 모두 정착 완료되었으며, 본 D5 P4 트랙(T-C i18n Phase 2)은 색상 트랙 안정화 이후 진입하는 4순위로 분리되어 있었다.

| Phase | 트랙 | 정착 결과 | 정착 SHA (대표) | NO-OP 여부 |
|---|---|---|---|---|
| **D5 P1-a** | T-D codemod 가드 강화 | SSOT 사전 lint + alias 충돌 차단 정착 (D6~D10 누적 54 PASS / 0 WARN) | (D6~D10 누적) | — |
| **D5 P1-b** | T-E R-5 alias 톤 분리 정착 | surface/background-base/muted/secondary/sub 5종 라이트·다크 SSOT | (D5 디자이너 트랙 합의서 §1) | — |
| **D5 P2** | T-B 테마 오버라이드 고도화 | 다크 톤 6종 확정 (info-bg/info-dark/error-50/error-dark/success-600/brand-olive) | (D5 디자이너 §2) | — |
| **D5 P3** | T-A rgba/3자리 완벽 흡수 | D9 PR-D + D10 PR-B 누적 흡수 | `e169c0be3`/`5a45bd806` | (rgba metric 한계, **NO-OP 1건 포함** — D11 T-M 트랙으로 이월) |
| **D5 P4** | **T-C i18n Phase 2** | **본 합의서로 별도 분리, 사용자 컨펌 7건 대기** | — | — |

> **NO-OP 라운드 1건 포함**: D9 P2-f / PR-D (Glass/Shadow rgba SSOT 정착) — hex-only metric 한계로 `rawLine` 감소량 0건이나 SSOT 정합 의도대로 정착. D11 T-M (metric 재정의) 후 신 metric 기준선에서 재측정 예정.

### 0.2 D10 P3 PASS + 운영 push 정착 (2026-05-23)

| 게이트 | 결과 | 비고 |
|---|---|---|
| T-D 가드 (`npm run lint:codemod-mappings`) | **54 PASS / 0 WARN / 0 ERROR / 0 alias 충돌** | 양방향 cascade 100% |
| 시각 회귀 (HIGH 4 / MED 6 / LOW 5) | **HIGH 0 / MED 0 / LOW 0 (전건 PASS)** | mg-v2 Tailwind / black α / B0KlA 광역 / `#60a5fa` 다크 cascade 안정 |
| WCAG AA 신설 17종 양방향 | **17/17 PASS** | PR-A 11종 + PR-C 6종 |
| 운영 push | **`e88a264a9`** (2026-05-23 완료) | — |

### 0.3 D11 합의서 초안 (`0d226f0c2`) 와의 경계 분명

| 항목 | D5 P4 본 합의서 (T-C i18n Phase 2) | D11 합의서 초안 (디자인 토큰 metric/R-2~R-4) |
|---|---|---|
| **SSOT 영역** | 라벨 SSOT (`frontend/src/locales/{lang}/{ns}.json`) | 디자인 토큰 SSOT (`frontend/src/styles/unified-design-tokens.css`) |
| **카운트 게이트** | 한국어 패턴 매칭 / `t()` 호출률 / locale 키 leaves | `legacyRawLine` + `unifiedRawLine` (dual-metric) + `r2Protected` |
| **변경 대상 파일** | JS/TS/JSX/TSX 의 한글 문자열 → `t('key', '한글 fallback')` 치환 + `*.json` namespace 추가 | `unified-design-tokens.css` / `convert-hardcoded-colors.js` / `inventory-r2-fallbacks.js` |
| **시각 회귀 범위** | 텍스트 길이 변동 (영문 + 추가 언어 시) | 색상·다크 모드 cascade |
| **conflict 위험 영역** | 컴포넌트 JS/TS 한글 문자열 (LNB/모달/error 등) | CSS 파일·codemod 스크립트·SSOT 정의 |
| **병렬 가능성 (§4 C7)** | D11 디자인 토큰 트랙과 **파일 영역 무관** — 단, 동일 컴포넌트 파일에서 CSS·라벨 동시 수정 시 PR conflict 회피 필요 | 동일 |

> **경계 원칙**: 본 D5 P4 라운드는 **라벨 SSOT (i18n)** 단일 책임. 디자인 토큰·색상·CSS 변경 0줄. D11 라운드와 **PR 분리 + 사전 rebase 검증** 으로 conflict 회피.

---

## §1 T-C 인벤토리 실측 (2026-05-23 시점, develop `c31a498df`)

> **측정 환경**: 로컬 `ripgrep` 미설치로 `grep -rE`(POSIX 호환)·`find`·`wc`·`node` 로 동등 산출. 패턴·범위는 사용자 위임의 ripgrep 명령과 정합한다 (`*.{js,jsx,ts,tsx}` / `*.css` / `locales/*.json`).

### 1.1 한국어 패턴 매칭 (frontend src 전체)

| 항목 | 값 | 산출 명령 |
|---|---:|---|
| **한국어 라인 — JS/TS/JSX/TSX 전체** | **29,279** | `grep -rnE "[가-힣]" frontend/src --include="*.{js,jsx,ts,tsx}" \| wc -l` |
| 한국어 라인 — JS/TS/JSX/TSX 파일 수 | 987 | `grep -rlE "[가-힣]" ... \| wc -l` |
| **한국어 라인 — CSS 전체** | **5,304** | `grep -rnE "[가-힣]" frontend/src --include="*.css" \| wc -l` |
| frontend src 총 JS/TS/JSX/TSX 파일 | 1,034 | `find frontend/src -type f \( -name '*.js' -o -name ... \) \| wc -l` |

### 1.2 `t()` 호출 / `useTranslation` 사용량

| 항목 | 값 | 비고 |
|---|---:|---|
| **`t(` 호출 라인** | **932** | `grep -rnE "\bt\(" ...` (Phase 1 부트스트랩 + common namespace 시범) |
| **`useTranslation` 사용 파일 수** | **275** | 컴포넌트 파일 (1,034 중 26.6%) |

### 1.3 locale 파일 키 (ko 단일 언어, Phase 1 정착)

| 파일 | 라인 수 | **leaf 키 수** (재귀 카운트) | 비고 |
|---|---:|---:|---|
| `frontend/src/locales/ko/common.json` | 68 | **60** | 공통 액션·상태·라벨 (Phase 1 시범) |
| `frontend/src/locales/ko/admin.json` | 290 | **230** | 어드민 도메인 시범 |
| **합계 (ko)** | 358 | **290** | Phase 2 진입 기준선 |

### 1.4 alert / confirm / UnifiedModal 인벤토리 (트랙 C 입력)

| 항목 | 값 | 비고 |
|---|---:|---|
| `window.alert(` | 1 | 트랙 C 분리 후보 |
| `window.confirm(` | 9 | 트랙 C 분리 후보 |
| bare `alert/confirm(` (사용자 함수 포함) | 50 | 일부는 도메인 함수 — P0-inv 에서 정밀 분류 |
| **UnifiedModal 사용 라인** | **422** | 치환 대상 SSOT (alert/confirm → UnifiedModal i18n) |

### 1.5 영역별 한국어 라인 분포 (트랙 우선순위 입력)

| 영역 (경로/키워드) | 한국어 라인 | 매핑 트랙 |
|---|---:|---|
| `**/admin/**` + `**/Admin**` 파일 (어드민 LNB·메인) | **6,087** | **A** (1순위) |
| `components/common/**` (UnifiedModal·공통) | 1,698 | **A** (1순위 — 모달) |
| `components/layout/**` (LNB·GNB) | 179 | **A** (1순위 — LNB) |
| 키워드 `error/toast/notify/message` 포함 파일 | 3,247 | **A** (1순위 — error 메시지) |
| 키워드 `setting/report/statistic/analytic` 포함 파일 | 1,002 | **B** (2순위 — 보조 화면) |
| **잔여 (위 분류 외)** | ~17,066 (29,279 − 위 카테고리 합 12,213) | C/D 인벤토리 (P0-inv) |

> **주의**: 위 영역별 합산은 단일 라인이 여러 카테고리에 중복 매칭(예: `admin/error/toast`)될 수 있어 합산이 총합과 정확히 일치하지 않는다. 정밀 분포는 P0-inv (`explore`) 에서 단일 분류 카테고리·우선순위별 인벤토리 JSON 으로 재산출한다.

### 1.6 Phase 1 부트스트랩 정착물 (D5 P4 진입 전 SSOT)

D5_DIRECTION §4 P4 의 합의 대상이 본 합의서이며, Phase 1 부트스트랩은 별도 트랙(D5 직전~D5 P0 시점, `frontend/src/i18n/index.js` 작성·`react-i18next`·`i18next`·`i18next-browser-languagedetector` 도입)으로 이미 정착되어 있다. 본 합의서는 Phase 1 정착물을 **무수정** 으로 보존한다:

- `frontend/src/i18n/index.js` — `SUPPORTED_LANGUAGES = ['ko']` / `FALLBACK_LANGUAGE = 'ko'` / `DEFAULT_NAMESPACE = 'common'` / `LanguageDetector` (localStorage·navigator)
- `frontend/src/locales/ko/common.json` (60 leaves) + `frontend/src/locales/ko/admin.json` (230 leaves)
- `frontend/src/locales/README.md` (Phase 1 가이드 SSOT, 키 명명 `domain.feature.element.purpose`)
- 기존 275 컴포넌트의 `useTranslation` + 932 `t()` 호출 정착 (Phase 1 시범)

---

## §2 Phase 2 트랙 후보 분류 (우선순위 A~D)

> 본 표는 우선순위·범위 결정의 **분류 골격** 이며, 실제 트랙별 진입 범위는 §5 C2 (트랙 범위) + C3 (트랙 D 분리 여부) 컨펌 후 확정한다.

| 우선순위 | 트랙 명 | 범위 (대표 영역) | 한국어 라인 가늠 (§1.5 기반) | 핵심 산출물 | 시각/UX 회귀 위험 |
|---:|---|---|---:|---|---|
| **A** | **사용자 노출 빈도 高 화면** | 어드민 LNB·GNB / UnifiedModal / 어드민 메인 / error·toast·notify 메시지 | ~11,000 (admin 6,087 + common 1,698 + layout 179 + error/toast 3,247, 중복 포함) | `frontend/src/locales/ko/{admin,common,error}.json` 확장 (~+600 leaves) + 컴포넌트 `t()` 치환 | **Med~High** (LNB·모달 텍스트 길이 변동, 영역 정렬 영향) |
| **B** | **보조 화면** | 설정 / 통계 / 보고서 / analytics | ~1,000 | `frontend/src/locales/ko/{settings,report,statistics}.json` 신설 (~+250 leaves) + 컴포넌트 `t()` 치환 | **Low~Med** (어드민 종속, 사용 빈도 낮음) |
| **C** | **미번역 alert/confirm → UnifiedModal i18n** | `window.alert/confirm` 10건 + bare `alert/confirm` 50건 중 도메인 alert/confirm (P0-inv 분류) | (라인 수 미세, 메시지 텍스트 위주) | UnifiedModal 422 사용처와 정합되는 i18n 메시지 키 + `useConfirm`/`useAlert` 훅 SSOT 통합 (디자이너·코더 분리 합의) | **Low** (메시지 변환만, 레이아웃 무관) |
| **D** | **추가 언어 지원** | `en-US` / `ja-JP` / `zh-CN` 등 | (한국어 라인 변화 0, 라이브러리·번들 사이즈 변동) | `frontend/src/locales/{en-US,ja-JP,…}/*.json` 신설 + `i18n/index.js` `resources`·`supportedLngs` 확장 + 언어 전환 UI | **Med** (텍스트 길이 변동·SEO·번들 사이즈·번역 품질 — §8 리스크) |

### 2.1 트랙 한눈에 보는 비교

| 기준 | A | B | C | D |
|---|:---:|:---:|:---:|:---:|
| 한국어 라인 직접 감축 | ◎ | ○ | △ | × |
| 사용자 노출 빈도 | ◎ | △ | ○ | (언어 정책) |
| 디자이너 카피 결정 필요 | ◎ | ○ | ◎ (메시지 톤·UnifiedModal 정합) | ◎ (다국어 번역 품질) |
| 단독 진행 가능 | ◎ | ○ (A 이후) | ○ (A 이후) | ○ (모든 트랙 무관) |
| 사용자 컨펌 필요 | △ (A 범위 정의) | △ (B 분리 여부) | **◎ (C3 분리 여부)** | **◎ (C1 언어 선택)** |
| 시각 회귀 의존 | Med~High | Low~Med | Low | Med |

---

## §3 산출 KPI (Phase 2 종료 시 정량 목표 — §5 C4 컨펌 후 확정)

> **권장값(기본 후보)** 는 D8~D10 답습 답습 (40%·-50% 감축 패턴) 으로 제안하며, **사용자 컨펌(§5 C4) 후 N·M·K 값 확정**.

| KPI | 현재 (Phase 1 정착, 2026-05-23) | **Phase 2 종료 목표 (권장값)** | 측정 도구 |
|---|---:|---|---|
| **한국어 라인 (JS/TS 전체)** | **29,279** | **< 15,000 (-49%, ~14,000건 감축)** | `grep -rnE "[가-힣]" frontend/src --include="*.{js,jsx,ts,tsx}" \| wc -l` |
| 한국어 라인 (CSS 전체) | 5,304 | **유지** (CSS 한글은 의도된 placeholder/주석) | 동일 (`--include="*.css"`) |
| **`t(` 호출 라인** | **932** | **> 3,000 (Phase 1 대비 +222%)** | `grep -rnE "\bt\(" ...` |
| `useTranslation` 사용 파일 수 | 275 | **> 500** (~50% 컴포넌트 도달) | `grep -rlE "useTranslation" ...` |
| **locale 키 leaves (ko)** | **290** (common 60 + admin 230) | **> 1,500 (+1,200 leaves)** | `node` 재귀 leaf 카운트 |
| `window.alert/confirm` 잔존 | 10 (alert 1 + confirm 9) | **0** (UnifiedModal i18n 흡수) — C 트랙 진입 시 | 동일 |
| Phase 1 정착물 무수정 | — | **100% 무수정 보존** (i18n/index.js + Phase 1 290 leaves) | git diff 0 라인 |
| 추가 언어 지원 (en-US/ja-JP 등) | 0 (ko only) | **§5 C1 컨펌 후 확정** (권장: ko only) | `supportedLngs` 배열 |

> **KPI 의미**: 한국어 라인은 "치환 진척" 만 측정하므로 **하한선 < 0 도달 불가능** (의도된 한글 placeholder·주석·fallback 텍스트 잔존). `t()` 호출과 leaf 키 수가 실질 진척 지표이다. dual-tracking 권장.

---

## §4 위임 흐름 (D8~D11 8단계 답습)

> **본 임무 범위 외**: 실제 위임은 사용자 컨펌(§5) 7건 확정 후 메인 어시스턴트가 수행. 본 표는 위임 시 사용할 골격.

### 4.1 분배실행 표

| Phase | 책무 | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|---|
| **P0-inv** | T-C 인벤토리 정밀 분류 + 트랙 A~D 영역 산출 | `explore` | (1) `[가-힣]` 매칭 29,279 라인을 **단일 카테고리** 우선순위 A/B/C/D 로 분류 + 파일·라인·문자열 샘플 JSON 산출. (2) `window.alert/confirm` 10건 + bare `alert/confirm` 50건 정밀 분류 (도메인 alert vs 사용자 함수). (3) UnifiedModal 422 사용처와 alert/confirm 메시지 SSOT 정합 검사. (4) namespace 분할 후보 산출 (admin / common / error / settings / report / statistics / schedule / payment …). (5) 트랙 A 영역의 컴포넌트 별 한국어 라인 Top 20 산출 (우선 치환 후보). 산출: `reports/d5-p4-i18n-inventory-{trackA,trackB,trackC,namespace}-20260524.json` + 분류 마크다운. **코드 무수정 (read-only)**. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P1** | §5 C1~C7 디자이너 컨펌 + 번역 카피 결정 + 키 명명 합의 핸드오프 | `core-designer` | (1) §5 C1 추가 언어 결정 (en-US/ja-JP/zh-CN/ko only) → 다국어 진입 시 번역 카피 정책 (외부 번역사 / 사내 카피 / 디자이너 직접). (2) C5 카피 결정 시점 (P0 후 / P1 사전 / **트랙별 분리**) 적용 → 트랙별 분리 시 P2-a (트랙 A) 진입 전 LNB·모달·error 키 명명·한글 카피 시안 1장. (3) namespace 분할 합의 (admin / common / error / settings / report / statistics 등) + 키 명명 패턴 (Phase 1 `domain.feature.element.purpose` 답습). (4) 트랙 C UnifiedModal i18n 메시지 톤 합의 (확인/취소 등 표준 카피). (5) 트랙 D 진입 시 영문 카피 1차 시안 (admin LNB / common action / error 상위 ~50 키). 완료 조건: `docs/project-management/2026-05-24/D5_P4_P1_DESIGN_HANDOFF_I18N.md` (트랙별 키 명명·한글 카피·영문 1차 시안 별첨). | `/core-solution-design-handoff`, `/core-solution-planning` | **`gemini-3.1-pro`** (디자인·번역 카피 결정 규약 — `CORE_PLANNER_DELEGATION_ORDER.md`) |
| **P2-a** | **트랙 A (1순위)** 어드민 LNB / 모달 / error 메시지 i18n 치환 | `core-coder` | P0-inv + P1 카피 적용 → (1) LNB·GNB·UnifiedModal·error/toast 컴포넌트의 한글 문자열을 `t('key', '한글 fallback')` 으로 치환 (Phase 1 fallback 패턴 답습). (2) `frontend/src/locales/ko/{admin,common,error}.json` 확장 (P1 카피 시안 반영, ~+600 leaves). (3) Phase 1 정착물(`i18n/index.js`·기존 290 leaves) **무수정**. (4) namespace `error` 신설 시 `i18n/index.js` `resources.ko.error` + `ns` 배열 1줄 추가. 완료 조건: 한국어 라인 (admin/common/layout/error 영역) ~11,000 → ~5,000 (-50%~-60%) + `t()` 호출 932 → ~1,800 + 시각 회귀 컴포넌트별 점검. | `/core-solution-frontend` | 기본 (C5=트랙별 분리 시 `gemini-3.1-pro` 옵션) |
| **P2-b** | **트랙 B (2순위)** 설정 / 통계 / 보고서 i18n 치환 | `core-coder` | P2-a 정착 후 진입. (1) settings·report·statistics·analytics 영역 ~1,000 라인 치환. (2) `frontend/src/locales/ko/{settings,report,statistics}.json` 신설 (~+250 leaves). (3) `i18n/index.js` namespace 등록. 완료 조건: 한국어 라인 (B 영역) ~1,000 → ~300 + `t()` 호출 +500. | `/core-solution-frontend` | 기본 |
| **P2-c** | **트랙 C (3순위, §5 C3 컨펌 시)** `window.alert/confirm` → UnifiedModal i18n | `core-coder` | (P2-a 이후, C3=a 컨펌 시 본 트랙 포함) (1) `window.alert` 1건 + `window.confirm` 9건 = 10건을 `UnifiedModal` + `useConfirm`/`useAlert` 훅으로 일괄 치환. (2) bare `alert/confirm` 50건 중 도메인 alert 정밀 분류 후 동일 치환. (3) 메시지 한글 카피를 `error.json` 또는 `common.json` 키로 흡수. (4) UnifiedModal i18n props (`titleKey`, `messageKey`, `confirmLabelKey` 등) 정합. 완료 조건: `window.alert/confirm` 잔존 0 + bare 잔존 ≤ 10 (사용자 함수만). | `/core-solution-frontend`, `/core-solution-unified-modal` | 기본 |
| **P2-d** | **트랙 D (4순위, §5 C1 컨펌 시)** 추가 언어 지원 — en-US/ja-JP 등 | `core-coder` | (C1=ko 외 선택 시 본 트랙 진입) P1 영문 카피 시안 적용 → (1) `frontend/src/locales/{en-US,ja-JP,…}/*.json` 신설 (P2-a~c 정착 키 leaves 1:1 미러). (2) `i18n/index.js` `SUPPORTED_LANGUAGES` 확장 + `resources` 등록. (3) 언어 전환 UI (GNB 우상단 또는 어드민 설정) 신설 — 디자이너 시안 적용. (4) 번들 사이즈 측정 (§8 리스크). 완료 조건: 추가 언어 leaves ≥ Phase 1 290 + 핵심 화면 다국어 렌더링 PASS + 번들 사이즈 증가 < 10%. | `/core-solution-frontend` | 기본 (UI 변경 시 `gemini-3.1-pro` 디자이너 P1 단계 선행) |
| **P3** | 종합 시각 회귀 검수 + KPI 측정 | `core-tester` | P2-a~d (사용자 컨펌 범위 적용 후) (1) 트랙 A·B·C·D 각 우선 화면 UAT (D8 P3 답습 — admin/임상/대시보드/모달 광역). (2) Phase 1 정착물 회귀 0 검증 (i18n/index.js · 기존 290 leaves · 275 컴포넌트 `t()`). (3) 다국어 진입 시 텍스트 길이 변동에 따른 레이아웃 회귀 (LNB·모달·error 메시지·테이블 헤더). (4) KPI 측정 (한국어 라인 / `t()` 호출 / locale leaves / 번들 사이즈). 완료 조건: HIGH 0 / MED 0 + KPI N·M·K 달성 보고서 + 추가 언어 진입 시 다국어 매트릭스 PASS. | `/core-solution-testing` | **`gemini-3.1-pro`** (다국어 시각 회귀 — 디자인·비주얼 검증 규약) |
| **P4** | 운영 push (§5 C6 컨펌에 따라 일괄/분할) | `core-deployer` | (P3 PASS 후) **(a) 일괄 push** — PR-A + PR-B + PR-C + PR-D 묶음 1회 또는 **(b) 분할 push** — PR-A → PR-B → PR-C → PR-D 각 단계 P3 PASS 후 분리 push (4회). 완료 조건: develop → main rebase + GitHub Actions PASS + 운영 게이트 KPI 보고 + i18n Phase 2 종결 보고 + D5 P4 라운드 완전 종결 보고. **D11 라운드 진행 시 사전 rebase 검증 필수** (§0.3 conflict 회피). | `/core-solution-deployment` | 기본 |

### 4.2 병렬 / 직렬 의존성

- **P0-inv ↔ P1**: 직렬 (P0-inv 분류 JSON 을 P1 디자이너가 입력으로 사용).
- **P1 ↔ P2-a/b/c/d**: §5 C5 컨펌 결과에 따름.
  - C5=a (P0 후 일괄 결정): P1 1회로 트랙 A~D 카피 모두 결정 → P2-a~d 병렬 가능 (단, codemod·namespace 충돌 회피 위해 직렬 권장).
  - C5=b (P1 사전 일괄): 동일.
  - **C5=c (트랙별 분리, 권장)**: P1 → P2-a → P1' (트랙 B 카피) → P2-b → … 반복 (안전, 카피 품질↑, 소요↑).
- **P2-a (트랙 A) → P2-b (트랙 B)**: 직렬 권장 (A 정착 후 B 진입, KPI 단계 측정 가능).
- **P2-c (트랙 C)**: §5 C3 컨펌 후 진입. C3=a (현재 트랙 포함) 시 P2-a 와 병렬 가능 (UnifiedModal 사용처 분리).
- **P2-d (트랙 D)**: §5 C1 컨펌 후 진입. ko only 시 본 트랙 생략.
- **P3 ↔ P4**: D10/D11 답습 직렬 (P3 PASS 전 P4 금지).

> **검증 게이트 (필수)**: P2 코드 변경은 P3 `core-tester` 통과 전 P4 진행 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).

---

## §5 사용자 컨펌 필요 항목 (D5 P4 진입 전 — 7건)

> **권장값(기본 후보)** 은 **굵게** 표시한다. 사용자가 옵션 중 선택 후 컨펌하면 P0-inv 위임을 개시한다.

### C1. 추가 언어 (T 트랙 D 진입 여부)

- **질문**: D5 P4 라운드에 추가 언어 지원을 포함할지·어떤 언어를 도입할지.
  - (a) `en-US` (영어) 추가 — 1차 다국어 확장
  - (b) `ja-JP` (일본어) 추가
  - (c) `zh-CN` (중국어 간체) 추가
  - (d) `en-US` + `ja-JP` 동시 추가 (다중 진입)
  - (e) **한국어 only 유지 — D5 P4 는 namespace 분할·도메인 확장만, 추가 언어는 후속 라운드 분리**
- **권장**: **(e) 한국어 only 유지** — 다국어 진입은 (i) 번역 품질 SSOT (외부 번역사·사내 카피팀) 결정 (ii) 번들 사이즈·SEO·운영 비용 트레이드오프 (§8) 검토 후 별도 라운드 (가칭 D5 P5 또는 D12+) 분리. Phase 1 README §3 점진 도입 절차 (Phase 2 종료 → 언어 추가 합의) 답습.

### C2. 우선순위 트랙 범위 (Phase 2 진입 폭)

- **질문**: D5 P4 라운드에 포함할 트랙 우선순위 범위.
  - (a) **A only** — 어드민 LNB / 모달 / error 메시지만 (한국어 라인 -50% 가늠, 빠른 정착)
  - (b) **A + B** — 보조 화면(설정/통계/보고서) 포함 (한국어 라인 -55% 가늠)
  - (c) **A + B + C** — alert/confirm UnifiedModal i18n 포함 (한국어 라인 -55% + alert/confirm 잔존 0)
  - (d) **all 4 (A + B + C + D)** — 추가 언어까지 포함 (C1=e 와 양립 불가)
- **권장**: **(c) A + B + C** — 추가 언어 (트랙 D) 는 C1=e 권장에 따라 분리. A~C 는 한국어 단일 언어 내 라벨 SSOT 표준화·alert/confirm 정합 정착으로 본 라운드 완결 가능.

### C3. 트랙 C (미번역 alert/confirm) 진행 정책

- **질문**: `window.alert/confirm` 10건 + bare 50건 정밀 분류 후 UnifiedModal i18n 흡수 트랙을 본 라운드에 포함할지.
  - (a) **현재 트랙에 포함 (P2-c 진입)** — A 와 병렬 가능, alert/confirm 잔존 0 도달
  - (b) 별도 라운드 분리 — 본 라운드는 A·B 만, alert/confirm i18n 은 D5 P5 또는 D12+ 후속 라운드
  - (c) 진행 보류 — UnifiedModal 422 사용처 패턴이 충분히 안정될 때까지 대기
- **권장**: **(a) 현재 트랙에 포함** — C2=c 권장과 정합. UnifiedModal 422 사용처 SSOT 이미 정착되어 위험 낮음 (트랙 C 시각 회귀 Low). bare 50건 중 사용자 함수는 P0-inv 에서 정밀 분류로 회피.

### C4. KPI 결정값 (한국어 매칭 < N + locale leaves > K)

- **질문**: §3 산출 KPI 표의 **N·K** 결정값.
  - (a) **N = 15,000 (-49%), K = 1,500** — 권장값 (D8~D10 답습 -50% 패턴)
  - (b) N = 10,000 (-66%), K = 2,000 — 공격적 목표 (트랙 A+B+C 광역 치환, 소요↑)
  - (c) N = 20,000 (-32%), K = 800 — 보수적 목표 (트랙 A 만, 빠른 정착)
  - (d) 사용자 직접 입력값 (예: N = 12,000 / K = 1,800 등)
- **권장**: **(a) N = 15,000 / K = 1,500** — D8~D10 답습 비율 + C2=c 진입 시 도달 가능 가늠. 정확값은 P0-inv 단일 카테고리 분류 후 보정.

### C5. 디자이너 카피 결정 시점

- **질문**: P1 디자이너 카피 결정 (한글 키 명명 + 영문/추가 언어 카피) 진행 시점·범위.
  - (a) **P0-inv 후 일괄 결정** — 인벤토리 결과 보고 후 트랙 A~D 카피 1회 결정 → P2 진입 (빠르지만 카피 품질 위험)
  - (b) **P1 사전 일괄 결정** — P0-inv 와 무관하게 트랙 A~D 카피 사전 결정 (보수적, 인벤토리 반영 X)
  - (c) **트랙별 분리** — P1 → P2-a → P1' (트랙 B 카피) → P2-b → P1'' (트랙 C 카피) → P2-c (안전, 카피 품질↑, 소요↑)
- **권장**: **(c) 트랙별 분리** — 트랙별 도메인 어휘·톤이 다르므로 (admin LNB ≠ UnifiedModal alert ≠ 보고서 라벨) 단계별 디자이너 컨펌이 카피 품질·일관성에 유리. D9~D10 디자이너 핸드오프 답습 패턴.

### C6. 운영 push 일괄 / 분할

- **질문**: D5 P4 P4 단계 운영 push PR 분리 단위.
  - (a) **일괄 push** — PR-A + PR-B + PR-C (+ PR-D) 묶음 1회
  - (b) **트랙별 분할 push** — PR-A → PR-B → PR-C (→ PR-D) 각 P3 PASS 후 분리 push (트랙 수 2~4회)
  - (c) **A 단독 + B/C/D 일괄** — 1순위 트랙만 단독 push, 나머지 일괄
- **권장**: **(b) 트랙별 분할 push** — D5 P4 변경 광역 영향 (한국어 라인 ~14,000 치환) 이라 분할 회귀 안전 마진 확보. D11 라운드와의 PR conflict 회피 (§0.3 / §8.5) 도 트랙별 분할이 유리. D10 P3 답습은 일괄 push 였으나 D5 P4 변경 규모가 더 큼.

### C7. D11 라운드 (디자인 토큰 metric 재정의) 와의 병렬 진행

- **질문**: 본 D5 P4 합의서와 D11 합의서 초안 (`0d226f0c2`) 의 진행 정책.
  - (a) **병렬 가능** — 트랙 영역 무관 (라벨 SSOT vs 디자인 토큰 SSOT), 동시 진행
  - (b) **순차 진행** — D11 종료 후 D5 P4 진입 (또는 역순)
  - (c) **트랙별 결정** — P1 (디자이너) / P3 (테스터) 는 직렬, P2 (코더) 만 병렬
- **권장**: **(b) 순차 진행** — 위임 직전 시도가 `resource_exhausted` 로 실패한 점, D5 P4 변경 규모 (한국어 라인 ~14,000 라인 광역) 가 D11 (디자인 토큰 -7건 + metric 산식) 보다 크다는 점, 디자이너·테스터 모델 `gemini-3.1-pro` 자원 경합 회피 (CORE_PLANNER_DELEGATION_ORDER.md Task 모델 규약) 를 고려한 안전 우선. D5 P4 정착 후 D11 진입 (또는 D11 정착 후 D5 P4 진입) 순서는 사용자 결정.

---

### 5.8 사용자 컨펌 결과 — 일괄 채택 (2026-05-26)

> **결정 사유**: 사용자 명시 — **D11 우선 진행** + D5 P4 권장값 일괄 컨펌. C7 만 일관 결정으로 사용자 직접 지정(=b), 나머지 C1~C6 은 §5 권장값(굵게) 그대로 채택. 본 컨펌 결과는 D11 P4 운영 push 정착 완료 후 P0-inv 위임 트리거 조건으로 본 합의서에 고정한다.

| 항목 | 사용자 결정 | 권장값 (§5) | 일치 여부 | 채택 사유 (요지) |
|---|:---:|:---:|:---:|---|
| **C1** 추가 언어 진입 | **e** (한국어 only 유지) | (e) | ✅ | Phase 2 본 라운드는 namespace 분할·도메인 확장에 집중. 다국어 진입은 번역 SSOT(외부 번역사/사내 카피) + 번들·SEO 트레이드오프(§8) 결정 후 별도 라운드(D5 P5 또는 D12+) 분리. |
| **C2** 트랙 범위 | **c** (A + B + C) | (c) | ✅ | 트랙 D(추가 언어) 는 C1=e 와 양립(분리). A~C 로 한국어 단일 언어 라벨 SSOT 표준화 + alert/confirm UnifiedModal i18n 흡수까지 본 라운드 완결. |
| **C3** 트랙 C(alert/confirm) 진행 정책 | **a** (현재 트랙에 포함) | (a) | ✅ | UnifiedModal 422 사용처 SSOT 이미 정착, 트랙 C 시각 회귀 Low. bare 50건은 P0-inv 정밀 분류로 사용자 함수 회피. |
| **C4** KPI 결정값 | **a** (N=15,000 / K=1,500) | (a) | ✅ | D8~D10 답습 -50% 패턴 + C2=c 진입 시 도달 가능 가늠. 정확값은 P0-inv 단일 카테고리 분류 후 보정. |
| **C5** 디자이너 카피 결정 시점 | **c** (트랙별 분리) | (c) | ✅ | 트랙별 도메인 어휘·톤 차이(admin LNB ≠ alert ≠ 보고서). 단계별 디자이너 컨펌으로 카피 품질·일관성 우선. D9~D10 핸드오프 답습. |
| **C6** 운영 push 단위 | **b** (트랙별 분할 push) | (b) | ✅ | D5 P4 변경 광역 영향 분할 회귀 안전 마진 확보. D11 라운드와의 PR conflict 회피(§0.3 / §8.5) 도 트랙별 분할 유리. |
| **C7** D11 라운드와의 병렬 진행 | **b** (순차 진행) | (b) | ✅ (일관 결정) | **사용자 명시 — D11 우선 진행, D5 P4 i18n Phase 2 는 D11 정착 후 가동**. 자원 경합(`gemini-3.1-pro`) 회피 + 변경 규모 차이 + 이전 시도 `resource_exhausted` 회피. |
| **C9** 4차 청크 PR-L 진행 합의 | **a** (PR-L 단독 진행) | (a) | ✅ | 1~3차 청크 답습. 위험 분리 (잔존 fallback 광역 변경) + 검증 효율 (각 PR 후 P3 PASS 게이트) + 자동화 안전성 (codemod 단일 책임). |
| **C10** fallback 인자 제거 방식 | **a** (1회 일괄 제거 + 누락 키 자동 시드) | (a) | ✅ | 3차 청크 검증된 codemod 자동화 가능. namespace 분할 점진 제거(b) 대비 효율적. 누락 키는 fallback 문자열 자동 시드 후 codemod 적용으로 라벨 표시 회귀 0 보장. |
| **C11** `console.log` 한국어 메시지 처리 | **b** (운영 로그 한국어 유지·KPI 측정 제외) | (b) | ✅ | 운영 로그 디버깅 효율(개발자 가독성), 사용자 노출 0(브라우저 콘솔 한정), 한국어 라인 KPI 측정에서 `console.log/warn/info/debug` 한국어 메시지는 제외 정책 도입. i18n 적용(a) 시 디버깅 효율 저하 + locale leaves 부풀림 + 빌드 시점 평가 부재로 비효율. (c) 영문 강제 변환은 운영 로그 가독성 훼손. **PR-M Wave-4** 에서 console.log 한국어 메시지 보존 확인 + 한국어 라인 카운트 산식에서 제외하는 검증 단계 1회 수행. |
| **C12** `throw new Error` 한국어 메시지 처리 | **a** (`throw new Error(t('errors.xxx'))` i18n 적용) | (a) | ✅ | 사용자 노출 가능성(에러 boundary·toast·modal 노출), 다국어 진입(D5 P5) 시 자동 다국어화 정합, error namespace 활용도 향상. (b) 한국어 유지는 다국어 진입 시 별도 흡수 라운드 발생, (c) 키만 추출하면 fallback 패턴 답습이 깨짐(PR-L 정합 위반). PR-L codemod 답습 패턴(`t('namespace:key')`) + ko.json 자동 시드로 라벨 표시 회귀 0 보장. **PR-M Wave-3** 에서 일괄 흡수 (~196 라인). |

> **컨펌 결과 요약**: **권장값 11건 일괄 채택** (C1=e / C2=c / C3=a / C4=a / C5=c / C6=b / C7=b / C9=a / C10=a / C11=b / C12=a). C11·C12 는 5차 청크 PR-M 진입 직전 사용자 위임(2026-05-26) — 권장값 자동 채택, 1~4차 청크 패턴 답습. **C8=b** (사용자 추가 컨펌 요청 금지·청크별 무중단 진행) 는 게이트 정책으로 별도 운용 (P0-inv-c3 §8.2 명시), 본 §5.8 표에는 의사결정 항목만 등재. 본 컨펌 결과 이후 §5 분기·재논의는 D12+ / D5 P5 진입 시점까지 닫힘.

---

### 5.9 C9. 4차 청크 PR-L 진행 합의 (2026-05-26 신규)

- **배경**: 1~3차 청크 정착 (운영 main `ec273de76`, Frontend deploy `26421811625`) 후 미달 KPI 잔존 — 한국어 라인 (JS/TS) 29,898 → 20,481 (목표 ≤15,000 미달). 본질 원인은 P0-inv-c3 §7.3 + P3 §8.2 사전 식별: 2차 청크 PR-D 채택 `t('namespace:key', '한국어 fallback')` fallback 인자 패턴 ~5,500~7,000 라인 잔존 — fallback 인자가 한국어 라인 카운트에 잡혀 KPI 미달 본질.
- **질문**: 4차 청크 PR-L (fallback 인자 제거) 진행 단위.
  - (a) **PR-L 단독 진행** — 잔존 fallback 제거만 단일 책임, 1~3차 청크 패턴 답습 (PR 단일 + Wave-1/Wave-2 분할 codemod)
  - (b) PR-L + 추가 트랙(M·N…) 병합 진행 — 다국어 진입(D5 P5)·D11 미해소 항목 동시 흡수
  - (c) PR-L 보류 — 한국어 라인 KPI 미달 수용, 후속 라운드(D5 P5) 로 이월
- **권장**: **(a) PR-L 단독 진행**. 근거 — 위험 분리(잔존 fallback 광역 변경 ~6,000 라인) + 검증 효율(P3 PASS 게이트 단순) + 자동화 안전성(codemod 정규식 단일 패턴) + 1~3차 청크 답습 안정성. (b) 는 자원 경합(`gemini-3.1-pro` 동시 가동) + 회귀 위험 누적, (c) 는 KPI 미달 누적·D5 P5 진입 게이트 미충족.

### 5.10 C10. fallback 인자 제거 방식 (2026-05-26 신규)

- **배경**: §5.9 C9=a 권장 채택 시 PR-L 내부 codemod 정책 결정. fallback 제거 시 i18n 키가 ko.json 에 누락되어 있을 경우 라벨 표시 회귀(빈 문자열/key 노출) 위험.
- **질문**: PR-L 의 fallback 인자 제거 처리 방식.
  - (a) **1회 일괄 제거 + 누락 키 자동 시드** — 정규식 매칭 `t\('([^']+)',\s*'([^']+)'\)` → `t('$1')` 단일 codemod, 사전 단계로 누락 키를 fallback 문자열에서 ko.json 에 자동 시드 후 일괄 제거 (3차 청크 검증된 자동화 답습)
  - (b) namespace 분할 점진 제거 — namespace(`admin`/`common`/`error`/`settings`/`statistics`/`report`/`auth`/`schedule`/`erp` 9 namespace) 별로 분할 PR 후속 진행 (~9 PR, 회귀 안전 마진↑·소요↑)
  - (c) 잔존 허용 — fallback 인자 패턴 운영 안전 구조로 KPI 미달 수용, 코드 무수정 (C9=c 와 양립)
- **권장**: **(a) 1회 일괄 제거 + 누락 키 자동 시드**. 근거 — 3차 청크 P3 검증 (`8c404ea60` 이후) codemod 안정성 입증 + namespace 분할(b) 9회 PR 비효율 + lint:codemod-mappings 57/57 PASS 정합 검증 가능 + Production Build PASS 게이트로 회귀 차단. 누락 키 자동 시드는 P0-inv-c4 단계에서 ko.json 정합성 사전 검증·시드 정책 산출 후 codemod 적용 — 라벨 표시 회귀 0 보장.

### 5.11 C11. `console.log` 한국어 메시지 처리 (2026-05-26 신규)

- **배경**: 1~4차 청크 정착 (운영 main `a68886273`, Frontend deploy `26423706330` success) 직후 미달 KPI 본질 — 한국어 라인 (JS/TS) 17,730 (목표 ≤15,000 격차 +2,730). `console.log/warn/info/debug` 한국어 메시지 ~971 라인 잔존. 운영 로그용 디버깅 메시지로 사용자 노출 0(브라우저 콘솔 한정), 개발자 가독성 직결.
- **질문**: PR-M 진입 시 `console.log` 한국어 메시지 처리 정책.
  - (a) `console.log(t('debug.xxx'))` i18n 적용 — error namespace 또는 `debug` namespace 신설로 흡수
  - (b) **운영 로그 한국어 유지 + KPI 측정 제외** — `console.log/warn/info/debug` 한국어 메시지는 한국어 라인 카운트 산식에서 제외 (개발자 가독성·디버깅 효율 우선, 사용자 노출 0)
  - (c) 영문 강제 변환 — 모든 `console.log` 한국어를 영문으로 일괄 치환
- **권장**: **(b) 운영 로그 한국어 유지 + KPI 측정 제외**. 근거 — (1) 사용자 노출 0(브라우저 콘솔 한정, 사용자가 보지 못함) / (2) 개발자 가독성 직결 (운영 디버깅 시 한국어 컨텍스트 보존) / (3) i18n 적용(a) 은 빌드 시점 평가가 안되어 console 출력 시 키만 노출되거나 locale 미로드 시 fallback 깨짐 위험 / (4) (c) 영문 강제 변환은 디버깅 효율 저하·번역 품질 저하. **운영 정책**: 한국어 라인 카운트 산식에서 `console.\(log\|warn\|info\|debug\|error\)\(.*[가-힣]` 제외 후 측정 — `wc -l` 대신 `grep -v` 후처리. **PR-M Wave-4** 에서 console.log 한국어 메시지 보존 확인 1회 수행 (코드 변경 0건, KPI 측정 산식 갱신만).

### 5.12 C12. `throw new Error` 한국어 메시지 처리 (2026-05-26 신규)

- **배경**: `throw new Error('한국어 메시지')` 패턴 ~196 라인 잔존 (frontend src 전체). 에러 boundary·toast·modal 노출 가능성으로 사용자 직접 노출 가능. 다국어 진입(D5 P5) 시 다국어화 필요.
- **질문**: PR-M 진입 시 `throw new Error` 한국어 메시지 처리 정책.
  - (a) **`throw new Error(t('errors.xxx'))` i18n 적용** — error namespace 활용 + ko.json 자동 시드로 흡수 (PR-L codemod 답습)
  - (b) 한국어 유지 — D5 P5 다국어 진입 별도 라운드에서 흡수
  - (c) 키만 추출 — `throw new Error('errors.validation.required')` 키 노출 형태 (호출자가 t() 적용)
- **권장**: **(a) `throw new Error(t('errors.xxx'))` i18n 적용**. 근거 — (1) 사용자 노출 가능성 (에러 boundary·toast·modal) / (2) 다국어 진입(D5 P5) 자동 다국어화 정합 / (3) error namespace 활용도 향상(151 leaves → ~340 leaves) / (4) PR-L 정합(fallback 인자 제거 패턴 답습) / (5) (b) 는 다국어 진입 시 별도 흡수 라운드 발생, (c) 는 fallback 패턴 깨짐 + 호출자별 t() 일괄 적용 어려움. **PR-M Wave-3** 에서 일괄 흡수 (~196 라인). codemod 패턴: `throw new Error\('([^']*[가-힣][^']*)'\)` → `throw new Error(t('errors.업종.사례'))` + ko.json 자동 시드.

---

## §6 PR 계획 (Phase 2 PR 단위)

> **결정 근거**: §5.8 C2=c (A+B+C) + C3=a (트랙 C 포함) + C5=c (트랙별 분리) + C6=b (트랙별 분할 push). 트랙 D(추가 언어) 는 C1=e 로 본 라운드 제외 — D5 P5 또는 D12+ 후속.

### 6.1 PR 분할 단위 (3건 + 인벤토리 1건)

| PR | 영역 | 책무 | 의존성 (선행) | 위임 라인업 (P1 → P2 → P3 → P4) | 변경 파일 가늠 |
|---|---|---|---|---|---|
| **PR-INV** (P0-inv 산출물 별도 PR 아님 — `reports/` JSON·문서 산출) | 트랙 A·B·C 인벤토리 단일 카테고리 분류 | `explore` 단독 read-only | D11 P4 운영 push 정착 (§7 게이트) | (위임 라인업 외 — 인벤토리 산출만) | `reports/d5-p4-i18n-inventory-*-20XXXXXX.json` + 분류 마크다운 |
| **PR-A** | **트랙 A (1순위)** 어드민 LNB / GNB / UnifiedModal / error·toast 메시지 | 한글 문자열 → `t('key','한글 fallback')` + locale 확장 + namespace `error` 신설 | PR-INV 완료 + P1 트랙 A 카피 핸드오프 (`core-designer`, `gemini-3.1-pro`) | 핸드오프 → `core-coder` → `core-tester` → `core-deployer` | `frontend/src/locales/ko/{admin,common,error}.json` 확장(+~600 leaves) + 컴포넌트 ~270개 |
| **PR-B** | **트랙 B (2순위)** 설정 / 통계 / 보고서 / analytics | 한글 문자열 → `t()` + locale 신설 (`settings`/`report`/`statistics`) | PR-A merge + P1' 트랙 B 카피 핸드오프 | 핸드오프 → `core-coder` → `core-tester` → `core-deployer` | `frontend/src/locales/ko/{settings,report,statistics}.json` 신설(+~250 leaves) + 컴포넌트 ~80개 |
| **PR-C** | **트랙 C (3순위)** `window.alert`/`confirm` (+ bare 50건 도메인 분류분) → UnifiedModal i18n | `useConfirm` / `useAlert` 훅 SSOT 통합 + 메시지 키 흡수(`error`/`common`) | PR-A merge + P1'' 트랙 C 카피 핸드오프 (UnifiedModal 메시지 톤 합의) | 핸드오프 → `core-coder` → `core-tester` → `core-deployer` | UnifiedModal i18n props 확장 + `window.alert/confirm` 10건 + bare 50건 중 도메인 alert 정밀 분류 후 일괄 |

> **PR-D (트랙 D 추가 언어) 는 본 라운드 미포함** — C1=e (한국어 only) 결정에 따라 D5 P5 또는 D12+ 후속 라운드로 분리.

### 6.2 PR 의존성 그래프 (직렬 + 부분 병렬 허용)

```text
D11 P4 운영 push 정착 (게이트)
        │
        ▼
   PR-INV (P0-inv `explore` 인벤토리)
        │
        ▼
   P1 트랙 A 디자이너 카피 핸드오프 (gemini-3.1-pro)
        │
        ▼
   PR-A (core-coder → core-tester → core-deployer 운영 push)
        │
        ├──▶ P1' 트랙 B 카피 핸드오프 ──▶ PR-B (직렬 권장 — KPI 단계 측정)
        │
        └──▶ P1'' 트랙 C 카피 핸드오프 ──▶ PR-C (PR-B 와 병렬 가능, UnifiedModal 사용처 분리)
```

- **직렬 권장**: PR-INV → PR-A → PR-B (KPI 단계 측정·회귀 안전 마진).
- **병렬 가능**: PR-B ↔ PR-C (UnifiedModal 사용처가 트랙 B 영역과 영역 분리). 단, **동일 컴포넌트 파일 동시 수정 시 사전 rebase 검증**.
- **각 PR 후 P3 PASS 게이트** 필수 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙) — P3 PASS 전 P4 운영 push 금지.

### 6.3 PR별 예상 소요 (D11 정착 후 시계 시작 가정)

| PR | 인벤토리 + 디자이너 카피 (P0/P1) | 코더 작업 (P2) | 테스터 검수 (P3) | 운영 push (P4) | **합계** |
|---|---:|---:|---:|---:|---:|
| **PR-INV** | 3~5 영업일 | — | — | — | **~1주** |
| **PR-A** | 5~7 영업일 (트랙 A 카피·키 명명·영문 1차 시안 옵션) | 10~14 영업일 (~11,000 라인 광역) | 3~4 영업일 (LNB·모달·error 광역 회귀) | 1 영업일 | **~3주** |
| **PR-B** | 3~4 영업일 (트랙 B 카피) | 4~5 영업일 (~1,000 라인) | 2 영업일 | 1 영업일 | **~1.5주** |
| **PR-C** | 2~3 영업일 (UnifiedModal 메시지 톤 합의) | 3~4 영업일 (10건 + bare 50건 분류분) | 2 영업일 | 1 영업일 | **~1주** |
| **합계** (직렬 + 부분 병렬) | — | — | — | — | **~5~7주** |

> **단축 가능성**: PR-B ↔ PR-C 병렬 진행 시 -0.5~1주. **연장 위험**: 트랙 A 시각 회귀 HIGH 발견 시 +0.5~1주, 디자이너 카피 외부 검수 도입 시 +1주.

---

## §7 ETA + D11 정착 대기 (가동 조건)

### 7.1 가동 조건 (Hard Gate)

> **가동 조건: D11 P4 정착 완료 후 즉시 P0-inv 위임 가능**.

| 게이트 | 충족 조건 | 검증 방법 |
|---|---|---|
| **G1. D11 P4 운영 push 정착** | D11 합의서 (`docs/standards/DESIGN_TOKEN_GAP_2026Q2_D11.md`) 의 P4 단계 운영 main push 완료 + GitHub Actions PASS | `git log main --oneline -E "D11.*push|D11.*main"` 으로 D11 정착 SHA 식별 (현재 미정착, SHA TBD) |
| **G2. D11 회귀 0 보고** | D11 P3 시각 회귀 HIGH 0 / MED 0 + 디자인 토큰 metric 재정의 PASS 보고 | D11 합의서 §변경 이력 + `core-tester` P3 보고서 |
| **G3. develop 정합** | 본 D5 P4 합의서가 develop 최신 head 와 정합 (rebase conflict 0) | `git fetch origin develop && git diff develop -- docs/standards/DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md` |
| **G4. 자원 경합 회피** | `gemini-3.1-pro` (디자이너·테스터) 동시 가동 슬롯 확보 — D11 P3 종료 후 가용 | 메인 어시스턴트 위임 시점 판단 |

> **G1 충족 전 P0-inv 위임 호출 금지** (§5.8 C7=b 일관 결정). 본 합의서는 G1~G4 모두 충족된 시점에 메인 어시스턴트가 P0-inv (`explore`) 위임을 개시할 수 있도록 가동 대기 상태로 develop 에 고정한다.

### 7.2 ETA 추정 (D11 정착 후 시계 시작)

| 기준 | 추정 | 비고 |
|---|---|---|
| **D11 정착 시점 (T₀)** | TBD — D11 합의서 가동 대기 (현재 사용자 컨펌 대기 또는 P0-inv 진행 중) | D11 합의서 SHA 별도 추적 |
| **PR-INV 완료** | T₀ + ~1주 | 인벤토리 + 분류 JSON |
| **PR-A merge + 운영 push** | T₀ + ~4주 (PR-INV 1주 + PR-A 3주) | 트랙 A 정착 |
| **PR-B merge + 운영 push** | T₀ + ~5.5주 (PR-A + 1.5주 직렬) | 트랙 B 정착 |
| **PR-C merge + 운영 push** | T₀ + ~6.5주 (PR-B 와 부분 병렬 시 ~5.5주 단축 가능) | 트랙 C 정착 |
| **Phase 2 종결 보고 (D5 P4 라운드 완전 종결)** | **T₀ + ~5~7주** | KPI 매트릭스 + Phase 1 회귀 0 + 후속 라운드 (D5 P5 다국어 또는 D12+) 트리거 결정 |

> **ETA 의미**: 본 추정은 D5 P4 단독 시계. **D11 정착 시점 (T₀) 자체는 본 합의서 ETA 에 포함되지 않음** — D11 합의서 별도 ETA 참조. D11 정착이 늦어지면 D5 P4 가동도 동일 비율로 지연된다.

### 7.3 가동 대기 상태 (재개 절차)

D11 P4 정착 완료 보고를 받은 직후, 메인 어시스턴트는 다음 순서로 즉시 가동:

1. **§7.1 G1~G4 게이트 검증** (특히 G3 develop 정합 — 본 합의서가 D11 정착 후 develop 최신과 conflict 없는지 확인).
2. **P0-inv 위임** (`explore`) — 본 합의서 §4.1 P0-inv 행 프롬프트 골격 사용, `gemini-3.1-pro` 불필요 (read-only 인벤토리).
3. **P1 트랙 A 디자이너 카피 핸드오프** (`core-designer`, **모델 `gemini-3.1-pro` 명시**) — §4.1 P1 행 프롬프트.
4. **PR-A 진입** — §4.1 P2-a → P3 → P4 직렬, §6.1 PR-A 변경 파일 범위 명시.
5. 이후 PR-B → PR-C 는 §6.2 의존성 그래프대로.

> **재개 트리거**: 사용자가 "D5 P4 P0-inv 가동" 또는 "D11 정착 완료 — D5 P4 진행" 등 명시적 위임 시 본 합의서 §7.3 절차에 따라 즉시 진입.

---

## §8 리스크 / 트레이드오프

### 8.1 번역 품질 — 다국어 진입 (트랙 D) 시 외부 번역사·사내 카피 결정

- **리스크**: `en-US`/`ja-JP`/`zh-CN` 등 추가 언어 진입 시 자동 번역 (DeepL·Google Translate API) 적용은 도메인 어휘 (상담 매칭·세션 회기·결제·멀티테넌트) 손상 위험. 사내 직접 번역은 디자이너·기획 자원 부담 + 일관성 위험.
- **완화안**: §5 C1 권장 (e) — Phase 2 본 라운드는 한국어 only 정착, 다국어 진입은 별도 라운드 분리 + 번역 품질 SSOT (외부 번역사 견적 / 사내 카피 가이드) 결정 후 진입.
- **트레이드오프**: 다국어 진입 지연 vs 번역 품질·일관성 보장.

### 8.2 런타임 사이즈 — i18n 번들 사이즈 증가

- **리스크**: locale 키 290 → 1,500+ 확장 시 ko 단일 언어 번들 사이즈 ~+50KB (gzip 후 ~+15KB) 가늠. 다국어 진입 시 언어 수만큼 선형 증가 (예: en-US 추가 시 +15KB) + 동적 로드 미적용 시 초기 페이로드 증가.
- **완화안**: (1) `i18next-http-backend` 동적 로드 (Phase 1 미적용, Phase 2 진입 시 검토). (2) namespace 단위 lazy import (`/admin` 라우트 진입 시 `admin.json` 만 로드). (3) Phase 2 P3 검수에 번들 사이즈 측정 KPI 추가 (§3).
- **트레이드오프**: 동적 로드 도입 시 초기 렌더링 latency vs 초기 페이로드 절감.

### 8.3 SEO — 다국어 진입 시 URL 정책·hreflang

- **리스크**: 다국어 진입 시 `/admin` URL 이 언어별 분리되지 않으면 검색 엔진 hreflang 매트릭스 미적용. 어드민 영역은 인덱싱 비대상이라 영향 낮으나 공개 페이지(랜딩·홍보) 다국어 도입 시 SEO 정책 필요.
- **완화안**: 본 D5 P4 라운드 범위는 어드민·내담자·상담사 SPA 내부 라벨에 한정. 공개 페이지 다국어 SEO 는 별도 라운드 분리.
- **트레이드오프**: SEO 정책 결정 비용 vs 다국어 마케팅 효과.

### 8.4 운영 비용 — 번역 SSOT 유지 (locale 키 누락·번역 미동기화)

- **리스크**: 키 추가·수정 시 ko / en-US / ja-JP 등 모든 언어 파일 동기화 필요. 누락 시 `t()` fallback (Phase 1 권장 패턴) 으로 한글 노출 → 다국어 UX 손상.
- **완화안**: (1) CI 게이트 — locale 키 일관성 검증 스크립트 (`scripts/i18n/check-locale-parity.js`) 신설 권고. (2) Phase 1 fallback 패턴 (`t('key', '한글 fallback')`) 답습으로 회귀 0 보장. (3) 키 추가 PR 시 모든 언어 파일 동시 변경 강제 (lint rule).
- **트레이드오프**: CI 게이트 운영 부담 vs 다국어 SSOT 일관성.

### 8.5 D11 라운드 (디자인 토큰) 와의 PR conflict

- **리스크**: 동일 컴포넌트 파일에서 CSS·라벨 동시 수정 시 develop 브랜치 conflict. 특히 admin LNB·UnifiedModal·error 메시지는 D11 의 토큰 신설·cascade 변경과 겹칠 가능성.
- **완화안**: §5 C7 권장 (b) 순차 진행. 병렬 진행 시 (C7=a) 사전 rebase 검증 + 파일 영역 분리 명시 (D5 P4: `*.{js,jsx,ts,tsx}` 한글 문자열 + `*.json` locale / D11: `unified-design-tokens.css` + codemod 스크립트 + 문서).
- **트레이드오프**: 순차 진행 속도 vs conflict 위험.

### 8.6 텍스트 길이 변동 — LNB / 모달 / 테이블 헤더 레이아웃 회귀

- **리스크**: 다국어 진입 시 영문 라벨이 한글 대비 평균 1.3~1.7배 길어 LNB(260px 너비) / GNB(64px 높이) / 모달 헤더 / 테이블 컬럼 레이아웃 깨질 위험. 일본어는 한글 대비 비슷하나 한자 사용 시 폰트 메트릭 차이.
- **완화안**: (1) P1 디자이너 카피 결정 시점에 영문 길이 시뮬레이션 (가장 긴 라벨 추출 → CSS overflow / text-truncation 정책). (2) P3 시각 회귀 우선 점검 화면에 LNB·모달·테이블 헤더 광역 포함.
- **트레이드오프**: 시각 회귀 비용 vs 다국어 UX 완성도.

### 8.7 Phase 1 정착물 회귀 위험 (i18n/index.js / 기존 290 leaves)

- **리스크**: 본 라운드 P2 코더 작업 시 Phase 1 정착물 (`i18n/index.js` 라이브러리 초기화 코드 + 기존 290 leaves + 275 컴포넌트 `t()` 호출) 의도치 않은 수정.
- **완화안**: 본 합의서 §1.6 SSOT 보존 원칙 명시 + P2 위임 프롬프트에 "Phase 1 정착물 무수정" 강제 + P3 검수에 회귀 0 검증 KPI 추가.
- **트레이드오프**: 작업 자유도 vs Phase 1 안정성.

---

## §9 산출물 (합의서 정착 시)

- **본 합의서 (`DESIGN_TOKEN_GAP_2026Q2_D5_P4_I18N_PHASE_2.md`)** — 사용자 컨펌 §5 7건 확정 후 §11 변경 이력 갱신, P0-inv 위임 트리거.
- **P0-inv 산출물 (`explore` 위임 후)**: `reports/d5-p4-i18n-inventory-{trackA,trackB,trackC,namespace}-20260524.json` + 분류 마크다운 1장.
- **P1 핸드오프 산출물 (`core-designer` 위임 후, 모델 `gemini-3.1-pro`)**: `docs/project-management/2026-05-24/D5_P4_P1_DESIGN_HANDOFF_I18N.md` (트랙별 키 명명·한글 카피·영문 1차 시안·다국어 정책 결정).
- **P2 코드 변경 산출물 (`core-coder` 위임 후)**: `frontend/src/locales/ko/{admin,common,error,settings,report,statistics}.json` 확장·신설 + 컴포넌트 `t()` 치환 + (C1 다국어 진입 시) `frontend/src/locales/{en-US,ja-JP,…}/*.json` 신설 + `i18n/index.js` `supportedLngs`·`resources` 확장.
- **P3 검수 산출물 (`core-tester` 위임 후, 모델 `gemini-3.1-pro`)**: `docs/project-management/2026-05-25/D5_P4_P3_VISUAL_REGRESSION_REPORT.md` + KPI 측정값 (한국어 라인 / `t()` 호출 / locale leaves / 번들 사이즈 / Phase 1 회귀 매트릭스).
- **P4 운영 push 결과**: (C6 컨펌에 따라) develop → main rebase + GitHub Actions PASS + 운영 게이트 KPI 보고 + D5 P4 라운드 완전 종결 보고 + (필요 시) D5 P5 / D12+ 후속 라운드 (다국어 또는 namespace 추가 확장) 트리거.

> **권고**: 합의서 §5 7건 사용자 컨펌 확정 직후, 메인 어시스턴트가 P0-inv (`explore`) 위임을 즉시 개시한다 (D10 P0 / D11 P0-inv 답습 패턴, 단 D11 진행 정책 §5 C7 결정 후).

---

## §10 부록 — 미존재/참조 누락 보고

- `docs/standards/I18N_ADOPTION_STRATEGY_2026Q2.md` — **미존재** (D5_DIRECTION §4 P4 의 예정 SSOT). 본 합의서가 그 자리(별도 합의서)를 대신하며, 명칭은 사용자 위임 (`D5_P4_I18N_PHASE_2.md`) 을 따른다. 필요 시 본 합의서 정착 후 별도 alias 문서로 신설·리다이렉트 가능.
- `frontend/src/locales/README.md` §3 점진 도입 절차 (Phase 1 → Phase 2 → 언어 추가) — **존재**, 본 합의서 §5 C1 권장(e) 정책과 정합.
- `scripts/i18n/check-locale-parity.js` (CI 게이트 권고) — **미존재**, §8.4 완화안. 다국어 진입 (트랙 D) 시 신설 필요. 본 라운드 ko only 정착 시 우선 불필요.
- Phase 1 부트스트랩 시점 PR / 커밋 SHA — `frontend/src/i18n/index.js` 작성일 `2026-05-21` 추정. 정확한 SHA 는 P0-inv 단계에서 git blame 으로 보완 가능 (본 합의서 의사결정에 무영향).
- 측정 도구 — 사용자 위임은 `ripgrep`(rg) 기반이나 로컬 미설치로 `grep -rE`(POSIX) 동등 산출 사용. 결과값 동등성은 패턴 정합으로 보장 (한국어 매칭 29,279 / `t()` 932 / locale leaves 290 / alert/confirm 인벤토리 10건).

---

## §11 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-planner | D5 P4 합의서 초안 작성 (D5_DIRECTION §3.4 / §4 P4 / §6 C5 후속). 4 트랙 (A 어드민 LNB/모달/error + B 보조 화면 + C alert/confirm UnifiedModal i18n + D 추가 언어) 분류. **인벤토리 실측 (2026-05-23, develop `c31a498df`)**: 한국어 JS/TS 라인 29,279 / 한국어 CSS 라인 5,304 / `t()` 호출 라인 932 / `useTranslation` 사용 파일 275 / locale 키 leaves 290 (common 60 + admin 230) / `window.alert` 1 + `window.confirm` 9 + bare alert/confirm 50 / UnifiedModal 사용 422 라인. 영역별 한국어 분포 — admin 6,087 / common 1,698 / layout 179 / error/toast 3,247 / settings/report 1,002. **선행 라운드**: D5 P1·P2·P3 정착 + D6~D10 누적 정착 (운영 main `e88a264a9`, NO-OP 1건 D9 P2-f). **D11 합의서 초안 (`0d226f0c2`, 디자인 토큰 metric 재정의) 와의 경계**: 라벨 SSOT vs 디자인 토큰 SSOT 영역 분리 명시 (§0.3). 사용자 컨펌 7건(§5) 대기 — 디폴트 후보: C1=e (ko only) / C2=c (A+B+C) / C3=a (현재 트랙 포함) / C4=a (N=15,000 / K=1,500) / C5=c (트랙별 분리) / C6=b (트랙별 분할 push) / C7=b (순차 진행). 본 합의서는 의사결정 골격만, 코드·디자인 토큰·Phase 1 정착물 직접 수정 0줄. **이후 P0-inv 위임은 §5 컨펌 확정 후 메인 어시스턴트가 개시**. (정착 SHA `5979e402e`) |
| 2026-05-26 | core-planner | **§5.8 사용자 컨펌 결과 (일괄 채택) + §6 PR 계획 + §7 ETA + D11 정착 대기 명시 정착.** 사용자 결정 컨펌 7건 일괄 채택 — **C1=e / C2=c / C3=a / C4=a / C5=c / C6=b / C7=b** (C7 사용자 명시 일관 결정, 권장값과 일치). **D11 우선 진행** 정책 고정 — D5 P4 i18n Phase 2 는 D11 P4 운영 push 정착 (게이트 G1) 완료 후 즉시 P0-inv 위임 가능 상태로 develop 에 고정. **§6 PR 계획** 신설 — PR-INV (인벤토리) + PR-A (트랙 A 어드민/모달/error) + PR-B (트랙 B 설정/통계/보고서) + PR-C (트랙 C alert/confirm UnifiedModal i18n) 4단계 분할 + 의존성 그래프 + 트랙별 분할 push (§5.8 C6=b). PR-D (트랙 D 추가 언어) 미포함 — C1=e 결정에 따라 D5 P5 / D12+ 후속. **§7 ETA** — D11 정착 시점 T₀ 이후 ~5~7주 (PR-A 3주 + PR-B 1.5주 + PR-C 1주 직렬·부분 병렬 가정). 가동 게이트 G1~G4 정의 (D11 P4 정착 + 회귀 0 + develop 정합 + `gemini-3.1-pro` 자원 가용). 본 update 도 의사결정 문서 only, 코드·디자인 토큰·Phase 1 정착물 0줄. **P0-inv 위임 호출은 본 위임 범위 외** — D11 정착 후 별도 위임 트리거. |
| 2026-05-26-a | core-planner | **P0-inv 인벤토리 정착 (PR-INV 산출).** D11 P4 운영 push 정착 (`9e22d9e4c`, 게이트 G1 충족) 후 즉시 가동 — `generalPurpose` 위임으로 한국어 라인 단일 카테고리 분류 (우선순위 A > C > B > D) + alert/confirm 정밀 분류 + namespace 분할 후보 + 트랙 A Top-20 + KPI 기준선 갱신. **산출 5건**: `reports/d5-p4-i18n-inventory-{trackA,trackB,trackC,namespace}-20260526.json` (4) + `docs/project-management/2026-05-26/D5_P4_I18N_PHASE_2_P0_INVENTORY.md` (1). **KPI 현재 기준선** — 한국어 라인 (JS/TS) 29,898 (합의서 §1.1 29,279 대비 +2.1%, 신규 컴포넌트 +24), `t(` 호출 1,012 (+8.6%), `useTranslation` 파일 275 (변동 없음), ko leaves 410 (common 60 + admin 350, D10~D11 라운드 부산물로 +120), `window.alert` 1 + `window.confirm` 10 (+1 ApiKeyManager.js). **트랙 단일 분류** — A 9,181 라인 (admin 6,691 + common-modal 1,753 + error/toast 565 + layout 172) / B 461 / C 11 / D 20,245. **트랙 A Top-5**: AdminDashboard (275) · ConsultantComprehensiveManagement (270) · AdminDashboardV2 (211) · DashboardFormModal (181) · PermissionManagement (129) — Top-20 합 2,489 라인 = 트랙 A 27.1%. **alert/confirm 운영 도메인 P2-c 직접 치환 대상 17건** + `useConfirm`/`useAlert` 훅 **0건** (P2-c 진입 시 훅 신설 필요). **namespace 분할 후보 18개** (기존 2 + 신설 16, 합의서 §3 권장 7개 검증). 운영 코드 0줄 수정 (정착 SHA `a43ed3d7f`). 다음 단계: P1 트랙 A 디자이너 카피 핸드오프 (`core-designer`, `gemini-3.1-pro`). |
| 2026-05-26-g | core-deployer | **P4 운영 push 정착 (develop `ade9d1b31` → main `ade9d1b31`, fast-forward).** 합의서 §4.1 P4 행 + P3 GO 권고 근거. **사전 정합**: merge-base == main HEAD (`9e22d9e4c`) — FF 가능 / working tree clean. **fast-forward push**: `git merge --ff-only develop` → `git push origin main` — 9건 커밋 (PR-A+B+C + P3 포함) 정착, 47 파일 5,527 insertions, non-ff 없음. **정착 main SHA**: `ade9d1b311018bc46ab95e25ce5e0b993c934152`. **GitHub Actions** (runId): 🎨 CI/BI 보호 시스템 `26413867279` ✅ success / 🎨 Frontend (CoreSolution) 운영 배포 `26413867294` ✅ success / 🔍 코드 품질 검사 `26413867293` ⏳ 10분 초과 SKIP (후속 모니터링 권고). **운영 외부 HTTPS**: app.core-solution.co.kr **200** (63ms) / mindgarden.core-solution.co.kr **200** (56ms) / ops.e-trinity.co.kr **200** (122ms). **Spring Boot Actuator** `/actuator/health` → `{"status":"UP"}` ✅. **가드 준수**: DB UPDATE 0 / rebase 0 / force push 0. 산출 보고서: `docs/project-management/2026-05-26/D5_P4_P4_PRODUCTION_PUSH_REPORT.md`. **D5 P4 i18n Phase 2 1차 청크 운영 정착 완료** — 후속: D5 P4 2차 청크 (N=29,902 → N≤15,000) + ESLint comma-dangle 정비 + D5 P5 다국어 준비. |
| 2026-05-26-f | core-planner | **P3 종합 회귀 검수 정착 (gemini-3.1-pro) — 운영 push GO 권고.** `core-tester` 역할 (`gemini-3.1-pro`) 위임으로 합의서 §4.1 P3 행 + §3 KPI 매트릭스 종합 검수. **회귀 카운트**: HIGH **0** / MED **0** / LOW **1** (trailing comma ESLint 경고). **빌드/lint 정합**: D11 가드 `lint:codemod-mappings` ✅ PASS (57/57) / i18n hook+locales ESLint ✅ 0 errors (4 warnings) / Component ESLint ✅ 0 critical errors (1 trailing comma error + 31 warnings, 무해) / **Production Build (`npm run build`) ✅ PASS** (경고만, 에러 0, JS/CSS 번들 생성). **Phase 1 정착물 회귀 0** — i18n/index.js SUPPORTED_LANGUAGES/FALLBACK_LANGUAGE/DEFAULT_NAMESPACE 보존, 기존 410 leaves 보존, 1,012 t() 호출 패턴 보존. **i18n 정합성** — 6 namespace (common/admin/error/settings/statistics/report) `i18n/index.js` 정상 등록 / useTranslation 배열 정합 / `t('key', '한글 fallback')` 패턴 fallback 메커니즘 PASS. **KPI 매트릭스 (합의서 §3 vs 실측 (`8c404ea60`))**: 한국어 라인 29,279 (§1.1) → 29,902 (-0 vs P0-inv 29,898, 미세 +4) — 목표 N=15,000 미도달 (1차 청크 한계, 후속 청크 권고) / ko leaves 290 → **1,385** (+1,095, +377%) — **C4=a 목표 K=1,500 의 92.3% 달성** / `t(` 호출 932 → **1,312** (+380, +40.8%) — 목표 3,000 의 43.7% / useTranslation 파일 275 → **290** (+15, +5.5%) — 목표 500 의 58.0% / window.alert+confirm 잔존 11 → **2** (notification.js 래퍼만, **컴포넌트 잔존 0 도달**) — KPI 목표 0 ✅ 달성. **운영 push 권고: GO** — 근거: (1) Production Build PASS, HIGH/MED 회귀 0 / (2) Phase 1 정착물 무손실 보존 / (3) K=1,500 의 92.3% 도달 (1차 청크 마일스톤 충분) / (4) alert/confirm UnifiedModal 전환으로 코드 품질 향상 / (5) 잔존 N 라인은 fallback 안전 구조로 운영 무지장. **후속 라운드 권고**: D5 P4 2차 청크 (잔존 N 추출), trailing comma lint 룰 일괄, D5 P5 다국어 준비 (한국어 키 정착 완료 후). 산출 보고서: `docs/project-management/2026-05-26/D5_P4_P3_VISUAL_REGRESSION_REPORT.md` (58행). 다음 단계: P4 (core-deployer) — develop → main fast-forward + 운영 외부 HTTPS 검증. |
| 2026-05-26-e | core-planner | **PR-C 트랙 C 정착 (window.alert/confirm + bare 도메인 → useConfirm/useAlert 훅 치환, 운영 도메인 잔존 0).** `generalPurpose` (core-coder 역할) 위임으로 합의서 §6.1 PR-C 범위 정착. PR-A 신설 `useConfirm`/`useAlert` 훅 (variant 4종, UnifiedModal 래핑, 튜플 패턴) 운영 적용. **수정/신설 파일 11개** (1 modified common.json + 10 컴포넌트 치환). **치환 14건** — window.confirm 10건 (ClassList/CourseList/EnrollmentList/DashboardManagement/ApiKeyManager/AdminOnboarding/DiagnosticReportEditor/SOAPNoteEditor/ScheduleClientNotesSection) + bare alert 5건 (AdminOnboarding 4 + CommunityFeed 1). **variant 분포**: danger 7건 (삭제/비활성화) + warning 2건 + info 2건 + success 2건 + 기타 1건. **locale 보강**: `ko/common.json` +7 leaves (modal.delete.confirm / modal.dashboard.delete.confirm / modal.apiKey.delete.confirm / modal.scheduleNote.delete.confirm / modal.soapNote.approve.confirm / modal.enrollment.cancel.confirm / modal.community.report.success). **변경 금지 잔존 2건**: `utils/notification.js:176,191` 사용자 정의 wrapper 함수 (의도된 추상화). **범위 외 5건**: Icon.stories 4 + Card.test.example 1 (테스트/storybook). **가드 PASS** — lint:codemod-mappings ✅ / locale JSON valid ✅ / ESLint 10파일 0 errors ✅ / D11 CI/BI 하드코딩 검사 ✅ / Phase 1+PR-A+PR-B 무수정 ✅. **KPI 갱신 (PR-B `314ffb4f7` → PR-C 코드 `2146b6f14` + 보고서 `c7fc7790b`)**: ko leaves 1,378 → **1,385** (+7) — KPI K=1,500 의 **92.3%** 도달 / `window.alert`+`window.confirm` 운영 도메인 잔존 11 → **0** ✅ (목표 0 도달) / bare alert/confirm 운영 도메인 잔존 6 → **0** ✅. 산출 보고서: `docs/project-management/2026-05-26/D5_P4_P2_PR_C_REPORT.md`. **D5 P4 i18n Phase 2 P2 코더 단계 (PR-A 1차 + PR-B + PR-C) 완료** — 다음 단계: P3 종합 시각 회귀 검수 (`core-tester`, `gemini-3.1-pro`). |
| 2026-05-26-d | core-planner | **PR-B 트랙 B 정착 (settings/statistics/report namespace 3개 신설 + 컴포넌트 17 파일 치환).** `generalPurpose` (core-coder 역할) 위임으로 합의서 §6.1 PR-B 범위 정착 + P1' 핸드오프 통합 (트랙 B 461 라인 / 18 파일 소규모로 별도 디자이너 핸드오프 분리는 과도). **수정/신설 파일 17개** (4 modified i18n/locale + 13 컴포넌트 치환). **인프라**: `i18n/index.js` 에 settings/statistics/report namespace 3개 등록 (+9줄). **locale 신설**: `ko/settings.json` (67 leaves) + `ko/statistics.json` (82 leaves) + `ko/report.json` (113 leaves) = **+262 leaves**. **컴포넌트 치환 13 파일**: ConsultationReport(38) / DiagnosticReportEditor(31) / ErpReportModal(32) / PerformanceMetricsModal(30) / UserSettings(29) / ClientSettings(27) / ConsultantIncomeReport(12) / ConsultantRatingStatisticsView(11) / ConsultationCompletionStatsView(10) / SettingsSection(10) / TodayStatisticsView(9) / SummaryStatisticsWidget(2) / StatisticsWidget(1) = **+242 t() 호출**. **Phase 1 + PR-A 정착물 무수정 정합** — common 262 / admin 703 / error 151 leaves + i18n/index.js 기존 (SUPPORTED_LANGUAGES/FALLBACK_LANGUAGE/DEFAULT_NAMESPACE/error namespace) 완전 보존. **가드 PASS** — lint:codemod-mappings ✅ / 3 신설 locale JSON valid ✅ / ESLint 0 errors (5 경미 warnings) ✅. **KPI 갱신 (PR-A `c196b7b0c` → PR-B `314ffb4f7`)**: ko leaves 1,116 → **1,378** (+262) — **KPI K=1,500 의 91.9% 도달 (PR-A 74.4% +17.5%)** / `t(` 호출 1,094 → 1,268 (+174) / useTranslation 파일 283 → 290 (+7) / 한국어 라인 29,921 → 29,910 (-11). **잔여 트랙 B 작업** — `psychAssessmentAiReportUiStrings.js` 상수 (report.psychAi.* locale 시드 완료, 소비자 컴포넌트 치환 후속) + `consultantSessionStatisticsClient.js` API fallback 1건 (비시각, 우선순위 낮음). 산출 보고서: `docs/project-management/2026-05-26/D5_P4_P2_PR_B_REPORT.md`. 다음 단계: PR-C (트랙 C alert/confirm UnifiedModal i18n — useConfirm/useAlert 훅 사용처 치환). |
| 2026-05-26-c | core-planner | **PR-A 트랙 A 1차 청크 정착 (i18n 인프라 + locale +706 leaves + 훅 신설 + Top-4 부분 치환).** `generalPurpose` (core-coder 역할) 위임으로 합의서 §6.1 PR-A 범위 (1차 청크 — 인프라 + locale + 훅 + Top-3 핵심 + AdminOnboarding 흡수). **수정/신설 파일 13개** (9 modified + 4 신설). **인프라**: `frontend/src/i18n/index.js` 에 `error` namespace 등록 (+3줄, Phase 1 `SUPPORTED_LANGUAGES`/`FALLBACK_LANGUAGE`/`DEFAULT_NAMESPACE` 무수정). **locale 신설/확장**: `ko/error.json` 신설 (151 leaves, validation/api/network/business 4분류) + `ko/common.json` 확장 60→262 (+202, modal/action/state/nav) + `ko/admin.json` 확장 350→703 (+353, lnb/gnb/dashboard/widget/permission/session/user/consultant/onboarding). **합계 leaves 410 → 1,116 (+706)** — KPI K=1,500 의 **74.4%** 도달. **훅 신설**: `useConfirm.js` + `useAlert.js` (variant 4종 info/warning/danger/success, UnifiedModal 래핑 — `[triggerFn, ModalComponent]` 튜플 패턴, PR-C 선행 정의 적용) + `hooks/index.js` export 추가. **컴포넌트 치환 Top-4**: AdminDashboard.js + ConsultantComprehensiveManagement.js + AdminDashboardV2.js + AdminOnboarding.jsx (`t()` 호출 추가, useTranslation 8 파일 +). **AdminOnboarding 흡수**: `constants/adminOnboarding.js` 의 `ONBOARDING_MESSAGES` 14건 제거 + i18n 직접 호출로 전환 (P1 §5.3 권장 b 채택). **Phase 1 무수정 정합 검증** — common.json 0 라인 삭제 / i18n/index.js 0 라인 삭제 / admin.json `lnb.aiProviderManagement` 값 보존 ("AI 프로바이더 관리" 동일, 블록 재구성만). **가드 PASS** — `npm run lint:codemod-mappings` ✅ PASS (D11 가드) / 3 locale JSON valid / 7 변경 파일 ESLint 0 errors (4 warnings: useConfirm/useAlert comma-dangle 3 + i18n/index.js 기존 import 경고 1, 무해). **KPI 실측 (develop `f508d4e75` → 본 청크)**: ko leaves 410→1,116 (+706) / `t(` 호출 라인 1,012→1,094 (+82) / useTranslation 파일 275→283 (+8) / window.alert+confirm 11 → 11 (잔존, PR-C 책무) / 한국어 라인 (JS/TS) 29,898 → 29,921 (+23, locale JSON 한국어 라인 추가). **잔여 PR-A 작업 (후속 청크 권고)** — DashboardFormModal.js (181) / PermissionManagement.js (129) / Top-6~20 (14개 컴포넌트) / 트랙 A 잔여 ~6,000 라인. **단, 본 1차 청크로 인프라·locale·훅·표준 컴포넌트 (Top-4) 정착하여 후속 청크는 컴포넌트 치환 위주 분리 가능**. 산출 보고서: `docs/project-management/2026-05-26/D5_P4_P2_PR_A_REPORT.md`. 다음 단계: PR-B (트랙 B 설정/통계/보고서) 또는 P3 (현 상태 회귀 검수, KPI 부분 달성도 충분 시 P4 직진 옵션). |
| 2026-05-26-i | core-planner | **§5.8 §C11=b / §5.11 / §5.12 §C12=a 신규 항목 추가 (5차 청크 PR-M 진입 전).** 4차 청크 PR-L 정착 (운영 main `a68886273`, Frontend deploy `26423706330` success) 직후 미달 KPI 본질 원인 — `t()` 한국어 fallback 0 도달 (PR-L 완수) + ko leaves 3,824 (목표 1,500 의 **255%** ✅) 도달했으나 한국어 라인 17,730 (목표 ≤15,000 격차 +2,730) / `t()` 호출 2,984 (목표 3,000 의 99.5%) / `useTranslation` 파일 300 (목표 500 의 60%) 미달. 본질 잔여 — `hardcoded_string_literal` 6,235 라인 + `props_label_string` 2,920 라인 + `jsx_text_content` 2,536 라인 + `defaultValue` 옵션 객체 17건 + `throw new Error` 한국어 ~196 라인 + `console.log` 한국어 ~971 라인 = ~12,875 라인. 5차 청크 PR-M 흡수 합의. **§5.8 권장값 일괄 채택 11건** (C1~C7 + C9·C10 기존 + **C11=b** 신규 + **C12=a** 신규) — C11 console.log 한국어 유지·KPI 측정 제외 / C12 throw Error i18n 적용. **§5.11 / §5.12 신규** — C11·C12 질문/옵션/권장 정의. **C8=b** (사용자 추가 컨펌 요청 금지) 게이트 정책 별도 운용. **현재 KPI 기준선** (운영 main `a68886273` 시점) — 한국어 라인 (JS/TS, console.log 포함) 29,898 → 17,730 (목표 ≤15,000 미달, hardcoded literal 본질) / `t(` 호출 1,012 → **2,984** (목표 3,000 의 **99.5%** — PR-M 자연 도달) / `useTranslation` 파일 275 → **300** (목표 500 의 60%) / ko leaves 410 → **3,824** (목표 1,500 의 **255%** ✅ 도달) / **t() 한국어 fallback 2,852 → 0** ✅ (PR-L 완수) / window.alert+confirm + bare alert/confirm + notificationManager 운영 0 ✅ / 14 namespace ✅ / ESLint warning 3종 0 ✅ / lint:codemod-mappings 57/57 PASS / Production Build PASS / HIGH 회귀 0. 본 update 도 의사결정 문서 only, 코드·1~4차 청크 정착물 0줄. **다음 단계**: P0-inv-c5 (`explore`, hardcoded literal·props label·jsx text·throw Error·console.log·defaultValue 6종 정확한 인벤토리 + Top-30 + ko.json 키 정합성 + 자동 시드 정책) → P1 SKIP → PR-M Wave-1 (hardcoded literal Top-50) / Wave-2 (props label + jsx text Top-50) / Wave-3 (잔여 + throw Error i18n + defaultValue) / Wave-4 (선택 — console.log 보존 검증) → P3 (`core-tester`, `gemini-3.1-pro`) → P4 (`generalPurpose` core-deployer, develop → main fast-forward + 운영 외부 HTTPS 검증). |
| 2026-05-26-h | core-planner | **§5.8 §C9=a / §5.9 / §5.10 §C10=a 신규 항목 추가 (4차 청크 PR-L 진입 전).** 1~3차 청크 정착 (운영 main `ec273de76`, Frontend deploy `26421811625` success) 직후 미달 KPI 본질 원인 — fallback 인자 패턴 ~5,500~7,000 라인 잔존 (P0-inv-c3 §7.3 + P3 §8.2 사전 식별) — 해소 위해 4차 청크 PR-L 진입 합의. **§5.8 권장값 일괄 채택 9건** (C1~C7 기존 + C9=a + C10=a) — C9 PR-L 단독 진행 / C10 fallback 1회 일괄 제거 + 누락 키 자동 시드. **§5.9 / §5.10 신규** — C9·C10 질문/옵션/권장 정의. **C8=b** (사용자 추가 컨펌 요청 금지) 게이트 정책 별도 운용. **현재 KPI 기준선** (운영 main `ec273de76` 시점) — 한국어 라인 (JS/TS) 29,898 → 20,481 (목표 ≤15,000 미달, fallback 잔존 본질) / `t(` 호출 1,012 → 2,902 (목표 3,000 의 97% — PR-L 자연 도달) / `useTranslation` 파일 275 → 300 (목표 500 의 60% — PR-L 자연 증가) / ko leaves 410 → 3,247 (목표 1,500 의 **216%** ✅ 도달) / notificationManager 호출 25 → 0 ✅ / bare alert/confirm 운영 0 ✅ / 9 namespace (auth 신설 포함) ✅ / ESLint warning 0 ✅ / lint:codemod-mappings 57/57 PASS / Production Build PASS / HIGH 회귀 0. 본 update 도 의사결정 문서 only, 코드·Phase 1 정착물 0줄. **다음 단계**: P0-inv-c4 (`explore`, fallback 인자 패턴 정확한 인벤토리 + Top-30 + ko.json 키 정합성 + 자동 시드 정책) → P1 SKIP → PR-L Wave-1/Wave-2 (`generalPurpose` core-coder, codemod 자동화) → P3 (`core-tester`, `gemini-3.1-pro`) → P4 (`generalPurpose` core-deployer, develop → main fast-forward + 운영 외부 HTTPS 검증). |
| 2026-05-26-b | core-planner | **P1 트랙 A 디자이너 핸드오프 정착.** `generalPurpose` (core-designer 역할) 위임으로 합의서 §5.8 C5=c (트랙별 분리) 결정에 따른 **트랙 A 카피·키 명명·namespace 분할** 시안 정착. **산출**: `docs/project-management/2026-05-26/D5_P4_P1_DESIGN_HANDOFF_I18N_TRACK_A.md` (838행). **namespace 분할 (PR-A 대상 3개)** — `error` 신설 (~+190 leaves, validation/api/network/business 4분류) + `common` 확장 (~+190, UnifiedModal/action/state/nav) + `admin` 확장 (~+400, LNB/GNB/위젯/관리). 합계 ~+600 leaves (KPI K=1,500 의 40% 분담). **키 명명 prefix 카탈로그 16종** — `admin.lnb.*`/`admin.gnb.*`/`admin.dashboard.*`/`admin.widget.{name}.{purpose}`/`admin.permission.*`/`admin.session.*`/`admin.user.*`/`admin.consultant.*`/`admin.onboarding.*`/`common.modal.*`/`common.action.*`/`common.state.*`/`common.nav.*`/`error.{validation,api,network,business}.*`. **카피 시안 196 키** (Top-20 컴포넌트 + LNB/GNB + UnifiedModal + error 합산, 각 키 `{key, ko_fallback, category, source_file_hint}` 4필드). **useConfirm/useAlert 훅 표준 (PR-C 선행 정의)** — variant 4종 (info/warning/danger/success) + 기본 카피 20 키. **AdminOnboarding 흡수 정책 권장 (b)** — 상수 제거 + i18n 직접 (다국어 1:1 미러 단순화). **`admin.lnb.*` vs `layout.lnb.*` 결정**: admin 채택 (LNB가 어드민 비즈니스 메뉴이므로). 본 update 도 의사결정 문서 only, 운영 코드 0줄 수정. 다음 단계: PR-A (core-coder, i18n 인프라 + locale 신설/확장 + 컴포넌트 치환). |

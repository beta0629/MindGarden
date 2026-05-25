# D11 P0-inv 인벤토리 — Metric 재정의 + R-2 잔여 + iOS dark + B0KlA Teal + rgba 카테고리 (2026-05-26)

> **작성**: 2026-05-26 (core-planner 오케스트레이션 — main-assistant 측정 정착)
> **유형**: D11 §4 8건 컨펌 결과 (`f32a1750a`) 기반 P0-inv 인벤토리 (read-only 산출)
> **상위 합의서**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D11.md` §3 P0-inv 행 + §4 8건 컨펌
> **기준 SHA**: develop `f32a1750a` (D11 §4 컨펌 정착, 2026-05-26)
> **선행 운영 SHA**: 운영 main `e88a264a9` (D10 P3 PASS, 2026-05-23 push)
> **연계**: `reports/d11-inventory-count-metrics-20260526.json`, `reports/d11-inventory-r2-residue-20260526.json`

---

## §0 핵심 결론 (TL;DR)

1. **자연 감소 확인** — D10 정착 후 hotfix/feature 머지로 카운트 자연 감소: canonical 429 → **421** (-8), withR2 450 → **438** (-12), rawLine 1,270 → **1,257** (-13), r2Protected 21 → **17** (-4). 별도 D11 작업 없이 KPI 일부 자연 도달.
2. **D11 KPI 도달 경로**:
   - canonical ≤ 420: gap 1 (P2 신설 토큰 흡수 후 도달).
   - **r2Protected ≤ 14**: gap 3 (other non-iOS 3건 흡수 — primary-hover 2 + border-accent 1).
   - **min-coverage ≥ 95%**: **88.08% — D11 단독 미달**, D12 R-4 광역 rgba 822 흡수 통합 후 도달 가늠.
3. **신 metric `unifiedRawLine` 측정** = 2,139 (legacy 1,257 + CSS rgba 소비처 822 + JS rgba 60 + hsl/hsla/8hex 0).
4. **B0KlA palette 완성도** — green/orange/blue 5 hex 사용처 0건 (정의만), **teal `#0d9488` charts.js 1건 잔존** → P1 신설 1종 결정 필요.
5. **iOS dark HARD_EXCLUDE 정착 검증** — ios-*-dark alias **15종** 전수, ios-theme.css rgba 41 (전부 토큰 정의), R-2 폴백 7 인스턴스. D10 C8=a 정착물 무수정.
6. **R-4 (D12 이월) 사전 인벤토리** — CSS rgba 소비처 **822 라인** (D10 830 → -8). 카테고리 분류는 D12 P0-inv 단독 라운드.

---

## §1 신 metric 측정 결과 (D11 §4 C1·C2 정합)

### 1.1 legacyRawLine (D8~D10 호환 hex-only) — 측정 정착

| 항목 | 값 | D10 정착 (e88a264a9) | 변화 | 비고 |
|---|---:|---:|---:|---|
| canonical | **421** | 429 | -8 | 자연 감소 |
| withR2 | **438** | 450 | -12 | 자연 감소 |
| rawLine | **1,257** | 1,270 | -13 | 자연 감소 |
| rawLineCss | 1,247 | 1,260 | -13 | 자연 감소 |
| rawLineJs | 10 | 10 | 0 | 변화 없음 |
| r2Protected | **17** | 21 | -4 | 자연 흡수 |
| uniqueCanonicalHex | 200 | 202 | -2 | 자연 감소 |
| uniqueR2ProtectedHex | 14 | 15 | -1 | mg-v2-* 0 도달 |
| filesScanned | 1,451 | 1,442 | +9 | 신규 파일 |
| filesExcluded | 89 | 75 | +14 | HARD_EXCLUDE 누적 |

### 1.2 unifiedRawLine (D11 §4 C1=b 신 metric — hex + rgba + hsl/hsla)

| 매칭 패턴 | 라인 수 | 측정 명령 |
|---|---:|---|
| hex `#[0-9a-fA-F]{3,6}` (`legacyRawLine`) | 1,257 | `count-hardcoded-colors.js --json` |
| CSS rgba 소비처 (`unified-design-tokens.css` 제외) | **822** | `grep -rE "rgba\(" frontend/src --include="*.css" --exclude="unified-design-tokens.css" \| wc -l` |
| JS/TS rgba | **60** | `grep -rE "rgba\(" frontend/src --include="*.{js,jsx,ts,tsx}" \| wc -l` |
| CSS/JS hsl·hsla | 0 | (미래 안전성용 정규식만 추가) |
| 8자리 alpha hex `#RRGGBBAA` | 0 | (미래 안전성용 정규식만 추가) |
| **`unifiedRawLine` 합계** | **2,139** | (1,257 + 822 + 60) |

### 1.3 min-coverage (D11 §4 C2=a 신 KPI)

| 항목 | 값 | 측정 명령 |
|---|---:|---|
| `var(--mg-*)` CSS 발생량 | **14,251** | `grep -rEoh "var\(--mg-[a-zA-Z0-9_-]+" frontend/src --include="*.css" \| wc -l` |
| `var(--mg-*)` JS/TS 발생량 | **1,557** | `grep -rEoh "var\(--mg-[a-zA-Z0-9_-]+" frontend/src --include="*.{js,jsx,ts,tsx}" \| wc -l` |
| unique mg-* 토큰 사용 | 718 | `grep -rEoh "..." \| sort -u \| wc -l` |
| **var() 합계 (분자)** | **15,808** | (CSS 14,251 + JS 1,557) |
| **(분모) var() + unifiedRawLine** | **17,947** | (15,808 + 2,139) |
| **min-coverage** | **88.08%** | (15,808 / 17,947 × 100) |

> **D11 §4 C2=a KPI**: min-coverage ≥ 95% — **단독 미달** (gap -6.92%p). D11 P2 흡수 -3건 (rawLine 1,257 → 1,254) 적용 후 min-coverage ≈ 88.10% — 미세 변화. **D12 R-4 광역 rgba 822 흡수 통합** (가정: 80% 흡수 → unifiedRawLine 2,139 → 1,481, min-coverage ≈ 91.45%) 후 도달 경로 모색 필요.

### 1.4 dual-metric 출력 SSOT 권고

`count-hardcoded-colors.js` 재정의 시 `summary` 객체에 `legacyRawLine` (D8~D10 호환) + `unifiedRawLine` (신 산식) + `coverage` (var() 비율) + `metricVersion: "v2"` 동시 출력.

---

## §2 R-2 폴백 17건 정밀 분류 (D11 §4 C3=b 정합)

### 2.1 mg-* 7건 (모두 HARD_EXCLUDE 영구 보존 후보)

| token | hex | 건수 | replaceable | 권고 처리 (D11) | 합의서 §1.2.1 일치 |
|---|---|---:|:---:|---|:---:|
| `--mg-purple-light` | `#ede9fe` | 1 | ❌ | HARD_EXCLUDE 영구 보존 (Purple 패밀리 신설은 D12+ 이월) | ✅ |
| `--mg-custom-ffeaa7` | `#ffeaa7` | 1 | ❌ | HARD_EXCLUDE 보존 (PrivacyPolicy.css custom placeholder) | ✅ |
| `--mg-custom-e8f4fd` | `#e8f4fd` | 1 | ❌ | HARD_EXCLUDE 보존 (동일) | ✅ |
| `--mg-custom-bee5eb` | `#bee5eb` | 1 | ❌ | HARD_EXCLUDE 보존 (동일) | ✅ |
| `--mg-custom-0c5460` | `#0c5460` | 1 | ❌ | HARD_EXCLUDE 보존 (동일) | ✅ |
| `--mg-purple-500` | `#6f42c1` | 1 | ❌ | HARD_EXCLUDE 보존 (Bootstrap 잔재) | ✅ |
| `--mg-color-accent-main` | `#8b7355` | 1 | ❌ | HARD_EXCLUDE 보존 (brand olive-gray accent) | ✅ |

> **D11 흡수량**: **0건** (전부 HARD_EXCLUDE 영구 보존).

### 2.2 mg-v2-* 0건 (D9~D10 완전 흡수 확인)

D10 P2-a/c 정착 후 mg-v2-* R-2 보호 0건 — 완전 흡수 정착 검증.

### 2.3 other 10건 (unique 7개, **흡수 후보 3 + iOS dark 7**)

| token | hex | 건수 | 분류 | 권고 처리 (D11) | 합의서 §1.2.3 일치 |
|---|---|---:|---|---|:---:|
| `--color-primary-hover` | `#0056cc` | **2** | **신설 후보** | `--mg-color-primary-hover` 신설 (라이트 `#0056cc` / 다크 P1 결정) + R2_OTHER_ALIAS_SAFE_PAIRS 추가 | ✅ |
| `--ios-bg-secondary-dark` | `#2c2c2e` | 2 | iOS dark HARD_EXCLUDE | 영구 보존 (D10 C8=a) | ✅ |
| `--ios-border-dark` | `#38383a` | 2 | iOS dark HARD_EXCLUDE | 영구 보존 | ✅ |
| `--color-border-accent` | `#a1a1a6` | 1 | **신설 후보** | `--mg-color-border-accent` 신설 (또는 기존 `border-main` 통합 — P1 결정) | ✅ |
| `--ios-bg-tertiary-dark` | `#3a3a3c` | 1 | iOS dark HARD_EXCLUDE | 영구 보존 | ✅ |
| `--ios-border-hover-dark` | `#48484a` | 1 | iOS dark HARD_EXCLUDE | 영구 보존 | ✅ |
| `--ios-bg-primary-dark` | `#1c1c1e` | 1 | iOS dark HARD_EXCLUDE | 영구 보존 | ✅ |

> **D11 흡수 가능량**:
> - HARD_EXCLUDE 영구 보존: mg-* 7 + iOS dark 7 (=5 unique alias × 인스턴스) = **14건**
> - 신설 흡수: **other non-iOS 3건** (primary-hover 2 + border-accent 1)
> - **r2Protected 17 → 14 도달 (KPI ≤ 14 달성 가능)** ✅

### 2.4 합의서 §1.2 대비 정합

- 합의서 §1.2 가정값: mg-* 7 + mg-v2- 0 + other 14 = 21 → **실측 17** (D10 정착 후 자연 -4 흡수, primary-hover 5건이 2건으로 감소 추정).
- 합의서 §1.2.3 other 14건 가정 (primary-hover 5 + border-accent 1 + b0kla-teal 1 + iOS dark 7) → **실측 10건** (primary-hover 2 + border-accent 1 + iOS dark 7, b0kla-teal alias R-2 보호 등록 안 됨 — charts.js raw hex 잔존만).

---

## §3 CSS rgba 822 라인 카테고리 (D11 §4 C3=b → D12 이월 사전 인벤토리)

### 3.1 카운트 (D10 → D11 변화)

| 항목 | 값 | D10 정착 | 변화 |
|---|---:|---:|---:|
| CSS rgba 전체 (토큰 정의 포함) | **1,173** | 1,182 | -9 |
| 토큰 정의 (`unified-design-tokens.css`) | 351 | 352 | -1 |
| **CSS rgba 소비처 (token 정의 제외)** | **822** | 830 | -8 |
| JS/TS rgba | 60 | 60 | 0 |
| CSS/JS hsl·hsla | 0 | 0 | 0 |
| 8자리 alpha hex | 0 | 0 | 0 |

### 3.2 카테고리 분류 (D12 P0-inv 본격 산출 사전 가늠)

> **D11 §4 C3=b 결정**: R-4 광역 rgba 822 라인 분류·흡수는 D12 단독 라운드 분리. D11 P2-f 인벤토리만 사전 산출. 본 §3.2 표는 D11 합의서 §1.4 권고 카테고리 골격.

| 카테고리 | 가늠 라인 (D9 P2-f 분포 참조) | D12 진입 책무 |
|---|---:|---|
| **shadow** (`rgba(0,0,0,0.0~0.6)` 일반) | ~270 | `--mg-shadow-strong` 신설 + shadow 패밀리 일관성 (light/medium/strong α 단계) |
| **glass morphism** (`rgba(255,255,255,0.0~0.3)`) | ~50 | glass-bg-{light,medium,strong} 패밀리 SSOT (D9 PR-D 답습) |
| **overlay** (`rgba(0,0,0,0.4~0.8)`) | ~50 | `--mg-color-overlay-*` 패밀리 신설 |
| **border** (`rgba(*,*,*,0.05~0.2)`) | ~65 | `--mg-color-border-soft-rgba` 신설 또는 기존 통합 |
| **기타·도메인 rgba** | ~390 | 도메인별 분류 (admin / consultant / client / 임상 / 결제) — D12 P0-inv 단독 산출 |
| **합계** | ~825 | (실측 822 — 카테고리 가늠 합산 -3 오차) |

> **D12 P0-inv 단독 산출 시점**: D11 P4 운영 push 정착 후 사용자 컨펌 (§4 C8=b) 후 진입.

---

## §4 iOS dark HARD_EXCLUDE 정착 검증 (D11 §4 C4=a 정합)

### 4.1 ios-*-dark alias 전수 (실측 15종)

| 카테고리 | alias |
|---|---|
| bg (3종) | `--ios-bg-primary-dark`, `--ios-bg-secondary-dark`, `--ios-bg-tertiary-dark` |
| border (3종) | `--ios-border-dark`, `--ios-border-hover-dark`, `--ios-border-light-dark` |
| text (2종) | `--ios-text-primary-dark`, `--ios-text-secondary-dark` |
| color (7종) | `--ios-blue-dark`, `--ios-blue-light-dark`, `--ios-red-dark`, `--ios-red-light-dark`, `--ios-yellow-dark`, `--ios-gray-dark`, `--ios-green-dark` |

### 4.2 ios-theme.css rgba 41 라인 (전부 토큰 정의)

`frontend/src/styles/themes/ios-theme.css` 의 rgba 41 라인은 모두 토큰 정의 (`--ios-*` 우측 값). R-2 폴백 7 인스턴스 (R-2 분류 §2.3 인용) 외 광역 사용처 없음.

### 4.3 D10 C8=a 정착 검증

| 항목 | 결과 | 비고 |
|---|---|---|
| ios-*-dark alias 15종 보존 | ✅ | D10 C8=a 결정 정착 |
| ios-theme.css 토큰 정의 41 rgba | ✅ | 무수정 |
| R-2 폴백 7 인스턴스 HARD_EXCLUDE | ✅ | withR2 metric 제외 |
| `HARDCODE_GATE_METRIC.md` SSOT 신설 | ❌ (미신설, P2-d 책무) | D11 §4 C4=a 신설 책무 |

### 4.4 P2-d HARD_EXCLUDE 명시화 책무

- `docs/standards/HARDCODE_GATE_METRIC.md` 신설 — metric 정의 + HARD_EXCLUDE 토큰 14종 목록 (mg-* 7 + iOS dark 7 alias × 인스턴스) + cascade 가드 정의 통합 SSOT.
- `convert-hardcoded-colors.js` HARD_EXCLUDE 주석 강화.

---

## §5 B0KlA palette 잔여 (D11 §4 C3=b 정합)

### 5.1 B0KlA hex 사용처 검색 (5종)

| hex | 사용처 라인 수 | 토큰 정의 라인 | 권고 처리 |
|---|---:|---:|---|
| `#4b745c` (b0kla green-500) | 1 (정의만) | 1 | 완전 흡수 (P2-c B0KlA palette 5종 정착, D10 P2-c) |
| `#e6713a` (b0kla orange-500) | 0 | 1 | 완전 흡수 |
| `#509de8` (b0kla blue-500) | 0 | 1 | 완전 흡수 |
| `#509ee8` (b0kla blue-500 변형) | 0 | 0 | 사용처·정의 모두 0 (이미 정착) |
| **`#0d9488` (teal-500 후보)** | **1** | 1 (cs-teal-600) + 문서 2 | **P1 신설 후보** — `--mg-color-b0kla-teal-500` 신설 + charts.js 사용처 흡수 |

### 5.2 #0d9488 잔존 위치

```
frontend/src/constants/charts.js:64:  '#0d9488',
frontend/src/styles/unified-design-tokens.css:135:  --cs-teal-600: #0d9488;  (cs-* alias 정의, 별도 R-2 보호 아님)
frontend/src/styles/unified-design-tokens.css:1746: (문서 주석 — B0KlA palette 정착 인용)
frontend/src/styles/unified-design-tokens.css:1756: (문서 주석 — teal 신설 후보 명시)
frontend/src/styles/unified-design-tokens.css:1762: (문서 주석 — 정착 결정 인용)
```

### 5.3 P1 디자이너 핸드오프 입력

| token 후보 | 라이트 hex | 다크 hex (P1 결정 필요) | WCAG AA 검증 항목 |
|---|---|---|---|
| `--mg-color-b0kla-teal-500` | `#0d9488` (teal-600 변형) | 가늠 `#5eead4` (teal-300, P1 검증) | B0KlA teal 라이트 텍스트/배경 / 다크 텍스트/배경 양방향 AA |

---

## §6 P1 디자이너 핸드오프 입력 (신설 토큰 3종 + 검증 항목)

### 6.1 신설 토큰 후보 (D11 §4 C3=b 권장)

| token 후보 | 라이트 hex | 다크 hex (P1 결정) | 근거 | r2Protected 흡수 |
|---|---|---|---|---:|
| `--mg-color-primary-hover` | `#0056cc` | P1 결정 (가늠 `#3b82f6` primary-400) | D11 §1.2.3 #4 권고 | -2 |
| `--mg-color-border-accent` | `#a1a1a6` | P1 결정 (가늠 `#71717a` zinc-500) | D11 §1.2.3 권고 (또는 `border-main` 통합) | -1 |
| `--mg-color-b0kla-teal-500` | `#0d9488` | P1 결정 (가늠 `#5eead4` teal-300) | D11 §1.6 B0KlA palette 완성 | -1 (charts.js 흡수) |
| **합계** | | | | **-4** |

> **D11 KPI r2Protected ≤ 14 도달**: 현재 17 → -3 (신설 흡수 primary-hover 2 + border-accent 1) → **14 도달** ✅
> **B0KlA teal 추가 흡수 시**: 17 → -3 → 14, charts.js #0d9488 라인 -1 → unifiedRawLine -1.

### 6.2 WCAG AA 양방향 매트릭스 검증 항목

| 신설 토큰 | 컨텍스트 | 검증 기준 |
|---|---|---|
| `--mg-color-primary-hover` | 버튼 hover 텍스트 (white 위) | Large Text 3:1, Normal Text 4.5:1 (라이트·다크 양방향) |
| `--mg-color-border-accent` | 카드/패널 border (gray-50/dark-900 배경) | UI Component 3:1 (라이트·다크) |
| `--mg-color-b0kla-teal-500` | charts.js palette (chart bg/legend) | Non-text Contrast 3:1 (라이트·다크) |

### 6.3 P1 디자이너 추가 결정 항목

1. **`HARDCODE_GATE_METRIC.md` SSOT 신설 사양** — metric 정의 + HARD_EXCLUDE 14종 목록 + cascade 가드 정의 통합 형식.
2. **dual-metric 출력 형식** — `count-hardcoded-colors.js` JSON `summary` 객체에 `legacyRawLine` / `unifiedRawLine` / `coverage` / `metricVersion: "v2"` 동시 출력 사양.
3. **CI 가드 yml 추가 사양** — `.github/workflows/frontend-lint.yml` 에 `lint:codemod-mappings` + `count-hardcoded-colors:dry-run` 게이트 추가 사양.

---

## §7 P2 코더 PR-A/B/C/D 사전 작업량 가늠

### 7.1 D11 §4 C6=a 일괄 push 단위 (3 PR 묶음)

| PR | 책무 | 변경 대상 파일 (가늠) | 작업량 |
|---|---|---|---:|
| **PR-M** | T-M metric 재정의 + T-iOS HARD_EXCLUDE 문서 | `count-hardcoded-colors.js` 산식 확장 / `README.md` / `HARDCODE_GATE_METRIC.md` 신설 / `convert-hardcoded-colors.js` 주석 강화 | 4 파일 / ~150 라인 |
| **PR-R** | T-R2 신설 흡수 + T-B0KlA teal 신설 | `unified-design-tokens.css` (3종 신설 + 다크 cascade) / `convert-hardcoded-colors.js` (COLOR_MAPPING + R2_OTHER_ALIAS_SAFE_PAIRS) / `charts.js` (teal 흡수) | 3 파일 / ~30 라인 |
| **PR-CI** | T-R3 CI 가드 추가 | `.github/workflows/frontend-lint.yml` | 1 파일 / ~20 라인 |

### 7.2 codemod 매핑 추가 건수 (가늠)

- COLOR_MAPPING 추가: 3쌍 (primary-hover / border-accent / b0kla-teal)
- R2_OTHER_ALIAS_SAFE_PAIRS 추가: 2쌍 (--color-primary-hover → --mg-color-primary-hover / --color-border-accent → --mg-color-border-accent)
- codemodMappingCount: 136 → 가늠 139 (+3)

### 7.3 SSOT 토큰 정의 신설 건수 (가늠)

- `unified-design-tokens.css` 신설 토큰 정의: 3종 (라이트 + 다크 cascade 양방향, 총 6 라인 + 가독성 주석 ~10 라인)
- HARD_EXCLUDE 명시 주석 (P2-d): 14종 토큰 목록 (~30 라인)

---

## §8 P3 시각 회귀 검수 입력 (D11 §4 C5=c 정합)

### 8.1 D11 only 범위 (T-M 무영향 / T-R2 흡수 -3건 / T-iOS 문서 / T-B0KlA teal 1건)

| 트랙 | 영향 화면군 | 회귀 분류 |
|---|---|---|
| T-M (metric 재정의) | 코드·UI 무영향 | **None** (스크립트·문서만) |
| T-R2 신설 흡수 | `--color-primary-hover` 사용처 (`*Button*Active*` 컴포넌트 추정) + `--color-border-accent` 사용처 (카드·패널) | **Low** (-3건 광역 미세, 신설 토큰 ΔE 미세) |
| T-B0KlA teal 신설 | `charts.js` palette 1건 | **Low** (chart 단일 라인 색상 변경) |
| T-iOS HARD_EXCLUDE | 문서·가드만 (코드 동작 무변경) | **None** |
| T-R3 CI 가드 추가 | yml 1건 (런타임 무관) | **None** |

### 8.2 P3 우선 점검 화면 (작업량 최소화)

- `/admin/dashboard` (charts.js teal 사용처 가능)
- `/admin/*` 의 hover state 버튼 (primary-hover 사용처)
- `/admin/*` 카드·패널 (border-accent 사용처)
- D10 정착 회귀 0건 baseline (운영 main `e88a264a9` 답습)

---

## §9 한계·리스크

### 9.1 측정 도구 한계

- **ripgrep 미설치** — `grep -rE` (POSIX 호환) 사용. 결과 동등성은 패턴 정합으로 보장 (count-hardcoded-colors.js 측정값과 grep 측정값 정합 검증 완료).
- **hsl/hsla/8자리 hex 0건** — 미래 안전성용 정규식만 D11 P2-a 에서 사전 추가.

### 9.2 D11 단독 min-coverage 미달

- 현재 88.08%, D11 KPI 95% 미달 (gap -6.92%p).
- D11 P2 흡수 -3건 적용 후 min-coverage ≈ 88.10% (미세 변화).
- **D12 R-4 광역 rgba 822 흡수 통합 후 도달 가늠** — D11 §4 C8=b 컨펌 후 D12 진입 시 본 P0-inv 가 사전 인벤토리 입력.

### 9.3 자연 감소 출처 미확정

- D10 정착 후 hotfix/feature 머지로 -4건 자연 흡수 — 정확한 PR/SHA 식별 미수행 (인벤토리 산출 범위 외).
- **추적 가능 시점**: D11 P3 검수 단계에서 회귀 검수 시 자연 흡수 출처 git log 분석.

### 9.4 P3 회귀 범위 축소 (C5=c) 위험

- D11 only 범위로 D10 정착물 누락 위험 미세 — D10 P3 PASS (운영 main `e88a264a9`) 가 baseline 으로 정착되어 있어 합리적.
- 신설 토큰 사용처가 D10 정착 컴포넌트와 인접 시 보조 점검 권고.

### 9.5 B0KlA teal 신설 vs HOLD 결정 미확정

- charts.js #0d9488 1건은 R-2 보호 등록 안 됨 — HARD_EXCLUDE 대상도 아님.
- P1 디자이너 결정: (a) 신설 흡수 / (b) charts.js 직접 var() 변환 (기존 `--cs-teal-600` 사용) / (c) HOLD.
- 권장: (a) 신설 — B0KlA palette 완성 + r2Protected 가산 흡수.

### 9.6 D5 P4 i18n 라운드 병렬 (D11 §4 C7=a)

- 사용자 결정: D11 우선 진행, D5 P4 i18n 별도 위임 보존 (D11 정착 후 가동 대기).
- C7=a (병렬 가능) 정책 컨펌은 향후 i18n 라운드 가동 시 D11 후속 라운드와 병렬 진행 정책 결정 사전 보존.

### 9.7 .gitignore / docs 수정 잔존

- 본 위임 직전 `git stash` (uncommitted .gitignore + docs 변경) — develop 작업 후 미복원 (사용자 결정 — hotfix/lnb-sms-template-menu 브랜치 정리 불필요).

### 9.8 신 metric metricVersion 명시

- P2-a 책무: `count-hardcoded-colors.js` JSON `summary` 객체에 `metricVersion: "v2"` 명시 + 기존 호출자 호환성 (legacyRawLine 보존).

---

## §10 P1 디자이너 위임 트리거 (다음 단계)

본 P0-inv 정착 완료 후, **`core-designer` 위임 (`gemini-3.1-pro` 모델)** 즉시 개시:

### 10.1 위임 프롬프트 골격 (요약)

- 입력: 본 인벤토리 (`docs/project-management/2026-05-26/D11_P0_INVENTORY.md`) + D11 합의서 §1.2 / §1.6 / §4.
- 결정 항목: (1) 신설 토큰 3종 라이트·다크 hex 결정 + WCAG AA 양방향 매트릭스 / (2) `HARDCODE_GATE_METRIC.md` SSOT 사양 / (3) dual-metric JSON 출력 사양 / (4) CI 가드 yml 사양 / (5) B0KlA teal 신설 vs HOLD 결정.
- 산출: `docs/project-management/2026-05-26/D11_P1_DESIGN_HANDOFF.md` (hex 결정표 + WCAG AA 매트릭스 + SSOT 사양 별첨).
- 모델: `gemini-3.1-pro` (워크스페이스 룰 §1 권장).

---

## §11 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-26 | core-planner / main-assistant | D11 P0-inv 인벤토리 정착. 측정 도구: `count-hardcoded-colors.js` / `inventory-r2-fallbacks.js` / `grep -rE` (rg 미설치). 핵심 메트릭 — canonical 421 / withR2 438 / rawLine 1,257 / r2Protected 17 / unifiedRawLine 2,139 / min-coverage 88.08%. R-2 17건 정밀 분류 (mg-* 7 HARD_EXCLUDE / mg-v2-* 0 완전 흡수 / other 10건 = primary-hover 2 + border-accent 1 신설 흡수 + iOS dark 7 HARD_EXCLUDE). B0KlA teal #0d9488 charts.js 1건 잔존. iOS dark alias 15종 전수 + ios-theme.css rgba 41 라인 (전부 토큰 정의). CSS rgba 소비처 822 라인 (D12 R-4 단독 라운드 사전 입력). P1 디자이너 핸드오프 입력 신설 토큰 3종 hex + WCAG AA 매트릭스 검증 항목. **D11 KPI r2Protected ≤ 14 도달 가능 (gap 3 신설 흡수 후)**. **D11 KPI min-coverage ≥ 95% 단독 미달 (88.08%, D12 R-4 통합 후 도달 가늠)**. 본 인벤토리는 read-only 산출, 코드/codemod/토큰 SSOT 무수정 (D10 정착물 무수정). |

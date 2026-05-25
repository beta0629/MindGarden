# D11 합의서 초안 — Metric 재정의 + R-2/R-3/R-4 잔여 + iOS Dark HARD_EXCLUDE 정착 (2026 Q2)

> **작성**: 2026-05-23 (core-planner 오케스트레이션)
> **유형**: 의사결정 합의서 초안 (코드·D1~D10 SSOT 무수정, 분배 골격만 — 사용자 컨펌 8건 대기)
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md` §8 (D11 — T1-C 종결 + metric 재정의 가늠) + D10 P3 §6.3 (D11 추가 트랙 권고 4종)
> **선행 라운드**: D10 P2-a/b/c/e 정착 (운영 main `e88a264a9`, 2026-05-23 push 완료) — rawLine 1,423 → 1,270 (-153), R-2 보호 192 → 21 (-171), T-D 가드 54 PASS / 0 WARN, < 1,000 KPI **미도달** (gap 270)
> **연계**: `docs/project-management/2026-05-23/D10_P3_VISUAL_REGRESSION_REPORT.md`, `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md` §8

---

## §0 D10 정착 정합 (D11 진입 전 SSOT)

### 0.1 카운트 추이

| 라운드 | 적용 시점 (SHA) | canonical | withR2 | rawLine | r2Protected | 라운드 감축 |
|---:|---|---:|---:|---:|---:|---:|
| D7-2 PR-B | `d30b4cf9c` | 523 | 866 | 1,571 | 343 | -38 |
| D8 PR-A | `1d97d41f7` | 458 | 801 | 1,544 | 343 | -27 |
| D8 PR-B 단계 1 | `9518d040c` | 458 | 741 | 1,485 | 283 | -59 |
| D9 P2-a (R-2 v2 SAFE 14) | `ca84310f2` | 458 | 727 | 1,481 | 269 | -4 |
| D9 P2-b/c (SSOT 3 + 78건) | `3d1434664` | 457 | 649 | 1,423 | 192 | -58 |
| D9 P2-d/e (WARN4 + warning-100/800) | `de057e490` | 457 | 649 | 1,423 | 192 | 0 (정의만) |
| D9 P2-f / PR-D (Glass/Shadow rgba SSOT) | `e169c0be3` | 457 | 649 | 1,423 | 192 | 0 (rgba metric 한계) |
| **D9 P3 PASS** (D9 정착) | `04ac359a0` | **457** | **649** | **1,423** | **192** | 0 (검수만) |
| D10 P2-e (T-Inline-Magic SAFE) | `c83856589` | (생략) | (생략) | 1,418 | 192 | -5 |
| D10 P0 (인벤토리 산출) | `c1700bd4e` | — | — | — | — | 0 (read-only) |
| D10 P2-a PR-A (SSOT 11종 + codemod 광역 79건) | `ad9cb5c09 / 17c704562` | 438 | 581 | 1,338 | 143 | -80 |
| D10 P2-b PR-B (shadow-light 다크 + black α 26건) | `40cb5776f / 5a45bd806` | 438 | 581 | 1,338 | 143 | 0 (metric 한계 rgba) |
| D10 P2-c PR-C (B0KlA SSOT 6종 + R2_OTHER 142건) | `cbe19c7b2 / 63cbcc133` | 429 | 450 | 1,270 | 21 | -68 (rawLine) / -122 (r2Protected) |
| **D10 P3 PASS** (운영 정착) | **`e88a264a9`** | **429** | **450** | **1,270** | **21** | -153 누적 |
| **D11 목표 (본 합의서 초안)** | (8 단계 · 시나리오별) | **~415 ~ 429** | **~440 ~ 450** | **~ — / 신 metric N** | **~7 ~ 21** | **신 metric 재정의 + 잔여 정착** |

> **D10 정착 SHA 체인 (운영 main 도달)**: `04ac359a0` (D9 P3 PASS) → `c83856589` (P2-e) → `c1700bd4e` (P0) → `1bff963bd` (C7~C9 컨펌) → `b799decef`/`af6c5ed54` (P1 핸드오프) → `ad9cb5c09`/`17c704562` (PR-A) → `40cb5776f`/`5a45bd806` (PR-B) → `cbe19c7b2`/`63cbcc133` (PR-C) → `745f86246` (D10 P3 보고서) → `0c728921f` (V20260528_003 revert) + 알림 핫픽스 4건 → **`e88a264a9`** (운영 정착, 2026-05-23 push 완료).

### 0.2 D10 P3 PASS 운영 반영 결과 (D10 P3 §3 인용)

| 게이트 | 결과 | 비고 |
|---|---|---|
| T-D 가드 (`npm run lint:codemod-mappings`) | **54 PASS / 0 WARN / 0 ERROR / 0 alias 충돌** | `--mg-color-*` 패밀리 양방향 cascade 100% |
| 빌드 회귀 (`npm run build`) | **PASS** (기존 번들 사이즈 경고 유지, 신규 에러 없음) | — |
| 시각 회귀 (HIGH 4건 / MED 6건 / LOW 5건) | **HIGH 0 / MED 0 / LOW 0 (모두 PASS)** | mg-v2-* Tailwind 톤 시프트, black α overlay, B0KlA 광역, `#60a5fa` 다크 cascade 모두 안정 |
| WCAG AA 신설 17종 양방향 매트릭스 | **17/17 PASS** (Large Text 분기 2건 endorsed) | PR-A 11종 + PR-C 6종 |
| 운영 push (`e88a264a9`) | **완료 (2026-05-23)** | KPI < 1,000 미도달이나 PR 세트 안정 정착 |

### 0.3 rawLine < 1,000 미도달 사유 — Metric SSOT 한계 (D10 P3 §6.1 인용)

| 사유 | 진단 | D11 처리 트랙 |
|---|---|---|
| **(1) hex-only metric 구조 한계** | `count-hardcoded-colors.js` 가 `#[0-9a-fA-F]{3,6}` 만 카운트 — rgba/HSL/HSLA/8자리 alpha hex 미스캔 | **T-M (§1.1)** |
| **(2) PR-B 26건 black α SAFE 정착 metric 무영향** | rgba 흡수 26건이 rawLine 감소에 미반영 (정착 의도 그대로 정량화 불가) | **T-M (§1.1)** |
| **(3) B0KlA raw hex 사용처 위치 편향** | `#4b745c` 등 B0KlA raw hex 다수가 R-2 폴백 위치에만 존재 → withR2 -142 기여, canonical 미발견 | **T-M variable 가중치 (§1.1 C2)** |
| **(4) `--mg-shadow-light` 다크 cascade 정착 metric 무영향** | broken cascade 90+ 라인 해소 — rgba 변형이므로 metric 무영향 | **T-M (§1.1)** |
| **(5) 잔존 rgba CSS 1,182 라인** | 글로벌 인벤토리 측정시 rgba 1,182 라인은 metric SSOT 사각지대 | **T-M (§1.1)** |

> **결론**: < 1,000 KPI 자체가 hex-only metric SSOT 한계로 **의미를 잃었음**. D11 진입 핵심은 **metric 재정의 (T-M)** 가 최우선이며, 코드 무영향(스크립트만 수정)이므로 P0~P2 우선 정착 가능. metric 재정의 후 새 KPI 기준선을 수립한 다음 잔여 인벤토리(R-2 21건, R-3, R-4, iOS dark)를 단계적으로 처리한다.

### 0.4 D10 정착물 — D11 무수정 원칙

다음 산출물은 D11 라운드에서 **무수정** 으로 보존된다 (D5~D10 답습):

- `frontend/src/styles/unified-design-tokens.css` (SSOT 토큰 정의 — 54 PASS 매트릭스 보존)
- `scripts/design-system/color-management/convert-hardcoded-colors.js` (codemod 가드 + COLOR_MAPPING + RGB_MAPPING + R2_OTHER_ALIAS_SAFE_PAIRS)
- `scripts/design-system/color-management/check-token-ssot.js` (T-D 가드 1·2)
- `scripts/design-system/color-management/validate-codemod-mappings.js` (alias 충돌 검증)
- HARD_EXCLUDE 정규식 (D8~D10 답습) + R-2 보호 정규식
- `docs/project-management/2026-05-23/D10_P3_VISUAL_REGRESSION_REPORT.md` (D10 P3 검수 보고서)

> **예외**: `count-hardcoded-colors.js` 는 본 라운드 T-M 트랙 대상으로 **재정의** 한다 (산식만 변경, dual-metric 권고 §5).

---

## §1 D11 트랙 후보 (인벤토리 기반)

### 1.0 인벤토리 실측 (2026-05-23 시점)

D11 진입 전 ripgrep + 스크립트 산출 실측 수치:

| 항목 | 값 | 산출 명령 (참조) |
|---|---:|---|
| **CSS rgba(...) 라인** | **1,182** | `grep -rE "rgba\(" frontend/src --include="*.css" \| wc -l` |
| CSS rgba 발생량 (occurrence) | 1,217 | `grep -rEoh "rgba\(" frontend/src --include="*.css" \| wc -l` |
| 토큰 정의 파일 rgba (unified-design-tokens.css) | 352 | `grep -c "rgba(" frontend/src/styles/unified-design-tokens.css` |
| **소비처 rgba (non-token CSS)** | **830** | `grep -rE "rgba\(" frontend/src --include="*.css" --exclude="unified-design-tokens.css" \| wc -l` |
| **JS/TS rgba(...) 발생량** | **60** | `grep -rE "rgba\(" frontend/src --include="*.{js,jsx,ts,tsx}" \| wc -l` |
| CSS hsl(...) | **0** | `grep -rE "hsl\(" frontend/src --include="*.css" \| wc -l` |
| JS/TS hsl(...) | **0** | `grep -rE "hsl\(" frontend/src --include="*.{js,jsx,ts,tsx}" \| wc -l` |
| CSS hsla(...) | **0** | `grep -rE "hsla\(" frontend/src --include="*.css" \| wc -l` |
| JS/TS hsla(...) | **0** | (동일) |
| 8자리 alpha hex (`#RRGGBBAA`) | **0** | `grep -rE "#[0-9a-fA-F]{8}\b" frontend/src \| wc -l` |
| **`var(--mg-*)` CSS 발생량** | **14,001** | `grep -rEo "var\(--mg-[a-zA-Z0-9_-]+" frontend/src --include="*.css" \| wc -l` |
| **unique mg-* 토큰 사용** | **699** | `grep -rEohE "var\(--mg-[a-zA-Z0-9_-]+" frontend/src --include="*.css" \| sort -u \| wc -l` |
| **`var(--mg-*)` JS 발생량** | **1,573** | `grep -rEo "var\(--mg-" frontend/src --include="*.{js,jsx,ts,tsx}" \| wc -l` |
| **기존 metric (count-hardcoded-colors.js)** | canonical=429 / withR2=450 / rawLine=1,270 (CSS 1,260 + JS 10) / r2Protected=21 / unique canonical hex=202 / unique R-2 보호 hex=15 / filesScanned=1,442 / filesExcluded=75 | — |
| **R-2 인벤토리 (inventory-r2-fallbacks.js)** | totalFallbacks=21 / mgTotal=7 / mgV2Total=0 / otherTotal=14 / filesScanned=1,443 | — |

### 1.1 T-M (Metric Redefinition) — 산식 재정의 + 가중치 정책

- **배경**: §0.3 사유 (1)~(5) 통합 처리. `count-hardcoded-colors.js` hex-only 한계 해소.
- **대상 파일**: `scripts/design-system/color-management/count-hardcoded-colors.js` (산식만), `scripts/design-system/color-management/README.md` (정의 문서), `docs/standards/HARDCODE_GATE_METRIC.md` (신설 또는 D6 §8 게이트 SSOT 갱신).
- **변경 범위**:
  - (1) **rgba/hsl/hsla 토큰화** — 매칭 정규식 확장 (`rgba\([^)]+\)`, `hsl\([^)]+\)`, `hsla\([^)]+\)`). 현재 CSS rgba 1,182 / JS 60 / hsl·hsla 0 → 신 metric에 통합.
  - (2) **variable token 사용 카운트 정책** — `var(--mg-*)` 사용처는 토큰화 완료 라인이므로 **카운트 제외** (현재 14,001 라인이 metric에서 빠지면 새 baseline 정확) — C2 컨펌.
  - (3) **min-line-coverage threshold** — 토큰 정의 파일(`unified-design-tokens.css` 등 SSOT) 자동 제외 + `min-coverage = (var()/(var()+raw hex+raw rgba))` ≥ 95% 기준선 신설 — D11 KPI.
  - (4) **dual-metric 권고** — `legacyRawLine`(D8~D10 호환) + `unifiedRawLine`(rgba/hsl 통합) 동시 출력으로 추적성 보존 (§5 리스크 인용).
- **코드 무영향 트랙 — 우선 정착 가능**: metric 변경 자체는 codemod·토큰·UI 무수정. T-D 가드·P3 시각 회귀 무관.

### 1.2 T-R2-Residue — r2Protected 21건 분류 (HARD_EXCLUDE / 토큰화 / 마이그)

`inventory-r2-fallbacks.js` 실측 (2026-05-23, 운영 main `e88a264a9` 기준):

#### 1.2.1 mg-* 7건 (manual review — 모두 HARD_EXCLUDE 후보 또는 폐기 마이그)

| token | hex | 건수 | 사용처 (Top file) | D11 권고 처리 |
|---|---|---:|---|---|
| `--mg-purple-light` | `#ede9fe` | 1 | (다중 위치) | HARD_EXCLUDE 영구 보존 또는 `--mg-color-purple-50` 신설 흡수 |
| `--mg-custom-ffeaa7` | `#ffeaa7` | 1 | PrivacyPolicy.css | HARD_EXCLUDE 보존 (custom placeholder) |
| `--mg-custom-e8f4fd` | `#e8f4fd` | 1 | PrivacyPolicy.css | HARD_EXCLUDE 보존 |
| `--mg-custom-bee5eb` | `#bee5eb` | 1 | PrivacyPolicy.css | HARD_EXCLUDE 보존 |
| `--mg-custom-0c5460` | `#0c5460` | 1 | PrivacyPolicy.css | HARD_EXCLUDE 보존 |
| `--mg-purple-500` | `#6f42c1` | 1 | ModernDashboardEditor.css | HARD_EXCLUDE 보존 또는 purple 패밀리 신설 |
| `--mg-color-accent-main` | `#8b7355` | 1 | (다중 위치) | HARD_EXCLUDE 보존 (brand olive-gray accent) |

#### 1.2.2 mg-v2-* 0건 (D9~D10에서 완전 흡수)

#### 1.2.3 other 14건 (cs-*/color-*/theme-*/ios-* 등)

| token | hex | 건수 | 분류 | D11 권고 처리 |
|---|---|---:|---|---|
| `--color-primary-hover` | `#0056cc` | **5** | **신설 후보** (D10 P3 §6.3 #4) | **`--mg-color-primary-hover` 신설** + R2_OTHER_ALIAS_SAFE_PAIRS 추가 (codemod 흡수) |
| `--color-border-accent` | `#a1a1a6` | 1 | **신설 후보** | `--mg-color-border-accent` 신설 또는 기존 `border-main` 통합 (P1 디자이너 결정) |
| `--ad-b0kla-green` | `#0d9488` | 1 | **B0KlA teal 잔여** (D10 P3 §6.3 #3) | `--mg-color-b0kla-teal-500` 신설 (B0KlA palette 확장) |
| `--ios-bg-secondary-dark` | `#2c2c2e` | 2 | iOS dark HARD_EXCLUDE (D10 C8=a) | HARD_EXCLUDE 정착 검증 (T-iOS §1.5) |
| `--ios-border-dark` | `#38383a` | 2 | iOS dark HARD_EXCLUDE | 동일 |
| `--ios-bg-tertiary-dark` | `#3a3a3c` | 1 | iOS dark HARD_EXCLUDE | 동일 |
| `--ios-border-hover-dark` | `#48484a` | 1 | iOS dark HARD_EXCLUDE | 동일 |
| `--ios-bg-primary-dark` | `#1c1c1e` | 1 | iOS dark HARD_EXCLUDE | 동일 |

> **소계**:
> - HARD_EXCLUDE 영구 보존 후보: mg-* 7 + iOS dark 7 = **14건**
> - 토큰화 흡수 후보: other non-iOS 7건 (primary-hover 5 + border-accent 1 + b0kla-teal 1)
> - **D11 흡수 가능량**: **-7건** (r2Protected 21 → 14)

### 1.3 T-R3-DarkCascade-WARN-Scan — R-3 (다크 cascade WARN) 잔여 인벤토리

- **D10 정착 상태**: T-D 가드 **54 PASS / 0 WARN / 0 ERROR** (운영 main 시점, 2026-05-23 `npm run lint:codemod-mappings` 실측).
- **D11 책무**: 신규 추가 토큰·외부 모듈(임상·삼자 코드) 도입 시 양방향 cascade 회귀 방지 — **CI/BI 단계 가드 추가** 후보.
- **권고**: GitHub Actions 워크플로 `frontend-lint.yml` 에 `lint:codemod-mappings` 게이트 추가 (현재 로컬 훅만). 코드 변경 없이 워크플로 yml 1건만 수정.
- **인벤토리 신규 추가**: D11 신설 토큰(T-R2 흡수 신설 2~3종 + T-B0KlA 잔여 신설 후보 1~2종) 적용 시 양방향 cascade 정의 누락 ERROR 방지.

### 1.4 T-R4-Glass-Shadow-Overlay-Scan — R-4 (Glass/Shadow/Overlay rgba) 잔여 인벤토리

- **D9 PR-D 정착 (`e169c0be3`)**: rgba SSOT 5종 (`glass-bg-{light,medium,strong}` / `shadow-medium` / `overlay`) — 라이트·다크 cascade 정착.
- **D10 P2-b 정착 (`5a45bd806`)**: black α 1자리 SAFE 흡수 — overlay 7 + shadow-medium 19 + `--mg-shadow-light` 다크 cascade.
- **D11 잔여 (CSS rgba 1,182 라인 중 소비처 830 라인)**:
  - **shadow-strong 신설 잔여** (D10 P3 §6.3 #3 권고): `--mg-shadow-strong` 미신설. 강한 그림자 영역 (modal/drawer 깊은 그림자) rgba(0,0,0,0.4~0.6) 잔존 분류 후보.
  - **glass morphism α 단계 분기 잔여**: D9 §2.6 권고 5 SSOT 정착 후 α 변형 잔존 (D8 `_glassmorphism.css` 3 + `_glass-components.css` 4 등).
  - **shadow 패밀리 일관성**: shadow-light (`rgba(0,0,0,0.05)`) / shadow-medium (`rgba(0,0,0,0.10/0.30)`) / shadow-strong (미신설) 단계 정합.
- **사전 인벤토리 (실측)**: rgba CSS 1,182 라인 중 토큰 정의 352 라인 제외 → 소비처 **830 라인** 잔존 (glass + shadow + overlay + 도메인 rgba).
- **권고**: D11 P0-inv 에서 800+ rgba 라인 인벤토리 산출 후 (1) SAFE codemod 흡수 후보 (2) 신설 후보 (3) 도메인 보존 (4) HARD_EXCLUDE 분류.

### 1.5 T-iOS-Dark-HARD-EXCLUDE — D10 C8 결정 정착 검증

- **D10 C8=a 결정**: `--ios-*-dark` alias 6쌍 HARD_EXCLUDE 영구 보존 (다크 전용 시맨틱 의도 존중, withR2 metric 제외, D11 iOS theme 재설계 이월).
- **D11 책무**: HARD_EXCLUDE 정착 검증 + **명시적 SSOT 문서화**:
  - `--ios-bg-primary-dark` (`#1c1c1e`) / `--ios-bg-secondary-dark` (`#2c2c2e`) / `--ios-bg-tertiary-dark` (`#3a3a3c`) / `--ios-border-dark` (`#38383a`) / `--ios-border-hover-dark` (`#48484a`) → 5 토큰 / 7 fallback 인스턴스
  - 추가 iOS dark alias (`--ios-text-primary-dark` 등) 인벤토리 산출 — `frontend/src/styles/themes/ios-theme.css` (현재 rgba 41 라인) 기반 광역 검사
- **권고**: HARD_EXCLUDE 정착을 위해 `convert-hardcoded-colors.js` 에 명시 주석 + `docs/standards/HARDCODE_GATE_METRIC.md` 또는 별도 `IOS_DARK_HARD_EXCLUDE.md` SSOT 신설.

### 1.6 T-B0KlA-Residue — D10 P2-c B0KlA SSOT 6종 정착 후 잔여 (실측)

- **D10 P2-c 정착**: B0KlA palette 6종 신설 (`--mg-color-b0kla-{green,orange,blue}-500` + `b0kla-{green,orange,blue}-50` bg-soft). codemod 광역 흡수 142건 (T-CS-Theme-Other PR-C).
- **D10 P3 §6.3 #3 권고**: `--mg-color-b0kla-teal` 추가 검토 (B0KlA teal `#0d9488` 잔여 1건 — §1.2.3 인용).
- **D11 잔여 후보**:
  - `--ad-b0kla-green` + `#0d9488` (1건) — **B0KlA teal SSOT 신설** (현재 `b0kla-green-500` = `#4b745c` 와 별색)
  - admin-dashboard B0KlA 광역 사용처에서 raw hex 잔존 여부 — D11 P0-inv 시 인벤토리 정확 산출
- **권고**: B0KlA teal 1종 신설로 R-2 보호 -1 + B0KlA palette 완성도 도달 (`green-500` / `orange-300` / `blue-400` / `teal-500` 4 accent).

---

## §2 우선순위 / 산출 KPI

### 2.1 D11 종료 시점 KPI (사용자 컨펌 §4 후 확정)

| KPI | 현재 (D10 정착) | D11 목표 | 측정 도구 |
|---|---:|---|---|
| **신 metric — unifiedRawLine** | (미정 — 산식 미정의) | **< N (§4 C1 컨펌 후 확정)** | `count-hardcoded-colors.js` (T-M 재정의 후) |
| legacyRawLine (D8~D10 호환) | 1,270 | **≤ 1,270 유지** | 동일 (dual-metric) |
| canonical (hex unique) | 429 | **≤ 420 (잔여 신설 -5 ~ -10)** | 동일 |
| **r2Protected** | 21 | **≤ 14 (M ≤ 14 목표)** | `inventory-r2-fallbacks.js` |
| HARD_EXCLUDE 명시 토큰 | (X 미명시) | **X 종 명시 (§4 C4 컨펌 후 확정 — mg-* 7 + iOS dark 7 = 14종 권고)** | `HARDCODE_GATE_METRIC.md` (신설) |
| T-D 가드 WARN | 0 | **0 유지** | `npm run lint:codemod-mappings` |
| T-R3 CI 가드 추가 | 로컬 훅만 | **GitHub Actions 게이트 추가** | `frontend-lint.yml` |
| min-line-coverage (var()/(var()+raw)) | (미측정) | **≥ 95%** (T-M 신 기준) | T-M 재정의 후 산출 |

### 2.2 트랙별 우선순위

| 순위 | 트랙 | 책무 | 의존성 | 코드 영향 |
|---:|---|---|---|---|
| 1 | **T-M** | metric 재정의 + dual-metric | 없음 (스크립트만) | 무영향 (codemod·토큰·UI 무수정) |
| 2 | **T-iOS-Dark-HARD-EXCLUDE** | HARD_EXCLUDE 명시화 + SSOT 문서 | 없음 | 무영향 (가드/주석/문서) |
| 3 | **T-R2-Residue** | other non-iOS 7건 흡수 + mg-* HARD_EXCLUDE 명시 | T-M (산식) + P1 디자이너 | 신설 2~3종 + codemod 매핑 |
| 4 | **T-B0KlA-Residue** | B0KlA teal 신설 + 잔여 검사 | P1 디자이너 | 신설 1종 + codemod 매핑 |
| 5 | **T-R3** | CI 가드 추가 + 신설 cascade 검증 | T-R2/B0KlA 신설 후 | 워크플로 yml 1건 |
| 6 | **T-R4 인벤토리** | rgba 830 라인 분류 (D12 진입 사전) | T-M 후 신 metric 측정 | 없음 (인벤토리만 — §4 C3 컨펌에 따라 D12 이월) |

---

## §3 위임 흐름 (D9/D10 답습 8단계)

> **본 임무 범위 외**: 실제 위임은 사용자 컨펌(§4) 후 메인 어시스턴트가 수행. 본 표는 위임 시 사용할 골격.

| Phase | 책무 | 담당 서브에이전트 | 위임 프롬프트 골격 (요약) | 적용 스킬 | 모델 권장 |
|---|---|---|---|---|---|
| **P0-inv** | T-R2-Residue 21건 정밀 분류 + T-R4 rgba 830 인벤토리 + T-B0KlA 잔여 + T-iOS-dark 광역 검사 | `explore` | (1) `inventory-r2-fallbacks.js --json` 재실행 → r2 21건 token·hex·file 분류표 정합 검증. (2) `grep -rE "rgba\(" frontend/src --include="*.css" --exclude="unified-design-tokens.css"` 830 라인 → glass / shadow / overlay / 도메인 카테고리 분류표. (3) `themes/ios-theme.css` rgba 41 라인 + ios-* alias 전수 (token, hex, file) 산출. (4) admin-dashboard B0KlA raw hex `#4b745c`/`#e6713a`/`#509de8` 잔여 + teal `#0d9488` 사용처 인벤토리. 산출: `reports/d11-inventory-{r2,rgba830,ios-dark,b0kla}-20260524.json` + 분류 마크다운. **코드 무수정 (read-only)**. | `/core-solution-standardization` | 기본 |
| **P1** | §4 C1~C8 디자이너 컨펌 + 핸드오프 1장 | `core-designer` | (1) C1 T-M metric 산식 (hex+rgba+hsl 모두 vs hex+rgba only vs hex only). (2) C2 variable token 가중치 정책. (3) C3 T-R3/R4 인벤토리 D11 vs D12 분리. (4) C4 HARD_EXCLUDE 명시 정책 (디자인 시스템 root vs 트랙별). (5) C5 P3 시각 회귀 범위. (6) `--mg-color-primary-hover`/`border-accent`/`b0kla-teal-500` 신설 hex + WCAG AA 양방향. (7) iOS dark HARD_EXCLUDE SSOT 문서화 범위. 완료 조건: P2-a~f 핸드오프 1장 + hex 결정표 + metric 산식 PR-A 가능 형태. | `/core-solution-design-system-css`, `/core-solution-design-handoff` | **`gemini-3.1-pro`** (대시보드 디자인 변경 규약 — `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`) |
| **P2-a** | T-M metric 재정의 (산식 + dual-metric) | `core-coder` | P1 결정 적용 → `count-hardcoded-colors.js` 산식 확장 (rgba/hsl/hsla 매칭 + variable token 제외 정책 C2 결정 적용 + min-coverage threshold). dual-metric 출력 (`legacyRawLine` + `unifiedRawLine`). `README.md` + `HARDCODE_GATE_METRIC.md` 신설 (또는 D6 §8 SSOT 갱신). 완료 조건: dry-run dual-metric 출력 + D10 P3 정착물 무수정. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-b** | T-R2-Residue 흡수 (신설 2~3종 + codemod) | `core-coder` | P1 결정 hex 적용 → `--mg-color-primary-hover` / `--mg-color-border-accent`(선택) SSOT 정의 + COLOR_MAPPING 매핑 추가 + `--r2-other-alias-replace` 옵션 확장으로 7건 흡수. 완료 조건: T-D 가드 PASS + r2Protected 21 → 14. | `/core-solution-frontend`, `/core-solution-standardization` | 기본 |
| **P2-c** | T-B0KlA-Residue 흡수 (teal 신설 + 잔여 검사) | `core-coder` | P1 결정 hex 적용 → `--mg-color-b0kla-teal-500` (`#0d9488`) SSOT 정의 + COLOR_MAPPING 매핑 추가 + R2_OTHER_ALIAS_SAFE_PAIRS 1쌍 추가. P0-inv 인벤토리 기반 B0KlA raw hex 잔여 SAFE 흡수. 완료 조건: T-D 가드 PASS + r2Protected -1 + B0KlA palette 완성. | `/core-solution-frontend` | 기본 |
| **P2-d** | T-iOS-Dark-HARD-EXCLUDE 명시화 + SSOT 문서 | `core-coder` | P0 인벤토리 + P1 결정 적용 → `convert-hardcoded-colors.js` HARD_EXCLUDE 주석 강화 + `docs/standards/IOS_DARK_HARD_EXCLUDE.md` (또는 D6 §8 SSOT 통합) 신설. iOS dark 7건 r2Protected 잔존이 명시적 HARD_EXCLUDE 임을 SSOT 화. 완료 조건: 문서 PR + 가드 주석 추가, codemod 동작 무변경. | `/core-solution-standardization` | 기본 |
| **P2-e** | T-R3 CI 가드 추가 | `core-coder` | P1·P2-b·P2-c 신설 토큰 적용 후 → `.github/workflows/frontend-lint.yml` 에 `lint:codemod-mappings` 게이트 추가 + `count-hardcoded-colors.js`(신 metric) dry-run 보고 단계 추가. 완료 조건: CI yml 1건 수정 + 워크플로 PASS 검증. | `/core-solution-deployment` | 기본 |
| **P2-f** | T-R4 인벤토리 산출만 (D11 흡수 미진행, D12 이월 — C3=b 권장) | `explore` | P0-inv 분류표 + 신 metric 측정으로 rgba 830 라인 카테고리별 추가 분석 (glass / shadow / overlay / 도메인). 완료 조건: D12 진입 합의서 작성용 인벤토리 보고서 1장 (코드 무수정). | `/core-solution-standardization` | 기본 |
| **P3** | 종합 시각 회귀 검수 + 신 metric 검증 | `core-tester` | P2-a~e 적용 후 (1) §6 우선 점검 화면 UAT (범위 — C5 컨펌). (2) 신설 토큰 (`primary-hover`/`border-accent`/`b0kla-teal-500`) 라이트·다크 cascade 정합. (3) 신 metric dual-output 정합 (`legacyRawLine` ≤ 1,270 유지 + `unifiedRawLine` 신 기준선 측정). (4) T-D 가드 PASS + CI 가드 신규 통과. 완료 조건: HIGH 0건 + 신 metric SSOT 1장 + < N (C1 결정값) 진입 여부 보고. | `/core-solution-testing` | **`gemini-3.1-pro`** |
| **P4** | 운영 push (PR 분리 단위 — C6 컨펌) | `core-deployer` | (P3 PASS 후) **(a) 일괄 push** PR-M (T-M + T-iOS-HARD-EXCLUDE) + PR-R (T-R2 + T-B0KlA) + PR-CI (T-R3) 묶음 1회 또는 **(b) 단계 push** PR-M 단독 → PR-R 단독 → PR-CI 단독 분리. C6 컨펌 후 결정. count 측정 (legacy + unified dual-output) 보고. | `/core-solution-deployment` | 기본 |

> **검증 게이트 (필수)**: P2 코드 변경은 P3 `core-tester` 통과 전 P4 진행 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).
> **병렬 가능**:
> - **P0-inv** 와 **P1** 직렬 (P0 결과를 P1 디자이너가 참조).
> - P1 완료 후 **P2-a (T-M)** 와 **P2-d (T-iOS HARD_EXCLUDE 문서)** 는 P2-b/c 와 무관 → **병렬** 가능.
> - **P2-b**, **P2-c** 는 P1 hex 결정 후 직렬 (codemod 매핑 충돌 회피 — D8 PR-B 답습).
> - **P2-e (CI 가드)** 는 P2-b/c 토큰 신설 후 직렬.
> - **P2-f (R-4 인벤토리)** 는 다른 트랙과 무관 → 어느 시점에든 진행 가능 (C3=b 권장 — D12 이월 사전).

---

## §4 사용자 컨펌 필요 항목 (D11 진입 전 — 8건)

> **권장값(기본 후보)** 은 **굵게** 표시했다. 사용자가 a/b/c 옵션 중 선택 후 컨펌하면 P0-inv 위임을 개시한다.

### C1. T-M metric 산식 — rgba/hsl 포함 범위
- **질문**: `count-hardcoded-colors.js` 새 산식 매칭 정규식 범위:
  - (a) **hex + rgba + hsl/hsla 모두 통합** — 글로벌 표준화 완전 측정 (라인 수 약 +1,242 → 신 baseline 약 2,500 가늠)
  - (b) **hex + rgba only** — hsl/hsla 현재 0건이므로 향후 도입 시 자동 포함되도록 정규식만 미리 추가 (실측 동일, 미래 안전)
  - (c) **hex only 유지** — D10 동일 + dual-metric 보조 출력만 추가 (legacy 보존)
- **권장**: **(b) hex + rgba only (정규식엔 hsl/hsla 미리 포함)** — 현재 실측 0건이지만 미래 안전성 확보 + 정착물 무수정 원칙 충돌 회피.

### C2. T-M variable token 사용 카운트 정책
- **질문**: `var(--mg-*)` 사용처 14,001 라인 처리:
  - (a) **카운트 제외** (토큰화 완료 라인 = SUCCESS) — 신 baseline 정확, < N KPI 의미 회복
  - (b) **카운트 포함** (총량 측정) — 코드 변경 추적 가능하나 < N 도달 거의 불가능
  - (c) **가중치 적용** (예: var() = 0.1 / raw hex = 1.0) — D8~D10 추적성 + 신 측정 절충
- **권장**: **(a) 카운트 제외 + min-coverage threshold ≥ 95% 추가** — 토큰화 완료 라인은 metric에서 SUCCESS 처리, coverage 비율로 진척 표시.

### C3. T-R3/R4 인벤토리 D11 진행 vs D12 분리
- **질문**: R-3 (다크 cascade 신규 가드) + R-4 (rgba 830 라인 분류) 처리 범위:
  - (a) **D11 통합 처리** — 모든 인벤토리 본 라운드 정착, 코드 흡수 일부 포함
  - (b) **별도 라운드 D12 분리** — D11 은 metric 재정의 + R-2 잔여 흡수 + iOS HARD_EXCLUDE 정착에 집중, R-3/R-4 광역 분류는 D12 단독 라운드 (인벤토리 산출 P2-f 만 D11)
  - (c) **D11 인벤토리만, 흡수는 D12** — P0-inv·P2-f 만 D11 진행, 신설 토큰·codemod 매핑은 D12 이월
- **권장**: **(b) 별도 라운드 D12 분리** — D11 우선 정착 트랙은 T-M(코드 무영향) + T-R2(7건) + T-iOS(문서) + T-B0KlA(1건) 로 집중. R-4 광역 rgba 830 라인은 D12 단독 라운드 (D9 PR-D 답습 + 신 metric 기준선 측정 후 진입).

### C4. HARD_EXCLUDE 명시 정책
- **질문**: HARD_EXCLUDE 토큰 (mg-* 7 + iOS dark 5~7 = 12~14종) SSOT 위치:
  - (a) **디자인 시스템 root level SSOT** — `docs/standards/HARDCODE_GATE_METRIC.md` 단일 SSOT (D6 §8 게이트 SSOT 통합 또는 신설)
  - (b) **트랙별 분리** — `IOS_DARK_HARD_EXCLUDE.md` + `LEGACY_CUSTOM_PLACEHOLDER_HARD_EXCLUDE.md` 별도 (mg-custom-*)
  - (c) **단일 코드 SSOT** — `convert-hardcoded-colors.js` 주석 + 자동 출력만 (별도 문서 X)
- **권장**: **(a) 디자인 시스템 root level SSOT** — `HARDCODE_GATE_METRIC.md` 1장에 metric 정의 + HARD_EXCLUDE 토큰 목록 + cascade 가드 정의 통합 SSOT. 트랙별 세부는 본 합의서 §1.5 / §1.2.1 인용.

### C5. P3 시각 회귀 범위
- **질문**: P3 `core-tester` UAT 회귀 범위:
  - (a) **D8 + D9 + D10 + D11 cumulative** — 전 라운드 정착물 광역 재검증
  - (b) **D10 + D11 only** — D10 P3 PASS 기준선 + D11 신규 변경만
  - (c) **D11 only** — 신설 2~3종 토큰 + iOS HARD_EXCLUDE 문서 정착만
- **권장**: **(c) D11 only** — T-M 은 코드 무영향, T-R2/B0KlA 흡수량은 -7건 광역 영향 미세, T-iOS HARD_EXCLUDE 는 문서·가드만. P3 부담 최소화로 D11 빠른 정착.

### C6. 운영 push 일괄 vs 분할
- **질문**: D11 운영 push PR 분리 단위:
  - (a) **일괄 push** — PR-M (T-M + T-iOS HARD_EXCLUDE) + PR-R (T-R2 + T-B0KlA) + PR-CI (T-R3) 묶음 1회
  - (b) **단계 push** — PR-M → PR-R → PR-CI 분리 (각 단계 P3 PASS 후 다음 진행)
- **권장**: **(a) 일괄 push** — D11 변경 광역 영향 미세 (-7건 + metric 산식 + 문서) 라 분할 가치 작음. D10 P3 답습으로 1회 P3 검수 후 일괄 push.

### C7. D5 P4 i18n 라운드 (별도 진행 중) 와의 병렬
- **질문**: D5 P4 i18n 합의서 (별도 위임 진행 중)·D11 디자인 토큰 라운드 동시 진행 정책:
  - (a) **병렬 가능** — i18n 트랙 (T-C) 과 디자인 토큰 트랙 (T-A/T1-C) 완전 무관 → 동시 진행
  - (b) **순차 진행** — D5 P4 i18n 종료 후 D11 진입 (자원 충돌 회피)
  - (c) **트랙별 결정** — T-M/T-iOS 는 i18n 무관 즉시 진행, T-R2/B0KlA 신설 토큰은 i18n 정착 후
- **권장**: **(a) 병렬 가능** — D5/D6/D7/D8/D9/D10 라운드 모두 i18n 과 무관 진행한 답습 그대로. D11 도 i18n 트랙 무관 (디자인 토큰 SSOT vs 라벨 SSOT 분리). 다만 P4 운영 push 단계만 i18n PR 과 conflict 회피를 위해 사전 rebase 확인.

### C8. D11 종료 시점 D12 자동 진입 정책
- **질문**: D11 P4 정착 후 D12 (R-4 광역 rgba 830 라인 분류 + 디자인 시스템 자산 갱신) 진입:
  - (a) **자동 진입** — D11 P3 PASS 후 D12 P0-inv 자동 위임
  - (b) **사용자 컨펌 후 진입** — D11 운영 push 보고 + 신 metric baseline 측정 후 사용자 컨펌 후 D12 합의서 작성 (D9/D10 답습)
  - (c) **D12 미진행** — D11 정착으로 색상 트랙 종결 (잔여 rgba 830 라인은 운영 품질 트랙으로 별도 관리)
- **권장**: **(b) 사용자 컨펌 후 진입** — D9/D10 라운드 진입 동일 답습. D11 신 metric baseline 측정 후 < N KPI 결정값 도달 여부 보고 + 사용자 컨펌 후 D12 진행.

---

## §5 리스크 / 트레이드오프

### 5.1 Metric 재정의 단절 — D8/D9/D10 기존 KPI 와의 추적성

- **리스크**: T-M 산식 재정의 후 새 `unifiedRawLine` 은 D8~D10 의 `rawLine` 1,571 → 1,485 → 1,423 → 1,270 추이와 직접 비교 불가. < 1,000 KPI 자체가 의미 단절.
- **완화안**: **dual-metric 출력 권고** — `legacyRawLine` (D8~D10 호환 hex-only) + `unifiedRawLine` (신 산식) 동시 출력 + JSON `metricVersion: "v2"` 필드 추가. 운영 게이트·CI는 `legacyRawLine` 기존 추적성 유지 + `unifiedRawLine` 신 baseline 측정만 추가.
- **트레이드오프**: dual-metric 운영 부담 증가 (스크립트 출력 2배), 다만 추적성 보존 우선.

### 5.2 R-2 mg-* 7건 HARD_EXCLUDE — 디자인 시스템 비표준 영구 잔존

- **리스크**: mg-custom-* 4 (PrivacyPolicy.css), mg-purple-light/-500 2, mg-color-accent-main 1 — 모두 디자인 토큰 SSOT 외 비표준 alias 이나 사용처 광범 위치하여 폐기 마이그 비용 큼.
- **완화안**: HARD_EXCLUDE 명시 + 향후 PrivacyPolicy 마이그 시점에 일괄 폐기 (D12+ 후속 라운드). custom-* 4건은 PrivacyPolicy 다음 개편 라운드 (별도 트랙) 와 묶기.
- **트레이드오프**: r2Protected 영구 7 잔존 vs 폐기 마이그 즉시 진행 비용.

### 5.3 iOS Dark HARD_EXCLUDE — 다크 시맨틱 보존 vs 디자인 시스템 일관성

- **리스크**: `--ios-*-dark` alias 6쌍 (5~7건) 다크 전용 시맨틱 의도로 보존 — 디자인 시스템 전체 양방향 cascade 일관성 (`--mg-color-*` 패밀리 54 PASS) 과 분기.
- **완화안**: D10 C8=a 결정 답습 + 명시적 HARD_EXCLUDE SSOT 문서화 + D11 iOS theme 재설계 라운드 분리 (별도 트랙).
- **트레이드오프**: 디자인 시스템 단일 SSOT 일관성 vs iOS native dark theme 시맨틱 보존 — 후자 우선 (D10 C8 결정).

### 5.4 신설 토큰 cascade 위험 — `primary-hover` / `border-accent` / `b0kla-teal-500`

- **리스크**: 신설 2~3종 토큰의 다크 cascade hex 결정 (P1 디자이너) 미흡 시 T-D 가드 WARN → 운영 push 차단.
- **완화안**: P1 디자이너 핸드오프 시 WCAG AA 양방향 검증 필수 명시 + `--mg-color-primary-*` 패밀리 (D10 PR-A 11종 PASS 답습) 답습.
- **트레이드오프**: P1 디자이너 작업량 증가 vs T-D 가드 PASS 보장.

### 5.5 D5 P4 i18n 라운드 병렬 — develop 브랜치 충돌 가능성

- **리스크**: i18n 트랙 별도 위임 진행 중. D11 P4 운영 push 시점에 develop 브랜치 conflict 가능.
- **완화안**: §4 C7 컨펌 후 (a) 병렬 진행 시 D11 P4 직전 rebase 검증 + i18n PR 과 파일 영역 분리 명시 (i18n: `frontend/src/i18n/*.json` + 라벨 / D11: `unified-design-tokens.css`/codemod 스크립트/문서).
- **트레이드오프**: 동시 진행 속도 vs conflict 위험.

### 5.6 P3 시각 회귀 범위 축소 — D8~D10 정착물 누락 위험

- **리스크**: C5=c (D11 only) 선택 시 D10 정착물 (mg-v2-* Tailwind / B0KlA palette / black α / shadow-light cascade) 회귀 미검증.
- **완화안**: D10 P3 PASS (운영 main `e88a264a9`) 가 baseline → D11 변경 -7건 광역 미세 → D11 only 검수 합리적. 다만 신설 토큰의 사용처가 다른 D10 정착 컴포넌트와 인접한 경우만 보조 점검.
- **트레이드오프**: P3 작업량 vs 검수 안전 마진.

### 5.7 D12 자동 진입 vs 사용자 컨펌

- **리스크**: §4 C8=a (자동 진입) 선택 시 D12 합의서 누락 또는 사용자 의도 반영 누락 가능.
- **완화안**: §4 C8=b (사용자 컨펌 후 진입) 권장 — D9/D10 진입 패턴 답습. D11 신 metric baseline 측정 + 운영 push 보고 후 사용자 컨펌.

---

## §6 산출물 (합의서 정착 시)

- **본 합의서 (`DESIGN_TOKEN_GAP_2026Q2_D11.md`)** — 사용자 컨펌 §4 8건 확정 후 §7 변경 이력 갱신, P0-inv 위임 트리거.
- **P0-inv 산출물 (`explore` 위임 후)**: `reports/d11-inventory-{r2,rgba830,ios-dark,b0kla}-20260524.json` + 분류 마크다운.
- **P1 핸드오프 산출물 (`core-designer` 위임 후)**: `docs/project-management/2026-05-24/D11_P1_DESIGN_HANDOFF.md` (산식 + hex 결정표 + WCAG AA 매트릭스).
- **P2 코드 변경 산출물 (`core-coder` 위임 후)**: `count-hardcoded-colors.js` 재정의 + 신설 토큰 정의 + codemod 매핑 추가 + CI 워크플로 yml.
- **P3 검수 산출물 (`core-tester` 위임 후)**: `docs/project-management/2026-05-25/D11_P3_VISUAL_REGRESSION_REPORT.md` + dual-metric 측정값.
- **P4 운영 push 결과**: develop → main rebase + GitHub Actions 배포 PASS + 운영 게이트 dual-metric 보고 + D12 합의서 작성 트리거 (§4 C8=b 권장).

> **권고**: 합의서 §4 8건 사용자 컨펌 확정 직후, 메인 어시스턴트가 P0-inv (`explore`) 위임을 즉시 개시한다 (D10 P0 인벤토리 정착 패턴 답습, `c1700bd4e` 참조).

---

## §7 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-planner | D11 합의서 초안 작성. 6 트랙(T-M / T-R2-Residue / T-R3-DarkCascade-Scan / T-R4-Glass-Shadow-Overlay-Scan / T-iOS-Dark-HARD-EXCLUDE / T-B0KlA-Residue) 통합. metric 재정의 (rgba/hsl 포함 + variable token 정책 + min-coverage threshold + dual-metric 권고) + R-2 잔여 21건 분류 (mg-* 7 HARD_EXCLUDE + other 14건 중 iOS dark 7 HARD_EXCLUDE / non-iOS 7건 흡수) + iOS dark HARD_EXCLUDE 명시화 + B0KlA teal 신설 1종 + R-3 CI 가드 추가 + R-4 인벤토리 D12 이월 권고. **인벤토리 실측 (2026-05-23)**: CSS rgba 1,182 라인 / JS rgba 60 / hsl·hsla·8자리 hex 0 / var(--mg-*) CSS 14,001·JS 1,573 / unique mg-* 토큰 사용 699 / canonical 429 / withR2 450 / rawLine 1,270 / r2Protected 21 (mg-* 7 + other 14). **D10 정착 SHA**: 운영 main `e88a264a9` (2026-05-23 push 완료). 사용자 컨펌 8건(§4) 대기. 본 합의서는 의사결정 골격만, 코드 직접 수정 0줄. **이후 P0-inv 위임은 §4 컨펌 확정 후 메인 어시스턴트가 개시**. |
| 2026-05-26 | main-assistant | **§4 사용자 컨펌 8건 확정 — 권장값 일괄 채택 (무중단 자동 모드, D11 우선 진행)**. **C1=b** (T-M metric 산식 — `count-hardcoded-colors.js` 정규식 `#[0-9a-fA-F]{3,6}` + `rgba\([^)]+\)` + `hsl\([^)]+\)` + `hsla\([^)]+\)` 확장, 실측 hsl/hsla 0건이나 미래 안전성 확보. CSS rgba 1,182 + JS rgba 60 통합 측정). **C2=a** (variable token 카운트 정책 — `var(--mg-*)` 14,001 CSS + 1,573 JS 발생량은 토큰화 완료 SUCCESS 로 metric 제외 + `min-coverage = (var()/(var()+raw hex+raw rgba)) ≥ 95%` 신 KPI 신설). **C3=b** (T-R3/R-4 처리 범위 — D11 은 T-M + T-R2-Residue 7건 + T-iOS HARD_EXCLUDE 문서·가드 + T-B0KlA teal 1종 신설 집중, R-3 CI 가드 yml 1건 추가, **R-4 광역 rgba 830 라인 분류·흡수는 D12 단독 라운드 분리** — D11 P2-f 인벤토리만 사전 산출). **C4=a** (HARD_EXCLUDE 명시 정책 — `docs/standards/HARDCODE_GATE_METRIC.md` 신설 단일 SSOT 에 metric 정의 + HARD_EXCLUDE 토큰 14종 목록 (mg-* 7 + iOS dark 7) + cascade 가드 정의 통합). **C5=c** (P3 시각 회귀 범위 — D11 only 검수, T-M 코드 무영향 + T-R2/B0KlA 흡수 -7건 광역 미세 + T-iOS HARD_EXCLUDE 문서·가드만으로 P3 부담 최소화). **C6=a** (운영 push 일괄 — PR-M (T-M + T-iOS HARD_EXCLUDE 문서) + PR-R (T-R2 + T-B0KlA 신설·흡수) + PR-CI (T-R3 워크플로 yml) 묶음 1회). **C7=a** (D5 P4 i18n 라운드와 병렬 가능 — 트랙 영역 무관 라벨 SSOT vs 디자인 토큰 SSOT 분리, 단 본 라운드 사용자 결정상 D11 우선 진행으로 D5 P4 i18n Phase 2 합의서는 별도 위임 보존 + D11 정착 후 가동 대기). **C8=b** (D11 P4 운영 push 정착 후 D12 진입은 사용자 컨펌 후, D9/D10 답습 패턴). 본 컨펌 확정 직후 P0-inv (`explore`) 위임 즉시 개시. **이전 D10 §9 마지막 행 C7=a 는 D10 P0 후속 B0KlA palette 5종 신설 결정 컨펌으로 본 D11 §4 C7=a (i18n 병렬 정책 컨펌) 와 의미가 다름** — 혼동 회피 위해 본 행에 명시. |


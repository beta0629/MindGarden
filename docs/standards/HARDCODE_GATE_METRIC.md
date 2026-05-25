# HARDCODE_GATE_METRIC — 디자인 시스템 하드코딩 검증 단일 SSOT

> **유형**: 디자인 시스템 root-level 표준 (SSOT)
> **신설**: 2026-05-26 (D11 P2-M, `core-coder` 산출)
> **컨펌 출처**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D11.md` §4 C4=a (디자인 시스템 root level SSOT 단일화 결정)
> **상위 합의**: D11 §1.1 (T-M Metric Redefinition) + D11 P1 §2 (HARDCODE_GATE_METRIC.md SSOT outline)
> **인벤토리 입력**: `docs/project-management/2026-05-26/D11_P0_INVENTORY.md` §1 신 metric 측정 + §2 R-2 잔여 + §4 iOS dark
> **D10 정착 SHA**: 운영 main `e88a264a9` (D10 P3 PASS — 54 PASS / 0 WARN / 0 ERROR / 0 alias 충돌)

---

## §1 목적 및 개요

본 문서는 MindGarden Core Solution 디자인 시스템에서 **하드코딩된 색상값을 측정·검증·게이트하기 위한 단일
SSOT (Single Source of Truth)** 다.

### 1.1 SSOT 범위

| 영역 | 단일 SSOT | 위반 시 영향 |
|---|---|---|
| **Metric 정의** (legacyRawLine / unifiedRawLine / coverage / r2Protected / canonical / withR2) | 본 문서 §2 | metric 정의 불일치 → 운영 게이트 판정 오류 |
| **HARD_EXCLUDE 토큰 목록** (mg-* 7 + iOS dark 7 = 14종) | 본 문서 §3 | HARD_EXCLUDE 누락 → codemod 회귀 사고 (T1 2차 §6.2 재발) |
| **Cascade 가드 정의** (T-D 가드 54 PASS 매트릭스 보존 원칙) | 본 문서 §4 | 다크 cascade 누락 → 다크 모드 표시 깨짐 |
| **측정 도구 사용법** (count-hardcoded-colors.js + inventory-r2-fallbacks.js) | 본 문서 §5 | 도구 호출 불일치 → 측정값 추적성 단절 |

### 1.2 본 문서와 다른 표준의 관계

- **`docs/standards/DESIGN_TOKEN_GAP_2026Q2_D6.md` §8** (운영 게이트 시나리오) — 본 문서는 D6 §8 게이트 판정 metric 의 산식·계산식·HARD_EXCLUDE 를 통합 정의. D6 §8 시나리오는 본 문서를 인용.
- **`docs/standards/DESIGN_TOKEN_GAP_2026Q2_D11.md` §1.1** (T-M Metric Redefinition) — 본 문서는 D11 §1.1 합의 (dual-metric / variable token 정책 / min-coverage threshold) 을 SSOT 화.
- **`scripts/design-system/color-management/README.md`** — 본 문서의 스크립트 사용자용 요약. 변경 시 본 문서 우선 갱신 → README 반영.
- **`scripts/design-system/color-management/convert-hardcoded-colors.js`** — codemod HARD_EXCLUDE 정규식 + HARD_EXCLUDE_TOKENS_PRESERVED 주석은 본 문서 §3 토큰 목록과 동기화 필수.

### 1.3 metricVersion 정책

- `count-hardcoded-colors.js` 의 JSON `summary.metricVersion` 필드로 SSOT 버전 식별:
  - `v1` (legacy) — D7-2 ~ D10 3-metric (canonical / withR2 / rawLine).
  - **`v2` (현재)** — D11 P2-M dual-metric (legacy 계열 + unified 계열 + details + varCount + coverage).
- 본 문서의 §2 / §3 / §4 가 변경되면 metricVersion 을 승격하고 변경 이력(§6)에 반영.

---

## §2 Metric 정의 — Dual-metric SSOT (v2)

### 2.1 Legacy 계열 (D8~D10 호환 — 추적성 보존)

| metric | 정의 | 산정 방식 | KPI / 용도 |
|---|---|---|---|
| **canonical** | codemod 적용 후 잔존 hex 카운트 | (1) HARD_EXCLUDE 적용 → (2) `convert-hardcoded-colors.js` `COLOR_MAPPING` + `RGB_MAPPING` 시뮬레이션 → (3) `var(--token, #hex)` R-2 폴백 마스킹 → (4) 잔존 hex (3·4·6·8 자리) 카운트 | **D6 §8 운영 게이트 판정 metric (단일 SSOT)** |
| **withR2** | `canonical + r2Protected` | 합산 | R-2 보호 미정착 토큰 처리 진행도 |
| **legacyRawLine** (alias `rawLine`) | CI/BI grep 라인 카운트 호환 | CSS: `#[0-9a-fA-F]{3,6}` 매칭 라인 (`#fff\|#ffffff\|#000\|#000000` 라인 제외) + JS: `color.*['"]#hex['"]` 매칭 라인 | CI/BI 호환 평가 (±2%), D8~D10 추세 |
| **rawLineCss** / **rawLineJs** | legacyRawLine 영역 분리 | — | 영역별 분포 |
| **r2Protected** | R-2 폴백 (`var(--token, #hex)`) 보호 hex 카운트 | HARD_EXCLUDE 적용 + `VAR_FALLBACK_HEX_PATTERN` 매칭 | R-2 잔여 추적 |
| **uniqueCanonicalHex** / **uniqueR2ProtectedHex** | canonical / r2Protected 의 unique hex 개수 | Map 크기 | 분포 다양성 |

### 2.2 Unified 계열 (D11 §1.1 신 산식 — KPI 신 baseline)

| metric | 정의 | 산정 방식 | KPI / 용도 |
|---|---|---|---|
| **unifiedRawLine** | `legacyRawLine + rgba(CSS+JS) + hsl/hsla + 8자리 alpha hex` 통합 라인 카운트 | 각 매칭 정규식별 라인 카운트 합산 (아래 §2.4 매칭 정규식). HARD_EXCLUDE: `unified-design-tokens.css` rgba 정의 자동 제외 (P0-inv §1.2 정합). | D11 KPI 신 baseline |
| **varCount** | `var(--mg-[a-zA-Z0-9_-]+)` 발생량 (occurrence, CSS+JS 합산) | `grep -rEoh "var\(--mg-[a-zA-Z0-9_-]+" frontend/src \| wc -l` 와 동일 동작 | coverage 분자, 토큰화 진척도 |
| **coverage** | `varCount / (varCount + unifiedRawLine) × 100` (백분율 문자열, 소수 둘째 자리) | (분자) varCount / (분모) varCount + unifiedRawLine | **D11 §4 C2=a 신 KPI (목표 ≥ 95%)** |
| **details.hexOnly** | `legacyRawLine` 동일값 | (alias) | unifiedRawLine 구성 |
| **details.rgbaCss** | CSS `rgba\([^)]+\)` 매칭 라인 (token 정의 파일 제외) | 라인 단위 카운트 | 동일 |
| **details.rgbaJs** | JS/TS `rgba\([^)]+\)` 매칭 라인 | 라인 단위 카운트 | 동일 |
| **details.hslAll** | CSS+JS `hsla?\([^)]+\)` 매칭 라인 | 라인 단위 카운트 | 미래 안전성 (현재 0건) |
| **details.alphaHex8** | CSS+JS `#[0-9a-fA-F]{8}\b` 매칭 라인 | 라인 단위 카운트 | 미래 안전성 (현재 0건) |

### 2.3 KPI 매트릭스 (D11 §2.1)

| KPI | 현재 (D11 P0-inv) | D11 목표 | D12 이후 |
|---|---:|---|---|
| `canonical` (단일 SSOT 게이트) | 421 | ≤ 420 | < 200 (D12 광역 흡수) |
| `legacyRawLine` (CI/BI 호환) | 1,257 | ≤ 1,270 유지 | < 1,000 (D12 R-4 흡수 후) |
| `r2Protected` | 17 | ≤ 14 (P1 신설 토큰 흡수 후) | ≤ 14 (mg-* 7 + iOS dark 7 영구 보존) |
| **`coverage` (D11 신 KPI)** | **88.08%** | ≥ 95% (D12 R-4 통합 후) | ≥ 95% 유지 |
| `unifiedRawLine` (신 baseline) | 2,139 | (P0-inv §1.2 baseline 기록) | D12 신 baseline 측정 |
| T-D 가드 PASS | 54 PASS / 0 WARN | 0 WARN 유지 | 0 WARN 유지 + 신설 cascade 추가 |

### 2.4 매칭 정규식 (`count-hardcoded-colors.js` SSOT)

| 정규식 상수 | 패턴 | 용도 |
|---|---|---|
| `RAW_CSS_HEX_PATTERN` | `/#[0-9a-fA-F]{3,6}/` | legacyRawLine CSS 매칭 |
| `RAW_CSS_EXCLUDE_PATTERN` | `/#fff\|#ffffff\|#000\|#000000/i` | CSS 화이트·블랙 4종 제외 |
| `RAW_JS_COLOR_PATTERN` | `/color.*['"]#[0-9a-fA-F]{3,6}['"]/i` | legacyRawLine JS 매칭 |
| **`RAW_RGBA_PATTERN`** | `/rgba\([^)]+\)/i` | unifiedRawLine rgba 매칭 (D11 신설) |
| **`RAW_HSL_PATTERN`** | `/hsla?\([^)]+\)/i` | unifiedRawLine hsl/hsla (D11 신설, 현재 0건) |
| **`RAW_HEX8_PATTERN`** | `/#[0-9a-fA-F]{8}\b/i` | unifiedRawLine 8자리 alpha hex (D11 신설, 현재 0건) |
| **`VAR_MG_TOKEN_PATTERN`** | `/var\(--mg-[a-zA-Z0-9_-]+/g` | varCount 발생량 (D11 신설) |
| **`UNIFIED_RAW_HARD_EXCLUDE_PATTERNS`** | `[/\bfrontend\/src\/styles\/unified-design-tokens\.css$/]` | unifiedRawLine 토큰 정의 파일 제외 (D11 신설) |
| `VAR_FALLBACK_HEX_PATTERN` | `/var\s*\(\s*--[\w-]+\s*,\s*#[0-9a-fA-F]{3,8}(?![0-9a-fA-F])\s*\)/g` | R-2 폴백 보호 (canonical 차감 + r2Protected 집계) |
| `RESIDUAL_HEX_PATTERN` | `/#[0-9a-fA-F]+(?![0-9a-fA-F])/g` | canonical 잔존 hex 카운트 |

### 2.5 var(--mg-*) 카운트 제외 정책 (D11 §4 C2=a)

- **legacyRawLine** 은 var(--mg-*) 라인 포함 (D8~D10 동작 유지, 추적성 보존).
- **unifiedRawLine** 은 var(--mg-*) 만 있는 라인을 **자연 제외** — raw 매치 (hex/rgba/hsl/8hex) 가 없으면 카운트되지 않음 (토큰화 SUCCESS 라인).
- 같은 라인에 `var(--mg-*)` + raw hex/rgba 가 함께 있으면 (예: R-2 폴백) raw 부분이 매칭되므로 라인 카운트됨 (raw 우선 정책).
- **varCount** 는 occurrence 기준 (한 라인에 여러 var(--mg-*) 있어도 모두 카운트).
- **token 정의 파일**: `unified-design-tokens.css` 의 rgba 라인은 `UNIFIED_RAW_HARD_EXCLUDE_PATTERNS` 로 unifiedRawLine 자동 제외 (P0-inv §1.2 grep `--exclude=unified-design-tokens.css` 정합 — 351 rgba 정의 라인 보호).

---

## §3 HARD_EXCLUDE 토큰 14종 — 영구 보존 SSOT (D11 §4 C4=a)

본 14종 토큰은 디자인 시스템 SSOT 외 비표준 alias 또는 다크 전용 시맨틱이며, 사용처 마이그레이션 비용·시맨틱 손실 위험으로
**`convert-hardcoded-colors.js` 의 어떤 매핑 경로**(COLOR_MAPPING / RGB_MAPPING / R2_OTHER_ALIAS_SAFE_PAIRS) **에도
등록하지 않음으로써 영구 보존**한다. 후속 마이그레이션은 별도 라운드 (PrivacyPolicy 개편 / iOS theme 재설계) 에서 일괄 처리.

### 3.1 mg-* 레거시·커스텀 7종 (D11 §1.2.1 / P0-inv §2.1)

| 토큰 | hex | 사용처 (대표) | 분류 | 영구 보존 사유 |
|---|---|---|---|---|
| `--mg-purple-light` | `#ede9fe` | (다중 위치) | purple 레거시 | purple 패밀리 신설 미정착 (D12+ 이월) |
| `--mg-custom-ffeaa7` | `#ffeaa7` | `PrivacyPolicy.css` | custom placeholder | PrivacyPolicy 개편 라운드 분리 |
| `--mg-custom-e8f4fd` | `#e8f4fd` | `PrivacyPolicy.css` | custom placeholder | 동일 |
| `--mg-custom-bee5eb` | `#bee5eb` | `PrivacyPolicy.css` | custom placeholder | 동일 |
| `--mg-custom-0c5460` | `#0c5460` | `AppToast.css` / `PrivacyPolicy.css` | custom placeholder | 동일 |
| `--mg-purple-500` | `#6f42c1` | `ModernDashboardEditor.css` | Bootstrap purple 잔재 | purple 패밀리 신설 미정착 |
| `--mg-color-accent-main` | `#8b7355` | (다중 위치) | brand olive-gray accent | brand-specific custom token |

### 3.2 iOS dark 7종 — 다크 전용 시맨틱 (D10 C8=a 결정, P0-inv §4.1)

iOS native dark theme 시맨틱 보존 — 디자인 시스템 라이트·다크 cascade 일관성과 분기하여 다크 전용으로 영구 보존.
D11 iOS theme 재설계 라운드 (별도 트랙) 에서 일괄 재검토.

| 토큰 | hex (다크) | 카테고리 | 영구 보존 사유 |
|---|---|---|---|
| `--ios-bg-primary-dark` | `#1c1c1e` | bg | iOS 13+ system background |
| `--ios-bg-secondary-dark` | `#2c2c2e` | bg | iOS 13+ secondary system background |
| `--ios-bg-tertiary-dark` | `#3a3a3c` | bg | iOS 13+ tertiary system background |
| `--ios-border-dark` | `#38383a` | border | iOS 13+ separator dark |
| `--ios-border-hover-dark` | `#48484a` | border | iOS 13+ separator hover dark |
| `--ios-text-primary-dark` | (ios-theme.css 정의) | text | iOS 13+ label primary dark |
| `--ios-text-secondary-dark` | (ios-theme.css 정의) | text | iOS 13+ label secondary dark |

> **참고 (P0-inv §4.1)**: `frontend/src/styles/themes/ios-theme.css` 에는 위 7종 외 ios-*-dark alias 총 **15종** 존재 (border-light, color 7종 — blue/red/yellow/gray/green/blue-light/red-light). 본 §3.2 의 7종은 R-2 폴백 보호로 r2Protected 에 잡히는 핵심 alias 셋. 나머지 8종은 ios-theme.css 토큰 정의 라인에만 존재 (소비처 0) — D11 iOS theme 재설계 라운드에서 통합 검토.

### 3.3 SSOT 동기화 규칙

- **`convert-hardcoded-colors.js`** 의 `HARD_EXCLUDE_TOKENS_PRESERVED` 주석 (파일 상단) ↔ 본 §3.1 / §3.2 항상 동기화.
- **`count-hardcoded-colors.js`** 의 `HARD_EXCLUDE_PATTERNS` (파일 패턴) ↔ codemod 의 `HARD_EXCLUDE` 정규식 동기화.
- **`scripts/design-system/color-management/inventory-r2-fallbacks.js`** 의 `HARD_EXCLUDE_PATTERNS` ↔ count 스크립트와 동일 패턴 차용.
- 14종 토큰 추가/삭제/hex 변경 시 본 문서 §3 + codemod 주석 + 변경 이력(§6) 동시 갱신 필수.

### 3.4 토큰 정의 파일 HARD_EXCLUDE (codemod 파일 단위 보호)

본 §3 토큰 14종과는 별개로, **토큰 정의 파일**은 codemod 의 처리 대상에서 제외된다 (T1 2차 §6.2 회귀 사고 재발 방지).
`unified-design-tokens.css` / `dashboard-tokens-extension.css` / `responsive-layout-tokens.css` 등 정의 파일에서
codemod 가 토큰 자체를 휩쓸어 순환 참조 (`--mg-white: var(--mg-white)`) 를 만든 사례 재발 방지 목적.

| 카테고리 | 패턴 / 파일 | 보호 책무 |
|---|---|---|
| 명시적 토큰 정의 파일 (8종) | `unified-design-tokens.css` / `dashboard-tokens-extension.css` / `responsive-layout-tokens.css` / `mindgarden-design-system.css` / `00-core/_variables.css` / `00-core/_component-variables.css` / `common/variables.css` / `constants/css-variables.js` | codemod 직접 제외 + count canonical 제외 |
| 일반 패턴 (자동 보호) | `*tokens*.css` / `*variables*.css` / `*design-system*.css` | codemod 직접 제외 + count canonical 제외 |
| 디렉터리 단위 보호 | `tokens/` / `themes/` | codemod 직접 제외 + count canonical 제외 |
| 테스트·스토리북 | `*.test.*` / `*.spec.*` / `*.stories.*` / `__tests__/` | codemod 직접 제외 + count canonical 제외 |
| unifiedRawLine rgba HARD_EXCLUDE | `unified-design-tokens.css` (rgba 정의 보호) | unifiedRawLine 만 별도 제외 (P0-inv §1.2 정합) |

---

## §4 Cascade 가드 정의 — T-D 가드 54 PASS 매트릭스 보존 원칙

### 4.1 T-D 가드 핵심 원칙

- **`--mg-color-*` 패밀리는 라이트·다크 양방향 cascade 100% 정의 필수**. 한쪽 누락 시 다크 모드 표시 깨짐.
- D10 P3 PASS 운영 main `e88a264a9` 기준: **54 PASS / 0 WARN / 0 ERROR / 0 alias 충돌**. 본 매트릭스는 D11 라운드에서도 무수정 보존 (D11 §0.4).
- 신규 토큰 추가 시 본 매트릭스에 라이트·다크 hex 양쪽 정의 필수 + `npm run lint:codemod-mappings` PASS 검증.

### 4.2 게이트 실행 명령 (필수 통과)

```bash
# 1) 일상 — 루트 (D5 명세 호환 wrapper)
npm run lint:codemod-mappings

# 2) 운영 게이트 직전 — strict (다크 미정의도 ERROR 로 승격)
npm run lint:codemod-mappings:strict

# 3) 직접 — 옵션 노출
node scripts/design-system/color-management/validate-codemod-mappings.js \
  [--strict] [--quiet] [--allow-duplicate-alias] [--token-priority a,b,c] \
  [--mapping <path>] [--ssot <path>] [--json]
```

### 4.3 운영 push 게이트 매트릭스

| 게이트 | 통과 기준 | 측정 도구 |
|---|---|---|
| **T-D 가드 PASS** | 54 PASS / 0 WARN / 0 ERROR / 0 alias 충돌 (D10 P3 baseline) | `npm run lint:codemod-mappings` |
| **`--mg-color-*` 패밀리 양방향 cascade 100%** | 라이트·다크 hex 양쪽 정의 — alias chain 깊이 ≤ 5 / cycle 0 | 동일 |
| **canonical 운영 게이트 (D6 §8)** | 신규 추가량 ≤ 기존 baseline (D11 P0-inv 후 ≤ 421) | `count-hardcoded-colors.js --json` (`summary.canonical`) |
| **coverage 신 KPI (D11)** | ≥ 95% (D12 R-4 통합 후 목표) | `count-hardcoded-colors.js --json` (`summary.coverage`) |
| **r2Protected** | ≤ 14 (HARD_EXCLUDE 14종 영구 보존만 잔존) | `count-hardcoded-colors.js --json` + `inventory-r2-fallbacks.js --json` |
| **codemod 진입 자동 가드** | `convert-hardcoded-colors.js` 진입 시 T-D 가드 자동 실행 — 실패 시 abort | `validate-codemod-mappings.js` (자동) |

### 4.4 신규 토큰 추가 시 cascade 가드 체크리스트

신설 `--mg-color-*` 토큰 추가 시:

1. `unified-design-tokens.css` 라이트 정의 + 다크 cascade `[data-theme="dark"]` 블록 양방향 hex 정의.
2. `convert-hardcoded-colors.js` `COLOR_MAPPING` 또는 `R2_OTHER_ALIAS_SAFE_PAIRS` 매핑 추가 (P1 디자이너 결정 hex 적용).
3. `npm run lint:codemod-mappings` PASS 검증 (라이트 정의 누락 ERROR / 다크 정의 누락 WARN(--strict 시 ERROR) / alias chain 깊이 ≤ 5 / alias 충돌 0).
4. `count-hardcoded-colors.js --json` dry-run 측정 — canonical 변화 가늠 + r2Protected 흡수량 확인.
5. WCAG AA 검증 (Large Text 3:1 / Normal Text 4.5:1 / UI Component 3:1) — D11 P1 핸드오프 답습.
6. P3 시각 회귀 (`core-tester`) 게이트 통과 후 운영 push.

### 4.5 가드 실패 시 우회 금지 원칙

- `--skip-validation` 옵션은 긴급 상황 (운영 hotfix) 에서만 사용 — 5초 경고 후 진행.
- 정상 PR 흐름에서는 가드 통과 필수. `--skip-validation` 사용 시 PR description 에 사유 명시.

---

## §5 측정 도구 — 사용법 SSOT

### 5.1 `count-hardcoded-colors.js` — Dual-metric 측정

```bash
# 사람 친화 표 + JSON 요약 (기본)
node scripts/design-system/color-management/count-hardcoded-colors.js

# JSON 만 (스크립트·CI 호출용)
node scripts/design-system/color-management/count-hardcoded-colors.js --json

# 리포트 자동 저장 (reports/count-YYYYMMDD-HHmm.json)
node scripts/design-system/color-management/count-hardcoded-colors.js --report

# 상위 50개 hex + 파일별 분포
node scripts/design-system/color-management/count-hardcoded-colors.js --top 50 --detail

# 프론트엔드 alias
cd frontend && npm run count:hardcoded-colors
cd frontend && npm run count:hardcoded-colors:report
```

**출력 JSON `summary` 스키마 (v2)**:

```json
{
  "metricVersion": "v2",
  "canonical": 421,
  "withR2": 438,
  "legacyRawLine": 1257,
  "rawLine": 1257,
  "rawLineCss": 1247,
  "rawLineJs": 10,
  "r2Protected": 17,
  "unifiedRawLine": 2139,
  "coverage": "88.08%",
  "varCount": 15808,
  "details": {
    "hexOnly": 1257,
    "rgbaCss": 822,
    "rgbaJs": 60,
    "hslAll": 0,
    "alphaHex8": 0
  },
  "filesScanned": 1451,
  "filesExcluded": 89,
  "uniqueCanonicalHex": 200,
  "uniqueR2ProtectedHex": 14
}
```

### 5.2 `inventory-r2-fallbacks.js` — R-2 폴백 인벤토리

```bash
# JSON 출력 (스크립트·CI 호출용)
node scripts/design-system/color-management/inventory-r2-fallbacks.js --json

# 상위 N개 + 리포트 저장
node scripts/design-system/color-management/inventory-r2-fallbacks.js --top 50 --report
```

**용도**: R-2 폴백 (`var(--token, #hex)`) 패턴을 mg-* / mg-v2-* / other 그룹으로 분류, auto-replaceable 여부 판정.
D11 KPI `r2Protected ≤ 14` 도달 진행도 추적.

### 5.3 `validate-codemod-mappings.js` — T-D 가드

```bash
npm run lint:codemod-mappings           # 일상
npm run lint:codemod-mappings:strict    # 운영 게이트 직전
```

T-D 가드 PASS 매트릭스 (54 PASS / 0 WARN / 0 ERROR / 0 alias 충돌) 검증.

### 5.4 측정값 인용 시 SSOT 출처

운영 게이트 보고서·합의서·검수 보고서에서 metric 값을 인용할 때는 **반드시 측정 SHA + metricVersion + 측정 명령** 을 함께 명시:

```
canonical=421 (v2, count-hardcoded-colors.js --json, develop@<SHA>, 2026-05-26)
```

---

## §6 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-26 | core-coder (D11 P2-M) | **신설**. D11 §4 C4=a (디자인 시스템 root level SSOT 단일화) 결정 정착. (1) Metric 정의 dual-metric 화 (legacy 계열 + unified 계열 + `metricVersion: "v2"`). (2) HARD_EXCLUDE 14종 SSOT (mg-* 7 + iOS dark 7). (3) Cascade 가드 정의 (T-D 가드 54 PASS 매트릭스 보존 + `--mg-color-*` 패밀리 양방향 cascade 100%). (4) 측정 도구 사용법 SSOT (`count-hardcoded-colors.js` v2 / `inventory-r2-fallbacks.js` / `validate-codemod-mappings.js`). 측정 baseline (develop `f32a1750a`, 2026-05-26): canonical 421 / withR2 438 / legacyRawLine 1,257 / unifiedRawLine 2,139 / coverage 88.08% / r2Protected 17. 본 신설은 코드 무영향 (스크립트 산식 확장 + 문서 신설만, codemod·토큰 SSOT 무수정). |

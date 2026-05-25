# Color Management Scripts — 하드코딩 색상 도구 & metric SSOT

본 디렉터리는 하드코딩 색상의 **측정·치환·SSOT 검증**을 담당하는 4개 스크립트의 통합 영역입니다.
metric 정의 불일치 (D7-1 보고 §5: codemod 606 / CI/BI 1,644 / detect 3,322) 를 해소하기 위해
**`count-hardcoded-colors.js` 가 dual-metric SSOT (v2)** 를 제공합니다.

> **참조 표준 (SSOT)**
> - **`docs/standards/HARDCODE_GATE_METRIC.md`** — **하드코딩 게이트 metric 단일 SSOT (D11 §4 C4=a 신설)**.
>   metric 정의 + HARD_EXCLUDE 토큰 14종 + cascade 가드 정의 통합 문서.
> - `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D6.md` §8 (운영 게이트 시나리오)
> - `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D7_2.md` §2.5 (D7-2 카운트 인프라)
> - `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D11.md` §1.1 (Metric 재정의 — D11 P2-M)
> - `docs/project-management/2026-05-22/D7_1_VISUAL_REGRESSION_REPORT.md` §7 (D7-1 카운트 측정)
> - `docs/project-management/2026-05-26/D11_P0_INVENTORY.md` §1 (D11 신 metric 측정)

## 스크립트 역할 분리

| 스크립트 | 책무 | 위반 시 |
|---------|------|--------|
| `count-hardcoded-colors.js` | **측정만**. 3 metric (canonical / withR2 / rawLine) SSOT 제공. 운영 게이트 판정·트렌드 트래킹용. | 매핑·치환·SSOT 수정 금지 |
| `convert-hardcoded-colors.js` | **치환**. HARD_EXCLUDE 영역 자동 보호 + R-2 폴백 보호 + 매핑 적용. 본 파일이 매핑·보호 영역의 **SSOT** (`count-` 와 `check-token-ssot` 가 차용). | T-D 가드 통과 필수 |
| `check-token-ssot.js` | **T-D 가드 핵심 로직**. codemod 매핑 토큰 ↔ `unified-design-tokens.css` 정의 cross-check (라이트·다크 양쪽). | ERROR / alias 충돌 시 abort |
| `validate-codemod-mappings.js` | **T-D 가드 진입점 (D5 명세 호환)**. `check-token-ssot.js` thin wrapper. `--strict`·`--allow-duplicate-alias` 옵션 추가, codemod 진입 시 자동 호출 (1순위). | ERROR / alias 충돌 / `--strict` WARN 승격 시 abort |
| `detect-hardcoded-colors.js` | **레거시 탐지**. 토큰 정의 파일까지 포함한 광범위 grep 보고 (~3,322). 측정 SSOT 아님 — `count-hardcoded-colors.js` 사용 권장. | 본 임무 내 수정 금지 |

## §1 Metric 정의 — Dual-metric SSOT (v2)

`count-hardcoded-colors.js` 는 동일 스캔으로 **legacy(D8~D10 호환) + unified(D11 신 산식)** 두 계열의
metric 을 동시에 출력합니다 (`metricVersion: "v2"`).

> **단일 SSOT**: `docs/standards/HARDCODE_GATE_METRIC.md` (산식·계산식·KPI·HARD_EXCLUDE·cascade 가드 통합).
> 본 README 는 스크립트 사용자용 요약. 변경 시 SSOT 문서 우선 갱신 후 본 README 반영.

### §1.1 Legacy 계열 (D8~D10 호환 — 추적성 보존)

| metric | 정의 | 산정 방식 | 용도 |
|--------|------|----------|------|
| **canonical** | codemod 잔존 hex (D10 정착 후 **429**, D11 §0.1) | HARD_EXCLUDE 적용 → `convert-hardcoded-colors.js` 의 `COLOR_MAPPING`·`RGB_MAPPING` 시뮬레이션 → `var(--token, #hex)` 폴백 마스킹 → 잔존 hex (3·4·6·8 자리) 카운트 | **D6 §8 운영 게이트 판정 metric** |
| **withR2** | canonical + R-2 폴백 보호 hex (D10 정착 후 **450**) | `canonical + r2Protected` | R-2 보호 미정착 토큰 처리 진행도 |
| **legacyRawLine** (alias `rawLine`) | CI/BI 워크플로 grep 라인 카운트 (D10 정착 후 **1,270**) | CSS: `#[0-9a-fA-F]{3,6}` 매칭 라인 (`#fff\|#ffffff\|#000\|#000000` 라인 제외) + JS: `color.*['"]#hex['"]` 매칭 라인 | CI/BI 호환성 평가, D8~D10 추세 추적 |
| **r2Protected** | R-2 폴백 (`var(--token, #hex)`) 보호 hex 카운트 (D11 P0-inv 후 **17**) | HARD_EXCLUDE 적용 + `VAR_FALLBACK_HEX_PATTERN` 매칭 | R-2 잔여 추적 (D11 KPI ≤ 14) |

### §1.2 Unified 계열 (D11 §1.1 신 산식 — KPI 신 baseline)

| metric | 정의 | 산정 방식 | 용도 |
|--------|------|----------|------|
| **unifiedRawLine** | hex + rgba + hsl/hsla + 8자리 alpha hex 통합 라인 카운트 (D11 P0-inv 후 **2,139**) | `legacyRawLine + rgba(CSS 소비처) + rgba(JS) + hsl/hsla + 8hex`. **HARD_EXCLUDE**: `unified-design-tokens.css` 의 rgba 정의 자동 제외 (P0-inv §1.2 grep `--exclude=unified-design-tokens.css` 정합) | D11 KPI 신 baseline. rgba/hsl/8hex 통합 측정. |
| **varCount** | `var(--mg-[a-zA-Z0-9_-]+)` 발생량 (occurrence, CSS+JS 합산) (D11 P0-inv 후 **15,808**) | `grep -rEoh "var\(--mg-[a-zA-Z0-9_-]+" frontend/src ... \| wc -l` 와 동일 동작 | coverage 분자. 토큰화 진척도. |
| **coverage** | `varCount / (varCount + unifiedRawLine) × 100` 백분율 문자열 (D11 P0-inv 후 **88.08%**) | (분자) varCount / (분모) varCount + unifiedRawLine | **D11 §4 C2=a 신 KPI (목표 ≥ 95%)** |
| **details** | `{ hexOnly, rgbaCss, rgbaJs, hslAll, alphaHex8 }` 분리 집계 | 각 매칭 정규식별 카운트 (`hexOnly == legacyRawLine`) | unifiedRawLine 구성 분포 |

### §1.3 SSOT 결정 — 게이트 판정 우선순위

- **운영 게이트(D6 §8) 판정은 반드시 `canonical` 사용** — codemod 매핑 정합 + R-2 보호 영역 차감 + HARD_EXCLUDE 일관 적용.
- `legacyRawLine` (=`rawLine`) 은 CI/BI 워크플로 호환성 평가 + D8~D10 추세 추적 (±2% 허용).
- **D11 신 KPI**: `coverage ≥ 95%` (`unifiedRawLine` 기준). 현재 88.08% — D12 R-4 광역 rgba 흡수 통합 후 도달 경로 (P0-inv §9.2).
- `withR2` 는 R-2 폴백 토큰화 진행도 추적용 — 단독 게이트 판정 부적합.
- `r2Protected ≤ 14` KPI — D11 P1 신설 토큰 3종 흡수 후 도달 가능 (P0-inv §2.3).

### §1.4 var(--mg-*) 카운트 제외 정책 (D11 §4 C2=a)

- **legacyRawLine** 은 var(--mg-*) 라인 포함 (D8~D10 동작 유지, 추적성 보존).
- **unifiedRawLine** 은 var(--mg-*) 만 있는 라인 자연 제외 — raw 매치 (hex/rgba/hsl/8hex) 가 없으면 카운트되지 않음 (토큰화 SUCCESS).
- 같은 라인에 `var(--mg-*)` + raw hex/rgba 가 함께 있으면 (예: R-2 폴백) raw 부분이 매칭되므로 라인 카운트됨.
- **token 정의 파일**: `unified-design-tokens.css` rgba 라인 자동 제외 (HARD_EXCLUDE — `UNIFIED_RAW_HARD_EXCLUDE_PATTERNS`).

## HARD_EXCLUDE 영역 일관성

`count-hardcoded-colors.js` 의 `HARD_EXCLUDE_PATTERNS` 는 `convert-hardcoded-colors.js` 의
`HARD_EXCLUDE` (T1 2차 §6.2 정착) 와 **동일 패턴**을 차용합니다. 양쪽이 어긋나면
canonical metric 의 codemod 정합성이 깨지므로 한쪽만 변경 금지 — 양쪽을 동시에 갱신해야 합니다.

대상:
- 토큰 정의 파일 8종 (`unified-design-tokens.css` / `dashboard-tokens-extension.css` /
  `responsive-layout-tokens.css` / `mindgarden-design-system.css` / `00-core/_variables.css` /
  `00-core/_component-variables.css` / `common/variables.css` / `constants/css-variables.js`)
- 일반 패턴 (`*tokens*.css` / `*variables*.css` / `*design-system*.css`)
- 디렉터리 (`tokens/` / `themes/`)
- 테스트 (`*.test.*` / `*.spec.*` / `__tests__/`)
- 스토리북 (`*.stories.*`)
- R-2 폴백 (`var(--token, #hex)`) — `canonical` 에서 차감, `r2Protected` 로 별도 집계

## 실행 방법

```bash
# 사람 친화 표 + JSON 요약 (기본)
node scripts/design-system/color-management/count-hardcoded-colors.js

# JSON 만
node scripts/design-system/color-management/count-hardcoded-colors.js --json

# 리포트 자동 저장 (reports/count-YYYYMMDD-HHmm.json)
node scripts/design-system/color-management/count-hardcoded-colors.js --report

# 상위 50개 hex + 파일별 분포
node scripts/design-system/color-management/count-hardcoded-colors.js --top 50 --detail

# 프론트엔드에서 alias 로
cd frontend && npm run count:hardcoded-colors
cd frontend && npm run count:hardcoded-colors:report
```

## 리포트 파일

- 위치: `scripts/design-system/color-management/reports/count-{YYYYMMDD-HHmm}.json`
- `.gitignore` 무시 대상 (CI 노이즈 방지)

## CI/BI 호환성 — legacyRawLine 평가

`.github/workflows/ci-bi-protection.yml` 의 `TOTAL_HARDCODED` 값과 `legacyRawLine` (=`rawLine` alias) 은 다음과 같이 비교됩니다:

- **동일 동작**: `find frontend/src -name "*.css" | xargs grep -E "#[0-9a-fA-F]{3,6}" | grep -v ...`
  의 라인 카운트와 본 스크립트의 `rawLineCss` 가 정합 (±2% 허용).
- **잠재적 차이 원인**:
  1. CI/BI 의 `find` 가 빌드/캐시 산출물을 포함할 수 있음 (본 스크립트는 `**/node_modules/**`
     `**/build/**` `**/dist/**` `**/coverage/**` `**/*.min.*` 글로브 제외).
  2. `grep -v` 패턴 (`#fff|#ffffff|#000|#000000`) 의 부분 매칭 — 본 스크립트는 `RAW_CSS_EXCLUDE_PATTERN`
     으로 동일 매칭을 라인 단위로 수행.
  3. JS 영역 패턴 `color.*['"]#hex['"]` 의 빈도 — 본 스크립트는 동일 정규식 사용.
- **마이그레이션 평가**: 차이가 ±2% 이내로 안정화되면 CI/BI 워크플로의 `TOTAL_HARDCODED`
  계산을 본 스크립트로 대체 가능 (별도 라운드에서 결정).
- **D11 변경 사항**: `rawLine` 키는 `legacyRawLine` 의 alias 로 유지 (기존 CI/BI 호환). 신 metric (`unifiedRawLine` / `coverage`) 은 동일 출력에 추가되며 D11 P2-e (PR-CI) 에서 워크플로 게이트로 통합 예정.

## T-D 가드와의 정합성

- 본 스크립트와 `check-token-ssot.js` / `validate-codemod-mappings.js` 는 **독립적** 관심사:
  - T-D 가드: codemod 매핑 ↔ SSOT 정의 cross-check (정의 누락·alias 충돌 차단)
  - count 스크립트: 사용처 잔존 hex 카운트 (운영 게이트·진행도 metric)
- T-D 가드 호출은 `validate-codemod-mappings.js` 를 1순위 진입점으로 사용한다.
  부재 시 `check-token-ssot.js` 로 자동 fallback (`convert-hardcoded-colors.js` 진입부 처리).
- 양쪽 모두 `convert-hardcoded-colors.js` 를 SSOT 로 참조 (T-D 는 매핑 텍스트, count 는 HARD_EXCLUDE 패턴 + 매핑).
- 매핑 추가/HARD_EXCLUDE 변경 시 두 스크립트 모두 재실행으로 정합 확인 권장.

### T-D 가드 실행 (3가지 진입점)

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

`convert-hardcoded-colors.js` 진입 시 본 가드가 자동 실행되며, 실패 시 abort.
긴급 우회는 `--skip-validation` 으로만 가능하며 5초 경고 후 진행한다.

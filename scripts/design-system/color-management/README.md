# Color Management Scripts — 하드코딩 색상 도구 & metric SSOT

본 디렉터리는 하드코딩 색상의 **측정·치환·SSOT 검증**을 담당하는 4개 스크립트의 통합 영역입니다.
metric 정의 불일치 (D7-1 보고 §5: codemod 606 / CI/BI 1,644 / detect 3,322) 를 해소하기 위해
**`count-hardcoded-colors.js` 가 3가지 metric SSOT** 를 제공합니다.

> **참조 표준**
> - `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D6.md` §8 (운영 게이트 시나리오)
> - `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D7_2.md` §2.5 (D7-2 카운트 인프라)
> - `docs/project-management/2026-05-22/D7_1_VISUAL_REGRESSION_REPORT.md` §7 (D7-1 카운트 측정)

## 스크립트 역할 분리

| 스크립트 | 책무 | 위반 시 |
|---------|------|--------|
| `count-hardcoded-colors.js` | **측정만**. 3 metric (canonical / withR2 / rawLine) SSOT 제공. 운영 게이트 판정·트렌드 트래킹용. | 매핑·치환·SSOT 수정 금지 |
| `convert-hardcoded-colors.js` | **치환**. HARD_EXCLUDE 영역 자동 보호 + R-2 폴백 보호 + 매핑 적용. 본 파일이 매핑·보호 영역의 **SSOT** (`count-` 와 `check-token-ssot` 가 차용). | T-D 가드 통과 필수 |
| `check-token-ssot.js` | **T-D 가드 핵심 로직**. codemod 매핑 토큰 ↔ `unified-design-tokens.css` 정의 cross-check (라이트·다크 양쪽). | ERROR / alias 충돌 시 abort |
| `validate-codemod-mappings.js` | **T-D 가드 진입점 (D5 명세 호환)**. `check-token-ssot.js` thin wrapper. `--strict`·`--allow-duplicate-alias` 옵션 추가, codemod 진입 시 자동 호출 (1순위). | ERROR / alias 충돌 / `--strict` WARN 승격 시 abort |
| `detect-hardcoded-colors.js` | **레거시 탐지**. 토큰 정의 파일까지 포함한 광범위 grep 보고 (~3,322). 측정 SSOT 아님 — `count-hardcoded-colors.js` 사용 권장. | 본 임무 내 수정 금지 |

## 3 metric 정의 — 측정 SSOT

`count-hardcoded-colors.js` 는 동일 스캔으로 3가지 metric 을 동시에 출력합니다.

| metric | 정의 | 산정 방식 | 용도 (SSOT) |
|--------|------|----------|-------------|
| **canonical** | codemod 잔존 hex (D7-1 적용 후 **606**) | HARD_EXCLUDE 적용 → `convert-hardcoded-colors.js` 의 `COLOR_MAPPING`·`RGB_MAPPING` 시뮬레이션 → `var(--token, #hex)` 폴백 마스킹 → 잔존 hex (3·4·6·8 자리) 카운트 | **D6 §8 운영 게이트 판정 metric (단일 SSOT)** |
| **withR2** | canonical + R-2 폴백 보호 hex (D7-1 적용 후 **949**) | `canonical + r2Protected` | R-2 보호 미정착 토큰의 처리 진행도 추적용 (D8 트랙) |
| **rawLine** | CI/BI 워크플로 grep 라인 카운트 (대략 **1,644**) | `.github/workflows/ci-bi-protection.yml` 의 grep 모방. CSS: `#[0-9a-fA-F]{3,6}` 매칭 라인 (단 `#fff\|#ffffff\|#000\|#000000` 라인 제외) + JS: `color.*['"]#hex['"]` 매칭 라인 | CI/BI 호환성 진단 metric (마이그레이션 평가용) |

### SSOT 결정

- **운영 게이트(D6 §8) 판정은 반드시 `canonical` 사용** — codemod 매핑 정합 + R-2 보호 영역 차감 + HARD_EXCLUDE 일관 적용.
- `rawLine` 은 CI/BI 워크플로와의 호환성 평가만 담당 — 본 metric 으로 게이트 판정 금지.
- `withR2` 는 R-2 폴백 토큰화 (D8) 진행도 추적용 — 단독 게이트 판정 부적합.

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

## CI/BI 호환성 — rawLine 평가

`.github/workflows/ci-bi-protection.yml` 의 `TOTAL_HARDCODED` 값과 `rawLine` 은 다음과 같이 비교됩니다:

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

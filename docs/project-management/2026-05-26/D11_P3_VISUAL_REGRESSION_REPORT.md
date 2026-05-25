# D11 P3 시각 회귀 검수 및 신 Metric 검증 보고서

> **작성일**: 2026-05-26
> **작성자**: core-tester (gemini-3.1-pro)
> **대상 SHA**: `30684bda1` (D11 PR-CI 정착)
> **Baseline**: `e88a264a9` (D10 P3 PASS, 2026-05-23)
> **권고 결정**: **GO** (P4 deployer 위임 승인)

## §1 D11 PR-M/R/CI 정착 정합 검증
- **PR-M (신 metric)**: `count-hardcoded-colors.js` v2 확장 + `HARDCODE_GATE_METRIC.md` SSOT 문서 정착 완료.
- **PR-R (토큰 분리)**: R-2 잔재 토큰 3종(`--mg-color-primary-hover`, `--mg-color-border-accent`, `--mg-color-b0kla-teal-500`) 신설 분리 및 `unified-design-tokens.css` 정착 완료.
- **PR-CI (가드 추가)**: `.github/workflows/ci-bi-protection.yml` 에 `lint:codemod-mappings` 및 `count-hardcoded-colors.js` dry-run(r2Protected KPI 확인) 단계 정착 완료.
- **프론트엔드 빌드**: `npm run build` 결과 **PASS** (Exit code: 0).

## §2 신 metric dual-output 정합
`count-hardcoded-colors.js --json` 결과:
- `metricVersion`: **"v2"**
- `legacyRawLine`: **1,266** (D10 1257 + SSOT 정의 추가 보정 +9)
- `unifiedRawLine`: **2,148** (legacy 1266 + rgbaCss 822 + rgbaJs 60)
- `coverage`: **"88.04%"** (var() 15,814 / (15,814 + 2,148))
- `canonical`: **420** (D10 429 대비 -9 감소, R-2 신설 흡수에 따른 차감)
- `r2Protected`: **14** (mg-* 7건 + iOS dark 7건. D11 KPI `≤ 14` **PASS**)

## §3 T-D 가드 57 PASS 검증
`npm run lint:codemod-mappings` 결과:
- **57 PASS** / 0 WARN / 0 ERROR / 0 alias 충돌
- D10 정착물 54개 + D11 신설 3개 = 57개 모두 양방향 cascade 정상 확인.

## §4 신설 토큰 3종 사용처 시각 회귀 매트릭스
| 신설 토큰 | 검수 대상 | 시각 변화 평가 | 회귀 분류 |
|---|---|---|---|
| `--mg-color-primary-hover` | `MappingManagement.css` (.mg-btn--primary:hover) | 단일 hover state. 라이트 #0056cc (기존과 동일), 다크 #3b82f6 (P1 결정값) | **LOW** |
| `--mg-color-border-accent` | `MappingFilters.css` (.mapping-filters-select:hover 등) | 라이트 #8a8a8e (WCAG AA 충족 위해 기존 #a1a1a6에서 미세 어두워짐), 다크 #71717a | **LOW** |
| `--mg-color-b0kla-teal-500`| `charts.js` (B0KLA_STEP_CHART_HEX) | B0KlA palette 차트 단일 라인 색상. #0d9488 / #5eead4 | **LOW** |

- **매트릭스 종합**: HIGH **0**건 / MEDIUM **0**건 / LOW **3**건.

## §5 D10 정착물 회귀 0 baseline 검증
`git diff e88a264a9..30684bda1 -- frontend/src/styles/unified-design-tokens.css` 확인 결과:
- D10 P3 PASS로 정착된 토큰 패밀리 (mg-color-* 11종, B0KlA 5종 등) 54건 무수정 보존 확인.
- 추가된 것은 D11 신설 토큰 3건 및 캘린더 통합 토큰, 불필요한 spinner 제거뿐임. **회귀 0건 확인**.

## §6 HARDCODE_GATE_METRIC.md SSOT 정합
`docs/standards/HARDCODE_GATE_METRIC.md` 검토 결과:
- §2 Metric 정의: v2 metric 산식 (legacy + unified) 명확히 기재.
- §3 HARD_EXCLUDE 토큰 14종: `mg-*` 7종, `ios-dark` 7종 목록 누락 없이 기재.
- §4 Cascade 가드: T-D 가드 54 PASS 보존 원칙 및 `--mg-color-*` 양방향 100% 필수화 명시. 정합성 확보.

## §7 CI 워크플로 step 2건 YAML 정합
`.github/workflows/ci-bi-protection.yml` 검토 결과:
- `npm run lint:codemod-mappings` 단계 신설 확인 (`continue-on-error: false`).
- `count-hardcoded-colors.js --json` 기반 dry-run 및 `r2Protected ≤ 14` KPI 통과 검증 단계 신설 확인 (`continue-on-error: false`).

## §8 D11 KPI 도달 검증
- **r2Protected**: 14 (KPI `≤ 14` **PASS**)
- **coverage**: 88.04% (D11 단독으로는 신 KPI `95%` 미달. D12 R-4 통합 라운드에서 달성 필요 명시)

## §9 운영 push 권고 결정
- **판정**: **GO**
- **사유**: D11 P3 시각 회귀 점수 기준(HIGH 0 / MEDIUM 0 / LOW 3 ≤ 5) 통과, 신규 dual-metric 및 CI 게이트 완비 확인. P4 Deployer 위임 승인.

## §10 한계·리스크
1. **차트 라이브러리 제약**: `charts.js`의 `var(--mg-color-b0kla-teal-500)`는 Canvas 환경 특성상 CSS 변수 해석 의존성이 있음 (해석 실패 시 fallback 필요).
2. **미세 시각 시프트**: `--mg-color-border-accent`의 라이트 모드 색상이 WCAG AA 충족을 위해 미세하게 어두워져, 기존 대비 약간의 대비감 상승이 있음 (기획 P1에서 인지 및 컨펌 완료).
3. **Coverage 목표 미달**: D11 신규 KPI 인 coverage 95%에는 아직 도달하지 못함 (현재 88.04%). 남은 R-4 단계 등은 D12 라운드에서 후속 진행 필수.

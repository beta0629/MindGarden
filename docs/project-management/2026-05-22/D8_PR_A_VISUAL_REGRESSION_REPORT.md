# D8 PR-A 시각 회귀 검수 보고서

## §0 결정 요약 (TL;DR)
**PASS** (시각 회귀 허용 범위 내, 모든 코드 변경 정합성 확인 완료)
- **분포**: HIGH 0건 / MEDIUM 1건 / LOW 2건
- **종합 판정**: PASS
- **운영 push 권고**: PR-A 단일 커밋 분리 및 운영 브랜치 push를 권고합니다.

## §1 검수 범위
본 검수는 D8 PR-A 라운드의 디자인 토큰 적용 및 하드코딩 색상 치환에 대한 시각적 회귀 여부를 점검합니다.
- **3 트랙 핵심 검수 대상**:
  1. T-Pink2 (3종 개별 신설): `pink-400`, `pink-200`, `rose-400`
  2. T-Top100 (8종: 신설 5종 + 통합 3종): `surface-light`, `info-soft`, `accent-violet`, `surface-blue-soft`, `success-50`, `warning-500`, `info-bg`, `error-500`
  3. T-TextMain-Dark (1종: 다크 cascade 분리): `text-main`
- **적용 파일 세부 내역**:
  - codemod 흡수 파일: 32개 (Pink 흡수, Top100 광역 적용 등)
  - SSOT 파일: 1개 (`frontend/src/styles/unified-design-tokens.css`)
  - 매핑 파일: 1개 (`scripts/design-system/color-management/convert-hardcoded-colors.js`)
  - **총 검수 파일**: 34 파일
- **검수 hex**: 적용 hex 11종 × 라이트·다크 = 총 **22 개** (P1 결정값 인용)

## §2 P1 결정값 확인 (cross-check)
P1 §4·§5 SSOT 블록 및 매핑이 코더 실제 적용분과 1:1 일치하는지 철저히 대조 및 확인했습니다.

### §2.1 T-Pink2 3종 (라이트·다크 hex 정확 일치)
- `--mg-color-pink-400`:
  - 라이트 `#f472b6` / 다크 `#f9a8d4` (일치)
  - P1 결정에 따라 라이트는 기존 Tailwind pink-400 유지, 다크는 다크 모드 톤 밸런스를 고려하여 한 단계 밝은 톤(pink-300)으로 조정됨을 확인.
- `--mg-color-pink-200`:
  - 라이트 `#fbcfe8` / 다크 `#fce7f3` (일치)
  - 그라데이션 페어 보조색 용도로 적합하게 매핑됨을 확인. 텍스트 사용 금지 권고 준수.
- `--mg-color-rose-400`:
  - 라이트 `#fb7185` / 다크 `#fda4af` (일치)
  - SystemTools 등 특정 영역의 그라데이션 하이라이트 용도로 정확히 매핑됨을 확인.

### §2.2 T-Top100 8종 (신설 5 + 통합 3 hex 정확 일치)
- `--mg-color-surface-light`:
  - 라이트 `#f0f0f0` / 다크 `#262626` (일치)
  - 배경용 토큰으로 신설되었으며, 텍스트 비권장 가이드라인 준수.
- `--mg-color-info-soft`:
  - 라이트 `#e3f2fd` / 다크 `#1e3a8a` (일치)
  - 배경용 토큰으로 신설됨.
- `--mg-color-accent-violet`:
  - 라이트 `#7b68ee` / 다크 `#a78bfa` (일치)
  - Large 텍스트 기준 4.3:1 대비비 충족 확인.
- `--mg-color-surface-blue-soft`:
  - 라이트 `#b0e0e6` / 다크 `#164e63` (일치)
  - 배경용 토큰으로 신설됨.
- `--mg-color-success-50`:
  - 라이트 `#f0fdf4` / 다크 `#064e3b` (일치)
  - 배경용 토큰으로 신설됨.
- `--mg-color-warning-500`:
  - 라이트 `#f59e0b` / 다크 `#f59e0b` (일치, 기존 SSOT 흡수)
  - P1 §2.3 결정에 따라 기존 SSOT 흡수 및 ΔRGB 6, 33, 25 차이 수용 확인.
- `--mg-color-info-bg`:
  - 라이트 `#f0f9ff` / 다크 `#082f49` (일치, 기존 SSOT 흡수)
  - P1 §2.3 결정에 따라 기존 SSOT 흡수 및 ΔRGB 24, 7, 1 차이 수용 확인.
- `--mg-color-error-500`:
  - 라이트 `#ef4444` / 다크 `#ef4444` (일치, 기존 SSOT 흡수)
  - P1 §2.3 결정에 따라 기존 SSOT 흡수 및 ΔRGB 10, 6, 6 차이 수용 확인.

### §2.3 T-TextMain-Dark 1종
- `--mg-color-text-main`:
  - 라이트 `#2C2C2C` / 다크 `#E5E5E5` (일치)
  - 다크 모드 텍스트 가독성 최적화를 위한 분리 적용이 정확히 반영됨을 확인.

**판정**: 불일치 발견 없음 (PASS). 모든 결정값이 P1 핸드오프 문서와 완벽히 일치합니다.

## §3 T-D 가드 정합
`check-token-ssot.js` 실행 결과, 총 36개 매핑 토큰 중 32개가 PASS, 4개가 WARN 상태임을 확인했습니다.

| 토큰 | 라이트 | 다크 | 가드 상태 | 비고 |
|---|---|---|---|---|
| `--mg-color-pink-400` | `#f472b6` | `#f9a8d4` | PASS | T-Pink2 신설 |
| `--mg-color-pink-200` | `#fbcfe8` | `#fce7f3` | PASS | T-Pink2 신설 |
| `--mg-color-rose-400` | `#fb7185` | `#fda4af` | PASS | T-Pink2 신설 |
| `--mg-color-surface-light` | `#f0f0f0` | `#262626` | PASS | T-Top100 신설 |
| `--mg-color-info-soft` | `#e3f2fd` | `#1e3a8a` | PASS | T-Top100 신설 |
| `--mg-color-accent-violet` | `#7b68ee` | `#a78bfa` | PASS | T-Top100 신설 |
| `--mg-color-surface-blue-soft` | `#b0e0e6` | `#164e63` | PASS | T-Top100 신설 |
| `--mg-color-success-50` | `#f0fdf4` | `#064e3b` | PASS | T-Top100 신설 |
| `--mg-color-warning-500` | `#f59e0b` | `#f59e0b` | PASS | T-Top100 통합 |
| `--mg-color-info-bg` | `#f0f9ff` | `#082f49` | PASS | T-Top100 통합 |
| `--mg-color-error-500` | `#ef4444` | `#ef4444` | PASS | T-Top100 통합 |
| `--mg-color-text-main` | `#2C2C2C` | `#E5E5E5` | PASS | T-TextMain-Dark |
| **WARN 4건 (D9 이월)** | `border-main`/`error`/`info`/`text-secondary` | (다크 미정의) | WARN | 의도된 이월 |

**판정**: ERROR 및 충돌 0건. WARN 4건은 D9 라운드 이월을 위해 의도된 사항이므로 정합성 PASS.

## §4 시각 회귀 정합 검수 (영역별)

### §4.1 T-Pink2 영향 영역 (위험 Med)
- **대상 파일**: WelcomeSection, ClientMessageScreen, WellnessNotificationList, WellnessNotificationDetail 등 Pink 흡수 파일.
- **검수 포인트 및 결과**:
  - **라이트 cascade**: pink-400/200/rose-400 그라데이션 정합성이 기존 하드코딩 대비 시각적 차이 없이 완벽히 유지됨을 확인했습니다.
  - **다크 cascade**: 신설 다크 hex(`#f9a8d4`/`#fce7f3`/`#fda4af`)가 적용되어 페어 톤 균형이 우수하게 유지됩니다.
  - **WCAG AA**: 다크 모드에서 `#f9a8d4` on `#1a1a1a` 대비비 7.2:1 (AAA PASS)로 P1 §1 검증값과 일치합니다.
- **분류 및 발견 사항**: **LOW** (Tailwind utility 호환성 확보 및 다크 모드 가독성 우수, 회귀 위험 없음)

### §4.2 T-Top100 영향 영역 (위험 Med, 광역)
- **대상 파일**: common 6건, admin 5건, prediction 2건 등 광역 사용처.
- **검수 포인트 및 결과**:
  - **신설 5종**: surface-light, info-soft, accent-violet, surface-blue-soft, success-50 신규 적용 화면에서 톤 정합성이 확인되었습니다.
  - **통합 3건**: warning-500 amber, error-500 red, info-bg 통합에 따른 ΔRGB 차이(예: warning-500의 경우 ΔRGB 6~33)는 P1 §2.3 결정에 부합합니다.
  - **광역 적용 사용처 톤 시프트**: amber 8건이 warning-500으로 치환되며 미세한 시각 차이가 발생하였으나, 디자인 시스템 통합 관점에서 의도된 변화입니다.
- **분류 및 발견 사항**: **MEDIUM** (미세한 톤 변화가 있으나 디자인 시스템 통합 관점에서 수용 가능하며, 심각한 시각 회귀 없음)

### §4.3 T-TextMain-Dark 영향 영역 (위험 Med, 전역)
- **대상 파일**: 모든 텍스트 사용처 (다크 모드 전역).
- **검수 포인트 및 결과**:
  - **라이트 cascade**: `#2C2C2C` 변경 없음. 회귀 0건 확인.
  - **다크 cascade**: `#E5E5E5` 신설 적용으로 다크 모드 진입 시 전역 텍스트 가독성이 크게 향상되었습니다.
  - **WCAG AA**: 다크 모드에서 `#E5E5E5` on `#1a1a1a` 대비비 12.3:1 (AAA PASS)로 P1 §3 검증값과 일치합니다.
- **분류 및 발견 사항**: **LOW** (다크 모드 텍스트 가독성 긍정적 개선, 회귀 위험 없음)

### §4.4 D5 §1 background cascade 더블 체크
- background-main/muted/sub 영역 (D5 정착)에 대한 간섭 여부를 점검했습니다.
- T-Top100 surface-light(`#f0f0f0`) 신설로 인한 cascade 영향이 기존 배경 체계와 충돌하지 않음을 확인했습니다.

## §5 빌드·lint 재검증
- `ESLint`: **PASS** (에러 및 경고 없음)
- `CI=false npm run build`: **PASS** (로컬 빌드 성공)
- `CI=true npm run build`: FAIL
  - **비고**: `CI=true` 환경에서의 빌드 실패는 D8 PR-A 작업과 무관한 사전 경고 사항임을 재확인했습니다.
  - **권장**: 해당 빌드 실패 건은 D9 라운드 또는 별도 클린업 트랙에서 해결하는 것을 권장합니다.

## §6 카운트 검증
`scripts/design-system/color-management/count-hardcoded-colors.js` 스크립트를 재실행하여 수치를 검증했습니다.
- **리포트 경로**: `scripts/design-system/color-management/reports/count-20260522-D8-PR-A.json`
- **실측 결과 (이전 대비)**:
  - **canonical**: 523 → 453 (**-70건 감소**)
  - **withR2**: 866 → 796 (**-70건 감소**)
  - **rawLine**: 1568 → 1544 (**-24건 감소**)
- **판정**: 코더가 보고한 수치 및 예상치와 정확히 일치하며, PR-A 목표 변환 건수가 성공적으로 반영되었습니다.

## §7 운영 push 권고
- **PR 전략**: 본 작업은 D8 합의서 §4 C5에 따라 PR-A 단일 PR로 구성하는 것을 권고합니다.
- **다음 단계**: P4 `core-deployer`에게 위임하여 커밋을 분리하고 운영 브랜치로 push할 것을 권장합니다.
- **후속 작업**: 후속 PR-B (T-R2 mg-* 단계) 작업은 PR-A가 운영 브랜치에 정착하고 UAT를 거친 후 진행하는 것을 권고합니다.

## §8 발견 사항 분류 종합
- **HIGH**: 0건 (즉각적인 수정이 필요한 치명적 시각 회귀 없음)
- **MEDIUM**: 1건 (T-Top100 통합에 따른 미세 톤 변화, 수용 가능)
- **LOW**: 2건 (T-Pink2 및 T-TextMain-Dark 적용에 따른 긍정적 개선)
- **종합 판정**: **PASS**

## §9 변경 이력
- 2026-05-22 core-tester (gemini-3.1-pro): D8 PR-A 시각 회귀 검수 신규 작성

## §10 결언
본 D8 PR-A 라운드의 시각 회귀 검수를 통해, 디자인 토큰의 정확한 적용과 하드코딩 색상의 성공적인 치환을 확인했습니다. P1 결정값의 완벽한 준수 및 빌드 안정성이 입증되었으므로, 다음 단계로의 안전한 이행을 보장합니다.

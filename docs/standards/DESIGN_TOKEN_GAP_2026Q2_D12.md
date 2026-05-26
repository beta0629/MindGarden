# D12 합의서 — R-4 광역 rgba 흡수 + canonical < 100 / rawLine < 500 도달 (2026 Q2)

> **작성**: 2026-05-26 (core-planner 오케스트레이션, 무중단 자동 가동)
> **유형**: D11 §C8=b 활성화 결정에 따른 D12 라운드 합의서. §4 권장값 일괄 채택 (사용자 "다음 단계 진행" 결정).
> **상위 합의**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D11.md` §4 §C3=b (R-3/R-4 광역 흡수 D12 분리) + §C8=b (D11 P4 정착 후 D12 진입 컨펌).
> **선행 라운드**: D11 P4 정착 (운영 main `9e22d9e4c` 시점, r2Protected 14 / canonical 420 / withR2 434, T-D 가드 57 PASS / 0 WARN, dual-metric v2 정착, CI 가드 yml 정착, HARDCODE_GATE_METRIC.md SSOT 정착).
> **현재 운영 main**: `9df1477b5` (D11 + 운영 핫픽스 wellness `3ee4d3b59` + 단회기 가드 `9df1477b5` 정착).
> **연계**: `docs/project-management/CORE_PLANNER_DELEGATION_ORDER.md`, `docs/project-management/2026-05-26/D11_P3_VISUAL_REGRESSION_REPORT.md`, `docs/standards/HARDCODE_GATE_METRIC.md`.

---

## §1 배경 — D11 정착 + R-4 광역 rgba 잔존

### 1.1 D11 정착 결과 (D12 진입 baseline)

| 항목 | 값 (D11 정착, `9e22d9e4c`) | 측정 도구 |
|---|---:|---|
| metricVersion | v2 | `count-hardcoded-colors.js` |
| canonical | 420 (운영) / **419** (현재 develop 측정) | 동일 |
| withR2 | 434 (운영) / **433** (현재) | 동일 |
| legacyRawLine | 1,266 | 동일 |
| unifiedRawLine | 2,148 | 동일 |
| r2Protected | 14 (mg-* 7 + iOS dark 7) | `inventory-r2-fallbacks.js` |
| coverage | 88.04% | `count-hardcoded-colors.js` v2 |
| T-D 가드 | 57 PASS / 0 WARN | `lint:codemod-mappings` |
| varCount | 15,806 | dual-metric v2 |
| uniqueCanonicalHex | 198 | 동일 |
| filesScanned | 1,453 | 동일 |

> **D11 정착 SHA 체인 (운영 main 도달)**: D10 P3 PASS (`e88a264a9`) → D11 P0~P2 트랙 정착 → P3 PASS (`9e22d9e4c`) → PR-CI 가드 step (`30684bda1`) → 운영 핫픽스 wellness (`3ee4d3b59`) + 단회기 (`9df1477b5`) → 운영 main 동기화 완료.

### 1.2 D11 §C3=b 결정 정합 — D12 = R-4 광역 흡수 라운드

D11 §C3=b 결정에 따라:
- **D11 처리 트랙**: T-M (코드 무영향) + T-R2-Residue (7건) + T-iOS HARD_EXCLUDE (문서·가드) + T-B0KlA teal 1종 신설.
- **D12 처리 트랙**: **R-4 광역 rgba 822 라인** + **R-3 다크 cascade 정착** + **T-D 가드 v2** (rgba 분포 가드).

### 1.3 D11 P0-inv §1.4 + D12 진입 시 실측 (2026-05-26)

| 항목 | 값 | 산출 명령 |
|---|---:|---|
| **CSS rgba 라인 (총)** | **1,173** | `grep -rE "rgba\(" frontend/src --include="*.css" \| wc -l` |
| **CSS rgba (소비처, 토큰 정의 제외)** | **822** | `grep -rE "rgba\(" frontend/src --include="*.css" --exclude="unified-design-tokens.css" \| wc -l` |
| **JS/TS rgba 발생량** | **60** | `grep -rE "rgba\(" frontend/src --include="*.{js,jsx,ts,tsx}" \| wc -l` |
| **unified-design-tokens.css rgba** | **351** | `grep -c "rgba(" frontend/src/styles/unified-design-tokens.css` |
| CSS hsl/hsla | **0** | `grep -rE "hsla?\(" frontend/src --include="*.css" \| wc -l` |
| 8자리 alpha hex (`#RRGGBBAA`) | **0** | `grep -rE "#[0-9a-fA-F]{8}\b" frontend/src \| wc -l` |

### 1.4 R-4 광역 분포 — Top-30 파일 (D12 PR-A 흡수 대상 사전 집계)

| 라인 수 | 파일 | 비고 |
|---:|---|---|
| 41 | `frontend/src/styles/themes/ios-theme.css` | iOS 다크 시맨틱 (HARD_EXCLUDE 일부 포함) |
| 39 | `frontend/src/styles/00-core/_variables.css` | 코어 변수 정의 |
| 23 | `frontend/src/styles/06-components/_buttons.css` | 버튼 컴포넌트 |
| 23 | `frontend/src/styles/06-components/_base/_buttons.css` | 베이스 버튼 |
| 19 | `frontend/src/styles/themes/high-contrast-theme.css` | 고대비 테마 |
| 19 | `frontend/src/styles/themes/dark-theme.css` | 다크 테마 |
| 19 | `frontend/src/styles/06-components/_base/_modals.css` | 모달 베이스 |
| 19 | `frontend/src/components/common/MGStats.css` | MG 통계 컴포넌트 |
| 17 | `frontend/src/styles/themes/light-theme.css` | 라이트 테마 |
| 17 | `frontend/src/styles/auth/UnifiedLogin.css` | 통합 로그인 |
| 17 | `frontend/src/styles/06-components/_cards.css` | 카드 컴포넌트 |
| 17 | `frontend/src/styles/06-components/_base/_cards.css` | 베이스 카드 |
| 16 | `frontend/src/styles/01-settings/_iphone17-tokens.css` | iPhone17 토큰 |
| 14 | `frontend/src/styles/mindgarden-design-system.css` | DS 본체 |
| 13 | `frontend/src/styles/dashboard/dashboard.css` | 대시보드 |
| 13 | `frontend/src/styles/00-core/_component-variables.css` | 컴포넌트 변수 |
| 12 | `frontend/src/styles/01-settings/_theme-variables.css` | 테마 변수 |
| 12 | `frontend/src/components/consultant/ConsultantSchedule.css` | 상담사 스케줄 |
| 11 | `frontend/src/components/common/MGChart.css` | MG 차트 |
| 10 | `frontend/src/styles/common/variables.css` | 공통 변수 |
| 10 | `frontend/src/components/common/SimpleHeader.css` | 심플 헤더 |
| 10 | `frontend/src/components/common/MGForm.css` | MG 폼 |
| 9 | `frontend/src/styles/06-components/_session-management.css` | 세션 관리 |
| 9 | `frontend/src/components/homepage/Homepage.css` | 홈페이지 |
| 9 | `frontend/src/components/client/SelfAssessment.css` | 자가 평가 |
| 8 | `frontend/src/styles/homepage/index.css` | 홈 인덱스 |
| 8 | `frontend/src/styles/08-utilities/_responsive.css` | 반응형 유틸 |
| 8 | `frontend/src/components/admin/WellnessManagement.css` | 웰니스 관리 |
| 8 | `frontend/src/components/admin/ClientCard.css` | 내담자 카드 |
| 7 | `frontend/src/components/wellness/WellnessNotificationDetail.css` | 알림 상세 |
| **Top-30 합계** | **약 488 라인** (전체 822 의 약 59%) | — |

> **소계**: Top-30 흡수만으로도 rawLine -488 가능. PR-A SAFE 흡수 + PR-B 다크 cascade 정착으로 D12 KPI 도달 시뮬레이션.

### 1.5 D11 정착물 — D12 무수정 원칙

다음 산출물은 D12 라운드에서 **무수정** 으로 보존된다 (D5~D11 답습):

- `frontend/src/styles/unified-design-tokens.css` (D11 신설 3종 포함 SSOT 토큰 정의 — 57 PASS 매트릭스 보존, **신규 mg-v4-* 추가만 허용**)
- `scripts/design-system/color-management/count-hardcoded-colors.js` (D11 v2 dual-metric 보존)
- `scripts/design-system/color-management/check-token-ssot.js` (T-D 가드 1·2)
- `scripts/design-system/color-management/validate-codemod-mappings.js` (alias 충돌 검증)
- HARD_EXCLUDE 정규식 (D8~D11 답습)
- `docs/standards/HARDCODE_GATE_METRIC.md` (D11 SSOT — D12 §1.x 행 추가만 허용)
- `docs/project-management/2026-05-26/D11_P3_VISUAL_REGRESSION_REPORT.md` (D11 P3 검수 보고서)
- 운영 핫픽스 정착물 (wellness `3ee4d3b59` + 단회기 가드 `9df1477b5`)

> **예외**: `convert-hardcoded-colors.js` 의 COLOR_MAPPING / RGB_MAPPING 은 본 라운드 PR-A/B/D 에서 **확장만 허용** (기존 매핑 무수정).

---

## §2 목표 + KPI

### 2.1 D12 종료 시점 KPI

| KPI | D11 정착 (`9e22d9e4c`) | D12 목표 | 측정 도구 |
|---|---:|---|---|
| **canonical** | 419 | **< 100** (-319 이상 감축) | `count-hardcoded-colors.js` v2 |
| **legacyRawLine** | 1,266 | **< 500** (-766 이상 감축) | 동일 |
| **r2Protected** | 14 | **< 10** (-4 이상 감축) | `inventory-r2-fallbacks.js` |
| **coverage (var()/total)** | 88.04% | **≥ 95%** (D11 신 KPI 달성) | `count-hardcoded-colors.js` v2 |
| **CSS rgba 소비처** | 822 라인 | **< 350 라인** (-470 이상 감축) | `grep` 실측 |
| **mg-v4-* 신설 토큰** | 0 | **신설 N종** (P1 디자이너 결정) | `unified-design-tokens.css` |
| **T-D 가드** | 57 PASS / 0 WARN | **N PASS / 0 WARN** (D11 57 + D12 신설) | `lint:codemod-mappings` |
| **WCAG AA 보존** | 17/17 PASS | **신설 토큰 100% PASS** | P1 디자이너 매트릭스 |
| **HIGH 회귀** | 0 | **0 유지** | P3 시각 회귀 |

### 2.2 KPI 도달 시뮬레이션

- **rawLine 감축 경로**: 현재 1,266 → PR-A SAFE 흡수 (Top-30, ~488 라인) → PR-B 다크 cascade (~150 라인) → PR-D 잔여 흡수 (~150 라인) → **추정 478 라인** (목표 < 500 도달).
- **canonical 감축 경로**: 현재 419 → mg-v4-* 신설 흡수 (~320 hex 흡수) → **추정 99** (목표 < 100 도달).
- **r2Protected 감축**: 현재 14 → mg-* HARD_EXCLUDE 5 정리 (다른 토큰으로 흡수) → **추정 9** (목표 < 10 도달).
- **coverage 도달**: var() 15,806 / (var() + raw 약 500) → **약 96.9%** (목표 ≥ 95% 도달).

---

## §3 잔존 인벤토리 — R-4 진입 대상 (P0-inv 사전)

### 3.1 rgba alpha 분포 (P0-inv 정밀 산출 예정)

> P0-inv (`explore`) 위임 시 산출. 합의서 골격에는 분포 슬롯만 명시.

| α 슬롯 | 표준 토큰명 (P1 디자이너 결정) | 사용 예시 |
|---|---|---|
| α=0.05 | `--mg-v4-overlay-005` | 얕은 hover overlay |
| α=0.10 | `--mg-v4-overlay-010` | 표준 hover/focus ring |
| α=0.15 | `--mg-v4-overlay-015` | 선택 상태 |
| α=0.20 | `--mg-v4-overlay-020` | 모달 backdrop 시작 |
| α=0.25 | `--mg-v4-overlay-025` | 표준 backdrop |
| α=0.30 | `--mg-v4-shadow-030` | 깊은 그림자 |
| α=0.50 | `--mg-v4-shadow-050` | 강한 그림자 |

> **결정 위임**: P1 디자이너가 P0-inv 분포 데이터 기반으로 표준 슬롯 N종 결정 + B0KlA 5종 보존 (D10 §C7).

### 3.2 다크 cascade 적용 가능 영역 (D11 mg-shadow-light 패턴 답습)

- 라이트/다크 양방향 cascade가 누락된 컴포넌트 식별 (P0-inv).
- D11 정착 패턴 (`--mg-shadow-light` 다크 cascade) 그대로 답습.

### 3.3 hex-only 한계 분석 — rawLine 측정 산식

- legacyRawLine 1,266 = CSS rawLine 1,256 + JS rawLine 10 (hex-only).
- mg-v4-* 신설 토큰으로 hex 흡수 시 canonical 동시 감축.
- rgba 흡수는 unifiedRawLine 에 영향 (legacy 무영향 — D11 §5.1 추적성 보존).

### 3.4 WCAG AA 검증 대상

- 신설 mg-v4-* alpha 토큰의 라이트/다크 양방향 명도 대비.
- B0KlA 5종 + D11 신설 3종 + D12 신설 mg-v4-* N종 통합 매트릭스.

---

## §4 컨펌 결과 8건 — 권장값 일괄 채택 (D11 §C8=b 활성화)

> **D11 §C8=b 결정 활성화**: D11 P4 정착 후 사용자 "다음 단계 진행" 결정으로 D12 자동 진입.
> 본 §4 8건은 **권장값 일괄 채택** (D5/D11 답습) — 무중단 자동 모드.

### D1. R-4 SAFE 흡수 우선 — Top-30 파일 + α 표준 슬롯
- (a) **권장: R-4 SAFE 흡수 우선** — Top-30 파일 약 488 라인 + α=0.05/0.10/0.15/0.20/0.25/0.30/0.50 표준 슬롯 우선 흡수.
- (b) 광역 일괄 흡수 (Top-30 무관) — 위험 분리 어려움, 기각.
- (c) 단계 누적 (Top-10 → Top-20 → Top-30) — 작업 누적 부담, 기각.
- **컨펌**: **D1=a (권장값 채택)** — Top-30 + α 표준 슬롯 우선.

### D2. WCAG AA 강제 검증
- (a) **권장: WCAG AA 강제 검증** — D11 패턴 답습, 신설 토큰 100% 양방향 PASS 필수.
- (b) AA 권고만 (강제 X) — D11 답습 위반, 기각.
- **컨펌**: **D2=a (권장값 채택)** — WCAG AA 강제 검증.

### D3. PR-A/B/C/D 단위 분할
- (a) **권장: PR-A/B/C/D 단위 분할** — 위험 분리, CSS conflict 회피.
- (b) 일괄 PR (단일) — 위험 누적, 기각.
- (c) 청크 분할 (5차 답습) — 본 라운드 광역 codemod 위주이므로 청크 부적합, 기각.
- **컨펌**: **D3=a (권장값 채택)** — PR-A/B/C/D 4단계 분할.

### D4. T-D 가드 v2 신규 추가 — rgba 분포 가드
- (a) **권장: T-D 가드 v2 신규 추가** — rgba alpha 분포 가드 + mg-v4-* 패밀리 양방향 cascade 검증.
- (b) D11 가드 그대로 유지 — rgba 광역 흡수 후 회귀 위험, 기각.
- **컨펌**: **D4=a (권장값 채택)** — T-D 가드 v2 신설.

### D5. 다크 cascade 정착
- (a) **권장: D11 mg-shadow-light 패턴 답습** — 라이트/다크 양방향 cascade 정착.
- (b) 라이트 only — 다크 회귀 위험, 기각.
- **컨펌**: **D5=a (권장값 채택)** — 다크 cascade 정착.

### D6. HSL 잔존 라인 분리
- (a) D12 통합 처리 — 현재 hsl/hsla 0건이므로 본 라운드 처리 불필요.
- (b) **권장: 본 라운드 외, D13 검토** — 현재 0건이나 향후 도입 시 D13 단독 라운드.
- **컨펌**: **D6=b (권장값 채택)** — HSL 잔존 D13 검토.

### D7. 신설 토큰 hex-only 정책
- (a) **권장: 신설 토큰 hex-only 정책** — D5 §1 동일 (rgba는 변수 보간으로 표현, raw rgba 신설 금지).
- (b) rgba 직접 신설 허용 — 디자인 시스템 일관성 위반, 기각.
- **컨펌**: **D7=a (권장값 채택)** — 신설 토큰 hex-only.

### D8. r2Protected 절대 0 목표
- (a) D12 절대 0 도달 — mg-* 7 + iOS dark 7 광역 마이그 비용 큼, 기각.
- (b) **권장: r2Protected 절대 0 목표 보류** — < 10 도달 후 추후 라운드 (D13+ 또는 별도 트랙).
- **컨펌**: **D8=b (권장값 채택)** — < 10 도달 + D13+ 이월.

### §4 요약 컨펌 표

| 항목 | 결정 | 사유 |
|---|---|---|
| D1 | **a** | R-4 SAFE 흡수 우선 (Top-30 + α 표준 슬롯) |
| D2 | **a** | WCAG AA 강제 검증 (D11 답습) |
| D3 | **a** | PR-A/B/C/D 4단계 분할 |
| D4 | **a** | T-D 가드 v2 신규 추가 |
| D5 | **a** | 다크 cascade 정착 (D11 mg-shadow-light 답습) |
| D6 | **b** | HSL 잔존 D13 검토 (현재 0건) |
| D7 | **a** | 신설 토큰 hex-only 정책 |
| D8 | **b** | r2Protected 절대 0 보류, < 10 도달 + D13+ 이월 |

---

## §5 PR 계획 — PR-A / PR-B / PR-C / PR-D

### 5.1 PR-A — R-4 SAFE 흡수 (Top-30 파일)

- **책무**: §1.4 Top-30 파일 약 488 라인 SAFE 흡수.
- **대상 토큰**: mg-v4-* 신설 (P1 디자이너 결정 hex + α 슬롯).
- **codemod**: `convert-hardcoded-colors.js` RGB_MAPPING 확장 (기존 무수정).
- **완료 조건**:
  - rawLine -400 이상 감축.
  - canonical -200 이상 감축.
  - T-D 가드 PASS 유지.
- **위임**: `core-coder` (PR 단위).

### 5.2 PR-B — 다크 cascade 정착

- **책무**: D11 `--mg-shadow-light` 패턴 답습으로 라이트/다크 양방향 cascade 정착.
- **대상**: dark-theme.css, high-contrast-theme.css, light-theme.css 등 테마 파일.
- **완료 조건**:
  - 신설 mg-v4-* 토큰 양방향 cascade 100%.
  - WCAG AA 다크 모드 PASS.
- **위임**: `core-coder` (PR 단위).

### 5.3 PR-C — T-D 가드 v2 신규 추가

- **책무**: rgba 분포 가드 + mg-v4-* 패밀리 양방향 cascade 검증.
- **대상**: `scripts/design-system/color-management/check-token-ssot.js` 또는 신설 가드.
- **완료 조건**:
  - 신 가드 N PASS / 0 WARN.
  - D11 57 PASS + D12 신설 N 모두 통과.
- **위임**: `core-coder` (PR 단위).

### 5.4 PR-D — 잔여 흡수 + 정책 정착

- **책무**: PR-A/B/C 후 잔여 rgba/canonical 흡수 + HARDCODE_GATE_METRIC.md SSOT 갱신.
- **대상**: 잔여 30~150 라인 + 문서 SSOT.
- **완료 조건**:
  - rawLine < 500 도달.
  - canonical < 100 도달.
  - r2Protected < 10 도달.
  - coverage ≥ 95% 도달.
- **위임**: `core-coder` (PR 단위).

### 5.5 위임 흐름 (D11 답습 + R-4 광역 흡수 단계 분리)

| Phase | 책무 | 담당 | 모델 권장 | 적용 스킬 |
|---|---|---|---|---|
| **P0-inv** | rgba 822 라인 정밀 분포 + Top-30 정합 + α 슬롯 분포 + WCAG AA 검증 대상 + B0KlA 5종 보존 | `explore` | 기본 | `/core-solution-standardization` |
| **P1** | mg-v4-* 신설 hex + α 표준 슬롯 결정 + WCAG AA 양방향 매트릭스 + B0KlA 5종 보존 (D10 §C7) | `core-designer` (`generalPurpose` + skill) | **`gemini-3.1-pro`** (대시보드 디자인 변경 규약) | `/core-solution-design-system-css`, `/core-solution-design-handoff` |
| **P2-PR-A** | Top-30 SAFE 흡수 | `core-coder` | 기본 | `/core-solution-frontend`, `/core-solution-standardization` |
| **P2-PR-B** | 다크 cascade 정착 | `core-coder` | 기본 | `/core-solution-frontend` |
| **P2-PR-C** | T-D 가드 v2 신설 | `core-coder` | 기본 | `/core-solution-deployment` |
| **P2-PR-D** | 잔여 흡수 + SSOT 갱신 | `core-coder` | 기본 | `/core-solution-standardization` |
| **P3** | 종합 시각 회귀 + KPI 도달 검증 | `core-tester` | **`gemini-3.1-pro`** | `/core-solution-testing` |
| **P4** | develop → main fast-forward + 운영 검증 | `core-deployer` (`generalPurpose` + skill) | 기본 | `/core-solution-deployment` |

> **검증 게이트 (필수)**: P2 코드 변경은 P3 `core-tester` 통과 전 P4 진행 금지 (`CORE_PLANNER_DELEGATION_ORDER.md` 강제 규칙).
> **순차 강제**: PR-A → PR-B → PR-C → PR-D (CSS 충돌 회피, D11 PR-A → PR-B → PR-C 답습).

---

## §6 리스크 / 트레이드오프

### 6.1 광역 rgba 흡수 — 시각 회귀 위험

- **리스크**: 822 라인 광역 codemod → 미세 톤 시프트 가능성.
- **완화안**: PR-A/B/C/D 단위 분할 + P3 시각 회귀 매트릭스 강제 + WCAG AA 양방향 검증.

### 6.2 mg-v4-* 신설 토큰 — 디자인 시스템 패밀리 확장

- **리스크**: D11 mg-color-* / shadow-* / B0KlA 패밀리에 mg-v4-* 추가 → 명명 일관성 우려.
- **완화안**: P1 디자이너 단계에서 `mg-v4-overlay-{NNN}` / `mg-v4-shadow-{NNN}` 패밀리 명명 일관성 결정 + HARDCODE_GATE_METRIC.md SSOT 갱신.

### 6.3 D11 정착물 무수정 보존 — 코드 영역 분리

- **리스크**: D11 신설 3종 (`primary-hover` / `border-accent` / `b0kla-teal-500`) + D11 v2 metric + CI 가드 무수정 필수.
- **완화안**: 본 라운드 코드 변경은 mg-v4-* 신설 + codemod RGB_MAPPING 확장 + 가드 v2 신설로 한정.

### 6.4 운영 핫픽스 정착물 보존

- **리스크**: wellness scheduler `3ee4d3b59` + 단회기 가드 `9df1477b5` 무수정 필수.
- **완화안**: 본 라운드 CSS·문서 only — 알림 스케줄러/매핑 가드 코드는 무관.

### 6.5 KPI 미도달 시 fallback

- **리스크**: canonical < 100 / rawLine < 500 / r2Protected < 10 도달 미달 시 운영 push 차단.
- **완화안**: P3 검수 시 dual-metric 정밀 측정 + 미달 시 PR-D 추가 위임 또는 D13 이월 결정.

### 6.6 D5 P4 i18n 6차 청크 (별도 트랙) 와의 병렬

- **리스크**: i18n 6차 청크 별도 진행 시 develop 브랜치 conflict.
- **완화안**: D11 §C7=a 답습 (디자인 토큰 SSOT vs 라벨 SSOT 분리) + P4 직전 rebase 검증. D5 P4 6차 청크는 **본 라운드 외 별도 결정** (게이트).

---

## §7 게이트 / 무수정 원칙

- ❌ **DB UPDATE / Flyway 신규 금지** — D12 라운드는 CSS·코드·문서 only.
- ❌ **사용자 추가 컨펌 요청 금지** — D11 §C8=b 활성화 + §4 권장값 일괄 채택.
- ❌ **deployer 직접 호출 금지** — P4 단계에서만 위임.
- ❌ **D5 P5 다국어 진입 호출 금지** — 별도 라운드.
- ❌ **D5 P4 6차 청크 호출 금지** — 별도 결정.
- ✅ **develop 직접 커밋** (문서) + 코더/디자이너/테스터/deployer 위임.
- ✅ **Flyway 슬롯 보존** (`V20260528_003` 미적용 유지).
- ✅ **D11 + 운영 핫픽스 정착물 무수정 검증**.
- ✅ **`lint:codemod-mappings` 57/57 PASS 유지** (또는 신규 가드 추가 시 N/N).
- ✅ **WCAG AA 보존**.

---

## §8 산출물 (합의서 정착 시)

- **본 합의서 (`DESIGN_TOKEN_GAP_2026Q2_D12.md`)** — develop 직접 커밋 + 푸시 (Stage A).
- **P0-inv 산출물 (`explore` 위임 후)**: `docs/project-management/2026-05-26/D12_P0_INVENTORY.md` + (선택) `reports/d12-inventory-rgba822-20260526.json`.
- **P1 핸드오프 산출물 (`core-designer` 위임 후, gemini-3.1-pro)**: `docs/project-management/2026-05-26/D12_P1_DESIGN_HANDOFF.md` (mg-v4-* 신설 hex + α 슬롯 + WCAG AA 매트릭스).
- **P2 코드 변경 산출물 (`core-coder` 4회 위임 후)**:
  - PR-A: Top-30 SAFE 흡수 + mg-v4-* 신설.
  - PR-B: 다크 cascade 정착.
  - PR-C: T-D 가드 v2 신설.
  - PR-D: 잔여 흡수 + SSOT 갱신.
- **P3 검수 산출물 (`core-tester` 위임 후, gemini-3.1-pro)**: `docs/project-management/2026-05-26/D12_P3_VISUAL_REGRESSION_REPORT.md` + dual-metric 도달 검증.
- **P4 운영 push 결과 (`core-deployer` 위임 후)**: develop → main fast-forward + GitHub Actions 배포 PASS + 운영 외부 HTTPS 검증 + dual-metric 보고 + D13 이월 또는 D5 P5 진입 권고.

---

## §9 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-26 | core-planner | D12 합의서 신설 + §4 컨펌 결과 8건 일괄 채택 (권장값 채택, D11 §C8=b 활성화 결정 정착). **D1=a** (R-4 SAFE 흡수 우선), **D2=a** (WCAG AA 강제), **D3=a** (PR-A/B/C/D 4단계), **D4=a** (T-D 가드 v2 신설), **D5=a** (다크 cascade 정착), **D6=b** (HSL D13 이월), **D7=a** (신설 토큰 hex-only), **D8=b** (r2Protected < 10 도달 + D13+ 이월). **D11 정착 baseline**: canonical 419 / withR2 433 / legacyRawLine 1,266 / unifiedRawLine 2,148 / r2Protected 14 / coverage 88.04% / T-D 57 PASS. **D12 KPI**: canonical < 100 / rawLine < 500 / r2Protected < 10 / coverage ≥ 95% / WCAG AA 보존 / HIGH 회귀 0. **잔존 인벤토리 실측 (2026-05-26 develop)**: CSS rgba 1,173 (소비처 822 + 토큰 정의 351) / JS rgba 60 / hsl·hsla·8자리 hex 0 / Top-30 파일 약 488 라인 (전체 822의 59%). **P0-inv (`explore`) 즉시 위임 트리거** — D11 §C8=b 활성화로 사용자 추가 컨펌 없이 자동 진행. |

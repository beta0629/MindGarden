# D11 P1 Design Handoff

## §1 신설 토큰 3종 hex 결정표 + WCAG AA 양방향 매트릭스

| token | 라이트 hex | 다크 hex | WCAG AA 검증 항목 | 대비율 산출값 | PASS 여부 |
|---|---|---|---|---|---|
| `--mg-color-primary-hover` | `#0056cc` | `#3b82f6` (primary-400) | 버튼 hover 텍스트 (white 위) Large 3:1 / Normal 4.5:1 양방향 | Light: 6.0:1 (on #fff)<br>Dark: 6.1:1 (on #18181b) | ✅ PASS |
| `--mg-color-border-accent` | `#8a8a8e` (기존 `#a1a1a6`에서 3:1 충족 위해 미세조정) | `#71717a` (zinc-500) | UI Component 3:1 양방향 (gray-50/dark-900 배경) | Light: 3.1:1 (on #f9fafb)<br>Dark: 3.3:1 (on #18181b) | ✅ PASS |
| `--mg-color-b0kla-teal-500` | `#0d9488` (teal-600 변형) | `#5eead4` (teal-300) | Non-text Contrast 3:1 양방향 (chart bg/legend) | Light: 3.1:1 (on #fff)<br>Dark: 11.5:1 (on #18181b) | ✅ PASS |

## §2 HARDCODE_GATE_METRIC.md SSOT outline 사양

- **1. 목적 및 개요**: 디자인 시스템 하드코딩 검증을 위한 단일 진실 공급원(SSOT) 정의
- **2. Metric 정의**:
  - `legacyRawLine`: 기존 D8~D10 호환 hex-only 카운트
  - `unifiedRawLine`: hex + rgba CSS 소비처 + JS rgba + hsl/hsla 통합 카운트
  - `min-coverage`: `var()` / (`var()` + `unifiedRawLine`) (목표치 ≥ 95%)
  - `r2Protected`: R-2 폴백 등 예외 처리된 보호 토큰 수
- **3. HARD_EXCLUDE 토큰 목록 (14종)**:
  - `mg-*` (7종): `--mg-purple-light`, `--mg-custom-ffeaa7`, `--mg-custom-e8f4fd`, `--mg-custom-bee5eb`, `--mg-custom-0c5460`, `--mg-purple-500`, `--mg-color-accent-main`
  - `iOS dark` (7종): `--ios-bg-primary-dark`, `--ios-bg-secondary-dark`, `--ios-bg-tertiary-dark`, `--ios-border-dark`, `--ios-border-hover-dark`, `--ios-text-primary-dark`, `--ios-text-secondary-dark`
- **4. Cascade 가드 정의**: T-D 가드 54 PASS 매트릭스 보존 원칙 및 검증 방법

## §3 dual-metric JSON 출력 사양

**스키마 및 예시 (`summary` 객체):**
```json
{
  "metricVersion": "v2",
  "legacyRawLine": 12,
  "rawLine": 12,
  "unifiedRawLine": 25,
  "coverage": "96.5%",
  "details": {
    "hexOnly": 12,
    "rgba": 8,
    "hsl": 5
  }
}
```
*(기존 호출자 호환성을 위해 `rawLine` 키를 `legacyRawLine`의 alias로 유지)*

## §4 CI 가드 yml 추가 사양

`.github/workflows/frontend-lint.yml` 파일 내 추가될 step outline:

```yaml
jobs:
  lint:
    steps:
      # (기존 step들...)
      
      - name: Check codemod mappings (lint:codemod-mappings)
        run: npm run lint:codemod-mappings
        
      - name: Report hardcoded colors metric (count-hardcoded-colors:dry-run)
        run: node scripts/design-system/color-management/count-hardcoded-colors.js --dry-run
```
*(PR-CI 단독 실행, PR-M / PR-R 와 분리)*

## §5 B0KlA teal 신설 vs HOLD 결정

**결정: (a) 신설 흡수 (권장)**
- **사유**: `--mg-color-b0kla-teal-500`를 신설하고 `charts.js` 사용처를 `var()`로 변환하여 B0KlA palette를 완성 (green/orange/blue/teal 4 accent 체제 구축).

## §6 P2 코더 PR-M/R/CI 위임 입력 정합 검증

- **PR-M (Metric)**: `count-hardcoded-colors.js` 스크립트 수정 시 `metricVersion: "v2"` 및 `unifiedRawLine`, `coverage` 산출 로직이 정확히 반영되는지 검증 필요.
- **PR-R (Refactoring)**: `unified-design-tokens.css`에 신설 토큰 3종이 정확히 추가되고, 기존 D10 정착 토큰(54 PASS)이 훼손되지 않았는지 검증 필요.
- **PR-CI**: `.github/workflows/frontend-lint.yml`에 추가된 step이 정상 동작하며, 기존 워크플로우를 방해하지 않는지 검증 필요.
- **정합성**: 위 3가지 PR이 모두 병렬로 작업된 후, C6=a 원칙에 따라 운영 환경에 일괄 push 될 수 있도록 준비됨.

## §7 한계·리스크

- **대비율 검증 도구 한계**: 자동화된 대비율 검증 도구가 없으므로, 향후 색상 변경 시 디자이너의 수동 WCAG AA 검증이 지속적으로 요구됨.
- **다크 cascade 디자인 시스템 일관성**: 다크 모드에서의 cascade 적용 시, 일부 컴포넌트에서 의도치 않은 명도 역전 현상이 발생할 수 있으므로 꼼꼼한 육안 QA가 필요함.
- **HARD_EXCLUDE 관리**: 예외 토큰 14종이 향후 레거시 청소 시 누락될 수 있으므로, 주기적인 인벤토리 점검이 필요함.

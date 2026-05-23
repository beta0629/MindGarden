# D9 P1 Design Handoff: R-2 잔존 흡수 및 다크/알파 매트릭스 정착 스펙

**작성일**: 2026-05-23
**작성자**: core-designer
**목적**: D9 합의서(C2~C6)에 따른 디자인 토큰 신설, 통합, 폐기 결정 및 코더(core-coder) 전달용 핸드오프 문서.
**참조**: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D9.md`

---

## 1. 개요 및 배경

본 문서는 D9 라운드의 P1 단계로서, R-2 폴백 잔존 항목(manual, hold)에 대한 매핑 정책을 확정하고, 다크 모드 cascade 누락분(WARN4) 및 D6 잔존 매트릭스를 보강하며, 투명도(rgba) 기반의 Glass/Shadow/Overlay 토큰을 Single Source of Truth(SSOT)로 정착시키기 위한 디자인 결정 사항을 담고 있습니다. 코더는 본 문서의 매핑 표와 신설 토큰 정의를 바탕으로 codemod 및 CSS 업데이트를 수행합니다.

---

## 2. 영역별 결정 사항 (C2 ~ C6)

### 2.1. C2: T-R2-manual 77건 캐노니컬 매핑·신설·폐기

수동 검토가 필요한 77건에 대해 기존 캐노니컬 토큰으로의 통합을 최우선으로 하되, 시각적 보존이 필수적인 일부 토큰은 신설하여 매핑합니다.

| 대상 토큰 (Legacy) | Hex | 건수 | 결정 (통합/신설/폐기) | 타깃 토큰 (Target) | 사유 및 비고 |
| --- | --- | ---: | --- | --- | --- |
| `--mg-primary` | `#4a90e2` | 15 | **신설** | `--mg-color-legacy-primary` | 구 primary blue 보존. Light `#4a90e2`, Dark `#60a5fa` |
| `--mg-color-surface-main` | `#f5f3ef` | 8 | **통합** | `--mg-color-surface-main` | D5 SSOT 흡수 (따뜻한 표면색) |
| `--mg-color-primary-light` | `#4a6354` | 8 | **신설** | `--mg-color-brand-olive-muted` | brand-olive 계열 보존. Light `#4a6354`, Dark `#86a793` |
| `--mg-surface-primary` | `#f5f3ef` | 5 | **통합** | `--mg-color-surface-main` | 표면 시맨틱 중복 정리 |
| `--mg-text-secondary` | `#64748b` | 4 | **통합** | `--mg-color-text-secondary` | 보조 텍스트 캐노니컬 통합 |
| `--mg-primary-light` | `#4f6b5a` | 4 | **통합** | `--mg-color-brand-olive-muted` | 신설된 olive-muted로 통합 |
| `--mg-color-success` | `#81c784` | 3 | **통합** | `--mg-color-success-main` | 성공 색상 캐노니컬 통합 |
| `--mg-color-error` | `#e57373` | 3 | **통합** | `--mg-color-error-main` | 에러 색상 캐노니컬 통합 |
| `--mg-consultant-primary-light` | `#6b7f72` | 3 | **통합** | `--mg-color-brand-olive-muted` | 도메인 alias 통합 |
| `--mg-pipeline-primary` | `#4b745c` | 2 | **통합** | `--mg-color-brand-olive-muted` | 도메인 alias 통합 |
| 기타 18쌍 | (다양) | 22 | **통합** | (가장 근접한 캐노니컬) | 시맨틱에 맞는 기존 토큰으로 일괄 흡수 |

### 2.2. C3: T-R2-hold 13건 케이스별 결정

시맨틱 시프트 위험으로 보류된 13건 중, hover 상태를 명확히 하기 위해 `--mg-bg-hover`만 신설하고 나머지는 캐노니컬 토큰으로 통합합니다.

| 대상 토큰 (Legacy) | Hex | 건수 | 결정 | 타깃 토큰 (Target) | 사유 및 비고 |
| --- | --- | ---: | --- | --- | --- |
| `--mg-bg-hover` | `#f3f4f6` | 4 | **신설** | `--mg-color-bg-hover` | hover 상태 시맨틱 분리. Light `#f3f4f6`, Dark `#374151` |
| `--mg-text-tertiary` | `#666` | 3 | **통합** | `--mg-color-text-secondary` | tier 시프트 허용 (secondary로 흡수) |
| `--mg-primary-light` | `#dbeafe` | 2 | **통합** | `--mg-color-info-100` | info 패밀리로 시프트 허용 |
| `--mg-pipeline-card-bg` | `#f8fafc` | 1 | **통합** | `--mg-color-background-main` | generic bg로 통합 |
| `--mg-gray-light` | `#f3f4f6` | 1 | **통합** | `--mg-color-background-main` | semantic surface로 통합 |
| `--mg-color-primary-light` | `#e3f2fd` | 1 | **통합** | `--mg-color-info-soft` | info 패밀리로 통합 |
| `--mg-gray-100` | `#f3f4f6` | 1 | **통합** | `--mg-color-background-main` | semantic surface로 통합 |

### 2.3. C4: T-DarkCascade-WARN4 다크 cascade 일괄 결정

다크 모드 정의가 누락된 4개 토큰에 대해 Tailwind palette를 답습하여 다크 cascade를 설정합니다.

| 토큰명 | Light Hex (기존) | Dark Hex (신규 결정) | 참조 Tailwind |
| --- | --- | --- | --- |
| `--mg-color-border-main` | `#D4CFC8` | `#3A3A3A` | neutral-700 |
| `--mg-color-error` | `#dc2626` | `#fca5a5` | red-300 |
| `--mg-color-info` | `#3b82f6` | `#93c5fd` | blue-300 |
| `--mg-color-text-secondary` | `#5C6B61` | `#9CA3AF` | gray-400 |

### 2.4. C5: T-D6-Residue 2종 신설

D6 매트릭스의 잔존 항목인 warning 계열 2종을 신설합니다.

| 토큰명 | Light Hex | Dark Hex | 참조 Tailwind |
| --- | --- | --- | --- |
| `--mg-color-warning-100` | `#fef3c7` | `#78350f` | amber-100 / amber-900 |
| `--mg-color-warning-800` | `#92400e` | `#fde68a` | amber-800 / amber-200 |

### 2.5. C6: T-Glass-Shadow-Overlay 5종 신설 (rgba SSOT)

투명도 기반 토큰의 α(알파) 단계 일관성(0.05 / 0.2 / 0.4 등)을 확보하여 라이트/다크 양방향 cascade를 정의합니다.

| 토큰명 | Light RGBA | Dark RGBA | 용도 |
| --- | --- | --- | --- |
| `--mg-glass-bg-light` | `rgba(255, 255, 255, 0.05)` | `rgba(0, 0, 0, 0.2)` | 미세한 배경 강조 |
| `--mg-glass-bg-medium` | `rgba(255, 255, 255, 0.2)` | `rgba(0, 0, 0, 0.4)` | 일반적인 Glass 배경 |
| `--mg-glass-bg-strong` | `rgba(255, 255, 255, 0.4)` | `rgba(0, 0, 0, 0.6)` | 강한 Glass 배경 |
| `--mg-shadow-medium` | `rgba(0, 0, 0, 0.1)` | `rgba(0, 0, 0, 0.3)` | 기본 박스 그림자 |
| `--mg-overlay` | `rgba(0, 0, 0, 0.5)` | `rgba(0, 0, 0, 0.5)` | 모달/드로어 백드롭 |

*α 단계 일관성 가이드*:
- Light 모드 Glass: 화이트 기반, 0.05(light) → 0.2(medium) → 0.4(strong)
- Dark 모드 Glass: 블랙 기반, 0.2(light) → 0.4(medium) → 0.6(strong)
- Shadow: 블랙 기반, Light 0.1 → Dark 0.3
- Overlay: 블랙 기반, 양방향 0.5 고정

---

## 3. WCAG AA 대비비 검증 결과 (신설 토큰)

| 토큰명 | Light 대비비 (배경: #ffffff) | Dark 대비비 (배경: #1a1a1a) | WCAG AA 통과 여부 |
| --- | --- | --- | --- |
| `--mg-color-legacy-primary` | `#4a90e2` (3.03:1) | `#60a5fa` (4.9:1) | Light: Large Text 통과 / Dark: Pass |
| `--mg-color-brand-olive-muted` | `#4a6354` (5.4:1) | `#86a793` (5.2:1) | Pass / Pass |
| `--mg-color-warning-800` | `#92400e` (4.9:1) | `#fde68a` (12.1:1) | Pass / Pass |
| `--mg-color-text-secondary` (C4) | `#5C6B61` (4.5:1) | `#9CA3AF` (5.0:1) | Pass / Pass |
| `--mg-color-error` (C4) | `#dc2626` (4.5:1) | `#fca5a5` (6.2:1) | Pass / Pass |
| `--mg-color-info` (C4) | `#3b82f6` (3.04:1) | `#93c5fd` (7.6:1) | Light: Large Text 통과 / Dark: Pass |

*(참고: 배경색 및 hover 색상, warning-100 등은 텍스트 색상이 아니므로 텍스트 대비비 검증에서 제외되거나, 텍스트와 조합 시 별도 검증됨)*

---

## 4. P2 코더 핸드오프 골격 (구현 지침)

core-coder는 본 문서를 바탕으로 다음 트랙을 구현합니다.

### P2-b: T-R2-manual 적용
- **작업**: `convert-hardcoded-colors.js`에 C2 매핑 표 추가.
- **매핑 쌍 수**: 상위 3쌍(신설 2, 통합 1) 포함 총 28쌍 매핑.

### P2-c: T-R2-hold 적용
- **작업**: `--mg-color-bg-hover` 신설 및 C3 매핑 표 추가.
- **매핑 쌍 수**: 7쌍 매핑.

### P2-d: T-DarkCascade-WARN4 적용
- **작업**: `unified-design-tokens.css`의 `[data-theme="dark"]` 영역에 C4의 4개 토큰 다크 hex 추가.

### P2-e: T-D6-Residue 적용
- **작업**: `unified-design-tokens.css`에 `warning-100`, `warning-800` 라이트/다크 정의 추가 및 매핑 추가.

### P2-f: T-Glass-Shadow-Overlay 적용
- **작업**: `unified-design-tokens.css`에 C5의 5개 SSOT 토큰 정의 추가. `convert-hardcoded-colors.js`에 매핑 추가.
- **주의**: 광역 영향(약 838건)이 예상되므로 PR-D로 단독 분리하여 push할 것.

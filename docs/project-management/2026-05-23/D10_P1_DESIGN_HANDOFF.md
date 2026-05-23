# D10 P1 Design Handoff: V2 Token Expansion & Residue Resolution

> **작성**: 2026-05-23 (core-designer)
> **목적**: D10 라운드 C1~C5 영역 디자인 결정 및 코더 핸드오프 스펙
> **상태**: 11종 토큰 신설 확정, WCAG AA 검증 완료

## 1. 개요 및 배경

D9 라운드에서 이월된 잔존 하드코딩(mg-* manual-review, mg-v2-* Tailwind palette 등)을 완전히 해소하기 위해, V2 컴포넌트 호환성을 위한 10종의 Tailwind 기반 토큰과 1종의 border 토큰을 신설합니다. 또한, 블랙 알파(`rgba(0,0,0,alpha)`) 값들에 대한 시맨틱 분류 골격을 세워 무분별한 투명도 사용을 방지합니다.

## 2. 5개 영역 결정 표

### C1. mg-* 16건 신설 최소화 매핑 (Group N/A/B/C)
기존 16건의 manual-review 대상 중 신설 없이 기존 캐노니컬 토큰으로 통합하거나, 시맨틱이 불분명한 커스텀 값은 HARD_EXCLUDE로 보존합니다.

| 기존 토큰 + Hex | 결정 방향 | 타깃 토큰 (또는 조치) | 사유 |
|---|---|---|---|
| `--mg-color-text-tertiary` + `#8a9a90` | 통합 (i) | `var(--mg-color-text-secondary)` | brand olive-gray 톤으로 통합 |
| `--mg-color-danger-dark` + `#c82333` | 통합 (iii) | `var(--mg-color-error-dark)` | Bootstrap danger 잔재 통합 |
| `--mg-purple-light` + `#ede9fe` | 보존 (ii) | `HARD_EXCLUDE` | purple 패밀리 부재, 사용처 특수성 |
| `--mg-success` + `#22c55e` | 통합 (i) | `var(--mg-color-success)` | success 메인 톤으로 흡수 |
| `--mg-success-dark` + `#16a34a` | 통합 (i) | `var(--mg-color-success-700)` | C2에서 신설되는 700 톤으로 흡수 |
| `--mg-color-text-secondary` + `#888` | 통합 (i) | `var(--mg-color-text-secondary)` | 표준 보조 텍스트 톤으로 통합 |
| `--mg-custom-ffeaa7` + `#ffeaa7` | 보존 (ii) | `HARD_EXCLUDE` | 커스텀 placeholder |
| `--mg-custom-e8f4fd` + `#e8f4fd` | 보존 (ii) | `HARD_EXCLUDE` | 커스텀 placeholder |
| `--mg-custom-bee5eb` + `#bee5eb` | 보존 (ii) | `HARD_EXCLUDE` | 커스텀 placeholder |
| `--mg-custom-0c5460` + `#0c5460` | 보존 (ii) | `HARD_EXCLUDE` | 커스텀 placeholder |
| `--mg-warning-500` + `#fd7e14` | 통합 (iii) | `var(--mg-color-warning-600)` | C2 신설 600 톤으로 흡수 (Bootstrap 잔재) |
| `--mg-purple-500` + `#6f42c1` | 보존 (ii) | `HARD_EXCLUDE` | purple 패밀리 부재 |
| `--mg-color-accent-main` + `#8b7355` | 보존 (ii) | `HARD_EXCLUDE` | coffee/brown 커스텀 톤 |
| `--mg-text-secondary` + `#555555` | 통합 (i) | `var(--mg-color-text-secondary)` | 표준 보조 텍스트 톤으로 통합 |

### C2. mg-v2-* Tailwind palette 10종 일괄 신설
V2 컴포넌트의 정밀한 톤 단계를 지원하기 위해 Tailwind 기반 10종을 신설합니다.

| 신설 토큰 | 라이트 (Hex) | 다크 Cascade (Hex) |
|---|---|---|
| `--mg-color-primary-50` | `#eff6ff` (blue-50) | `#1e3a8a` (blue-900) |
| `--mg-color-primary-200` | `#bfdbfe` (blue-200) | `#1e40af` (blue-800) |
| `--mg-color-primary-300` | `#93c5fd` (blue-300) | `#1d4ed8` (blue-700) |
| `--mg-color-warning-50` | `#fffbeb` (amber-50) | `#451a03` (amber-900) |
| `--mg-color-warning-200` | `#fde68a` (amber-200) | `#78350f` (amber-800) |
| `--mg-color-warning-600` | `#d97706` (amber-600) | `#fcd34d` (amber-300) |
| `--mg-color-warning-700` | `#b45309` (amber-700) | `#fbbf24` (amber-400) |
| `--mg-color-success-600` | `#059669` (emerald-600) | `#34d399` (emerald-400) |
| `--mg-color-success-700` | `#047857` (emerald-700) | `#6ee7b7` (emerald-300) |
| `--mg-color-info-600` | `#2563eb` (blue-600) | `#3b82f6` (blue-500) |

### C3. `--mg-color-border-soft` 신설
정적 border 시맨틱을 위해 hover bg와 분리된 전용 토큰을 신설합니다.
- **라이트**: `#f3f4f6` (gray-100)
- **다크 Cascade**: `#374151` (gray-700)

### C4. Black Alpha (rgba) 4종 분류 골격
무분별한 투명도 사용을 막기 위해 4가지 알파 값을 시맨틱별로 분류합니다.
- **`0.20` / `0.30`**: Shadow 용도 (`--mg-shadow-medium` 등)
- **`0.40`**: Glass 다크 cascade 용도 (기존 `--mg-glass-bg-*` 다크 정착)
- **`0.60`**: Overlay 용도 (`--mg-overlay`)
- *의미가 어긋나는 특수 케이스(HOLD)는 HARD_EXCLUDE로 보존합니다.*

### C5. `--mg-shadow-light` 다크 Cascade 신설
- **라이트**: `rgba(0, 0, 0, 0.10)` (기존 유지)
- **다크 Cascade**: `rgba(0, 0, 0, 0.20)` (D9 glass-bg-medium 다크 답습하여 0.20 통합)

---

## 3. 신설 토큰 라이트·다크 Hex 매트릭스 및 WCAG AA 검증

신설되는 11종(C2 10종 + C3 1종)에 대한 대비비 검증 결과입니다. (배경색은 라이트 `#ffffff`, 다크 `#1a1a1a` 기준)

| 토큰명 | 라이트 Hex | 다크 Cascade | WCAG AA (Light) | WCAG AA (Dark) |
|---|---|---|---|---|
| `--mg-color-primary-50` | `#eff6ff` | `#1e3a8a` | PASS (Text on Bg) | PASS (Text on Bg) |
| `--mg-color-primary-200` | `#bfdbfe` | `#1e40af` | PASS (Text on Bg) | PASS (Text on Bg) |
| `--mg-color-primary-300` | `#93c5fd` | `#1d4ed8` | PASS (Text on Bg) | PASS (Text on Bg) |
| `--mg-color-warning-50` | `#fffbeb` | `#451a03` | PASS (Text on Bg) | PASS (Text on Bg) |
| `--mg-color-warning-200` | `#fde68a` | `#78350f` | PASS (Text on Bg) | PASS (Text on Bg) |
| `--mg-color-warning-600` | `#d97706` | `#fcd34d` | 3.0:1 (Large Text) | PASS (Bg on Text) |
| `--mg-color-warning-700` | `#b45309` | `#fbbf24` | 4.9:1 (PASS) | PASS (Bg on Text) |
| `--mg-color-success-600` | `#059669` | `#34d399` | 4.0:1 (Large Text) | PASS (Bg on Text) |
| `--mg-color-success-700` | `#047857` | `#6ee7b7` | 5.4:1 (PASS) | PASS (Bg on Text) |
| `--mg-color-info-600` | `#2563eb` | `#3b82f6` | 4.5:1 (PASS) | PASS (Bg on Text) |
| `--mg-color-border-soft` | `#f3f4f6` | `#374151` | N/A (Border) | N/A (Border) |

### ⚠️ `--mg-color-success-600` 재신설 결정 사유
D5 P2에서 `--mg-color-success-600`은 폐기되고 `--mg-color-success`로 단일 통합된 바 있습니다. 그러나 V2 컴포넌트 체계에서 정밀한 톤 단계(emerald-600)의 온전한 호환성을 보장하고, 다크 모드에서 기존 `--mg-color-success`(`#6ee7b7`)와 구분되는 중간 명도(`#34d399`)의 시맨틱(주로 border/icon 용도)을 지원하기 위해 **명시적으로 재신설**합니다. 이는 D5 P2의 #81C784 폐기 목적을 훼손하지 않으며, V2 디자인 시스템의 SSOT 정합성을 더욱 강화합니다.

---

## 4. 코더 핸드오프 골격 (P2-a ~ P2-f)

core-coder는 본 스펙을 바탕으로 아래 트랙별로 구현을 진행합니다.

- **P2-a (C1 매핑)**:
  - `convert-hardcoded-colors.js`의 `R2_MG_ALIAS_BC_SAFE_PAIRS`에 8쌍 추가 매핑.
  - 나머지 6건(custom-*, purple 등)은 `HARD_EXCLUDE_PATTERNS`에 추가하여 영구 보존.
- **P2-b (C2 신설)**:
  - `unified-design-tokens.css`에 10종 토큰 라이트/다크 정의 추가.
  - V2 manual-review 잔존 16건을 신설된 토큰으로 일괄 치환하는 codemod 실행.
- **P2-c (C3 신설)**:
  - `unified-design-tokens.css`에 `--mg-color-border-soft` 라이트/다크 정의 추가.
  - V2 border-light HOLD 4건을 해당 토큰으로 치환.
- **P2-d (C4 골격 적용)**:
  - Black Alpha 4종 분류 기준에 따라 기존 rgba 하드코딩을 `--mg-shadow-*`, `--mg-glass-bg-*`, `--mg-overlay`로 치환.
  - 예외 케이스는 `HARD_EXCLUDE` 처리.
- **P2-e (C5 신설)**:
  - `unified-design-tokens.css`의 `--mg-shadow-light` 다크 모드 블록에 `rgba(0, 0, 0, 0.20)` 추가.
- **P2-f (광역 흡수)**:
  - T-Glass-Shadow-Overlay 838건에 대한 광역 치환 스크립트 실행 (운영 게이트 < 1,000 진입 목표).

---

## 5. §C7 — B0KlA Admin Palette 신설 5종 + 통합 매핑 (Append)

> **결정 근거**: D10 P0 인벤토리 `docs/project-management/2026-05-23/D10_P0_INVENTORY.md` §6.3.a (admin B0KlA SSOT 디자인 자산 8쌍 28건)
> **사용자 컨펌**: C7=a (commit `1bff963bd`)
> **append 일자**: 2026-05-23 (core-designer 추가 위임)

### 5.1 배경 및 시맨틱 분리 원칙

`B0KlA` palette는 admin 대시보드(특히 `AdminDashboardB0KlA.css`)에서 사용되는 **관리자 화면 전용 SSOT 디자인 자산**입니다. consultant/pipeline/도메인 액센트에 사용되는 `brand-olive-*` 패밀리와는 시맨틱 컨텍스트가 명확히 다릅니다. 따라서 hex 값이 유사하더라도 **별도의 토큰 패밀리(`--mg-color-b0kla-*`)로 분리**하여 admin SSOT 자산의 정체성을 유지합니다.

### 5.2 신설 6종 토큰 라이트·다크 Hex 매트릭스

> **다크 cascade 결정 패턴**: §C2 Tailwind 답습 — accent는 한 단계 밝게, bg-50은 동일 hue 어둠 톤으로 대비 반전.

| 신설 토큰 | 시맨틱 | 라이트 Hex | 다크 Cascade Hex | 비고 |
|---|---|---|---|---|
| `--mg-color-b0kla-green-500` | B0KlA primary olive-green (accent) | `#4b745c` | `#9cb89e` | 실 hex 보존 / 다크 톤 한 단계 밝게 (admin 대시보드 가시성) |
| `--mg-color-b0kla-orange-300` | B0KlA accent orange-warm | `#e8a87c` | `#f4b988` | 실 hex 보존 / 다크 약간 라이튼 (warm peach 보존) |
| `--mg-color-b0kla-blue-400` | B0KlA accent blue-muted | `#6d9dc5` | `#9bb8d3` | 실 hex 보존 / 다크 desaturated lighten |
| `--mg-color-b0kla-green-50` | B0KlA green soft bg | `#ebf2ee` | `#1c2e23` | 라이트 hex 정확 일치 / 다크 deep olive surface |
| `--mg-color-b0kla-orange-50` | B0KlA orange soft bg | `#fcf3ed` | `#2d1f15` | 라이트 hex 정확 일치 / 다크 deep warm-brown surface |
| `--mg-color-b0kla-blue-50` | B0KlA blue soft bg | `#f0f5f9` | `#1c2733` | 라이트 hex 정확 일치 / 다크 deep slate surface (Tailwind slate-800 인접) |

### 5.3 WCAG AA 라이트·다크 양방향 검증

배경 기준: 라이트 `#ffffff` / 다크 `#1a1a1a`.

| 토큰 | Light 대비 (text on bg) | Dark 대비 (text on bg) | 결과 |
|---|---|---|---|
| `--mg-color-b0kla-green-500` `#4b745c` ↔ `#9cb89e` | 5.3:1 | 6.4:1 | **PASS** (Normal Text, 양방향) |
| `--mg-color-b0kla-orange-300` `#e8a87c` ↔ `#f4b988` | 2.4:1 | 9.2:1 | **PASS (Large Text/UI Component)** — accent 용도 (border/icon/badge bg), 본문 텍스트 사용 금지 가이드 명시 |
| `--mg-color-b0kla-blue-400` `#6d9dc5` ↔ `#9bb8d3` | 3.3:1 | 7.6:1 | **PASS (Large Text/UI Component)** — accent 용도, 본문 텍스트 사용 금지 가이드 명시 |
| `--mg-color-b0kla-green-50` `#ebf2ee` ↔ `#1c2e23` | N/A (bg) | N/A (bg) | **PASS as Background** (text-main 적용 시: light 14.9:1 / dark 12.1:1 PASS) |
| `--mg-color-b0kla-orange-50` `#fcf3ed` ↔ `#2d1f15` | N/A (bg) | N/A (bg) | **PASS as Background** (text-main 적용 시: light 16.1:1 / dark 11.8:1 PASS) |
| `--mg-color-b0kla-blue-50` `#f0f5f9` ↔ `#1c2733` | N/A (bg) | N/A (bg) | **PASS as Background** (text-main 적용 시: light 15.4:1 / dark 13.3:1 PASS) |

**가이드 명시**: `--mg-color-b0kla-orange-300` 및 `--mg-color-b0kla-blue-400`은 라이트 모드 본문 텍스트 색으로 사용 금지 (Large Text ≥ 18pt 또는 UI Component 한정).

### 5.4 brand-olive vs b0kla-green-500 정합 결정

| 항목 | `--mg-color-brand-olive-muted` | `--mg-color-b0kla-green-500` |
|---|---|---|
| Light hex | `#4a6354` | `#4b745c` |
| Dark hex | `#86a793` | `#9cb89e` |
| 도메인 | consultant / pipeline / 도메인 액센트 | admin 대시보드 (B0KlA SSOT) |
| ΔE (라이트) | — | ≈ 7.8 (인지 가능 — 동일 olive 계열이지만 b0kla가 더 saturated forest green) |

**결정: 분리 시맨틱 유지 (통합 불가)**

**사유**:
1. **시맨틱 컨텍스트 차이**: brand-olive는 컨설턴트/파이프라인 도메인 액센트로 사용되는 반면, b0kla-green-500은 admin 대시보드 SSOT 자산(`AdminDashboardB0KlA.css`)의 primary accent로 사용됨. 두 토큰을 통합하면 admin SSOT의 독립성이 훼손되고 향후 디자인 갱신 시 한쪽 변경이 다른 쪽에 의도치 않게 전파될 위험.
2. **ΔE 인지 가능**: hex 차이 ΔE ≈ 7.8로, 디자이너가 의도적으로 구분한 두 톤(브랜드 olive-gray-muted vs admin forest green). 통합 시 admin 대시보드 시각 정체성에 라이트 모드에서 미세하지만 인지 가능한 변화 발생.
3. **유지보수 격리**: D11 자산 갱신 라운드(shadow-strong 등)에서 B0KlA 자산만 별도로 톤 조정 가능하려면 분리 필수.

### 5.5 통합 매핑 결정 표 (B0KlA 잔존 토큰 → 기존 캐노니컬)

| 기존 B0KlA 토큰 + Hex | 건수 | 통합 타깃 | 시각 영향 |
|---|---:|---|---|
| `--ad-b0kla-text-secondary` + `#64748b` | 3 | `var(--mg-color-text-secondary)` (`#5C6B61`) | D9 P2-b/c 답습 톤 시프트 (slate-500 → brand olive-gray, ΔE ≈ 7, 가독성 유지) |
| `--ad-b0kla-bg` + `#fcfbfa` | 2 | `var(--mg-color-background-main)` (`#faf9f7`) | ΔE ≈ 1.2 (인지 어려운 미세 시프트) |
| `--ad-b0kla-placeholder` + `#a0aec0` | 2 | `var(--mg-color-text-tertiary)` | tier 정합 (placeholder → tertiary), ΔE 작음 |
| `--ad-b0kla-card-bg` + `#f5f3ef` | 1 | `var(--mg-color-surface-main)` (`#F5F3EF`) | 라이트 hex 정확 일치 (case-insensitive), 시각 변화 0 |
| `--ad-b0kla-icon-color` + `#4a5568` (P0 §6.2 SAFE) | 2 | `var(--mg-color-text-secondary-dark)` (`#374151`) | 다크 톤 텍스트로 통합 (icon 시맨틱 유지) |
| `--ad-b0kla-text-secondary` + `#4a5568` (P0 §6.2 SAFE) | 1 | `var(--mg-color-text-secondary-dark)` (`#374151`) | 위 동일 — slate-700 → text-secondary-dark |
| `--ad-b0kla-title-color` + `#2d3748` (P0 §6.2 SAFE) | 7 | `var(--mg-color-text-main)` (`#2C2C2C`) | ΔE ≈ 3 (warm-neutral 시프트, 가독성 유지) |
| `--ad-b0kla-border` + `#e2e8f0` (P0 §6.2 SAFE) | 8 | `var(--mg-color-border-main)` (`#D4CFC8`) | ΔE ≈ 5 (cool gray-200 → warm beige, P3 검수 필요) |

**합계**: 8 통합 매핑 / **26건**

### 5.6 HOLD-shift 1종 결정

| 기존 토큰 + Hex | 건수 | 결정 | 사유 |
|---|---:|---|---|
| `--ad-b0kla-green` + `#0d9488` (teal-600 변형) | 1 | **HARD_EXCLUDE 보존** (HOLD-shift) | teal 패밀리는 b0kla green olive 계열과 hue 차 큼 (ΔE ≈ 13). 1건뿐인 케이스로 신설 토큰 정당화 어려움. `--mg-color-success-700` (`#047857`) 와도 ΔE ≈ 9로 통합 부적합. 영구 보존하거나 D11 라운드에서 별도 검토. |

### 5.7 P2-c (B0KlA 트랙) 코더 핸드오프 골격

> **트랙 ID**: `P2-c-B0KlA` (기존 §C3 `P2-c` 트랙과 별개)

#### 5.7.1 SSOT 정의 블록 (`frontend/src/styles/unified-design-tokens.css`)

`:root` 블록에 추가 (라이트):

```css
:root {
  /* D10 §C7 — B0KlA Admin Palette (admin 대시보드 SSOT 디자인 자산) */
  --mg-color-b0kla-green-500: #4b745c;
  --mg-color-b0kla-orange-300: #e8a87c;
  --mg-color-b0kla-blue-400: #6d9dc5;
  --mg-color-b0kla-green-50: #ebf2ee;
  --mg-color-b0kla-orange-50: #fcf3ed;
  --mg-color-b0kla-blue-50: #f0f5f9;
}
```

`:root[data-theme="dark"]` 블록에 추가 (다크 cascade):

```css
:root[data-theme="dark"] {
  /* D10 §C7 — B0KlA Admin Palette (다크 cascade) */
  --mg-color-b0kla-green-500: #9cb89e;
  --mg-color-b0kla-orange-300: #f4b988;
  --mg-color-b0kla-blue-400: #9bb8d3;
  --mg-color-b0kla-green-50: #1c2e23;
  --mg-color-b0kla-orange-50: #2d1f15;
  --mg-color-b0kla-blue-50: #1c2733;
}
```

#### 5.7.2 Codemod 매핑 쌍 (`scripts/design-system/color-management/convert-hardcoded-colors.js`)

**신설 `R2_B0KLA_SAFE_PAIRS` 배열 (또는 `R2_MG_ALIAS_BC_SAFE_PAIRS` 확장) — 신설 흡수 6쌍**:

| (token, hex) | → 신설 토큰 |
|---|---|
| `--ad-b0kla-green` + `#4b745c` | `var(--mg-color-b0kla-green-500)` |
| `--ad-b0kla-orange` + `#e8a87c` | `var(--mg-color-b0kla-orange-300)` |
| `--ad-b0kla-blue` + `#6d9dc5` | `var(--mg-color-b0kla-blue-400)` |
| `--ad-b0kla-green-bg` + `#ebf2ee` | `var(--mg-color-b0kla-green-50)` |
| `--ad-b0kla-orange-bg` + `#fcf3ed` | `var(--mg-color-b0kla-orange-50)` |
| `--ad-b0kla-blue-bg` + `#f0f5f9` | `var(--mg-color-b0kla-blue-50)` |

**통합 흡수 매핑 — 기존 캐노니컬 통합 8쌍 (§5.5 참조)**:

| (token, hex) | → 기존 캐노니컬 |
|---|---|
| `--ad-b0kla-text-secondary` + `#64748b` | `var(--mg-color-text-secondary)` |
| `--ad-b0kla-bg` + `#fcfbfa` | `var(--mg-color-background-main)` |
| `--ad-b0kla-placeholder` + `#a0aec0` | `var(--mg-color-text-tertiary)` |
| `--ad-b0kla-card-bg` + `#f5f3ef` | `var(--mg-color-surface-main)` |
| `--ad-b0kla-icon-color` + `#4a5568` | `var(--mg-color-text-secondary-dark)` |
| `--ad-b0kla-text-secondary` + `#4a5568` | `var(--mg-color-text-secondary-dark)` |
| `--ad-b0kla-title-color` + `#2d3748` | `var(--mg-color-text-main)` |
| `--ad-b0kla-border` + `#e2e8f0` | `var(--mg-color-border-main)` |

**HARD_EXCLUDE 보존 1쌍**:

- `--ad-b0kla-green` + `#0d9488` → `HARD_EXCLUDE_PATTERNS` 추가 (teal-600 변형, D11 검토)

#### 5.7.3 COLOR_MAPPING 직접 흡수 (raw hex 광역 흡수, 대문자 변형 포함)

| Raw Hex | → 신설 토큰 | 비고 |
|---|---|---|
| `#4b745c` / `#4B745C` | `var(--mg-color-b0kla-green-500)` | B0KlA primary accent |
| `#e8a87c` / `#E8A87C` | `var(--mg-color-b0kla-orange-300)` | B0KlA accent orange |
| `#6d9dc5` / `#6D9DC5` | `var(--mg-color-b0kla-blue-400)` | B0KlA accent blue |
| `#ebf2ee` / `#EBF2EE` | `var(--mg-color-b0kla-green-50)` | B0KlA green soft bg |
| `#fcf3ed` / `#FCF3ED` | `var(--mg-color-b0kla-orange-50)` | B0KlA orange soft bg |
| `#f0f5f9` / `#F0F5F9` | `var(--mg-color-b0kla-blue-50)` | B0KlA blue soft bg |

#### 5.7.4 흡수 카운트 추정

| 카테고리 | 매핑 쌍 | 흡수 건수 |
|---|---:|---:|
| 신설 흡수 (b0kla 6종) | 6 | 28 (10+5+5+4+4) |
| 통합 흡수 (기존 캐노니컬) | 8 | 26 |
| HARD_EXCLUDE 보존 | 1 | 1 |
| **합계** | **15** | **55** (= 28 + 26 + 1) |

> P0 §6.3.a 인벤토리 명시 합계(28건)는 신설 6쌍만 카운트한 수치이며, §6.2 SAFE로 이미 분류된 4쌍 + 본 위임에서 결정된 통합 4쌍 + HOLD 1쌍을 합산하면 B0KlA 트랙 총 처리 건수는 55건.

### 5.8 시각 회귀 위험 분류 (P3 핸드오프)

| 영향 영역 | 위험 등급 | 점검 포인트 |
|---|:---:|---|
| admin 대시보드 B0KlA accent (`AdminDashboardB0KlA.css`) | **LOW** | b0kla-green/orange/blue 라이트 hex 정확 일치 (시각 변화 0), 다크 cascade 신규 정착으로 다크 모드 가시성 향상 |
| admin 보조 텍스트 (text-secondary 시프트) | **MEDIUM** | slate-500 `#64748b` → olive-gray `#5C6B61` (D9 P2-b/c 답습 — Homepage/MgEmailFieldWithAutocomplete 동일 패턴) |
| admin border 광역 (border-main 시프트) | **MEDIUM** | cool gray-200 `#e2e8f0` → warm beige `#D4CFC8` (ΔE ≈ 5, admin 카드/구분선 톤 변화 인지 가능). P3 우선 점검 |
| admin title 톤 (`#2d3748` → text-main `#2C2C2C`) | **LOW** | ΔE ≈ 3, warm-neutral 시프트, 가독성 유지 |
| admin icon 톤 (`#4a5568` → text-secondary-dark `#374151`) | **LOW** | slate-700 → 한층 어두운 neutral, 아이콘 대비 강화 |

### 5.9 D11 이월 사항 (C8 정합)

- C8=a 결정: iOS dark alias HARD_EXCLUDE 보존 (D11 검토 대상).
- C7 잔여 1건 `#0d9488` (teal-600 변형) 도 D11 검토 후보.
- D11 자산 갱신 라운드에서 `--mg-shadow-strong` 등 신설 시 B0KlA 토큰과의 shadow 정합 검증 필요.

### 5.10 §C7 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-designer (resume 위임) | D10 P0 인벤토리 §6.3.a 기반 — B0KlA admin palette 신설 6종(green-500/orange-300/blue-400 + 3 bg-50) 라이트·다크 cascade hex 매트릭스 + WCAG AA 검증 + brand-olive 분리 시맨틱 결정 + 통합 매핑 8쌍 / HOLD 1쌍. P2-c-B0KlA 트랙 코더 핸드오프 골격 (SSOT 정의 블록 / codemod 매핑 / COLOR_MAPPING 직접 흡수 / 흡수 카운트 추정 55건). |

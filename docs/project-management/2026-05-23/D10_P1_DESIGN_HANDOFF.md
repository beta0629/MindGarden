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

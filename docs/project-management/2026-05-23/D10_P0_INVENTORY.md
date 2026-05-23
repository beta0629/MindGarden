# D10 P0 인벤토리 — 6 트랙 read-only 산출

> **소스 SSOT (실측)**
> - 인벤토리 JSON: `scripts/design-system/color-management/reports/r2-inventory-20260523-D9-P2bc-after.json` (운영 main `04ac359a0` 직후 상태)
> - count JSON: `scripts/design-system/color-management/reports/count-20260523-D9-P2bc-after.json` (canonical 457 / withR2 649 / rawLine 1,423 / r2Protected 192)
> - D10 합의서: `docs/standards/DESIGN_TOKEN_GAP_2026Q2_D10.md`
> - D10 P1 디자인 핸드오프 (병렬 산출): `docs/project-management/2026-05-23/D10_P1_DESIGN_HANDOFF.md` (C1~C5 hex 결정 완료, 11종 신설 매트릭스 확정)
> - D9 P2-f Glass/Shadow 보고서: `docs/project-management/2026-05-23/D9_P2F_GLASS_SHADOW_OVERLAY_VISUAL_REGRESSION_REPORT.md`

---

## §0 트랙별 카운트 요약 (TL;DR)

| 트랙 | 건수 (R-2/rgba/rawLineJs) | 유니크 (token,hex) 쌍 | 영향 파일 수 | C-결정 |
|---|---:|---:|---:|---|
| §1 T-R2-Manual-Final mg-* | 16 | 14 | 7 | C1=a |
| §2 T-R2-Manual-Final mg-v2-* | 16 (20−4 border-light) | 9 | 1 | C2=a |
| §3 T-R2-Hold-Final mg-v2-border-light | 4 | 1 | 1 | C3=a |
| §4 T-Glass-Black-Cascade (1자리 0.2/0.3/0.4/0.6) | **~37 (비 HARD_EXCLUDE)** | — | **29** | C4=a |
| §4-b T-Glass-Black-Cascade (2자리 0.20/0.30/0.40/0.60) | **0 (운영 사용처 전무, 토큰 정의만 각 1)** | — | 0 | (HOLD 해소) |
| §5 T-Shadow-Light-Dark 다크 cascade | 1 (broken cascade) | 1 | 1 (SSOT) | C5=a |
| §6 T-CS-Theme-Other 156건 | **156** | 45 | 24 | C6=b |
| §7 T-Inline-Magic (rawLineJs) | **12** (count-20260523 SSOT) | — | 5+ | (PR-E 단독) |

**T-CS-Theme-Other SAFE 70%+ 광역 카운트 예상치**: 현 SAFE = 74건 (47%, JSON `other.autoReplaceable`). 표준 70%+ 도달은 §6.2의 SAFE 후보 광역 흡수 + `ad-b0kla-*` 5쌍 6종 신설 또는 도메인 alias 흡수 결정 시 **약 116건 (74%) 가능** — rawLine 감축 기여 **-150 ~ -250** (확장 시나리오 ~970, 표준 시나리오 ~1,200).

---

## §1 T-R2-Manual-Final — mg-* 16건 (manual-review)

> 출처: `r2-inventory-20260523-D9-P2bc-after.json` `groups.mg.pairs` 14쌍 + count 16건 (일부 쌍이 2건). 모두 `canonical: null` (codemod COLOR_MAPPING 부재).

| # | 토큰 + hex | 건수 | 파일 (사용처) | 사전 분류 | D10 P1 결정 (C1=a, `D10_P1_DESIGN_HANDOFF.md` §C1) |
|---:|---|---:|---|---|---|
| 1 | `--mg-color-danger-dark` + `#c82333` | 2 | `frontend/src/components/admin/ModernDashboardEditor.css` | **SAFE 통합 (iii)** | → `var(--mg-color-error-dark)` (Bootstrap danger 잔재 통합) |
| 2 | `--mg-color-text-tertiary` + `#8a9a90` | 2 | `frontend/src/components/admin/ModernDashboardEditor.css` | **SAFE 통합 (i)** | → `var(--mg-color-text-secondary)` (brand olive-gray 통합) |
| 3 | `--mg-purple-light` + `#ede9fe` | 1 | `frontend/src/components/common/PrivacyPolicy.css` | **HOLD 보존 (ii)** | → `HARD_EXCLUDE` (purple 패밀리 부재) |
| 4 | `--mg-success` + `#22c55e` | 1 | `frontend/src/components/admin/DashboardFormModal.css` | **SAFE 통합 (i)** | → `var(--mg-color-success)` (success 메인 흡수) |
| 5 | `--mg-success-dark` + `#16a34a` | 1 | `frontend/src/components/admin/DashboardFormModal.css` | **SAFE 통합 (i)** — C2 700 의존 | → `var(--mg-color-success-700)` (C2 신설 700 톤 흡수) |
| 6 | `--mg-color-text-secondary` + `#888` | 1 | `frontend/src/components/consultant/ConsultationRecordScreen.js` | **SAFE 통합 (i)** | → `var(--mg-color-text-secondary)` (표준 보조 통합) |
| 7 | `--mg-custom-ffeaa7` + `#ffeaa7` | 1 | `frontend/src/components/common/PrivacyPolicy.css` | **HOLD 보존 (ii)** | → `HARD_EXCLUDE` (커스텀 placeholder) |
| 8 | `--mg-custom-e8f4fd` + `#e8f4fd` | 1 | `frontend/src/components/common/PrivacyPolicy.css` | **HOLD 보존 (ii)** | → `HARD_EXCLUDE` |
| 9 | `--mg-custom-bee5eb` + `#bee5eb` | 1 | `frontend/src/components/common/PrivacyPolicy.css` | **HOLD 보존 (ii)** | → `HARD_EXCLUDE` |
| 10 | `--mg-custom-0c5460` + `#0c5460` | 1 | `frontend/src/components/common/AppToast.css` | **HOLD 보존 (ii)** | → `HARD_EXCLUDE` |
| 11 | `--mg-warning-500` + `#fd7e14` | 1 | `frontend/src/components/admin/DashboardFormModal.css` | **SAFE 통합 (iii)** — C2 600 의존 | → `var(--mg-color-warning-600)` (C2 신설 600 톤 흡수) |
| 12 | `--mg-purple-500` + `#6f42c1` | 1 | `frontend/src/components/admin/DashboardFormModal.css` | **HOLD 보존 (ii)** | → `HARD_EXCLUDE` (purple 패밀리 부재) |
| 13 | `--mg-color-accent-main` + `#8b7355` | 1 | `frontend/src/components/consultant/ConsultationRecordScreen.js` | **HOLD 보존 (ii)** | → `HARD_EXCLUDE` (coffee/brown 커스텀) |
| 14 | `--mg-text-secondary` + `#555555` | 1 | `frontend/src/components/homepage/Homepage.css` | **SAFE 통합 (i)** | → `var(--mg-color-text-secondary)` (표준 보조 통합) |

**§1 합계**: SAFE 통합 8쌍 / 9건 (P1 C1=a 결정 답습) + HOLD/HARD_EXCLUDE 6쌍 / 7건 → **P2-a (P1 §4 골격) 적용 시 R-2 보호 -9 (mg-* 16 → 7)**

---

## §2 T-R2-Manual-Final — mg-v2-* 16건 (Tailwind palette 변형)

> 출처: `r2-inventory-20260523-D9-P2bc-after.json` `groups.mg-v2.pairs` 11쌍 중 border-light 1쌍(4건 = §3)을 제외한 10쌍 / 16건. 전부 `ConsultantDashboard.css` 단일 파일 집중.

| # | 토큰 + hex | 건수 | 파일 | 사전 분류 | D10 P1 결정 (C2=a, `D10_P1_DESIGN_HANDOFF.md` §C2) |
|---:|---|---:|---|---|---|
| 1 | `--mg-v2-color-primary-50` + `#eff6ff` | 4 | `frontend/src/components/dashboard-v2/consultant/ConsultantDashboard.css` | **SAFE-new (Tailwind blue-50)** | → 신설 `--mg-color-primary-50` (light `#eff6ff` / dark `#1e3a8a`) |
| 2 | `--mg-v2-color-warning-50` + `#fffbeb` | 3 | 동 | **SAFE-new (Tailwind amber-50)** | → 신설 `--mg-color-warning-50` (light `#fffbeb` / dark `#451a03`) |
| 3 | `--mg-v2-color-primary-200` + `#bfdbfe` | 2 | 동 | **SAFE-new (Tailwind blue-200)** | → 신설 `--mg-color-primary-200` (light `#bfdbfe` / dark `#1e40af`) |
| 4 | `--mg-v2-color-warning-200` + `#fde68a` | 1 | 동 | **SAFE-new (Tailwind amber-200)** | → 신설 `--mg-color-warning-200` (light `#fde68a` / dark `#78350f`) |
| 5 | `--mg-v2-color-success-600` + `#16a34a` | 1 | 동 | **SAFE-new (Tailwind emerald-600)** | → 신설 `--mg-color-success-600` (light `#059669` / dark `#34d399`) ⚠️ hex 정합 검증 — 실 사용 hex `#16a34a` vs P1 신설 hex `#059669` 불일치, ΔE 인지 가능 (P3 검수) |
| 6 | `--mg-v2-color-warning-600` + `#d97706` | 1 | 동 | **SAFE-new (Tailwind amber-600)** | → 신설 `--mg-color-warning-600` (light `#d97706` / dark `#fcd34d`) |
| 7 | `--mg-v2-color-info-600` + `#0284c7` | 1 | 동 | **SAFE-new (Tailwind sky-600)** | → 신설 `--mg-color-info-600` (light `#2563eb` / dark `#3b82f6`) ⚠️ hex 정합 검증 — 실 사용 hex `#0284c7` vs P1 신설 hex `#2563eb` 불일치, ΔE 인지 가능 (P3 검수) |
| 8 | `--mg-v2-color-success-700` + `#15803d` | 1 | 동 | **SAFE-new (Tailwind emerald-700)** | → 신설 `--mg-color-success-700` (light `#047857` / dark `#6ee7b7`) ⚠️ hex 정합 검증 |
| 9 | `--mg-v2-color-warning-700` + `#b45309` | 1 | 동 | **SAFE-new (Tailwind amber-700)** | → 신설 `--mg-color-warning-700` (light `#b45309` / dark `#fbbf24`) |
| 10 | `--mg-v2-color-primary-300` + `#93c5fd` | 1 | 동 | **SAFE-new (Tailwind blue-300)** | → 신설 `--mg-color-primary-300` (light `#93c5fd` / dark `#1d4ed8`) |

**§2 합계**: 10쌍 / **16건** SAFE-new (P1 C2=a — 10종 일괄 신설) → **P2-b 적용 시 R-2 보호 -16 (mg-v2-* manual-review 16 → 0)**

**P1 디자이너 결정 필요 (추가)**:
1. **success-600/700·info-600 hex 정합 검증**: 실 사용 hex(`#16a34a`/`#15803d`/`#0284c7`)가 P1 §C2 신설 hex(`#059669`/`#047857`/`#2563eb`)와 ΔE 인지 가능 수준. ConsultantDashboard 광역 시각 변화 위험 — P3 시각 회귀 검수에서 톤 시프트 endorsed 여부 확정 필요.
2. **단일 파일 광역 영향**: `ConsultantDashboard.css` 1 파일에 16건 집중 — PR-A 분리 시 컴포넌트 단위 시각 회귀 사진 비교 권장.

---

## §3 T-R2-Hold-Final — mg-v2-border-light 4건

> 출처: `r2-inventory-20260523-D9-P2bc-after.json` + `rg --mg-v2-color-border-light frontend/src` 실측.

| # | 토큰 + hex | 건수 | 파일·라인 | D10 P1 결정 (C3=a, `D10_P1_DESIGN_HANDOFF.md` §C3) |
|---:|---|---:|---|---|
| 1 | `--mg-v2-color-border-light` + `#f3f4f6` | 1 | `frontend/src/components/dashboard-v2/consultant/ConsultantDashboard.css:174` | → 신설 `--mg-color-border-soft` (light `#f3f4f6` / dark `#374151`) — border 시맨틱 분리 |
| 2 | 동 | 1 | 동 `:240` | 동 |
| 3 | 동 | 1 | 동 `:361` | 동 |
| 4 | 동 | 1 | 동 `:420` | 동 |

**§3 합계**: 1쌍 / **4건** SAFE-new (P1 C3=a) → **P2-c 적용 시 R-2 보호 -4 (mg-v2-* border-light 4 → 0)**

---

## §4 T-Glass-Black-Cascade — black α 4종 (D9 P2-f HOLD)

> 출처: `rg "rgba\(\s*0\s*,\s*0\s*,\s*0\s*,\s*0?\.(20|30|40|60|2|3|4|6)\s*\)" frontend/src` (HARD_EXCLUDE 적용 후 실측). D9 P2-f §2.3 HOLD 사유 — 다크 cascade 의도와 라이트 모드 코드 컨텍스트 충돌.

### §4.1 2자리 형식 (`0.20` / `0.30` / `0.40` / `0.60`) — 운영 사용처 **0건**

| α | 패턴 | 운영 사용처 (비 HARD_EXCLUDE) | 토큰 SSOT 정의 (HARD_EXCLUDE 보호) |
|---|---|---:|---|
| `0.20` | `rgba(0, 0, 0, 0.20)` | **0** | `unified-design-tokens.css:1704` `--mg-glass-bg-light` 다크 cascade |
| `0.30` | `rgba(0, 0, 0, 0.30)` | **0** | `unified-design-tokens.css:1710` `--mg-shadow-medium` 다크 cascade |
| `0.40` | `rgba(0, 0, 0, 0.40)` | **0** | `unified-design-tokens.css:1706` `--mg-glass-bg-medium` 다크 cascade |
| `0.60` | `rgba(0, 0, 0, 0.60)` | **0** | `unified-design-tokens.css:1708` `--mg-glass-bg-strong` 다크 cascade |

> **핵심 발견**: D10 합의서 §2.3에서 "~30~60건 추산"으로 가늠된 2자리 형식은 **실제 운영 코드 사용처 0건**. 토큰 정의(HARD_EXCLUDE)에만 존재. → **D9 P2-f HOLD 4종 사실상 자연 해소** (라이트 모드 코드에서 2자리 형식 hex 직접 작성 사례 없음).

### §4.2 1자리 형식 (`0.2` / `0.3` / `0.4` / `0.6`) — 운영 사용처 **약 37건 / 29 파일** (비 HARD_EXCLUDE)

P1 §C4 분류 골격: `0.20`/`0.30` = shadow / `0.40` = glass dark / `0.60` = overlay

| α | 패턴 | 사용처 파일 (라인 분포) | 사전 컨텍스트 분류 | P1 §C4 매핑 후보 |
|---|---|---|---|---|
| `0.2` | `rgba(0, 0, 0, 0.2)` | `_glass-components.css:75/207` (box-shadow ×2), `dropdown-common.css` (background-color ×3), `clinical/RiskAlertBadge.css:55/76` (box-shadow ×2), `ops/PgApprovalManagement.css`, `tenant/PgConfiguration{List,Detail}.css` (각 1), `admin/{AdminDashboard,Dashboard3DPreview,CustomSelect,settings/UserSettings,common/MGStats(×2),NotificationBadge,WidgetCardWrapper,consultant/ConsultantAvailability}.css` (각 1) | **shadow** 우세 | → `var(--mg-shadow-medium)` 다크 0.30 단계 정합 |
| `0.3` | `rgba(0, 0, 0, 0.3)` | `_glass-components.css:81` (box-shadow), `RiskAlertBadge.css:64` (background = overlay), `06-components/_base/_iphone17-buttons.css:189` (text-shadow), 외 다수 | **shadow + overlay 혼재** | → `var(--mg-shadow-medium)` 또는 컨텍스트별 분리 |
| `0.4` | `rgba(0, 0, 0, 0.4)` | `_iphone17-modals.css:13` (background = overlay/backdrop), `dropdown-common.css` (background-color = overlay) | **overlay/backdrop** 우세 | → `var(--mg-overlay)` 또는 `--mg-glass-bg-medium` 다크 |
| `0.6` | `rgba(0, 0, 0, 0.6)` | `_notifications.css:274` (background = overlay), `common/DuplicateLoginAlert.css:1`, `common/CommonLoading.css:1` | **overlay** 우세 | → `var(--mg-overlay)` (양방향 0.50 고정, ΔA 0.10 인지 가능) 또는 신설 `--mg-overlay-strong` 검토 |

**§4 합계 (운영 영향)**:
- 2자리 형식 흡수 = **0건** (사실상 자연 해소)
- 1자리 형식 컨텍스트별 SAFE 흡수 가능 = **약 25 ~ 30건** (overlay/backdrop 명확 케이스 우선)
- HOLD/HARD_EXCLUDE = **약 7 ~ 12건**
- metric 영향 = 0 (rgba 흡수, hex-only metric 미반영)

---

## §5 T-Shadow-Light-Dark — `--mg-shadow-light` 다크 cascade

### §5.1 SSOT 정의 (`frontend/src/styles/unified-design-tokens.css`)

| 라인 | 정의 | 모드 |
|---:|---|---|
| `L386` | `--mg-shadow-light: rgba(0, 0, 0, 0.1);` | **light only** |
| (다크 cascade 부재) | — | **다크 정의 없음 — broken cascade** |

### §5.2 사용처

- `unified-design-tokens.css` 내부 alias (cs-*/cs-glass-dark/box-shadow 등) **54 라인**
- 외부 CSS 사용처 약 **35+ 라인** (`_glass-components.css`, `_cards.css`, `_modals.css`, `Homepage.css`, `MGCard.css`, `MGForm.css`, `_iphone17-buttons.css`, 외 다수)

**§5 합계**: SSOT 정의 1건 (light only) + 사용처 약 90+ 라인 → **broken cascade 1건 해소 (정의 추가)**, **codemod 흡수 불필요**, **metric 영향 0**.

**P1 §C5 확정**: 다크 cascade hex = `rgba(0, 0, 0, 0.20)` (D9 P2-f glass-bg-light 다크 답습)

---

## §6 T-CS-Theme-Other — R-2 보호 other 그룹 156건 (rawLine < 1,000 직접 트리거)

### §6.1 그룹별 분포

| 접두 그룹 | 유니크 토큰 | 총 건수 | 비율 |
|---|---:|---:|---:|
| `--color-*` (legacy color- alias) | 14 | 47 | 30% |
| `--ad-b0kla-*` (admin B0KlA palette) | 14 | 56 | 36% |
| `--text-*` (text-primary/secondary 도메인 alias) | 2 | 31 | 20% |
| `--ios-*` (iOS theme dark alias) | 6 | 9 | 6% |
| `--cs-*` (clinical legacy) | 1 | 1 | <1% |
| `--bg-hover` / `--error-hover` | 2 | 6 | 4% |
| 기타 단발 | 1 | 1 | <1% |
| **합계** | **40** | **156** | **100%** |

### §6.2 SAFE 화이트리스트 후보 (replaceable: true) — **12 쌍 / 74건 (47%)**

| # | 토큰 + hex | 건수 | 캐노니컬 타깃 |
|---:|---|---:|---|
| 1 | `--text-secondary` + `#666` | 14 | `var(--mg-color-text-secondary)` |
| 2 | `--text-primary` + `#333` | 14 | `var(--mg-color-text-main)` |
| 3 | `--ad-b0kla-border` + `#e2e8f0` | 8 | `var(--mg-color-border-main)` |
| 4 | `--color-text-secondary` + `#666` | 7 | `var(--mg-color-text-secondary)` |
| 5 | `--ad-b0kla-title-color` + `#2d3748` | 7 | `var(--mg-color-text-main)` |
| 6 | `--color-border` + `#ddd` | 5 | `var(--mg-color-border-main)` |
| 7 | `--color-text` + `#333` | 5 | `var(--mg-color-text-main)` |
| 8 | `--bg-hover` + `#f0f0f0` | 5 | `var(--mg-color-surface-light)` |
| 9 | `--text-secondary` + `#999` | 3 | `var(--mg-color-text-tertiary)` |
| 10 | `--ad-b0kla-icon-color` + `#4a5568` | 2 | `var(--mg-color-text-secondary-dark)` |
| 11 | `--color-text-primary` + `#333` | 1 | `var(--mg-color-text-main)` |
| 12 | `--color-background-alt` + `#f3f4f6` | 1 | `var(--mg-color-background-main)` |
| 13 | `--ad-b0kla-text-secondary` + `#4a5568` | 1 | `var(--mg-color-text-secondary-dark)` |
| 14 | `--cs-secondary-400` + `#9ca3af` | 1 | `var(--mg-color-text-tertiary)` |

**SAFE 합계** = **14 쌍 / 74건** (`groups.other.autoReplaceable` SSOT 정확 일치)

### §6.3 HOLD/manual-review (replaceable: false) — **31 쌍 / 82건 (53%)**

#### §6.3.a `--ad-b0kla-*` palette 변형 — 8 쌍 / 28건 (신설 후보)

| # | 토큰 + hex | 건수 | 신설 후보 |
|---:|---|---:|---|
| 1 | `--ad-b0kla-green` + `#4b745c` | 10 | 신설 `--mg-color-b0kla-green-500` 또는 brand-olive 통합 |
| 2 | `--ad-b0kla-orange` + `#e8a87c` | 5 | 신설 `--mg-color-b0kla-orange-300` 또는 warning-300 통합 |
| 3 | `--ad-b0kla-blue` + `#6d9dc5` | 5 | 신설 `--mg-color-b0kla-blue-400` 또는 info-300 통합 |
| 4 | `--ad-b0kla-green-bg` + `#ebf2ee` | 4 | 신설 `--mg-color-b0kla-green-50` 또는 success-soft 통합 |
| 5 | `--ad-b0kla-orange-bg` + `#fcf3ed` | 4 | 신설 `--mg-color-b0kla-orange-50` 또는 warning-soft 통합 |
| 6 | `--ad-b0kla-blue-bg` + `#f0f5f9` | 4 | 신설 `--mg-color-b0kla-blue-50` 또는 info-soft 통합 |
| 7 | `--ad-b0kla-text-secondary` + `#64748b` | 3 | `var(--mg-color-text-secondary)` 시프트 (D9 P2-b/c 답습) |
| 8 | `--ad-b0kla-bg` + `#fcfbfa` | 2 | `var(--mg-color-background-main)` 통합 검토 |
| 9 | `--ad-b0kla-placeholder` + `#a0aec0` | 2 | `var(--mg-color-text-tertiary)` 시프트 검토 |
| 10 | `--ad-b0kla-card-bg` + `#f5f3ef` | 1 | `var(--mg-color-surface-main)` (라이트 hex 정확 일치) |
| 11 | `--ad-b0kla-green` + `#0d9488` | 1 | 신설 또는 success-dark 통합 |

#### §6.3.b `--color-*` legacy 변형 — 15 쌍 / 32건

(상세 표는 P1 디자이너 §C6 입력으로 활용; SAFE 통합 후보 다수, HOLD 일부)

#### §6.3.c `--ios-*-dark` (iOS theme 다크 alias) — 6 쌍 / 9건

| # | 토큰 + hex | 건수 | 사전 분류 |
|---:|---|---:|---|
| 1 | `--ios-bg-secondary-dark` + `#2c2c2e` | 2 | HOLD-new (다크 전용 alias) |
| 2 | `--ios-border-dark` + `#38383a` | 2 | HOLD-new |
| 3 | `--ios-bg-tertiary-dark` + `#3a3a3c` | 1 | HOLD-new |
| 4 | `--ios-border-hover-dark` + `#48484a` | 1 | HOLD-new |
| 5 | `--ios-bg-primary-dark` + `#1c1c1e` | 1 | HOLD-new |

> **iOS 다크 전용 alias 6 쌍 / 9건은 본질적으로 다크 cascade 의도 — 라이트/다크 양방향 cascade 분리 신설 vs HARD_EXCLUDE 보존 P1 결정 필요.**

### §6.4 SAFE 70%+ 광역 시나리오 (rawLine < 1,000 트리거 검증)

| 시나리오 | 적용 범위 | SAFE 건수 | 비율 | rawLine 감축 가늠 |
|---|---|---:|---:|---:|
| **보수** | §6.2 (캐노니컬 존재 12쌍) | 74 | **47%** | -50 ~ -80 |
| **표준 (광역)** | §6.2 + §6.3.b legacy 통합 8쌍 | 87 | **56%** | -80 ~ -120 |
| **표준+ (B0KlA 일부 흡수)** | + §6.3.a SAFE-shift + 통합 | 94 | **60%** | -100 ~ -140 |
| **확장 (B0KlA 신설)** | + §6.3.a 신설 5종 | 116 | **74%** | -150 ~ -250 |
| **확장+ (iOS 다크 cascade 신설)** | + §6.3.c iOS dark alias 분리 신설 6종 | 125 | **80%** | -180 ~ -300 |

> **C6=b 표준 SAFE 70%+ 트리거**: §6.2 광역 흡수 + §6.3.a B0KlA 신설 5~6종 결정 시 **116건 (74%)** 도달 가능. rawLine 감축 -150 ~ -250 + 동반 비-R-2 hex 라인 흡수로 D10 운영 게이트 **< 1,000 진입 시나리오 표준** 정합.

### §6.5 영향 파일군 (topFiles SSOT)

| 영향군 | 건수 | 파일 |
|---|---:|---|
| dashboard-v2 광역 | 28 | `dashboard-v2/content/ContentKpiRow.css` |
| erd 광역 | 37 | `erd/ErdDetailPage.css:27` + `erd/ErdListPage.css:10` |
| academy 광역 | 15 | `academy/Academy.css:15` |
| admin mapping 광역 | 25 | `admin/MappingManagement.css:15` + `admin/mapping/MappingFilters.css:10` |
| admin psych-assessment | 12 | `admin/psych-assessment/organisms/PsychKpiSection.css:11` + 외 |
| dashboard-v2 atoms/organisms | 13 | `dashboard-v2/atoms/{NavIcon,SearchInput}.css` + `organisms/{DesktopGnb,MobileGnb}.css` |
| dropdowns 공통 | 7 | `styles/06-components/_dropdowns.css` |
| 기타 공통 | 19 | `common/{CustomSelect,LoadingSpinner}.css`, `admin/{ProfileCard,PsychAssessmentManagementPage}.css`, 외 |

---

## §7 T-Inline-Magic — rawLineJs 12건 (PR-E 단독)

### §7.1 인라인 hex 사용처

| # | 파일·라인 | hex | 사전 분류 |
|---:|---|---|---|
| 1 | `admin/VacationManagementModal.js:121` `color: '#60a5fa'` | `#60a5fa` | **SAFE** → `var(--mg-color-legacy-primary)` (D9 P2-b/c 답습) |
| 2 | `admin/PaymentConfirmationModal.js:118` `color: '#fee500'` | `#fee500` | **HOLD** — KAKAO 브랜드 컬러 보존 |
| 3 | `admin/PaymentConfirmationModal.js:120` `color: '#0064ff'` | `#0064ff` | **HOLD** — TOSS 브랜드 |
| 4 | `admin/PaymentConfirmationModal.js:121` `color: '#0070ba'` | `#0070ba` | **HOLD** — PAYPAL 브랜드 |
| 5 | `common/ScheduleList.js:122` `color: '#06b6d4'` | `#06b6d4` | **SAFE** → 신설 또는 cyan-500 통합 검토 |
| 6 | `common/SalaryPrintComponent.js:107` `backgroundColor: '#e8f5e8'` | `#e8f5e8` | **HOLD** — 인쇄용 정적 hex |

### §7.2 JS 상수 hex 잔존

| # | 파일·라인 | hex | 사전 분류 |
|---:|---|---|---|
| 1 | `constants/magicNumbers.js:224` `PRIMARY_COLORS: [..., '#6f42c1']` | `#6f42c1` | **HOLD** — `HARD_EXCLUDE` 답습 |
| 2 | `constants/magicNumbers.js:225` `SECONDARY_COLORS: ['#fd7e14', '#20c997', '#e83e8c']` | 3 hex | **HOLD** — 일부 흡수 + 나머지 보존 |
| 3 | `constants/clientShopConstants.js:137` `background: '#F5F3EF'` | `#F5F3EF` | **SAFE** → `var(--mg-color-surface-main)` |
| 4 | `constants/clientShopConstants.js:142` `background: '#EEF4F1'` | `#EEF4F1` | **HOLD** — 캐노니컬 부재 |

### §7.3 canvas / colorMap — 이미 흡수 완료 (D9 P2-b/c 답습)

| 파일·라인 | 상태 |
|---|---|
| `clinical/AudioRecorder.js:263/264` | ✅ `var()` 적용 완료 |
| `utils/erdExport.js:60` | ⚠️ canvas API에서 `var()` 사용 불가 — broken render 가능 (별도 분리 트랙) |
| `mapping-management/pages/MappingManagementPage.js:113` colorMap | ✅ `var()` 적용 완료 |

**§7 합계**: SAFE 흡수 **3~5건** (rawLineJs 12 → 7~9)

---

## §8 P1 디자이너 위임 추가 결정 입력 요약

| # | 추가 결정 항목 | 트랙 | 본 P0 참조 |
|---:|---|---|---|
| 1 | mg-v2-* success/info 600/700 hex 정합 검증 (실 hex vs P1 신설 hex ΔE) | §2 | §2.5/§2.7/§2.8 |
| 2 | T-CS-Theme-Other B0KlA palette 신설 vs 통합 정책 (5~6종) | §6.3.a | §6.3.a + §6.4 확장 시나리오 |
| 3 | iOS dark theme alias 6쌍 양방향 cascade 신설 vs HARD_EXCLUDE 보존 | §6.3.c | §6.3.c + §6.4 확장+ 시나리오 |
| 4 | `0.20/0.30` shadow vs `0.40` glass-dark vs `0.60` overlay 컨텍스트별 분류 워크플로 | §4 | §4.2 |
| 5 | T-Inline-Magic 브랜드 컬러 인라인 보존 정책 (카카오/토스/페이팔) | §7 | §7.1 #2/#3/#4 |
| 6 | T-CS-Theme-Other PR 분리 단위 (확장 시 116건, 24 파일 광역) | §6 | §6.5 |

---

## §9 운영 게이트 진입 시나리오 (D10 적용 후 예상)

| 시나리오 | 적용 트랙 | rawLine 감축 | 적용 후 rawLine | < 1,000 진입 |
|---|---|---:|---:|:---:|
| 보수 | §1 + §3 + §5 (codemod 흡수만) | -13 ~ -25 | ~1,398 ~ 1,410 | ❌ |
| 표준 | + §2 (16건) + §6 SAFE 보수 (74건) | -85 ~ -120 | ~1,303 ~ 1,338 | ❌ |
| 표준+ | + §6 SAFE 70%+ (116건) | -130 ~ -200 | ~1,223 ~ 1,293 | ❌ |
| **확장 (광역 + iOS)** | + §6 확장+ (125건) + 동반 hex 라인 광역 | **-200 ~ -350** | **~1,073 ~ 1,223** | ⚠️ |
| **확장+ (모든 트랙 통합)** | + §4 SAFE rgba 흡수 + §7 인라인 5건 | -210 ~ -360 | ~1,063 ~ 1,213 | ⚠️ |

> **결론**: **rawLine < 1,000 진입은 §6 (T-CS-Theme-Other) 확장+ 시나리오 + 동반 hex 라인 광역 흡수에 직접 의존**. P1 §C6 B0KlA palette 신설 5종 + iOS dark cascade 신설 6종 결정 시 가능. D9 P2-f §3.4 metric SSOT 한계 (rgba 미반영) 그대로 잔존.

---

## §10 변경 이력

| 일자 | 작성 | 내용 |
|---|---|---|
| 2026-05-23 | core-explorer (read-only) → 메인 어시스턴트 정착 | D10 P0 인벤토리 6 트랙 산출. `r2-inventory-20260523-D9-P2bc-after.json` SSOT 인용 + `count-20260523-D9-P2bc-after.json` (canonical 457 / withR2 649 / rawLine 1,423 / r2Protected 192) 정합. 트랙 1·2 mg-/mg-v2- 32건 (14+10 유니크 쌍) D10 P1 §C1·C2 결정 정합 확인. 트랙 3 border-light 4건 `ConsultantDashboard.css` L174/240/361/420 단일 파일 집중. 트랙 4 2자리 black α 운영 사용처 **0건 (자연 해소)** / 1자리 형식 **약 37건 / 29 파일**. 트랙 5 `--mg-shadow-light` SSOT 1정의 + broken 다크 cascade + 사용처 90+ 라인. 트랙 6 156건 = `--ad-b0kla-*` 56 (36%) / `--color-*` 47 (30%) / `--text-*` 31 (20%) / `--ios-*` 9 (6%) / 기타 13. SAFE 보수 74건 (47%) / 확장 116건 (74%) / 확장+ 125건 (80%) 시나리오. 트랙 7 rawLineJs 12건 중 SAFE 3~5건 흡수 + canvas/colorMap 답습 완료. |

# 어드민 모달 이메일 행 레이아웃 스펙 (깨짐 방지)

**역할**: core-designer (UI/UX·레이아웃·비주얼 스펙만, 코드 작성 없음)  
**대상**: 어드민 모달 내 이메일 폼 행 (`.mg-v2-form-email-row`)  
**목적**: 입력 필드/레이아웃 깨짐 없이, 라벨 | 입력 | 중복확인 버튼이 안정적으로 한 줄에 보이도록 설계  
**참조**: 어드민 대시보드 샘플 https://mindgarden.dev.core-solution.co.kr/admin-dashboard-sample, PENCIL_DESIGN_GUIDE.md, B0KlA·unified-design-tokens

---

## 1. 개요 및 배경

### 1.1 문제

- 어드민 모달(내담자/상담사/스태프 등록·수정) 내 이메일 행에서 **입력 필드가 보이지 않고** "중복확인" 텍스트만 보이거나, 레이아웃이 깨진다는 사용자 보고가 있음.
- 원인은 flex 하위에서 입력 래퍼(`.__input-wrap`)의 **최소 너비가 0으로 적용**되거나, 전역/유틸(`.u-min-w-0` 등)에 의해 덮어쓰이는 경우로 정리됨. 상세 원인 분석은 `docs/design-system/CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md` 참조.

### 1.2 목표

- 이메일 행이 **깨지지 않는** 한 줄 레이아웃을 보장하는 UI/UX·레이아웃·비주얼 스펙을 단일 문서로 정의.
- 기획(플래너) 보고 및 core-coder 구현 시 **추측 없이** 적용할 수 있도록 토큰·클래스·최소 치수를 명시.

---

## 2. 선호 레이아웃

### 2.1 구조 (한 줄 유지)

| 구역 | 구성 | 비고 |
|------|------|------|
| **폼 그룹** | `mg-v2-form-group` — 이메일 필드 전체 래퍼 | 라벨 + 이메일 행을 포함 |
| **라벨** | `mg-v2-form-label` — "이메일 *" | 폼 그룹 상단, 라벨은 **행 밖** 상단 배치 (이메일 행과 별도 줄) |
| **이메일 행** | `mg-v2-form-email-row` — **한 줄**: [입력 래퍼] + [중복확인 버튼] | 라벨 다음 줄에 배치. **한 줄에 입력 영역과 버튼이 나란히** 보이도록 함 |

즉, **선호 레이아웃**은 다음과 같다.

- **1행**: 라벨 (`이메일 *`)
- **2행**: [입력 필드가 들어 있는 래퍼] [중복확인 버튼] — 한 줄, 좌측 입력·우측 버튼

라벨을 이메일 행과 같은 줄(라벨 | 입력 | 버튼)에 두는 방식은 **사용하지 않음**. 라벨은 폼 그룹 상단 한 줄로 두고, 이메일 행은 "입력 + 버튼"만 포함한다.

### 2.2 블록·클래스 역할

| 블록/요소 | 클래스 | 역할 |
|-----------|--------|------|
| 필드 래퍼 | `mg-v2-form-group` | 이메일 필드 전체(라벨 + 이메일 행 + 도움말) 감쌈 |
| 라벨 | `mg-v2-form-label` | "이메일 *" 텍스트, 폼 그룹 내 상단 |
| 이메일 행 | `mg-v2-form-email-row` | 입력 래퍼 + 버튼을 담는 **flex 행**. 한 줄 유지 담당 |
| 입력 래퍼 | `mg-v2-form-email-row__input-wrap` | input을 감싸며, flex로 **남는 공간 차지**. **최소 너비 보장**으로 0 수축 방지 |
| 입력 필드 | `mg-v2-form-input` | 래퍼 안에서 100% 너비 |
| 버튼 | `mg-v2-button` (필요 시 `mg-v2-button--compact` 또는 `[data-action="email-duplicate-check"]`) | 중복확인. flex 수축 없음 |
| 도움말 | `mg-v2-form-help` / `--error` / `--success` | 이메일 행 아래, 필요 시 표시 |

---

## 3. 최소 치수·토큰

### 3.1 입력 영역 (래퍼)

| 속성 | 권장 값 | 토큰 제안 (구현 시) | 비고 |
|------|---------|---------------------|------|
| **최소 너비** | 12rem (192px) | `var(--mg-form-email-input-min-width, 12rem)` 또는 `var(--ad-b0kla-form-email-row-input-min-width, 12rem)` | **0 사용 금지**. 래퍼가 0으로 수축하면 입력란 미노출 |
| **flex** | 1 1 0% (또는 1 1 auto) | — | 남는 공간 차지, 단 **min-width로 0 수축 방지** 필수 |

- **금지**: `.mg-v2-form-email-row__input-wrap`에 `min-width: 0` 지정하지 않음. 유틸 `.u-min-w-0`를 이 래퍼 또는 `.mg-v2-form-email-row`에 적용하지 않음.

### 3.2 버튼 (중복확인)

| 속성 | 권장 값 | 토큰 참조 | 비고 |
|------|---------|-----------|------|
| **flex** | 0 0 auto | — | 줄어들지 않음 |
| **최소 너비** | 버튼 텍스트("중복확인") + 패딩에 맞춤, 명시 시 약 80px 이상 | — | `white-space: nowrap` 유지로 한 줄 텍스트 |
| **높이(compact)** | 32px | — | 한 줄 행과 시각적 균형 |
| **패딩(compact)** | 6px 12px | `var(--mg-spacing-xs)` ~ `var(--mg-spacing-sm)` | B0KlA compact 버튼과 동일 |

### 3.3 행 간격·정렬

| 속성 | 권장 값 | 토큰 |
|------|----------|------|
| **행 내 gap** (입력 래퍼 ↔ 버튼) | 12px | `var(--mg-spacing-md)` 또는 `var(--mg-spacing-sm)` (8px) ~ 12px |
| **행** | `align-items: center` | — | 입력란과 버튼 세로 중앙 정렬 |
| **폼 그룹 내** | 라벨 ↔ 이메일 행 간격 | `var(--mg-spacing-sm)` ~ `var(--mg-spacing-md)` |

- B0KlA·PENCIL 가이드: 간격은 `--mg-spacing-xs`, `--mg-spacing-sm`, `--mg-spacing-md`, `--mg-spacing-lg` 등 기존 토큰 우선 사용. 없으면 `unified-design-tokens.css` 또는 `emergency-design-fix.css`의 `--mg-spacing-*` 참고.

---

## 4. 반응형·줄바꿈

### 4.1 기본 (데스크톱·태블릿)

- **한 줄 유지**: 라벨은 그대로 위, 이메일 행은 [입력 래퍼] + [중복확인 버튼] 한 줄.
- 모달 최소 너비(예: large 720px)가 12rem + 버튼 + gap 보다 넓으므로, 한 줄 유지가 무리 없음.

### 4.2 좁은 뷰포트 (선택)

- **행 단위 줄바꿈**: 뷰포트가 매우 좁을 때만, 이메일 행을 **행 단위**로 줄바꿈할 수 있도록 허용할 수 있음.
  - 예: `flex-wrap: wrap`, 두 번째 줄에 버튼만 오도록. 이 경우에도 **입력 래퍼 최소 너비는 0이 아닌 값**(예: 10rem) 유지.
- **권장**: 기본은 한 줄 유지. 줄바꿈을 도입할 경우에도 `__input-wrap`의 min-width는 **0 미사용**.

### 4.3 브레이크포인트 참조

- `docs/design-system/PENCIL_DESIGN_GUIDE.md` §3, `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md`: 모바일 375px ~ 4K 3840px. 모달은 주로 태블릿·데스크톱에서 사용되므로, 이메일 행 최소 너비(12rem)는 해당 범위에서 유지.

---

## 5. 디자인 토큰 참조

구현 시 아래 토큰을 사용하면 B0KlA·unified-design-tokens와 일관된다.

| 용도 | 토큰 (우선) | 비고 |
|------|-------------|------|
| 간격(행 gap, 라벨–행) | `var(--mg-spacing-sm)`, `var(--mg-spacing-md)` | 8px, 16px 계열 |
| 입력 최소 너비 | `var(--mg-form-email-input-min-width, 12rem)` 또는 `var(--ad-b0kla-form-email-row-input-min-width, 12rem)` | 신규 토큰 도입 시 권장명 |
| 테두리·배경(입력) | `var(--mg-color-border-main)`, `var(--mg-color-surface-main)` | B0KlA 팔레트 |
| 라벨/캡션 텍스트 | `var(--mg-color-text-secondary)` | 12px, #5C6B61 계열 |
| 본문 텍스트 | `var(--mg-color-text-main)` | #2C2C2C |
| 주조 버튼 | `var(--mg-color-primary-main)`, 배경 등 | #3D5246 계열 |
| 버튼 radius(compact) | 8px | B0KlA compact 버튼과 동일 |

- **단일 소스**: `mindgarden-design-system.pen`, `pencil-new.pen`, `unified-design-tokens.css`, `AdminDashboardB0KlA.css`에 정의된 토큰만 사용. 위에 없는 값은 토큰 추가 제안 후 사용.

---

## 6. 요약 (기획 보고용)

| 항목 | 내용 |
|------|------|
| **선호 레이아웃** | 라벨은 폼 그룹 상단 한 줄, 이메일 행은 **한 줄**: [입력 래퍼] + [중복확인 버튼]. 라벨 \| 입력 \| 버튼을 한 줄로 쓰지 않음. |
| **최소 너비** | 입력 래퍼 **12rem(또는 토큰)** 필수. **0 사용 금지.** 버튼은 flex 수축 없음, nowrap. |
| **클래스** | `mg-v2-form-group` → `mg-v2-form-label` + `mg-v2-form-email-row` → `mg-v2-form-email-row__input-wrap` + `mg-v2-button`. |
| **반응형** | 기본 한 줄 유지. 줄바꿈 시에도 `__input-wrap` min-width는 0이 아닌 값 유지. |
| **금지** | `__input-wrap` 또는 이메일 행에 `min-width: 0`, `.u-min-w-0` 적용 금지. |
| **참조 문서** | `CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md`(원인 분석), `PENCIL_DESIGN_GUIDE.md`, `v2/CLIENT_MODAL_ALIGNMENT_SPEC.md`, design-handoff·standardization 스킬. |

---

## 7. 참조 문서

| 문서 | 용도 |
|------|------|
| **본 문서** | 어드민 모달 이메일 행 레이아웃 스펙 — 플래너 보고·코더 구현 기준 |
| `docs/design-system/CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md` | 입력란 미노출 원인 분석·기존 스펙 제안 |
| `docs/design-system/PENCIL_DESIGN_GUIDE.md` | 펜슬·B0KlA 비주얼·토큰·반응형 |
| `docs/design-system/v2/CLIENT_MODAL_ALIGNMENT_SPEC.md` | 내담자/상담사 모달 폼 순서·공통 클래스 |
| `docs/design-system/RESPONSIVE_LAYOUT_SPEC.md` | 브레이크포인트·패딩·그리드 |
| `frontend/src/styles/unified-design-tokens.css` | 구현용 토큰 목록 (디자이너는 토큰명 참고만) |

---

*이 문서는 UI/UX·레이아웃·비주얼 스펙이며, 코드 구현은 core-coder가 수행한다.*

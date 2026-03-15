# 이메일 폼 행 — 입력란 가변·버튼 콤팩트 레이아웃 스펙

**역할**: core-designer (UI/UX·레이아웃 스펙만, 코드 작성 없음)  
**대상**: 이메일 폼 행 (`mg-v2-form-email-row`) — 어드민/클라이언트 모달 공통  
**목적**: "입력란 가변 너비 + 버튼 콤팩트"만 보고 core-coder가 적용할 수 있는 짧은 스펙  
**참조**: ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC.md, ADMIN_MODAL_EMAIL_ROW_TARGET_SPEC.md, CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md

---

## 1. 목표

이메일 행 = **입력란(가변 너비, 가용 공간 차지)** + **중복확인 버튼(콤팩트, 고정/자동 너비)**.  
입력란을 넓게 써서 이메일을 보기·수정하기 쉽고, 버튼은 한 줄에 딱 맞는 크기로 보이게 한다.

---

## 2. 행 내 입력 영역 (input)

- **입력 래퍼** (`mg-v2-form-email-row__input-wrap`)는 **가용 공간을 차지**하고 **눌리지 않게** 한다.
- **flex**: `1 1 0%` 또는 `flex-grow: 1` + `flex-shrink: 1` + basis 0. 즉, 남는 공간을 채우되 flex 수축을 허용한다.
- **min-width**: **반드시 0이 아닌 값**을 둔다. 권장 `12rem` 또는 토큰 `var(--mg-form-email-input-min-width, 12rem)` / `var(--ad-b0kla-form-email-row-input-min-width, 12rem)`. min-width가 0이면 flex로 0까지 수축해 입력란이 안 보일 수 있음.
- **금지**: `__input-wrap` 또는 이메일 행에 `min-width: 0`, `.u-min-w-0` 적용하지 않음.

---

## 3. 행 내 버튼 영역 (button)

- **중복확인 버튼**은 **콤팩트(자동 너비)**로, 넓게 퍼지지 않는다.
- **flex**: `0 0 auto` (또는 `flex: none`). 줄어들지도 늘어나지도 않음.
- **width**: `auto`로 두어 텍스트("중복확인") + 패딩에 맞는 자연 너비. `white-space: nowrap` 유지로 한 줄 텍스트.
- **클래스**: `mg-v2-button mg-v2-button--compact` (필요 시 `mg-v2-button-secondary`, `data-action="email-duplicate-check"`). compact 시 높이·패딩은 B0KlA·CLIENT_MODAL_EMAIL_BUTTON_SPEC 기준.

---

## 4. 행 공통

| 항목 | 값 | 비고 |
|------|-----|------|
| **행 gap** (입력 ↔ 버튼) | 12px | `var(--mg-spacing-md)` 등 |
| **행 정렬** | `align-items: center` | 입력란·버튼 세로 중앙 |

---

## 5. 참조 (상세)

- **깨짐 방지·클래스·반응형**: `ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC.md`
- **목표 비주얼·버튼 시각**: `ADMIN_MODAL_EMAIL_ROW_TARGET_SPEC.md`, `CLIENT_MODAL_EMAIL_BUTTON_SPEC.md`
- **원인 분석·필수 속성**: `CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md`

---

*이 문서는 UI/UX·레이아웃 스펙이며, 코드 구현은 core-coder가 수행한다.*

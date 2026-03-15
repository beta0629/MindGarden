# 이메일 행(.mg-v2-form-email-row) 필수 구조·마크업 스펙

**역할**: core-publisher (HTML/마크업 관점만)  
**목적**: input 래퍼는 flex로 성장·버튼은 flex로 축소·확대되지 않도록 하기 위한 **필수 구조·클래스·순서** 정리. core-coder 마크업 검증 시 참고.  
**범위**: HTML 구조·클래스·data 속성만. JS/React·CSS 코드 수정 없음.  
**참조**: ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC.md, EMAIL_ROW_REQUIRED_MARKUP_AND_OMISSION.md, CLIENT_MODAL_EMAIL_ROW_MARKUP_SPEC.md

---

## 1. 요약

| 구분 | 요구 | 마크업 관점 해결 |
|------|------|------------------|
| **row 컨테이너** | flex 컨테이너로 동작 가능해야 함 | 직계 자식 2개: input 래퍼 1개 + 버튼 1개. 이 둘만 두면 CSS에서 `display: flex` 적용 시 flex 컨테이너로 동작. |
| **input 쪽** | 가용 공간을 차지하는 flex 자식 | **래퍼 필수**: `mg-v2-form-email-row__input-wrap`. 이 래퍼가 flex 자식이 되고, 그 안에 input 1개. 래퍼 없이 input을 직접 자식으로 두면 flex 항목이 input이 되어 0 너비·미노출 위험. |
| **button 쪽** | 콤팩트·자동 너비, flex로 축소·확대 안 됨 | **래퍼 불필요**. 버튼을 row 직계 자식으로 두고, 클래스·data로 식별. CSS에서 `flex: 0 0 auto` 적용 대상이 되도록. |

---

## 2. 필수 구조 (DOM 순서)

```
div.mg-v2-form-group
  ├── label.mg-v2-form-label (for="…")
  ├── div.mg-v2-form-email-row                    ← flex 컨테이너(직계 자식 2개)
  │     ├── div.mg-v2-form-email-row__input-wrap  ← flex 자식 1: 성장용 래퍼
  │     │     └── input.mg-v2-form-input
  │     └── button (중복확인)                      ← flex 자식 2: 고정 폭
  └── small.mg-v2-form-help (조건부)
```

- **순서**: 반드시 **1) __input-wrap, 2) button**. 바꾸면 시각적 순서·접근성 순서가 달라짐.
- **자식 개수**: row 직계 자식은 **2개만** (input-wrap, button). 그 외 노드(텍스트·span 등)를 끼우지 않음.

---

## 3. row 컨테이너 — flex 컨테이너로 쓸 수 있는 구조

| 항목 | 필수 |
|------|------|
| **요소** | `div` (또는 시맨틱상 동일한 블록 컨테이너) |
| **클래스** | `mg-v2-form-email-row` |
| **직계 자식** | `__input-wrap` 1개 + `button` 1개만 |

- **래퍼 추가 금지**: row와 __input-wrap 사이에 div를 하나 더 넣지 않음. row → __input-wrap → input, row → button 구조 유지.
- **flex 적용 위치**: CSS에서 `.mg-v2-form-email-row`에 `display: flex` 등을 적용하면, 위 구조만으로 **입력 래퍼**와 **버튼**이 각각 flex 항목이 됨.

---

## 4. input 쪽 — 가용 공간을 차지하는 flex 자식

| 항목 | 필수 |
|------|------|
| **래퍼 필요 여부** | **필수**. input을 row 직계 자식으로 두지 않음. |
| **래퍼 요소** | `div` |
| **래퍼 클래스** | `mg-v2-form-email-row__input-wrap` |
| **래퍼 직계 자식** | `input` 1개만 |

- **역할**: `__input-wrap`이 **flex 자식 하나**가 되어 “한 칸”을 이룸. CSS에서 이 래퍼에 `flex: 1 1 0%`(또는 `1 1 auto`)와 **min-width: 0이 아닌 값**(예: 12rem)을 주면 가용 공간을 차지하면서 수축으로 인한 미노출을 막을 수 있음. 퍼블 관점에서는 **이 래퍼가 반드시 존재**해야 함.
- **input 클래스**: `mg-v2-form-input`. input은 래퍼 안에서만 사용.

---

## 5. button 쪽 — 콤팩트·자동 너비, flex 축소·확대 없음

| 항목 | 필수 |
|------|------|
| **래퍼 필요 여부** | **불필요**. 버튼을 row 직계 자식으로 둠. |
| **요소** | `button` |
| **클래스** | `mg-v2-button`, `mg-v2-button-secondary`, `mg-v2-button--compact` |
| **data 속성** | `data-action="email-duplicate-check"` (E2E·스타일 스코프·동작 식별용) |
| **접근성** | `aria-label="이메일 중복 확인"` 권장(아이콘만 있거나 보조 설명 필요 시) |

- **역할**: row의 두 번째 flex 자식. CSS에서 `flex: 0 0 auto`로 두면 축소·확대되지 않고 콤팩트·자동 너비로 유지됨. 마크업만으로는 **버튼에 위 클래스·data**를 두어 코더가 선택·스타일 적용하기 쉽게 함.
- **BEM 요소 클래스**: 팀 정책에 따라 `mg-v2-form-email-row__btn` 추가 가능(선택). 없어도 동작에는 문제 없음.

---

## 6. 필수 클래스·속성 요약표

| 위치 | 클래스 / 속성 | 비고 |
|------|----------------|------|
| row | `mg-v2-form-email-row` | flex 컨테이너가 될 블록 |
| input 래퍼 | `mg-v2-form-email-row__input-wrap` | flex로 성장할 자식 1 |
| input | `mg-v2-form-input` | 래퍼 내부 1개 |
| button | `mg-v2-button mg-v2-button-secondary mg-v2-button--compact` | 콤팩트·고정 폭 |
| button | `data-action="email-duplicate-check"` | 식별·E2E용 |

---

## 7. 검증 체크리스트 (core-coder 마크업 검증용)

- [ ] `.mg-v2-form-email-row` 직계 자식이 **정확히 2개**: `.__input-wrap`, `button`
- [ ] `.__input-wrap` 직계 자식이 **input 1개**
- [ ] input에 `mg-v2-form-input` 적용
- [ ] 버튼에 `mg-v2-button--compact`, `data-action="email-duplicate-check"` 적용
- [ ] row 또는 __input-wrap에 `min-width: 0`을 주는 클래스(예: `.u-min-w-0`)가 **없음**
- [ ] 라벨 `for`와 input `id` 일치

---

*이 문서는 HTML/마크업 관점만 다룹니다. JS/React·CSS 구현은 core-coder가 ADMIN_MODAL_EMAIL_ROW_LAYOUT_SPEC 등과 함께 적용합니다.*

# 모달 이메일 행(.mg-v2-form-email-row) HTML 마크업 시안

**역할**: core-publisher (HTML 마크업 시안만 제안, 코드 수정 없음)  
**대상**: 어드민 모달 내 `.mg-v2-form-email-row` — 라벨·입력 필드·중복확인 버튼 구조  
**목적**: 입력 필드/레이아웃 깨짐(“중복확인”만 보임) 방지를 위한 **올바른 HTML 마크업** 정의 및 기획(플래너) 보고  
**참조**: ClientModal.js 291~318행, EMAIL_ROW_MARKUP_ACCESSIBILITY_ANALYSIS.md, CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC.md, CLIENT_MODAL_EMAIL_BUTTON_SPEC.md, core-solution-publisher SKILL

---

## 1. 요약

- **form-group** 직하에 **label**을 두고, 형제로 **mg-v2-form-email-row**를 두는 패턴 유지.
- **email-row** 내부: **mg-v2-form-email-row__input-wrap**이 input만 감싸고, **button**은 그 형제.  
  → flex 레이아웃에서 “한 칸(래퍼)이 남은 공간을 차지, 버튼은 고정 폭”이 되도록 하는 구조가 마크업만으로 명확함.
- 접근성: **label `for`** 와 **input `id`** 필수·일치. 버튼은 `data-action="email-duplicate-check"` 권장, 필요 시 `aria-label`/`aria-busy`.

---

## 2. 권장 DOM 구조 (트리)

```
div.mg-v2-form-group
  ├── label.mg-v2-form-label (for="…" 연결)
  ├── div.mg-v2-form-email-row
  │     ├── div.mg-v2-form-email-row__input-wrap
  │     │     └── input.mg-v2-form-input (id="…")
  │     └── button (중복확인)
  ├── small.mg-v2-form-help (조건부: 수정 시 안내, 중복 결과 메시지)
  └── datalist (해당 모달에서 사용 시)
```

- **form-group > label + email-row**  
  다른 form-group과 동일하게 “라벨 + 제어 영역” 한 덩어리로 시맨틱하게 유지.
- **email-row > __input-wrap + button**  
  `__input-wrap`이 **한 개의 flex 자식**으로 남은 공간을 차지하고, 그 안에 input을 두어 전역 `width: 100%`와 충돌 없이 한 줄 레이아웃을 만듦.  
  래퍼가 없으면 input이 flex 자식이 되어 `flex: 1 1 0%`·`min-width: 0` 등으로 **계산 너비 0**이 될 수 있어, 기존 디버그 문서에서 확인된 “입력란 미노출” 원인과 일치함.  
  따라서 **래퍼(__input-wrap) 유지**가 필수.

---

## 3. 올바른 HTML 마크업 예시

아래는 **내담자/상담사/스태프 등록·수정 모달**에 공통 적용 가능한 시맨틱·BEM·접근성 반영 예시이다.  
실제 구현 시 모달별로 `id`/`for` 값만 접두이로 구분한다(client-, consultant-, staff- 등).

```html
<!-- Molecule: 이메일 폼 그룹 (라벨 + 이메일 행 + 도움말) -->
<div class="mg-v2-form-group">
  <label for="client-modal-email" class="mg-v2-form-label">이메일 *</label>
  <div class="mg-v2-form-email-row">
    <div class="mg-v2-form-email-row__input-wrap">
      <input type="email"
             id="client-modal-email"
             name="email"
             required
             placeholder="example@email.com"
             class="mg-v2-form-input"
             autocomplete="email"
             list="client-modal-email-domains"
             aria-required="true" />
    </div>
    <button type="button"
            class="mg-v2-button mg-v2-button-secondary mg-v2-button--compact"
            data-action="email-duplicate-check"
            aria-label="이메일 중복 확인">
      중복확인
    </button>
  </div>
  <small class="mg-v2-form-help">이메일은 변경할 수 없습니다.</small>
  <datalist id="client-modal-email-domains">
    <option value="@gmail.com"></option>
    <option value="@naver.com"></option>
  </datalist>
</div>
```

- **라벨**: `mg-v2-form-group` 직하에 두고, `for`로 input `id`와 연결.
- **email-row**: `mg-v2-form-email-row` 블록, 내부에 **__input-wrap** + **button** 형제.
- **input**: 반드시 `__input-wrap` 안에만 둠. `id`는 페이지 내 유일, 라벨 `for`와 일치.
- **버튼**: 공통 버튼 클래스 + `mg-v2-button--compact`, `data-action="email-duplicate-check"`.  
  스타일/이벤트는 core-coder 담당.

---

## 4. 구조 검증: form-group > label + email-row > __input-wrap > input, 형제 button

| 검증 항목 | 여부 | 설명 |
|-----------|------|------|
| form-group 직하에 label | ✅ | 다른 form-group과 동일 패턴. 라벨을 form-group 직하에 두는 패턴 유지. |
| form-group 직하에 email-row (label과 형제) | ✅ | “라벨 + 한 줄 제어 영역”이 한 그룹으로 묶임. |
| email-row 직하에 __input-wrap | ✅ | input만 감싸는 래퍼. flex에서 “한 칸”이 되어 남은 공간을 차지하는 주체. |
| __input-wrap 직하에 input | ✅ | 래퍼가 flex 항목, 그 안에서 input은 width: 100%로 채움. |
| button이 __input-wrap과 형제 | ✅ | email-row의 직계 자식으로, __input-wrap과 형제. flex: 0 0 auto로 고정 폭. |
| 래퍼가 flex에서 한 칸을 차지하는 구조가 마크업만으로 명확한지 | ✅ | 마크업상 “email-row의 flex 자식은 2개: __input-wrap, button”이므로, CSS에서 __input-wrap에 flex: 1 1 0% 및 min-width(0 아님)만 적용하면 한 칸 차지가 명확함. |

**결론**: **form-group > label + email-row > __input-wrap > input, 형제로 button** 구조가 맞고, 래퍼가 flex에서 한 칸을 차지하도록 하는 구조는 마크업만으로도 명확하다.

---

## 5. 접근성 (aria, for/id)

| 항목 | 권장 | 비고 |
|------|------|------|
| label `for` / input `id` | 필수, 일치 | 스크린리더에서 라벨–입력 연결. 모달별 고유 id(예: client-modal-email, staff-email, consultant-email). |
| input `required` | 유지 | `aria-required="true"`는 선택(required만으로도 전달 가능). |
| input `autocomplete="email"` | 권장 | 브라우저 자동완성·접근성. |
| 버튼 `aria-label` | 선택 | 문구 예: "이메일 중복 확인". 버튼 텍스트만으로도 의미 전달 가능. |
| 로딩 중 버튼 | 선택 | `aria-busy="true"` 권장. |
| 도움말/에러 메시지 | 유지 | `small.mg-v2-form-help`, `mg-v2-form-help--error`, `mg-v2-form-help--success`. 필요 시 `aria-live="polite"` 또는 `role="status"`는 코더/디자인 스펙에서 결정. |

---

## 6. BEM·클래스명 정리

| 역할 | 클래스 | 비고 |
|------|--------|------|
| 폼 그룹 컨테이너 | `mg-v2-form-group` | 라벨 + 이메일 행 + 도움말을 묶음. |
| 라벨 | `mg-v2-form-label` | |
| 이메일 행(블록) | `mg-v2-form-email-row` | flex 컨테이너. |
| 입력 래퍼(요소) | `mg-v2-form-email-row__input-wrap` | flex 항목 1. 남은 공간 차지용 래퍼. |
| 입력 필드 | `mg-v2-form-input` | 래퍼 내부에서 width: 100%. |
| 중복확인 버튼 | `mg-v2-button mg-v2-button-secondary mg-v2-button--compact` | 공통 버튼 + compact. |
| 도움말 | `mg-v2-form-help`, `mg-v2-form-help--error`, `mg-v2-form-help--success` | |

- **버튼 선택자 강화**: `data-action="email-duplicate-check"` 권장(E2E·스타일 스코프).  
- **BEM 요소로 버튼 명시** 시: `mg-v2-form-email-row__btn` 추가 가능(팀 정책에 따라 선택).  
- 디자인 스펙(CLIENT_MODAL_EMAIL_BUTTON_SPEC)과 동일하게 **mg-v2-form-email-row, __input-wrap, 라벨은 mg-v2-form-group 직하** 패턴 유지.

---

## 7. 모달별 id/for 권장값

| 모달 | label for / input id | 비고 |
|------|----------------------|------|
| 내담자(ClientModal) | `client-modal-email` 또는 `email` | 페이지 내 유일하면 됨. |
| 스태프(StaffManagement) | `staff-email` | |
| 상담사(ConsultantComprehensiveManagement) | `consultant-email` | 현재 없으면 추가 권장(접근성). |

datalist 사용 시 `id`는 예: `client-modal-email-domains` 등 모달별로 고유하게.

---

## 8. 요약 표 (기획 보고용)

| 구분 | 내용 |
|------|------|
| **구조** | form-group > label + mg-v2-form-email-row > __input-wrap > input, 형제로 button. |
| **래퍼** | __input-wrap 필수. flex에서 “한 칸”이 되어 입력란 영역이 0 너비로 붕괴되지 않도록 함. |
| **접근성** | label for / input id 필수·일치. 버튼 data-action, 필요 시 aria-label/aria-busy. |
| **BEM** | mg-v2-form-email-row(블록), mg-v2-form-email-row__input-wrap(요소), 공통 버튼·form-label·form-help 유지. |
| **레이아웃** | 마크업만으로 “래퍼가 한 칸 차지” 구조 명확. 실제 flex/min-width 적용은 core-coder가 CLIENT_MODAL_EMAIL_ROW_LAYOUT_SPEC 등 참고. |

---

*이 문서는 core-publisher의 HTML 마크업 시안이며, JS/React·CSS 수정은 하지 않습니다. 구현 시 core-coder가 본 시안을 반영해 JSX·스타일을 적용합니다.*

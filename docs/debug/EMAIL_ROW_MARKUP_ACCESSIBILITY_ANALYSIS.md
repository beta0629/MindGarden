# 모달 이메일 행 "입력란 미노출" — 마크업·클래스·접근성 관점 원인 분석

**작성**: core-publisher (퍼블리셔 전용 분석)  
**일자**: 2026-03  
**범위**: HTML 마크업·BEM 클래스·시맨틱·접근성만 분석. JS/CSS 직접 수정 제안 없음(권장사항만 기술).

---

## 1. 현상 요약

- **현상**: 모달 내 이메일 행에서 입력 필드가 보이지 않고 "이메일 * 중복확인"만 한 줄로 보임.
- **DOM 위치**: `.mg-modal__body` > `.mg-v2-modal-body` > `form.mg-v2-form` > `div.mg-v2-form-group` (이메일 행).
- **대상**: 내담자(ClientModal) / 상담사(ConsultantComprehensiveManagement) / 스태프(StaffManagement) 등록·수정 모달의 이메일 행.

---

## 2. 래퍼 구조 분석

### 2.1 현재 마크업 구조 (공통 패턴)

```
div.mg-v2-form-group
  ├── label.mg-v2-form-label (이메일 *)
  ├── div.mg-v2-form-email-row
  │     ├── div.mg-v2-form-email-row__input-wrap
  │     │     └── input.mg-v2-form-input
  │     └── button (중복확인)
  ├── small.mg-v2-form-help (조건부)
  └── datalist (ClientModal만)
```

### 2.2 형제 관계·래퍼 역할

| 항목 | 평가 | 설명 |
|------|------|------|
| **label과 .mg-v2-form-email-row의 형제 관계** | 적절함 | `mg-v2-form-group`이 label + 제어 영역(이메일 행)을 묶는 폼 그룹으로 시맨틱하게 맞음. 다른 form-group과 동일한 패턴(라벨 + 입력/제어 영역). |
| **.mg-v2-form-email-row__input-wrap이 input만 감싸고 버튼은 형제** | 적절함 | flex 레이아웃에서 "입력 영역이 남은 공간 차지, 버튼은 고정 폭"을 구현하려면, **flex 항목이 하나**여야 함. input에 직접 `flex: 1`을 주면 전역 `.mg-v2-form-input { width: 100% }` 등과 충돌·계산 꼬임 가능. **래퍼가 flex: 1 1 0%로 공간을 차지하고, 그 안에서 input을 width: 100%로 두는 구조**가 레이아웃·캐스케이드 측면에서 안전함. |
| **래퍼가 없을 때** | 레이아웃 위험 | `__input-wrap` 없이 input과 button을 형제로 두면, flex 컨테이너의 자식이 input·button 두 개. input에 `flex: 1` + `min-width: 0`만 있으면 일부 환경/캐스케이드에서 **계산 너비 0**이 되어 입력란이 접히는 것이 기존 디버그 문서(EMAIL_FORM_LAYOUT_STAFF_MODAL.md)에서 이미 확인된 원인과 일치함. |
| **다른 구조(예: 버튼까지 래퍼 안)** | 비권장 | 버튼까지 한 래퍼에 넣으면 "입력란만 유연 확장"이 어렵고, BEM 관점에서도 "이메일 행 = 입력 래퍼 + 버튼"이 더 명확함. |

**결론**: label과 `.mg-v2-form-email-row`의 형제 관계, 그리고 `.mg-v2-form-email-row__input-wrap`으로 input만 감싸고 버튼은 형제로 두는 구조는 **시맨틱·레이아웃 관점 모두 적절**함. 래퍼가 없거나 잘못 쓰이면 입력란 미노출/붕괴가 발생할 수 있음.

---

## 3. 시맨틱·접근성

### 3.1 label[for] / input[id] / 필수 표시

| 컴포넌트 | label for | input id | 비고 |
|----------|-----------|----------|------|
| **ClientModal** | `htmlFor="email"` | `id="email"` | 일치. 필수 표시 "이메일 *" 적절. |
| **StaffManagement** | `htmlFor="staff-email"` | `id="staff-email"` | 일치. 필수 표시 "이메일 *" 적절. |
| **ConsultantComprehensiveManagement** | **없음** | **없음** | label에 `htmlFor` 없고, input에 `id` 없음 → **접근성 결함**. 스크린리더에서 라벨–입력 연결 안 됨. |

### 3.2 필수 표시(*), 도움말(small)

- 세 곳 모두 라벨에 "이메일 *"로 필수 표시.
- 도움말은 `small.mg-v2-form-help` 사용. 수정 시 "이메일은 변경할 수 없습니다", 중복 결과 메시지 등 적절히 사용됨.
- **권장**: 필수 필드는 `aria-required="true"`(이미 `required` 속성으로 대체 가능), 에러/성공 메시지는 `aria-live="polite"` 또는 `role="status"` 검토(코더·디자인 스펙에서 결정).

### 3.3 구조가 CSS/레이아웃에 미치는 영향

- **label–input 연결**: 접근성만 영향. 레이아웃 깨짐의 직접 원인은 아님.
- **form-group 내부 grid/flex**: `mg-v2-form-group`은 `margin-bottom`만 있고, flex/grid는 이메일 행 쪽에서 `.mg-v2-form-email-row`로 적용됨. 즉, form-group은 블록 배치만 하고, 행 내부 비율은 email-row + `__input-wrap`에 의존. **현재 구조가 flex 선택자(.mg-v2-form-email-row__input-wrap) 적용 전제이므로, 마크업이 레이아웃 이슈의 구조적 원인(0 너비)이 되려면 "래퍼 누락" 또는 "클래스 불일치"가 있어야 함.**

---

## 4. BEM 클래스 적용 여부·세 곳 비교

### 4.1 클래스 일관성

| 클래스/속성 | ClientModal | StaffManagement | ConsultantComprehensiveManagement |
|-------------|-------------|-----------------|-----------------------------------|
| `mg-v2-form-group` | ✅ | ✅ | ✅ |
| `mg-v2-form-label` | ✅ | ✅ | ✅ |
| `mg-v2-form-email-row` | ✅ | ✅ | ✅ |
| `mg-v2-form-email-row__input-wrap` | ✅ | ✅ | ✅ |
| `mg-v2-form-input` | ✅ | ✅ | ✅ |
| `mg-v2-button mg-v2-button-secondary mg-v2-button--compact` | ✅ | ✅ (--compact만 누락 가능성) | ✅ |
| `data-action="email-duplicate-check"` | ✅ | ❌ 없음 | ✅ |
| input `id` / label `htmlFor` | ✅ | ✅ | ❌ 둘 다 없음 |

### 4.2 상세 차이

- **StaffManagement**: 중복확인 버튼에 `data-action="email-duplicate-check"` 없음. 스펙·E2E·선택자 강화 시 동일 적용 권장.
- **ConsultantComprehensiveManagement**:  
  - label에 `htmlFor` 없음, input에 `id` 없음 → 접근성·일관성 위해 `id="consultant-email"` + `htmlFor="consultant-email"` 권장.  
  - 그 외 BEM·구조는 동일.

### 4.3 마크업 동일성

- **구조**: 세 곳 모두 `mg-v2-form-group` > label + `mg-v2-form-email-row` > `mg-v2-form-email-row__input-wrap` > input, 그 형제로 button. **구조는 동일**.
- **차이**: ID/접근성(Consultant), `data-action`(Staff), ClientModal만 `datalist` 보유. 동일 구조 사용 시 **일관된 레이아웃·스타일**을 위해 BEM·속성까지 통일하는 것이 좋음.

---

## 5. 마크업으로 인한 레이아웃 이슈 가능성

### 5.1 입력란이 0 너비로 보일 수 있는 구조적 원인

- **원인 1 — 래퍼 누락**: `mg-v2-form-email-row__input-wrap`이 없이 input과 button만 형제로 두면, flex 컨테이너(.mg-v2-form-email-row)의 자식으로 input에 `flex: 1 1 0%`·`min-width: 0`이 전역 등에서 적용될 수 있어 **계산 너비 0** 가능. 현재 마크업에는 래퍼가 있으므로, **마크업만 보면 이 원인은 제거된 상태**.
- **원인 2 — 래퍼에 대한 스타일 미적용**: CSS에서 `.mg-v2-form-email-row__input-wrap`에 `flex: 1 1 0%`와 **`min-width: 12rem`(또는 동등 최소 너비)** 이 적용되지 않으면, 일부 환경에서 래퍼가 0으로 줄어 입력란 붕괴. 이는 **CSS/번들 순서 문제**이며, 디버그 문서(CLIENT_MODAL_EMAIL_ROW_DEBUG_REPORT.md, EMAIL_FORM_LAYOUT_STAFF_MODAL.md)에서 이미 다룸.
- **원인 3 — 불필요한 래퍼/중첩**: 현재는 form-group > email-row > input-wrap > input으로 **필요한 최소 래퍼만** 사용. 불필요한 div가 과다해 레이아웃이 깨지는 상황은 없음.
- **원인 4 — form-group 내 grid/flex 불일치**: `mg-v2-form-group`은 블록만 담당하고, 행 레이아웃은 `mg-v2-form-email-row`가 담당. 다른 form-group과 구조가 달라서 grid/flex가 꼬이는 형태는 아님.

**정리**: **마크업 구조 자체**는 입력란 미노출의 직접 원인으로 보기 어렵고, **래퍼(__input-wrap)가 있고 동일한 BEM을 쓰는 한** 구조적으로는 안정적. 입력란 미노출은 주로 **해당 래퍼에 대한 CSS(min-width·flex) 미적용 또는 덮어쓰기**와 결부된 이슈로 보는 것이 타당함.

---

## 6. 마크업/클래스 구조 권장사항 (core-planner·기획 보고용)

### 6.1 유지할 구조 (권장)

- **form-group** > **label** + **mg-v2-form-email-row** > **mg-v2-form-email-row__input-wrap** > **input**, 형제로 **button**.  
  → 레이아웃·캐스케이드 안정성과 BEM·시맨틱 관점에서 유지.

### 6.2 일관성·접근성 보강 (수정 제안만, 코드 작성 없음)

1. **ConsultantComprehensiveManagement**  
   - label에 `htmlFor="consultant-email"`, input에 `id="consultant-email"` 추가.  
   - 필수 표시 "이메일 *" 유지.

2. **StaffManagement**  
   - 중복확인 버튼에 `data-action="email-duplicate-check"` 추가.  
   - 스펙·E2E·공통 CSS 선택자와의 일관성 확보.

3. **세 컴포넌트 공통**  
   - 이메일 행 마크업을 **동일한 BEM·속성 세트**로 통일(id/for는 모달별 접두이로 구분: `client-`, `staff-`, `consultant-`).  
   - 도움말/에러 메시지는 계속 `small.mg-v2-form-help`, `mg-v2-form-help--error`, `mg-v2-form-help--success` 사용.

### 6.3 CSS 측은 코더 담당

- 래퍼에 `min-width: 12rem`(또는 디자인 스펙 값) 및 `flex: 1 1 0%` 적용, 번들/선택자 특이도로 덮어쓰기 방지하는 것은 **core-coder**가 기존 디버그 문서를 참고해 수행.

---

## 7. 요약 표

| 구분 | 내용 |
|------|------|
| **래퍼 구조** | label과 .mg-v2-form-email-row 형제, __input-wrap이 input만 감싸고 버튼은 형제 — 시맨틱·레이아웃 모두 적절. 래퍼 누락 시 입력란 붕괴 가능. |
| **시맨틱·접근성** | ClientModal·StaffManagement는 label[for]/input[id] 일치. Consultant은 for/id 없음 → 보강 권장. |
| **BEM 일관성** | 세 곳 구조 동일. Consultant은 for/id, Staff는 data-action 보강 권장. |
| **레이아웃 원인** | 마크업만으로는 입력란 0 너비의 직접 원인 없음. __input-wrap 유지 + 해당 래퍼에 대한 CSS(min-width·flex) 적용이 중요. |
| **권장** | 동일 마크업·BEM·접근성 속성 유지; Consultant에 id/for, Staff에 data-action 추가; CSS는 코더가 디버그 문서 기준 적용. |

---

*이 문서는 퍼블리셔(core-publisher)의 마크업·클래스·접근성 관점 분석만 담았으며, JS/CSS 수정은 core-coder 및 기획(core-planner)과 협의해 반영합니다.*

# 이메일 폼 행 "중복확인" 버튼 과도한 넓이 · 입력란 눌림 — CSS 원인 분석

**작성 목적**: 새 내담자 등록 모달 이메일 행에서 "중복확인" 버튼이 비정상적으로 넓고, 이메일 입력란이 눌려 보이는 **CSS 원인**을 정리한다. 코드 수정은 하지 않으며, core-coder 수정 시 참고용이다.

---

## 1. 증상 요약

- **입력란**: 짧게 눌려 보임(압축됨).
- **버튼**: 오른쪽 "중복확인"이 매우 넓음(연한 녹색 배경·진한 녹색 테두리), 버튼 텍스트는 오른쪽 정렬.
- **결과**: 버튼이 과도하게 넓고 입력란은 좁아 레이아웃 불균형.

---

## 2. 적용된 CSS 규칙 목록 (flex / width / min-width / max-width)

### 2.1 이메일 행 · 입력 래퍼 · 입력 필드

| 파일 | 셀렉터 | 속성 (관련만) |
|------|--------|----------------|
| `AdminDashboardB0KlA.css` | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row` | `display: flex`, `align-items: center`, `gap: 12px`, `width: 100%`, `box-sizing: border-box` |
| `AdminDashboardB0KlA.css` | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap` | `flex: 1 1 0%`, `display: block`, `box-sizing: border-box`, `min-width: 12rem !important` |
| `AdminDashboardB0KlA.css` | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap .mg-v2-form-input` | `width: 100%`, `box-sizing: border-box` |

### 2.2 이메일 행 내 버튼 · 중복확인

| 파일 | 셀렉터 | 속성 (관련만) |
|------|--------|----------------|
| `AdminDashboardB0KlA.css` | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button` | `flex: 0 0 auto`, `flex-shrink: 0` |
| `AdminDashboardB0KlA.css` | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button.mg-v2-button--compact`, `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row [data-action="email-duplicate-check"]`, `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-group .mg-v2-form-email-row .mg-v2-button` | `padding`, `min-height: 28px`, `white-space: nowrap` 등 (flex/width 없음) |

### 2.3 글로벌 · 모달 · 버튼 (영향 가능성)

| 파일 | 셀렉터 | 속성 (관련만) |
|------|--------|----------------|
| `_unified-modals.css` | `.mg-modal__body` | `flex: 1`, `width: 100%`, `min-width: 0`, `box-sizing: border-box` |
| `_unified-modals.css` | `.mg-modal__body .mg-v2-modal-body` | `width: 100%`, `min-width: 0`, `max-width: 100%`, `box-sizing: border-box` |
| `_unified-modals.css` | `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body` | `min-width: 280px !important` (이메일 행 수축 방지 목적) |
| `_unified-modals.css` | `.mg-modal__actions .mg-v2-button` | `min-width: 112px`, `min-height: 40px` (푸터 액션용) |
| `unified-design-tokens.css` | `.mg-v2-button` | `display: inline-flex`, `align-items: center`, `justify-content: center`, `max-width: 100%`, `min-height: 32px` (flex/width 미지정) |
| `Button.css` (ui/Button) | `.mg-v2-button` | `display: inline-flex`, `align-items: center`, `justify-content: center` (flex/width 미지정) |
| `Button.css` | `.mg-v2-button--full-width` | `width: 100%` |
| `Button.css` | `.mg-v2-button__content` | `width: 100%`, `height: 100%` (내부 래퍼) |
| `Button.css` | `.mg-v2-button__text` | `flex: 1`, `text-align: center` (내부 텍스트) |

### 2.4 기타 참고 (다른 컨텍스트)

| 파일 | 셀렉터 | 속성 (관련만) | 비고 |
|------|--------|----------------|------|
| `AuthPageCommon.css` | `.mg-v2-auth-form .mg-v2-form-email-row` | `display: flex`, `gap: 0.5rem` | auth 전용, 클래스명 다름 |
| `AuthPageCommon.css` | `.mg-v2-auth-form .mg-v2-form-email-row .mg-v2-form-input` | `flex: 1`, `min-width: 0` | input에 직접 flex |
| `AuthPageCommon.css` | `.mg-v2-auth-form .mg-v2-form-email-row .mg-v2-auth-email-check-btn` | `flex-shrink: 0`, `width: auto`, `min-width: 90px` | 버튼 폭 제한 |
| `emergency-design-fix.css` | `@media (max-width: 768px)` 내 `.mg-v2-button` | `width: 100%` | **현재 프로젝트에서 import 없음** (참고만) |

### 2.5 ClientModal / unifiedLayoutSystem

- **ClientModal.css**: 이메일 행·버튼에 대한 flex/width 규칙 없음. 주석으로 "AdminDashboardB0KlA.css에서 단일화 적용" 명시.
- **unifiedLayoutSystem.js**: 이메일 행·버튼 관련 인라인/주입 스타일 없음.

---

## 3. 원인 후보 요약

### 3.1 "버튼이 넓어지는" 규칙 후보

- **후보 A — 전역/미디어 규칙**: 다른 스타일시트에서 `.mg-v2-button`에 `width: 100%` 또는 `flex: 1` / `flex-grow: 1`이 적용되면, B0KlA의 `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button { flex: 0 0 auto }`보다 **나중에 로드되거나 더 구체적인 셀렉터**일 경우 버튼이 남은 공간을 차지할 수 있음.
- **후보 B — 푸터 규칙 오적용**: `.mg-modal__actions .mg-v2-button { min-width: 112px }`는 푸터용이지만, DOM 구조나 셀렉터가 겹치면 같은 버튼에 적용될 가능성은 낮음. 반대로 **버튼에만** `min-width`가 크게 잡히는 다른 규칙이 있으면 버튼이 넓어 보일 수 있음.
- **후보 C — emergency-design-fix (현재 미로드)**: `@media (max-width: 768px)` 안의 `.mg-v2-button { width: 100% }`는 **현재 어디에서도 import 되지 않음**. 나중에 해당 CSS가 번들에 포함되면, 768px 이하에서 이메일 행 버튼까지 100% 폭이 되어 "매우 넓음" 현상이 발생할 수 있음.

### 3.2 "입력란이 줄어드는" 규칙 후보

- **후보 D — 모달 본문 min-width**: `.mg-modal__body`의 `min-width: 0`은 flex 자식이 줄어들 수 있게 함. B0KlA에서 `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body { min-width: 280px !important }`로 본문 최소 폭을 주어 입력란 수축을 막고 있음. 이 규칙이 **캐스케이드에서 덮이거나 로드되지 않으면** 입력 영역이 과도하게 줄어들 수 있음.
- **후보 E — input-wrap flex 미적용**: `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap`의 `flex: 1 1 0%`가 더 구체적인 셀렉터(예: 다른 폼/모달 스타일)에 의해 `flex: 0 0 auto` 등으로 덮이면, 입력 래퍼가 내용 크기만 차지하고 나머지 공간이 버튼 쪽으로 넘어가 버튼이 넓어 보일 수 있음.
- **후보 F — 행 자체 폭 제한**: `.mg-v2-form-email-row`의 부모에 `max-width`나 `overflow`로 폭이 잘리면, `flex: 1 1 0%`인 input-wrap이 먼저 `min-width: 12rem`까지 줄어들고, 버튼이 상대적으로 넓어 보일 수 있음.

### 3.3 "텍스트 오른쪽 정렬"에 대한 가능성

- B0KlA·Button 기본은 `justify-content: center`. 버튼이 넓은데 텍스트만 오른쪽이면, **다른 스타일에서** `.mg-v2-button` 또는 `[data-action="email-duplicate-check"]`에 `justify-content: flex-end` / `text-align: right`가 들어갔을 가능성을 검토할 만함.

---

## 4. 수정 시 core-coder 체크 포인트

1. **버튼이 넓어지지 않게**
   - `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row .mg-v2-button` (및 `[data-action="email-duplicate-check"]`)에 `flex: 0 0 auto`, `flex-shrink: 0`이 **실제로 적용되는지** DevTools로 확인.
   - 전역/미디어 쿼리에서 `.mg-v2-button`에 `width: 100%` 또는 `flex: 1`이 있는지 검색하고, 있다면 이메일 행만 제외하도록 셀렉터를 한정(예: `.mg-modal__actions .mg-v2-button`만 유지)할 것.
   - 필요 시 이메일 행 버튼에 한해 `width: auto`, `min-width: <적절한 값>(예: 90px)`을 명시해 콘텐츠 기준 폭으로 고정.

2. **입력란이 눌리지 않게**
   - `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap`에 `flex: 1 1 0%`와 `min-width: 12rem !important`가 적용되는지 확인.
   - `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body { min-width: 280px !important }`가 로드·적용되는지 확인해, 모달 본문이 지나치게 줄어들지 않게 할 것.

3. **캐스케이드·로드 순서**
   - ClientModal을 쓰는 페이지에서 `unified-design-tokens.css` → `AdminDashboardB0KlA.css` 순으로 로드되는지 확인. B0KlA가 뒤에 와야 이메일 행·버튼 규칙이 전역을 덮어쓸 수 있음.
   - `emergency-design-fix.css`를 추가할 계획이 있다면, 모달 이메일 행 내 `.mg-v2-button`에는 `width: 100%`가 적용되지 않도록 예외 처리(예: `.mg-v2-form-email-row .mg-v2-button` 제외)를 권장.

4. **마크업 일치**
   - 이메일 행 구조가 아래와 같은지 확인. 래퍼가 없거나 클래스명이 다르면 B0KlA 규칙이 적용되지 않음.
     - `.mg-v2-form-email-row` > `.mg-v2-form-email-row__input-wrap` > `input.mg-v2-form-input`
     - `.mg-v2-form-email-row` > `button.mg-v2-button` (및 `data-action="email-duplicate-check"`)

---

## 5. 참고: B0KlA 의도된 레이아웃

- **행**: `display: flex`, `width: 100%`, `gap: 12px`.
- **입력 래퍼**: `flex: 1 1 0%`, `min-width: 12rem !important` → 남은 공간을 차지하되 12rem 미만으로는 줄지 않음.
- **input**: `width: 100%`, `box-sizing: border-box` → 래퍼 안에서 전체 폭 사용.
- **버튼**: `flex: 0 0 auto`, `flex-shrink: 0` → 콘텐츠 크기로 고정, 넓어지지 않음.

위가 그대로 적용되면 버튼은 좁고 입력란은 넓어야 하므로, 증상이 있다면 위 체크 포인트 순서로 덮어쓰는 규칙과 로드 순서를 확인하면 된다.

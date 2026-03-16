# MgEmailFieldWithAutocomplete — 필수 마크업 스펙 (1페이지)

**대상**: 코어 컴포넌트 **MgEmailFieldWithAutocomplete** (이메일 input + 자동완성)  
**역할**: core-publisher 제안. HTML 마크업·접근성·BEM만 정의. JS/React·CSS는 core-coder 담당.  
**참조**: `docs/project-management/EMAIL_AUTOCOMPLETE_COMPONENT_PLAN.md` §10, `CLIENT_MODAL_EMAIL_ROW_MARKUP_SPEC.md`, core-solution-publisher SKILL.

---

## 1. 입력·list/datalist 연결

| 항목 | 필수 여부 | 규칙 |
|------|-----------|------|
| **input `id`** | 필수 | 페이지(또는 모달) 내 **유일**. label `for`와 일치. |
| **input `name`** | 필수 | 폼 제출 시 키. 예: `name="email"`. |
| **input `type`** | 필수 | `type="email"`. |
| **input `list`** | datalist 사용 시 | `list` 값 = 문서 내 **datalist `id`** 와 동일. 예: `list="client-modal-email-domains"`. |
| **datalist `id`** | datalist 사용 시 | input `list`와 동일한 값. 페이지 내 유일. |
| **datalist 내부** | datalist 사용 시 | `<option value="…">` 만 사용. 도메인 예시(예: `@gmail.com`) 또는 풀 예시. |

- **커스텀 드롭다운** 사용 시: list/datalist 대신 `role="listbox"`, `aria-controls`, `aria-expanded` 등은 별도 스펙(디자이너/접근성) 참고. 본 문서는 **datalist** 기준.

---

## 2. label · id · name 요약

- **label**: 컴포넌트 외부(form-group) 또는 컴포넌트 루트 직하에 **한 개**. `for="<input id>"` 필수.
- **id**: input에 필수. 사용처별 고유값(예: `client-modal-email`, `staff-email`, `consultant-email`).
- **name**: input에 필수. 보통 `email`. 동일 폼 내 다른 이메일 필드가 있으면 name 구분.

---

## 3. aria-* 속성 (접근성)

| 속성 | 용도 | 권장 |
|------|------|------|
| **aria-required** | 필수 입력 표시 | `required` 속성과 동일하게 전달하려면 `aria-required="true"`. HTML5 `required`만으로도 동작하므로 선택. |
| **aria-invalid** | 유효성 오류 | 오류 시 `aria-invalid="true"`. 정상 시 생략 또는 `false`. |
| **aria-describedby** | 도움말/에러 메시지 연결 | 도움말·에러 요소에 `id` 부여 후 `aria-describedby="해당 id"`. |
| **aria-label** | input 단독 라벨 | **label 요소 + for** 가 있으면 불필요. 비가시 라벨만 있을 때 사용. |
| **datalist** | 네이티브 datalist | 브라우저가 input과 자동 연동. 별도 `aria-autocomplete`, `aria-controls` 불필요. |

- **커스텀 드롭다운** 시: `aria-autocomplete="list"`, `aria-controls="목록 id"`, `aria-expanded`, `aria-activedescendant` 등은 listbox 패턴에 맞게 별도 정의.

---

## 4. BEM · 시맨틱 HTML

### 4.1 BEM (블록·요소)

| 역할 | 클래스 | 비고 |
|------|--------|------|
| **컴포넌트 루트(블록)** | `mg-v2-email-field` | MgEmailFieldWithAutocomplete 한 덩어리. |
| **입력 래퍼(요소)** | `mg-v2-email-field__input-wrap` | input만 감쌈. 행(.mg-v2-form-email-row) 레이아웃에서 flex 한 칸 담당 시 사용. |
| **input** | `mg-v2-form-input` | 기존 폼 입력 클래스 유지. |
| **label** | `mg-v2-form-label` | 기존 폼 라벨 클래스. |

- 모디파이어: 필요 시 `mg-v2-email-field--has-error` 등. 디자인 스펙에서 정의 시 반영.

### 4.2 시맨틱 HTML

- **label**: `<label for="…" class="mg-v2-form-label">` — 입력과 항상 연결.
- **input**: `<input type="email" id="…" name="…" …>` — 시맨틱 입력.
- **datalist**: `<datalist id="…">` + `<option value="…">` — 제안 목록.
- **래퍼**: 시맨틱 태그로 대체 불가한 레이아웃용만 `<div>` 사용. **fieldset/legend** 는 이메일 단일 필드만 있을 경우 생략 가능; 여러 필드를 그룹할 때만 사용.

### 4.3 계층 (아토믹)

- **Molecule**: label + input + (datalist 또는 커스텀 목록). 코어 컴포넌트 단위.

---

## 5. 행(.mg-v2-form-email-row)과의 관계

- **행**: 레이아웃 전용. "input 영역 + (선택) 중복확인 버튼" 한 줄 배치.
- **코어 컴포넌트**: 행 **안**에 위치. `div.mg-v2-form-email-row` > `div.mg-v2-form-email-row__input-wrap` > **MgEmailFieldWithAutocomplete** (또는 그 출력인 `mg-v2-email-field` 루트).
- **label**: form-group 직하에 두는 기존 패턴 유지 시, label은 컴포넌트 **밖**(form-group)에 두고 `for`로 input `id`만 연결해도 됨.

---

## 6. 체크리스트 (퍼블/코더 공통)

- [ ] input에 `id`, `name`, `type="email"` 필수.
- [ ] label `for`와 input `id` 일치.
- [ ] datalist 사용 시 input `list`와 datalist `id` 동일.
- [ ] 접근성: `aria-invalid`(오류 시), `aria-describedby`(도움말/에러 연결) 필요 시 적용.
- [ ] BEM: `mg-v2-email-field`(블록), `mg-v2-email-field__input-wrap`(요소), 기존 `mg-v2-form-input`/`mg-v2-form-label` 사용.
- [ ] 시맨틱: label·input·datalist 적절 사용, 불필요한 div 최소화.

---

*이 문서는 core-publisher의 필수 마크업 제안이며, 구현·스타일·로직은 core-coder가 담당합니다.*

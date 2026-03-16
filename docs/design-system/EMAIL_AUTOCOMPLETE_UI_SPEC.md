# 이메일 자동완성 UI 스펙 (MgEmailFieldWithAutocomplete)

**역할**: core-designer (UI/UX·비주얼 스펙만, 코드 작성 없음)  
**대상**: 코어 컴포넌트 MgEmailFieldWithAutocomplete — datalist / custom-dropdown 모드  
**참조**: PENCIL_DESIGN_GUIDE.md, EMAIL_AUTOCOMPLETE_COMPONENT_PLAN.md §10, 어드민 대시보드 샘플, `frontend/src/styles/unified-design-tokens.css`

---

## 1. 적용 범위·전제

- **이메일 행**(`.mg-v2-form-email-row`)은 **레이아웃 전용**으로 유지하며, 그 **안에** MgEmailFieldWithAutocomplete를 넣어 사용한다.
- 기존 B0KlA·`unified-design-tokens` 및 `.mg-v2-form-email-row` 스타일과 **동일한 비주얼 언어**를 유지한다.
- 모드: **datalist**(네이티브) 또는 **custom-dropdown**(TabletRegister 등 기존 `.mg-v2-email-suggestions` 방식).

---

## 2. Placeholder

| 항목 | 값 | 토큰/클래스 |
|------|-----|-------------|
| **placeholder 텍스트** | `example@email.com` (또는 화면별 동일 의미 문구) | — |
| **placeholder 색상** | 보조 텍스트 톤 | `var(--mg-color-text-secondary)` 또는 B0KlA: `var(--ad-b0kla-placeholder)` / PENCIL: #5C6B61 |
| **input 본문 색상** | 본문 텍스트 | `var(--mg-color-text-main)` / #2C2C2C |
| **input 클래스** | 기존 폼 입력과 동일 | `mg-v2-form-input` 유지. 코어 컴포넌트 내부 input도 동일 클래스 사용. |

- placeholder는 **한 화면 내 이메일 필드가 하나일 때**와 **여러 개일 때** 모두 동일 문구 사용 가능. 필요 시 props로 오버라이드 허용(기획·코더 협의).

---

## 3. Datalist 노출 스타일 (mode: datalist)

### 3.1 네이티브 datalist 사용 시 제약

- **브라우저 제어**: `<datalist>`는 브라우저가 노출 방식(위치·크기·폰트·색상)을 제어한다. **스타일을 CSS로 통일할 수 없음** (브라우저·OS별로 다름).
- **제약 정리**:
  - 드롭다운 배경·테두리·radius·타이포를 B0KlA와 완전히 동일하게 맞추는 것은 **불가**.
  - **가능한 것**: input 자체 스타일(`mg-v2-form-input`, placeholder 색 등)은 토큰 유지; `list` 속성으로 옵션만 제공.
- **권장**: 시각적 일관성이 중요한 화면(어드민 모달 등)은 **custom-dropdown** 모드 사용 검토. 단순·접근성 우선이면 **datalist** 유지(키보드·스크린리더 대응 양호).

### 3.2 Datalist 모드에서 맞출 수 있는 부분

- **input 영역만** B0KlA·토큰 준수: 배경, 테두리(`var(--mg-color-border-main)` / #D4CFC8), border-radius(예: 8px·10px, `var(--mg-radius-md)` 등), padding, font(Noto Sans KR, 14–16px).
- **옵션 내용**: 도메인 목록(@gmail.com, @naver.com 등)은 Phase 1 결과대로 **한 곳 상수**로 통일.

---

## 4. Custom-dropdown 노출 스타일 (mode: custom-dropdown)

기존 `AuthPageCommon.css`의 `.mg-v2-email-suggestions`·`.mg-v2-email-suggestion-item`을 **코어 컴포넌트 전용 CSS**로 이전할 때 아래와 동일한 비주얼을 유지한다.

| 항목 | 값 | 토큰/클래스 |
|------|-----|-------------|
| **컨테이너** | input 하단, 좌우 맞춤 | position: absolute; top: 100%; left: 0; right: 0; margin-top: 4px |
| **배경** | 서페이스 | `var(--mg-color-surface-main)` / #F5F3EF |
| **테두리** | 1px | `var(--mg-color-border-main)` / #D4CFC8 |
| **모서리** | 8px | `var(--mg-radius-md)` |
| **그림자** | 드롭다운 구분감 | 예: 0 4px 12px rgba(0,0,0,0.08) (토큰 있으면 `var(--mg-shadow-*)` 사용) |
| **최대 높이** | 200px, 세로 스크롤 | overflow-y: auto |
| **항목 패딩** | 10px 12px | — |
| **항목 글자** | 14px, 본문 색 | `var(--mg-color-text-main)` |
| **항목 구분선** | 마지막 제외 1px 하단 | `var(--mg-color-border-main)` |
| **hover/focus** | 주조 계열 연한 배경 | rgba(61, 82, 70, 0.08) 또는 `var(--mg-color-primary-main)` 저채도 배경 |
| **z-index** | 모달·다른 오버레이 아래에서도 노출 | 10 이상 (모달 내부 시 100 등 컨텍스트에 맞게) |

- **클래스명**: 코어 컴포넌트 전용으로 `.mg-email-field__suggestions`, `.mg-email-field__suggestion-item` 등 BEM 유지 시, **기존 `.mg-v2-email-suggestions`와 동일한 스타일값**을 적용해 비주얼 일치 유지.

---

## 5. 접근성 (포커스·키보드·스크린리더)

| 영역 | 요구 사항 | 비고 |
|------|-----------|------|
| **포커스** | input에 명확한 focus 링(2px outline 또는 box-shadow). 색상: 주조 `var(--mg-color-primary-main)` 또는 `var(--ad-b0kla-green)`. | `:focus-visible` 권장. |
| **키보드** | Tab으로 input 진입 → 입력 시 목록 노출(custom-dropdown) → **Arrow Up/Down**으로 옵션 이동, **Enter**로 선택. **Escape**로 목록 닫기. | datalist는 브라우저 기본 동작 따름. custom-dropdown은 코어 컴포넌트에서 키보드 이벤트 처리. |
| **스크린리더** | input에 `aria-label` 또는 연결된 `<label for="…">` 필수. custom-dropdown 시 **listbox** 역할: 컨테이너 `role="listbox"`, 옵션 `role="option"`, `aria-activedescendant`·`aria-expanded` 등 ARIA 상태 반영. | core-publisher 마크업 스펙과 연동. |
| **에러/도움말** | 유효성·중복확인 결과는 `aria-describedby`로 도움말/에러 영역과 연결. `aria-invalid` 조건부 설정. | 이메일 행 바깥(레이아웃)에 있는 도움말 텍스트와 id 연결. |

- **레이블**: "이메일" 등 레이블 텍스트는 **이메일 행(부모)**에서 제공하되, 코어 컴포넌트는 `id`·`aria-label`(또는 label 연결)을 props로 받아 접근성 완결.

---

## 6. B0KlA·unified-design-tokens.css 참조

- **색상**: `var(--mg-color-text-main)`, `var(--mg-color-text-secondary)`, `var(--mg-color-surface-main)`, `var(--mg-color-border-main)`, `var(--mg-color-primary-main)`. B0KlA 스코프 내에서는 `var(--ad-b0kla-green)`, `var(--ad-b0kla-placeholder)`, `var(--ad-b0kla-border)`, `var(--ad-b0kla-card-bg)` 등 기존 어드민 토큰 유지.
- **간격**: `var(--mg-spacing-md)`(예: 12px), 행 gap·패딩은 EMAIL_ROW_INPUT_BUTTON_LAYOUT_SPEC.md와 동일.
- **radius**: input·드롭다운 `var(--mg-radius-md)` 또는 8–10px.
- **타이포**: Noto Sans KR, 본문 14–16px, 라벨/캡션 12px (PENCIL_DESIGN_GUIDE §2.4).
- **구현 시**: `unified-design-tokens.css`에 정의된 `--mg-*`, `--ad-b0kla-*`만 사용하고, hex 직접 사용 지양.

---

## 7. 체크리스트 (코더·QA용)

- [ ] placeholder 색상이 보조 텍스트 토큰과 일치하는가?
- [ ] datalist 모드 시 input 스타일만 B0KlA/토큰을 따르는가? (드롭다운 스타일 제어 불가 인지)
- [ ] custom-dropdown 모드 시 기존 `.mg-v2-email-suggestions`와 동일한 비주얼(배경·테두리·hover)인가?
- [ ] input focus 링이 명확하고 주조/토큰 색을 쓰는가?
- [ ] custom-dropdown에서 Arrow Up/Down, Enter, Escape 동작하는가?
- [ ] label 연결 또는 aria-label, listbox/option·aria 상태가 스펙대로인가?

---

*이 문서는 UI/UX·비주얼 스펙이며, 구현은 core-coder, 마크업·ARIA 상세는 core-publisher 스펙과 협업하여 적용한다.*

# 이메일 폼 행 "깨짐" 정밀 원인 분석 보고서

**역할**: core-debugger  
**일자**: 2026-03  
**산출**: 원인 요약, 재현 절차, 확인 포인트, core-coder 수정 제안·체크리스트 (코드 수정 없음)

---

## 1. 증상·제공 정보 요약

| 항목 | 내용 |
|------|------|
| **사용자 보고** | 이메일 폼이 여전히 깨짐 |
| **DOM 경로** | `div.mg-modal-overlay.mg-modal-overlay--visible.mg-v2-ad-b0kla` > `div.mg-modal.mg-modal--large.mg-v2-ad-b0kla` > `div.mg-modal__body` > `div.mg-v2-modal-body` > `form.mg-v2-form` > `div.mg-v2-form-group[6]` > `div.mg-v2-form-email-row` |
| **제공 HTML** | `<div class="mg-v2-form-email-row" data-cursor-element-id="cursor-el-1">중복확인</div>` — 내부에 "중복확인" 텍스트만 보이고, **입력 필드/레이아웃이 깨진 것으로 추정** |
| **위치** | top=437px, left=89px, width=706px, height=48px |

---

## 2. 제공 HTML 해석 — DOM vs CSS

제공된 HTML이 **실제 DOM**을 그대로 반영한 것인지, **요소는 있으나 시각적으로만 사라진 것**인지에 따라 원인 후보가 나뉜다.

### 2.1 시나리오 A: DOM에 `__input-wrap`·`input`이 **실제로 없음**

- **의미**: 해당 `.mg-v2-form-email-row` 안에 `div.mg-v2-form-email-row__input-wrap`과 `input.mg-v2-form-input`이 없고, 버튼 텍스트("중복확인")만 있는 상태.
- **가능성**:  
  - 다른 코드 경로/컴포넌트가 동일 클래스만 쓰고 래퍼·input 없이 렌더링하는 경우.  
  - 단, **ClientModal.js(291~318), StaffManagement.js(756~780), ConsultantComprehensiveManagement.js(1568~1593)** 를 확인한 결과, 세 곳 모두 **항상** `.__input-wrap` > `input` 구조를 렌더링함. 조건부로 래퍼/input을 빼는 분기 없음.
- **결론**: 현재 코드베이스 기준으로는 **DOM에서 래퍼/input이 아예 없는 경로는 없음**. 단, 스냅샷이 다른 페이지/빌드/접근성 트리일 수 있으므로 **실제 Elements 탭에서 자식 노드 존재 여부 확인 필수**.

### 2.2 시나리오 B: DOM에는 있으나 **시각적으로 0 너비 또는 숨겨짐** (CSS/레이아웃)

- **의미**: `.__input-wrap`과 `input`은 존재하나, `width`/`min-width`/`display`/`visibility`/`overflow` 등으로 보이지 않거나 공간을 차지하지 않음.
- **가능성**:  
  - flex에서 `flex: 1 1 0%`만 있고 `min-width`가 0으로 덮어씌워져 입력란 래퍼가 0으로 수축.  
  - 상위 `.mg-modal__body` / `.mg-v2-modal-body`의 `min-width: 0`으로 본문 전체가 수축하고, 그 안 flex 자식이 0으로 배치됨.  
  - 전역·유틸 규칙이 나중에 적용되어 `.__input-wrap`의 `min-width: 12rem`을 덮어씀.

---

## 3. 코드·마크업·CSS 분석 결과

### 3.1 마크업 (래퍼/input 렌더 여부)

| 파일 | 이메일 행 구조 | 비고 |
|------|----------------|------|
| **ClientModal.js** 291~318 | `mg-v2-form-email-row` > `mg-v2-form-email-row__input-wrap` > `input.mg-v2-form-input` + 버튼(형제) | 래퍼·input 무조건 렌더 |
| **StaffManagement.js** 756~780 | 동일 구조 | 동일 |
| **ConsultantComprehensiveManagement.js** 1568~1593 | 동일 구조 (create 시에만 버튼) | 동일 |

- **클래스 오타**: 없음. 세 곳 모두 `mg-v2-form-email-row`, `mg-v2-form-email-row__input-wrap`, `mg-v2-form-input` 일치.
- **정리**: 마크업 누락·클래스 오타로 인한 “DOM 자체 문제”는 **현재 소스상 근거 없음**. 다만 사용자 환경에서 스냅샷이 “중복확인”만 보인다면, **실제 DOM에서 자식 노드 존재 여부**를 반드시 확인해야 함.

### 3.2 CSS — 이메일 행·래퍼·input

| 소스 | 선택자 | 핵심 속성 | 비고 |
|------|--------|-----------|------|
| **_unified-modals.css** 44~48 | `.mg-modal__body .mg-v2-modal-body` | `min-width: 0` | 본문 자체 수축 가능 |
| **_unified-modals.css** 51~53 | `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body` | **`min-width: 280px`** | B0KlA 본문 수축 완화(이미 적용됨) |
| **AdminDashboardB0KlA.css** 993~1012 | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row`, `__input-wrap`, input | `__input-wrap`: `flex: 1 1 0%`, **`min-width: 12rem !important`** | 이메일 행·래퍼·input |
| **ClientModal.css** 8~42 | `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row__input-wrap` 등 | `__input-wrap`: `flex: 1 1 0%`, **`min-width: 12rem !important`** | 내담자·스태프 모달에서 더 높은 특이도 |

- **unified-design-tokens.css** 13850~13859: `.mg-v2-modal-body { min-width: 0; }` — 전역 규칙. `_unified-modals.css`의 B0KlA 한정 규칙(280px)이 특이도가 더 높아 이론상 280px가 적용되어야 함.
- **ClientModal.css**는 **ClientComprehensiveManagement(내담자)·StaffManagement(스태프)** 에서만 로드됨. **ConsultantComprehensiveManagement(상담사)** 는 B0KlA.css만 적용.

### 3.3 CSS 로드·캐스케이드

- **main.css** (App.js 등): `unified-design-tokens.css` → … → `06-components/_unified-modals.css` → … → `08-utilities/_utilities.css` → `index.css`.
- **페이지별**:  
  - 내담자: ClientComprehensiveManagement → B0KlA.css, ClientModal → ClientModal.css.  
  - 스태프: StaffManagement → unified-design-tokens, **ClientModal.css**, **B0KlA.css** (이 순서).  
  - 상담사: ConsultantComprehensiveManagement → B0KlA.css만 (ClientModal.css 없음).

**덮어쓰기 가능성**  
- `.__input-wrap`에 `min-width: 12rem`을 거는 규칙은 **B0KlA**와 **ClientModal** 두 곳뿐이며, ClientModal.css 선택자가 더 구체적이라 내담자·스태프에서는 ClientModal.css가 우선.  
- **나중에** 번들에 포함되는 CSS에서 `.__input-wrap` 또는 그 부모에 `min-width: 0`(또는 `!important`)을 적용하는 규칙이 있으면 12rem이 덮일 수 있음.  
- **07-utilities/_utilities.css**의 `.u-min-w-0 { min-width: 0 !important; }`는 **main.css에서 import되지 않음** (08-utilities만 import). 단, 다른 진입점에서 07-utilities가 로드되거나, JSX에 `u-min-w-0`를 붙이면 영향 가능.  
- **emergency-design-fix.css**의 `.mg-v2-modal-body { min-width: 0 }`는 프로젝트 내에서 import하는 파일이 없어 현재 번들에는 포함되지 않는 것으로 판단.

### 3.4 flex/grid·전역 min-width: 0

- `.mg-modal__body`(40행), `.mg-modal__body .mg-v2-modal-body`(45~48행)에 `min-width: 0`이 있으나, B0KlA용으로 51~53행에서 `min-width: 280px`로 오버라이드되어 있음.
- **가설**: 일부 환경/번들 순서에서 280px 오버라이드가 적용되지 않거나, **다른 상위 래퍼**(예: form, .mg-v2-form)에 `min-width: 0`이 걸려 있어, 그 자식인 `.mg-v2-form-email-row`의 사용 가능 너비가 0에 가깝게 되고, `__input-wrap`(flex: 1 1 0%)이 0으로 그려질 수 있음.  
- **mindgarden-design-system.css**의 `min-width: 0`은 `.mg-v2-card-header-*`에만 있고, 이메일 행/폼에는 해당 없음.

### 3.5 스크립트에 의한 DOM 변경

- ClientModal/StaffManagement/ConsultantComprehensiveManagement에서 이메일 행 DOM을 동적으로 제거·대체하는 코드는 **없음**.  
- 따라서 **스크립트로 인한 DOM 제거**는 원인으로 보이지 않음.

---

## 4. 정밀 원인 요약 (근본 원인 가설)

1. **가설 1 — 상위 min-width: 0 연쇄**  
   - `.mg-modal__body` / `.mg-v2-modal-body`의 `min-width: 0`이 (B0KlA 오버라이드가 어떤 이유로 적용되지 않아) 그대로 적용되고, 그 안 flex 맥락에서 `.mg-v2-form-email-row`의 사용 가능 너비가 0이 됨.  
   - 그 결과 `__input-wrap`(flex: 1 1 0%)이 0으로 배치되거나, 레이아웃 엔진이 입력란을 사실상 0 너비로 그림.  
   - **확인**: DevTools에서 `.mg-modal__body`, `.mg-v2-modal-body`, `.mg-v2-form-email-row`의 **computed width**가 0인지 확인.

2. **가설 2 — __input-wrap의 min-width 덮어쓰기**  
   - 전역/다른 컴포넌트 CSS가 번들 순서상 B0KlA/ClientModal **이후**에 로드되며, `.__input-wrap`(또는 그 부모)에 `min-width: 0`(또는 `!important`)을 적용하는 규칙이 있어 12rem이 무시됨.  
   - **확인**: Styles 패널에서 `.__input-wrap`의 `min-width: 12rem`에 취소선이 있는지, 그 위에 다른 파일·라인이 올라와 있는지 확인.

3. **가설 3 — 제공 HTML이 “실제 DOM”이 아닌 경우**  
   - 스냅샷이 “텍스트만” 보여주는 뷰(접근성 트리, innerText 수준)라면, DOM에는 `__input-wrap`·input이 있는데 **CSS로만 0 너비/숨김**일 수 있음.  
   - **확인**: Elements 탭에서 `.mg-v2-form-email-row`를 펼쳐 `.__input-wrap`과 `input`이 존재하는지 확인.

---

## 5. 재현 절차 (단계별)

1. 개발 서버 실행 후 어드민으로 로그인.
2. **내담자 종합관리** 이동 → **등록** 클릭 → 모달에서 이메일 행 확인.
3. **상담사 종합관리** 이동 → **등록** 클릭 → 모달에서 이메일 행 확인.
4. **스태프 관리** 이동 → **새 스태프 등록** 클릭 → 모달에서 이메일 행 확인.
5. 각 경우에 대해 개발자 도구에서:
   - **Elements**: `.mg-v2-form-email-row` 하위에 `.__input-wrap`과 `input.mg-v2-form-input` **존재 여부** 확인.
   - **Computed**: `.mg-v2-form-email-row`, `.__input-wrap`, `input`의 **width / min-width** 값 기록.
   - **Styles**: `.__input-wrap`의 `min-width: 12rem` 적용·취소선 여부와, `.mg-modal__body` / `.mg-v2-modal-body`의 `min-width` 적용 규칙 확인.

---

## 6. 확인 포인트 (체크리스트)

| # | 확인 항목 | 기대(정상) | 의심(깨짐 시) |
|---|-----------|------------|----------------|
| 1 | `.mg-v2-form-email-row` 하위에 `.__input-wrap`·`input` 존재 | 있음 | 없음(또는 스냅샷만 없음) |
| 2 | `.mg-v2-form-email-row` computed width | > 0 | 0 또는 매우 작음 |
| 3 | `.__input-wrap` computed **min-width** | 192px(12rem) | 0px |
| 4 | `.__input-wrap` computed **width** | > 0 | 0px |
| 5 | `input.mg-v2-form-input` computed width | 래퍼의 100% | 0px 등 |
| 6 | `.mg-modal__body .mg-v2-modal-body` computed **min-width** | 280px (B0KlA) | 0px |
| 7 | Styles 패널에서 `.__input-wrap`의 `min-width: 12rem` | 적용됨(취소선 없음) | 취소선 있음 / 다른 규칙이 덮어씀 |

---

## 7. core-coder에게 전달할 수정 제안

### 7.1 제안 1 (우선 권장) — 모달 본문 min-width 확실히 유지

- **파일**: `frontend/src/styles/06-components/_unified-modals.css`  
- **위치**: 51~53행 근처 (B0KlA 모달 본문 규칙)  
- **방향**:  
  - 현재 이미 `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body { min-width: 280px; }`가 있음.  
  - **캐스케이드가 뒤집히지 않도록** 동일 규칙에 `!important`를 검토하거나, 번들 순서상 이 규칙보다 나중에 오는 전역 규칙이 `.mg-v2-modal-body`에 `min-width: 0`을 주는지 확인.  
  - 필요 시 `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body { min-width: 280px !important; }`로 강제. (다른 모달 레이아웃·스크롤에 부작용 없는지 확인 후 적용.)

### 7.2 제안 2 — __input-wrap min-width 덮어쓰기 방지

- **파일**: `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`, `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.css`  
- **위치**: `.__input-wrap`에 대한 `min-width: 12rem` 규칙  
- **방향**:  
  - 이미 ClientModal.css에는 `!important`가 있음. B0KlA.css에도 `min-width: 12rem !important;` 적용해 전역/유틸 규칙에 덮이지 않도록 함.  
  - 상담사 모달은 ClientModal.css가 없으므로 **B0KlA.css 쪽에서 반드시** 12rem이 적용되도록 하는 것이 중요.

### 7.3 제안 3 — form / .mg-v2-form 최소 너비

- **파일**: `frontend/src/styles/06-components/_unified-modals.css` 또는 B0KlA/ClientModal 쪽  
- **방향**:  
  - `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form` (또는 form)에 `min-width: 0`이 걸려 있지 않은지 검색.  
  - 필요 시 B0KlA 모달 본문 내 form에 `min-width: min(100%, 320px)` 등으로 최소 너비를 주어, flex 연쇄 수축을 한 단계 더 막는 방안 검토.

### 7.4 제안 4 (검증용) — 가설 1 검증

- **파일**: `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.css`  
- **방향**:  
  - `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body`에 대해 `min-width: 280px`를 한 번 더 명시(또는 `!important`)하여, 가설 1(상위 수축)이 맞는지 실험.  
  - 재현이 사라지면 상위 min-width 연쇄가 원인일 가능성 높음.

---

## 8. core-coder 태스크 설명 초안

**제목**: 모달 이메일 행 입력란 0 너비/미노출 — CSS 수정

**배경**  
- 내담자/상담사/스태프 모달에서 이메일 행의 입력란이 0 너비 또는 미노출되고, "이메일 * / 중복확인"만 보이는 현상이 지속됨.  
- B0KlA/ClientModal에서 `.__input-wrap`에 `min-width: 12rem`을 두었고, _unified-modals.css에서 B0KlA 본문에 `min-width: 280px`를 두었으나 여전히 재현됨.

**요청 사항**  
1. **우선**: `_unified-modals.css`의 B0KlA 모달 본문 규칙(`.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body`)이 다른 전역 규칙에 덮이지 않도록, 필요 시 `min-width: 280px !important` 적용. 다른 모달 레이아웃·스크롤 영향 확인.  
2. **필수**: AdminDashboardB0KlA.css의 `.__input-wrap`에 `min-width: 12rem !important` 적용(상담사 모달에서 B0KlA만 적용되므로).  
3. **검증**: 내담자 등록/수정, 상담사 등록/수정, 스태프 등록 모달에서 이메일 행 입력란이 정상 너비로 보이는지 확인.  
4. **추가**: DevTools로 `.__input-wrap`의 computed `min-width`가 192px(12rem)인지, `.mg-v2-modal-body`의 computed `min-width`가 280px인지 확인.

**참고**  
- `docs/debug/EMAIL_ROW_LAYOUT_PRECISE_ANALYSIS.md`  
- `docs/debug/EMAIL_ROW_MARKUP_ACCESSIBILITY_ANALYSIS.md`  
- 본 문서: `docs/debug/EMAIL_FORM_ROW_BREAKAGE_ROOT_CAUSE_ANALYSIS.md`

---

## 9. 수정 후 확인 체크리스트

- [ ] 내담자 등록/수정 모달에서 이메일 행에 입력란과 중복확인 버튼이 한 줄로 정상 노출되는가?
- [ ] 상담사 등록/수정 모달에서 동일한가?
- [ ] 스태프 등록 모달에서 동일한가?
- [ ] DevTools Computed에서 `.__input-wrap`의 min-width가 192px(12rem)로 나오는가?
- [ ] 다른 모달(일반 모달, fullscreen 등) 레이아웃·스크롤에 이상이 없는가?

---

**문서 끝.**

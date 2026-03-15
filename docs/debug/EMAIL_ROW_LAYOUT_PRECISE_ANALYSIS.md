# 이메일 행 깨짐 현상 — 정밀 원인 분석 보고서

**역할**: core-debugger  
**산출**: 원인 분석·재현 절차·수정 제안·core-coder 태스크 초안 (코드 수정 없음)

---

## 1. 발생 위치

### 1.1 모달/페이지별 재현 여부

| 페이지 | 컴포넌트 | 이메일 행 위치 | ClientModal.css 로드 | B0KlA.css 로드 | 비고 |
|--------|----------|----------------|----------------------|----------------|------|
| **내담자 종합관리** | ClientComprehensiveManagement → ClientModal | 등록/수정 모달 폼 | ✅ ClientModal.js에서 import | ✅ ClientComprehensiveManagement에서 import | 둘 다 적용, ClientModal 선택자 특이도 더 높음 |
| **상담사 종합관리** | ConsultantComprehensiveManagement | 등록/수정 모달 폼 (renderModalBody) | ❌ **미로드** | ✅ import | **B0KlA 규칙만 적용** |
| **스태프 관리** | StaffManagement | 새 스태프 등록 모달 | ✅ **먼저** import | ✅ **나중** import | ClientModal.css → B0KlA 순, ClientModal 선택자 우선 |

- **재현 가능 위치**: 세 곳 모두 동일한 DOM 구조(.mg-v2-modal-body > form > .mg-v2-form-email-row > __input-wrap > input)를 사용하므로, **세 모달 모두에서 재현될 수 있음**.  
- **상담사**는 ClientModal.css가 없어 B0KlA의 `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap` 규칙만 적용됨.  
- **내담자·스태프**는 ClientModal.css의 더 긴 선택자(`.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row__input-wrap`)가 적용됨.

### 1.2 CSS 로드·번들 순서

- **전역 (App → main.css)**  
  - 순서: `unified-design-tokens.css` → `mindgarden-design-system.css` → … → `06-components/_unified-modals.css` → `07-global/_layout-fixes.css` → `08-utilities/_utilities.css` → `index.css`.  
  - **UnifiedModal.js**가 `main.css`를 import하므로, 모달을 쓰는 모든 경로에서 main.css가 로드됨.  
  - `index.js`는 `unified-design-tokens.css`와 `index.css`를 직접 import (main.css와 별개).

- **페이지/컴포넌트별**  
  - **내담자**: ClientComprehensiveManagement → B0KlA.css. 하위 ClientModal → ClientModal.css.  
  - **상담사**: ConsultantComprehensiveManagement → B0KlA.css만 (ClientModal 미사용).  
  - **스태프**: StaffManagement → ClientModal.css → B0KlA.css (위 순서).

- **정리**: ClientModal.css는 **내담자·스태프**에서만 번들에 포함되며, **상담사**에서는 B0KlA.css만 이메일 행에 영향을 줌.

---

## 2. DOM·계산된 스타일(Computed Style) — 확인 요청 사항

코드만으로는 “계산된 값”을 알 수 없으므로, **실제 브라우저 개발자 도구**에서 아래를 확인하는 것을 권장합니다.

### 2.1 확인 대상 노드

- `.mg-v2-form-email-row` (이메일 행 컨테이너)  
- `.mg-v2-form-email-row__input-wrap` (입력 래퍼)  
- `input.mg-v2-form-input` (실제 input)

### 2.2 확인할 속성 (Computed 탭)

| 노드 | 확인할 속성 | 기대(정상) | 의심(깨짐 시) |
|------|-------------|------------|----------------|
| `.mg-v2-form-email-row` | width, min-width, display, flex 관련 | width > 0, display: flex | width: 0px 등 |
| `.__input-wrap` | width, **min-width**, flex, flex-basis, flex-shrink, box-sizing | min-width: **192px**(12rem) | min-width: **0px** |
| `input.mg-v2-form-input` | width, min-width, box-sizing | width: 100% of wrap | 0px 등 |

### 2.3 __input-wrap의 min-width가 0으로 나오는 경우

- **가능한 원인**  
  - 전역/유틸 규칙이 나중에 적용되어 `min-width: 12rem`을 덮어씀 (예: `min-width: 0` 또는 `.u-min-w-0`).  
  - 번들/캐스케이드 순서로 B0KlA/ClientModal 규칙보다 나중에 오는 규칙이 적용됨.

- **확인 방법**  
  - Elements 탭에서 `.__input-wrap` 선택 → **Styles**에서 `min-width`에 취소선이 있는지, **Computed**에서 최종값이 0인지 확인.  
  - “Computed” 옆 “Styles”에서 어떤 파일·라인 규칙이 실제로 적용/덮어쓰는지 확인.

---

## 3. 캐스케이드·선택자 우선순위

### 3.1 관련 규칙 요약

| 소스 | 선택자 | min-width | 비고 |
|------|--------|-----------|------|
| **_unified-modals.css** | `.mg-modal__body` | 0 | 40행 |
| **_unified-modals.css** | `.mg-modal__body .mg-v2-modal-body` | 0 | 45–48행 |
| **unified-design-tokens.css** | `.mg-v2-modal-body` | 0 | 13850–13859행 |
| **AdminDashboardB0KlA.css** | `.mg-modal.mg-v2-ad-b0kla .mg-v2-form-email-row__input-wrap` | **12rem** | 1001–1006행 |
| **ClientModal.css** | `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body .mg-v2-form-email-row__input-wrap` | **12rem** | 8–12행 |

- `__input-wrap`에 직접 `min-width`를 거는 규칙은 **B0KlA**와 **ClientModal** 두 곳뿐이며, 둘 다 **12rem**.
- `.mg-modal__body`, `.mg-v2-modal-body`의 `min-width: 0`은 **해당 요소 자체**에만 적용되며, `min-width`는 상속되지 않으므로 `__input-wrap`에는 직접 영향 없음.  
- 다만 **레이아웃 연쇄**에는 영향 있음: 상위가 0으로 줄어들 수 있어, 그 자식인 `.mg-v2-form-email-row`의 사용 가능 너비가 0이 되면, flex 자식인 `__input-wrap`이 “0 너비”로 배치될 수 있음.

### 3.2 최종 적용·덮어쓰기

- **__input-wrap의 min-width**  
  - **내담자·스태프**: ClientModal.css 선택자(클래스 4개 + .mg-modal__body .mg-v2-modal-body)가 B0KlA보다 특이도가 높아, **ClientModal.css의 12rem이 적용**되는 것이 맞음.  
  - **상담사**: ClientModal.css 미로드이므로 **B0KlA의 12rem만** 적용됨.  
  - 이론상 **나중에 로드되는** 전역/유틸에서 `min-width: 0` 또는 `!important`가 붙은 규칙이 같은 요소를 겨냥하면 12rem이 **덮어쓰일 수 있음**.  
  - **.u-min-w-0**: `07-utilities/_utilities.css`에만 정의되어 있고, **main.css는 08-utilities만** import하므로 현재 번들에는 **.u-min-w-0 정의가 없음**. 단, JSX에서 해당 클래스를 붙이면 다른 경로로 로드될 수 있음 — 코드 검색 결과 **이메일 행/__input-wrap에는 .u-min-w-0 미적용**.

### 3.3 emergency-design-fix.css

- `.mg-v2-modal-body { min-width: 0 }` (403–411행)가 정의되어 있으나, **프로젝트 내에서 import하는 파일 없음** → 현재 번들에는 포함되지 않는 것으로 판단.

---

## 4. 유틸 클래스 .u-min-w-0

- **정의**: `frontend/src/styles/07-utilities/_utilities.css` 214행: `.u-min-w-0 { min-width: 0 !important; }`.  
- **로드**: `main.css`는 `08-utilities/_utilities.css`만 import. **07-utilities는 main.css에서 import되지 않음** → `.u-min-w-0`는 **현재 전역 번들에 없음**.  
- **사용처**: 코드베이스 검색 결과, 이메일 행·`__input-wrap`·모달 본문에 `u-min-w-0` 클래스를 붙이는 JSX **없음**.  
- **결론**: 이번 깨짐의 **직접 원인으로는 보이지 않음**. 다만 나중에 07-utilities를 넣거나, 다른 전역 스타일에서 `min-width: 0`/`!important`가 들어오면 우선순위 재검토 필요.

---

## 5. 재현 경로·영향 CSS

### 5.1 재현 경로 (동일 패턴)

1. 어드민 LNB에서 해당 메뉴 진입  
   - 내담자: **내담자 종합관리**  
   - 상담사: **상담사 종합관리**  
   - 스태프: **스태프 관리**  
2. **등록** 또는 **수정** 버튼 클릭 → 모달 열림  
3. 모달 본문에서 **이메일 * / 중복확인** 행 확인  
4. **증상**: 라벨·버튼만 보이고 입력란 너비가 0이거나 미노출

### 5.2 영향 받는 CSS 파일·라인

- **전역 (모달 본문/레이아웃)**  
  - `frontend/src/styles/06-components/_unified-modals.css`: 34–40행 (.mg-modal__body), 44–48행 (.mg-modal__body .mg-v2-modal-body) — min-width: 0  
  - `frontend/src/styles/unified-design-tokens.css`: 13850–13859행 (.mg-v2-modal-body) — min-width: 0  

- **이메일 행 직접 스타일**  
  - `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`: 993–1012행 (.mg-v2-form-email-row, __input-wrap, input)  
  - `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.css`: 8–42행 (.mg-v2-form-email-row__input-wrap, input, button 등) — 내담자·스태프에서만 로드

---

## 6. 정밀 원인 분석 요약 (근본 원인 가설)

1. **가설 1: 상위 min-width: 0 연쇄로 인한 사용 가능 너비 0**  
   - `.mg-modal__body`와 `.mg-modal__body .mg-v2-modal-body`에 `min-width: 0`이 설정되어 있어, flex 맥락에서 본문 영역이 0으로 줄어들 수 있음.  
   - 그 결과 `.mg-v2-form-email-row`의 사용 가능 너비가 0이 되고, `__input-wrap`(flex: 1 1 0%)이 0으로 배치되거나, 레이아웃 엔진이 입력란을 사실상 0 너비로 그리는 상황이 발생할 수 있음.  
   - **확인**: DevTools에서 `.mg-modal__body`, `.mg-v2-modal-body`, `.mg-v2-form-email-row`의 **computed width**가 0인지 확인.

2. **가설 2: 나중에 로드된 규칙에 의한 min-width 덮어쓰기**  
   - 전역/다른 컴포넌트 CSS가 번들 순서상 B0KlA/ClientModal **이후**에 로드되며, `__input-wrap` 또는 그 부모에 `min-width: 0`(또는 `!important`)을 적용하는 규칙이 있을 수 있음.  
   - **확인**: Styles 패널에서 `.__input-wrap`의 `min-width: 12rem`에 취소선이 있는지, 그 위에 다른 파일·라인이 올라와 있는지 확인.

3. **가설 3: 상담사 페이지에서만의 로드 순서**  
   - 상담사는 ClientModal.css가 없어 B0KlA만 적용됨. 해당 페이지 청크에서 B0KlA보다 **나중**에 적용되는 전역 스타일(예: index.css, unified-design-tokens)이 있어, B0KlA의 12rem이 덮어쓰일 수 있음.  
   - **확인**: 상담사 등록/수정 모달에서만 재현되는지, 내담자/스태프와 동일한지 비교.

---

## 7. 재현 절차 (단계별)

1. 개발 서버 실행 후 어드민으로 로그인.  
2. **내담자 종합관리** 이동 → **등록** 클릭 → 모달에서 이메일 행 확인.  
3. **상담사 종합관리** 이동 → **등록** 클릭 → 모달에서 이메일 행 확인.  
4. **스태프 관리** 이동 → **새 스태프 등록** 클릭 → 모달에서 이메일 행 확인.  
5. 각 경우에 대해 개발자 도구로  
   - `.mg-v2-form-email-row`  
   - `.mg-v2-form-email-row__input-wrap`  
   - `input.mg-v2-form-input`  
   의 **Computed** width/min-width와, **Styles**에서 어떤 규칙이 적용/취소되는지 기록.

---

## 8. 수정 제안 (파일·라인·방향, 코드 작성 없음)

- **제안 1 (우선 권장)**  
  - **파일**: `frontend/src/styles/06-components/_unified-modals.css`  
  - **위치**: `.mg-modal__body .mg-v2-modal-body` 규칙(44–48행 근처)  
  - **방향**: B0KlA 모달 본문에서만 min-width: 0을 제거하거나 완화.  
  - 예: `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body { min-width: 0; }` 를 제거하거나, `min-width: min(100%, 400px)` 등으로 변경해, 이메일 행이 들어가는 모달 본문이 지나치게 0으로 수축하지 않도록 함.  
  - 주의: 다른 모달 레이아웃(오버플로우, 스크롤)에 부작용이 없는지 확인 필요.

- **제안 2**  
  - **파일**: `frontend/src/components/admin/AdminDashboard/AdminDashboardB0KlA.css`, `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.css`  
  - **위치**: `.__input-wrap`에 대한 `min-width: 12rem` 규칙  
  - **방향**: 전역/나중 로드 규칙에 덮이지 않도록 `min-width: 12rem !important;` 시도. (유틸/다른 컴포넌트와 충돌 가능성 있으므로, 제안 1 적용 후에도 재현 시에만 고려.)

- **제안 3**  
  - **파일**: `frontend/src/components/admin/ConsultantComprehensiveManagement.js`  
  - **방향**: 상담사 모달에서도 ClientModal.css와 동일한 이메일 행 스타일을 쓰고 싶다면, ClientModal.css를 import하거나, B0KlA만으로도 12rem이 확실히 적용되도록 제안 2를 B0KlA 쪽에만 적용.

- **제안 4 (검증용)**  
  - **파일**: `frontend/src/components/admin/ClientComprehensiveManagement/ClientModal.css`  
  - **방향**: `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body` 에 대해 `min-width: 0`을 오버라이드하는 규칙 추가(예: `min-width: 280px` 또는 `min-width: min-content`)하여, 가설 1이 맞는지 실험. 재현이 사라지면 가설 1이 원인일 가능성 높음.

---

## 9. core-coder에게 전달할 태스크 설명 초안

**제목**: 모달 이메일 행 입력란 0 너비/미노출 — CSS 수정

**배경**  
- 내담자/상담사/스태프 모달에서 이메일 행의 입력란이 0 너비 또는 미노출되고, "이메일 * / 중복확인"만 보이는 현상이 있음.  
- 이미 B0KlA/ClientModal에서 `.__input-wrap`에 `min-width: 12rem`을 두었으나 지속됨.

**요청 사항**  
1. **우선**: `_unified-modals.css`의 `.mg-modal__body .mg-v2-modal-body { min-width: 0 }`가 B0KlA 모달 본문에서 과도하게 수축하지 않도록 조정.  
   - 옵션: `.mg-modal.mg-v2-ad-b0kla .mg-modal__body .mg-v2-modal-body` 에 대해 `min-width: 0` 제거 또는 완화(예: `min-width: 280px` 또는 `min-width: min-content`).  
   - 다른 모달(일반 모달, fullscreen 등) 레이아웃·스크롤에 영향 없는지 확인.  
2. **필요 시**: B0KlA/ClientModal의 `.__input-wrap`에 `min-width: 12rem !important;` 적용해 전역 규칙에 덮이지 않도록 함.  
3. **검증**: 내담자 등록/수정, 상담사 등록/수정, 스태프 등록 모달에서 이메일 행 입력란이 정상 너비로 보이는지 확인.

**참고**  
- `docs/debug/EMAIL_ROW_LAYOUT_PRECISE_ANALYSIS.md` (본 정밀 분석) 참고.  
- 수정 후 DevTools로 `.__input-wrap`의 computed `min-width`가 192px(12rem)인지 확인 권장.

---

## 10. 추가 보완 분석 제안 (core-designer / core-publisher)

- **core-designer**  
  - 모달 본문(.mg-v2-modal-body)과 이메일 행의 **최소 너비·그리드/플렉스 스펙**을 명시해 두면, 이후 전역 min-width: 0 정책과의 충돌을 줄일 수 있음.  
  - “B0KlA 폼 모달 본문은 최소 320px(또는 280px) 유지” 같은 레이아웃 가이드 추가 검토.

- **core-publisher**  
  - 이메일 행 마크업이 `.mg-v2-form-email-row` > `.__input-wrap` > `input` 구조로 일관되어 있는지, 다른 페이지/모달에서 래퍼 없이 input만 두는 경우가 있는지 점검하면, 스타일 적용 범위를 명확히 할 수 있음.

---

**문서 끝.**

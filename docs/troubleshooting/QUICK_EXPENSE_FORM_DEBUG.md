# 빠른 지출 등록 모달(QuickExpenseForm) 오류 원인 분석 및 수정 제안

**대상**: `frontend/src/components/erp/QuickExpenseForm.js`  
**사용처**: `IntegratedFinanceDashboard.js` — "빠른 지출" 버튼 클릭 시 표시  
**역할**: core-debugger — 원인 분석·수정 제안만 수행, 코드 수정은 core-coder 위임

---

## 1. 오류 원인 후보 (우선순위순)

### 1순위: API 실패 시 사용자 피드백 부재

- **증상**: 403/400/500 시 사용자는 빨간 에러 박스만 보거나, 네트워크/예외 시 아무 메시지 없음.
- **원인**:
  - `handleQuickExpense` 내부에서 `setError(response.data.message)` 또는 `catch`에서 `setError(...)`만 호출.
  - **`notificationManager.show(..., 'error')` 미호출** → 토스트로 전역 피드백 없음.
  - `FinancialTransactionForm`은 실패 시 `setError` + `notificationManager.show(msg, 'error', 4000)` 둘 다 사용함(91–94, 93–94행).
- **확인 방법**: 개발자 도구에서 API를 403/400으로 강제 반환하거나 네트워크 차단 후 버튼 클릭 → 모달 내 에러 영역만 갱신되는지, 토스트는 뜨는지 확인.

### 2순위: MGButton + async onClick에서 throw 시 피드백 없음

- **증상**: `handleQuickExpense`에서 예외가 throw되면 사용자에게 성공/실패 메시지가 보이지 않을 수 있음.
- **원인**:
  - `MGButton`의 `handleClick`은 async를 try/catch로 감싸고, catch 시 `console.error('Button click handler error:', error)`만 수행하고 `setIsProcessing(false)`만 복구함. **부모 컴포넌트 state(setError)나 notification 호출 없음.**
  - `handleQuickExpense`가 `setLoading(true)` 전에 throw하거나, axios가 throw한 예외가 일부 경로에서 상위로 전파되면 QuickExpenseForm의 catch에 도달하지 않을 수 있음. 실제로 현재 코드는 try 안에서만 API 호출하므로 대부분 catch로 가지만, **공통 코드 로드 실패 등으로 `expenseCategories`/`expenseSubcategories`가 비어 있을 때** `getQuickExpenses()`가 빈 배열을 반환하고, 사용자가 버튼을 눌렀을 때의 에러 처리만 있어도 실패 시 notification이 없음.
- **확인 방법**: 의도적으로 API를 throw하도록 하거나, 403 응답 시 `setError`만 하고 notification 없음을 재현.

### 3순위: prompt() 사용에 따른 환경/UX 문제

- **증상**: 일부 환경(iframe, 엄격한 보안 정책, 팝업 차단)에서 `prompt()`가 차단되거나 예외를 일으킬 수 있음.
- **원인**:
  - 금액 입력이 **브라우저 기본 `prompt()`**에 의존함. 모달과 별개라 UX 불일치, 접근성·모바일 경험도 좋지 않음.
- **확인 방법**: iframe 내에서 실행하거나, 보안 정책이 있는 환경에서 버튼 클릭 후 prompt 노출/예외 여부 확인.

### 4순위: API 호출 방식 불일치(StandardizedApi 미사용)

- **증상**: 에러 형식·tenantId·인증 처리 등이 프로젝트 표준과 다를 수 있음.
- **원인**: `QuickExpenseForm`은 `axios.get`/`axios.post` 직접 사용. 프로젝트 표준은 `StandardizedApi` 사용 권장(API_CALL_STANDARD, core-solution-api 스킬). FinancialTransactionForm도 현재 axios 직접 사용이지만, 표준화 관점에서는 StandardizedApi로 통일하는 것이 유지보수에 유리함.
- **확인 방법**: 다른 ERP 화면과 동일 조건(권한/tenant)에서 403/400 시 응답 형식이 동일한지 비교.

### 5순위: 권한(403) / tenantId(400) 메시지 전달

- **원인**: 백엔드가 403(관리자만 허용), tenantId 없으면 400 반환. 이 경우 `err.response?.data?.message`로 setError만 하면 되지만, **notification 미호출**로 사용자가 모달을 닫으면 메시지를 놓침.

---

## 2. 모달 통일 권장 사항

| 구분 | QuickExpenseForm (현재) | ErpModal + mg-modal 패턴 (FinancialTransactionForm 등) |
|------|-------------------------|--------------------------------------------------------|
| 렌더링 | `ReactDOM.createPortal(..., document.body)` | 조건부 렌더링 + `<ErpModal isOpen={true}>` |
| 마크업/클래스 | 자체 `quick-expense-modal-overlay`, `quick-expense-modal` | `UnifiedModal` → ErpModal 래퍼, `mg-modal__*` 등 공통 클래스 |
| 스타일 | QuickExpenseForm.css 전용 | ErpModal.css + 공통 디자인 토큰 |
| 접근성/포커스 | 직접 구현 필요 | UnifiedModal에서 처리 |

**통일 시 장점**

- **일관된 UX**: 닫기·오버레이 클릭·ESC·포커스 트랩 등 동일 동작.
- **유지보수**: 모달 버그 수정·개선 시 한 곳(UnifiedModal/ErpModal)만 반영.
- **표준 준수**: `core-solution-unified-modal` 스킬 — "모든 모달은 공통 UnifiedModal 사용 필수, 커스텀 오버레이/래퍼 금지". ErpModal은 UnifiedModal 래퍼이므로 ERP 영역에서는 ErpModal 사용이 적합함.

---

## 3. 수정 제안 (체크리스트, core-coder 적용용)

다음 항목을 **우선순위대로** 적용하는 것을 권장한다.

### 3.1 에러 시 토스트 필수 (즉시 적용 권장)

- **파일**: `frontend/src/components/erp/QuickExpenseForm.js`
- **위치**: `handleQuickExpense` 내부
  - `response.data.success`가 false인 분기: `setError(...)` 호출 뒤 **`notificationManager.show(response.data.message || '지출 등록에 실패했습니다.', 'error', 4000)`** 추가.
  - `catch` 블록: `setError(...)` 호출 뒤 **`notificationManager.show(err.response?.data?.message || '지출 등록 중 오류가 발생했습니다.', 'error', 4000)`** 추가.
- **참고**: `FinancialTransactionForm.js` 91–94행, 93–94행 패턴과 동일하게 처리.

### 3.2 prompt 제거 → 모달 내 금액 입력으로 전환

- **파일**: `frontend/src/components/erp/QuickExpenseForm.js`
- **방향**:
  - 버튼 클릭 시 **금액 입력 모달/인라인 폼**을 띄우기. (예: 선택한 항목명 + 숫자 input + "등록" / "취소" 버튼)
  - `prompt(message)` 호출 제거. 금액은 state(예: `selectedQuickExpense`, `amountInput`)로 관리하고, "등록" 클릭 시에만 `handleQuickExpense(categoryCode, subcategoryCode, amount)` 호출.
- **검증**: 금액 미입력·0 이하·숫자 아님 시 버튼 비활성화 또는 인라인 에러 메시지로 처리.

### 3.3 모달 구현을 ErpModal(UnifiedModal) 래퍼로 통일

- **파일**: `frontend/src/components/erp/QuickExpenseForm.js`
- **방향**:
  - `ReactDOM.createPortal` + `quick-expense-modal-overlay` / `quick-expense-modal` 제거.
  - `ErpModal`을 import하고, `QuickExpenseForm`을 **`<ErpModal isOpen={true} onClose={onClose} title="빠른 지출 등록" size="...">`** 안에 children으로 렌더링. (호출부 `IntegratedFinanceDashboard`에서는 기존처럼 `showQuickExpenseForm && <QuickExpenseForm ... />` 유지.)
  - 기존 quick-expense 전용 클래스는 모달 shell 대신 **내부 컨텐츠**에만 사용(예: `quick-expense-categories`, `quick-expense-category-btn`)하고, 헤더/닫기/오버레이는 ErpModal에 맡김.
- **스타일**: `QuickExpenseForm.css`에서 overlay/modal shell 관련 규칙은 제거하거나 ErpModal과 중복되지 않도록 조정.

### 3.4 (선택) API 호출을 StandardizedApi로 변경

- **파일**: `frontend/src/components/erp/QuickExpenseForm.js`
- **방향**:
  - 공통 코드: `axios.get('/api/v1/erp/common-codes/financial', ...)` → `StandardizedApi.get(...)` 등 프로젝트 표준 방식으로 변경.
  - quick-expense: `axios.post('/api/v1/erp/finance/quick-expense', null, { params: {...} })` → `StandardizedApi.post(..., body 또는 params)` 형태로 변경.
  - 응답 처리: `StandardizedApi` 반환 형식에 맞춰 `response.data`/`response.success`/에러 분기 통일. 실패 시에는 3.1과 동일하게 `notificationManager.show(..., 'error')` 호출 유지.

### 3.5 MGButton async throw 시 보조 방어(선택)

- **파일**: `frontend/src/components/erp/QuickExpenseForm.js`
- **방향**: `handleQuickExpense` 전체를 try/catch로 감싸고, catch에서 `setError` + `notificationManager.show(..., 'error')`를 반드시 호출하도록 하면, MGButton에서 catch되어도 사용자에게는 토스트로 메시지가 전달됨. (3.1 적용 시 catch 블록에서 이미 notification 호출하면 대부분 해소됨.)

---

## 4. 수정 후 확인 체크리스트

- [ ] **빠른 지출** 버튼 클릭 시 모달이 ErpModal과 동일한 스타일/동작(닫기, 백드롭 클릭)으로 열리는가?
- [ ] 금액 입력을 **모달 내 입력 필드**로 할 수 있는가? (prompt 미사용)
- [ ] 등록 성공 시: 기존처럼 토스트 + 모달 닫기 + `onSuccess` 콜백 동작하는가?
- [ ] 등록 실패 시(403/400/500): 모달 내 에러 문구 + **토스트 에러 메시지**가 동시에 표시되는가?
- [ ] 네트워크 오류 등으로 예외 발생 시: 토스트로 "지출 등록 중 오류가 발생했습니다."(또는 동일한 메시지)가 표시되는가?
- [ ] 공통 코드 로드 실패 시: 기존처럼 모달 내 에러 문구 표시되는가? (필요 시 여기도 notification 추가 검토 가능.)

---

## 5. 참조

- **에러 처리**: `docs/standards/ERROR_HANDLING_STANDARD.md`
- **모달 표준**: `.cursor/skills/core-solution-unified-modal/SKILL.md`
- **API 호출**: `frontend/src/utils/standardizedApi.js`, `docs/standards/API_CALL_STANDARD.md`
- **비교 참고**: `frontend/src/components/erp/FinancialTransactionForm.js` (ErpModal 사용, 실패 시 setError + notificationManager.show)

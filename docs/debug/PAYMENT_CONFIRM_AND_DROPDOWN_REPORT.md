# 결제 확인 500 에러 및 드롭다운 미동작 디버그 보고서

**검토 일자**: 2026-02  
**대상**: POST /api/v1/admin/mappings/{id}/confirm-payment 500, 드롭다운/공통코드

---

## 1. 결제 확인 500 (Transaction rollback-only)

### 원인
- `AdminServiceImpl.confirmPayment()` 내부에서 **ERP/미수금 거래 생성**을 같은 트랜잭션에서 호출.
- `financialTransactionService.createTransaction()` 또는 `realTimeStatisticsService.updateStatisticsOnMappingChange()` 등에서 예외가 나면 트랜잭션이 **rollback-only**로 마크됨.
- 예외를 try-catch로 잡아도, 커밋 시점에 Spring이 rollback-only를 감지해 `Transaction silently rolled back because it has been marked as rollback-only`를 던지며 500 발생.

### 수정 내용 (반영됨)
- **4인자 confirmPayment (입금 확인)**:  
  - `createConsultationIncomeTransaction` → `createConsultationIncomeTransactionAsync()` 호출로 변경 (별도 REQUIRES_NEW 트랜잭션).  
  - `createAdditionalSessionIncomeTransaction` → `runInNewTransaction(() -> createAdditionalSessionIncomeTransaction(...))` 로 래핑.
- **3인자 confirmPayment (결제 확인·미수금)**:  
  - `createReceivablesTransaction(savedMapping)` → `runInNewTransaction(() -> createReceivablesTransaction(savedMapping))` 로 래핑.
- `runInNewTransaction(Runnable)` 헬퍼 추가: `TransactionTemplate` + `PROPAGATION_REQUIRES_NEW`로 실행, 내부 예외 시에도 부모 트랜잭션에 영향 없음.

**파일**: `src/main/java/com/coresolution/consultation/service/impl/AdminServiceImpl.java`

---

## 2. 드롭다운 / 공통코드

### 원인 후보
- 공통코드 API 응답 구조 차이: `getCommonCodes()`는 배열을 반환하지만, 일부 화면에서 직접 `apiGet('/api/v1/common-codes/groups/XXX')` 호출 시 응답이 `{ data: [...] }` 등으로 올 수 있음.
- `options`가 `undefined`이거나 배열이 아닐 때 `CustomSelect`에서 `options.filter` 호출로 런타임 에러 발생 가능.

### 수정 내용 (반영됨)
- **PaymentConfirmationModal**:  
  - 결제 방법 코드 로딩을 `apiGet('/api/v1/common-codes/groups/PAYMENT_METHOD')` → `getCommonCodes('PAYMENT_METHOD')` 로 변경.  
  - 응답을 `Array.isArray(codes) ? codes : (codes?.codes || [])` 로 정규화.  
  - `codeValue`/`codeLabel` 뿐 아니라 `code_value`/`code_label` 폴백 처리.  
  - 실패 시 기존과 동일한 fallback 목록 사용.
- **CustomSelect**:  
  - `safeOptions = Array.isArray(options) ? options : []` 로 항상 배열 사용.  
  - `filteredOptions` 계산 및 `selectedOption` 탐색, 검색창 노출 조건(`length > 5`)을 모두 `safeOptions` 기준으로 통일.

**파일**:  
- `frontend/src/components/admin/PaymentConfirmationModal.js`  
- `frontend/src/components/common/CustomSelect.js`

---

## 3. 확인 체크리스트
- [ ] 결제 확인 버튼 클릭 시 500 없이 200 응답 및 매핑 상태 정상 반영.
- [ ] 결제 확인 모달에서 결제 방법 드롭다운이 열리고 옵션이 표시되는지 확인.
- [ ] 다른 공통코드 기반 드롭다운도 동일하게 동작하는지 확인 (필요 시 해당 화면도 `getCommonCodes` + 배열 정규화 적용).

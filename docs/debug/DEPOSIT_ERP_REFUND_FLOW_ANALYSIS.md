# 예약금·결재확인·ERP 등록·환불 플로우 분석 및 갭 문서

**작성일**: 2025-03-16  
**담당**: core-debugger  
**참조 스킬**: `core-solution-debug`, `core-solution-erp`  
**비즈니스 맥락**: 예약금(회기당 50%), 결재확인 상태에서 예약 가능, 상담 완료/전액 수령 시 ERP 등록 방법, 미참석/취소 시 예약금 환불 처리

---

## 1. "결재확인" 상태값 사용처

### 1.1 상태값 정의

| 구분 | 값(코드) | 정의 위치 | 비고 |
|-----|----------|-----------|------|
| 매칭 상태 | `PAYMENT_CONFIRMED` | `ConsultantClientMapping.MappingStatus` | 주석: "결제 확인됨 (미수금 상태)" |
| 상수 | `MappingStatusConstants.PAYMENT_CONFIRMED = "PAYMENT_CONFIRMED"` | `MappingStatusConstants.java` | |
| 확장 요청 | `SessionExtensionRequest.ExtensionStatus.PAYMENT_CONFIRMED("입금확인")` | `SessionExtensionRequest.java` | 세션 연장 요청용, 매칭과 별도 |

UI/문서에서는 **"결제 확인"**, **"입금확인"** 라벨이 혼용됨(프론트 파일별로 상이).

### 1.2 사용처 목록

| 파일/위치 | 용도 |
|-----------|------|
| `ConsultantClientMapping.java` | `confirmPayment()` 호출 시 `status = PAYMENT_CONFIRMED` 설정 |
| `AdminServiceImpl.java` | `confirmPayment(4arg/3arg)` 후 저장된 매핑 상태, `getMappingStatusCode("PAYMENT_CONFIRMED")`, 스케줄/통계 필터 |
| `ClientStatsServiceImpl.java`, `ConsultantStatsServiceImpl.java` | 매칭 통계 집계 시 PAYMENT_CONFIRMED 포함 |
| `IntegratedMatchingSchedule.js` | `SCHEDULABLE_STATUSES`: PAYMENT_CONFIRMED일 때 예약(드래그) 가능 |
| `MappingManagementPage.js`, `MappingCard.js`, `MappingTableView.js`, `CardActionGroup.js`, `MappingListRow.js` | 결제 확인/입금 확인 버튼 노출 조건, 상태 배지/색상 |
| `MappingKpiSection.js`, `MappingStats.js` | "결제 확인" 건수 KPI |
| `frontend/src/constants/mapping.js`, `codeHelper.js`, `StatusBadge.js`, `messages.js` | 라벨 "결제 확인" / "입금확인" 매핑 |
| `SessionExtensionRequest.java` / `SessionManagement.js` | 확장 요청 상태 "입금확인" (매칭과 별도 플로우) |
| `SessionSyncServiceImpl.java`, `SessionExtensionRequestRepository.java` | 확장 요청 PAYMENT_CONFIRMED 조회 |

**정리**: "결재확인"은 코드 상 **`PAYMENT_CONFIRMED`** 한 종류로 쓰이며, 매칭은 "결제 확인됨(미수금)" 단계에서 **예약 가능**하도록 이미 사용 중이다. UI/문서의 "결재확인"·"입금확인"·"결제 확인" 표기는 동일 상태를 가리키는 경우가 많으나, **입금 확인**은 별도 API `confirm-deposit`으로 처리되고 상태는 `DEPOSIT_PENDING`으로 바뀐다.

---

## 2. 예약금·전액·ERP 등록·환불 처리 위치

### 2.1 예약금

- **비즈니스**: "상담 예약 시 회기당 50% 예약금 수령"은 **코드/DB에 명시된 상수나 필드 없음**.
- **실제 처리**: 매칭 생성 시 `packagePrice`(패키지 총액) 저장. "예약금"만 따로 저장하는 필드는 없음.  
  결제/입금 확인 시 `confirm-payment` 또는 `confirm-deposit`으로 **결제·입금 사실**만 기록.

### 2.2 결제 확인 (confirm-payment)

| 항목 | 내용 |
|------|------|
| API | `POST /api/v1/admin/mappings/{mappingId}/confirm-payment` |
| Controller | `AdminController.confirmPayment()` (L1361 부근) |
| Service | `AdminServiceImpl.confirmPayment(mappingId, paymentMethod, paymentReference, paymentAmount)` (4인자) 또는 `confirmPayment(mappingId, paymentMethod, paymentReference)` (3인자) |
| 4인자 | `mapping.confirmPayment()` → `status = PAYMENT_CONFIRMED`, `paymentAmount` 설정 → **INCOME** 거래 생성(`createConsultationIncomeTransactionAsync` 또는 `createAdditionalSessionIncomeTransaction`). **updateMappingInfo 프로시저 호출 없음.** |
| 3인자 | `mapping.confirmPayment()` → **RECEIVABLES**(미수금) 거래만 생성(`createReceivablesTransaction`). INCOME 미생성. |
| 프론트 | `MappingPaymentModal.js` → `apiPost(…/confirm-payment, { paymentMethod, paymentReference, paymentAmount })` |

### 2.3 입금 확인 (confirm-deposit)

| 항목 | 내용 |
|------|------|
| API | `POST /api/v1/admin/mappings/{mappingId}/confirm-deposit` |
| Controller | `AdminController.confirmDeposit()` (L2135 부근) |
| Service | `AdminServiceImpl.confirmDeposit(mappingId, depositReference)` |
| 동작 | `mapping.confirmDeposit()` → `depositConfirmed=true`, `status = DEPOSIT_PENDING` → **INCOME** 거래 생성(신규/추가 매칭 분기) + **storedProcedureService.updateMappingInfo** 호출 |
| 프론트 | `MappingDepositModal.js` → `apiPost(…/confirm-deposit, { depositReference })` |

### 2.4 전액 수령

- **"전액 수령" 전용 상태/API 없음.**  
  입금 확인 시 `paymentAmount` 또는 `packagePrice`로 한 번에 금액을 넣고, 그 시점에 INCOME ERP 등록이 이루어짐.
- **2단계(예약금 → 잔금) 수령** 시나리오는 현재 모델/트리거에 없음.

### 2.5 ERP 등록 (수입)

| 트리거 | 서비스 메서드 | ERP 쪽 처리 |
|--------|----------------|-------------|
| confirm-payment 4인자 | `AdminServiceImpl.confirmPayment(4arg)` | `createConsultationIncomeTransactionAsync` / `createAdditionalSessionIncomeTransaction` → `financialTransactionService.createTransaction` (INCOME) |
| confirm-deposit | `AdminServiceImpl.confirmDeposit` | 동일 INCOME 생성 + `storedProcedureService.updateMappingInfo` |
| approveMapping | `AdminServiceImpl.approveMapping` | **ERP 등록/프로시저 호출 없음** (설계상 입금 확인에서만 수행) |

### 2.6 환불

| 구분 | API | Controller | Service | ERP 반영 |
|------|-----|------------|---------|----------|
| 전액(강제 종료) | `POST /api/v1/admin/mappings/{id}/terminate` | `AdminController.terminateMapping` | `AdminServiceImpl.terminateMapping` | `sendRefundToErp` → `createConsultationRefundTransaction` (EXPENSE) |
| 부분 환불 | `POST /api/v1/admin/mappings/{id}/partial-refund` | `AdminController.partialRefundMapping` | `AdminServiceImpl.partialRefundMapping` | `sendRefundToErp` + `createPartialConsultationRefundTransaction` (EXPENSE) |

- **내부 ERP**: `createConsultationRefundTransaction` / `createPartialConsultationRefundTransaction` → `financialTransactionService.createTransaction` (EXPENSE, CONSULTATION_REFUND / CONSULTATION_PARTIAL_REFUND).
- **외부 ERP**: `sendRefundToErp` → `sendToErpSystem(erpUrl, …)`. 현재 `sendToErpSystem`은 **모의 구현**(항상 true 반환)이라 실제 외부 시스템 전송은 미구현.

기타:
- `PlSqlMappingSyncController`: `POST /refund`, `POST /partial-refund` (다른 경로). 환불 통계/이력은 `AdminController`: `GET /refund-statistics`, `GET /refund-history` → `AdminService.getRefundStatistics` / `getRefundHistory`.

---

## 3. 플로우 갭 목록

1. **전액 수령 후 ERP 등록 트리거**
   - **갭**: "전액 수령"만을 위한 별도 상태/이벤트가 없음.  
   - **현재**: 입금 확인(confirm-deposit) 또는 결제 확인 4인자(confirm-payment) 시점에 INCOME 한 번 생성.  
   - **영향**: 예약금 → 잔금 2단계 수령 시 "전액 수령 시점"에 맞춘 ERP 등록 정책을 정하려면, 상태/트리거 설계가 추가로 필요.

2. **결제 확인(confirm-payment) 4인자 경로에 ERP 프로시저 미호출**
   - **갭**: `confirm-deposit`에는 `storedProcedureService.updateMappingInfo` 호출이 있으나, **confirm-payment 4인자**에는 없음.  
   - **참고**: `docs/project-management/ERP_PROCEDURE_CALL_MISSING_TASK.md`  
   - **영향**: "결제 확인" 모달만 사용하는 경로에서는 ERP DB 프로시저 동기화가 누락될 수 있음.

3. **관리자 승인(approve) 시 ERP 등록/프로시저 없음**
   - **갭**: `approveMapping`은 상태만 ACTIVE로 변경하고, ERP 수입 등록·프로시저 호출을 하지 않음.  
   - **현재 설계**: ERP 등록은 입금 확인(confirm-deposit)에서만 수행한다는 주석과 일치.  
   - **영향**: "승인 시점에 ERP 반영"이 필요하다면 별도 요구사항/수정 필요.

4. **미참석/취소 시 예약금 환불 전용 플로우 없음**
   - **갭**: `ConsultationStatus.NO_SHOW` 등 "미참석" 개념은 있으나, **"미참석 시 예약금 환불"**을 자동/전용으로 처리하는 API·이벤트는 없음.  
   - **현재**: 관리자가 매칭 **강제 종료(terminate)** 또는 **부분 환불(partial-refund)**로 수동 처리.  
   - **영향**: 미참석/취소 시 예약금만 반환하는 정책·절차를 코드로 정하려면, 상태 정의 및 환불 트리거 설계가 필요.

5. **환불 시 외부 ERP 전송 미구현**
   - **갭**: `sendRefundToErp` → `sendToErpSystem`은 **모의**(항상 성공 반환). 실제 외부 ERP API 호출 없음.  
   - **영향**: 내부 재무 거래(EXPENSE)는 생성되나, 외부 시스템 연동이 필요하면 구현 추가 필요.

6. **"결재확인" vs "입금확인" 표기 혼란**
   - **갭**: 동일 매칭 상태 `PAYMENT_CONFIRMED`에 대해 UI/문서에서 "결제 확인", "입금확인", "결재확인"이 혼용됨.  
   - **영향**: 기획/운영 시 "결재확인 = 예약 대기 가능 상태"와 "입금 확인 = confirm-deposit 후 DEPOSIT_PENDING" 구분이 흐려질 수 있음. 용어·라벨 통일 권장.

7. **예약금 50% 규칙 미반영**
   - **갭**: "회기당 50% 예약금"은 코드·DB에 없음. `packagePrice`는 패키지 총액으로만 사용되며, 예약금/잔금 구분 필드 없음.  
   - **영향**: 예약금만 받은 단계와 전액 수령 단계를 구분하려면, 금액/상태 모델 확장이 필요.

---

## 4. 참고한 파일·메서드 목록

### 백엔드 (Java)

- `ConsultantClientMapping.java` — `MappingStatus.PAYMENT_CONFIRMED`, `confirmPayment()`, `confirmDeposit()`, `approveByAdmin()`
- `AdminController.java` — `confirmPayment`, `confirmDeposit`, `approveMapping`, `terminateMapping`, `partialRefundMapping`, `getRefundStatistics`, `getRefundHistory`
- `AdminServiceImpl.java` — `confirmPayment(4arg/3arg)`, `confirmDeposit`, `approveMapping`, `createConsultationIncomeTransactionAsync`, `createConsultationIncomeTransaction`, `createAdditionalSessionIncomeTransaction`, `createReceivablesTransaction`, `terminateMapping`, `partialRefundMapping`, `sendRefundToErp`, `createConsultationRefundTransaction`, `createPartialConsultationRefundTransaction`, `sendToErpSystem`
- `AdminService.java` — 인터페이스 시그니처
- `MappingStatusConstants.java` — `PAYMENT_CONFIRMED`
- `SessionExtensionRequest.java` — `ExtensionStatus.PAYMENT_CONFIRMED`, `confirmPayment()`
- `PlSqlMappingSyncController.java` — `POST /refund`, `POST /partial-refund`
- `ConsultationStatus.java` — `NO_SHOW`
- `FinancialTransactionServiceImpl.java` — `createTransaction`
- `AccountingServiceImpl.java` — `createJournalEntryFromTransaction`

### 프론트엔드 (JS/JSX)

- `MappingPaymentModal.js` — `handleConfirmPayment`, confirm-payment API 호출
- `MappingDepositModal.js` — confirm-deposit API 호출
- `IntegratedMatchingSchedule.js` — `SCHEDULABLE_STATUSES`, `PAYMENT_CONFIRMED` / `DEPOSIT_PENDING` 라벨
- `MappingManagementPage.js` — terminate, partial-refund, 상태 색상/라벨
- `MappingCard.js`, `MappingTableView.js`, `CardActionGroup.js`, `MappingListRow.js` — 결제/입금 확인 버튼 노출
- `frontend/src/constants/mapping.js`, `codeHelper.js`, `StatusBadge.js`, `messages.js` — 상태 라벨/아이콘
- `RefundManagement.js` — 환불 통계/이력 조회 API

### 문서

- `.cursor/skills/core-solution-erp/SKILL.md` — confirm-payment vs confirm-deposit, ERP 연동 흐름
- `docs/project-management/ERP_PROCEDURE_CALL_MISSING_TASK.md` — confirm-payment 프로시저 누락
- `docs/standards/ERP_TROUBLESHOOTING.md` — API·트러블슈팅

---

**문서 끝.** 코드 수정 없이 분석·갭 정리만 수행했으며, 수정이 필요하면 core-coder에게 위임할 수 있도록 위 참조 파일·메서드를 명시했다.

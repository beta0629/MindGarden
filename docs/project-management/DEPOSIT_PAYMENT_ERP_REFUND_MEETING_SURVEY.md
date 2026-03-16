# 예약금·결제확인·ERP 등록·환불 회의 — 코드베이스 조사 요약

**목적**: 예약금·결제확인·ERP 등록·환불 회의를 위한 현행 코드 위치·상태값·처리 흐름 정리  
**산출**: 기획(플래너) 보고용 요약 (코드 수정 없음, 조사·정리만)  
**작성**: core-component-manager

---

## 1. 매칭/스케줄 상태 정의·사용 위치

### 1.1 스케줄 상태 (ScheduleStatus)

| 항목 | 내용 |
|------|------|
| **정의 위치** | `src/main/java/com/coresolution/consultation/constant/ScheduleStatus.java` |
| **타입** | Java enum |
| **값 목록** | `AVAILABLE`, `BOOKED`, `CONFIRMED`, `VACATION`, `COMPLETED`, `CANCELLED` |

| 값 | 표시명 | 용도 |
|----|--------|------|
| AVAILABLE | 가능 | 예약 가능한 시간대 |
| BOOKED | 예약됨 | 상담 예약됨 |
| CONFIRMED | 확정됨 | 상담 확정됨 |
| VACATION | 휴가 | 휴가로 인한 비활성 |
| COMPLETED | 완료 | 상담 완료 |
| CANCELLED | 취소됨 | 예약 취소됨 |

**주요 사용처**
- 엔티티: `Schedule` 엔티티의 `status` 필드 (ScheduleStatus)
- 서비스: `ScheduleServiceImpl`, `AdminServiceImpl`, `StatisticsServiceImpl`, `WorkflowAutomationServiceImpl`, `ConsultationRecordServiceImpl`, `ConsultantRatingServiceImpl`
- 컨트롤러: `ScheduleController` (상태 변경·유효성 검사)
- 프론트: `colorUtils.js`(CONFIRMED, BOOKED), `UnifiedScheduleComponent_backup.js`, `ClientDashboard.js`, `MappingTableView.js` 등에서 문자열 `'BOOKED'`, `'CONFIRMED'` 사용
- API 응답: 스케줄 조회 API에서 `status` 필드로 enum name 문자열 반환

---

### 1.2 매칭 상태 (ConsultantClientMapping.MappingStatus)

| 항목 | 내용 |
|------|------|
| **정의 위치** | `src/main/java/com/coresolution/consultation/entity/ConsultantClientMapping.java` (내부 enum MappingStatus) |
| **타입** | Java enum (엔티티 필드: `status`) |
| **값 목록** | `PENDING_PAYMENT`, `PAYMENT_CONFIRMED`, `DEPOSIT_PENDING`, `DEPOSIT_CONFIRMED`, `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TERMINATED`, `SESSIONS_EXHAUSTED` |

| 값 | 의미 |
|----|------|
| PENDING_PAYMENT | 결제 대기 |
| PAYMENT_CONFIRMED | 결제 확인됨 (미수금 상태) |
| DEPOSIT_PENDING | 입금 대기 (관리자 승인 대기) |
| DEPOSIT_CONFIRMED | 입금 확인됨 |
| ACTIVE | 활성 (승인 후) |
| INACTIVE | 비활성 |
| SUSPENDED | 중단 |
| TERMINATED | 종료 |
| SESSIONS_EXHAUSTED | 회기 소진 |

**상태 전이 (엔티티 메서드 기준)**
- `confirmPayment()` → status = **PAYMENT_CONFIRMED**
- `confirmDeposit()` → status = **DEPOSIT_PENDING**
- `approveByAdmin()` → status = **ACTIVE** (DEPOSIT_PENDING에서만 호출 가능)
- 회기 소진 시 → **SESSIONS_EXHAUSTED**
- 강제 종료/부분 환불 등 → **TERMINATED** 등

**주요 사용처**
- 엔티티: `ConsultantClientMapping.status`, `ConsultantClientMapping.paymentStatus` (별도 PaymentStatus enum)
- 서비스: `AdminServiceImpl` (getMappingStatusCode, 상태별 필터/전이)
- 프론트: `frontend/src/constants/mapping.js`, `MappingCard.js`, `MappingTableView.js`, `MappingListRow.js`, `CardActionGroup.js`, `MappingStats.js`, `SessionManagement.js` 등에서 `'DEPOSIT_PENDING'`, `'PAYMENT_CONFIRMED'`, `'ACTIVE'` 등 문자열 사용
- API 응답: 매칭 조회 시 `status` 필드로 enum name 문자열 반환

---

### 1.3 매칭 결제 상태 (ConsultantClientMapping.PaymentStatus)

| 값 | 의미 |
|----|------|
| PENDING | 대기 |
| CONFIRMED | 확인됨 (기존 호환) |
| PAY | 결제 확인됨 (미수금) |
| DEP | 입금 확인됨 (현금 수입) |
| APPROVED | 승인됨 (기존 호환) |
| REJECTED | 거부됨 |
| REFUNDED | 환불됨 |

- `confirmPayment()` → paymentStatus = CONFIRMED  
- `confirmDeposit()` → paymentStatus = APPROVED, depositConfirmed = true  

---

### 1.4 ERP 거래 타입·상태 (FinancialTransaction)

| 항목 | 위치 | 값 |
|------|------|-----|
| **TransactionType** | `src/.../entity/erp/financial/FinancialTransaction.java` | `INCOME`, `EXPENSE`, `RECEIVABLES` |
| **TransactionStatus** | 동일 | `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED` |

- INCOME: 수입 (입금 확인 시 상담료 수입 등)  
- RECEIVABLES: 미수금 (결제 확인만 하고 입금 전일 때)  
- EXPENSE: 지출 (환불 시 사용)  

---

## 2. 결제·입금·환불 관련 엔티티·API·화면

### 2.1 엔티티

| 엔티티 | 경로 | 비고 |
|--------|------|------|
| ConsultantClientMapping | `entity/ConsultantClientMapping.java` | status, paymentStatus, packagePrice, paymentAmount, depositConfirmed, paymentMethod, paymentReference 등 |
| FinancialTransaction | `entity/erp/financial/FinancialTransaction.java` | INCOME/EXPENSE/RECEIVABLES, 금액·연관 매핑 등 |
| SessionExtensionRequest | `entity/SessionExtensionRequest.java` | 추가 회기 결제 확인 등 |
| DiscountAccountingTransaction | `entity/DiscountAccountingTransaction.java` | 할인·환불 회계 상태 (FULL_REFUND, PARTIAL_REFUND 등) |

### 2.2 API (백엔드 컨트롤러)

| 용도 | 메서드 | 경로 | 컨트롤러 |
|------|--------|------|----------|
| 결제 확인 (입금·금액 포함) | POST | `/api/v1/admin/mappings/{mappingId}/confirm-payment` | AdminController |
| 결제 확인 (미수금, 3인자) | POST | 동일 (body: paymentMethod, paymentReference) | AdminController |
| 입금 확인 | POST | `/api/v1/admin/mappings/{mappingId}/confirm-deposit` | AdminController |
| 매칭 승인 (입금 확인 후 활성화) | POST | `/api/v1/admin/mappings/{mappingId}/approve` | AdminController |
| 금액·관련 거래 조회 | GET | `/api/v1/admin/amount-management/mappings/{mappingId}/amount-info` | AmountManagementController |
| 매칭 강제 종료 (전체 환불) | POST | `/api/v1/admin/mappings/{id}/terminate` | AdminController |
| 부분 환불 | POST | `/api/v1/admin/mappings/{id}/partial-refund` | AdminController |
| 환불 통계 | GET | `/api/v1/admin/refund-statistics` | AdminController |
| 환불 이력 | GET | `/api/v1/admin/refund-history` | AdminController |
| 추가 회기 결제 확인 | POST | `/api/v1/admin/session-extensions/requests/{requestId}/confirm-payment` | SessionExtensionController |
| PL/SQL 환불 (회기 조절) | POST | `/api/v1/.../mapping-sync/refund` | PlSqlMappingSyncController |
| PL/SQL 부분 환불 | POST | `/api/v1/.../mapping-sync/partial-refund` | PlSqlMappingSyncController |
| 환불 가능 회기 조회 | GET | `.../mapping-sync/refundable-sessions/{mappingId}` | PlSqlMappingSyncController |
| 할인 환불 | POST | `.../plsql-discount-accounting/refund` | PlSqlDiscountAccountingController |
| 결제 환불 (일반 결제) | POST | `.../payments/{paymentId}/refund` | PaymentController |

(실제 prefix는 프로젝트 설정에 따름. `/api/v1/admin` 등은 문서·상수 기준.)

### 2.3 프론트엔드 컴포넌트·페이지

| 구분 | 컴포넌트/파일 | 역할 |
|------|----------------|------|
| 결제 확인 UI | `MappingPaymentModal.js` | confirm-payment API 호출 |
| 입금 확인 UI | `MappingDepositModal.js` | confirm-deposit API 호출 |
| 할인 결제 확인 | `DiscountPaymentConfirmationModal.js` | confirm-payment 호출 |
| 부분 환불 | `PartialRefundModal.js` | partial-refund 호출 |
| 매칭 카드/행 | `MappingCard.js`, `MappingListRow.js`, `MappingTableView.js`, `CardActionGroup.js` | 상태별 버튼(결제 확인/입금 확인/승인) 표시 |
| 매칭 통계 | `MappingStats.js` | PAYMENT_CONFIRMED 등 상태별 집계 |
| 세션 관리 | `SessionManagement.js` | 매칭 목록·상태 필터·입금확인 등 |
| 환불 관리 | `RefundManagement.js`, `RefundHistoryTable.js`, `RefundStatsCards.js`, `RefundFilters.js`, `RefundAccountingStatus.js` | 환불 이력·통계·필터 |
| ERP/재무 | `IntegratedFinanceDashboard.js`, `FinancialManagement.js`, `ErpDashboard.js` | 재무·ERP 대시 |
| 상수 | `sessionManagement.js` (CONFIRM_PAYMENT 등), `mapping.js` (MAPPING_STATUS), `apiEndpoints.js` | API 경로·상태 라벨 |

---

## 3. ERP 연동 — confirm-payment, confirm-deposit, 거래 생성·환불

### 3.1 confirm-payment vs confirm-deposit (요약)

| 구분 | confirm-payment | confirm-deposit |
|------|-----------------|------------------|
| **API** | `POST /api/v1/admin/mappings/{id}/confirm-payment` | `POST /api/v1/admin/mappings/{id}/confirm-deposit` |
| **요청** | paymentMethod, paymentReference, (선택) paymentAmount | depositReference |
| **ERP 거래** | 4인자(금액 포함): **INCOME** / 3인자(금액 없음): **RECEIVABLES** | **INCOME** (동일 로직) |
| **용도** | 결제 확인(미수금) 또는 입금 확인(금액 포함) | 입금 확인 (현금 수입) |
| **프로시저** | 4인자: 문서상 **미호출** (ERP_PROCEDURE_CALL_MISSING_TASK.md 참고) | **updateMappingInfo** 호출 있음 |

### 3.2 서비스·메서드 위치 (AdminServiceImpl)

| 처리 | 메서드 | 라인 부근 | 설명 |
|------|--------|-----------|------|
| 결제 확인 (4인자, 금액 포함) | `confirmPayment(mappingId, paymentMethod, paymentReference, paymentAmount)` | ~629 | mapping.confirmPayment(), **INCOME** 거래: createConsultationIncomeTransactionAsync 또는 createAdditionalSessionIncomeTransaction |
| 결제 확인 (3인자, 미수금) | `confirmPayment(mappingId, paymentMethod, paymentReference)` | ~985 | mapping.confirmPayment(), **RECEIVABLES**: createReceivablesTransaction (별도 트랜잭션) |
| 입금 확인 | `confirmDeposit(mappingId, depositReference)` | ~1110 | mapping.confirmDeposit(), **INCOME** 동일 로직, 이후 **updateMappingInfo** 프로시저 호출 |
| 상담료 수입 거래 생성 | `createConsultationIncomeTransaction(mapping)` (private) | ~707 | INCOME, category=CONSULTATION_FEE, subcategory=CONSULTATION_FEE |
| 상담료 수입 비동기 | `createConsultationIncomeTransactionAsync(mapping)` | ~675 | runInNewTransaction → createConsultationIncomeTransaction |
| 추가 회기 수입 | `createAdditionalSessionIncomeTransaction(mapping, amount)` (private) | ~786 | INCOME, CONSULTANT_CLIENT_MAPPING_ADDITIONAL |
| 미수금 거래 | `createReceivablesTransaction(mapping)` (private) | ~1057 | RECEIVABLES, getAccurateTransactionAmount 기반 |
| 상담료 환불 거래 (전체) | `createConsultationRefundTransaction(...)` (private) | ~879 | EXPENSE, subcategory=CONSULTATION_REFUND |
| 부분 환불 거래 | `createPartialConsultationRefundTransaction(...)` (private) | ~912 | EXPENSE, subcategory=CONSULTATION_PARTIAL_REFUND |
| 매칭 강제 종료 (환불) | `terminateMapping(id, reason)` | ~2835 | 환불 회기/금액 계산 → ERP 환불 전송 → createConsultationRefundTransaction → 스케줄 취소·알림 |
| 부분 환불 | `partialRefundMapping(id, refundSessions, reason)` | ~2951 | createPartialConsultationRefundTransaction, 회기 차감, 알림 |

### 3.3 컨트롤러 위치

| API | 컨트롤러 | 메서드 |
|-----|----------|--------|
| confirm-payment | `AdminController` | `confirmPayment(...)` (L1361 부근) |
| confirm-deposit | `AdminController` | `confirmDeposit(...)` (L2135 부근) |
| approve | `AdminController` | `approveMapping(...)` (L1428 부근) |
| terminate (강제 종료) | `AdminController` | `terminateMapping(...)` (L1966 부근) |
| partial-refund | `AdminController` | partial-refund (L1977 부근) |
| amount-info | `AmountManagementController` | GET `.../mappings/{mappingId}/amount-info` (L41) |

### 3.4 ERP 등록/환불 처리 요약

| 액션 | ERP 거래 타입 | 생성 메서드 | 비고 |
|------|----------------|-------------|------|
| 입금 확인 (confirm-deposit) | INCOME | createConsultationIncomeTransactionAsync / createAdditionalSessionIncomeTransaction | updateMappingInfo 프로시저 호출 있음 |
| 결제 확인 4인자 (confirm-payment, 금액 포함) | INCOME | 동일 | 프로시저 호출 누락 문서화됨 (ERP_PROCEDURE_CALL_MISSING_TASK.md) |
| 결제 확인 3인자 (confirm-payment, 미수금) | RECEIVABLES | createReceivablesTransaction | |
| 매칭 승인 (approve) | 없음 | — | ERP 수입 등록은 confirm-deposit에서만 수행 |
| 매칭 강제 종료 (환불) | EXPENSE (CONSULTATION_REFUND) | createConsultationRefundTransaction | PlSqlMappingSync 등 ERP 전송 후 호출 |
| 부분 환불 | EXPENSE (CONSULTATION_PARTIAL_REFUND) | createPartialConsultationRefundTransaction | |

---

## 4. 상태값·ERP 처리 위치 빠른 참조

### 4.1 상태값 목록

- **스케줄**: `AVAILABLE`, `BOOKED`, `CONFIRMED`, `VACATION`, `COMPLETED`, `CANCELLED`  
  → `ScheduleStatus.java`
- **매칭**: `PENDING_PAYMENT`, `PAYMENT_CONFIRMED`, `DEPOSIT_PENDING`, `DEPOSIT_CONFIRMED`, `ACTIVE`, `INACTIVE`, `SUSPENDED`, `TERMINATED`, `SESSIONS_EXHAUSTED`  
  → `ConsultantClientMapping.MappingStatus`
- **매칭 결제**: `PENDING`, `CONFIRMED`, `PAY`, `DEP`, `APPROVED`, `REJECTED`, `REFUNDED`  
  → `ConsultantClientMapping.PaymentStatus`
- **ERP 거래 타입**: `INCOME`, `EXPENSE`, `RECEIVABLES`  
  → `FinancialTransaction.TransactionType`
- **ERP 거래 상태**: `PENDING`, `APPROVED`, `REJECTED`, `CANCELLED`, `COMPLETED`  
  → `FinancialTransaction.TransactionStatus`

### 4.2 ERP 등록/환불 처리 위치 한눈에

| 처리 | 컨트롤러 | 서비스 메서드 | ERP 거래 |
|------|----------|----------------|----------|
| 입금 확인 | AdminController.confirmDeposit | AdminServiceImpl.confirmDeposit | INCOME + updateMappingInfo |
| 결제 확인 (금액 O) | AdminController.confirmPayment (4arg) | AdminServiceImpl.confirmPayment(4arg) | INCOME |
| 결제 확인 (미수금) | AdminController.confirmPayment (3arg) | AdminServiceImpl.confirmPayment(3arg) | RECEIVABLES |
| 매칭 승인 | AdminController.approveMapping | AdminServiceImpl.approveMapping | 없음 |
| 강제 종료(환불) | AdminController.terminateMapping | AdminServiceImpl.terminateMapping | EXPENSE(환불) |
| 부분 환불 | AdminController.partial-refund | AdminServiceImpl.partialRefundMapping | EXPENSE(부분환불) |

---

**참고 문서**
- `.cursor/skills/core-solution-erp/SKILL.md` — confirm-payment vs confirm-deposit, amount-info
- `docs/standards/ERP_TROUBLESHOOTING.md` — 로그·API·체크리스트
- `docs/project-management/ERP_PROCEDURE_CALL_MISSING_TASK.md` — confirm-payment 4인자 프로시저 누락

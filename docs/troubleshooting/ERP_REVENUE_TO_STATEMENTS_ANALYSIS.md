# 상담료 결제 완료 시 재무제표(대차대조표·손익계산서) 내역 없음 — 원인 분석

**작성일**: 2025-03-04  
**역할**: core-debugger (원인 분석·수정 제안만, 코드 수정은 core-coder 위임)  
**참조**: `docs/standards/ERROR_HANDLING_STANDARD.md`, `docs/troubleshooting/ERP_DEV_TEST_DATA_GUIDE.md`

---

## 1. 증상 요약

- **현상**: ERP에서 상담료가 테스트로 "결제 완료"가 되면 수익으로 잡혀야 하는데, **대차대조표 및 손익계산서 내역이 없다**.
- **기대**: 결제 완료 → 수익 인식 → 손익계산서(수익·비용·순이익) / 대차대조표(자산·부채·자본)에 노출.

---

## 2. 결제 완료가 어디에 기록되는지

### 2.1 결제 완료 시 갱신되는 테이블/엔티티

| 경로 | 갱신/생성되는 것 | 분개/원장 연동 |
|------|------------------|----------------|
| **Payment 상태 → APPROVED** | `payments` 갱신, `financial_transactions` 생성, `accounting_entries`(분개) + `erp_journal_entry_lines` 생성 | 분개는 **DRAFT**로만 생성됨. 전기(post) 없음 → **원장 미반영** |
| **매핑 입금 확인 (confirmPayment)** | `consultant_client_mappings` 갱신, `financial_transactions` 생성, 분개 생성 | 동일. DRAFT 분개만 생성 → **원장 미반영** |
| **상담 비용 정산 (settleConsultationCost)** | `consultations` 의 `consultant_notes`에 결제정보 JSON 저장만 | Payment/FinancialTransaction/분개 **생성 없음** |

- **Payment 경로**  
  - `PaymentServiceImpl.updatePaymentStatus()` 에서 `status == Payment.PaymentStatus.APPROVED` 일 때  
    `financialTransactionService.createPaymentTransaction(payment.getId(), ...)` 호출 (약 219줄).  
  - `FinancialTransactionServiceImpl.createPaymentTransaction()` → `createTransaction()` →  
    `accountingService.createJournalEntryFromTransaction(savedTransaction)` 호출 (약 142줄).
- **입금 확인 경로**  
  - `AdminServiceImpl.confirmPayment()` → `createConsultationIncomeTransaction()` / `createAdditionalSessionIncomeTransaction()`  
    → `financialTransactionService.createTransaction(request, null)`  
    → 동일하게 `createJournalEntryFromTransaction(savedTransaction)` 호출.

즉, “결제 완료”(Payment APPROVED 또는 매핑 입금 확인) 시 **FinancialTransaction**과 **분개(AccountingEntry + JournalEntryLine)** 는 생성되지만, 아래에서 설명할 **전기(post)** 가 없어 원장에 반영되지 않음.

### 2.2 결제 완료 시 수익 인식 트리거

- **있는 것**:  
  - Payment APPROVED 시: `createPaymentTransaction()` → FinancialTransaction(INCOME) 생성 + `createJournalEntryFromTransaction()`.  
  - confirmPayment 시: `createConsultationIncomeTransaction()` 등 → 동일하게 FinancialTransaction + `createJournalEntryFromTransaction()`.
- **없는 것**:  
  - 분개를 **승인(APPROVED)** 하거나 **전기(POSTED)** 하는 트리거가 **전혀 없음**.  
  - 원장 갱신은 `AccountingServiceImpl.postJournalEntry()` 안에서만 이루어지며, 이 메서드는 **APPROVED** 상태 분개만 전기할 수 있음.

---

## 3. 대차대조표·손익계산서 API가 어디서 데이터를 가져오는지

- **소스**: **원장(Ledger)** 만 사용.  
  - `FinancialStatementServiceImpl.generateIncomeStatement()` / `generateBalanceSheet()` / `generateCashFlowStatement()`  
    → 모두 `ledgerService.getLedgersByPeriod(tenantId, startDate, endDate)` (또는 동일 기간) 호출.  
  - `LedgerServiceImpl.getLedgersByPeriod()` → `LedgerRepository.findByTenantIdAndPeriod()` → **`erp_ledgers`** 테이블만 조회.
- **조건**:  
  - `tenantId` (TenantContextHolder),  
  - 손익계산서/현금흐름: `startDate`, `endDate`,  
  - 대차대조표: `asOfDate` → 해당 월 `periodStart`~`periodEnd` 로 변환 후 동일하게 `getLedgersByPeriod()`.
- **계정 분류**:  
  - 수익/비용/자산/부채/자본은 `Ledger`의 `Account.description` / `Account.accountNumber` 키워드로 판별  
  - (`FinancialStatementServiceImpl` 내 `isRevenueAccount`, `isExpenseAccount`, `isAssetAccount` 등).  
  - **원장에 행이 없으면** 해당 구간 수익/비용/자산/부채/자본은 0 또는 빈 항목으로 나옴.

---

## 4. 데이터가 끊기는 지점 (근본 원인)

### 4.1 끊김 1: 분개는 생성되지만 전기되지 않음 (핵심)

- `AccountingServiceImpl.createJournalEntryFromTransaction()`:  
  - FinancialTransaction(INCOME/EXPENSE)에 따라 분개 라인을 만들고  
  - `createJournalEntry(tenantId, entry, lines)` 를 호출해 **DRAFT** 상태로만 저장 (`AccountingServiceImpl` 64줄: `entry.setEntryStatus(EntryStatus.DRAFT)`).
- 원장 반영은 **`postJournalEntry(tenantId, entryId)`** 에서만 일어남:  
  - `AccountingServiceImpl.postJournalEntry()` (129~167줄)  
  - 조건: `entry.getEntryStatus() == APPROVED`  
  - 동작: 각 `JournalEntryLine`에 대해 `ledgerService.updateLedgerFromJournalEntry()` 호출 → `erp_ledgers` 생성/갱신.
- **자동 생성 분개**에는 `approveJournalEntry()` / `postJournalEntry()` 호출이 **한 번도 없음**.  
  → 결제 완료/입금 확인으로 분개가 생겨도 **원장에 안 들어가고**, 재무제표는 원장만 보므로 **대차대조표·손익계산서 내역이 없는 것**이 맞음.

### 4.2 끊김 2: 전기 가능 상태

- `postJournalEntry()` 는 **APPROVED** 분개만 전기 가능.  
- 현재 자동 생성 분개는 **DRAFT** 이므로, 배치 등으로 나중에 전기하려면 “자동 생성 분개를 APPROVED로 변경한 뒤 전기”하는 로직이 별도로 필요함.

### 4.3 끊김 3 (가능): 계정 매핑 없음

- `createJournalEntryFromTransaction()` 내부에서  
  `getDefaultAccountId(tenantId, "REVENUE")`, `"EXPENSE"`, `"CASH"` 를 **공통코드** `ERP_ACCOUNT_TYPE` 에서 조회.  
- 여기서 계정 ID를 못 찾으면 `revenueAccountId` / `expenseAccountId` / `cashAccountId` 중 하나가 null 이 되어  
  **분개 생성 자체를 하지 않고** null 반환 (AccountingServiceImpl 224~232, 278~279줄).  
- 이 경우 FinancialTransaction만 있고 분개가 없음 → 원장·재무제표 당연히 0.

### 4.4 정리

- **재무제표** = 원장(`erp_ledgers`)만 읽음.  
- **원장** = **전기(POSTED)** 된 분개에 대해서만 `updateLedgerFromJournalEntry()` 로 채워짐.  
- **결제/입금 확인** 시에는 분개만 DRAFT로 생성되고, **승인·전기 호출이 없음** → 원장 비어 있음 → **대차대조표·손익계산서 내역 없음**.

---

## 5. 수정 제안 (core-coder 위임용)

### 5.1 방향 A (권장): 자동 생성 분개에 대해 “승인 + 전기” 자동 호출

- **파일**: `AccountingServiceImpl.java`  
  - `createJournalEntryFromTransaction()` 에서 `createJournalEntry()` 로 분개 저장 후,  
    해당 분개가 **거래 연동 자동 분개**인 경우(이미 같은 메서드 안에서 생성한 entry)에 한해:  
    1. `approveJournalEntry(tenantId, saved.getId(), approverId, comment)`  
       - approverId/comment 는 “시스템 자동”(예: 시스템 사용자 ID, "자동승인") 등 정책에 맞게 정의.  
    2. 그 다음 `postJournalEntry(tenantId, saved.getId())`  
  - 단, `approveJournalEntry()` 가 현재 “승인 가능 상태”를 어떻게 검사하는지 확인 필요.  
    `AccountingEntry` 에 “자동 생성 분개” 플래그가 있으면, 해당 분개는 승인 가능 조건을 완화하거나 별도 경로로 APPROVED → POSTED 로 넘기는 방식도 가능.
- **또는**  
  - `FinancialTransactionServiceImpl.createTransaction()` (또는 `createPaymentTransaction()` / AdminServiceImpl 쪽 createConsultationIncomeTransaction 등)  
  - 에서 `createJournalEntryFromTransaction()` 반환값(AccountingEntry)을 받아,  
    null이 아니면 **같은 트랜잭션 또는 새 트랜잭션**에서 `approveJournalEntry` + `postJournalEntry` 를 호출하도록 할 수 있음.  
  - 이 경우 AccountingService에 “자동 생성 분개를 승인 후 전기”하는 하나의 메서드(예: `createAndPostJournalEntryFromTransaction(FinancialTransaction)`)를 두면, 결제/입금 확인 쪽에서는 한 번만 호출하면 됨.

### 5.2 방향 B: 재무제표가 원장 대신 FinancialTransaction 등 직접 집계

- 재무제표 API가 **원장이 아닌** `financial_transactions` (및 필요 시 다른 테이블)를 기간/테넌트로 집계해 수익·비용을 계산하도록 변경.  
- 장점: 결제 완료만 되어도 즉시 수치 반영.  
- 단점: 회계 도메인(원장 = 분개 전기의 결과)과 불일치, 이중 집계·불균형 가능성, 유지보수 부담.  
- **권장하지 않음**. 원장 기반 유지 + “자동 분개 전기”로 끊김을 없애는 편이 일관됨.

### 5.3 계정 매핑 점검 (필수)

- 테넌트별 **공통코드** `ERP_ACCOUNT_TYPE` 에  
  - `REVENUE`(수익), `EXPENSE`(비용), `CASH`(현금) 에 해당하는 **계정 ID** 가  
  - `extraData` 또는 `codeDescription` 등으로 설정되어 있는지 확인.  
- 없으면 `createJournalEntryFromTransaction()` 이 분개를 만들지 않으므로,  
  수정 후에도 재무제표에 나오지 않을 수 있음.  
  - 필요 시 시딩/마이그레이션 또는 관리 화면에서 해당 공통코드 설정 가능하도록 안내.

---

## 6. 체크리스트 (수정 후 core-coder / 검증용)

- [ ] 결제 완료(Payment APPROVED) 또는 매핑 입금 확인(confirmPayment) 시  
      `createJournalEntryFromTransaction()` 이후 **같은 분개에 대해 approve + post** 가 호출되는가?
- [ ] 호출 순서: `createJournalEntry` → (필요 시) `approveJournalEntry` → `postJournalEntry` 가  
      트랜잭션/예외 처리 상 안전한가? (전기 실패 시 보상 처리 정책 확인)
- [ ] 테넌트별 `ERP_ACCOUNT_TYPE` (REVENUE, EXPENSE, CASH) 계정 ID가 설정되어 있는가?
- [ ] 해당 테넌트·기간으로  
      `GET /api/v1/erp/accounting/statements/income?startDate=...&endDate=...`  
      `GET /api/v1/erp/accounting/statements/balance?asOfDate=...`  
      호출 시, 결제 완료/입금 확인한 금액이 수익(또는 자산/현금) 쪽에 반영되는가?
- [ ] `erp_ledgers` 에 해당 기간·계정에 대한 행이 생겼는지 DB로 확인할 수 있는가?

---

## 7. 참고 코드 위치

| 구분 | 파일·위치 |
|------|-----------|
| 결제 완료 시 FinancialTransaction·분개 생성 | `PaymentServiceImpl` 212~221줄 (APPROVED 시 createPaymentTransaction) |
| 입금 확인 시 수입 거래·분개 생성 | `AdminServiceImpl` confirmPayment, createConsultationIncomeTransaction 등 |
| 분개 생성(자동) | `AccountingServiceImpl.createJournalEntryFromTransaction()` (201~277), `createJournalEntry()` (64: DRAFT 설정) |
| 분개 승인/전기 | `AccountingServiceImpl.approveJournalEntry()`, `postJournalEntry()` (129~167, 153~156: 원장 갱신) |
| 재무제표 데이터 소스 | `FinancialStatementServiceImpl` 40~41, 94~96, 161~162: `ledgerService.getLedgersByPeriod()` |
| 원장 갱신 | `LedgerServiceImpl.updateLedgerFromJournalEntry()` (34~89) |
| 계정 ID 조회 | `AccountingServiceImpl.getDefaultAccountId()` (281~339), 공통코드 `ERP_ACCOUNT_TYPE` |

---

**요약**: 상담료 결제 완료 시 수익이 대차대조표·손익계산서에 안 나오는 이유는, **분개가 DRAFT로만 생성되고 승인·전기가 한 번도 호출되지 않아 원장이 갱신되지 않기 때문**입니다. 재무제표는 원장만 읽으므로, **자동 생성 분개에 대해 승인 + 전기를 호출**하도록 하면 됩니다. 추가로 테넌트별 수익/비용/현금 계정 매핑(공통코드) 존재 여부를 반드시 점검해야 합니다.

# 상담료 결제 완료 시 재무제표(대차대조표·손익계산서·현금흐름표) 내역 없음 — 원인 분석

**작성일**: 2025-03-04  
**갱신일**: 2025-03-14 (데이터 소스·분개 전기 흐름·프로시저 의존성·재현 절차 보강)  
**역할**: core-debugger (원인 분석·수정 제안만, 코드 수정은 core-coder 위임)  
**참조**: `docs/standards/ERROR_HANDLING_STANDARD.md`, `docs/troubleshooting/ERP_DEV_TEST_DATA_GUIDE.md`

---

## 1. 증상 요약

- **현상**: ERP 상담료 수입(INCOME)은 `financial_transactions`에 등록되어 있으나, **대차대조표·손익계산서·현금흐름표에는 실제 데이터가 표시되지 않음**.
- **기대**: 결제/입금 확인 → 수익 인식 → 손익계산서(수익·비용·순이익) / 대차대조표(자산·부채·자본) / 현금흐름표에 노출.

---

## 2. 재무제표 데이터 소스 추적 (테이블·컬럼·서비스)

### 2.1 대차대조표·손익계산서·현금흐름표가 읽는 데이터

| 구분 | API | 서비스 메서드 | 저장소 |
|------|-----|---------------|--------|
| 손익계산서 | `GET /api/v1/erp/accounting/statements/income?startDate=&endDate=` | `FinancialStatementServiceImpl.generateIncomeStatement()` | `ledgerService.getLedgersByPeriod()` → **`erp_ledgers`** |
| 대차대조표 | `GET /api/v1/erp/accounting/statements/balance?asOfDate=` | `FinancialStatementServiceImpl.generateBalanceSheet()` | 동일. `asOfDate` 기준 월의 `periodStart`~`periodEnd`로 `getLedgersByPeriod()` 호출 → **`erp_ledgers`** |
| 현금흐름표 | `GET /api/v1/erp/accounting/statements/cash-flow?startDate=&endDate=` | `FinancialStatementServiceImpl.generateCashFlowStatement()` | 동일 → **`erp_ledgers`** |

- **컨트롤러**: `FinancialStatementController` → `FinancialStatementService`  
- **구현체**: `FinancialStatementServiceImpl` (40~41, 94~96, 161~162줄)  
  - 세 제표 모두 **원장만** 사용. `LedgerService.getLedgersByPeriod(tenantId, startDate, endDate)` 호출.
- **원장 조회**: `LedgerServiceImpl.getLedgersByPeriod()` → `LedgerRepository.findByTenantIdAndPeriod(tenantId, startDate, endDate)`  
  - **테이블**: `erp_ledgers` (엔티티 `Ledger`)  
  - **쿼리**: `periodStart >= :startDate AND periodEnd <= :endDate`, `tenantId` 일치.

**결론**: 재무제표는 **`erp_ledgers`만** 읽음. `financial_transactions`, `accounting_entries`, `erp_journal_entry_lines`는 재무제표 생성 시 **직접 사용하지 않음**.

### 2.2 테이블·엔티티 연결 관계

```
financial_transactions (수입/지출 거래)
    ↓ createJournalEntryFromTransaction()
accounting_entries (분개 헤더) + erp_journal_entry_lines (분개 라인)
    ↓ postJournalEntry() → updateLedgerFromJournalEntry()
erp_ledgers (원장: 계정별·기간별 합계)
    ↑ 재무제표는 여기만 조회
```

- **원장에 쓰기**: `postJournalEntry()` 내부에서만 `LedgerServiceImpl.updateLedgerFromJournalEntry()` 호출 → `erp_ledgers` 행 생성/갱신.
- **원장에 쓰이려면**: 분개가 **APPROVED** 상태여야 하고, **postJournalEntry()**가 호출되어야 함.

### 2.3 프로시저·저장함수·뷰 의존성

- **대차대조표/손익계산서/현금흐름표**: **저장 프로시저·저장함수·DB 뷰 미사용**.  
  Java 서비스에서 `LedgerRepository`(JPA)로 `erp_ledgers`만 조회 후 메모리에서 계정별 합계·분류.
- **PlSqlStatisticsService**: 재무제표 API와 **무관**. 실시간 통계·스케줄 통계 등 별도 용도.  
  재무제표는 `FinancialStatementService` + `LedgerService`만 사용.

---

## 3. 결제/입금 확인이 어디에 기록되는지

### 3.1 갱신되는 테이블/엔티티

| 경로 | 갱신/생성되는 것 | 분개/원장 연동 (현재 코드 기준) |
|------|------------------|--------------------------------|
| **Payment 상태 → APPROVED** | `payments` 갱신, `financial_transactions` 생성, `accounting_entries` + `erp_journal_entry_lines` 생성 | 분개 생성 후 **자동 승인·전기** 시도 (`AccountingServiceImpl` 292~305). 전기 성공 시 원장 반영 |
| **매핑 입금 확인 (confirmPayment)** | `consultant_client_mappings` 갱신, `financial_transactions` 생성, 분개 생성 | 동일. 자동 승인·전기 시도 |
| **상담 비용 정산 (settleConsultationCost)** | `consultations`의 `consultant_notes`에 JSON 저장만 | Payment/FinancialTransaction/분개 **생성 없음** |

- **Payment 경로**: `PaymentServiceImpl` (약 219줄) → `financialTransactionService.createPaymentTransaction()` → `createTransaction()` → `accountingService.createJournalEntryFromTransaction(savedTransaction)` (약 148줄).
- **입금 확인 경로**: `AdminServiceImpl.confirmPayment()` → `createConsultationIncomeTransaction()` 등 → `financialTransactionService.createTransaction(request, null)` → 동일하게 `createJournalEntryFromTransaction()`.

### 3.2 분개·전기 흐름 (현재 구현)

- `AccountingServiceImpl.createJournalEntryFromTransaction()` (216~318줄):
  1. `getDefaultAccountId(tenantId, "REVENUE"|"EXPENSE"|"CASH")` 로 계정 ID 조회. 없으면 `ensureErpAccountMappingForTenant(tenantId)` 호출 후 재조회.  
     **여전히 null이면 분개 생성하지 않고 null 반환** (246~253줄).
  2. `createJournalEntry(tenantId, entry, lines)` → 분개를 **DRAFT** 상태로 저장 (77줄: `entry.setEntryStatus(EntryStatus.DRAFT)`).
  3. **자동 승인·전기** (292~305줄):  
     `approveJournalEntry(tenantId, saved.getId(), null, "자동승인(결제/입금연동)")` → `postJournalEntry(tenantId, saved.getId())`.  
     전기 중 예외 발생 시 로그만 남기고, 분개는 APPROVED 상태로 남을 수 있음(원장 미반영).
- **전기 조건**: `postJournalEntry()`는 **APPROVED** 상태 분개만 전기 가능 (161~162줄).  
  `approveJournalEntry()`는 **approvalStatus == PENDING**일 때만 승인 가능 (121~123줄).  
  새로 저장한 분개는 기본값이 PENDING이므로 자동 승인 가능.

**이전 분석과의 차이**: 코드 상에는 이미 **자동 승인·전기**가 구현되어 있음. 그럼에도 재무제표에 데이터가 없다면 아래 “끊기는 지점” 후보를 확인해야 함.

---

## 4. 데이터가 끊기는 지점 (근본 원인 후보)

현재 코드에는 자동 승인·전기가 있으므로, **재무제표에 여전히 데이터가 없다면** 아래 중 하나 이상일 가능성이 있음.

### 4.1 분개가 아예 생성되지 않음 (계정 매핑)

- `createJournalEntryFromTransaction()` 에서 `getDefaultAccountId(tenantId, "REVENUE"|"EXPENSE"|"CASH")` 가 null 이면  
  `ensureErpAccountMappingForTenant(tenantId)` 호출 후에도 하나라도 null 이면 **분개 생성하지 않고 null 반환** (246~253줄).
- **확인**: 해당 테넌트의 공통코드 `ERP_ACCOUNT_TYPE` (REVENUE, EXPENSE, CASH)에 `extraData` 또는 `codeDescription` 으로 계정 ID가 설정되어 있는지.  
  없으면 FinancialTransaction만 있고 분개·원장 없음 → 재무제표 0.

### 4.2 테넌트 컨텍스트 불일치로 분개 생성 건너뜀

- `createJournalEntryFromTransaction()` 상단 (224~229줄):  
  `TenantContextHolder.getTenantId()` 와 `transaction.getTenantId()` 가 다르면 **경고 로그 후 null 반환**, 분개 미생성.
- **확인**: 입금 확인/결제 완료가 **비동기·별도 트랜잭션**에서 실행될 때 해당 콜백에서 `TenantContextHolder`에 올바른 tenantId가 설정되어 있는지.

### 4.3 자동 승인·전기 중 예외 발생

- 292~305줄: `approveJournalEntry()` 또는 `postJournalEntry()` 에서 예외가 나면 catch 되어 로그만 남고,  
  분개는 저장된 상태(APPROVED까지 갔을 수 있음)로 남지만 **원장에는 미반영**될 수 있음.
- **확인**: 애플리케이션 로그에서  
  `"분개 전기 실패: 원장 미반영"` / `"분개 생성 실패"` / `"테넌트 ID 불일치"` 등 검색.  
  원인: 계정 테넌트 불일치, 원장 기간/계정 조회 예외 등.

### 4.4 과거 데이터 (자동 전기 도입 전 생성된 거래)

- 자동 승인·전기 로직이 추가되기 **이전**에 생성된 INCOME 거래는 분개가 DRAFT 또는 APPROVED로만 있고 전기되지 않았을 수 있음.  
  해당 분개들은 원장에 없음 → 재무제표에 반영 안 됨.
- **확인**: `accounting_entries` 에서 `entry_status = 'POSTED'` 가 아닌 행이 해당 기간·거래에 있는지.  
  필요 시 과거 분개에 대해 수동 전기 또는 배치 전기 검토.

### 4.5 정리

- **재무제표** = **`erp_ledgers`만** 읽음.
- **원장** = **전기(POSTED)** 된 분개에 대해서만 `updateLedgerFromJournalEntry()` 로 채워짐.
- **자동 생성 분개**에는 이미 승인·전기 호출이 있으나, **계정 매핑·테넌트·예외·과거 데이터** 중 하나 때문에 원장이 비어 있을 수 있음.

---

## 5. 수정 제안 (core-coder 위임용)

**참고**: 자동 승인·전기는 이미 `AccountingServiceImpl.createJournalEntryFromTransaction()` (292~305줄)에 구현되어 있음. 재무제표에 데이터가 없다면 원인 후보(4.1~4.4)를 먼저 점검한 뒤, 아래는 필요 시 적용.

### 5.1 방향 A (참고): 자동 생성 분개에 대해 “승인 + 전기” 자동 호출

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

## 6. 재현 절차

1. **테넌트·기간 정하기**: 대상 tenantId, 조회할 월(예: 2025-03).
2. **수입 거래 존재 확인**:  
   `SELECT id, tenant_id, transaction_type, amount, transaction_date FROM financial_transactions WHERE tenant_id = ? AND transaction_type = 'INCOME' AND transaction_date BETWEEN '2025-03-01' AND '2025-03-31';`
3. **분개·전기 상태 확인**:  
   `SELECT ae.id, ae.tenant_id, ae.entry_number, ae.entry_status, ae.approval_status, ae.entry_date FROM accounting_entries ae WHERE ae.tenant_id = ? AND ae.entry_date BETWEEN '2025-03-01' AND '2025-03-31' ORDER BY ae.entry_date;`  
   - `entry_status = 'POSTED'` 인 분개만 원장에 반영됨.
4. **원장 확인**:  
   `SELECT * FROM erp_ledgers WHERE tenant_id = ? AND period_start >= '2025-03-01' AND period_end <= '2025-03-31';`  
   - 비어 있으면 재무제표에도 해당 기간 데이터 없음.
5. **재무제표 API 호출**:  
   `GET /api/v1/erp/accounting/statements/income?startDate=2025-03-01&endDate=2025-03-31`  
   `GET /api/v1/erp/accounting/statements/balance?asOfDate=2025-03-31`  
   `GET /api/v1/erp/accounting/statements/cash-flow?startDate=2025-03-01&endDate=2025-03-31`  
   - 로그인·ERP 권한 필요.
6. **애플리케이션 로그**:  
   결제/입금 확인 직후 `"분개 전기 실패"`, `"테넌트 ID 불일치"`, `"기본 계정을 찾을 수 없습니다"` 등 검색.

---

## 7. 체크리스트 (수정·점검 후 검증용)

- [ ] 테넌트별 `ERP_ACCOUNT_TYPE` (REVENUE, EXPENSE, CASH) 계정 ID가 설정되어 있는가?
- [ ] 결제 완료 또는 매핑 입금 확인 시 `createJournalEntryFromTransaction()` 이후  
      **approveJournalEntry** → **postJournalEntry** 가 호출되는가? (이미 코드에 있음)
- [ ] 전기 중 예외가 나지 않는가? (로그에 "분개 전기 실패" 없음)
- [ ] 해당 테넌트·기간으로 재현 절차 2~5 실행 시  
      `financial_transactions` INCOME → `accounting_entries` POSTED → `erp_ledgers` 행 존재 → 재무제표에 금액 반영되는가?
- [ ] `erp_ledgers` 에 해당 기간·계정에 대한 행이 생겼는지 DB로 확인했는가?

---

## 8. 참고 코드 위치

| 구분 | 파일·위치 |
|------|-----------|
| 재무제표 API | `FinancialStatementController` (income/balance/cash-flow) |
| 재무제표 데이터 소스 | `FinancialStatementServiceImpl` 40~41, 94~96, 161~162: `ledgerService.getLedgersByPeriod()` |
| 원장 조회 | `LedgerServiceImpl.getLedgersByPeriod()` → `LedgerRepository.findByTenantIdAndPeriod()` → `erp_ledgers` |
| 원장 갱신 | `LedgerServiceImpl.updateLedgerFromJournalEntry()` (34~89) |
| 결제 완료 시 거래·분개 | `PaymentServiceImpl` → `FinancialTransactionServiceImpl.createTransaction()` → `createJournalEntryFromTransaction()` |
| 입금 확인 시 거래·분개 | `AdminServiceImpl` confirmPayment, createConsultationIncomeTransaction 등 → `createTransaction()` → `createJournalEntryFromTransaction()` |
| 분개 생성·자동 승인·전기 | `AccountingServiceImpl.createJournalEntryFromTransaction()` (216~318), 292~305: approve + post |
| 분개 승인/전기 | `AccountingServiceImpl.approveJournalEntry()` (104~139), `postJournalEntry()` (144~180) |
| 계정 ID 조회·시딩 | `AccountingServiceImpl.getDefaultAccountId()` (322~377), `ensureErpAccountMappingForTenant()` (386~498) |

---

**요약**:  
- **재무제표(대차대조표·손익계산서·현금흐름표)** 는 **`erp_ledgers`만** 조회하며, 저장 프로시저/PlSqlStatisticsService는 사용하지 않음.  
- **수입 거래**는 `financial_transactions` → 분개(`accounting_entries` + `erp_journal_entry_lines`) → **전기 시** `erp_ledgers` 에 반영됨.  
- 코드에는 이미 **자동 승인·전기**가 있으므로, 재무제표에 데이터가 없다면 **계정 매핑·테넌트 컨텍스트·전기 예외·과거 미전기 분개** 중 하나를 우선 점검하고, 계정 매핑 시딩·로그 확인·필요 시 과거 분개 배치 전기를 검토하면 됨.

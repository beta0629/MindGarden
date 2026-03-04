# 재무제표(대차대조표·현금흐름표·손익계산서) 0 표시 vs 다른 리포트 연동 기획

**작성일**: 2025-03-04  
**역할**: core-planner (기획만 수행, 코드·디버깅 직접 수정 없음)  
**참조**: `docs/troubleshooting/ERP_REVENUE_TO_STATEMENTS_ANALYSIS.md`, `docs/standards/ERP_ADVANCEMENT_STANDARD.md`

---

## 1. 목표·요구사항

- **사용자 지적**: 대차대조표·현금흐름표·손익계산서에는 **0**으로 나오는데, **다른 리포트**에는 수익·금액이 있다. 서로 연동되어야 하는 것 아니냐는 요청.
- **기획 목표**  
  1. **원인 파악**: 세 재무제표가 0으로 나오는 이유와, "다른 리포트"의 데이터 소스 정리.  
  2. **연동 관계 정리**: 세 재무제표와 다른 리포트가 같은 데이터(원장/거래/매핑 입금 등)를 바라보고 연동되어야 하는지, 현재 구조상 어떻게 연결·끊겨 있는지 분석.  
  3. **수정 방향**: 연동되도록 하려면 어떤 API·집계·키를 맞춰야 하는지, 파일·위치 수준 제안. 필요 시 **분배실행 표**로 core-debugger(원인 상세) → core-coder(수정) 호출용 프롬프트 초안 포함.

---

## 2. 범위

| 포함 | 제외 |
|------|------|
| 통합 재무 대시보드(IntegratedFinanceDashboard) 내 개요 탭 vs 대차대조표·손익계산서·현금흐름표 탭 | ERP 메뉴 외 다른 모듈 |
| 재무제표 API(`/api/v1/erp/accounting/statements/*`)와 재무 대시보드 API(`/api/v1/erp/finance/dashboard`) 데이터 소스·연동 | 일/월/년 리포트 API 상세 구현 (참고만) |
| 원장(Ledger)·분개(AccountingEntry)·FinancialTransaction·매핑 입금/환불 분개 생성 경로 | 회계 과목 마스터 신규 설계 |

---

## 3. 현재 구조 요약 (탐색 결과)

### 3.1 프론트엔드

| 화면/탭 | 호출 API | 응답 사용처 |
|---------|----------|-------------|
| **개요 탭** | `GET /api/v1/erp/finance/dashboard` (ERP_API.FINANCE_DASHBOARD) | `dashboardData.financialData`: totalIncome, totalExpense, netProfit, incomeByCategory, expenseByCategory, transactionCount |
| **대차대조표 탭** | `GET /api/v1/erp/accounting/statements/balance?asOfDate=` (ERP_API.FINANCIAL_STATEMENT_BALANCE) | balanceSheetData: assets/liabilities/equity { total, items[] }, isBalanced, balanceCheck |
| **손익계산서 탭** | `GET /api/v1/erp/accounting/statements/income?startDate=&endDate=` (ERP_API.FINANCIAL_STATEMENT_INCOME) | incomeStatementData: revenue/expenses { total, items[] }, netIncome |
| **현금흐름표 탭** | `GET /api/v1/erp/accounting/statements/cash-flow?startDate=&endDate=` (ERP_API.FINANCIAL_STATEMENT_CASHFLOW) | cashFlowData: operating/investing/financing { total 등 }, netCashIncrease |

- 프론트는 각 탭별로 위 API만 호출하며, 응답 언래핑(StandardizedApi 또는 response.data) 후 그대로 표시. **키 매핑 이슈보다는 백엔드에서 0을 주는지 여부가 핵심.**

### 3.2 백엔드 데이터 소스

| API/기능 | Controller | Service | 데이터 소스 |
|----------|------------|--------|-------------|
| **재무 대시보드(개요)** | ErpController.getFinanceDashboard | ErpServiceImpl.getBranchFinanceDashboard | **FinancialTransaction** 직접 집계 (getTransactionsByBranch / getBranchFinancialData) → `financial_transactions` 테이블 |
| **대차대조표** | FinancialStatementController.getBalanceSheet | FinancialStatementServiceImpl.generateBalanceSheet | **Ledger** (LedgerService.getLedgersByPeriod) → `erp_ledgers` 테이블 |
| **손익계산서** | FinancialStatementController.getIncomeStatement | FinancialStatementServiceImpl.generateIncomeStatement | **Ledger** (동일) |
| **현금흐름표** | FinancialStatementController.getCashFlowStatement | FinancialStatementServiceImpl.generateCashFlowStatement | **Ledger** (동일) |

- **원장(Ledger)** 은 **전기(POSTED)** 된 분개에 대해서만 `LedgerServiceImpl.updateLedgerFromJournalEntry()` 로 갱신됨.  
- **분개** 는 다음 경로에서 생성 가능:  
  - FinancialTransaction 생성 시: `FinancialTransactionServiceImpl.createTransaction()` → `AccountingServiceImpl.createJournalEntryFromTransaction()` (이미 내부에서 approve + post 호출하여 원장 반영 시도).  
  - 매핑 입금/환불: `PlSqlMappingSyncServiceImpl` / `PlSqlDiscountAccountingServiceImpl` → `createJournalEntryFromTransaction()`.  
- 분개 생성 시 **계정 매핑** 은 공통코드 `ERP_ACCOUNT_TYPE` (REVENUE, EXPENSE, CASH) 의 `extraData.accountId` 로 조회. 없으면 분개 생성 스킵 → 원장 미반영.

### 3.3 재무제표의 계정 분류

- `FinancialStatementServiceImpl` 에서 수익/비용/자산/부채/자본/영업·투자·재무 활동 구분은 **Account** 의 `description`, `accountNumber` (및 accountHolder) 키워드로만 판별.  
- 예: `isRevenueAccount` → "수익", "revenue", "income" 등 포함 여부.  
- **원장에 행이 있어도** 해당 계정의 description/accountNumber에 위 키워드가 없으면 재무제표 집계에서 제외되어 **0으로 나올 수 있음.**

---

## 4. 원인 요약 (1~2문장)

- **세 재무제표가 0으로 나오는 이유**: 재무제표는 **원장(erp_ledgers)** 만 사용하는데, 원장은 **전기(POSTED)된 분개**로만 채워지며, (1) **테넌트별 계정 매핑(ERP_ACCOUNT_TYPE)** 이 없어 분개가 생성되지 않거나, (2) 분개는 생성·전기되었으나 **원장 계정의 description/accountNumber** 가 수익·비용·자산 등 키워드와 맞지 않아 재무제표 집계에서 제외되거나, (3) 해당 **기간/기준일에 원장 행이 없음** (전기 실패·다른 월 등) 때문일 수 있음.  
- **다른 리포트(개요 탭 등)에 금액이 나오는 이유**: 개요 탭은 **FinancialTransaction** 을 직접 집계하는 `/api/v1/erp/finance/dashboard` 를 쓰기 때문에, 결제/입금 확인으로 생성된 `financial_transactions` 건만 있어도 수입·지출·카테고리별 금액이 표시됨.

---

## 5. 연동 관계

### 5.1 이론상 연동 흐름 (같은 데이터를 바라보게 하려면)

- **결제/입금 확인** → FinancialTransaction 생성 → **분개 자동 생성** (createJournalEntryFromTransaction) → **승인·전기** (approve + postJournalEntry) → **원장 갱신** (updateLedgerFromJournalEntry) → **재무제표** (원장 기간/계정별 집계).
- 즉, **같은 거래(FinancialTransaction)** 가 분개·원장을 거쳐 재무제표에 나와야 하고, 개요 탭의 수입/지출과 재무제표의 수익/비용/자산 등이 **같은 원천(거래)** 에서 나와 연동되는 구조가 맞음.

### 5.2 현재 연결 상태

- **개요 탭**: FinancialTransaction 직접 집계 → **연동 없음** (원장을 거치지 않음).  
- **대차대조표·손익계산서·현금흐름표**: 원장만 사용 → **원장이 비어 있거나 계정 분류에 걸리지 않으면 0**.  
- **연동 끊김 지점**:  
  1. **데이터 소스 이원화**: 개요 = 거래 테이블, 재무제표 = 원장 테이블.  
  2. **원장 채워짐 조건**: 분개 생성 + (REVENUE/EXPENSE/CASH 계정 ID 설정) + approve + post. 이 중 하나라도 실패하면 원장에 없음.  
  3. **재무제표 집계 조건**: 원장의 Account가 수익/비용/자산/부채/자본 등 키워드와 일치해야 함.

### 5.3 결론

- **연동되어야 한다**: 세 재무제표와 개요(및 다른 리포트)는 **같은 원천(결제/입금 확인 → 거래 → 분개 → 원장)** 을 바라보고, 개요에 보이는 수입·지출이 재무제표의 수익·비용·현금 등에 반영되는 것이 기대 동작.  
- **현재는**: 개요는 거래 직접 집계로 금액이 나오고, 재무제표는 원장만 보므로 원장 미반영 또는 계정 분류 불일치 시 0으로 나옴.

---

## 6. 수정 제안 (파일·위치 수준)

### 6.1 원인 규명 우선 (core-debugger 권장)

- 다음을 실제 환경/DB로 확인하는 것이 좋음.  
  1. **해당 테넌트·기간** 에 대해 `erp_ledgers` 에 행이 있는지.  
  2. **공통코드** `ERP_ACCOUNT_TYPE` (REVENUE, EXPENSE, CASH) 에 `extraData.accountId` 가 설정되어 있는지.  
  3. 해당 **Account** 의 `description`, `accountNumber` 에 `FinancialStatementServiceImpl` 의 키워드(수익, revenue, 비용, expense, 자산, asset 등)가 포함되는지.  
  4. 결제/입금 확인 후 **분개** 가 생성·승인·전기되는지 (`accounting_entries`, `erp_journal_entry_lines` 및 entryStatus = POSTED).  
- 이미 `AccountingServiceImpl.createJournalEntryFromTransaction()` 내부에서 approve + post 를 호출하고 있으므로, **분개는 생성되지만 전기되지 않는** 문제는 (과거 문서 대비) 완화되었을 수 있음. 대신 **계정 매핑 없음** 또는 **계정 키워드 불일치** 가 0의 주된 원인일 가능성이 큼.

### 6.2 연동 일치를 위한 수정 방향

- **방향 A (권장)**: **원장 기반 유지** — 개요와 재무제표가 “같은 원천”을 보려면, 결제/입금 확인 시 **분개 생성 → 승인 → 전기** 가 모든 경로에서 확실히 수행되고, 테넌트별 **ERP_ACCOUNT_TYPE 계정 매핑** 및 **원장에 사용되는 Account 의 description/accountNumber** 가 재무제표 계정 분류 키워드와 맞도록 맞춤.  
  - **파일**: `AccountingServiceImpl` (이미 approve+post 있음 → 실패 시 로그·원인 추가 권장), 공통코드/시딩 또는 관리 화면(계정 매핑), `Account` 데이터 또는 시딩.  
  - **FinancialStatementServiceImpl**: 계정 분류 로직이 너무 엄격하면, 공통코드 `ERP_ACCOUNT_TYPE` 에 연결된 계정은 타입으로 직접 수익/비용/자산 등으로 매핑하는 방식으로 보완 검토 (선택).  
- **방향 B (비권장)**: 재무제표 API가 원장 대신 FinancialTransaction 직접 집계 — 회계 도메인과 불일치·이중 집계 위험.  
- **API·집계·키**:  
  - **같은 키를 맞출 필요는 없음** (개요는 totalIncome/totalExpense, 재무제표는 revenue.total/expenses.total 등).  
  - **맞춰야 하는 것**: **데이터 원천** 이 동일해지도록 — 모든 수익/비용 거래가 분개 → 전기 → 원장을 타고, 재무제표는 원장만 읽도록 유지.

### 6.3 파일·위치 정리

| 구분 | 파일/위치 | 수정 방향 |
|------|-----------|-----------|
| 분개·전기 | `AccountingServiceImpl.java` (createJournalEntryFromTransaction) | 이미 approve+post 호출됨. 전기 실패 시 로그·원인 보강 권장. |
| 계정 매핑 | 공통코드 `ERP_ACCOUNT_TYPE` (REVENUE, EXPENSE, CASH) | 테넌트별 accountId(extraData) 설정 필수. 없으면 분개 미생성. |
| 계정 분류 | `FinancialStatementServiceImpl.java` (isRevenueAccount 등) | Account description/accountNumber 키워드 일치 또는 ERP_ACCOUNT_TYPE 기반 분류 보완 검토. |
| 원장 기간 | `LedgerRepository.findByTenantIdAndPeriod` | 조건: periodStart >= startDate AND periodEnd <= endDate. 기간 선택이 사용자 선택과 일치하는지 프론트(기준일/기간) 확인. |
| 프론트 | `IntegratedFinanceDashboard.js` (BalanceSheetTab, IncomeStatementTab, CashFlowStatementTab) | API 응답 구조는 이미 assets/liabilities/equity, revenue/expenses, cash flow 구조에 맞춤. 0 원인은 백엔드·원장. |

---

## 7. 분배실행 표 및 서브에이전트 호출

### Phase 0 (선택) — 추가 탐색

- **목적**: 특정 테넌트·기간에서 원장/분개/공통코드 실제 값 확인이 필요하면.  
- **담당**: **explore** 또는 **shell** (DB 쿼리/로그 확인).  
- **전달 프롬프트 요약**: “해당 테넌트에 대해 erp_ledgers 건수, ERP_ACCOUNT_TYPE 공통코드(REVENUE/EXPENSE/CASH) extraData, Account 테이블의 description/account_number 샘플을 조회해 보고, 재무제표 0 원인 후보를 정리해 주세요.”

### Phase 1 — 원인 상세·수정 제안 (core-debugger)

- **목적**: 세 재무제표가 0으로 나오는 **구체적 원인** (계정 매핑 누락/키워드 불일치/전기 실패/기간 불일치 등) 및 **수정 제안·체크리스트** 정리.  
- **담당**: **core-debugger**.  
- **전달 프롬프트 초안**:
  - “통합 재무 대시보드에서 대차대조표·손익계산서·현금흐름표 탭은 0으로 나오고, 개요 탭에는 수입·지출 금액이 나옵니다.  
  - 원인 분석해 주세요: (1) 재무제표 API는 Ledger만 사용하고, 개요는 FinancialTransaction 직접 집계임. (2) 원장은 전기(POSTED)된 분개로만 채워짐. (3) createJournalEntryFromTransaction 내부에서 approve+post 호출함.  
  - 확인할 것: 해당 테넌트의 ERP_ACCOUNT_TYPE(REVENUE, EXPENSE, CASH) 계정 ID 설정 여부, Account의 description/accountNumber가 FinancialStatementServiceImpl의 isRevenueAccount 등 키워드와 일치하는지, 해당 기간 erp_ledgers 존재 여부, 결제/입금 확인 시 분개 POSTED 여부.  
  - 산출: 원인 요약(1~2문장), 수정 제안(파일·위치·체크리스트). 코드 수정은 하지 말고 core-coder 위임용으로 정리.”

### Phase 2 — 수정 적용 (core-coder)

- **목적**: Phase 1에서 나온 수정 제안을 코드/설정에 반영.  
- **담당**: **core-coder**.  
- **전달 프롬프트 초안**:
  - “docs/planning/ERP_STATEMENTS_VS_OTHER_REPORTS_LINKAGE_PLAN.md 와 core-debugger 산출(원인·수정 제안)을 참고해, 재무제표가 0이 아닌 값이 나오도록 수정해 주세요.  
  - 반영할 수정: (1) 테넌트별 ERP_ACCOUNT_TYPE 계정 매핑 설정 또는 시딩, (2) Account description/accountNumber가 재무제표 계정 분류 키워드와 맞는지 확인·수정 또는 FinancialStatementServiceImpl 계정 분류 보완, (3) 필요 시 AccountingServiceImpl 전기 실패 시 로그/원인 보강.  
  - 표준: docs/standards/ERP_ADVANCEMENT_STANDARD.md, 멀티테넌트·tenantId 필수.”

### 실행 요청문

- **Phase 1** 을 먼저 호출하여 원인 상세·수정 제안을 받은 뒤,  
- **Phase 2** 에서 해당 제안을 반영하도록 **core-coder** 를 호출하세요.  
- Phase 0은 원인 규명을 위해 DB/로그 확인이 필요할 때만 호출하면 됩니다.

---

## 8. 리스크·제약

- **멀티테넌트**: 모든 조회·분개·원장은 tenantId 필수.  
- **기존 데이터**: 이미 생성된 FinancialTransaction 중 분개가 생성되지 않았거나 전기되지 않은 건은 과거 시점 원장에 없음. 필요 시 “원장 백필” 배치 검토는 별도 기획.  
- **일/월/년 리포트**: ErpController의 FINANCE_DAILY_REPORT 등은 ErpServiceImpl에서 FinancialTransaction 기반 집계를 사용할 수 있음. 재무제표와 수치를 맞추려면 동일하게 “원장 기반”으로 통일할지 별도 결정.

---

## 9. 단계별 완료 기준·체크리스트

| 단계 | 완료 기준 | 체크리스트 |
|------|-----------|------------|
| Phase 1 (core-debugger) | 원인과 수정 제안이 문서로 정리됨 | [ ] 원인 1~2문장 요약 [ ] ERP_ACCOUNT_TYPE·Account·erp_ledgers·분개 전기 여부 확인 결과 [ ] 수정 제안(파일·위치) [ ] core-coder용 체크리스트 |
| Phase 2 (core-coder) | 수정 반영 후 동일 테넌트·기간에서 재무제표에 금액 노출 | [ ] 계정 매핑/시딩 또는 분류 로직 반영 [ ] 동일 결제/입금 데이터로 개요와 재무제표 수치 일치 여부 확인 [ ] 표준·테넌트 준수 |

---

**문서 끝.**

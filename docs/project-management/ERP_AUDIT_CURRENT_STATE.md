# ERP 시스템 전체 현황 보고서 (Phase 1 산출물)

**작성일**: 2026-03-04  
**참조**: docs/project-management/ERP_COMPREHENSIVE_AUDIT_PLAN.md  
**목적**: §2.1 표 및 §5.1~5.3 체크리스트를 채운 현황 문서. 코드 수정 없음.

---

## 1. §2.1 현재 ERP 기능 목록

| 기능 영역 | 설명 | 백엔드(컨트롤러/서비스) | 프론트(라우트/컴포넌트) | PL/SQL 연동 | 자동화 여부 |
|-----------|------|-------------------------|--------------------------|-------------|-------------|
| 구매 관리 | 구매 요청·승인·아이템·발주 | **ErpController** (`/api/v1/erp`): items, purchase-requests, purchase-orders. **ErpServiceImpl**, ItemRepository, PurchaseRequestRepository, PurchaseOrderRepository (ERP 전용) | `/erp/purchase`, `/erp/purchase-requests`, `/erp/items`, `/erp/approvals`, `/erp/super-approvals`, `/erp/orders` (ComingSoon). PurchaseManagement, PurchaseRequestForm, ItemManagement, AdminApprovalDashboard, SuperAdminApprovalDashboard | item_management_procedures.sql (CreateItem, UpdateItemStock, CreatePurchaseRequest, ApprovePurchaseRequest 등) — Java 호출부 미확인 | **수동** (화면/API 트리거) |
| 재무 관리 | 거래·대시보드·리포트 | **ErpController**: /finance/dashboard, /finance/transactions, /finance/balance-sheet, /finance/income-statement, /finance/daily-report, /finance/monthly-report, /finance/yearly-report. **FinancialTransactionService**, ErpServiceImpl | `/erp/financial`, `/erp/finance-dashboard`, `/admin/erp/financial`. FinancialManagement, IntegratedFinanceDashboard | PlSqlFinancialServiceImpl: GetBranchFinancialBreakdown, GetMonthlyFinancialTrend, GetCategoryFinancialBreakdown, GenerateQuarterlyFinancialReport, CalculateFinancialKPIs. PlSqlAccountingServiceImpl: GetConsolidatedFinancialData, GenerateFinancialReport | **일부 자동**: 일별 통계(UpdateAllBranchDailyStatistics) 스케줄. 나머지 재무 조회/리포트는 **수동** |
| 대차대조표 | 재무상태표 | **FinancialStatementController** (`/api/v1/erp/accounting/statements/balance`). **FinancialStatementServiceImpl** → LedgerService (JPA 원장 기반) | IntegratedFinanceDashboard 내 tab/API. api.js: FINANCE_BALANCE_SHEET | 없음 (Java 원장 집계) | **수동** |
| 손익계산서 | 손익계산서 | **FinancialStatementController** (`/api/v1/erp/accounting/statements/income`). **FinancialStatementServiceImpl** → LedgerService | 동일. api.js: FINANCE_INCOME_STATEMENT | 없음 (Java 원장 집계) | **수동** |
| 예산 | 예산 관리 | **ErpController**: /budgets, /budgets/year, /budgets/category, /budgets/high-usage, /budgets/over-budget. **ErpServiceImpl**, BudgetRepository | `/erp/budget`, `/erp/budgets`. BudgetManagement | budget_management_procedures.sql (CreateBudget, TrackBudgetUsage, CheckBudgetOverrun, GetBudgetStatistics, UpdateBudget) — Java 호출부 미확인 | **수동** |
| 급여 | 급여 계산·배치 | **SalaryBatchController** (`/api/v1/admin/salary-batch`), **SalaryConfigController** (execute-batch). **SalaryBatchServiceImpl** → PlSqlSalaryManagementService. **SalaryBatchScheduler** @Scheduled | `/erp/salary`. SalaryManagement | ProcessIntegratedSalaryCalculation, ApproveSalaryWithErpSync, ProcessSalaryPaymentWithErpSync, GetIntegratedSalaryStatistics, CalculateSalaryPreview, ProcessMonthlySalaryBatch (SP 존재) | **자동**: SalaryBatchScheduler (cron: 0 0 2 * * ?, 매일 02:00) + 모니터링(매시). **수동**: API execute-batch |
| 세금 | 세무 관리 | **ErpController** (공용 common-codes, finance 연동). TaxCalculationUtil 등 | `/erp/tax`. ImprovedTaxManagement, TaxManagement | 없음 (Java 로직) | **수동** |
| 환불 | 환불·할인 환불 | **PlSqlDiscountAccountingController** (apply-discount-accounting, process-discount-refund, update-discount-status). **DiscountAccountingController**. **PlSqlMappingSyncServiceImpl**: ProcessRefundWithSessionAdjustment, ProcessPartialRefund, GetRefundableSessions, GetRefundStatistics | `/erp/refund-management`. RefundManagement | ApplyDiscountAccounting, ProcessDiscountRefund, UpdateDiscountStatus, GetDiscountStatistics, ValidateDiscountIntegrity (PlSqlDiscountAccountingServiceImpl). ProcessRefundWithSessionAdjustment, ProcessPartialRefund, GetRefundableSessions, GetRefundStatistics (PlSqlMappingSyncServiceImpl) | **수동** (API/화면 트리거) |
| 원장/분개 | 분개·원장·잔액 | **AccountingController** (`/api/v1/erp/accounting/entries`): CRUD, approve, post. **LedgerController** (`/api/v1/erp/accounting/ledgers`): account, period, balance. **AccountingServiceImpl**, **LedgerServiceImpl** → AccountingEntryRepository, JournalEntryLineRepository, LedgerRepository (JPA) | IntegratedFinanceDashboard tab: journal-entries, ledgers. api.js: JOURNAL_ENTRIES, LEDGERS_* | 원장/분개 직접 SP 없음. 집계·통계용 SP는 별도(GetBranchFinancialBreakdown 등) | **수동**. 원장 동기화 전용 스케줄 없음 |
| 정산 | 정산 규칙·계산·승인 | **SettlementController** (`/api/v1/erp/settlement`): rules, calculate, results, approve. **SettlementServiceImpl**, SettlementRepository, SettlementRuleRepository, FinancialTransactionRepository | IntegratedFinanceDashboard tab: settlement. api.js: SETTLEMENT_* | 없음 (Java 비즈니스 로직) | **수동** |
| HQ/지점 재무 | 본사·지점 통합 재무 | **HQErpController** (`/api/v1/hq/erp`): branch-financial, consolidated, reports. **PlSqlFinancialService**, FinancialTransactionService | `/admin/erp/financial` (통합 대시). AdminDashboard 카드 → /admin/erp/financial | GetBranchFinancialBreakdown, GetMonthlyFinancialTrend, GetConsolidatedFinancialData(PlSqlFinancialServiceImpl 직접 SQL 대체 가능), GenerateQuarterlyFinancialReport, CalculateFinancialKPIs | **수동** |

### ERP 전용 vs 공용 구분

- **ERP 전용**: `controller/erp/*` (ErpController, AccountingController, LedgerController, FinancialStatementController, SettlementController), `service/erp/*`, `repository/erp/*` (financial, accounting, settlement), PlSqlAccountingController, PlSqlDiscountAccountingController, DiscountAccountingController, HQErpController.
- **공용**: TenantContextHolder, SessionUtils, DynamicPermissionService, CommonCodeService, BaseApiController, JdbcTemplate/DataSource (SP 호출 공용).

---

## 2. 백엔드 상세 (§2.2)

### 2.1 컨트롤러·엔드포인트

| 컨트롤러 | Base Path | 주요 엔드포인트 | tenantId 사용 |
|----------|-----------|-----------------|----------------|
| ErpController | /api/v1/erp | items, purchase-requests, purchase-orders, budgets, finance/*, recurring-expenses, common-codes/financial | 세션/테넌트 컨텍스트 |
| AccountingController | /api/v1/erp/accounting/entries | POST/GET/PUT, /{id}/approve, /{id}/post | TenantContextHolder |
| LedgerController | /api/v1/erp/accounting/ledgers | /account/{accountId}, /period, /balance/{accountId} | TenantContextHolder |
| FinancialStatementController | /api/v1/erp/accounting/statements | /income, /balance, /cash-flow | TenantContextHolder |
| SettlementController | /api/v1/erp/settlement | /rules, /calculate, /results, /results/{id}/approve | TenantContextHolder |
| HQErpController | /api/v1/hq/erp | /branch-financial, /consolidated, /reports | 세션 사용자 권한(HQ_FINANCIAL_MANAGE) |
| PlSqlAccountingController | (admin/plsql 경로 추정) | validate-integrated-amount, consolidated-financial, process-discount-accounting, generate-financial-report 등 | TenantContextHolder |
| PlSqlDiscountAccountingController | (admin/plsql 경로 추정) | apply-discount-accounting, process-discount-refund, update-discount-status, get-discount-statistics, validate-discount-integrity | TenantContextHolder |
| DiscountAccountingController | (erp/accounting/discount 추정) | get, validate, cancel, update | TenantContextHolder |
| SalaryBatchController | /api/v1/admin/salary-batch | execute, execute-current-month, status | TenantContextHolder(배치 시 테넌트 순회) |

### 2.2 서비스 (ERP 관련)

- **ERP 전용**: ErpService(Impl), FinancialStatementService(Impl), AccountingService(Impl), LedgerService(Impl), SettlementService(Impl), FinancialTransactionService(Impl), PlSqlAccountingService(Impl), PlSqlDiscountAccountingService(Impl), PlSqlFinancialService(Impl), PlSqlSalaryManagementService(Impl), SalaryBatchService(Impl), DiscountAccountingService(Impl).
- **공용/혼합**: PlSqlStatisticsService(Impl), PlSqlMappingSyncServiceImpl, ErpDiscountIntegrationServiceImpl, StoredProcedureServiceImpl(업무시간/CheckTimeConflict/UpdateMappingInfo).

### 2.3 엔티티·Repository (ERP)

- **엔티티**: FinancialTransaction, Ledger, AccountingEntry(JournalEntryLine), Budget, Item, PurchaseRequest, PurchaseOrder, Settlement 관련 엔티티, SalaryCalculation 등.
- **Repository**: FinancialTransactionRepository, LedgerRepository, AccountingEntryRepository, JournalEntryLineRepository, SettlementRepository, SettlementRuleRepository, BudgetRepository, ItemRepository, PurchaseRequestRepository, PurchaseOrderRepository, SalaryCalculationRepository (모두 erp 하위 또는 ERP 도메인 전용).

---

## 3. 프론트엔드 상세 (§2.3)

### 3.1 라우트 (/erp/*, /admin/erp/*)

| 라우트 | 컴포넌트 | 비고 |
|--------|----------|------|
| /erp/purchase | PurchaseManagement | 구매 관리 |
| /erp/financial | FinancialManagement | 재무 관리 |
| /erp/budget | BudgetManagement | 예산 |
| /erp/tax | ImprovedTaxManagement | 세무 |
| /erp/dashboard | ErpDashboard | ERP 대시보드 |
| /erp/purchase-requests | PurchaseRequestForm | 구매 요청 |
| /erp/refund-management | RefundManagement | 환불 |
| /erp/approvals | AdminApprovalDashboard | 승인 |
| /erp/super-approvals | SuperAdminApprovalDashboard | 슈퍼승인 |
| /erp/items | ItemManagement | 품목 |
| /erp/budgets | BudgetManagement | 예산(중복 라우트) |
| /erp/salary | SalaryManagement | 급여 |
| /erp/tax | TaxManagement | 세무(중복) |
| /erp/orders | ComingSoon | 주문 관리 예정 |
| /admin/erp/dashboard | Navigate → /erp/dashboard | 리다이렉트 |
| /admin/erp/purchase | Navigate → /erp/purchase-requests | 리다이렉트 |
| /admin/erp/financial | IntegratedFinanceDashboard | 통합 재무(분개/원장/정산/캐시플로우 탭) |
| /admin/erp/budget | Navigate → /erp/budget | 리다이렉트 |
| /admin/erp/reports | ComingSoon | ERP 보고서 예정 |

### 3.2 메뉴·위젯

- **ERP_MENU_ITEMS** (menuItems.js): /erp/dashboard, /erp/purchase, /erp/financial, /erp/budget, /erp/tax.
- **AdminDashboard ERP 카드**: /erp/dashboard, /erp/purchase-requests, /erp/approvals, /erp/super-approvals, /erp/items, /erp/budgets, /erp/orders, /erp/salary, /erp/tax, /admin/erp/financial, /erp/refund-management, journal-entries/ledgers/settlement/cash-flow (쿼리 탭).
- **위젯**: ErpStatsGridWidget (`/api/v1/erp/dashboard/statistics`), ErpManagementGridWidget, PurchaseRequestWidget, ErpPurchaseRequestWidget.

---

## 4. PL/SQL 현황 (§2.4, §5.2)

### 4.1 ERP/재무/원장/정산/할인/환불 관련 SP·함수 목록

| SP/함수명 | 용도 | 호출 위치 (Java) |
|-----------|------|------------------|
| ApplyDiscountAccounting | 할인 회계 적용 | PlSqlDiscountAccountingServiceImpl (StoredProcedure 래퍼) |
| ProcessDiscountRefund | 할인 환불 처리 | PlSqlDiscountAccountingServiceImpl |
| UpdateDiscountStatus | 할인 상태 변경 | PlSqlDiscountAccountingServiceImpl |
| GetDiscountStatistics | 할인 통계 | PlSqlDiscountAccountingServiceImpl |
| ValidateDiscountIntegrity | 할인 무결성 검증 | PlSqlDiscountAccountingServiceImpl |
| ValidateIntegratedAmount | 통합 금액 검증 | PlSqlAccountingServiceImpl |
| GetConsolidatedFinancialData | 전사 통합 재무 | PlSqlAccountingServiceImpl |
| ProcessDiscountAccounting | 할인 회계 처리(통합) | PlSqlAccountingServiceImpl |
| GenerateFinancialReport | 재무 보고서 생성 | PlSqlAccountingServiceImpl |
| GetBranchFinancialBreakdown | 지점별 재무 | PlSqlFinancialServiceImpl |
| GetMonthlyFinancialTrend | 월별 재무 추이 | PlSqlFinancialServiceImpl |
| GetCategoryFinancialBreakdown | 카테고리별 재무 | PlSqlFinancialServiceImpl |
| GenerateQuarterlyFinancialReport | 분기 재무 보고서 | PlSqlFinancialServiceImpl |
| CalculateFinancialKPIs | 재무 KPI | PlSqlFinancialServiceImpl |
| ProcessIntegratedSalaryCalculation | 통합 급여 계산 | PlSqlSalaryManagementServiceImpl |
| ApproveSalaryWithErpSync | 급여 승인+ERP 동기화 | PlSqlSalaryManagementServiceImpl |
| ProcessSalaryPaymentWithErpSync | 급여 지급+ERP 동기화 | PlSqlSalaryManagementServiceImpl |
| GetIntegratedSalaryStatistics | 통합 급여 통계 | PlSqlSalaryManagementServiceImpl |
| CalculateSalaryPreview | 급여 예측 | PlSqlSalaryManagementServiceImpl |
| ProcessRefundWithSessionAdjustment | 환불+세션 조정 | PlSqlMappingSyncServiceImpl |
| ProcessPartialRefund | 부분 환불 | PlSqlMappingSyncServiceImpl |
| GetRefundableSessions | 환불 가능 세션 | PlSqlMappingSyncServiceImpl |
| GetRefundStatistics | 환불 통계 | PlSqlMappingSyncServiceImpl |
| UseSessionForMapping | 매핑에 세션 사용 | PlSqlMappingSyncServiceImpl |
| AddSessionsToMapping | 매핑에 세션 추가 | PlSqlMappingSyncServiceImpl |
| ValidateMappingIntegrity | 매핑 무결성 | PlSqlMappingSyncServiceImpl |
| SyncAllMappings | 매핑 일괄 동기화 | PlSqlMappingSyncServiceImpl |
| UpdateMappingInfo | 매핑 정보 갱신 | StoredProcedureServiceImpl |
| UpdateDailyStatistics | 일별 통계 | PlSqlStatisticsServiceImpl (SimpleJdbcCall) |
| UpdateAllBranchDailyStatistics | 전 지점 일별 통계 | PlSqlStatisticsServiceImpl |
| UpdateConsultantPerformance | 상담사 성과 | PlSqlStatisticsServiceImpl |
| UpdateAllConsultantPerformance | 전 상담사 성과 | PlSqlStatisticsServiceImpl |
| DailyPerformanceMonitoring | 일일 성과 모니터링 | PlSqlStatisticsServiceImpl |
| ProcessOnboardingApproval | 온보딩 승인 | OnboardingApprovalServiceImpl |
| GetBusinessTimeSettings | 업무시간 설정 | StoredProcedureServiceImpl |
| UpdateBusinessTimeSetting | 업무시간 변경 | StoredProcedureServiceImpl |
| CheckTimeConflict | 시간 충돌 검사 | StoredProcedureServiceImpl |

**Flyway**: ProcessOnboardingApproval, CreateOrActivateTenant, SetupTenantCategoryMapping 등 온보딩/테넌트 SP. ERP 재무/할인/환불/급여 SP는 `src/main/resources/sql/procedures/`, `database/schema/procedures_standardized/`, `database/procedures/` 등에 스크립트 존재, Flyway 마이그레이션에는 제한적 반영.

### 4.2 호출 방식 요약

- **JdbcTemplate + CallableStatement**: PlSqlAccountingServiceImpl, PlSqlSalaryManagementServiceImpl, PlSqlDiscountAccountingServiceImpl(내부 StoredProcedure), OnboardingApprovalServiceImpl, StoredProcedureServiceImpl.
- **SimpleJdbcCall**: PlSqlStatisticsServiceImpl, PlSqlScheduleValidationServiceImpl, PlSqlConsultationRecordAlertServiceImpl.
- **JdbcTemplate.execute + prepareCall**: PlSqlFinancialServiceImpl, PlSqlMappingSyncServiceImpl(CALL 문자열).

---

## 5. 자동화 현황 (§2.5, §5.3)

### 5.1 자동 실행 작업 목록

| 구현체 | 주기/설정 | 작업 내용 |
|--------|-----------|-----------|
| StatisticsSchedulerServiceImpl.scheduleDailyStatisticsUpdate | 0 1 0 * * * (매일 00:01) | 일별 통계: UpdateAllBranchDailyStatistics 호출 |
| StatisticsSchedulerServiceImpl.scheduleConsultantPerformanceUpdate | 0 3 0 * * * (매일 00:03) | 상담사 성과: UpdateAllConsultantPerformance |
| StatisticsSchedulerServiceImpl.schedulePerformanceMonitoring | 0 5 0 * * * (매일 00:05) | DailyPerformanceMonitoring |
| SalaryBatchScheduler.checkAndExecuteSalaryBatch | 0 0 2 * * ? (매일 02:00) | 급여 배치: executeMonthlySalaryBatch(이전 달) |
| SalaryBatchScheduler (모니터링) | 0 0 * * * ? (매시) | 급여 배치 미완료 경고 |
| SchemaChangeDetectionScheduler | 0 0 2 * * ? / fixedDelay | 스키마 변경 감지 |
| StatisticsGenerationScheduler | 0 1 0 * * * / 매시 | 통계 생성 |
| SessionCleanupScheduler | 0 */5 * * * * (5분), 매시 | 세션 정리 |
| WellnessNotificationScheduler | 0 0 9 * * ? | 웰니스 알림 |
| SubscriptionSchedulerConfig | 0 0 2 * * ? | 구독 처리 |
| BankTransferServiceImpl | fixedRate 5분 | 입금 확인 등 |
| AnomalyDetectionService | fixedRate 5분 | 이상 탐지 |
| MetricCollectionService | fixedRate 1분 | 메트릭 수집 |
| WorkflowAutomationServiceImpl | 10분/매시/매일 18시/매월 1일 9시 | 워크플로 자동화 |

### 5.2 수동만 있는 작업 (자동화 갭)

| 작업 | 현재 | 비고 |
|------|------|------|
| 정기 일/주/월 마감(재무) | 수동 | 일별 통계만 자동, 주/월 마감 전용 스케줄 없음 |
| 원장 동기화 | 수동 | 원장/분개는 JPA 기반, "원장 동기화" 전용 배치 없음 |
| 재무제표 생성 | 수동 | API/화면 요청 시 FinancialStatementServiceImpl에서 생성 |
| 정산 배치 | 수동 | SettlementController 규칙/계산/승인만 API |
| 급여 배치 | 자동+수동 | 스케줄러(매일 02:00) + API execute-batch |
| 재무 보고서(일/월/년) 생성 | 수동 | ErpController /finance/*-report API 호출 시에만 |
| 할인/환불 처리 | 수동 | PlSqlDiscountAccounting / MappingSync API 트리거 |

---

## 6. §5.1~5.3 체크리스트 현황

### 5.1 기능·백엔드·프론트

- **기능 목록**: §2.1 표에 구매/재무/대차대조표/손익계산서/예산/급여/세금/환불/원장/정산/HQ 재무 기입 완료.
- **백엔드**: ERP 관련 컨트롤러·서비스·엔티티·Repository 목록 정리됨. ERP 전용 vs 공용 구분 반영.
- **프론트**: ERP 라우트(/erp/*, /admin/erp/*), LNB(ERP_MENU_ITEMS), 컴포넌트, 위젯 진입점 정리됨.
- **테넌트**: ERP API·서비스에서 TenantContextHolder.getRequiredTenantId() 또는 세션 기반 tenantId 사용 확인됨.

### 5.2 PL/SQL

- **SP/함수 목록**: 재무·집계·원장·정산·보고서·할인·환불·온보딩·매칭 관련 프로시저 목록 및 용도 정리됨.
- **호출 위치**: Java 호출 방식(JdbcTemplate/CallableStatement/SimpleJdbcCall) 및 클래스·메서드 매핑 반영.
- **트랜잭션·에러·로깅**: SP·Java 양쪽 상세는 Phase 2에서 정리 권장(현재는 호출 위치 위주).
- **표준화**: 네이밍·파라미터·반환 형식 일관성은 Phase 2 문서에서 평가 예정.

### 5.3 자동화

- **자동 실행 목록**: @Scheduled, cron 기반 스케줄러 목록 정리됨(Quartz/DB job/MySQL Event는 미사용).
- **수동만 있는 작업**: 정기 마감·원장 동기화·재무제표 생성·정산·(일부)재무 리포트 등 수동 작업 구분됨.
- **갭 분석**: "전부 자동화" 시 추가 대상(주/월 마감, 원장 동기화, 재무제표/정산 배치 등)은 Phase 3 문서에서 우선순위·계획 정리 예정.

# ERP 테넌트 격리 및 초기화

## 개요

ERP 데이터는 **테넌트별로 독립적으로 생성·운영**된다. 어드민처럼 테넌트 A와 테넌트 B의 ERP 데이터는 완전히 격리된다.

## 원칙

- **테넌트별 독립**: 테넌트마다 각각 ERP 계정(accounts), 공통코드(ERP_ACCOUNT_TYPE), 원장(erp_ledgers), 분개(accounting_entries), 금융거래(financial_transactions)가 생성·관리됨
- **tenant_id 필수**: 모든 ERP 관련 조회·저장에는 `tenant_id` 조건이 반드시 포함됨
- **cross-tenant 금지**: 다른 테넌트의 데이터 조회·수정 금지

## 테넌트 생성 시 ERP 자동 초기화

### 흐름

1. 온보딩 승인 후 `OnboardingServiceImpl.initializeTenantAfterOnboardingInNewTransaction()` 호출
2. 초기화 단계 (순서):
   - 1단계: 공통코드 삽입 (commonCodes)
   - 2단계: 역할 코드 생성 (roleCodes)
   - 3단계: 권한 그룹 할당 (permissionGroups)
   - **4단계: ERP 계정 매핑 시딩 (erpAccounts)** ← 추가됨
3. 4단계에서 `AccountingService.ensureErpAccountMappingForTenant(tenantId)` 호출
4. `statusMap`에 `erpAccounts` 상태 저장 (SUCCESS/FAILED)
5. 실패 시에도 다른 초기화는 계속 진행 (`noRollbackFor = Exception.class`)

### ensureErpAccountMappingForTenant 동작

- 테넌트별 ERP_ACCOUNT_TYPE(REVENUE, EXPENSE, CASH) 공통코드 및 계정 매핑이 없으면 생성
- 이미 있으면 스킵 (idempotent)
- accounts 테이블에 ERP 가상 계정 3개 생성: ERP-REVENUE, ERP-EXPENSE, ERP-CASH
- common_codes 테이블에 ERP_ACCOUNT_TYPE 그룹 코드 및 extraData(accountId) 저장

## 기존 테넌트용 ERP 수동 초기화 API

- **엔드포인트**: `POST /api/v1/erp/accounting/init-tenant-erp`
- **권한**: 관리자 전용
- **동작**: `TenantContextHolder.getRequiredTenantId()` 기준으로 `ensureErpAccountMappingForTenant` 호출
- **결과**: 이미 있으면 스킵, 없으면 생성 후 `{ "success": true, "message": "..." }` 반환

## ERP 격리 검증

### Repository (tenant_id 포함)

| Repository | tenant_id 포함 메서드 | 비고 |
|------------|-----------------------|------|
| LedgerRepository | findByTenantIdAndAccountId, findByTenantIdAndPeriod, findByTenantIdAndAccountIdAndPeriod, findLatestByTenantIdAndAccountId | 모든 조회에 tenantId 필수 |
| FinancialTransactionRepository | findByTenantId*, sumIncomeByDateRange, sumExpenseByDateRange 등 | tenantId 없는 메서드는 @Deprecated |
| AccountRepository | findByTenantIdAnd*, searchAccountsByTenantId, count*ByTenantId | tenantId 없는 메서드는 @Deprecated |
| AccountingEntryRepository | findByTenantId, findByTenantIdAndId, findByTenantIdAndFinancialTransactionId 등 | 모든 조회에 tenantId 필수 |

### Service (tenantId 파라미터 필수)

| Service | 검증 방식 | 비고 |
|---------|-----------|------|
| FinancialStatementService | generateIncomeStatement(tenantId, ...), generateBalanceSheet(tenantId, ...), generateCashFlowStatement(tenantId, ...) | TenantIsolationValidator.requireTenantIdMatch(tenantId) |
| LedgerService | updateLedgerFromJournalEntry(tenantId, ...), getLedgersByAccount(tenantId, ...), getLedgersByPeriod(tenantId, ...), getAccountBalance(tenantId, ...) | tenantId 필수, 계정 조회 시 테넌트 검증 |
| AccountingService | createJournalEntry(tenantId, ...), approveJournalEntry(tenantId, ...), postJournalEntry(tenantId, ...) 등 | TenantIsolationValidator.requireTenantIdMatch(tenantId) |

### JPA Entity

- `accounts`, `accounting_entries`, `erp_ledgers`, `financial_transactions` 등 모든 ERP 엔티티에 `tenant_id` 컬럼 존재
- BaseEntity 또는 필드로 tenantId 보유

## 참고 문서

- `docs/standards/ERP_ADVANCEMENT_STANDARD.md` — ERP 표준
- `.cursor/skills/core-solution-multi-tenant/SKILL.md` — 멀티테넌트 원칙

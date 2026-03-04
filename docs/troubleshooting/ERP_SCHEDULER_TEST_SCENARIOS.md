# ErpAutomationScheduler 검증 시나리오 및 체크리스트

**작성일**: 2025-03-04  
**대상**: `ErpAutomationScheduler` (Phase 3 자동화)  
**참조**: `docs/project-management/ERP_AUTOMATION_GAP_AND_PLAN.md`, `docs/standards/TESTING_STANDARD.md`

---

## 1. 스케줄러 개요

- **클래스**: `com.coresolution.consultation.scheduler.ErpAutomationScheduler`
- **활성화**: `scheduler.erp-automation.enabled=true` (기본 true)
- **동작**: 모든 활성 테넌트 ID를 조회한 뒤, 테넌트별로 `TenantContextHolder.setTenantId(tenantId)` 설정 후 각 작업 실행

| 작업명 | 메서드 | Cron (기본) | 검증 포인트 |
|--------|--------|-------------|-------------|
| 일 마감 | scheduleDailyFinancialClose | 0 10 0 * * * (매일 00:10) | ErpFinancialCloseService.performDailyClose 호출, tenantId 설정 |
| 월 마감 | scheduleMonthlyFinancialClose | 0 20 0 1 * * (매월 1일 00:20) | performMonthlyClose, tenantId |
| 재무제표 생성 | scheduleFinancialStatementGeneration | 0 25 0 1 * * (매월 1일 00:25) | generateBalanceSheet, generateIncomeStatement, generateCashFlowStatement |
| 일보 생성 | scheduleDailyReportGeneration | 0 5 1 * * * (매일 01:05) | getDailyFinanceReport |
| 월보 생성 | scheduleMonthlyReportGeneration | 0 10 0 1 * * (매월 1일 00:10) | getMonthlyFinanceReport |
| 연보 생성 | scheduleYearlyReportGeneration | 0 15 0 1 1 * (매년 1월 1일 00:15) | getYearlyFinanceReport |
| 주 마감 | scheduleWeeklyFinancialClose | 0 15 0 * * MON (매주 월 00:15) | performWeeklyClose |
| 정산 배치 | scheduleSettlementBatch | 0 0 3 1 * * (매월 1일 03:00) | SettlementService.calculateSettlement |
| 원장 동기화 | scheduleLedgerSync | 0 30 0 * * * (매일 00:30) | 로그 스텁 확인 |
| 통합 재무 갱신 | scheduleConsolidatedFinancialRefresh | 0 0 4 * * * (매일 04:00) | PlSqlFinancialService 호출 |
| 매핑 동기화 | scheduleMappingSync | 0 0 1 * * * (매일 01:00) | PlSqlMappingSyncService.syncAllMappings |

---

## 2. 검증 시나리오 (core-tester 제안)

### 2.1 단위 테스트 제안 (core-coder 구현 권장)

- **ErpAutomationScheduler 단위 테스트**
  - `TenantService.getAllActiveTenantIds()` Mock → 반환 테넌트 목록 지정
  - 각 스케줄 메서드 호출 시 `TenantContextHolder.setTenantId`가 각 tenantId로 호출되는지 검증
  - 예외 발생 시 해당 테넌트만 실패하고 다음 테넌트는 실행되는지(루프 계속) 검증

### 2.2 수동/통합 검증 체크리스트

- [ ] **설정**: `scheduler.erp-automation.enabled=true` 인 경우에만 빈이 로드되는지 확인 (`@ConditionalOnProperty`)
- [ ] **테넌트 순회**: 활성 테넌트가 0개여도 NPE 없이 로그만 남고 종료하는지
- [ ] **tenantId 설정**: 각 작업 실행 시 해당 테넌트 ID가 컨텍스트에 설정되어, 재무제표/정산 등이 올바른 테넌트 데이터만 조회하는지
- [ ] **재무제표 생성**: `scheduleFinancialStatementGeneration` 실행 시(또는 수동 호출 시) `FinancialStatementServiceImpl`이 호출되고, 예외 시 로그만 남기고 다음 테넌트로 진행하는지
- [ ] **정산 배치**: 이미 정산된 기간은 `IllegalStateException("이미 정산이 생성된 기간")` 등으로 스킵되고 로그만 남는지

### 2.3 수동 트리거 (개발 서버)

- 스케줄러는 cron 기반이므로 즉시 실행하려면:
  - **옵션 A**: 해당 메서드를 노출하는 관리용 API(예: `/api/v1/admin/erp/trigger-daily-close`)를 core-coder가 구현한 뒤, 개발 서버에서 호출.
  - **옵션 B**: 테스트 코드에서 `ErpAutomationScheduler` 빈을 주입받아 `scheduleFinancialStatementGeneration()` 등을 직접 호출 (통합 테스트).
- core-tester는 **시나리오·체크리스트만 제안**하며, 실제 트리거 API 또는 통합 테스트 구현은 **core-coder**에 위임.

---

## 3. 실패 시 수정 제안 방향

| 현상 | 수정 제안 |
|------|-----------|
| 특정 테넌트에서 예외 발생 시 전체 중단 | 해당 테넌트만 try-catch 후 로그 남기고 다음 테넌트 계속 (이미 구현됨) |
| tenantId가 null로 서비스에 전달 | `runPerTenant` 내에서 `TenantContextHolder.setTenantId(tenantId)` 호출 직후 runnable 실행 여부 확인 |
| 재무제표 생성 시 0만 반환 | 원장/분개 데이터 부족. 테스트 데이터 가이드 참고 (`docs/troubleshooting/ERP_DEV_TEST_DATA_GUIDE.md`) |

---

## 4. 참조

- `src/main/java/com/coresolution/consultation/scheduler/ErpAutomationScheduler.java`
- `docs/project-management/ERP_COMPREHENSIVE_AUDIT_PLAN.md` §9.3(3-3)

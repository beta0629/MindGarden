# ERP PL/SQL 구조 및 표준화 점검 (Phase 2 산출물)

**작성일**: 2026-03-04  
**참조**: docs/project-management/ERP_COMPREHENSIVE_AUDIT_PLAN.md Phase 2, docs/project-management/ERP_AUDIT_CURRENT_STATE.md  
**목적**: ERP 관련 저장 프로시저·함수 목록, Java 호출 맵, 트랜잭션/에러/로깅 요약, 표준화 갭 및 개선 제안. 코드 수정 없음.

---

## 1. ERP 관련 SP/함수 개요

- **표준화된 프로시저**: procedures_standardized / deployment 스키마 — p_tenant_id 1번째 또는 IN 내 포함, OUT p_success BOOLEAN, p_message TEXT.
- **호출 방식**: JdbcTemplate+CallableStatement(PlSqlAccountingServiceImpl, PlSqlSalaryManagementServiceImpl, PlSqlDiscountAccountingServiceImpl, OnboardingApprovalServiceImpl, StoredProcedureServiceImpl), SimpleJdbcCall(PlSqlStatisticsServiceImpl 등), JdbcTemplate.execute+prepareCall(PlSqlFinancialServiceImpl, PlSqlMappingSyncServiceImpl).

---

## 2. 표준화 평가 기준

- **네이밍**: PascalCase 프로시저명, p_ 접두어 파라미터.
- **파라미터 순서**: IN 최우선에 p_tenant_id 또는 비즈니스 식별자 후 p_tenant_id.
- **반환 형식**: 최소 OUT p_success BOOLEAN, p_message TEXT. 조회/리포트는 추가로 JSON 또는 수치 OUT.
- **트랜잭션**: SP 내부는 START TRANSACTION, EXIT HANDLER에서 ROLLBACK 및 OUT 설정.

---

## 3. 표준 준수 SP (요약)

- 재무: GetBranchFinancialBreakdown, GetMonthlyFinancialTrend, GetCategoryFinancialBreakdown, GenerateQuarterlyFinancialReport, CalculateFinancialKPIs, GetConsolidatedFinancialData, ValidateIntegratedAmount, ProcessDiscountAccounting, GenerateFinancialReport.
- 할인/환불: ApplyDiscountAccounting, ProcessDiscountRefund, UpdateDiscountStatus, GetDiscountStatistics, ValidateDiscountIntegrity(호출부 branchCode→tenantId 전환 권장).
- 급여: ProcessIntegratedSalaryCalculation, ApproveSalaryWithErpSync, ProcessSalaryPaymentWithErpSync, GetIntegratedSalaryStatistics, CalculateSalaryPreview.
- 매핑/환불: ProcessRefundWithSessionAdjustment, ProcessPartialRefund, GetRefundableSessions, GetRefundStatistics, UseSessionForMapping, AddSessionsToMapping, ValidateMappingIntegrity, SyncAllMappings.
- 통계: UpdateDailyStatistics, UpdateConsultantPerformance, DailyPerformanceMonitoring(표준화 버전, p_tenant_id + p_success/p_message).

---

## 4. 표준 미준수 목록 및 갭

| SP/리소스 | 미준수 내용 |
|-----------|-------------|
| GetConsolidatedFinancialData (migrations/consolidated_financial_procedures.sql) | tenant_id 없음, p_success/p_message 없음, ResultSet/OUT만 수치 |
| GetBranchFinancialBreakdown / GetMonthlyFinancialTrend / GetCategoryFinancialBreakdown (migrations) | tenant_id 없음, OUT 없음, ResultSet만 반환 |
| ApplyDiscountAccounting, ProcessDiscountRefund (discount_accounting_procedures_fixed.sql) | tenant_id 없음, 반환 형식이 p_result_code INT + p_result_message |
| UpdateDailyStatistics, UpdateAllBranchDailyStatistics, UpdateConsultantPerformance (create_plsql_procedures.sql) | tenant_id 없음, OUT 없음, 내부 COMMIT만 |
| UpdateMappingInfo (mapping_update_procedures_mysql_no_delimiter.sql) | **tenant_id 없음** (Java는 5번째 IN으로 tenantId 전달 → 스키마와 불일치 가능) |
| GetBusinessTimeSettings | 파라미터 없음, ResultSet만(공용 설정) |
| UpdateBusinessTimeSetting | 성공/실패 OUT 없음 |
| CheckTimeConflict | 배포 버전에 따라 7/8 파라미터 혼재, tenant_id 선택적 |
| UpdateAllBranchDailyStatistics (실제 배포) | p_stat_date만 IN, tenant_id 없음 |
| UpdateAllConsultantPerformance | p_performance_date만 IN, tenant_id 없음 |

---

## 5. 표준화 갭 및 개선 제안

### 5.1 tenantId 일원화

- 모든 ERP/재무/할인/환불/매핑/통계 SP의 첫 번째 IN 또는 고정 위치에 p_tenant_id VARCHAR(100) 추가.
- 레거시 스키마(consolidated_financial_procedures.sql, create_plsql_procedures.sql 등)는 표준화 버전으로 교체하거나 Flyway로 표준화 버전만 배포하도록 통일.

### 5.2 우선순위 제안

1. **높음**: UpdateMappingInfo에 p_tenant_id 반영 및 Java 시그니처와 배포 스키마 일치.
2. **높음**: UpdateAllBranchDailyStatistics / UpdateAllConsultantPerformance에 p_tenant_id 추가.
3. **중간**: 레거시 재무 프로시저(consolidated_financial_procedures.sql)를 표준화 버전으로 교체 또는 사용 중단.
4. **중간**: 할인 레거시(discount_accounting_procedures_fixed) 사용처를 표준화 버전으로 전환.
5. **낮음**: GetBusinessTimeSettings/UpdateBusinessTimeSetting에 p_success/p_message OUT 추가(선택).

### 5.3 Java 측

- PlSqlDiscountAccountingServiceImpl, PlSqlSalaryManagementServiceImpl에 클래스 또는 쓰기 메서드에 @Transactional 명시 권장.
- Deprecated 파라미터(branchCode 등) 사용 중단 후 제거, 로그에는 tenantId만 사용.

---

## 6. 서브에이전트 실행 요청문 참조

표준화 **구현**은 ERP_COMPREHENSIVE_AUDIT_PLAN.md §9.2(2-2) core-coder 프롬프트를 따른다. 본 문서의 개선 계획 확정 후 해당 프롬프트로 실행한다.

# 종합 TODO 리스트 (2025-11-22)

**작성일**: 2025-11-22  
**최종 업데이트**: 2025-11-22  
**상태**: 활성 관리 중

**참고 문서**:
- `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md` - ERP 멀티 테넌트 연동 전략
- `ERP_DYNAMIC_QUERY_DECISION.md` - 동적 쿼리 사용 여부 판단
- `ERP_PERFORMANCE_OPTIMIZATION_STRATEGY.md` - 성능 최적화 전략
- `ERP_WIDGETIZATION_ALIGNED_WITH_ADVANCEMENT.md` - ERP 위젯화 계획
- `ERP_COMPONENTS_ANALYSIS.md` - ERP 컴포넌트 분석
- `ERP_COMMON_COMPONENTS_ANALYSIS.md` - ERP 공통 컴포넌트 분석
- `TODAY_TODO_CHECKLIST.md` - 오늘 할 일 체크리스트
- `PENDING_DEVELOPMENT_ITEMS.md` - 미개발 항목
- `DEVELOPMENT_CHECKLIST.md` - 개발 체크리스트

---

## 📊 전체 진행 상황

### ✅ 완료된 작업 (2025-11-22)

1. **ERP 공통 컴포넌트 분석 및 위젯화**
   - ✅ `formatUtils.js` 생성 (공통 포맷팅 유틸리티)
   - ✅ `ErpStatsGridWidget` 생성
   - ✅ `ErpManagementGridWidget` 생성
   - ✅ WidgetRegistry ERP 카테고리 추가

2. **문서 작성**
   - ✅ ERP 멀티 테넌트 연동 전략 문서
   - ✅ ERP 동적 쿼리 사용 여부 판단 문서
   - ✅ ERP 성능 최적화 전략 문서
   - ✅ ERP 위젯화 계획 문서 (고도화 전략 연계)

---

## 🔥 P0 - 즉시 조치 필요 (높은 우선순위)

### 1. ERP 엔티티 멀티 테넌트 전환 (1주)

**목적**: 모든 입점사와 ERP 연동 가능하도록

**체크리스트**:
- [ ] `FinancialTransaction` → `BaseEntity` 상속
  - [ ] `@SuperBuilder` 추가
  - [ ] `@EqualsAndHashCode(callSuper = true)` 추가
  - [ ] 기존 `id`, `createdAt`, `updatedAt` 필드 제거
  - [ ] 데이터베이스 마이그레이션 스크립트 작성
- [ ] `PurchaseRequest` → `BaseEntity` 상속
- [ ] `PurchaseOrder` → `BaseEntity` 상속
- [ ] `Budget` → `BaseEntity` 상속
- [ ] `Item` → `BaseEntity` 상속
- [ ] `AccountingEntry` → `BaseEntity` 상속
- [ ] `Account` → `BaseEntity` 상속
- [ ] `SalaryCalculation` → `BaseEntity` 상속
- [ ] 기타 모든 ERP 엔티티
- [ ] 데이터베이스 마이그레이션 스크립트 작성 (`V40__add_tenant_id_to_erp_entities.sql`)
  - [ ] 모든 ERP 테이블에 `tenant_id` 컬럼 추가
  - [ ] 인덱스 추가 (`idx_tenant_id`, `idx_tenant_id_created_at` 등)
  - [ ] 기존 데이터에 `tenant_id` 설정 (필요시)

**참고**: `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md` Phase 1

---

### 2. ERP 동적 쿼리 전환 (1주)

**목적**: 메모리 필터링 제거, 시스템 부하 최소화

**체크리스트**:
- [ ] `FinancialTransactionRepository`에 `JpaSpecificationExecutor` 추가
- [ ] `FinancialTransactionSpecifications` 빌더 클래스 생성
  - [ ] `isNotDeleted()` - 삭제되지 않은 것만
  - [ ] `hasTenantId()` - 테넌트 필터링
  - [ ] `hasBranchCode()` - 지점 필터링
  - [ ] `dateBetween()` - 날짜 범위 필터링
  - [ ] `amountBetween()` - 금액 범위 필터링
  - [ ] `hasCategory()` - 카테고리 필터링
  - [ ] `hasTransactionType()` - 거래 유형 필터링
- [ ] `FinancialTransactionServiceImpl` 메모리 필터링 제거
  - [ ] `getBranchFinancialData()` 메서드 수정
  - [ ] `getTransactionsByBranch()` 메서드 수정
- [ ] 인덱스 최적화
  - [ ] `idx_ft_tenant_branch_date` 인덱스 추가
  - [ ] `idx_ft_tenant_category_date` 인덱스 추가
  - [ ] `idx_ft_tenant_type_date` 인덱스 추가
  - [ ] 복합 인덱스 추가
- [ ] 페이징 강제 적용 (최대 1000건)
- [ ] 성능 테스트 및 비교

**참고**: `ERP_DYNAMIC_QUERY_DECISION.md` Phase 1, `ERP_PERFORMANCE_OPTIMIZATION_STRATEGY.md` Phase 1

---

### 3. ERP 서비스 멀티 테넌트 지원 (1주)

**목적**: 모든 ERP 서비스에서 테넌트 컨텍스트 사용

**체크리스트**:
- [ ] `FinancialTransactionService` / `FinancialTransactionServiceImpl`
  - [ ] `TenantContextHolder` 사용
  - [ ] 테넌트 필터링 자동 적용
  - [ ] 테넌트 컨텍스트 검증
- [ ] `PurchaseRequestService` / `PurchaseRequestServiceImpl`
- [ ] `BudgetService` / `BudgetServiceImpl`
- [ ] `ItemService` / `ItemServiceImpl`
- [ ] `ErpService` / `ErpServiceImpl`
- [ ] `BaseTenantService` 패턴 적용 (선택적)

**참고**: `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md` Phase 2

---

### 4. ERP 프로시저 멀티 테넌트 지원 (1주)

**목적**: 프로시저 호출 시 tenant_id 자동 전달

**체크리스트**:
- [ ] `BaseProcedureService` 생성
  - [ ] `executeProcedure()` 메서드에 테넌트 ID 자동 추가
  - [ ] 공통 프로시저 호출 패턴
- [ ] 모든 ERP 프로시저에 `tenant_id` 파라미터 추가
  - [ ] `GetFinancialStatistics` 프로시저
  - [ ] `ProcessIntegratedSalaryCalculation` 프로시저
  - [ ] 기타 모든 ERP 프로시저
- [ ] 프로시저 내부에서 테넌트 필터링

**참고**: `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md` Phase 3

---

## 🚀 P1 - 중요 (빠른 확장)

### 5. ERP 캐싱 전략 구현 (1주)

**목적**: 반복 조회 시 부하 최소화 (기존 Redis 인프라 활용)

**체크리스트**:
- [ ] `ErpStatisticsCacheService` 생성
  - [ ] `getDashboardStats()` - 대시보드 통계 캐싱
  - [ ] `onRealtimeSync()` - 실시간 연동 시 선택적 캐시 무효화
  - [ ] `onBatchSync()` - 배치 실행 시 캐시 무효화
- [ ] `FinancialTransactionService`에 캐싱 적용
  - [ ] 조회 결과 캐싱 (1분 TTL)
  - [ ] 실시간 연동 시 캐시 무효화
- [ ] 통계 데이터 캐싱 (5분 TTL)
- [ ] 캐시 키 전략 수립 (`tenantId:branchCode:dateRange`)

**참고**: `ERP_PERFORMANCE_OPTIMIZATION_STRATEGY.md` Phase 2

---

### 6. 배치와 실시간 연동 조화 (1주)

**목적**: 배치 실행 중에도 실시간 연동 유지

**체크리스트**:
- [ ] `ErpBatchCoordinator` 생성
  - [ ] `canExecuteBatch()` - 배치 실행 가능 여부 확인
  - [ ] `acquireBatchLock()` - 배치 실행 락 획득 (비블로킹)
  - [ ] `releaseBatchLock()` - 배치 실행 락 해제
- [ ] `SalaryBatchServiceImpl` 수정
  - [ ] 배치 실행 락 획득/해제
  - [ ] 실시간 연동 보호
- [ ] `ErpRealtimeSyncService` 생성
  - [ ] 실시간 연동 우선순위 관리
  - [ ] 배치와 충돌하지 않도록 최소한의 락 사용

**참고**: `ERP_PERFORMANCE_OPTIMIZATION_STRATEGY.md` Phase 3

---

### 7. ERP 위젯 Phase 1: 회계 관리 위젯 (4주)

**목적**: ERP 고도화 전략에 맞춰 위젯 구현

**체크리스트**:
- [ ] **Week 1-2: 분개 시스템 위젯**
  - [ ] `JournalEntryWidget` - 분개 목록 및 상세
  - [ ] `JournalEntryLineWidget` - 분개 상세 라인
  - [ ] `JournalEntryValidationWidget` - 분개 검증 결과
- [ ] **Week 3-4: 원장 및 재무제표 위젯**
  - [ ] `LedgerWidget` - 원장 조회
  - [ ] `IncomeStatementWidget` - 손익계산서
  - [ ] `BalanceSheetWidget` - 재무상태표
  - [ ] `CashFlowStatementWidget` - 현금흐름표

**참고**: `ERP_WIDGETIZATION_ALIGNED_WITH_ADVANCEMENT.md` Phase 1

---

### 8. 기존 ERP 컴포넌트 formatUtils 적용 (1일)

**목적**: 중복 코드 제거, 일관성 확보

**체크리스트**:
- [ ] `ErpDashboard.js` - `formatCurrency` → `formatUtils.formatCurrency`
- [ ] `IntegratedFinanceDashboard.js` - `formatCurrency`, `formatDate` → `formatUtils`
- [ ] `FinancialManagement.js` - `formatCurrency`, `formatDate` → `formatUtils`
- [ ] `TaxManagement.js` - `formatCurrency`, `formatDate` → `formatUtils`
- [ ] `SalaryManagement.js` - `formatCurrency`, `formatDate` → `formatUtils`
- [ ] `BudgetManagement.js` - `formatCurrency`, `formatDate` → `formatUtils`
- [ ] `PurchaseRequestForm.js` - `formatCurrency` → `formatUtils`
- [ ] `ItemManagement.js` - `formatCurrency` → `formatUtils`
- [ ] `SuperAdminApprovalDashboard.js` - `formatCurrency`, `formatDate` → `formatUtils`
- [ ] `AdminApprovalDashboard.js` - `formatCurrency`, `formatDate` → `formatUtils`
- [ ] `RefundStatsCards.js` - `formatCurrency` → `formatUtils`
- [ ] `RefundHistoryTable.js` - `formatCurrency` → `formatUtils`
- [ ] `RefundAccountingStatus.js` - `formatCurrency` → `formatUtils`
- [ ] `FinancialCalendarView.js` - `formatCurrency` → `formatUtils`
- [ ] `ImprovedTaxManagement.js` - `formatCurrency`, `formatDate` → `formatUtils`

**참고**: `ERP_COMMON_COMPONENTS_ANALYSIS.md` Phase 1

---

## 📋 P2 - 선택 (장기)

### 9. ERP 위젯 Phase 2-6 (고도화 전략 연계)

**Phase 2: 세무 관리 위젯 (3주)**
- [ ] `VatCalculationWidget` - 부가세 계산
- [ ] `VatReturnWidget` - 부가세 신고서
- [ ] `TaxInvoiceWidget` - 전자세금계산서 목록
- [ ] `TaxInvoiceFormWidget` - 전자세금계산서 발행 폼
- [ ] `WithholdingTaxWidget` - 원천징수 관리
- [ ] `YearEndSettlementWidget` - 연말정산 처리

**Phase 3: 인사 관리 위젯 (4주)**
- [ ] `EmployeeManagementWidget` - 직원 목록 및 관리
- [ ] `AttendanceWidget` - 근태 기록
- [ ] `AttendanceCalendarWidget` - 근태 캘린더
- [ ] `PayrollWidget` - 급여 목록 및 계산
- [ ] `PayrollCalculationWidget` - 급여 계산 상세
- [ ] `PayrollPaymentWidget` - 급여 지급

**Phase 4: 정산 관리 위젯 (3주)**
- [ ] `SettlementRuleWidget` - 정산 규칙 관리
- [ ] `SettlementRuleEditorWidget` - 정산 규칙 편집기
- [ ] `SettlementCalculationWidget` - 정산 계산
- [ ] `SettlementListWidget` - 정산 목록
- [ ] `SettlementReportWidget` - 정산 리포트

**Phase 5: 리포트 및 분석 위젯 (2주)**
- [ ] `FinancialReportWidget` - 재무 리포트
- [ ] `BudgetVsActualWidget` - 예산 대비 실적
- [ ] `CashFlowAnalysisWidget` - 현금흐름 분석
- [ ] `ProfitLossAnalysisWidget` - 손익 분석

**Phase 6: 외부 시스템 연동 위젯 (3주)**
- [ ] `AccountingSystemSyncWidget` - 회계 시스템 동기화
- [ ] `TaxSystemSyncWidget` - 세무 시스템 동기화
- [ ] `BankAccountWidget` - 계좌 조회
- [ ] `BankTransferWidget` - 자동 이체

**참고**: `ERP_WIDGETIZATION_ALIGNED_WITH_ADVANCEMENT.md`

---

### 10. QueryDSL 도입 (선택적, 1주)

**목적**: 복잡한 통계 쿼리 처리

**체크리스트**:
- [ ] QueryDSL 의존성 추가
- [ ] Q 클래스 생성
- [ ] 복잡한 통계 쿼리 전환
- [ ] 동적 그룹핑 구현

**참고**: `ERP_DYNAMIC_QUERY_DECISION.md` Phase 2

---

### 11. 성능 모니터링 (선택적)

**체크리스트**:
- [ ] `QueryPerformanceMonitor` 생성
  - [ ] 느린 쿼리 감지 (1초 이상)
  - [ ] 쿼리 성능 로깅
- [ ] `ErpSyncPerformanceMonitor` 확장
  - [ ] 실시간 연동 성능 기록 (500ms 이상)
  - [ ] 성능 경고

**참고**: `ERP_PERFORMANCE_OPTIMIZATION_STRATEGY.md` Phase 4

---

## 📊 우선순위별 작업 요약

### P0 (필수 - 즉시 적용)
1. ✅ ERP 공통 컴포넌트 위젯화 (완료)
2. ⏳ ERP 엔티티 멀티 테넌트 전환 (1주)
3. ⏳ ERP 동적 쿼리 전환 (1주)
4. ⏳ ERP 서비스 멀티 테넌트 지원 (1주)
5. ⏳ ERP 프로시저 멀티 테넌트 지원 (1주)

**예상 시간**: 4주

### P1 (중요 - 빠른 확장)
6. ⏳ ERP 캐싱 전략 구현 (1주)
7. ⏳ 배치와 실시간 연동 조화 (1주)
8. ⏳ ERP 위젯 Phase 1: 회계 관리 위젯 (4주)
9. ⏳ 기존 ERP 컴포넌트 formatUtils 적용 (1일)

**예상 시간**: 6주

### P2 (선택 - 장기)
10. ⏳ ERP 위젯 Phase 2-6 (15주)
11. ⏳ QueryDSL 도입 (1주)
12. ⏳ 성능 모니터링 (선택적)

**예상 시간**: 16주

---

## 🎯 다음 주 작업 계획 (권장)

### Week 1 (즉시 시작)

**Day 1-2: ERP 엔티티 멀티 테넌트 전환**
- [ ] `FinancialTransaction` → `BaseEntity` 상속
- [ ] 데이터베이스 마이그레이션 스크립트 작성
- [ ] 테스트

**Day 3-4: ERP 동적 쿼리 전환**
- [ ] `FinancialTransactionSpecifications` 생성
- [ ] 메모리 필터링 제거
- [ ] 인덱스 최적화
- [ ] 성능 테스트

**Day 5: 기존 컴포넌트 formatUtils 적용**
- [ ] 주요 ERP 컴포넌트에서 `formatUtils` 사용
- [ ] 중복 코드 제거

---

## 📝 작업 원칙

1. **실시간 ERP 연동 유지** (시스템의 강점)
   - 실시간 연동은 계속 진행
   - 배치와 충돌하지 않도록 최소한의 락만 사용

2. **시스템 부하 최소화**
   - 동적 쿼리로 메모리 필터링 제거
   - 인덱스 최적화
   - 캐싱 활용

3. **멀티 테넌트 지원**
   - 모든 입점사와 ERP 연동 가능
   - 테넌트별 데이터 완전 격리

4. **점진적 전환**
   - 기존 기능 유지하면서 단계적으로 전환
   - 하위 호환성 보장

---

## 🔗 관련 문서

### 오늘 날짜 폴더 (2025-11-22)
- [ERP 멀티 테넌트 연동 전략](./ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md)
- [ERP 동적 쿼리 사용 여부 판단](./ERP_DYNAMIC_QUERY_DECISION.md)
- [ERP 성능 최적화 전략](./ERP_PERFORMANCE_OPTIMIZATION_STRATEGY.md)
- [ERP 위젯화 계획 (고도화 전략 연계)](./ERP_WIDGETIZATION_ALIGNED_WITH_ADVANCEMENT.md)
- [ERP 컴포넌트 분석](./ERP_COMPONENTS_ANALYSIS.md)
- [ERP 공통 컴포넌트 분석](./ERP_COMMON_COMPONENTS_ANALYSIS.md)

### 루트 문서
- [마스터 TODO](../MASTER_TODO_AND_IMPROVEMENTS.md)
- [ERP 고도화 계획](../ERP_ADVANCEMENT_PLAN.md)
- [프로시저 기반 ERP 고도화](../ERP_PROCEDURE_BASED_ADVANCEMENT.md)

---

**마지막 업데이트**: 2025-11-22  
**다음 리뷰 예정일**: 주간 회의




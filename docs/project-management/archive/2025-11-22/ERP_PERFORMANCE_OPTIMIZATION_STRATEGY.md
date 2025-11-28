# ERP 시스템 성능 최적화 전략 (부하 최소화)

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: 실시간 ERP 연동 강점을 유지하면서 시스템 부하를 최소화하는 전략

**핵심 원칙**:
- ✅ **실시간 ERP 연동 유지** (시스템의 강점)
- ✅ **배치와 실시간 연동의 조화**
- ✅ **시스템 부하 최소화**
- ✅ **동적 쿼리 효율적 활용**

**참고 문서**:
- `ERP_DYNAMIC_QUERY_DECISION.md` - 동적 쿼리 사용 여부 판단
- `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md` - 멀티 테넌트 연동 전략
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화

---

## 📊 현재 시스템 상태 분석

### ✅ 실시간 ERP 연동 (시스템 강점) - 유지 필수

1. **결제 확인 시 자동 ERP 거래 생성**
   ```java
   // AdminServiceImpl.java
   confirmPayment() → createReceivablesTransaction() → ERP 동기화
   // 실시간으로 즉시 처리 (시스템의 핵심 강점)
   ```

2. **매핑 변경 시 실시간 ERP 동기화**
   ```java
   // AdminServiceImpl.java
   updateMapping() → ProcessIntegratedAmount 프로시저 호출 → ERP 동기화
   // PL/SQL 프로시저로 빠른 처리
   ```

3. **실시간 통계 업데이트**
   ```java
   // RealTimeStatisticsServiceImpl.java
   updateStatisticsOnMappingChange() → PL/SQL 프로시저 우선 사용
   // PL/SQL 프로시저가 있으면 프로시저 사용, 없으면 Java 방식
   // 프로시저 사용 시 성능 최적화됨
   ```

4. **PL/SQL 프로시저 우선 사용**
   - `plSqlStatisticsService.isProcedureAvailable()` 체크
   - 프로시저가 있으면 프로시저 사용 (성능 최적화)
   - 프로시저가 없으면 Java 방식 (하위 호환성)

### ✅ 배치 시스템 (현재 실행 중) - 부하 최소화 필요

1. **급여 배치** (`SalaryBatchScheduler`)
   - 매일 새벽 2시 실행
   - 이전 달 급여 계산 및 ERP 동기화
   - **주의**: 실시간 연동과 충돌 가능성

2. **통계 배치** (`StatisticsSchedulerServiceImpl`)
   - 매일 자정 1분 후: 일별 통계 업데이트 (`updateAllBranchDailyStatistics`)
   - 매일 자정 3분 후: 상담사 성과 업데이트 (`updateAllConsultantPerformance`)
   - 매일 자정 5분 후: 성과 모니터링 (`performDailyPerformanceMonitoring`)
   - **PL/SQL 프로시저 사용** → 성능 최적화됨

3. **ERP 동기화 로그** (`ErpSyncLog`)
   - 모든 배치 작업의 동기화 이력 기록
   - 동기화 성능 모니터링 가능

4. **캐싱 인프라** (이미 존재)
   - Redis 캐시 설정 (`CacheConfig`)
   - `CacheService` 구현됨
   - **하지만 ERP 관련 캐싱은 아직 미적용**

### ❌ 현재 성능 문제점

1. **메모리 필터링** (비효율적)
   ```java
   // FinancialTransactionServiceImpl.java
   List<FinancialTransaction> all = repository.findByIsDeletedFalse(); // 전체 조회
   List<FinancialTransaction> filtered = all.stream()
       .filter(t -> branchCode.equals(t.getBranchCode()))
       .filter(t -> category.equals(t.getCategory()))
       .collect(Collectors.toList()); // 메모리에서 필터링
   ```

2. **중복 쿼리**
   - 동일한 데이터를 여러 번 조회
   - 캐싱 미적용

3. **배치와 실시간 연동 충돌 가능성**
   - 배치 실행 중 실시간 연동 시 리소스 경합

---

## 🎯 성능 최적화 전략 (부하 최소화)

### 핵심 원칙

1. **실시간 ERP 연동 유지** (시스템의 강점)
   - 실시간 연동은 계속 진행
   - 배치와 충돌하지 않도록 최소한의 락만 사용
   - 비동기 처리로 응답 속도 유지

2. **프로시저 우선 사용** (이미 구현됨)
   - PL/SQL 프로시저가 있으면 프로시저 사용
   - 프로시저가 없으면 Java 방식 (하위 호환성)
   - 프로시저는 데이터베이스 레벨에서 처리 → 성능 최적화

3. **캐싱 활용** (이미 인프라 존재)
   - Redis 캐시 활용
   - 실시간 연동 시 선택적 캐시 무효화
   - 배치 실행 시 캐시 무효화 최소화

4. **동적 쿼리 효율적 사용**
   - 메모리 필터링 제거
   - 인덱스 활용
   - 페이징 강제 적용

---

### Phase 1: 동적 쿼리 + 인덱스 최적화 (1주)

#### 1.1 Specification 패턴 도입 (부하 최소화)

**목표**: 메모리 필터링 제거, 데이터베이스 레벨 필터링

**구현**:
```java
// FinancialTransactionSpecifications.java
public class FinancialTransactionSpecifications {
    
    // 기본 조건: 삭제되지 않은 것만
    public static Specification<FinancialTransaction> isNotDeleted() {
        return (root, query, cb) -> cb.equal(root.get("isDeleted"), false);
    }
    
    // 테넌트 필터링 (멀티 테넌트)
    public static Specification<FinancialTransaction> hasTenantId(String tenantId) {
        return (root, query, cb) -> 
            tenantId == null ? cb.conjunction() : 
            cb.equal(root.get("tenantId"), tenantId);
    }
    
    // 지점 필터링 (인덱스 활용)
    public static Specification<FinancialTransaction> hasBranchCode(String branchCode) {
        return (root, query, cb) -> 
            branchCode == null ? cb.conjunction() : 
            cb.equal(root.get("branchCode"), branchCode);
    }
    
    // 날짜 범위 필터링 (인덱스 활용)
    public static Specification<FinancialTransaction> dateBetween(LocalDate start, LocalDate end) {
        return (root, query, cb) -> {
            if (start == null && end == null) {
                return cb.conjunction();
            }
            Predicate predicate = cb.conjunction();
            if (start != null) {
                predicate = cb.and(predicate, 
                    cb.greaterThanOrEqualTo(root.get("transactionDate"), start));
            }
            if (end != null) {
                predicate = cb.and(predicate, 
                    cb.lessThanOrEqualTo(root.get("transactionDate"), end));
            }
            return predicate;
        };
    }
    
    // 금액 범위 필터링
    public static Specification<FinancialTransaction> amountBetween(BigDecimal min, BigDecimal max) {
        return (root, query, cb) -> {
            if (min == null && max == null) {
                return cb.conjunction();
            }
            Predicate predicate = cb.conjunction();
            if (min != null) {
                predicate = cb.and(predicate, 
                    cb.greaterThanOrEqualTo(root.get("amount"), min));
            }
            if (max != null) {
                predicate = cb.and(predicate, 
                    cb.lessThanOrEqualTo(root.get("amount"), max));
            }
            return predicate;
        };
    }
}

// Service에서 사용
public List<FinancialTransaction> findTransactions(
        String branchCode, String category, String transactionType,
        LocalDate startDate, LocalDate endDate) {
    
    Specification<FinancialTransaction> spec = Specification.where(
        FinancialTransactionSpecifications.isNotDeleted()
    );
    
    // 테넌트 필터링 자동 추가 (멀티 테넌트)
    String tenantId = TenantContextHolder.getTenantId();
    if (tenantId != null) {
        spec = spec.and(FinancialTransactionSpecifications.hasTenantId(tenantId));
    }
    
    // 동적 필터 추가
    spec = spec.and(FinancialTransactionSpecifications.hasBranchCode(branchCode));
    spec = spec.and(FinancialTransactionSpecifications.dateBetween(startDate, endDate));
    
    // 페이징 적용 (부하 최소화)
    Pageable pageable = PageRequest.of(0, 100); // 기본 100건
    return repository.findAll(spec, pageable).getContent();
}
```

**효과**:
- ✅ 데이터베이스 레벨 필터링 → 메모리 사용량 감소
- ✅ 인덱스 활용 → 쿼리 성능 향상 (10~100배)
- ✅ 네트워크 트래픽 감소 → 불필요한 데이터 전송 제거

#### 1.2 인덱스 최적화

**필수 인덱스 추가**:
```sql
-- V41__optimize_erp_indexes.sql

-- FinancialTransaction 인덱스
CREATE INDEX idx_ft_tenant_branch_date 
ON financial_transactions(tenant_id, branch_code, transaction_date, is_deleted);

CREATE INDEX idx_ft_tenant_category_date 
ON financial_transactions(tenant_id, category, transaction_date, is_deleted);

CREATE INDEX idx_ft_tenant_type_date 
ON financial_transactions(tenant_id, transaction_type, transaction_date, is_deleted);

-- 복합 인덱스 (자주 사용되는 조합)
CREATE INDEX idx_ft_tenant_branch_type_date 
ON financial_transactions(tenant_id, branch_code, transaction_type, transaction_date, is_deleted);

-- PurchaseRequest 인덱스
CREATE INDEX idx_pr_tenant_status_date 
ON erp_purchase_requests(tenant_id, status, created_at, is_deleted);

-- Budget 인덱스
CREATE INDEX idx_budget_tenant_branch_period 
ON erp_budgets(tenant_id, branch_code, period_start, period_end, is_deleted);
```

**인덱스 전략**:
- **복합 인덱스**: 자주 함께 사용되는 컬럼 조합
- **커버링 인덱스**: SELECT 컬럼을 포함하여 인덱스만으로 조회 가능
- **부분 인덱스**: `is_deleted = false` 조건만 인덱싱

---

### Phase 2: 캐싱 전략 (1주)

#### 2.1 통계 데이터 캐싱 (기존 CacheService 활용)

**목표**: 자주 조회되는 통계 데이터 캐싱 (기존 Redis 인프라 활용)

**구현**:
```java
@Service
@RequiredArgsConstructor
public class ErpStatisticsCacheService {
    
    private final CacheService cacheService; // 기존 CacheService 활용
    private static final String CACHE_PREFIX = "erp:stats:";
    private static final long CACHE_TTL_MINUTES = 5; // 5분
    
    /**
     * 대시보드 통계 캐싱
     */
    public ErpDashboardStats getDashboardStats(String tenantId, String branchCode, String dateRange) {
        String cacheKey = CACHE_PREFIX + tenantId + ":" + branchCode + ":" + dateRange;
        
        // 캐시에서 조회
        Optional<ErpDashboardStats> cached = cacheService.get(cacheKey, ErpDashboardStats.class);
        if (cached.isPresent()) {
            log.debug("캐시 히트: {}", cacheKey);
            return cached.get();
        }
        
        // 캐시 미스 시 실제 통계 계산
        log.debug("캐시 미스: {}", cacheKey);
        ErpDashboardStats stats = calculateDashboardStats(tenantId, branchCode, dateRange);
        
        // 캐시 저장
        cacheService.put(cacheKey, stats, CACHE_TTL_MINUTES);
        
        return stats;
    }
    
    /**
     * 실시간 연동 시 선택적 캐시 무효화
     */
    public void onRealtimeSync(String tenantId, String branchCode, String syncType) {
        // 실시간 연동이 발생한 경우에만 해당 지점의 캐시 무효화
        String cachePattern = CACHE_PREFIX + tenantId + ":" + branchCode + ":*";
        
        // 통계 관련 캐시만 무효화 (다른 캐시는 유지)
        if ("FINANCIAL".equals(syncType) || "SALARY".equals(syncType)) {
            cacheService.evictPattern(cachePattern);
            log.info("캐시 무효화: tenantId={}, branchCode={}, syncType={}", 
                tenantId, branchCode, syncType);
        }
    }
    
    /**
     * 배치 실행 시 캐시 무효화 (선택적)
     */
    public void onBatchSync(String tenantId, String branchCode, String syncType) {
        // 배치 실행 시에는 해당 기간의 캐시만 무효화
        // 실시간 연동과 달리 전체 캐시를 무효화하지 않음
        String cachePattern = CACHE_PREFIX + tenantId + ":" + branchCode + ":*";
        cacheService.evictPattern(cachePattern);
        log.info("배치 실행으로 인한 캐시 무효화: tenantId={}, branchCode={}", 
            tenantId, branchCode);
    }
}
```

#### 2.2 조회 결과 캐싱

**구현**:
```java
@Service
@RequiredArgsConstructor
public class FinancialTransactionService {
    
    private final FinancialTransactionRepository repository;
    private final ErpStatisticsCacheService cacheService;
    
    /**
     * 거래 목록 조회 (캐싱 적용)
     */
    @Cacheable(value = "financialTransactions", 
               key = "#tenantId + ':' + #branchCode + ':' + #startDate + ':' + #endDate + ':' + #page")
    public Page<FinancialTransactionResponse> getTransactions(
            String tenantId, String branchCode,
            LocalDate startDate, LocalDate endDate,
            Pageable pageable) {
        
        Specification<FinancialTransaction> spec = buildSpecification(
            tenantId, branchCode, startDate, endDate);
        
        return repository.findAll(spec, pageable)
            .map(this::toResponse);
    }
    
    /**
     * 실시간 연동 시 캐시 무효화
     */
    @CacheEvict(value = "financialTransactions", 
                key = "#tenantId + ':' + #branchCode + ':*'")
    public void onTransactionCreated(String tenantId, String branchCode) {
        // 실시간 연동으로 거래가 생성되면 캐시 무효화
        cacheService.onRealtimeSync(tenantId, branchCode, "FINANCIAL");
    }
}
```

**캐싱 전략**:
- **TTL**: 5분 (통계 데이터), 1분 (목록 데이터)
- **선택적 무효화**: 실시간 연동 발생 시에만 해당 지점/테넌트 캐시 무효화
- **캐시 키**: `tenantId:branchCode:dateRange` 형태로 격리

---

### Phase 3: 배치와 실시간 연동 조화 (1주)

#### 3.1 배치 실행 시간 최적화 (현재 스케줄 유지)

**현재 배치 스케줄** (이미 최적화됨):
- 새벽 2시: 급여 배치 (업무 시간 외)
- 자정 1분, 3분, 5분: 통계 배치 (업무 시간 외)

**추가 최적화 전략**:
```java
@Component
@RequiredArgsConstructor
public class ErpBatchCoordinator {
    
    private final AtomicBoolean batchRunning = new AtomicBoolean(false);
    private final ReentrantLock batchLock = new ReentrantLock();
    
    /**
     * 배치 실행 가능 여부 확인
     * 현재 스케줄은 이미 업무 시간 외이므로 추가 체크만 수행
     */
    public boolean canExecuteBatch() {
        // 현재 스케줄이 업무 시간 외이므로 추가 체크는 선택적
        // 실시간 연동이 매우 활발한 경우에만 배치 지연
        
        // 이미 배치가 실행 중이면 대기
        if (batchRunning.get()) {
            log.info("배치가 이미 실행 중입니다. 대기합니다.");
            return false;
        }
        
        return true;
    }
    
    /**
     * 배치 실행 락 획득 (비블로킹)
     */
    public boolean acquireBatchLock() {
        if (batchLock.tryLock()) {
            batchRunning.set(true);
            log.info("배치 실행 락 획득");
            return true;
        }
        log.warn("배치 실행 락 획득 실패 (다른 배치 실행 중)");
        return false;
    }
    
    /**
     * 배치 실행 락 해제
     */
    public void releaseBatchLock() {
        batchRunning.set(false);
        batchLock.unlock();
        log.info("배치 실행 락 해제");
    }
    
    /**
     * 실시간 연동이 활발한지 확인
     */
    public boolean isRealtimeSyncActive() {
        // 최근 1분간 실시간 연동 횟수 확인
        // 너무 많으면 배치 지연
        // TODO: ErpSyncLog에서 최근 1분간 실시간 연동 횟수 조회
        return false; // 기본값: 활발하지 않음
    }
}
```

#### 3.2 실시간 연동 우선순위 관리 (현재 구조 유지)

**현재 구조** (이미 최적화됨):
- 실시간 연동은 즉시 처리 (동기)
- 통계 업데이트는 PL/SQL 프로시저 우선 사용
- 프로시저가 없으면 Java 방식 (하위 호환성)

**추가 최적화**:
```java
@Service
@RequiredArgsConstructor
public class ErpRealtimeSyncService {
    
    private final ErpBatchCoordinator batchCoordinator;
    private final ErpStatisticsCacheService cacheService;
    private final PlSqlStatisticsService plSqlStatisticsService; // 기존 서비스 활용
    
    /**
     * 실시간 ERP 연동 (우선순위 높음, 동기 처리 유지)
     * 현재 구조 유지: 실시간 연동은 즉시 처리
     */
    public boolean syncRealtime(String tenantId, String branchCode, Object data) {
        try {
            // 1. 빠른 데이터 저장 (동기, 즉시 처리)
            saveFinancialTransaction(data);
            
            // 2. 통계 업데이트 (PL/SQL 프로시저 우선 사용)
            if (plSqlStatisticsService.isProcedureAvailable()) {
                // 프로시저 사용 (성능 최적화)
                plSqlStatisticsService.updateDailyStatistics(branchCode, LocalDate.now());
            } else {
                // Java 방식 (하위 호환성)
                updateStatisticsJava(tenantId, branchCode);
            }
            
            // 3. 캐시 무효화 (선택적, 비동기)
            // 실시간 연동이 발생한 경우에만 해당 지점의 캐시 무효화
            cacheService.onRealtimeSync(tenantId, branchCode, "FINANCIAL");
            
            return true;
        } catch (Exception e) {
            log.error("실시간 ERP 연동 실패: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * 배치 실행 중에도 실시간 연동은 계속 진행
     * 배치와 충돌하지 않도록 최소한의 락 사용
     */
    private void saveFinancialTransaction(Object data) {
        // 배치와 독립적으로 실행 가능
        // 대부분의 경우 배치와 충돌하지 않음
        // 필요시 행 단위 락만 사용
    }
}
```

#### 3.3 배치 실행 시 실시간 연동 보호 (최소 락 사용)

**구현**:
```java
@Service
@RequiredArgsConstructor
public class SalaryBatchServiceImpl implements SalaryBatchService {
    
    private final ErpBatchCoordinator batchCoordinator;
    private final ErpStatisticsCacheService cacheService;
    
    @Override
    @Transactional
    public BatchResult executeMonthlySalaryBatch(int targetYear, int targetMonth, String branchCode) {
        // 배치 실행 락 획득 (비블로킹)
        if (!batchCoordinator.acquireBatchLock()) {
            log.warn("배치 실행 락 획득 실패. 다음 스케줄에 재시도합니다.");
            return new BatchResult(false, "다른 배치가 실행 중입니다.");
        }
        
        try {
            log.info("🚀 급여 배치 실행 시작: {}-{}", targetYear, targetMonth);
            
            // 배치 실행
            // 실시간 연동은 계속 진행되지만, 배치와 충돌하는 부분만 대기
            // PL/SQL 프로시저 사용으로 빠른 처리
            
            BatchResult result = executeBatchInternal(targetYear, targetMonth, branchCode);
            
            // 배치 완료 후 캐시 무효화 (선택적)
            if (result.isSuccess()) {
                // 배치로 인한 데이터 변경이 있으면 캐시 무효화
                cacheService.onBatchSync(null, branchCode, "SALARY");
            }
            
            return result;
            
        } finally {
            // 배치 실행 락 해제
            batchCoordinator.releaseBatchLock();
        }
    }
}
```

---

### Phase 4: 쿼리 최적화 (1주)

#### 4.1 페이징 강제 적용

**목표**: 대량 데이터 조회 방지

**구현**:
```java
@Service
public class FinancialTransactionService {
    
    private static final int MAX_PAGE_SIZE = 1000; // 최대 페이지 크기 제한
    
    public Page<FinancialTransactionResponse> getTransactions(
            String branchCode, String category, String transactionType,
            LocalDate startDate, LocalDate endDate,
            Pageable pageable) {
        
        // 페이지 크기 제한
        if (pageable.getPageSize() > MAX_PAGE_SIZE) {
            pageable = PageRequest.of(
                pageable.getPageNumber(), 
                MAX_PAGE_SIZE, 
                pageable.getSort()
            );
        }
        
        Specification<FinancialTransaction> spec = buildSpecification(
            branchCode, category, transactionType, startDate, endDate);
        
        return repository.findAll(spec, pageable)
            .map(this::toResponse);
    }
}
```

#### 4.2 조인 최적화

**목표**: N+1 쿼리 문제 해결

**구현**:
```java
// Repository에 Fetch Join 추가
@Query("SELECT DISTINCT ft FROM FinancialTransaction ft " +
       "LEFT JOIN FETCH ft.categoryCode " +
       "LEFT JOIN FETCH ft.subcategoryCode " +
       "WHERE ft.tenantId = :tenantId " +
       "AND ft.isDeleted = false " +
       "AND ft.transactionDate BETWEEN :startDate AND :endDate")
Page<FinancialTransaction> findWithJoins(
    @Param("tenantId") String tenantId,
    @Param("startDate") LocalDate startDate,
    @Param("endDate") LocalDate endDate,
    Pageable pageable);
```

#### 4.3 프로시저 활용 (복잡한 통계) - 이미 구현됨

**현재 구조** (이미 최적화됨):
- `RealTimeStatisticsServiceImpl`에서 PL/SQL 프로시저 우선 사용
- 프로시저가 있으면 프로시저 사용 (성능 최적화)
- 프로시저가 없으면 Java 방식 (하위 호환성)

**추가 최적화**:
```java
@Service
@RequiredArgsConstructor
public class ErpStatisticsService {
    
    private final PlSqlStatisticsService plSqlStatisticsService; // 기존 서비스 활용
    private final ErpStatisticsCacheService cacheService;
    
    /**
     * 복잡한 통계는 프로시저로 처리 (성능 최적화)
     * 캐싱 추가로 부하 최소화
     */
    public Map<String, Object> getComplexStatistics(
            String tenantId, String branchCode, String dateRange) {
        
        // 캐시에서 조회
        String cacheKey = "erp:complex:stats:" + tenantId + ":" + branchCode + ":" + dateRange;
        Optional<Map<String, Object>> cached = cacheService.get(cacheKey, Map.class);
        if (cached.isPresent()) {
            return cached.get();
        }
        
        // 프로시저 호출 (데이터베이스 레벨에서 처리, 부하 최소화)
        Map<String, Object> stats = plSqlStatisticsService.getFinancialStatistics(
            tenantId, branchCode, dateRange);
        
        // 캐시 저장 (5분 TTL)
        cacheService.put(cacheKey, stats, 5);
        
        return stats;
    }
}
```

---

## 📊 성능 모니터링 (기존 ErpSyncLog 활용)

### 1. 쿼리 성능 모니터링 (선택적)

**구현**:
```java
@Aspect
@Component
@RequiredArgsConstructor
public class QueryPerformanceMonitor {
    
    private static final long SLOW_QUERY_THRESHOLD = 1000; // 1초
    
    @Around("execution(* com.coresolution.consultation.repository.*Repository.*(..))")
    public Object monitorQuery(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            
            if (duration > SLOW_QUERY_THRESHOLD) {
                log.warn("⚠️ 느린 쿼리 감지: {}ms, 메서드: {}", 
                    duration, joinPoint.getSignature().toShortString());
            }
            
            return result;
        } catch (Exception e) {
            log.error("❌ 쿼리 실행 실패: {}", joinPoint.getSignature().toShortString(), e);
            throw e;
        }
    }
}
```

### 2. 실시간 연동 성능 모니터링 (기존 ErpSyncLog 활용)

**현재 구조** (이미 구현됨):
- `ErpSyncLog` 엔티티로 모든 ERP 동기화 이력 기록
- 배치 작업은 자동으로 로그 기록
- 실시간 연동도 로그 기록 가능

**추가 구현**:
```java
@Service
@RequiredArgsConstructor
public class ErpSyncPerformanceMonitor {
    
    private final ErpSyncLogRepository erpSyncLogRepository;
    
    /**
     * 실시간 연동 성능 기록 (선택적)
     * 중요 실시간 연동만 기록 (부하 최소화)
     */
    public void recordRealtimeSync(String tenantId, String branchCode, 
                                   String syncType, long durationMs) {
        // 성능 경고가 필요한 경우에만 기록
        if (durationMs > 500) { // 500ms 이상이면 기록
            ErpSyncLog syncLog = ErpSyncLog.builder()
                .syncType(ErpSyncLog.SyncType.valueOf(syncType))
                .syncDate(LocalDateTime.now())
                .recordsProcessed(1) // 실시간은 1건씩
                .status(ErpSyncLog.SyncStatus.COMPLETED)
                .startedAt(LocalDateTime.now().minusMillis(durationMs))
                .completedAt(LocalDateTime.now())
                .durationSeconds(durationMs / 1000)
                .build();
            
            erpSyncLogRepository.save(syncLog);
            
            log.warn("⚠️ 느린 실시간 연동: {}ms, tenantId={}, branchCode={}", 
                durationMs, tenantId, branchCode);
        }
    }
}
```

---

## 🎯 우선순위 및 적용 범위

### P0 (필수 - 즉시 적용)

1. **동적 쿼리 전환** (메모리 필터링 제거)
   - `FinancialTransactionRepository` - Specification 패턴
   - 인덱스 최적화 (복합 인덱스)
   - 페이징 강제 적용
   - **효과**: 10~100배 성능 개선, 부하 대폭 감소

2. **배치 락 메커니즘** (실시간 연동 보호)
   - 배치 실행 시 최소한의 락만 사용
   - 실시간 연동은 계속 진행
   - **효과**: 실시간 연동 유지, 배치와 충돌 방지

### P1 (중요 - 빠른 확장)

1. **캐싱 전략** (기존 Redis 인프라 활용)
   - 통계 데이터 캐싱 (5분 TTL)
   - 조회 결과 캐싱 (1분 TTL)
   - 선택적 캐시 무효화 (실시간 연동 시에만)
   - **효과**: 반복 조회 시 100배 이상 성능 향상

2. **프로시저 활용 확대** (이미 부분 구현됨)
   - 복잡한 통계 프로시저로 처리
   - 실시간 연동도 프로시저 우선 사용
   - **효과**: 데이터베이스 레벨 처리, 부하 최소화

### P2 (선택 - 장기)

1. **성능 모니터링**
   - 쿼리 성능 모니터링 (느린 쿼리 감지)
   - 실시간 연동 성능 모니터링 (기존 ErpSyncLog 활용)

2. **비동기 처리 확대**
   - 통계 업데이트 비동기 처리
   - 캐시 무효화 비동기 처리

---

## 📋 체크리스트

### Phase 1: 동적 쿼리 + 인덱스
- [ ] Specification 패턴 도입
- [ ] 인덱스 최적화 (복합 인덱스)
- [ ] 페이징 강제 적용
- [ ] 성능 테스트 및 비교

### Phase 2: 캐싱 전략
- [ ] Redis 캐싱 설정
- [ ] 통계 데이터 캐싱
- [ ] 조회 결과 캐싱
- [ ] 선택적 캐시 무효화

### Phase 3: 배치와 실시간 연동 조화
- [ ] 배치 실행 시간 조정
- [ ] 배치 락 메커니즘
- [ ] 실시간 연동 우선순위 관리
- [ ] 비동기 처리

### Phase 4: 쿼리 최적화
- [ ] 조인 최적화
- [ ] 프로시저 활용 확대
- [ ] 성능 모니터링

---

## 🎯 기대 효과

1. **성능 향상**: 
   - 메모리 필터링 제거 → 10~100배 성능 개선
   - 인덱스 활용 → 쿼리 속도 10배 이상 향상
   - 캐싱 → 반복 조회 시 100배 이상 향상
   - 프로시저 활용 → 데이터베이스 레벨 처리로 부하 최소화

2. **부하 감소**:
   - 데이터베이스 쿼리 수 감소 (인덱스 활용)
   - 네트워크 트래픽 감소 (페이징, 캐싱)
   - 메모리 사용량 감소 (메모리 필터링 제거)
   - CPU 사용량 감소 (프로시저 활용)

3. **실시간 ERP 연동 유지** (시스템의 강점):
   - 배치와 충돌 없이 실시간 연동 계속 진행
   - 최소한의 락만 사용하여 실시간 연동 보장
   - PL/SQL 프로시저 우선 사용으로 빠른 처리
   - 선택적 캐시 무효화로 실시간성 유지

4. **확장성**:
   - 대량 데이터 처리 가능 (페이징, 인덱스)
   - 멀티 테넌트 환경에서도 안정적 (테넌트 필터링)
   - 배치와 실시간 연동 공존 가능

---

**마지막 업데이트**: 2025-11-22  
**다음 단계**: Phase 1 (동적 쿼리 + 인덱스 최적화) 시작


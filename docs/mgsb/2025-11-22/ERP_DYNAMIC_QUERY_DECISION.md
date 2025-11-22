# ERP 시스템 동적 쿼리 사용 여부 판단

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: ERP 시스템에서 동적 쿼리 사용 여부를 판단하고 전략 수립

**참고 문서**:
- `ERP_ADVANCEMENT_PLAN.md` - ERP 고도화 계획
- `ERP_MULTI_TENANT_INTEGRATION_STRATEGY.md` - 멀티 테넌트 연동 전략
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화

---

## 📊 현재 상태 분석

### ✅ 현재 쿼리 구현 방식

1. **Spring Data JPA 메서드명 기반 쿼리**
   ```java
   // FinancialTransactionRepository.java
   List<FinancialTransaction> findByTransactionDateBetweenAndIsDeletedFalse(
       LocalDate startDate, LocalDate endDate);
   List<FinancialTransaction> findByTransactionTypeAndTransactionDateBetweenAndIsDeletedFalse(
       TransactionType transactionType, LocalDate startDate, LocalDate endDate);
   ```

2. **@Query 어노테이션으로 JPQL 쿼리**
   ```java
   @Query("SELECT COALESCE(SUM(f.amount), 0) FROM FinancialTransaction f " +
          "WHERE f.transactionType = 'INCOME' AND f.status = 'COMPLETED' " +
          "AND f.transactionDate BETWEEN :startDate AND :endDate AND f.isDeleted = false")
   BigDecimal sumIncomeByDateRange(@Param("startDate") LocalDate startDate, 
                                    @Param("endDate") LocalDate endDate);
   ```

3. **메모리에서 필터링 (⚠️ 성능 문제)**
   ```java
   // FinancialTransactionServiceImpl.java
   List<FinancialTransaction> allTransactions = financialTransactionRepository.findByIsDeletedFalse();
   
   List<FinancialTransaction> filteredTransactions = allTransactions.stream()
       .filter(t -> branchCode.equals(t.getBranchCode()))
       .filter(t -> !startDate.isAfter(t.getTransactionDate()) && !endDate.isBefore(t.getTransactionDate()))
       .filter(t -> category == null || category.isEmpty() || category.equals(t.getCategory()))
       .filter(t -> transactionType == null || transactionType.isEmpty() || 
               transactionType.equals(t.getTransactionType().name()))
       .collect(Collectors.toList());
   ```

### ❌ 문제점

1. **성능 문제**
   - `findAll()` 후 메모리에서 필터링 → 대량 데이터 처리 시 비효율적
   - 데이터베이스 인덱스 활용 불가
   - 네트워크 트래픽 증가 (불필요한 데이터 전송)

2. **확장성 문제**
   - 필터 조건이 많아질수록 메서드명이 길어짐
   - 조건 조합이 많아질수록 메서드 수가 기하급수적으로 증가
   - 유지보수 어려움

3. **유연성 부족**
   - 사용자가 선택적으로 필터를 적용하는 경우 대응 어려움
   - 동적 검색 조건 처리 불가

---

## 🎯 동적 쿼리 사용 여부 판단

### ✅ 동적 쿼리를 **사용해야 하는 경우**

#### 1. 복잡한 필터링이 필요한 조회 (P0 - 필수)

**시나리오**:
- 재무 거래 목록 조회 (날짜, 금액 범위, 카테고리, 상태, 지점코드 등 여러 조건 조합)
- 구매 요청 목록 조회 (상태, 요청자, 기간, 금액 범위 등)
- 예산 조회 (기간, 지점, 카테고리 등)

**현재 문제**:
```java
// 현재: 메모리에서 필터링 (비효율적)
List<FinancialTransaction> all = repository.findByIsDeletedFalse();
List<FinancialTransaction> filtered = all.stream()
    .filter(t -> branchCode == null || branchCode.equals(t.getBranchCode()))
    .filter(t -> category == null || category.equals(t.getCategory()))
    .filter(t -> transactionType == null || transactionType.equals(t.getTransactionType().name()))
    .filter(t -> startDate == null || !t.getTransactionDate().isBefore(startDate))
    .filter(t -> endDate == null || !t.getTransactionDate().isAfter(endDate))
    .collect(Collectors.toList());
```

**개선안 (동적 쿼리 사용)**:
```java
// Specification 또는 CriteriaBuilder 사용
public List<FinancialTransaction> findTransactions(
        String branchCode, String category, String transactionType,
        LocalDate startDate, LocalDate endDate, BigDecimal minAmount, BigDecimal maxAmount) {
    
    Specification<FinancialTransaction> spec = Specification.where(
        (root, query, cb) -> cb.equal(root.get("isDeleted"), false)
    );
    
    if (branchCode != null) {
        spec = spec.and((root, query, cb) -> 
            cb.equal(root.get("branchCode"), branchCode));
    }
    if (category != null) {
        spec = spec.and((root, query, cb) -> 
            cb.equal(root.get("category"), category));
    }
    if (transactionType != null) {
        spec = spec.and((root, query, cb) -> 
            cb.equal(root.get("transactionType"), TransactionType.valueOf(transactionType)));
    }
    if (startDate != null) {
        spec = spec.and((root, query, cb) -> 
            cb.greaterThanOrEqualTo(root.get("transactionDate"), startDate));
    }
    if (endDate != null) {
        spec = spec.and((root, query, cb) -> 
            cb.lessThanOrEqualTo(root.get("transactionDate"), endDate));
    }
    if (minAmount != null) {
        spec = spec.and((root, query, cb) -> 
            cb.greaterThanOrEqualTo(root.get("amount"), minAmount));
    }
    if (maxAmount != null) {
        spec = spec.and((root, query, cb) -> 
            cb.lessThanOrEqualTo(root.get("amount"), maxAmount));
    }
    
    return repository.findAll(spec);
}
```

**효과**:
- ✅ 데이터베이스 레벨에서 필터링 → 성능 향상
- ✅ 인덱스 활용 가능
- ✅ 네트워크 트래픽 감소
- ✅ 조건 조합 자유롭게 가능

#### 2. 사용자 정의 필터 (P1 - 중요)

**시나리오**:
- 대시보드에서 사용자가 필터를 선택적으로 적용
- 저장된 필터 설정 (즐겨찾기 필터)
- 고급 검색 기능

**예시**:
```java
// 사용자가 선택한 필터 조건을 동적으로 처리
public List<FinancialTransaction> findWithUserFilters(
        Map<String, Object> filters) {
    
    Specification<FinancialTransaction> spec = baseSpecification();
    
    for (Map.Entry<String, Object> filter : filters.entrySet()) {
        String key = filter.getKey();
        Object value = filter.getValue();
        
        if (value == null || (value instanceof String && ((String) value).isEmpty())) {
            continue;
        }
        
        switch (key) {
            case "branchCode":
                spec = spec.and(equalsSpec("branchCode", value));
                break;
            case "category":
                spec = spec.and(equalsSpec("category", value));
                break;
            case "transactionType":
                spec = spec.and(equalsSpec("transactionType", 
                    TransactionType.valueOf((String) value)));
                break;
            case "dateRange":
                // 날짜 범위 처리
                break;
            case "amountRange":
                // 금액 범위 처리
                break;
        }
    }
    
    return repository.findAll(spec);
}
```

#### 3. 통계 쿼리 (P1 - 중요)

**시나리오**:
- 다양한 그룹핑 조건으로 통계 조회
- 동적 집계 함수 선택
- 조건부 집계

**예시**:
```java
// 동적 그룹핑 및 집계
public Map<String, BigDecimal> getStatistics(
        String groupBy, // "category", "month", "branchCode" 등
        List<String> filters) {
    
    CriteriaBuilder cb = entityManager.getCriteriaBuilder();
    CriteriaQuery<Tuple> query = cb.createTupleQuery();
    Root<FinancialTransaction> root = query.from(FinancialTransaction.class);
    
    // 동적 그룹핑
    Expression<?> groupByExpression = root.get(groupBy);
    
    query.select(cb.tuple(
        groupByExpression.alias("group"),
        cb.sum(root.get("amount")).alias("total")
    ));
    
    // 동적 필터 적용
    Predicate predicate = buildPredicate(cb, root, filters);
    query.where(predicate);
    query.groupBy(groupByExpression);
    
    return entityManager.createQuery(query).getResultList()
        .stream()
        .collect(Collectors.toMap(
            t -> t.get("group").toString(),
            t -> (BigDecimal) t.get("total")
        ));
}
```

### ❌ 동적 쿼리를 **사용하지 않아도 되는 경우**

#### 1. 단순 조회 (고정 조건)

**시나리오**:
- ID로 조회
- 특정 상태의 목록 조회 (고정 조건)
- 단일 조건 조회

**예시**:
```java
// 동적 쿼리 불필요
Optional<FinancialTransaction> findById(Long id);
List<FinancialTransaction> findByStatusAndIsDeletedFalse(TransactionStatus status);
```

#### 2. 프로시저로 처리하는 경우

**시나리오**:
- 복잡한 비즈니스 로직이 포함된 경우
- 대량 데이터 처리
- 트랜잭션 일관성이 중요한 경우

**예시**:
```sql
-- 프로시저 내부에서 동적 쿼리 사용 (필요시)
CREATE PROCEDURE GetFinancialStatistics(
    IN p_tenant_id VARCHAR(36),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_code VARCHAR(20),
    -- ...
)
BEGIN
    -- 프로시저 내부에서 동적으로 쿼리 구성 가능
    SET @sql = CONCAT('SELECT ... WHERE tenant_id = ?', 
                      IF(p_branch_code IS NOT NULL, ' AND branch_code = ?', ''));
    -- ...
END;
```

#### 3. 성능이 중요하지 않은 경우

**시나리오**:
- 데이터 양이 적은 경우 (< 1000건)
- 캐싱이 적용된 경우
- 배치 작업 (실시간 성능 불필요)

---

## 🔧 구현 전략

### Phase 1: Specification 패턴 도입 (1주)

**대상**:
- `FinancialTransactionRepository` - 재무 거래 조회
- `PurchaseRequestRepository` - 구매 요청 조회
- `BudgetRepository` - 예산 조회

**작업 내용**:
1. `JpaSpecificationExecutor` 인터페이스 추가
2. `Specification` 빌더 클래스 생성
3. 기존 메모리 필터링 로직을 Specification으로 전환

**예시**:
```java
// Repository
public interface FinancialTransactionRepository 
        extends JpaRepository<FinancialTransaction, Long>,
                JpaSpecificationExecutor<FinancialTransaction> {
    // 기존 메서드 유지 (하위 호환성)
}

// Specification Builder
public class FinancialTransactionSpecifications {
    
    public static Specification<FinancialTransaction> isNotDeleted() {
        return (root, query, cb) -> cb.equal(root.get("isDeleted"), false);
    }
    
    public static Specification<FinancialTransaction> hasBranchCode(String branchCode) {
        return (root, query, cb) -> 
            branchCode == null ? cb.conjunction() : 
            cb.equal(root.get("branchCode"), branchCode);
    }
    
    public static Specification<FinancialTransaction> hasCategory(String category) {
        return (root, query, cb) -> 
            category == null ? cb.conjunction() : 
            cb.equal(root.get("category"), category);
    }
    
    public static Specification<FinancialTransaction> hasTransactionType(TransactionType type) {
        return (root, query, cb) -> 
            type == null ? cb.conjunction() : 
            cb.equal(root.get("transactionType"), type);
    }
    
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
    
    // 테넌트 필터링 (멀티 테넌트 지원)
    public static Specification<FinancialTransaction> hasTenantId(String tenantId) {
        return (root, query, cb) -> 
            tenantId == null ? cb.conjunction() : 
            cb.equal(root.get("tenantId"), tenantId);
    }
}

// Service에서 사용
public List<FinancialTransaction> findTransactions(
        String branchCode, String category, String transactionType,
        LocalDate startDate, LocalDate endDate, BigDecimal minAmount, BigDecimal maxAmount) {
    
    Specification<FinancialTransaction> spec = Specification.where(
        FinancialTransactionSpecifications.isNotDeleted()
    );
    
    // 테넌트 필터링 자동 추가
    String tenantId = TenantContextHolder.getTenantId();
    if (tenantId != null) {
        spec = spec.and(FinancialTransactionSpecifications.hasTenantId(tenantId));
    }
    
    // 동적 필터 추가
    spec = spec.and(FinancialTransactionSpecifications.hasBranchCode(branchCode));
    spec = spec.and(FinancialTransactionSpecifications.hasCategory(category));
    
    if (transactionType != null) {
        spec = spec.and(FinancialTransactionSpecifications.hasTransactionType(
            TransactionType.valueOf(transactionType)));
    }
    
    spec = spec.and(FinancialTransactionSpecifications.dateBetween(startDate, endDate));
    spec = spec.and(FinancialTransactionSpecifications.amountBetween(minAmount, maxAmount));
    
    return repository.findAll(spec);
}
```

### Phase 2: QueryDSL 도입 (선택적, 1주)

**대상**:
- 복잡한 통계 쿼리
- 동적 그룹핑
- 복잡한 조인

**작업 내용**:
1. QueryDSL 의존성 추가
2. Q 클래스 생성
3. 복잡한 쿼리를 QueryDSL로 전환

**예시**:
```java
// QueryDSL 사용
@Repository
public class FinancialTransactionRepositoryCustomImpl 
        implements FinancialTransactionRepositoryCustom {
    
    private final JPAQueryFactory queryFactory;
    
    public FinancialTransactionRepositoryCustomImpl(EntityManager entityManager) {
        this.queryFactory = new JPAQueryFactory(entityManager);
    }
    
    @Override
    public List<FinancialTransactionStatistics> getStatistics(
            String groupBy, Map<String, Object> filters) {
        
        QFinancialTransaction transaction = QFinancialTransaction.financialTransaction;
        
        BooleanBuilder where = new BooleanBuilder();
        where.and(transaction.isDeleted.eq(false));
        
        // 동적 필터 적용
        if (filters.containsKey("branchCode")) {
            where.and(transaction.branchCode.eq((String) filters.get("branchCode")));
        }
        if (filters.containsKey("startDate")) {
            where.and(transaction.transactionDate.goe((LocalDate) filters.get("startDate")));
        }
        if (filters.containsKey("endDate")) {
            where.and(transaction.transactionDate.loe((LocalDate) filters.get("endDate")));
        }
        
        // 동적 그룹핑
        Expression<?> groupByExpression = getGroupByExpression(transaction, groupBy);
        
        return queryFactory
            .select(Projections.constructor(
                FinancialTransactionStatistics.class,
                groupByExpression,
                transaction.amount.sum()
            ))
            .from(transaction)
            .where(where)
            .groupBy(groupByExpression)
            .fetch();
    }
}
```

### Phase 3: 프로시저 내부 동적 쿼리 (선택적)

**시나리오**:
- 복잡한 비즈니스 로직
- 대량 데이터 처리
- 트랜잭션 일관성 중요

**예시**:
```sql
-- 프로시저 내부에서 동적 쿼리 구성
CREATE PROCEDURE GetFinancialStatistics(
    IN p_tenant_id VARCHAR(36),
    IN p_start_date DATE,
    IN p_end_date DATE,
    IN p_branch_code VARCHAR(20),
    IN p_category VARCHAR(50),
    IN p_transaction_type VARCHAR(20),
    OUT p_total_income DECIMAL(15,2),
    OUT p_total_expense DECIMAL(15,2)
)
BEGIN
    SET @sql = 'SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = ''INCOME'' THEN amount ELSE 0 END), 0) as total_income,
        COALESCE(SUM(CASE WHEN transaction_type = ''EXPENSE'' THEN amount ELSE 0 END), 0) as total_expense
    FROM financial_transactions
    WHERE tenant_id = ? AND is_deleted = FALSE';
    
    SET @params = p_tenant_id;
    
    IF p_start_date IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND transaction_date >= ?');
        SET @params = CONCAT(@params, ',', p_start_date);
    END IF;
    
    IF p_end_date IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND transaction_date <= ?');
        SET @params = CONCAT(@params, ',', p_end_date);
    END IF;
    
    IF p_branch_code IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND branch_code = ?');
        SET @params = CONCAT(@params, ',', p_branch_code);
    END IF;
    
    IF p_category IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND category = ?');
        SET @params = CONCAT(@params, ',', p_category);
    END IF;
    
    IF p_transaction_type IS NOT NULL THEN
        SET @sql = CONCAT(@sql, ' AND transaction_type = ?');
        SET @params = CONCAT(@params, ',', p_transaction_type);
    END IF;
    
    -- 동적 쿼리 실행
    PREPARE stmt FROM @sql;
    EXECUTE stmt USING @params;
    DEALLOCATE PREPARE stmt;
END;
```

---

## 📊 우선순위 및 적용 범위

### P0 (필수 - 즉시 적용)

1. **재무 거래 조회** (`FinancialTransactionRepository`)
   - 현재 메모리 필터링 → Specification으로 전환
   - 성능 개선 효과 큼

2. **구매 요청 조회** (`PurchaseRequestRepository`)
   - 복잡한 필터링 조건

3. **예산 조회** (`BudgetRepository`)
   - 기간별, 지점별 조회

### P1 (중요 - 빠른 확장)

1. **통계 쿼리**
   - 동적 그룹핑
   - 조건부 집계

2. **사용자 정의 필터**
   - 저장된 필터 설정
   - 고급 검색

### P2 (선택 - 장기)

1. **QueryDSL 도입**
   - 복잡한 조인
   - 복잡한 통계

2. **프로시저 내부 동적 쿼리**
   - 대량 데이터 처리
   - 복잡한 비즈니스 로직

---

## 🎯 최종 판단

### ✅ 동적 쿼리 사용 권장

**이유**:
1. **성능 개선**: 현재 메모리 필터링 방식은 대량 데이터 처리 시 비효율적
2. **확장성**: 조건 조합이 많아질수록 메서드명 기반 쿼리는 한계
3. **유연성**: 사용자 정의 필터, 고급 검색 기능 지원
4. **멀티 테넌트**: 테넌트 필터링과 다른 필터를 조합하기 쉬움

### 📝 구현 전략

1. **Phase 1**: Specification 패턴 도입 (P0 - 필수)
   - 가장 간단하고 효과적
   - Spring Data JPA와 자연스럽게 통합
   - 테넌트 필터링과 조합 용이

2. **Phase 2**: QueryDSL 도입 (P1 - 선택)
   - 복잡한 통계 쿼리 필요 시
   - 타입 안전성 보장

3. **Phase 3**: 프로시저 내부 동적 쿼리 (P2 - 선택)
   - 대량 데이터 처리 시
   - 복잡한 비즈니스 로직

---

## 📋 체크리스트

### Phase 1: Specification 패턴 도입
- [ ] `FinancialTransactionRepository`에 `JpaSpecificationExecutor` 추가
- [ ] `FinancialTransactionSpecifications` 빌더 클래스 생성
- [ ] 기존 메모리 필터링 로직을 Specification으로 전환
- [ ] 테넌트 필터링 자동 적용
- [ ] 성능 테스트 및 비교

### Phase 2: QueryDSL 도입 (선택)
- [ ] QueryDSL 의존성 추가
- [ ] Q 클래스 생성
- [ ] 복잡한 통계 쿼리 전환

### Phase 3: 프로시저 내부 동적 쿼리 (선택)
- [ ] 프로시저에 동적 쿼리 로직 추가
- [ ] 테스트 및 검증

---

## 🎯 기대 효과

1. **성능 향상**: 데이터베이스 레벨 필터링 → 10~100배 성능 개선 (데이터 양에 따라)
2. **확장성**: 조건 조합 자유롭게 가능
3. **유지보수성**: 코드 중복 제거, 일관된 패턴
4. **멀티 테넌트**: 테넌트 필터링과 자연스럽게 통합

---

**마지막 업데이트**: 2025-11-22  
**다음 단계**: Phase 1 (Specification 패턴 도입) 시작


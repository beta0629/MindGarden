# ERP 시스템 멀티 테넌트 연동 전략

**작성일**: 2025-11-22  
**버전**: 1.0.0  
**목적**: 모든 입점사(테넌트)와 ERP 시스템이 연동되도록 하는 전략 수립

**참고 문서**:
- `ERP_ADVANCEMENT_PLAN.md` - ERP 고도화 계획
- `ERP_WIDGETIZATION_ALIGNED_WITH_ADVANCEMENT.md` - ERP 위젯화 계획
- `ERP_PROCEDURE_BASED_ADVANCEMENT.md` - 프로시저 기반 ERP 고도화

---

## 📋 핵심 원칙

### 1. 모든 입점사와 연동
- ✅ **모든 테넌트가 ERP 기능 사용 가능**
- ✅ **테넌트별 데이터 완전 격리**
- ✅ **업종별 ERP 기능 자동 활성화**
- ✅ **대시보드에서 동적으로 ERP 위젯 구성**

### 2. 멀티 테넌트 아키텍처
- ✅ **TenantContext 기반 자동 필터링**
- ✅ **BaseEntity 상속으로 tenant_id 자동 관리**
- ✅ **프로시저 호출 시 tenant_id 자동 전달**
- ✅ **위젯에서 테넌트 컨텍스트 자동 사용**

---

## 🔧 현재 상태 분석

### ✅ 이미 구현된 부분

1. **멀티 테넌트 인프라**
   - `TenantContext` / `TenantContextHolder` - 테넌트 컨텍스트 관리
   - `TenantIdentifierResolver` - Hibernate 멀티 테넌트 지원
   - `BaseEntity` - tenant_id 필드 포함
   - `TenantContextFilter` - 요청 시 테넌트 컨텍스트 자동 설정

2. **ERP 엔티티 (일부)**
   - `FinancialTransaction` - 재무 거래 (⚠️ BaseEntity 미상속)
   - `PurchaseRequest` - 구매 요청 (⚠️ BaseEntity 미상속)
   - `Budget` - 예산 (⚠️ BaseEntity 미상속)
   - `Item` - 아이템 (⚠️ BaseEntity 미상속)

### ❌ 개선이 필요한 부분

1. **ERP 엔티티 멀티 테넌트 지원**
   - 모든 ERP 엔티티가 `BaseEntity`를 상속받아야 함
   - `tenant_id` 필드가 자동으로 추가되어야 함
   - Hibernate가 자동으로 `WHERE tenant_id = ?` 조건 추가

2. **ERP 서비스 멀티 테넌트 지원**
   - 모든 ERP 서비스에서 `TenantContextHolder` 사용
   - 테넌트 필터링 자동 적용
   - 테넌트 컨텍스트 검증

3. **ERP 프로시저 멀티 테넌트 지원**
   - 프로시저 호출 시 `tenant_id` 파라미터 자동 전달
   - 프로시저 내부에서 테넌트 필터링

4. **ERP 위젯 멀티 테넌트 지원**
   - 위젯에서 테넌트 컨텍스트 자동 사용
   - API 호출 시 tenant_id 자동 포함

---

## 🎯 구현 계획

### Phase 1: ERP 엔티티 멀티 테넌트 전환 (1주)

#### Week 1: BaseEntity 상속 전환

**대상 엔티티**:
- [ ] `FinancialTransaction` → `BaseEntity` 상속
- [ ] `PurchaseRequest` → `BaseEntity` 상속
- [ ] `PurchaseOrder` → `BaseEntity` 상속
- [ ] `Budget` → `BaseEntity` 상속
- [ ] `Item` → `BaseEntity` 상속
- [ ] `AccountingEntry` → `BaseEntity` 상속
- [ ] `Account` → `BaseEntity` 상속
- [ ] `SalaryCalculation` → `BaseEntity` 상속
- [ ] `SalaryProfile` → `BaseEntity` 상속
- [ ] 기타 모든 ERP 엔티티

**작업 내용**:
1. 각 엔티티가 `BaseEntity`를 상속받도록 수정
2. `@EqualsAndHashCode(callSuper = true)` 추가
3. 기존 `id`, `createdAt`, `updatedAt` 필드 제거 (BaseEntity에서 상속)
4. 데이터베이스 마이그레이션 스크립트 작성
   - 기존 데이터에 `tenant_id` 추가 (기본값 설정 필요)
   - 인덱스 추가: `idx_tenant_id`, `idx_tenant_id_created_at` 등

**예시**:
```java
// 변경 전
@Entity
@Table(name = "financial_transactions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FinancialTransaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    // ... 기타 필드
}

// 변경 후
@Entity
@Table(name = "financial_transactions", indexes = {
    @Index(name = "idx_tenant_id", columnList = "tenant_id"),
    @Index(name = "idx_tenant_id_created_at", columnList = "tenant_id,created_at")
})
@Data
@SuperBuilder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class FinancialTransaction extends BaseEntity {
    // id, createdAt, updatedAt은 BaseEntity에서 상속
    // tenant_id도 BaseEntity에서 자동 관리
    
    // ... 기타 필드
}
```

**데이터베이스 마이그레이션**:
```sql
-- V40__add_tenant_id_to_erp_entities.sql

-- FinancialTransaction에 tenant_id 추가
ALTER TABLE financial_transactions 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id;

-- 기존 데이터에 기본 tenant_id 설정 (필요시)
-- UPDATE financial_transactions SET tenant_id = 'default-tenant-id' WHERE tenant_id IS NULL;

-- 인덱스 추가
CREATE INDEX idx_tenant_id ON financial_transactions(tenant_id);
CREATE INDEX idx_tenant_id_created_at ON financial_transactions(tenant_id, created_at);

-- NOT NULL 제약조건 추가 (기존 데이터 처리 후)
-- ALTER TABLE financial_transactions MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL;

-- 다른 ERP 엔티티들도 동일하게 처리
-- ...
```

---

### Phase 2: ERP 서비스 멀티 테넌트 지원 (1주)

#### Week 1: 서비스 레이어 개선

**대상 서비스**:
- [ ] `FinancialTransactionService` / `FinancialTransactionServiceImpl`
- [ ] `PurchaseRequestService` / `PurchaseRequestServiceImpl`
- [ ] `BudgetService` / `BudgetServiceImpl`
- [ ] `ItemService` / `ItemServiceImpl`
- [ ] `ErpService` / `ErpServiceImpl`
- [ ] 기타 모든 ERP 서비스

**작업 내용**:
1. 모든 서비스에서 `TenantContextHolder` 사용
2. 조회 메서드에 테넌트 필터링 자동 적용
3. 생성/수정 시 테넌트 ID 자동 설정
4. 테넌트 컨텍스트 검증 추가

**예시**:
```java
@Service
@RequiredArgsConstructor
public class FinancialTransactionServiceImpl implements FinancialTransactionService {
    
    private final FinancialTransactionRepository repository;
    
    @Override
    @Transactional(readOnly = true)
    public List<FinancialTransactionResponse> getTransactions(
            LocalDate startDate, 
            LocalDate endDate) {
        
        // 테넌트 컨텍스트 자동 사용 (Hibernate가 WHERE tenant_id = ? 자동 추가)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        return repository.findByTransactionDateBetween(startDate, endDate)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }
    
    @Override
    @Transactional
    public FinancialTransactionResponse createTransaction(
            FinancialTransactionRequest request) {
        
        // 테넌트 ID 자동 설정 (BaseEntity의 @PrePersist에서 처리)
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        FinancialTransaction transaction = FinancialTransaction.builder()
                .transactionType(TransactionType.valueOf(request.getTransactionType()))
                .amount(request.getAmount())
                .transactionDate(request.getTransactionDate())
                // tenant_id는 BaseEntity에서 자동 설정됨
                .build();
        
        transaction = repository.save(transaction);
        return toResponse(transaction);
    }
}
```

**BaseTenantService 패턴 적용**:
```java
// BaseTenantService를 상속받아 공통 기능 활용
@Service
@RequiredArgsConstructor
public class FinancialTransactionServiceImpl 
        extends BaseTenantServiceImpl<FinancialTransaction, Long>
        implements FinancialTransactionService {
    
    private final FinancialTransactionRepository repository;
    
    @Override
    protected JpaRepository<FinancialTransaction, Long> getRepository() {
        return repository;
    }
    
    // BaseTenantService의 공통 메서드 활용:
    // - findAllByTenantId()
    // - findByIdAndTenantId()
    // - create()
    // - update()
    // - delete()
}
```

---

### Phase 3: ERP 프로시저 멀티 테넌트 지원 (1주)

#### Week 1: 프로시저 호출 개선

**작업 내용**:
1. 프로시저 호출 시 `tenant_id` 파라미터 자동 전달
2. `BaseProcedureService`에 테넌트 컨텍스트 자동 주입
3. 프로시저 내부에서 테넌트 필터링

**예시**:
```java
@Service
@RequiredArgsConstructor
public abstract class BaseProcedureService {
    
    protected final JdbcTemplate jdbcTemplate;
    protected final DataSource dataSource;
    
    /**
     * 프로시저 호출 공통 메서드 (테넌트 ID 자동 포함)
     */
    protected Map<String, Object> executeProcedure(
            String procedureName,
            Map<String, Object> inputParams,
            List<SqlParameter> outputParams) {
        
        // 테넌트 ID 자동 추가
        String tenantId = TenantContextHolder.getRequiredTenantId();
        inputParams.put("p_tenant_id", tenantId);
        
        SimpleJdbcCall jdbcCall = new SimpleJdbcCall(dataSource)
            .withProcedureName(procedureName);
        
        if (outputParams != null && !outputParams.isEmpty()) {
            jdbcCall.declareParameters(outputParams.toArray(new SqlParameter[0]));
        }
        
        return jdbcCall.execute(inputParams);
    }
}
```

**프로시저 예시**:
```sql
-- 프로시저에 tenant_id 파라미터 추가
CREATE PROCEDURE GetFinancialStatistics(
    IN p_tenant_id VARCHAR(36),  -- 테넌트 ID 추가
    IN p_start_date DATE,
    IN p_end_date DATE,
    OUT p_total_income DECIMAL(15,2),
    OUT p_total_expense DECIMAL(15,2),
    OUT p_net_amount DECIMAL(15,2)
)
BEGIN
    -- 테넌트 필터링 자동 적용
    SELECT 
        COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE 0 END), 0) INTO p_total_income,
        COALESCE(SUM(CASE WHEN transaction_type = 'EXPENSE' THEN amount ELSE 0 END), 0) INTO p_total_expense,
        COALESCE(SUM(CASE WHEN transaction_type = 'INCOME' THEN amount ELSE -amount END), 0) INTO p_net_amount
    FROM financial_transactions
    WHERE tenant_id = p_tenant_id  -- 테넌트 필터링
      AND transaction_date BETWEEN p_start_date AND p_end_date
      AND is_deleted = FALSE;
END;
```

---

### Phase 4: ERP 위젯 멀티 테넌트 지원 (1주)

#### Week 1: 위젯 개선

**작업 내용**:
1. 모든 ERP 위젯에서 테넌트 컨텍스트 자동 사용
2. API 호출 시 tenant_id 자동 포함
3. 위젯 설정에서 테넌트 필터링 옵션 제공

**예시**:
```javascript
// ErpStatsGridWidget.js 개선
const ErpStatsGridWidget = ({ widget, user }) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const config = widget.config || {};
  const dataSource = config.dataSource || {};
  
  useEffect(() => {
    loadStats();
  }, []);
  
  const loadStats = async () => {
    try {
      setLoading(true);
      
      // 테넌트 ID는 백엔드에서 자동으로 TenantContext에서 가져옴
      // 프론트엔드에서는 명시적으로 전달하지 않아도 됨
      const url = dataSource.url || '/api/erp/dashboard/stats';
      const params = dataSource.params || {};
      
      // 필요시 명시적으로 tenantId 전달 (옵션)
      // const tenantId = user?.tenantId || sessionManager.getTenantId();
      // if (tenantId) {
      //   params.tenantId = tenantId;
      // }
      
      const response = await apiGet(url, params);
      
      if (response && response.success) {
        setStats(response.data || response);
      }
    } catch (err) {
      console.error('ErpStatsGridWidget 데이터 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // ... 렌더링 로직
};
```

**API 컨트롤러 예시**:
```java
@RestController
@RequestMapping("/api/erp")
@RequiredArgsConstructor
public class ErpDashboardController extends BaseApiController {
    
    private final ErpDashboardService erpDashboardService;
    
    @GetMapping("/dashboard/stats")
    public ResponseEntity<ApiResponse<ErpStatsResponse>> getDashboardStats(
            @RequestParam(required = false) LocalDate startDate,
            @RequestParam(required = false) LocalDate endDate) {
        
        // TenantContext에서 자동으로 tenant_id 가져옴
        // 별도로 파라미터로 받을 필요 없음
        String tenantId = TenantContextHolder.getRequiredTenantId();
        
        ErpStatsResponse stats = erpDashboardService.getDashboardStats(
                tenantId, 
                startDate, 
                endDate
        );
        
        return success(stats);
    }
}
```

---

### Phase 5: 업종별 ERP 기능 활성화 (1주)

#### Week 1: 업종별 ERP 위젯 자동 구성

**작업 내용**:
1. 테넌트의 `business_type`에 따라 ERP 위젯 자동 구성
2. 업종별 정산 위젯 자동 활성화
3. 대시보드 설정에서 업종별 위젯 템플릿 제공

**예시**:
```java
@Service
@RequiredArgsConstructor
public class ErpWidgetTemplateService {
    
    private final TenantRepository tenantRepository;
    
    /**
     * 업종별 ERP 위젯 템플릿 생성
     */
    public DashboardConfig createErpWidgetTemplate(String tenantId) {
        Tenant tenant = tenantRepository.findByTenantId(tenantId)
                .orElseThrow(() -> new EntityNotFoundException("테넌트를 찾을 수 없습니다."));
        
        String businessType = tenant.getBusinessType();
        
        List<WidgetConfig> widgets = new ArrayList<>();
        
        // 공통 ERP 위젯
        widgets.add(createErpStatsGridWidget());
        widgets.add(createErpManagementGridWidget());
        
        // 업종별 특화 위젯
        switch (businessType.toLowerCase()) {
            case "consultation":
                widgets.add(createConsultationSettlementWidget());
                widgets.add(createConsultationPayrollWidget());
                break;
            case "academy":
                widgets.add(createAcademySettlementWidget());
                widgets.add(createAcademyTuitionWidget());
                break;
            // 기타 업종...
        }
        
        return DashboardConfig.builder()
                .version("1.0")
                .layout(LayoutConfig.builder()
                        .type("grid")
                        .columns(12)
                        .build())
                .widgets(widgets)
                .build();
    }
}
```

---

## 📊 데이터베이스 스키마 개선

### 모든 ERP 테이블에 tenant_id 추가

```sql
-- V40__add_tenant_id_to_erp_entities.sql

-- 1. FinancialTransaction
ALTER TABLE financial_transactions 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_tenant_id (tenant_id),
ADD INDEX idx_tenant_id_created_at (tenant_id, created_at);

-- 2. PurchaseRequest
ALTER TABLE erp_purchase_requests 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

-- 3. PurchaseOrder
ALTER TABLE erp_purchase_orders 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

-- 4. Budget
ALTER TABLE erp_budgets 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

-- 5. Item
ALTER TABLE erp_items 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

-- 6. AccountingEntry
ALTER TABLE accounting_entries 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

-- 7. Account
ALTER TABLE accounts 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

-- 8. SalaryCalculation
ALTER TABLE salary_calculations 
ADD COLUMN tenant_id VARCHAR(36) NULL AFTER id,
ADD INDEX idx_tenant_id (tenant_id);

-- 기타 모든 ERP 테이블에 동일하게 적용
-- ...

-- 기존 데이터 처리 (필요시)
-- UPDATE financial_transactions SET tenant_id = 'default-tenant-id' WHERE tenant_id IS NULL;
-- ...

-- NOT NULL 제약조건 추가 (기존 데이터 처리 후)
-- ALTER TABLE financial_transactions MODIFY COLUMN tenant_id VARCHAR(36) NOT NULL;
```

---

## 🔒 보안 및 데이터 격리

### 1. 테넌트 데이터 격리 보장

- ✅ **Hibernate 멀티 테넌트 필터**: 자동으로 `WHERE tenant_id = ?` 조건 추가
- ✅ **서비스 레이어 검증**: 모든 조회/수정 시 테넌트 ID 검증
- ✅ **프로시저 레벨 검증**: 프로시저 내부에서 테넌트 필터링

### 2. 권한 관리

- ✅ **ERP 권한**: 테넌트별 ERP 기능 접근 권한 관리
- ✅ **역할 기반 접근**: 역할별 ERP 위젯 표시 제어
- ✅ **데이터 접근 제어**: 테넌트 간 데이터 접근 완전 차단

---

## 📝 체크리스트

### Phase 1: 엔티티 전환
- [ ] 모든 ERP 엔티티가 `BaseEntity` 상속
- [ ] 데이터베이스 마이그레이션 스크립트 작성
- [ ] 기존 데이터에 `tenant_id` 설정
- [ ] 인덱스 추가

### Phase 2: 서비스 개선
- [ ] 모든 ERP 서비스에서 `TenantContextHolder` 사용
- [ ] `BaseTenantService` 패턴 적용
- [ ] 테넌트 컨텍스트 검증 추가

### Phase 3: 프로시저 개선
- [ ] `BaseProcedureService`에 테넌트 ID 자동 주입
- [ ] 모든 프로시저에 `tenant_id` 파라미터 추가
- [ ] 프로시저 내부 테넌트 필터링

### Phase 4: 위젯 개선
- [ ] 모든 ERP 위젯에서 테넌트 컨텍스트 사용
- [ ] API 호출 시 테넌트 자동 처리
- [ ] 위젯 설정에서 테넌트 필터링 옵션

### Phase 5: 업종별 활성화
- [ ] 업종별 ERP 위젯 템플릿 생성
- [ ] 대시보드 자동 구성
- [ ] 정산 위젯 업종별 활성화

---

## 🎯 기대 효과

1. **완전한 데이터 격리**: 모든 입점사의 ERP 데이터가 완전히 격리됨
2. **자동화**: 테넌트 컨텍스트 기반으로 자동 필터링
3. **확장성**: 새로운 입점사 추가 시 자동으로 ERP 기능 제공
4. **보안 강화**: 테넌트 간 데이터 접근 완전 차단
5. **유지보수성**: 공통 패턴으로 일관된 코드 구조

---

**마지막 업데이트**: 2025-11-22  
**다음 단계**: Phase 1 (엔티티 전환) 시작


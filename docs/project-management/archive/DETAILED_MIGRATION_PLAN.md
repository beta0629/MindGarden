# MindGarden → Core-Solution 상세 마이그레이션 계획

> **작성일:** 2025-01-XX  
> **목적:** 현재 MindGarden 소스 구조를 Core-Solution으로 전환하는 단계별 상세 실행 계획  
> **현재 상태:** `com.mindgarden.consultation` 패키지, Branch 기반 구조

## 1. 현재 소스 구조 분석

### 1.1 패키지 구조
```
src/main/java/com/mindgarden/consultation/
├── entity/              # 67개 엔티티 파일
│   ├── BaseEntity.java  # tenant_id 없음, branch_id 없음
│   ├── Branch.java      # 지점 엔티티 (branch_code, branch_name)
│   ├── User.java        # 사용자 엔티티
│   └── ...
├── repository/          # 59개 Repository
├── service/            # 189개 Service
├── controller/         # 74개 Controller
├── dto/                # 67개 DTO
└── config/             # 설정 파일들
```

### 1.2 현재 엔티티 구조
- **BaseEntity**: `id`, `created_at`, `updated_at`, `deleted_at`, `is_deleted`, `version`
- **Branch**: `branch_code`, `branch_name`, `branch_type`, `branch_status`
- **User**: `branch` 관계 (ManyToOne)
- **주요 테이블**: `branch_id` 또는 `branch_code` 기반 필터링

### 1.3 현재 데이터베이스 구조
- 데이터베이스명: `core_solution` ✅
- 주요 테이블: `branches`, `users`, `consultations`, `payments`, `settlements`
- **문제점**: `tenant_id` 컬럼 없음, Branch 기반 구조만 존재

## 2. 마이그레이션 전략 (비파괴적 전환)

### 2.1 핵심 원칙
1. **기존 코드 유지**: MindGarden 코드는 그대로 유지
2. **점진적 확장**: Core-Solution 레이어를 추가하여 확장
3. **하위 호환성**: 기존 API는 계속 동작
4. **Feature Flag**: 신구 시스템 병행 운영

### 2.2 전환 단계
```
Step 1: BaseEntity 확장 (tenant_id, branch_id 추가)
    ↓
Step 2: Tenant 엔티티 및 컨텍스트 추가
    ↓
Step 3: 기존 엔티티에 Tenant 관계 추가
    ↓
Step 4: Repository 레벨 필터링 추가
    ↓
Step 5: Service 레벨 TenantContext 적용
    ↓
Step 6: Controller 레벨 Tenant 검증 추가
    ↓
Step 7: 기존 Branch → Tenant 마이그레이션
    ↓
Step 8: 레거시 코드 정리 (선택적)
```

## 3. Phase 0: 기반 구조 확장 (상세 작업)

### 3.1 BaseEntity 확장

**작업 내용:**
```java
// src/main/java/com/mindgarden/consultation/entity/BaseEntity.java
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseEntity {
    // 기존 필드 유지
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @CreatedDate
    private LocalDateTime createdAt;
    
    @LastModifiedDate
    private LocalDateTime updatedAt;
    
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
    
    @Column(name = "is_deleted", nullable = false)
    private Boolean isDeleted = false;
    
    @Version
    private Long version = 0L;
    
    // ✅ 신규 추가: Tenant 필드
    @Column(name = "tenant_id", length = 36)
    private String tenantId;
    
    // ✅ 신규 추가: Branch 필드 (기존 유지)
    @Column(name = "branch_id")
    private Long branchId;
    
    // ✅ 신규 추가: 언어 코드
    @Column(name = "lang_code", length = 10)
    private String langCode = "ko";
    
    // ✅ 신규 추가: 생성자 정보
    @Column(name = "created_by", length = 100)
    private String createdBy;
    
    // ✅ 신규 추가: 수정자 정보
    @Column(name = "updated_by", length = 100)
    private String updatedBy;
}
```

**작업 체크리스트:**
- [ ] BaseEntity.java 수정 (tenant_id, branch_id, lang_code, created_by, updated_by 추가)
- [ ] 모든 엔티티 클래스 재컴파일 확인
- [ ] 데이터베이스 마이그레이션 스크립트 작성
- [ ] 기존 데이터에 대한 기본값 설정 스크립트 작성

**마이그레이션 스크립트:**
```sql
-- V1__add_tenant_fields_to_base_entity.sql
-- 모든 주요 테이블에 tenant_id, branch_id 등 필드 추가

-- 1. users 테이블
ALTER TABLE users 
    ADD COLUMN tenant_id VARCHAR(36) AFTER id,
    ADD COLUMN lang_code VARCHAR(10) DEFAULT 'ko' AFTER updated_at,
    ADD COLUMN created_by VARCHAR(100) AFTER created_at,
    ADD COLUMN updated_by VARCHAR(100) AFTER updated_at;

-- 2. consultations 테이블
ALTER TABLE consultations 
    ADD COLUMN tenant_id VARCHAR(36) AFTER id,
    ADD COLUMN lang_code VARCHAR(10) DEFAULT 'ko',
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100);

-- 3. payments 테이블
ALTER TABLE payments 
    ADD COLUMN tenant_id VARCHAR(36) AFTER id,
    ADD COLUMN lang_code VARCHAR(10) DEFAULT 'ko',
    ADD COLUMN created_by VARCHAR(100),
    ADD COLUMN updated_by VARCHAR(100);

-- ... (다른 주요 테이블들도 동일하게 추가)

-- 4. 기존 데이터에 기본값 설정
-- Branch를 기반으로 tenant_id 설정 (임시)
UPDATE users u
JOIN branches b ON u.branch_id = b.id
SET u.tenant_id = b.branch_code  -- 임시로 branch_code를 tenant_id로 사용
WHERE u.tenant_id IS NULL;

-- ... (다른 테이블들도 동일하게 업데이트)
```

### 3.2 Tenant 엔티티 생성

**작업 내용:**
```java
// src/main/java/com/mindgarden/core/domain/Tenant.java
package com.mindgarden.core.domain;

@Entity
@Table(name = "tenants")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)
public class Tenant extends BaseEntity {
    
    @Column(name = "tenant_id", length = 36, unique = true, nullable = false)
    private String tenantId;  // UUID 형식
    
    @Column(name = "name", length = 255, nullable = false)
    private String name;
    
    @Column(name = "business_type", length = 50)
    private String businessType;  // CONSULTATION, ACADEMY, FOOD_SERVICE 등
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", length = 20)
    private TenantStatus status;
    
    @Column(name = "subscription_plan_id")
    private Long subscriptionPlanId;
    
    @OneToMany(mappedBy = "tenant", cascade = CascadeType.ALL)
    private List<Branch> branches;
    
    public enum TenantStatus {
        PENDING, ACTIVE, SUSPENDED, CLOSED
    }
}
```

**작업 체크리스트:**
- [ ] `src/main/java/com/mindgarden/core/domain/` 패키지 생성
- [ ] Tenant.java 엔티티 클래스 작성
- [ ] TenantRepository.java 인터페이스 작성
- [ ] 데이터베이스 마이그레이션 스크립트 작성
- [ ] 기존 Branch 데이터를 Tenant로 마이그레이션하는 스크립트 작성

**마이그레이션 스크립트:**
```sql
-- V2__create_tenant_table.sql
CREATE TABLE tenants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id VARCHAR(36) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    business_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    subscription_plan_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    is_deleted BOOLEAN DEFAULT FALSE,
    version BIGINT DEFAULT 0,
    tenant_id VARCHAR(36),  -- 자기 참조 (HQ의 경우 NULL)
    branch_id BIGINT,
    lang_code VARCHAR(10) DEFAULT 'ko',
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_business_type (business_type),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 기존 Branch를 Tenant로 마이그레이션
INSERT INTO tenants (tenant_id, name, business_type, status, created_at, updated_at)
SELECT 
    UUID() as tenant_id,
    branch_name as name,
    'CONSULTATION' as business_type,
    CASE 
        WHEN branch_status = 'ACTIVE' THEN 'ACTIVE'
        WHEN branch_status = 'SUSPENDED' THEN 'SUSPENDED'
        WHEN branch_status = 'CLOSED' THEN 'CLOSED'
        ELSE 'PENDING'
    END as status,
    created_at,
    updated_at
FROM branches
WHERE is_deleted = FALSE;

-- Branch 테이블에 tenant_id 추가 및 연결
ALTER TABLE branches ADD COLUMN tenant_id VARCHAR(36) AFTER id;

UPDATE branches b
JOIN tenants t ON b.branch_name = t.name AND b.business_type = 'CONSULTATION'
SET b.tenant_id = t.tenant_id
WHERE b.tenant_id IS NULL;
```

### 3.3 TenantContext 구현

**작업 내용:**
```java
// src/main/java/com/mindgarden/core/context/TenantContext.java
package com.mindgarden.core.context;

public class TenantContext {
    private static final ThreadLocal<String> tenantId = new ThreadLocal<>();
    private static final ThreadLocal<String> branchId = new ThreadLocal<>();
    
    public static void setTenantId(String tenantId) {
        TenantContext.tenantId.set(tenantId);
    }
    
    public static String getTenantId() {
        return tenantId.get();
    }
    
    public static void setBranchId(String branchId) {
        TenantContext.branchId.set(branchId);
    }
    
    public static String getBranchId() {
        return branchId.get();
    }
    
    public static void clear() {
        tenantId.remove();
        branchId.remove();
    }
}
```

**작업 체크리스트:**
- [ ] `src/main/java/com/mindgarden/core/context/` 패키지 생성
- [ ] TenantContext.java 클래스 작성
- [ ] TenantContextHolder.java 클래스 작성 (ThreadLocal 관리)
- [ ] TenantContextFilter.java 작성 (HTTP 요청에서 tenant_id 추출)

### 3.4 TenantContextFilter 구현

**작업 내용:**
```java
// src/main/java/com/mindgarden/core/filter/TenantContextFilter.java
package com.mindgarden.core.filter;

@Component
@Order(1)
public class TenantContextFilter implements Filter {
    
    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        
        // 1. 헤더에서 tenant_id 추출
        String tenantId = httpRequest.getHeader("X-Tenant-Id");
        
        // 2. JWT 토큰에서 tenant_id 추출 (대안)
        if (tenantId == null) {
            tenantId = extractTenantIdFromToken(httpRequest);
        }
        
        // 3. 세션에서 tenant_id 추출 (대안)
        if (tenantId == null) {
            tenantId = extractTenantIdFromSession(httpRequest);
        }
        
        // 4. TenantContext에 설정
        if (tenantId != null) {
            TenantContext.setTenantId(tenantId);
        }
        
        try {
            chain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }
}
```

**작업 체크리스트:**
- [ ] TenantContextFilter.java 작성
- [ ] SecurityConfig에 필터 등록
- [ ] 테스트 코드 작성

## 4. Phase 1: 기존 엔티티 Tenant 연동 (상세 작업)

### 4.1 Branch 엔티티 수정

**작업 내용:**
```java
// src/main/java/com/mindgarden/consultation/entity/Branch.java
@Entity
@Table(name = "branches")
public class Branch extends BaseEntity {
    
    // 기존 필드 유지
    @Column(name = "branch_code")
    private String branchCode;
    
    @Column(name = "branch_name")
    private String branchName;
    
    // ✅ 신규 추가: Tenant 관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id")
    private Tenant tenant;
    
    @Column(name = "tenant_id", insertable = false, updatable = false)
    private String tenantId;
    
    // 기존 필드들 유지...
}
```

**작업 체크리스트:**
- [ ] Branch.java 수정 (Tenant 관계 추가)
- [ ] BranchRepository 수정 (Tenant 기반 쿼리 추가)
- [ ] BranchService 수정 (TenantContext 적용)
- [ ] 테스트 코드 작성

### 4.2 User 엔티티 수정

**작업 내용:**
```java
// src/main/java/com/mindgarden/consultation/entity/User.java
@Entity
@Table(name = "users")
public class User extends BaseEntity {
    
    // 기존 필드 유지
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "branch_id")
    private Branch branch;
    
    // ✅ 신규 추가: Tenant 관계
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tenant_id", referencedColumnName = "tenant_id")
    private Tenant tenant;
    
    // 기존 필드들 유지...
}
```

**작업 체크리스트:**
- [ ] User.java 수정 (Tenant 관계 추가)
- [ ] UserRepository 수정 (Tenant 기반 쿼리 추가)
- [ ] UserService 수정 (TenantContext 적용)
- [ ] 기존 쿼리 수정 (tenant_id 필터 추가)
- [ ] 테스트 코드 작성

### 4.3 주요 엔티티 Tenant 연동 목록

**우선순위별 작업 목록:**

**P0 (즉시 필요):**
- [ ] Branch.java
- [ ] User.java
- [ ] Consultation.java
- [ ] Payment.java
- [ ] Settlement.java

**P1 (빠른 확장):**
- [ ] Client.java
- [ ] Consultant.java
- [ ] Schedule.java
- [ ] Notification.java
- [ ] CommonCode.java

**P2 (중기 확장):**
- [ ] 나머지 엔티티들 (67개 전체)

## 5. Phase 2: Repository 레벨 필터링 (상세 작업)

### 5.1 BaseRepository 확장

**작업 내용:**
```java
// src/main/java/com/mindgarden/core/repository/BaseRepository.java
public interface BaseRepository<T extends BaseEntity, ID extends Serializable> 
        extends JpaRepository<T, ID> {
    
    // ✅ 신규 추가: Tenant 기반 쿼리
    @Query("SELECT e FROM #{#entityName} e WHERE e.tenantId = :tenantId AND e.isDeleted = false")
    List<T> findAllByTenantId(@Param("tenantId") String tenantId);
    
    @Query("SELECT e FROM #{#entityName} e WHERE e.tenantId = :tenantId AND e.id = :id AND e.isDeleted = false")
    Optional<T> findByTenantIdAndId(@Param("tenantId") String tenantId, @Param("id") ID id);
    
    // ✅ 신규 추가: TenantContext 자동 적용
    default List<T> findAllActive() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            return findAllByTenantId(tenantId);
        }
        // HQ의 경우 전체 조회
        return findAll().stream()
            .filter(e -> !e.getIsDeleted())
            .collect(Collectors.toList());
    }
}
```

**작업 체크리스트:**
- [ ] `src/main/java/com/mindgarden/core/repository/` 패키지 생성
- [ ] BaseRepository.java 인터페이스 작성
- [ ] 기존 Repository들이 BaseRepository 상속하도록 수정
- [ ] 테스트 코드 작성

### 5.2 기존 Repository 수정 예시

**작업 내용:**
```java
// src/main/java/com/mindgarden/consultation/repository/UserRepository.java
public interface UserRepository extends BaseRepository<User, Long> {
    
    // 기존 메서드 유지
    Optional<User> findByLoginId(String loginId);
    
    // ✅ 신규 추가: Tenant 기반 쿼리
    @Query("SELECT u FROM User u WHERE u.tenantId = :tenantId AND u.loginId = :loginId")
    Optional<User> findByTenantIdAndLoginId(@Param("tenantId") String tenantId, @Param("loginId") String loginId);
    
    // ✅ 기존 메서드 수정: TenantContext 자동 적용
    default Optional<User> findByLoginIdWithTenant(String loginId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            return findByTenantIdAndLoginId(tenantId, loginId);
        }
        return findByLoginId(loginId);
    }
}
```

**작업 체크리스트:**
- [ ] UserRepository.java 수정
- [ ] ConsultationRepository.java 수정
- [ ] PaymentRepository.java 수정
- [ ] SettlementRepository.java 수정
- [ ] 나머지 Repository들 수정 (59개)
- [ ] 테스트 코드 작성

## 6. Phase 3: Service 레벨 TenantContext 적용 (상세 작업)

### 6.1 BaseService 확장

**작업 내용:**
```java
// src/main/java/com/mindgarden/core/service/BaseService.java
public interface BaseService<T extends BaseEntity, ID extends Serializable> {
    
    // ✅ 신규 추가: Tenant 검증 메서드
    default void validateTenantAccess(String tenantId) {
        String currentTenantId = TenantContext.getTenantId();
        if (currentTenantId != null && !currentTenantId.equals(tenantId)) {
            throw new ForbiddenException("다른 테넌트의 데이터에 접근할 수 없습니다.");
        }
    }
    
    // ✅ 신규 추가: Tenant 자동 설정
    default void setTenantContext(T entity) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && entity.getTenantId() == null) {
            entity.setTenantId(tenantId);
        }
    }
}
```

**작업 체크리스트:**
- [ ] `src/main/java/com/mindgarden/core/service/` 패키지 생성
- [ ] BaseService.java 인터페이스 작성
- [ ] BaseServiceImpl.java 구현체 작성
- [ ] 기존 Service들이 BaseService 상속하도록 수정
- [ ] 테스트 코드 작성

### 6.2 기존 Service 수정 예시

**작업 내용:**
```java
// src/main/java/com/mindgarden/consultation/service/UserService.java
@Service
public class UserService implements BaseService<User, Long> {
    
    @Autowired
    private UserRepository userRepository;
    
    // ✅ 기존 메서드 수정: TenantContext 적용
    public User findByLoginId(String loginId) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            return userRepository.findByTenantIdAndLoginId(tenantId, loginId)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        }
        return userRepository.findByLoginId(loginId)
            .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
    }
    
    // ✅ 신규 추가: Tenant 검증 포함
    public User save(User user) {
        setTenantContext(user);  // Tenant 자동 설정
        validateTenantAccess(user.getTenantId());  // Tenant 검증
        return userRepository.save(user);
    }
}
```

**작업 체크리스트:**
- [ ] UserService.java 수정
- [ ] ConsultationService.java 수정
- [ ] PaymentService.java 수정
- [ ] SettlementService.java 수정
- [ ] 나머지 Service들 수정 (189개)
- [ ] 테스트 코드 작성

## 7. Phase 4: Controller 레벨 Tenant 검증 (상세 작업)

### 7.1 BaseController 확장

**작업 내용:**
```java
// src/main/java/com/mindgarden/core/controller/BaseController.java
@RestController
@RequestMapping("/api")
public abstract class BaseController {
    
    // ✅ 신규 추가: Tenant 검증 어노테이션
    @Target(ElementType.METHOD)
    @Retention(RetentionPolicy.RUNTIME)
    public @interface RequireTenant {
        boolean required() default true;
    }
    
    // ✅ 신규 추가: Tenant 검증 AOP
    @Before("@annotation(com.mindgarden.core.controller.BaseController.RequireTenant)")
    public void validateTenant(JoinPoint joinPoint) {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new UnauthorizedException("테넌트 정보가 필요합니다.");
        }
    }
}
```

**작업 체크리스트:**
- [ ] `src/main/java/com/mindgarden/core/controller/` 패키지 생성
- [ ] BaseController.java 클래스 작성
- [ ] RequireTenant 어노테이션 작성
- [ ] Tenant 검증 AOP 작성
- [ ] 테스트 코드 작성

### 7.2 기존 Controller 수정 예시

**작업 내용:**
```java
// src/main/java/com/mindgarden/consultation/controller/UserController.java
@RestController
@RequestMapping("/api/users")
public class UserController extends BaseController {
    
    @Autowired
    private UserService userService;
    
    // ✅ 기존 메서드 수정: Tenant 검증 추가
    @GetMapping("/{id}")
    @RequireTenant
    public ResponseEntity<User> getUser(@PathVariable Long id) {
        User user = userService.findById(id);
        validateTenantAccess(user.getTenantId());  // Tenant 검증
        return ResponseEntity.ok(user);
    }
    
    // ✅ 신규 추가: Tenant 기반 목록 조회
    @GetMapping
    @RequireTenant
    public ResponseEntity<List<User>> getUsers() {
        String tenantId = TenantContext.getTenantId();
        List<User> users = userService.findAllByTenantId(tenantId);
        return ResponseEntity.ok(users);
    }
}
```

**작업 체크리스트:**
- [ ] UserController.java 수정
- [ ] ConsultationController.java 수정
- [ ] PaymentController.java 수정
- [ ] 나머지 Controller들 수정 (74개)
- [ ] 테스트 코드 작성

## 8. 작업 우선순위 및 일정

### 8.1 Phase 0 (기반 구조 확장) - 2주

**Week 1:**
- [ ] Day 1-2: BaseEntity 확장 및 마이그레이션 스크립트 작성
- [ ] Day 3-4: Tenant 엔티티 생성 및 마이그레이션
- [ ] Day 5: TenantContext 구현

**Week 2:**
- [ ] Day 1-2: TenantContextFilter 구현
- [ ] Day 3-4: 테스트 코드 작성 및 검증
- [ ] Day 5: 문서화 및 리뷰

### 8.2 Phase 1 (엔티티 Tenant 연동) - 4주

**Week 1:**
- [ ] Day 1-2: Branch 엔티티 수정
- [ ] Day 3-4: User 엔티티 수정
- [ ] Day 5: Consultation 엔티티 수정

**Week 2:**
- [ ] Day 1-2: Payment 엔티티 수정
- [ ] Day 3-4: Settlement 엔티티 수정
- [ ] Day 5: 테스트 코드 작성

**Week 3-4:**
- [ ] 나머지 P1 엔티티들 수정
- [ ] 통합 테스트
- [ ] 문서화

### 8.3 Phase 2 (Repository 필터링) - 2주

**Week 1:**
- [ ] Day 1-2: BaseRepository 확장
- [ ] Day 3-4: 주요 Repository 수정 (User, Consultation, Payment)
- [ ] Day 5: 테스트 코드 작성

**Week 2:**
- [ ] Day 1-3: 나머지 Repository 수정
- [ ] Day 4-5: 통합 테스트 및 검증

### 8.4 Phase 3 (Service TenantContext) - 3주

**Week 1:**
- [ ] Day 1-2: BaseService 확장
- [ ] Day 3-4: 주요 Service 수정
- [ ] Day 5: 테스트 코드 작성

**Week 2-3:**
- [ ] 나머지 Service 수정
- [ ] 통합 테스트
- [ ] 문서화

### 8.5 Phase 4 (Controller 검증) - 2주

**Week 1:**
- [ ] Day 1-2: BaseController 확장
- [ ] Day 3-4: 주요 Controller 수정
- [ ] Day 5: 테스트 코드 작성

**Week 2:**
- [ ] 나머지 Controller 수정
- [ ] 통합 테스트
- [ ] 문서화

### 8.6 전체 일정 요약
- **Phase 0**: 2주
- **Phase 1**: 4주
- **Phase 2**: 2주
- **Phase 3**: 3주
- **Phase 4**: 2주
- **총 기간**: 13주 (약 3개월)

## 9. 리스크 관리 및 대응

### 9.1 기술적 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 기존 코드 호환성 문제 | 높음 | Feature Flag 기반 점진적 전환, 기존 코드 유지 |
| 데이터 마이그레이션 실패 | 높음 | 단계적 마이그레이션, 롤백 스크립트 준비 |
| 성능 저하 | 중간 | 인덱스 최적화, 쿼리 튜닝, 캐싱 전략 |
| 멀티테넌시 데이터 격리 오류 | 높음 | 철저한 테스트, 권한 검증 강화 |

### 9.2 운영 리스크
| 리스크 | 영향도 | 대응 방안 |
|--------|--------|----------|
| 서비스 중단 | 높음 | Blue/Green 배포, 단계적 롤아웃 |
| 데이터 손실 | 높음 | 백업 필수, 마이그레이션 전 검증 |
| 사용자 혼란 | 중간 | 명확한 안내, 교육 자료 제공 |

## 10. 성공 지표 (KPI)

### 10.1 개발 완료 지표
- [ ] BaseEntity 확장 완료
- [ ] Tenant 엔티티 생성 완료
- [ ] TenantContext 구현 완료
- [ ] 주요 엔티티 (P0) Tenant 연동 완료
- [ ] Repository 필터링 구현 완료
- [ ] Service TenantContext 적용 완료
- [ ] Controller 검증 구현 완료

### 10.2 품질 지표
- 멀티테넌시 격리 검증: 100% 통과
- API 응답 시간: <500ms (95 percentile)
- 데이터 마이그레이션 오류: 0건
- 테스트 커버리지: >80%

## 11. 다음 단계

### 11.1 즉시 시작 가능 항목
1. **BaseEntity 확장**
   - [ ] BaseEntity.java 수정
   - [ ] 마이그레이션 스크립트 작성
   - [ ] 테스트 코드 작성

2. **Tenant 엔티티 생성**
   - [ ] Tenant.java 작성
   - [ ] TenantRepository.java 작성
   - [ ] 마이그레이션 스크립트 작성

3. **TenantContext 구현**
   - [ ] TenantContext.java 작성
   - [ ] TenantContextFilter.java 작성
   - [ ] 테스트 코드 작성

### 11.2 협의 필요 항목
- [ ] 작업 우선순위 확정
- [ ] 개발 일정 확정
- [ ] 리소스 배정
- [ ] 테스트 환경 구성

---

**결론:** 현재 MindGarden 소스 구조를 Core-Solution으로 전환하는 것은 **비파괴적 점진적 확장**으로 가능하며, **Phase 0부터 단계적으로 진행하여 약 13주 내 완료 가능**합니다. 기존 코드를 유지하면서 신규 레이어를 추가하여 안전하게 전환할 수 있습니다.


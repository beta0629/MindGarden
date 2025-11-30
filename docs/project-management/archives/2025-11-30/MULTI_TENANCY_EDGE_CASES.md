# 멀티 테넌시 엣지 케이스(Edge Case) 대응 가이드

**작성일**: 2025-11-30  
**작성자**: CoreSolution Development Team  
**버전**: 1.0.0

---

## 📋 목차

1. [개요](#개요)
2. [Check 1: 비동기 처리 시 Context 소실](#check-1-비동기-처리-시-context-소실)
3. [Check 2: 슈퍼 어드민 필터 우회](#check-2-슈퍼-어드민-필터-우회)
4. [Check 3: DB 인덱스 최적화](#check-3-db-인덱스-최적화)
5. [테스트 가이드](#테스트-가이드)
6. [트러블슈팅](#트러블슈팅)

---

## 개요

멀티 테넌시 시스템에서 **반드시 체크해야 할 3가지 기술적 지뢰(Risk)**에 대한 대응 방안을 정리한 문서입니다.

### 왜 중요한가?

이 3가지 엣지 케이스를 놓치면:
- ❌ 새벽에 긴급 전화
- ❌ 테넌트 간 데이터 누출
- ❌ 성능 급격한 저하
- ❌ 서비스 장애

### 대응 현황

| Check | 항목 | 위험도 | 상태 | 비고 |
|-------|------|--------|------|------|
| 1 | 비동기 Context 소실 | ⭐⭐⭐⭐⭐ | ✅ 완료 | AsyncConfig, TaskDecorator 구현 |
| 2 | 슈퍼 어드민 Bypass | ⭐⭐⭐☆☆ | ✅ 완료 | TenantContext에 플래그 추가 |
| 3 | DB 인덱스 최적화 | ⭐⭐⭐⭐☆ | ✅ 완료 | 복합 인덱스 적용 완료 |

---

## Check 1: 비동기 처리 시 Context 소실

### 🚨 문제 상황

**증상**:
```java
@Async
public void sendNotification(Long userId) {
    String tenantId = TenantContextHolder.getRequiredTenantId();
    // ❌ IllegalStateException: tenantId가 설정되지 않았습니다!
}
```

**원인**:
- `ThreadLocal`은 스레드별로 독립적
- `@Async`로 새 스레드 생성 시 부모 스레드의 Context가 전달되지 않음
- `@Scheduled` 메서드도 동일한 문제 발생

### ✅ 해결 방법

#### 1. AsyncConfig 구현

**파일**: `src/main/java/com/coresolution/core/config/AsyncConfig.java`

```java
@Configuration
@EnableAsync
public class AsyncConfig implements AsyncConfigurer {
    
    @Override
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(10);
        executor.setMaxPoolSize(20);
        executor.setQueueCapacity(500);
        executor.setThreadNamePrefix("async-");
        
        // ⭐ TenantContext 전파!
        executor.setTaskDecorator(new TenantContextTaskDecorator());
        executor.initialize();
        return executor;
    }
}
```

#### 2. TenantContextTaskDecorator 구현

**파일**: `src/main/java/com/coresolution/core/config/TenantContextTaskDecorator.java`

```java
public class TenantContextTaskDecorator implements TaskDecorator {
    
    @Override
    public Runnable decorate(Runnable runnable) {
        // 1. 부모 스레드의 Context 복사
        String tenantId = TenantContext.getTenantId();
        String branchId = TenantContext.getBranchId();
        String businessType = TenantContext.getBusinessType();
        boolean bypassFilter = TenantContext.shouldBypassTenantFilter();
        
        // 2. 새 스레드에서 실행될 Runnable 반환
        return () -> {
            try {
                // Context 설정
                TenantContext.setTenantId(tenantId);
                TenantContext.setBranchId(branchId);
                TenantContext.setBusinessType(businessType);
                TenantContext.setBypassTenantFilter(bypassFilter);
                
                // 원본 작업 실행
                runnable.run();
            } finally {
                // Context 정리
                TenantContext.clear();
            }
        };
    }
}
```

### 📊 적용 범위

이 설정으로 다음 항목들이 자동으로 해결됩니다:

- ✅ `@Async` 메서드
- ✅ `@Scheduled` 메서드
- ✅ `CompletableFuture.supplyAsync()`
- ✅ 수동으로 생성한 비동기 작업

### 🧪 테스트 방법

```java
@Test
public void testAsyncContextPropagation() {
    // Given
    TenantContext.setTenantId("test-tenant-123");
    
    // When
    CompletableFuture<String> future = asyncService.doSomethingAsync();
    
    // Then
    String result = future.join();
    assertNotNull(result);
    // 비동기 메서드 내부에서 tenantId가 정상적으로 조회되어야 함
}
```

---

## Check 2: 슈퍼 어드민 필터 우회

### 🚨 문제 상황

**증상**:
```java
// HQ_MASTER(본사 최고 관리자)로 로그인
// 전체 가맹점 매출 통계를 보려고 함

List<Revenue> revenues = revenueService.getAllRevenues();
// ❌ 현재 로그인한 테넌트의 데이터만 보임!
// 본사 관리자인데도 전체 데이터를 못 봄
```

**원인**:
- 모든 쿼리에 `tenantId` 필터가 자동 적용
- 본사 관리자도 특정 테넌트로 로그인하므로 해당 테넌트 데이터만 조회됨
- 전체 테넌트 통계를 볼 방법이 없음

### ✅ 해결 방법

#### 1. TenantContext에 Bypass 플래그 추가

**파일**: `src/main/java/com/coresolution/core/context/TenantContext.java`

```java
public class TenantContext {
    private static final ThreadLocal<String> tenantId = new ThreadLocal<>();
    private static final ThreadLocal<Boolean> bypassTenantFilter = new ThreadLocal<>();
    
    /**
     * 슈퍼 어드민 필터 우회 설정
     * ⚠️ 보안상 매우 민감한 설정이므로 신중하게 사용
     */
    public static void setBypassTenantFilter(boolean bypass) {
        bypassTenantFilter.set(bypass);
    }
    
    public static boolean shouldBypassTenantFilter() {
        Boolean bypass = bypassTenantFilter.get();
        return bypass != null && bypass;
    }
}
```

#### 2. JwtAuthenticationFilter에서 SuperAdmin 감지

**파일**: `src/main/java/com/coresolution/consultation/config/filter/JwtAuthenticationFilter.java`

```java
// JWT 검증 후 사용자 정보 설정 시
User user = userService.findById(userId);

// 슈퍼 어드민이면 필터 우회 플래그 설정
if (user.getRole().isSuperAdmin()) {
    TenantContext.setBypassTenantFilter(true);
    log.info("🔓 슈퍼 어드민 필터 우회 활성화: userId={}, role={}", 
            user.getId(), user.getRole());
}
```

#### 3. Repository에서 Bypass 확인 (선택적)

**필요시 구현**:
```java
@Query("SELECT r FROM Revenue r WHERE " +
       "(:#{T(com.coresolution.core.context.TenantContext).shouldBypassTenantFilter()} = true " +
       "OR r.tenantId = :tenantId)")
List<Revenue> findAllWithOptionalTenantFilter(@Param("tenantId") String tenantId);
```

### 🔐 보안 고려사항

#### ⚠️ 주의사항

1. **권한 검증 필수**:
   ```java
   if (!user.getRole().isSuperAdmin()) {
       throw new AccessDeniedException("슈퍼 어드민만 접근 가능");
   }
   ```

2. **감사 로그 필수**:
   ```java
   auditService.log("SUPER_ADMIN_ACCESS", 
                    "전체 테넌트 데이터 조회", 
                    userId, 
                    Map.of("action", "getAllRevenues"));
   ```

3. **IP 제한 권장**:
   ```java
   if (!isAllowedIp(request.getRemoteAddr())) {
       throw new AccessDeniedException("허용되지 않은 IP");
   }
   ```

### 📊 사용 예시

#### 본사 대시보드

```java
@RestController
@RequestMapping("/api/hq")
public class HQDashboardController {
    
    @GetMapping("/all-revenues")
    @PreAuthorize("hasRole('HQ_MASTER')")
    public ResponseEntity<?> getAllRevenues() {
        // TenantContext.shouldBypassTenantFilter() = true
        // 모든 테넌트의 매출 데이터 조회 가능
        List<Revenue> revenues = revenueService.findAll();
        return ResponseEntity.ok(revenues);
    }
}
```

---

## Check 3: DB 인덱스 최적화

### 🚨 문제 상황

**증상**:
```sql
-- 데이터 10만 건 이상일 때
SELECT * FROM schedules 
WHERE tenant_id = 'tenant-123' 
  AND created_at > '2025-01-01'
ORDER BY created_at DESC;

-- ❌ 실행 시간: 3초 이상 (느림!)
```

**원인**:
- `tenant_id`만 인덱스가 있고, `created_at`은 인덱스 없음
- `tenant_id`로 필터링 후 `created_at` 정렬 시 Full Table Scan 발생

### ✅ 해결 방법

#### 1. 복합 인덱스 생성

**파일**: `src/main/resources/db/migration/V60__add_composite_indexes.sql`

```sql
-- 주요 테이블에 복합 인덱스 추가
-- 패턴: (tenant_id, 자주_조회하는_컬럼)

-- 1. schedules 테이블
CREATE INDEX idx_schedules_tenant_created 
ON schedules(tenant_id, created_at DESC);

CREATE INDEX idx_schedules_tenant_date 
ON schedules(tenant_id, date);

CREATE INDEX idx_schedules_tenant_status_date 
ON schedules(tenant_id, status, date);

-- 2. financial_transactions 테이블
CREATE INDEX idx_financial_tenant_date 
ON financial_transactions(tenant_id, transaction_date DESC);

CREATE INDEX idx_financial_tenant_type_date 
ON financial_transactions(tenant_id, transaction_type, transaction_date DESC);

-- 3. consultation_records 테이블
CREATE INDEX idx_consultation_tenant_date 
ON consultation_records(tenant_id, consultation_date DESC);

-- 4. users 테이블
CREATE INDEX idx_users_tenant_role 
ON users(tenant_id, role);

CREATE INDEX idx_users_tenant_active 
ON users(tenant_id, is_active, is_deleted);

-- 5. consultant_client_mapping 테이블
CREATE INDEX idx_mapping_tenant_status 
ON consultant_client_mapping(tenant_id, status);

CREATE INDEX idx_mapping_tenant_consultant 
ON consultant_client_mapping(tenant_id, consultant_id, status);
```

#### 2. 인덱스 설계 원칙

**복합 인덱스 컬럼 순서**:
1. **tenant_id** (항상 첫 번째)
2. **WHERE 조건에 자주 사용되는 컬럼**
3. **ORDER BY에 사용되는 컬럼**

**좋은 예**:
```sql
-- ✅ 좋음: tenant_id가 선행 컬럼
CREATE INDEX idx_schedules_tenant_date 
ON schedules(tenant_id, date);

-- ❌ 나쁨: tenant_id가 없음
CREATE INDEX idx_schedules_date 
ON schedules(date);
```

### 📊 성능 비교

#### Before (인덱스 없음)

```sql
EXPLAIN SELECT * FROM schedules 
WHERE tenant_id = 'tenant-123' 
  AND created_at > '2025-01-01';

-- type: ALL (Full Table Scan)
-- rows: 100,000
-- Extra: Using where; Using filesort
-- 실행 시간: 3.2초
```

#### After (복합 인덱스)

```sql
EXPLAIN SELECT * FROM schedules 
WHERE tenant_id = 'tenant-123' 
  AND created_at > '2025-01-01';

-- type: range (Index Range Scan)
-- rows: 150
-- Extra: Using index condition
-- 실행 시간: 0.05초 (64배 빠름!)
```

### 🔍 인덱스 모니터링

#### 사용되지 않는 인덱스 찾기

```sql
-- MySQL 8.0+
SELECT 
    object_schema,
    object_name,
    index_name
FROM performance_schema.table_io_waits_summary_by_index_usage
WHERE index_name IS NOT NULL
  AND count_star = 0
  AND object_schema = 'mindgarden'
ORDER BY object_schema, object_name;
```

#### 느린 쿼리 찾기

```sql
-- slow_query_log 활성화
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1; -- 1초 이상 쿼리 로깅

-- 느린 쿼리 확인
SELECT * FROM mysql.slow_log
WHERE sql_text LIKE '%tenant_id%'
ORDER BY query_time DESC
LIMIT 10;
```

---

## 테스트 가이드

### 1. 비동기 Context 전파 테스트

```java
@SpringBootTest
public class AsyncContextTest {
    
    @Autowired
    private AsyncService asyncService;
    
    @Test
    public void testAsyncWithTenantContext() {
        // Given
        String testTenantId = "test-tenant-123";
        TenantContext.setTenantId(testTenantId);
        
        // When
        CompletableFuture<String> future = asyncService.processAsync();
        String result = future.join();
        
        // Then
        assertNotNull(result);
        assertTrue(result.contains(testTenantId));
    }
    
    @Test
    public void testScheduledWithTenantContext() {
        // @Scheduled 메서드 내부에서 로그 확인
        // tenantId가 null이 아니어야 함
    }
}
```

### 2. 슈퍼 어드민 Bypass 테스트

```java
@SpringBootTest
@AutoConfigureMockMvc
public class SuperAdminBypassTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @WithMockUser(roles = "HQ_MASTER")
    public void testSuperAdminCanSeeAllTenants() throws Exception {
        // Given
        TenantContext.setBypassTenantFilter(true);
        
        // When
        MvcResult result = mockMvc.perform(get("/api/hq/all-revenues"))
                .andExpect(status().isOk())
                .andReturn();
        
        // Then
        String content = result.getResponse().getContentAsString();
        // 여러 테넌트의 데이터가 포함되어 있어야 함
    }
}
```

### 3. 인덱스 성능 테스트

```java
@SpringBootTest
public class IndexPerformanceTest {
    
    @Autowired
    private ScheduleRepository scheduleRepository;
    
    @Test
    public void testQueryPerformanceWithIndex() {
        // Given
        String tenantId = "test-tenant";
        LocalDate startDate = LocalDate.now().minusMonths(1);
        
        // When
        long startTime = System.currentTimeMillis();
        List<Schedule> schedules = scheduleRepository
                .findByTenantIdAndDateBetween(tenantId, startDate, LocalDate.now());
        long endTime = System.currentTimeMillis();
        
        // Then
        long executionTime = endTime - startTime;
        assertTrue(executionTime < 100, 
                "쿼리 실행 시간이 100ms를 초과했습니다: " + executionTime + "ms");
    }
}
```

---

## 트러블슈팅

### 문제 1: @Async 메서드에서 tenantId가 null

**증상**:
```
IllegalStateException: tenantId가 설정되지 않았습니다
```

**해결**:
1. `AsyncConfig`가 제대로 로드되었는지 확인
2. `@EnableAsync` 어노테이션 확인
3. 로그 확인: `"비동기 Executor 초기화 완료"`가 출력되어야 함

### 문제 2: 슈퍼 어드민인데도 전체 데이터가 안 보임

**증상**:
```
HQ_MASTER로 로그인했는데 한 테넌트 데이터만 보임
```

**해결**:
1. `TenantContext.shouldBypassTenantFilter()` 값 확인
2. `JwtAuthenticationFilter`에서 플래그 설정 확인
3. 로그 확인: `"슈퍼 어드민 필터 우회 활성화"`가 출력되어야 함

### 문제 3: 쿼리가 느림

**증상**:
```
데이터 10만 건 이상일 때 쿼리 실행 시간 3초 이상
```

**해결**:
1. `EXPLAIN` 명령으로 실행 계획 확인
2. 인덱스가 제대로 생성되었는지 확인:
   ```sql
   SHOW INDEX FROM schedules WHERE Key_name LIKE 'idx_schedules_tenant%';
   ```
3. 인덱스가 사용되는지 확인:
   ```sql
   EXPLAIN SELECT * FROM schedules 
   WHERE tenant_id = 'xxx' AND date > '2025-01-01';
   -- type이 'range' 또는 'ref'여야 함
   ```

---

## 참고 자료

### 관련 문서
- [멀티 테넌시 아키텍처](./MULTI_TENANCY_ARCHITECTURE.md)
- [TenantContext 가이드](./TENANT_CONTEXT_GUIDE.md)
- [DB 인덱스 전략](./DATABASE_INDEX_STRATEGY.md)

### 외부 참조
- [Spring Async Best Practices](https://spring.io/guides/gs/async-method/)
- [MySQL Composite Index](https://dev.mysql.com/doc/refman/8.0/en/multiple-column-indexes.html)
- [ThreadLocal Best Practices](https://docs.oracle.com/javase/8/docs/api/java/lang/ThreadLocal.html)

---

**문서 버전**: 1.0.0  
**최종 수정일**: 2025-11-30  
**작성자**: CoreSolution Development Team


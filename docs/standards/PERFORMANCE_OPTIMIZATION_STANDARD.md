# 성능 최적화 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-03  
**상태**: 공식 표준

---

## 📌 개요

MindGarden 프로젝트의 성능 최적화 표준입니다.  
캐싱 전략, 쿼리 최적화, 성능 모니터링 등을 정의합니다.

### 참조 문서
- [백엔드 코딩 표준](./BACKEND_CODING_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [API 설계 표준](./API_DESIGN_STANDARD.md)

### 구현 위치
- **캐시 설정**: `src/main/java/com/coresolution/core/config/CacheConfig.java`
- **캐시 서비스**: `src/main/java/com/coresolution/core/service/CacheStatsService.java`
- **프론트엔드 캐시**: `frontend/src/utils/apiCache.js`

---

## 🎯 성능 최적화 원칙

### 1. 캐싱 우선
```
자주 조회되는 데이터는 캐싱하여 성능 향상
```

**원칙**:
- ✅ 공통코드 캐싱
- ✅ 사용자 정보 캐싱
- ✅ 통계 데이터 캐싱
- ✅ API 응답 캐싱 (프론트엔드)

### 2. 쿼리 최적화
```
데이터베이스 쿼리는 인덱스를 활용하여 최적화
```

**원칙**:
- ✅ 인덱스 활용
- ✅ N+1 쿼리 방지
- ✅ 페이징 필수
- ✅ 불필요한 조인 제거

### 3. 성능 모니터링
```
성능 지표를 지속적으로 모니터링
```

**원칙**:
- ✅ 응답 시간 모니터링
- ✅ 쿼리 성능 모니터링
- ✅ 캐시 히트율 추적
- ✅ 리소스 사용량 모니터링

---

## 💾 캐싱 전략

### 1. 백엔드 캐싱

#### 캐시 설정
```java
@Configuration
@EnableCaching
public class CacheConfig {
    
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // 캐시 이름 사전 등록
        cacheManager.setCacheNames(Arrays.asList(
            "tenantCodes",      // 테넌트별 공통코드
            "coreCodes",        // 코어 공통코드
            "codeMetadata"      // 코드 그룹 메타데이터
        ));
        
        return cacheManager;
    }
}
```

#### 캐시 사용 예시
```java
@Service
public class CommonCodeService {
    
    /**
     * 테넌트별 공통코드 조회 (캐싱)
     */
    @Cacheable(value = "tenantCodes", key = "#tenantId + ':' + #codeGroup")
    public List<CommonCode> findByTenantAndCodeGroup(String tenantId, String codeGroup) {
        return commonCodeRepository.findByTenantIdAndCodeGroup(tenantId, codeGroup);
    }
    
    /**
     * 공통코드 생성 (캐시 무효화)
     */
    @CacheEvict(value = "tenantCodes", allEntries = true)
    public CommonCode create(CommonCodeCreateRequest request) {
        // 생성 로직
    }
    
    /**
     * 공통코드 수정 (캐시 무효화)
     */
    @CacheEvict(value = "tenantCodes", key = "#tenantId + ':' + #codeGroup")
    public CommonCode update(Long id, CommonCodeUpdateRequest request) {
        // 수정 로직
    }
}
```

### 2. 프론트엔드 캐싱

#### API 캐시 유틸리티
```javascript
// utils/apiCache.js
class ApiCache {
    constructor() {
        this.cache = new Map();
        this.defaultTTL = 5 * 60 * 1000; // 5분
    }
    
    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;
        
        if (Date.now() > item.expiresAt) {
            this.cache.delete(key);
            return null;
        }
        
        return item.data;
    }
    
    set(key, data, ttl = this.defaultTTL) {
        this.cache.set(key, {
            data,
            expiresAt: Date.now() + ttl
        });
    }
}
```

#### 사용 예시
```javascript
// API 호출 시 캐싱
const cacheKey = `users:${tenantId}`;
const cached = apiCache.get(cacheKey);

if (cached) {
    return cached; // 캐시 히트
}

// 캐시 미스 - API 호출
const users = await apiGet(ADMIN_API.USERS);
apiCache.set(cacheKey, users, 5 * 60 * 1000); // 5분 캐싱

return users;
```

### 3. 캐시 키 전략

#### 백엔드 캐시 키
```
테넌트 코드: "{tenantId}:{codeGroup}"
코어 코드: "{codeGroup}"
사용자 정보: "user:{userId}"
```

#### 프론트엔드 캐시 키
```
API 응답: "{endpoint}:{params}"
사용자 정보: "user:{userId}"
공통코드: "commonCodes:{codeGroup}"
```

---

## 🔍 쿼리 최적화

### 1. 인덱스 활용

#### 필수 인덱스
```sql
-- 테넌트 ID 인덱스 (모든 테이블)
CREATE INDEX idx_tenant_id ON users(tenant_id);

-- 복합 인덱스 (자주 함께 조회되는 컬럼)
CREATE INDEX idx_tenant_role ON users(tenant_id, role);

-- 외래키 인덱스
CREATE INDEX idx_user_id ON consultations(user_id);
```

#### 인덱스 전략
- ✅ `tenant_id` 컬럼은 항상 인덱스 생성
- ✅ 자주 조회되는 컬럼 조합에 복합 인덱스
- ✅ 외래키는 자동 인덱스 생성 확인

### 2. N+1 쿼리 방지

#### 문제 예시
```java
// ❌ N+1 쿼리 문제
List<User> users = userRepository.findAll();
for (User user : users) {
    List<Consultation> consultations = consultationRepository.findByUserId(user.getId());
    // 각 사용자마다 쿼리 실행 (N+1)
}
```

#### 해결 방법
```java
// ✅ JOIN FETCH 사용
@Query("SELECT u FROM User u LEFT JOIN FETCH u.consultations WHERE u.tenantId = :tenantId")
List<User> findAllWithConsultations(@Param("tenantId") String tenantId);

// ✅ Batch Size 설정
@Entity
@BatchSize(size = 20)
public class User {
    @OneToMany(mappedBy = "user")
    private List<Consultation> consultations;
}
```

### 3. 페이징 필수

#### 페이징 구현
```java
// ✅ 권장: 페이징 사용
@GetMapping("/api/v1/users")
public ResponseEntity<ApiResponse<Page<UserResponse>>> getUsers(
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size,
        Pageable pageable) {
    
    Page<User> users = userRepository.findByTenantId(tenantId, pageable);
    return success(users.map(UserResponse::from));
}

// ❌ 금지: 전체 조회
List<User> users = userRepository.findAll(); // 메모리 부족 가능
```

---

## 📊 성능 모니터링

### 1. 응답 시간 모니터링

#### 목표 응답 시간
- **일반 API**: 200ms 이하
- **목록 조회 API**: 500ms 이하
- **통계 API**: 2초 이하
- **배치 작업**: 별도 기준

#### 모니터링 방법
```java
@Aspect
@Component
public class PerformanceMonitoringAspect {
    
    @Around("@annotation(org.springframework.web.bind.annotation.GetMapping)")
    public Object monitorPerformance(ProceedingJoinPoint joinPoint) throws Throwable {
        long startTime = System.currentTimeMillis();
        
        try {
            Object result = joinPoint.proceed();
            long duration = System.currentTimeMillis() - startTime;
            
            if (duration > 1000) {
                log.warn("⚠️ 느린 API 감지: {}ms, method={}", 
                    duration, joinPoint.getSignature().getName());
            }
            
            return result;
        } catch (Exception e) {
            long duration = System.currentTimeMillis() - startTime;
            log.error("❌ API 오류: {}ms, method={}, error={}", 
                duration, joinPoint.getSignature().getName(), e.getMessage());
            throw e;
        }
    }
}
```

### 2. 쿼리 성능 모니터링

#### 느린 쿼리 감지
```yaml
# application.yml
spring:
  jpa:
    properties:
      hibernate:
        # 느린 쿼리 로깅 (1초 이상)
        session:
          events:
            log:
              LOG_QUERIES_SLOWER_THAN_MS: 1000
```

#### 쿼리 로그 분석
```java
// Hibernate 통계 활성화
@Configuration
public class JpaConfig {
    
    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return props -> {
            props.put("hibernate.generate_statistics", true);
            props.put("hibernate.session.events.log.LOG_QUERIES_SLOWER_THAN_MS", 1000);
        };
    }
}
```

### 3. 캐시 히트율 추적

#### 캐시 통계 서비스
```java
@Service
public class CacheStatsService {
    
    /**
     * 캐시 통계 조회
     */
    public CacheStats getCacheStats(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        
        // 캐시 히트율 계산
        long hits = getCacheHits(cacheName);
        long misses = getCacheMisses(cacheName);
        double hitRate = (double) hits / (hits + misses) * 100;
        
        return CacheStats.builder()
            .cacheName(cacheName)
            .hits(hits)
            .misses(misses)
            .hitRate(hitRate)
            .size(cache != null ? cache.getNativeCache().size() : 0)
            .build();
    }
}
```

---

## 🚀 성능 최적화 기법

### 1. 지연 로딩 최적화

#### 문제 예시
```java
// ❌ 즉시 로딩 (불필요한 데이터 조회)
@OneToMany(fetch = FetchType.EAGER)
private List<Consultation> consultations;
```

#### 해결 방법
```java
// ✅ 지연 로딩 + 필요 시 JOIN FETCH
@OneToMany(fetch = FetchType.LAZY)
private List<Consultation> consultations;

// 필요 시에만 조회
@Query("SELECT u FROM User u LEFT JOIN FETCH u.consultations WHERE u.id = :id")
User findByIdWithConsultations(@Param("id") Long id);
```

### 2. 배치 처리

#### 대량 데이터 처리
```java
// ✅ 배치 처리
@Transactional
public void processBulkData(List<Data> dataList) {
    int batchSize = 100;
    
    for (int i = 0; i < dataList.size(); i += batchSize) {
        List<Data> batch = dataList.subList(i, 
            Math.min(i + batchSize, dataList.size()));
        
        dataRepository.saveAll(batch);
        entityManager.flush();
        entityManager.clear(); // 메모리 정리
    }
}
```

### 3. 비동기 처리

#### 비동기 작업
```java
@Async
@Transactional
public CompletableFuture<Void> processAsyncTask(String tenantId) {
    // 시간이 오래 걸리는 작업
    heavyProcessingService.process(tenantId);
    return CompletableFuture.completedFuture(null);
}
```

---

## 📈 성능 목표

### 1. API 응답 시간

| API 유형 | 목표 응답 시간 | 최대 허용 시간 |
|---------|--------------|--------------|
| 단순 조회 | 100ms | 200ms |
| 목록 조회 | 300ms | 500ms |
| 생성/수정 | 200ms | 500ms |
| 통계 조회 | 1초 | 2초 |
| 파일 업로드 | 2초 | 5초 |

### 2. 캐시 히트율

| 캐시 유형 | 목표 히트율 |
|----------|------------|
| 공통코드 | 95% 이상 |
| 사용자 정보 | 90% 이상 |
| 통계 데이터 | 80% 이상 |

### 3. 데이터베이스 성능

| 지표 | 목표 값 |
|------|--------|
| 쿼리 실행 시간 | 100ms 이하 |
| 느린 쿼리 비율 | 1% 이하 |
| 인덱스 사용률 | 90% 이상 |

---

## 🚫 금지 사항

### 1. 전체 조회 금지
```java
// ❌ 금지: 전체 조회
List<User> users = userRepository.findAll();

// ✅ 권장: 페이징 사용
Page<User> users = userRepository.findAll(pageable);
```

### 2. N+1 쿼리 금지
```java
// ❌ 금지: N+1 쿼리
List<User> users = userRepository.findAll();
for (User user : users) {
    List<Consultation> consultations = consultationRepository.findByUserId(user.getId());
}

// ✅ 권장: JOIN FETCH 사용
@Query("SELECT u FROM User u LEFT JOIN FETCH u.consultations")
List<User> findAllWithConsultations();
```

### 3. 불필요한 캐시 무효화 금지
```java
// ❌ 금지: 전체 캐시 무효화
@CacheEvict(value = "tenantCodes", allEntries = true)
public void updateSingleCode(Long id) {
    // 단일 코드만 수정했는데 전체 캐시 무효화
}

// ✅ 권장: 특정 캐시만 무효화
@CacheEvict(value = "tenantCodes", key = "#tenantId + ':' + #codeGroup")
public void updateSingleCode(Long id, String tenantId, String codeGroup) {
    // 해당 코드 그룹만 캐시 무효화
}
```

---

## ✅ 체크리스트

### 캐싱 적용 시
- [ ] 자주 조회되는 데이터 확인
- [ ] 캐시 키 전략 수립
- [ ] TTL 설정 (적절한 만료 시간)
- [ ] 캐시 무효화 전략 수립
- [ ] 캐시 히트율 모니터링

### 쿼리 최적화 시
- [ ] 인덱스 확인 및 생성
- [ ] N+1 쿼리 확인 및 수정
- [ ] 페이징 적용
- [ ] 불필요한 조인 제거
- [ ] 쿼리 실행 계획 확인

### 성능 모니터링 시
- [ ] 응답 시간 추적
- [ ] 쿼리 성능 모니터링
- [ ] 캐시 히트율 추적
- [ ] 리소스 사용량 모니터링
- [ ] 성능 목표 달성 확인

---

## 💡 베스트 프랙티스

### 1. 캐시 워밍업
```java
@PostConstruct
public void warmupCache() {
    // 자주 사용되는 데이터 미리 로드
    List<String> codeGroups = Arrays.asList(
        "USER_STATUS", "ROLE", "CONSULTATION_PACKAGE"
    );
    
    for (String codeGroup : codeGroups) {
        commonCodeService.findByCodeGroup(codeGroup);
    }
}
```

### 2. 쿼리 최적화 도구
```java
// Hibernate 통계 활성화 (개발 환경)
@Profile("dev")
@Configuration
public class JpaDevConfig {
    
    @Bean
    public HibernatePropertiesCustomizer hibernatePropertiesCustomizer() {
        return props -> {
            props.put("hibernate.generate_statistics", true);
            props.put("hibernate.format_sql", true);
        };
    }
}
```

### 3. 성능 테스트
```java
@Test
public void testApiPerformance() {
    long startTime = System.currentTimeMillis();
    
    ResponseEntity<ApiResponse> response = restTemplate.getForEntity(
        "/api/v1/users", ApiResponse.class
    );
    
    long duration = System.currentTimeMillis() - startTime;
    
    assertThat(duration).isLessThan(500); // 500ms 이하
    assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
}
```

---

## 📞 문의

성능 최적화 표준 관련 문의:
- 백엔드 팀
- DevOps 팀
- 아키텍처 팀

**최종 업데이트**: 2025-12-03


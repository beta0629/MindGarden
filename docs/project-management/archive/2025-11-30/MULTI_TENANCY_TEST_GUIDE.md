# 멀티 테넌시 테스트 가이드

## 📋 개요

이 문서는 멀티 테넌시 시스템의 3가지 핵심 엣지 케이스에 대한 테스트 시나리오와 실행 방법을 설명합니다.

**작성일**: 2025-11-30  
**작성자**: CoreSolution Development Team  
**버전**: 1.0.0

---

## 🎯 테스트 목표

| 테스트 | 목표 | 위험도 | 자동화 |
|--------|------|--------|--------|
| **Check 1** | 비동기 Context 전파 | ⭐⭐⭐⭐⭐ | ✅ JUnit |
| **Check 2** | 슈퍼 어드민 Bypass | ⭐⭐⭐☆☆ | ✅ JUnit |
| **Check 3** | SQL 로그 검증 | ⭐⭐⭐⭐☆ | ⚠️ 수동 |

---

## 🧪 테스트 시나리오 1: 알림톡 발송 테스트 (Async)

### 목적
비동기 작업에서 `TenantContext`가 정상적으로 전파되는지 확인합니다.

### 시나리오
1. **"A 학원"** 관리자로 로그인
2. 알림톡 발송 버튼 클릭
3. `@Async` 메서드가 백그라운드에서 실행
4. 로그에 **"A 학원 알림 발송 중... tenantId=academy-a-uuid-123"** 출력 확인

### 예상 결과
- ✅ 비동기 스레드에서 `TenantContext.getTenantId()`가 `null`이 아님
- ✅ 로그에 올바른 `tenantId`가 출력됨
- ❌ (실패 시) 로그에 `tenantId=null` 출력 → `TaskDecorator` 미작동

### 실행 방법

#### 자동 테스트 (JUnit)
```bash
cd MindGarden
mvn test -Dtest=AsyncContextPropagationTest#testAsyncNotificationWithTenantId
```

#### 수동 테스트 (Postman/브라우저)
```bash
# 1. 서버 시작
mvn spring-boot:run

# 2. 로그인 (A 학원)
POST http://localhost:8080/api/auth/login
{
  "username": "academy-a-admin",
  "password": "password123"
}

# 3. 알림톡 발송 API 호출
POST http://localhost:8080/api/notifications/send
{
  "message": "테스트 알림",
  "recipients": ["client1@example.com"]
}

# 4. 콘솔 로그 확인
# 출력 예시:
# 📱 [비동기 스레드: async-1] A 학원 알림 발송 중... tenantId=academy-a-uuid-123
```

### 로그 예시

#### ✅ 성공 케이스
```
2025-11-30 14:23:45.123 INFO  [http-nio-8080-exec-1] 🏫 [메인 스레드] A 학원 로그인: tenantId=academy-a-uuid-123
2025-11-30 14:23:45.234 INFO  [async-1] 📱 [비동기 스레드: async-1] A 학원 알림 발송 중... tenantId=academy-a-uuid-123, businessType=ACADEMY
2025-11-30 14:23:45.345 INFO  [async-1] ✅ [비동기 스레드: async-1] [A 학원] 알림 발송 완료: tenantId=academy-a-uuid-123
```

#### ❌ 실패 케이스 (TaskDecorator 미작동)
```
2025-11-30 14:23:45.123 INFO  [http-nio-8080-exec-1] 🏫 [메인 스레드] A 학원 로그인: tenantId=academy-a-uuid-123
2025-11-30 14:23:45.234 ERROR [async-1] ❌ [비동기 스레드: async-1] tenantId=null → Context 전파 실패!
```

---

## 🧪 테스트 시나리오 2: 스레드 오염 테스트

### 목적
여러 테넌트가 동시에 요청할 때 `ThreadLocal`이 오염되지 않는지 확인합니다.

### 시나리오
1. **A 학원**, **B 학원**, **C 상담소** 번갈아 가며 **100번** 요청
2. 각 요청마다 비동기 작업 실행
3. 로그에서 **A 학원 요청인데 B 학원 ID가 찍히는 경우** 확인

### 예상 결과
- ✅ 100번 요청 모두 올바른 `tenantId` 사용
- ✅ Context 오염 0건
- ❌ (실패 시) "A 학원 요청인데 tenantId=academy-b-uuid-456" 출력

### 실행 방법

#### 자동 테스트 (JUnit)
```bash
mvn test -Dtest=AsyncContextPropagationTest#testThreadIsolation
```

#### 수동 테스트 (JMeter/Artillery)
```bash
# 1. JMeter 시나리오 작성
# - Thread Group: 10 threads, 10 loops
# - HTTP Request 1: A 학원 로그인 + API 호출
# - HTTP Request 2: B 학원 로그인 + API 호출
# - HTTP Request 3: C 상담소 로그인 + API 호출

# 2. 실행 후 로그 분석
grep "Context 오염 감지" logs/application.log
```

### 로그 예시

#### ✅ 성공 케이스
```
📊 [테스트 결과] 성공: 100/100, 실패: 0
✅ [테스트 성공] Context 오염 없음! 스레드 격리 정상 동작
```

#### ❌ 실패 케이스 (finally 블록 누락)
```
❌ [Context 오염 감지] 요청#42: 예상=academy-a-uuid-123, 실제=academy-b-uuid-456
📊 [테스트 결과] 성공: 98/100, 실패: 2
```

---

## 🧪 테스트 시나리오 3: 관리자 뷰 테스트 (Super Admin)

### 목적
슈퍼 어드민이 `tenantId` 필터링을 우회하여 전체 데이터를 조회할 수 있는지 확인합니다.

### 시나리오
1. **HQ_MASTER** 계정으로 로그인
2. 전체 매출 통계 API 호출
3. Hibernate SQL 로그에서 **`WHERE tenant_id = ?` 구문이 사라졌는지** 확인

### 예상 결과
- ✅ 일반 관리자: SQL에 `WHERE tenant_id = 'academy-a-uuid-123'` 포함
- ✅ 슈퍼 어드민: SQL에 `WHERE tenant_id = ?` **없음**
- ✅ 슈퍼 어드민이 모든 테넌트의 데이터 조회 가능

### 실행 방법

#### 자동 테스트 (JUnit)
```bash
mvn test -Dtest=SuperAdminBypassTest#testSuperAdminCanSeeAllTenants
```

#### 수동 테스트 (SQL 로그 확인)
```bash
# 1. application.yml에 SQL 로깅 활성화
# logging:
#   level:
#     org.hibernate.SQL: DEBUG
#     org.hibernate.type.descriptor.sql.BasicBinder: TRACE

# 2. 서버 시작
mvn spring-boot:run

# 3. 일반 관리자로 로그인 + API 호출
POST http://localhost:8080/api/auth/login
{
  "username": "academy-a-admin",
  "password": "password123"
}

GET http://localhost:8080/api/statistics/revenue

# 4. 콘솔에서 SQL 확인
# 예상: SELECT ... FROM users WHERE tenant_id = 'academy-a-uuid-123'

# 5. 슈퍼 어드민으로 로그인 + API 호출
POST http://localhost:8080/api/auth/login
{
  "username": "hq-master",
  "password": "admin123"
}

GET http://localhost:8080/api/statistics/revenue

# 6. 콘솔에서 SQL 확인
# 예상: SELECT ... FROM users (tenant_id 필터 없음!)
```

### SQL 로그 예시

#### ✅ 일반 관리자 (tenantId 필터링 있음)
```sql
Hibernate: 
    SELECT 
        u.user_id, u.username, u.tenant_id 
    FROM users u 
    WHERE u.tenant_id = ? 
      AND u.is_deleted = false
    
-- 바인딩 파라미터
binding parameter [1] as [VARCHAR] - [academy-a-uuid-123]
```

#### ✅ 슈퍼 어드민 (tenantId 필터링 없음)
```sql
Hibernate: 
    SELECT 
        u.user_id, u.username, u.tenant_id 
    FROM users u 
    WHERE u.is_deleted = false
    
-- tenant_id 조건이 사라짐! ✅
```

---

## 🚀 전체 테스트 실행

### 모든 멀티 테넌시 테스트 실행
```bash
cd MindGarden

# 1. 비동기 Context 전파 테스트
mvn test -Dtest=AsyncContextPropagationTest

# 2. 슈퍼 어드민 Bypass 테스트
mvn test -Dtest=SuperAdminBypassTest

# 3. 전체 테스트 스위트 실행
mvn test -Dtest="*TenantContext*,*Async*,*SuperAdmin*"
```

### CI/CD 파이프라인 통합
```yaml
# .github/workflows/ci.yml
name: Multi-Tenancy Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-java@v3
        with:
          java-version: '17'
      
      - name: Run Multi-Tenancy Tests
        run: |
          cd MindGarden
          mvn test -Dtest="AsyncContextPropagationTest,SuperAdminBypassTest"
      
      - name: Upload Test Report
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: MindGarden/target/surefire-reports/
```

---

## 📊 테스트 체크리스트

### ✅ Check 1: 비동기 Context 전파

- [ ] `AsyncConfig.java`에 `TenantContextTaskDecorator` 설정됨
- [ ] `@Async` 메서드에서 `TenantContext.getTenantId()` 정상 동작
- [ ] `@Scheduled` 메서드에서 `tenantId` 정상 조회
- [ ] 알림톡 발송 로그에 올바른 `tenantId` 출력
- [ ] 100번 동시 요청 시 Context 오염 0건

### ✅ Check 2: 슈퍼 어드민 Bypass

- [ ] `TenantContext.setBypassTenantFilter(true)` 구현됨
- [ ] `JwtAuthenticationFilter`에서 HQ_MASTER 역할 감지 시 플래그 설정
- [ ] 슈퍼 어드민이 전체 테넌트 데이터 조회 가능
- [ ] 일반 관리자는 자기 테넌트만 조회
- [ ] SQL 로그에서 `WHERE tenant_id = ?` 구문 제거 확인

### ✅ Check 3: DB 인덱스 최적화

- [ ] `V60__add_composite_indexes_for_performance.sql` 적용됨
- [ ] `(tenant_id, created_at)` 복합 인덱스 생성 확인
- [ ] `EXPLAIN` 분석 시 인덱스 사용 확인
- [ ] 10만 건 데이터 조회 시 0.1초 이내 응답
- [ ] Slow Query Log에 멀티 테넌시 쿼리 없음

---

## 🐛 트러블슈팅

### 문제 1: 비동기 메서드에서 tenantId가 null

**증상**:
```
ERROR [async-1] tenantId=null → Context 전파 실패!
```

**원인**:
- `AsyncConfig`에 `TenantContextTaskDecorator`가 설정되지 않음
- `@EnableAsync` 어노테이션 누락

**해결책**:
```java
// AsyncConfig.java
@Configuration
@EnableAsync  // ⭐ 필수!
public class AsyncConfig {
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setTaskDecorator(new TenantContextTaskDecorator()); // ⭐ 필수!
        executor.initialize();
        return executor;
    }
}
```

---

### 문제 2: Context 오염 (A 학원 요청인데 B 학원 ID 출력)

**증상**:
```
❌ [Context 오염 감지] 요청#42: 예상=academy-a-uuid-123, 실제=academy-b-uuid-456
```

**원인**:
- `finally { TenantContext.clear() }` 블록 누락
- 스레드 풀 재사용 시 이전 Context가 남아있음

**해결책**:
```java
// TenantContextTaskDecorator.java
return () -> {
    try {
        TenantContext.setTenantId(tenantId);
        runnable.run();
    } finally {
        TenantContext.clear();  // ⭐ 필수!
    }
};
```

---

### 문제 3: 슈퍼 어드민도 tenantId 필터링됨

**증상**:
```
HQ_MASTER로 로그인했는데도 특정 테넌트 데이터만 조회됨
```

**원인**:
- `JwtAuthenticationFilter`에서 `setBypassTenantFilter(true)` 호출 안 함
- Hibernate Filter에서 Bypass 플래그 확인 안 함

**해결책**:
```java
// JwtAuthenticationFilter.java
if (user.getRole() == UserRole.HQ_MASTER || 
    user.getRole() == UserRole.SUPER_HQ_ADMIN) {
    TenantContext.setBypassTenantFilter(true);  // ⭐ 필수!
}
```

---

### 문제 4: DB 쿼리 느림 (10만 건 이상)

**증상**:
```
SELECT ... FROM users WHERE tenant_id = ? AND created_at > ?
→ 실행 시간: 3.2초
```

**원인**:
- `(tenant_id, created_at)` 복합 인덱스 없음
- `tenant_id` 단일 인덱스만 있음

**해결책**:
```sql
-- V60 마이그레이션 적용
ALTER TABLE users ADD INDEX idx_users_tenant_created_at (tenant_id, created_at);

-- 인덱스 확인
SHOW INDEX FROM users WHERE Key_name LIKE '%tenant%';
```

---

## 📚 관련 문서

- [멀티 테넌시 엣지 케이스 가이드](../architecture/MULTI_TENANCY_EDGE_CASES.md)
- [비즈니스 타입 시스템](../architecture/BUSINESS_TYPE_SYSTEM.md)
- [TenantContext 아키텍처](../architecture/TENANT_CONTEXT_ARCHITECTURE.md)

---

## 📞 지원

문제가 발생하면 다음을 확인하세요:

1. **로그 확인**: `logs/application.log`
2. **SQL 로그 확인**: Hibernate SQL 로깅 활성화
3. **인덱스 확인**: `SHOW INDEX FROM [table_name]`
4. **스레드 덤프**: `jstack [PID]`

**작성일**: 2025-11-30  
**최종 수정**: 2025-11-30  
**버전**: 1.0.0


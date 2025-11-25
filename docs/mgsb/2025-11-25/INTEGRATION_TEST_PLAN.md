# 통합 테스트 실행 방안

**작성일**: 2025-11-25  
**목적**: 하드코딩 제거 및 동적 카드 레이아웃 통합 테스트 실행 가이드

---

## 📋 테스트 개요

### 테스트 범위
1. **하드코딩 제거 테스트**: 세션비 조회 로직 검증
2. **동적 카드 레이아웃 테스트**: 대시보드 생성 및 설정 검증

### 테스트 파일
- `HardcodingRemovalIntegrationTest.java`: 하드코딩 제거 통합 테스트
- `DynamicCardLayoutIntegrationTest.java`: 동적 카드 레이아웃 통합 테스트

---

## 🚀 테스트 실행 방법

### 1. 전체 통합 테스트 실행

```bash
# 프로젝트 루트에서 실행
# Maven wrapper가 없는 경우 직접 mvn 사용
mvn test -Dtest=HardcodingRemovalIntegrationTest
mvn test -Dtest=DynamicCardLayoutIntegrationTest

# 또는 두 테스트 모두 실행
mvn test -Dtest="*IntegrationTest"

# Maven wrapper가 있는 경우
./mvnw test -Dtest=HardcodingRemovalIntegrationTest
./mvnw test -Dtest=DynamicCardLayoutIntegrationTest
```

### 2. IDE에서 실행

#### IntelliJ IDEA
1. 테스트 클래스 열기
2. 클래스명 옆의 실행 버튼 클릭
3. 또는 `Ctrl+Shift+F10` (Windows/Linux) / `Cmd+Shift+R` (Mac)

#### Eclipse
1. 테스트 클래스에서 우클릭
2. "Run As" → "JUnit Test"

### 3. 특정 테스트 메서드만 실행

```bash
# 특정 테스트 메서드만 실행
mvn test -Dtest=HardcodingRemovalIntegrationTest#testStatisticsCalculation_WithMapping

# Maven wrapper가 있는 경우
./mvnw test -Dtest=HardcodingRemovalIntegrationTest#testStatisticsCalculation_WithMapping
```

---

## 🧪 테스트 시나리오 상세

### 하드코딩 제거 테스트

#### 테스트 1: 매핑에서 세션비 조회
```java
@Test
void testStatisticsCalculation_WithMapping()
```
- **목적**: 매핑이 있을 때 회기당 단가를 정확히 계산하는지 확인
- **검증**: 매핑 정보 (packagePrice: 500000, totalSessions: 10) → 세션비: 50000원

#### 테스트 2: CommonCode에서 기본 세션비 조회
```java
@Test
void testStatisticsCalculation_WithCommonCode()
```
- **목적**: 매핑이 없을 때 CommonCode에서 기본값을 조회하는지 확인
- **검증**: CommonCode `SYSTEM_CONFIG.DEFAULT_SESSION_FEE` 조회

#### 테스트 3: 실시간 통계 업데이트 (매핑 있음)
```java
@Test
void testRealTimeStatistics_WithMapping()
```
- **목적**: 실시간 통계 업데이트 시 매핑에서 세션비 조회 확인
- **검증**: 스케줄 완료 시 매핑 기반 세션비 사용

#### 테스트 4: 실시간 통계 업데이트 (CommonCode)
```java
@Test
void testRealTimeStatistics_WithCommonCode()
```
- **목적**: 실시간 통계 업데이트 시 CommonCode에서 기본값 조회 확인
- **검증**: 매핑 없을 때 CommonCode 조회

### 동적 카드 레이아웃 테스트

#### 테스트 1: 대시보드 생성 시 cardLayout 자동 추가
```java
@Test
void testDashboardCreation_WithCardLayout()
```
- **목적**: 대시보드 생성 시 cardLayout 설정이 자동으로 추가되는지 확인
- **검증**: 
  - `cardLayout.defaultStyle = "v2"`
  - `cardLayout.defaultVariant = "elevated"`
  - `cardLayout.defaultPadding = "md"`
  - `cardLayout.defaultBorderRadius = "md"`
  - `cardLayout.hoverEffect = true`
  - `cardLayout.shadow = "md"`

#### 테스트 2: 위젯별 cardStyle 설정
```java
@Test
void testDashboardConfig_WithWidgetCardStyle()
```
- **목적**: 위젯별로 다른 카드 스타일을 설정할 수 있는지 확인
- **검증**: 위젯의 `cardStyle` 필드가 올바르게 파싱되는지 확인

#### 테스트 3: cardLayout 자동 추가 로직
```java
@Test
void testDashboardConfig_AutoAddCardLayout()
```
- **목적**: cardLayout이 없을 때 자동으로 추가되는지 확인
- **검증**: `getDefaultDashboardConfigFromTemplate`에서 cardLayout 추가 확인

---

## 🔧 테스트 환경 설정

### 1. 데이터베이스 설정

테스트는 `@ActiveProfiles("test")`를 사용하므로 `application-test.properties` 또는 `application-test.yml`이 필요합니다.

```properties
# application-test.properties
spring.datasource.url=jdbc:h2:mem:testdb
spring.datasource.driver-class-name=org.h2.Driver
spring.jpa.hibernate.ddl-auto=create-drop
spring.jpa.show-sql=true
```

### 2. Flyway 마이그레이션

V51 마이그레이션이 실행되어야 CommonCode 테스트가 통과합니다.

```bash
# 마이그레이션 확인
./mvnw flyway:info

# 마이그레이션 실행 (필요시)
./mvnw flyway:migrate
```

### 3. 테스트 데이터 준비

테스트는 `@BeforeEach`에서 자동으로 테스트 데이터를 생성합니다:
- 테넌트
- 사용자 (상담사, 내담자)
- 매핑
- 스케줄

---

## 📊 테스트 결과 확인

### 성공 케이스

```
✅ testStatisticsCalculation_WithMapping() - PASSED
✅ testStatisticsCalculation_WithCommonCode() - PASSED
✅ testRealTimeStatistics_WithMapping() - PASSED
✅ testRealTimeStatistics_WithCommonCode() - PASSED
✅ testDashboardCreation_WithCardLayout() - PASSED
✅ testDashboardConfig_WithWidgetCardStyle() - PASSED
✅ testDashboardConfig_AutoAddCardLayout() - PASSED
```

### 실패 케이스 대응

#### 1. CommonCode 조회 실패
```
원인: V51 마이그레이션 미실행
해결: ./mvnw flyway:migrate 실행
```

#### 2. 매핑 조회 실패
```
원인: 테스트 데이터 생성 실패
해결: @BeforeEach 메서드 확인, 데이터베이스 연결 확인
```

#### 3. 대시보드 생성 실패
```
원인: TenantRole 또는 TenantDashboard 서비스 오류
해결: 로그 확인, 의존성 주입 확인
```

---

## 🔍 디버깅 방법

### 1. 로그 레벨 설정

```properties
# application-test.properties
logging.level.com.coresolution.consultation.service.StatisticsService=DEBUG
logging.level.com.coresolution.core.service.TenantDashboardService=DEBUG
```

### 2. 테스트 중단점 설정

IDE에서 테스트 메서드에 중단점을 설정하여 디버깅 가능합니다.

### 3. 데이터베이스 상태 확인

```java
// 테스트 중간에 데이터 확인
@Autowired
private ScheduleRepository scheduleRepository;

@Test
void testWithDebug() {
    // ... 테스트 코드 ...
    
    // 디버깅: 저장된 데이터 확인
    List<Schedule> schedules = scheduleRepository.findAll();
    System.out.println("Schedules: " + schedules);
}
```

---

## 📝 테스트 커버리지 확인

### JaCoCo 리포트 생성

```bash
./mvnw clean test jacoco:report
```

리포트 위치: `target/site/jacoco/index.html`

### 커버리지 목표

- 하드코딩 제거 로직: 100%
- 동적 카드 레이아웃 로직: 100%
- Fallback 메커니즘: 100%

---

## 🚨 주의사항

1. **트랜잭션 롤백**: `@Transactional`로 인해 테스트 후 데이터가 자동 롤백됩니다.
2. **테스트 격리**: 각 테스트는 독립적으로 실행되어야 합니다.
3. **데이터베이스 상태**: 테스트 전 데이터베이스가 깨끗한 상태여야 합니다.

---

## 📈 다음 단계

### 추가 테스트 시나리오
- [ ] 성능 테스트 (대량 데이터)
- [ ] 동시성 테스트 (멀티 스레드)
- [ ] 엣지 케이스 테스트 (null 값, 빈 값 등)

### 자동화
- [ ] CI/CD 파이프라인에 통합 테스트 추가
- [ ] 테스트 리포트 자동 생성
- [ ] 커버리지 임계값 설정

---

## 🔗 관련 문서

- `TEST_PLAN.md`: 테스트 계획서
- `TEST_RESULTS.md`: 테스트 결과 보고서
- `DYNAMIC_CARD_LAYOUT_IMPLEMENTATION.md`: 동적 카드 레이아웃 구현 가이드
- `STATISTICS_HARDCODING_REMOVAL_GUIDE.md`: 하드코딩 제거 가이드


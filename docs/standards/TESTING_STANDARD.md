# 테스트 표준

**버전**: 1.0.0  
**최종 업데이트**: 2025-12-02  
**상태**: 공식 표준

---

## 📋 개요

CoreSolution 플랫폼의 테스트 표준입니다. 단위 테스트, 통합 테스트, E2E 테스트, 성능 테스트, 보안 테스트를 정의합니다.

---

## 🎯 핵심 원칙

### ⭐ 테스트 주도 개발 원칙

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  모든 코드는 테스트 가능하게 작성되어야 합니다
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**테스트 원칙**:
- ✅ 단위 테스트 작성 필수 (커버리지 80% 이상)
- ✅ 테넌트 격리 테스트
- ✅ 보안 테스트 (SQL 인젝션, XSS, 인증/인가)
- ✅ 성능 테스트 (응답 시간, 동시 사용자)
- ✅ E2E 테스트 (주요 시나리오)
- ✅ 테스트 데이터 자동 생성
- ✅ 테스트 환경 독립성
- ❌ 프로덕션 데이터 사용 금지
- ❌ 테스트 간 의존성 금지

---

## 🧪 테스트 계층

### 1. 테스트 피라미드

```
        ┌──────────────┐
        │   E2E Tests  │  ← 10% (느림, 비용 높음)
        │  (Selenium)  │
        └──────────────┘
       ┌────────────────┐
       │ Integration    │  ← 20% (중간)
       │ Tests (API)    │
       └────────────────┘
      ┌──────────────────┐
      │   Unit Tests     │  ← 70% (빠름, 비용 낮음)
      │ (JUnit, Jest)    │
      └──────────────────┘
```

### 2. 테스트 유형별 비중

| 테스트 유형 | 비중 | 실행 속도 | 커버리지 목표 |
|------------|------|----------|--------------|
| **단위 테스트** | 70% | 매우 빠름 | 80% 이상 |
| **통합 테스트** | 20% | 중간 | 60% 이상 |
| **E2E 테스트** | 10% | 느림 | 주요 시나리오 |

---

## 🔬 단위 테스트 (Unit Tests)

### 1. JUnit 5 표준 테스트

```java
@SpringBootTest
@Transactional
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class TenantRoleServiceTest {
    
    @Autowired
    private TenantRoleService tenantRoleService;
    
    @Autowired
    private TenantRepository tenantRepository;
    
    private String testTenantId;
    
    @BeforeAll
    void setUp() {
        // 테스트 테넌트 생성
        testTenantId = "tenant-test-" + UUID.randomUUID();
        Tenant tenant = Tenant.builder()
            .tenantId(testTenantId)
            .tenantName("테스트 테넌트")
            .businessType("CONSULTATION")
            .build();
        tenantRepository.save(tenant);
    }
    
    @Test
    @DisplayName("역할 생성 테스트")
    void testCreateRole() {
        // Given
        TenantRoleCreateRequest request = TenantRoleCreateRequest.builder()
            .tenantId(testTenantId)
            .roleName("상담사")
            .roleCode("CONSULTANT")
            .description("상담사 역할")
            .build();
        
        // When
        TenantRoleResponse response = tenantRoleService.createRole(request);
        
        // Then
        assertNotNull(response);
        assertEquals("상담사", response.getRoleName());
        assertEquals("CONSULTANT", response.getRoleCode());
        assertEquals(testTenantId, response.getTenantId());
    }
    
    @Test
    @DisplayName("중복 역할 생성 실패 테스트")
    void testCreateDuplicateRole() {
        // Given
        TenantRoleCreateRequest request = TenantRoleCreateRequest.builder()
            .tenantId(testTenantId)
            .roleName("상담사")
            .roleCode("CONSULTANT")
            .build();
        
        tenantRoleService.createRole(request);
        
        // When & Then
        assertThrows(DuplicateRoleException.class, () -> {
            tenantRoleService.createRole(request);
        });
    }
    
    @Test
    @DisplayName("테넌트별 역할 격리 테스트")
    void testTenantIsolation() {
        // Given
        String tenant1 = "tenant-test-1";
        String tenant2 = "tenant-test-2";
        
        TenantRoleCreateRequest request1 = TenantRoleCreateRequest.builder()
            .tenantId(tenant1)
            .roleName("상담사")
            .roleCode("CONSULTANT")
            .build();
        
        TenantRoleCreateRequest request2 = TenantRoleCreateRequest.builder()
            .tenantId(tenant2)
            .roleName("상담사")
            .roleCode("CONSULTANT")
            .build();
        
        // When
        TenantRoleResponse response1 = tenantRoleService.createRole(request1);
        TenantRoleResponse response2 = tenantRoleService.createRole(request2);
        
        // Then
        assertNotEquals(response1.getId(), response2.getId());
        assertEquals(tenant1, response1.getTenantId());
        assertEquals(tenant2, response2.getTenantId());
    }
    
    @AfterAll
    void tearDown() {
        // 테스트 데이터 정리
        tenantRepository.deleteByTenantId(testTenantId);
    }
}
```

### 2. Mock 테스트

```java
@ExtendWith(MockitoExtension.class)
class ConsultantServiceTest {
    
    @Mock
    private ConsultantRepository consultantRepository;
    
    @Mock
    private TenantContextHolder tenantContextHolder;
    
    @InjectMocks
    private ConsultantServiceImpl consultantService;
    
    @Test
    @DisplayName("상담사 등록 테스트 (Mock)")
    void testRegisterConsultant() {
        // Given
        String tenantId = "tenant-test-001";
        when(tenantContextHolder.getCurrentTenantId()).thenReturn(tenantId);
        
        ConsultantCreateRequest request = ConsultantCreateRequest.builder()
            .name("홍길동")
            .email("hong@example.com")
            .phone("010-1234-5678")
            .build();
        
        Consultant consultant = Consultant.builder()
            .id(1L)
            .tenantId(tenantId)
            .name("홍길동")
            .email("hong@example.com")
            .build();
        
        when(consultantRepository.save(any(Consultant.class))).thenReturn(consultant);
        
        // When
        ConsultantResponse response = consultantService.registerConsultant(request);
        
        // Then
        assertNotNull(response);
        assertEquals("홍길동", response.getName());
        assertEquals(tenantId, response.getTenantId());
        
        verify(consultantRepository, times(1)).save(any(Consultant.class));
        verify(tenantContextHolder, times(1)).getCurrentTenantId();
    }
}
```

---

## 🔗 통합 테스트 (Integration Tests)

### 1. API 통합 테스트

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Transactional
class TenantRoleControllerIntegrationTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Autowired
    private ObjectMapper objectMapper;
    
    private String testTenantId = "tenant-test-integration";
    private String authToken;
    
    @BeforeEach
    void setUp() throws Exception {
        // 로그인하여 토큰 획득
        LoginRequest loginRequest = new LoginRequest("admin@test.com", "admin123");
        
        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginRequest)))
            .andExpect(status().isOk())
            .andReturn();
        
        LoginResponse loginResponse = objectMapper.readValue(
            result.getResponse().getContentAsString(), 
            LoginResponse.class
        );
        
        authToken = loginResponse.getAccessToken();
    }
    
    @Test
    @DisplayName("역할 생성 API 통합 테스트")
    void testCreateRoleAPI() throws Exception {
        // Given
        TenantRoleCreateRequest request = TenantRoleCreateRequest.builder()
            .tenantId(testTenantId)
            .roleName("상담사")
            .roleCode("CONSULTANT")
            .description("상담사 역할")
            .build();
        
        // When & Then
        mockMvc.perform(post("/api/v1/tenant/roles")
                .header("Authorization", "Bearer " + authToken)
                .header("X-Tenant-ID", testTenantId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data.roleName").value("상담사"))
            .andExpect(jsonPath("$.data.roleCode").value("CONSULTANT"))
            .andExpect(jsonPath("$.data.tenantId").value(testTenantId));
    }
    
    @Test
    @DisplayName("역할 목록 조회 API 통합 테스트")
    void testGetRolesAPI() throws Exception {
        // When & Then
        mockMvc.perform(get("/api/v1/tenant/roles")
                .header("Authorization", "Bearer " + authToken)
                .header("X-Tenant-ID", testTenantId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true))
            .andExpect(jsonPath("$.data").isArray());
    }
    
    @Test
    @DisplayName("인증 없이 API 호출 시 401 에러")
    void testUnauthorizedAccess() throws Exception {
        mockMvc.perform(get("/api/v1/tenant/roles")
                .header("X-Tenant-ID", testTenantId))
            .andExpect(status().isUnauthorized());
    }
    
    @Test
    @DisplayName("테넌트 ID 없이 API 호출 시 400 에러")
    void testMissingTenantId() throws Exception {
        mockMvc.perform(get("/api/v1/tenant/roles")
                .header("Authorization", "Bearer " + authToken))
            .andExpect(status().isBadRequest());
    }
}
```

### 2. 데이터베이스 통합 테스트

```java
@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class TenantRoleRepositoryTest {
    
    @Autowired
    private TenantRoleRepository tenantRoleRepository;
    
    @Test
    @DisplayName("테넌트별 역할 조회 테스트")
    void testFindByTenantId() {
        // Given
        String tenantId = "tenant-test-001";
        TenantRole role1 = TenantRole.builder()
            .tenantId(tenantId)
            .roleName("상담사")
            .roleCode("CONSULTANT")
            .build();
        
        TenantRole role2 = TenantRole.builder()
            .tenantId(tenantId)
            .roleName("내담자")
            .roleCode("CLIENT")
            .build();
        
        tenantRoleRepository.save(role1);
        tenantRoleRepository.save(role2);
        
        // When
        List<TenantRole> roles = tenantRoleRepository.findByTenantId(tenantId);
        
        // Then
        assertEquals(2, roles.size());
        assertTrue(roles.stream().anyMatch(r -> r.getRoleCode().equals("CONSULTANT")));
        assertTrue(roles.stream().anyMatch(r -> r.getRoleCode().equals("CLIENT")));
    }
}
```

---

## 🌐 E2E 테스트 (End-to-End Tests)

### 1. Selenium 테스트

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.DEFINED_PORT)
class LoginE2ETest {
    
    private WebDriver driver;
    
    @BeforeEach
    void setUp() {
        // Chrome 드라이버 설정
        System.setProperty("webdriver.chrome.driver", "/path/to/chromedriver");
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless"); // 헤드리스 모드
        driver = new ChromeDriver(options);
    }
    
    @Test
    @DisplayName("로그인 E2E 테스트")
    void testLoginFlow() {
        // Given
        driver.get("http://localhost:3000/login");
        
        // When
        WebElement emailInput = driver.findElement(By.id("email"));
        WebElement passwordInput = driver.findElement(By.id("password"));
        WebElement loginButton = driver.findElement(By.id("login-button"));
        
        emailInput.sendKeys("admin@test.com");
        passwordInput.sendKeys("admin123");
        loginButton.click();
        
        // Then
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(ExpectedConditions.urlContains("/dashboard"));
        
        assertTrue(driver.getCurrentUrl().contains("/dashboard"));
    }
    
    @AfterEach
    void tearDown() {
        if (driver != null) {
            driver.quit();
        }
    }
}
```

### 2. Playwright 테스트 (JavaScript)

```javascript
// tests/e2e/login.spec.js
const { test, expect } = require('@playwright/test');

test.describe('로그인 E2E 테스트', () => {
  test('관리자 로그인 성공', async ({ page }) => {
    // Given
    await page.goto('http://localhost:3000/login');
    
    // When
    await page.fill('#email', 'admin@test.com');
    await page.fill('#password', 'admin123');
    await page.click('#login-button');
    
    // Then
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('h1')).toContainText('대시보드');
  });
  
  test('잘못된 비밀번호로 로그인 실패', async ({ page }) => {
    // Given
    await page.goto('http://localhost:3000/login');
    
    // When
    await page.fill('#email', 'admin@test.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('#login-button');
    
    // Then
    await expect(page.locator('.error-message')).toContainText('아이디 또는 비밀번호');
  });
});
```

---

## 🔒 보안 테스트 (Security Tests)

### 1. SQL 인젝션 테스트

```java
@SpringBootTest
@AutoConfigureMockMvc
class SQLInjectionSecurityTest {
    
    @Autowired
    private MockMvc mockMvc;
    
    @Test
    @DisplayName("SQL 인젝션 공격 차단 테스트")
    void testSQLInjectionBlocked() throws Exception {
        // Given
        String maliciousInput = "admin' OR '1'='1";
        
        // When & Then
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + maliciousInput + "\",\"password\":\"test\"}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("SQL 인젝션 보안 필터 차단"));
    }
}
```

### 2. XSS 공격 테스트

```java
@Test
@DisplayName("XSS 공격 차단 테스트")
void testXSSBlocked() throws Exception {
    // Given
    String xssPayload = "<script>alert('XSS')</script>";
    
    TenantRoleCreateRequest request = TenantRoleCreateRequest.builder()
        .tenantId("tenant-test")
        .roleName(xssPayload)
        .roleCode("TEST")
        .build();
    
    // When & Then
    mockMvc.perform(post("/api/v1/tenant/roles")
            .header("Authorization", "Bearer " + authToken)
            .header("X-Tenant-ID", "tenant-test")
            .contentType(MediaType.APPLICATION_JSON)
            .content(objectMapper.writeValueAsString(request)))
        .andExpect(status().isBadRequest())
        .andExpect(jsonPath("$.message").value("XSS 공격 차단"));
}
```

### 3. 무차별 대입 공격 테스트

```java
@Test
@DisplayName("무차별 대입 공격 차단 테스트")
void testBruteForceBlocked() throws Exception {
    // Given
    String email = "admin@test.com";
    String wrongPassword = "wrongpassword";
    
    // When - 5회 로그인 실패
    for (int i = 0; i < 5; i++) {
        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + wrongPassword + "\"}"))
            .andExpect(status().isUnauthorized());
    }
    
    // Then - 6번째 시도는 차단
    mockMvc.perform(post("/api/v1/auth/login")
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"" + wrongPassword + "\"}"))
        .andExpect(status().isTooManyRequests())
        .andExpect(jsonPath("$.message").value("계정이 잠겼습니다"));
}
```

---

## ⚡ 성능 테스트 (Performance Tests)

### 1. JMeter 테스트 계획

```xml
<!-- jmeter-test-plan.jmx -->
<?xml version="1.0" encoding="UTF-8"?>
<jmeterTestPlan version="1.2">
  <hashTree>
    <TestPlan>
      <stringProp name="TestPlan.comments">CoreSolution API 성능 테스트</stringProp>
      <boolProp name="TestPlan.functional_mode">false</boolProp>
      <boolProp name="TestPlan.serialize_threadgroups">false</boolProp>
      <elementProp name="TestPlan.user_defined_variables" elementType="Arguments">
        <collectionProp name="Arguments.arguments">
          <elementProp name="BASE_URL" elementType="Argument">
            <stringProp name="Argument.name">BASE_URL</stringProp>
            <stringProp name="Argument.value">http://localhost:8080</stringProp>
          </elementProp>
        </collectionProp>
      </elementProp>
    </TestPlan>
    <hashTree>
      <ThreadGroup>
        <stringProp name="ThreadGroup.num_threads">100</stringProp>
        <stringProp name="ThreadGroup.ramp_time">10</stringProp>
        <stringProp name="ThreadGroup.duration">60</stringProp>
        <stringProp name="ThreadGroup.delay">0</stringProp>
      </ThreadGroup>
    </hashTree>
  </hashTree>
</jmeterTestPlan>
```

### 2. Gatling 성능 테스트 (Scala)

```scala
// simulations/LoginSimulation.scala
import io.gatling.core.Predef._
import io.gatling.http.Predef._
import scala.concurrent.duration._

class LoginSimulation extends Simulation {
  
  val httpProtocol = http
    .baseUrl("http://localhost:8080")
    .acceptHeader("application/json")
    .contentTypeHeader("application/json")
  
  val scn = scenario("로그인 성능 테스트")
    .exec(http("로그인 요청")
      .post("/api/v1/auth/login")
      .body(StringBody("""{"email":"admin@test.com","password":"admin123"}"""))
      .check(status.is(200))
      .check(jsonPath("$.data.accessToken").exists))
  
  setUp(
    scn.inject(
      rampUsers(100) during (10 seconds),
      constantUsersPerSec(50) during (60 seconds)
    )
  ).protocols(httpProtocol)
   .assertions(
     global.responseTime.max.lt(2000), // 최대 응답 시간 2초
     global.successfulRequests.percent.gt(95) // 성공률 95% 이상
   )
}
```

---

## 📊 테스트 커버리지

### 1. JaCoCo 설정

```xml
<!-- pom.xml -->
<plugin>
    <groupId>org.jacoco</groupId>
    <artifactId>jacoco-maven-plugin</artifactId>
    <version>0.8.10</version>
    <executions>
        <execution>
            <goals>
                <goal>prepare-agent</goal>
            </goals>
        </execution>
        <execution>
            <id>report</id>
            <phase>test</phase>
            <goals>
                <goal>report</goal>
            </goals>
        </execution>
        <execution>
            <id>jacoco-check</id>
            <goals>
                <goal>check</goal>
            </goals>
            <configuration>
                <rules>
                    <rule>
                        <element>PACKAGE</element>
                        <limits>
                            <limit>
                                <counter>LINE</counter>
                                <value>COVEREDRATIO</value>
                                <minimum>0.80</minimum>
                            </limit>
                        </limits>
                    </rule>
                </rules>
            </configuration>
        </execution>
    </executions>
</plugin>
```

### 2. 커버리지 목표

| 계층 | 커버리지 목표 |
|-----|-------------|
| **Service** | 90% 이상 |
| **Controller** | 80% 이상 |
| **Repository** | 70% 이상 |
| **Util** | 95% 이상 |
| **전체** | 80% 이상 |

---

## 🧹 테스트 데이터 관리

### 1. 테스트 데이터 빌더

```java
public class TestDataBuilder {
    
    /**
     * 테스트 테넌트 생성
     */
    public static Tenant createTestTenant() {
        return Tenant.builder()
            .tenantId("tenant-test-" + UUID.randomUUID())
            .tenantName("테스트 테넌트")
            .businessType("CONSULTATION")
            .status(TenantStatus.ACTIVE)
            .build();
    }
    
    /**
     * 테스트 사용자 생성
     */
    public static User createTestUser(String tenantId, UserRole role) {
        return User.builder()
            .tenantId(tenantId)
            .email("test-" + UUID.randomUUID() + "@example.com")
            .password("$2a$12$encodedPassword") // BCrypt 인코딩
            .name("테스트 사용자")
            .role(role)
            .isActive(true)
            .build();
    }
    
    /**
     * 테스트 상담사 생성
     */
    public static Consultant createTestConsultant(String tenantId) {
        return Consultant.builder()
            .tenantId(tenantId)
            .name("테스트 상담사")
            .email("consultant-" + UUID.randomUUID() + "@example.com")
            .phone("010-1234-5678")
            .specialization("심리상담")
            .build();
    }
}
```

### 2. 테스트 데이터 정리

```java
@TestConfiguration
public class TestDataCleanupConfig {
    
    @Bean
    public TestDataCleanupService testDataCleanupService() {
        return new TestDataCleanupService();
    }
}

@Service
public class TestDataCleanupService {
    
    @Autowired
    private TenantRepository tenantRepository;
    
    @Autowired
    private UserRepository userRepository;
    
    /**
     * 테스트 데이터 정리
     */
    @Transactional
    public void cleanupTestData() {
        // 테스트 테넌트 삭제
        tenantRepository.deleteByTenantIdStartingWith("tenant-test-");
        
        // 테스트 사용자 삭제
        userRepository.deleteByEmailStartingWith("test-");
    }
}
```

---

## 🚫 금지 사항

### 1. 프로덕션 데이터 사용 금지
```java
// ❌ 금지 - 프로덕션 데이터 사용
@Test
void testWithProductionData() {
    Tenant tenant = tenantRepository.findByTenantId("tenant-seoul-consultation-001");
    // ...
}

// ✅ 필수 - 테스트 데이터 생성
@Test
void testWithTestData() {
    Tenant tenant = TestDataBuilder.createTestTenant();
    tenantRepository.save(tenant);
    // ...
}
```

### 2. 테스트 간 의존성 금지
```java
// ❌ 금지 - 테스트 간 의존성
@Test
void test1() {
    // 데이터 생성
}

@Test
void test2() {
    // test1의 데이터에 의존
}

// ✅ 필수 - 독립적인 테스트
@Test
void test1() {
    // 자체 데이터 생성
}

@Test
void test2() {
    // 자체 데이터 생성
}
```

### 3. 하드코딩된 테스트 데이터 금지
```java
// ❌ 금지
@Test
void test() {
    String tenantId = "tenant-test-001";
    // ...
}

// ✅ 필수 - 동적 생성
@Test
void test() {
    String tenantId = "tenant-test-" + UUID.randomUUID();
    // ...
}
```

---

## ✅ 개발 체크리스트

### 단위 테스트
- [ ] Service 계층 테스트 작성
- [ ] Repository 계층 테스트 작성
- [ ] Util 클래스 테스트 작성
- [ ] Mock 객체 사용
- [ ] 테넌트 격리 테스트

### 통합 테스트
- [ ] API 엔드포인트 테스트
- [ ] 데이터베이스 통합 테스트
- [ ] 인증/인가 테스트
- [ ] 에러 처리 테스트

### 보안 테스트
- [ ] SQL 인젝션 테스트
- [ ] XSS 공격 테스트
- [ ] 무차별 대입 공격 테스트
- [ ] 권한 체크 테스트

### 성능 테스트
- [ ] 응답 시간 테스트 (< 2초)
- [ ] 동시 사용자 테스트 (100명)
- [ ] 부하 테스트 (JMeter/Gatling)

### E2E 테스트
- [ ] 로그인 시나리오
- [ ] 주요 비즈니스 시나리오
- [ ] 에러 시나리오

### 테스트 커버리지
- [ ] 전체 커버리지 80% 이상
- [ ] Service 계층 90% 이상
- [ ] Controller 계층 80% 이상

---

## 📖 참조 문서

- [API 설계 표준](./API_DESIGN_STANDARD.md)
- [보안 및 인증 표준](./SECURITY_AUTHENTICATION_STANDARD.md)
- [데이터베이스 스키마 표준](./DATABASE_SCHEMA_STANDARD.md)
- [에러 처리 표준](./ERROR_HANDLING_STANDARD.md)

---

**최종 업데이트**: 2025-12-02


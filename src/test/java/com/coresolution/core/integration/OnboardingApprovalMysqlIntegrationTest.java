package com.coresolution.core.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.CallableStatement;
import java.sql.Connection;
import java.sql.Types;
import java.util.HashMap;
import java.util.Map;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.converter.EmailAttributeConverter;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.domain.onboarding.OnboardingRequest;
import com.coresolution.core.domain.onboarding.OnboardingStatus;
import com.coresolution.core.domain.onboarding.RiskLevel;
import com.coresolution.core.security.TenantAdminUserIdAllocator;
import com.coresolution.core.service.OnboardingService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import com.coresolution.consultation.config.PermissionInitializationConfig;
import com.coresolution.consultation.scheduler.WellnessNotificationScheduler;
import com.coresolution.consultation.service.impl.CodeInitializationServiceImpl;
import com.coresolution.consultation.service.impl.FinancialCommonCodeInitializer;
import com.coresolution.consultation.service.impl.PasswordCommonCodeInitializer;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MySQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * 개발 DB SHOW CREATE 와 저장소의 기동 시 프로시저 파일만 올린 MySQL 8 승인 테스트.
 * 기본 CI(release/dev 의 Guardrails·FE jest)는 {@code local-mysql} 태그를 실행하지 않는다.
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles({"test", "approval-mysql"})
@Tag("local-mysql")
@Testcontainers
class OnboardingApprovalMysqlIntegrationTest {

    static {
        // shaded docker-java 는 DOCKER_API_VERSION 을 보지 않는다. 미지정이면 API 1.32 로 고정된다.
        if (System.getProperty("api.version") == null) {
            System.setProperty("api.version", "1.44");
        }
    }

    /** PasswordPolicy 를 만족하는 테스트 전용 값. 보고·로그에 출력하지 않는다. */
    private static final String POLICY_COMPLIANT_TEST_PASSWORD = "Mvp7@Onbd";

    @Container
    static final MySQLContainer<?> MYSQL = new MySQLContainer<>("mysql:8.0")
            .withDatabaseName("mindgarden_approval_it")
            .withUsername("root")
            .withCommand("--character-set-server=utf8mb4", "--collation-server=utf8mb4_unicode_ci");

    @DynamicPropertySource
    static void mysqlProperties(DynamicPropertyRegistry registry) {
        ApprovalMysqlSchemaLoader.load(MYSQL);
        registry.add("spring.datasource.url", MYSQL::getJdbcUrl);
        registry.add("spring.datasource.username", MYSQL::getUsername);
        registry.add("spring.datasource.password", MYSQL::getPassword);
        registry.add("spring.datasource.driver-class-name", () -> "com.mysql.cj.jdbc.Driver");
    }

    /**
     * 승인 경로 밖에 있는 기동 시 시드는 common_codes·permissions 를 요구한다.
     * 이 테스트의 스키마에는 그 테이블이 없으므로 리스너만 대체한다.
     */
    @MockBean
    private CodeInitializationServiceImpl codeInitializationService;

    @MockBean
    private PasswordCommonCodeInitializer passwordCommonCodeInitializer;

    @MockBean
    private FinancialCommonCodeInitializer financialCommonCodeInitializer;

    @MockBean
    private PermissionInitializationConfig permissionInitializationConfig;

    @MockBean
    private WellnessNotificationScheduler wellnessNotificationScheduler;

    @Autowired
    private OnboardingService onboardingService;

    @Autowired
    private UserService userService;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void approvalStoresCiphertextViaProcedureAndLoginFindsIt() throws Exception {
        long stamp = System.nanoTime() % 1_000_000L;
        String tenantId = "tc" + stamp;
        String localPart = "admin.ops" + stamp;
        String contactEmail = localPart + "@example.com";
        String subdomain = "s" + stamp;

        OnboardingRequest created = onboardingService.create(
                tenantId,
                "Ops Center",
                "01055551234",
                RiskLevel.LOW,
                "{\"adminPassword\":\"" + POLICY_COMPLIANT_TEST_PASSWORD
                        + "\",\"contactEmail\":\"" + contactEmail
                        + "\",\"subdomain\":\"" + subdomain + "\"}",
                "CONSULTATION");
        assertThat(created.getId()).isNotNull();

        jdbcTemplate.execute("SET GLOBAL general_log = 'ON'");
        jdbcTemplate.execute("SET GLOBAL log_output = 'TABLE'");

        OnboardingRequest approved = onboardingService.decide(
                created.getId(), OnboardingStatus.APPROVED, "system-admin", "mysql approval");

        assertThat(approved.getStatus()).isEqualTo(OnboardingStatus.APPROVED);
        Map<String, Object> statusJson = objectMapper.readValue(
                approved.getInitializationStatusJson(), new TypeReference<Map<String, Object>>() {});
        assertThat(statusJson.get("fallbackUsed")).isEqualTo(false);

        Map<String, Object> row = jdbcTemplate.queryForMap(
                "SELECT email, user_id FROM users WHERE tenant_id = ? AND role = 'ADMIN' "
                        + "AND (is_deleted IS NULL OR is_deleted = 0)",
                tenantId);
        String storedEmail = String.valueOf(row.get("email"));
        String storedUserId = String.valueOf(row.get("user_id"));
        String expectedCipher = new EmailAttributeConverter()
                .convertToDatabaseColumn(contactEmail.toLowerCase());

        assertThat(storedEmail).doesNotContain("@");
        assertThat(storedEmail).contains("::");
        assertThat(storedEmail).isEqualTo(expectedCipher);
        assertThat(storedUserId).startsWith(TenantAdminUserIdAllocator.PREFIX);
        assertThat(storedUserId).doesNotStartWith(localPart);
        assertThat(storedUserId).isNotEqualTo(localPart.replace(".", ""));
        assertThat(storedUserId).doesNotContain("@");

        Integer adminCount = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE tenant_id = ? AND role = 'ADMIN' "
                        + "AND (is_deleted IS NULL OR is_deleted = 0)",
                Integer.class, tenantId);
        assertThat(adminCount).isEqualTo(1);

        Integer procedureCalls = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM mysql.general_log WHERE argument LIKE '%ProcessOnboardingApproval%'",
                Integer.class);
        assertThat(procedureCalls).isGreaterThan(0);

        TenantContextHolder.setTenantId(tenantId);
        try {
            assertThat(userService.findByEmail(contactEmail))
                    .isPresent()
                    .get()
                    .extracting(user -> user.getRole())
                    .isEqualTo(UserRole.ADMIN);
        } finally {
            TenantContextHolder.clear();
        }
    }

    @Test
    void compositeUniqueReplacesGlobalUserIdKeys() {
        Integer globalKeys = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' "
                        + "AND INDEX_NAME IN ('UK_r43af9ap4edm43mmtq01oddj6', 'UK_users_user_id')",
                Integer.class);
        Integer compositeColumns = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM information_schema.STATISTICS "
                        + "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' "
                        + "AND INDEX_NAME = 'UK_users_tenant_user_id' "
                        + "AND COLUMN_NAME IN ('tenant_id', 'user_id')",
                Integer.class);
        assertThat(globalKeys).isZero();
        assertThat(compositeColumns).isEqualTo(2);
    }

    @Test
    void otherTenantDeletedUserIdDoesNotBlockTheSameAdminUserId() {
        String occupied = "reuse0629";
        insertDeletedUser("tenant-occupied", occupied, "k1::occupied");

        Map<String, Object> out = callCreateTenantAdmin("tenant-new", "k1::newadmin", occupied);

        assertThat(out.get("success")).isEqualTo(true);
        String created = adminUserId("tenant-new");
        assertThat(created).isEqualTo(occupied);
        assertThat(deletedFlag("tenant-occupied", occupied)).isEqualTo(true);
    }

    @Test
    void sameTenantDeletedUserIdFallsBackToNumericSuffix() {
        String base = "adm-collide";
        insertDeletedUser("tenant-collide", base, "k1::deleted-admin");

        Map<String, Object> out = callCreateTenantAdmin("tenant-collide", "k1::live-admin", base);

        assertThat(out.get("success")).isEqualTo(true);
        assertThat(adminUserId("tenant-collide")).isEqualTo(base + "1");
        assertThat(deletedFlag("tenant-collide", base)).isEqualTo(true);
        Integer deletedStillThere = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM users WHERE tenant_id = ? AND user_id = ? AND is_deleted = 1",
                Integer.class, "tenant-collide", base);
        assertThat(deletedStillThere).isEqualTo(1);
    }

    private void insertDeletedUser(String tenantId, String userId, String email) {
        jdbcTemplate.update(
                "INSERT INTO users (created_at, updated_at, is_deleted, version, email, is_active, "
                        + "is_email_verified, name, password, role, user_id, is_social_account, tenant_id) "
                        + "VALUES (NOW(6), NOW(6), 1, 0, ?, 0, 0, 'deleted', 'x', 'CLIENT', ?, 0, ?)",
                email, userId, tenantId);
    }

    private String adminUserId(String tenantId) {
        return jdbcTemplate.queryForObject(
                "SELECT user_id FROM users WHERE tenant_id = ? AND role = 'ADMIN' "
                        + "AND (is_deleted IS NULL OR is_deleted = 0)",
                String.class, tenantId);
    }

    private Boolean deletedFlag(String tenantId, String userId) {
        Integer flag = jdbcTemplate.queryForObject(
                "SELECT CASE WHEN is_deleted = 1 THEN 1 ELSE 0 END FROM users "
                        + "WHERE tenant_id = ? AND user_id = ?",
                Integer.class, tenantId, userId);
        return flag != null && flag == 1;
    }

    private Map<String, Object> callCreateTenantAdmin(String tenantId, String email, String userIdBase) {
        return jdbcTemplate.execute((Connection connection) -> {
            try (CallableStatement cs = connection.prepareCall(
                    "{CALL CreateTenantAdminAccount(?, ?, ?, ?, ?, ?, ?, ?)}")) {
                cs.setString(1, tenantId);
                cs.setString(2, email);
                cs.setString(3, "센터");
                cs.setString(4, "hash-placeholder");
                cs.setString(5, "it");
                cs.setString(6, userIdBase);
                cs.registerOutParameter(7, Types.BOOLEAN);
                cs.registerOutParameter(8, Types.VARCHAR);
                cs.execute();
                Map<String, Object> out = new HashMap<>();
                out.put("success", cs.getBoolean(7));
                out.put("message", cs.getString(8));
                return out;
            }
        });
    }
}

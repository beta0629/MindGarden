package com.coresolution.consultation.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V20260612_001 마이그레이션 정착 검증 — Role SSOT 4종 정규화.
 *
 * <p>users.role 컬럼에 잔존 가능한 레거시 role 값(SUPER_ADMIN, HQ 계열, BRANCH 계열,
 * PRINCIPAL, OWNER, PLAY_THERAPIST, SPEECH_THERAPIST 등) 을 SSOT 4종
 * (ADMIN, STAFF, CONSULTANT, CLIENT) 으로 정규화하는 마이그레이션의 정착·데이터 손실
 * 0건·idempotency 를 검증한다.
 *
 * <p>운영 인벤토리(2026-06-11 KST) 결과 레거시 role 사용자 0건 — 본 테스트는 회귀 방지·
 * 향후 dev, 스테이징, 장애복구 복원본 대비 시나리오를 시뮬레이션한다.
 *
 * <p>H2(MODE=MySQL) 환경은 MySQL 의 PREPARE, EXECUTE, SIGNAL 동적 SQL 을 부분만 지원하므로
 * {@code ignoreFailedStatements=true} 로 가드 단계는 우회하고 핵심 UPDATE 만 평가한다.
 *
 * @author CoreSolution
 * @since 2026-06-12
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260612_001 마이그레이션 검증 — Role SSOT 4종 정규화")
class RoleSsotLegacyNormalizeMigrationTest {

    private static final String JDBC_URL =
            "jdbc:h2:mem:role-ssot-legacy-normalize-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260612_001__role_ssot_legacy_normalize.sql";

    private static final Set<String> SSOT_ROLES = new HashSet<>();

    static {
        SSOT_ROLES.add("ADMIN");
        SSOT_ROLES.add("STAFF");
        SSOT_ROLES.add("CONSULTANT");
        SSOT_ROLES.add("CLIENT");
    }

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedUsersTable();
        seedFixtureRows();
        runMigrationScript(MIGRATION_PATH);
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private void seedUsersTable() throws Exception {
        execute("CREATE TABLE users ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(50) NOT NULL,"
                + "email VARCHAR(255) NULL,"
                + "role VARCHAR(50) NOT NULL,"
                + "is_active BOOLEAN NOT NULL DEFAULT TRUE,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE,"
                + "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
                + ")");
    }

    /**
     * 레거시 role 11종(ADMIN 매핑) + 레거시 2종(CONSULTANT 매핑) + SSOT 4종 = 총 17행 시드.
     * 마이그레이션 후 모두 SSOT 4종으로 수렴하고 row 손실 0건이어야 한다.
     */
    private void seedFixtureRows() throws Exception {
        // ADMIN 으로 매핑되어야 하는 레거시 11종
        insertRow("admin-legacy@a.com", "SUPER_ADMIN");
        insertRow("admin-legacy@b.com", "HQ_ADMIN");
        insertRow("admin-legacy@c.com", "BRANCH_SUPER_ADMIN");
        insertRow("admin-legacy@d.com", "BRANCH_ADMIN");
        insertRow("admin-legacy@e.com", "BRANCH_MANAGER");
        insertRow("admin-legacy@f.com", "HQ_MASTER");
        insertRow("admin-legacy@g.com", "SUPER_HQ_ADMIN");
        insertRow("admin-legacy@h.com", "HQ_SUPER_ADMIN");
        insertRow("admin-legacy@i.com", "TENANT_ADMIN");
        insertRow("admin-legacy@j.com", "PRINCIPAL");
        insertRow("admin-legacy@k.com", "OWNER");

        // CONSULTANT 으로 매핑되어야 하는 레거시 2종
        insertRow("therapist-legacy@a.com", "PLAY_THERAPIST");
        insertRow("therapist-legacy@b.com", "SPEECH_THERAPIST");

        // SSOT 4종 (변환 무관 — 그대로 유지되어야 함)
        insertRow("ssot-admin@a.com", "ADMIN");
        insertRow("ssot-staff@a.com", "STAFF");
        insertRow("ssot-consultant@a.com", "CONSULTANT");
        insertRow("ssot-client@a.com", "CLIENT");
    }

    private void insertRow(String email, String role) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO users (tenant_id, email, role) VALUES (?, ?, ?)")) {
            ps.setString(1, "tenant-A");
            ps.setString(2, email);
            ps.setString(3, role);
            ps.executeUpdate();
        }
    }

    /**
     * 운영(MySQL) 정본 SQL 을 H2(MODE=MySQL) 상에서 실행한다.
     * H2 는 MySQL 의 SET @var := (subquery), PREPARE FROM, EXECUTE, DEALLOCATE PREPARE,
     * SIGNAL SQLSTATE 등 동적 SQL 일부를 파싱하지 못하므로 {@code continueOnError=true}
     * 로 사후 검증 가드만 우회한다. 핵심 UPDATE 두 건은 표준 SQL 이라 정상 실행된다.
     */
    private void runMigrationScript(String classpathLocation) throws Exception {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        ScriptUtils.executeSqlScript(
                connection,
                new EncodedResource(resource),
                true,
                true,
                "--",
                ";",
                "/*",
                "*/");
    }

    private void execute(String sql) throws Exception {
        try (Statement st = connection.createStatement()) {
            st.execute(sql);
        }
    }

    @Test
    @DisplayName("ADMIN 매핑: SUPER_ADMIN / HQ_* / BRANCH_* / TENANT_ADMIN / PRINCIPAL / OWNER → ADMIN")
    void adminMapping_allLegacyVariantsNormalized() throws Exception {
        assertRoleEquals("admin-legacy@a.com", "ADMIN");
        assertRoleEquals("admin-legacy@b.com", "ADMIN");
        assertRoleEquals("admin-legacy@c.com", "ADMIN");
        assertRoleEquals("admin-legacy@d.com", "ADMIN");
        assertRoleEquals("admin-legacy@e.com", "ADMIN");
        assertRoleEquals("admin-legacy@f.com", "ADMIN");
        assertRoleEquals("admin-legacy@g.com", "ADMIN");
        assertRoleEquals("admin-legacy@h.com", "ADMIN");
        assertRoleEquals("admin-legacy@i.com", "ADMIN");
        assertRoleEquals("admin-legacy@j.com", "ADMIN");
        assertRoleEquals("admin-legacy@k.com", "ADMIN");
    }

    @Test
    @DisplayName("CONSULTANT 매핑: PLAY_THERAPIST / SPEECH_THERAPIST → CONSULTANT")
    void consultantMapping_therapistLegacyNormalized() throws Exception {
        assertRoleEquals("therapist-legacy@a.com", "CONSULTANT");
        assertRoleEquals("therapist-legacy@b.com", "CONSULTANT");
    }

    @Test
    @DisplayName("SSOT 4종 행은 마이그 후에도 그대로 유지 (재할당 없음)")
    void ssotRows_preservedUnchanged() throws Exception {
        assertRoleEquals("ssot-admin@a.com", "ADMIN");
        assertRoleEquals("ssot-staff@a.com", "STAFF");
        assertRoleEquals("ssot-consultant@a.com", "CONSULTANT");
        assertRoleEquals("ssot-client@a.com", "CLIENT");
    }

    @Test
    @DisplayName("데이터 손실 0건: 시드 17행 → 마이그 후에도 17행")
    void rowCount_preserved() throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM users")) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt(1))
                    .as("users 행 수 (시드 17 = 레거시 ADMIN 매핑 11 + 치료사 2 + SSOT 4)")
                    .isEqualTo(17);
        }
    }

    @Test
    @DisplayName("정착 검증: 모든 users.role 값이 SSOT 4종(ADMIN/STAFF/CONSULTANT/CLIENT) 안에 있다")
    void allRoles_withinSsot() throws Exception {
        Set<String> distinctRoles = new HashSet<>();
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery("SELECT DISTINCT role FROM users")) {
            while (rs.next()) {
                distinctRoles.add(rs.getString(1).toUpperCase(Locale.ROOT));
            }
        }
        assertThat(distinctRoles)
                .as("users.role 의 distinct 값 — SSOT 4종 부분집합")
                .isSubsetOf(SSOT_ROLES);
    }

    @Test
    @DisplayName("Idempotency: 마이그 재실행 후에도 결과 동일 (NO-OP)")
    void migration_idempotentReplay() throws Exception {
        runMigrationScript(MIGRATION_PATH);

        Set<String> distinctRoles = new HashSet<>();
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery("SELECT DISTINCT role FROM users")) {
            while (rs.next()) {
                distinctRoles.add(rs.getString(1).toUpperCase(Locale.ROOT));
            }
        }
        assertThat(distinctRoles)
                .as("재실행 후 users.role distinct 값 — SSOT 4종 부분집합")
                .isSubsetOf(SSOT_ROLES);

        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM users")) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt(1))
                    .as("재실행 후 users 행 수 보존")
                    .isEqualTo(17);
        }
    }

    @Test
    @DisplayName("ADMIN 카운트: 레거시 11 + SSOT 1 = 12행")
    void adminCount_postMigration() throws Exception {
        assertRoleCount("ADMIN", 12);
    }

    @Test
    @DisplayName("CONSULTANT 카운트: 레거시 2 + SSOT 1 = 3행")
    void consultantCount_postMigration() throws Exception {
        assertRoleCount("CONSULTANT", 3);
    }

    @Test
    @DisplayName("STAFF 카운트: SSOT 1 (마이그 영향 없음)")
    void staffCount_postMigration() throws Exception {
        assertRoleCount("STAFF", 1);
    }

    @Test
    @DisplayName("CLIENT 카운트: SSOT 1 (마이그 영향 없음)")
    void clientCount_postMigration() throws Exception {
        assertRoleCount("CLIENT", 1);
    }

    private void assertRoleEquals(String email, String expectedRole) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT role FROM users WHERE email = ?")) {
            ps.setString(1, email);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).as("email=%s row exists", email).isTrue();
                assertThat(rs.getString(1).toUpperCase(Locale.ROOT))
                        .as("email=%s role 매핑", email)
                        .isEqualTo(expectedRole);
            }
        }
    }

    private void assertRoleCount(String role, int expected) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT COUNT(*) FROM users WHERE role = ?")) {
            ps.setString(1, role);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1))
                        .as("role=%s 행 수", role)
                        .isEqualTo(expected);
            }
        }
    }
}

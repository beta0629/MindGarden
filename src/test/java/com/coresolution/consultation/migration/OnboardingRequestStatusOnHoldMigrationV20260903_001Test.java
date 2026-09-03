package com.coresolution.consultation.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.Locale;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * V20260903_001 마이그레이션 정착 검증 — onboarding_request.status ON_HOLD / IN_REVIEW
 * 허용을 위해 chk_onboarding_status DROP + VARCHAR(50) 전환.
 *
 * <p>V47 과 동일하게 CHECK 에 ON_HOLD/IN_REVIEW 가 없는 레거시 스키마를 seed 한 뒤
 * 마이그레이션 적용 후 OnboardingServiceImpl write-path 와 동일한 UPDATE 가 성공하는지 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260903_001 마이그레이션 검증 — onboarding status ON_HOLD truncation/CHECK 해소")
class OnboardingRequestStatusOnHoldMigrationV20260903_001Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:onboarding-status-onhold-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260903_001__onboarding_request_status_allow_on_hold.sql";

    private static final long REQUEST_ID = 1L;

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedLegacyOnboardingTable();
        seedPendingRow();
        runMigrationScript(MIGRATION_PATH);
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    /**
     * V47 레거시와 동일 — status VARCHAR(20) + chk_onboarding_status (ON_HOLD/IN_REVIEW 없음).
     */
    private void seedLegacyOnboardingTable() throws Exception {
        execute("CREATE TABLE onboarding_request ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_name VARCHAR(120) NOT NULL,"
                + "requested_by VARCHAR(64) NOT NULL,"
                + "status VARCHAR(20) NOT NULL DEFAULT 'PENDING',"
                + "risk_level VARCHAR(16) NOT NULL DEFAULT 'LOW',"
                + "version BIGINT NOT NULL DEFAULT 0,"
                + "CONSTRAINT chk_onboarding_status CHECK ("
                + "status IN ('PENDING','APPROVED','REJECTED','CANCELLED')"
                + "),"
                + "CONSTRAINT chk_onboarding_risk_level CHECK ("
                + "risk_level IN ('LOW','MEDIUM','HIGH')"
                + ")"
                + ")");
    }

    private void seedPendingRow() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO onboarding_request "
                        + "(id, tenant_name, requested_by, status, risk_level, version) "
                        + "VALUES (?, ?, ?, ?, ?, ?)")) {
            ps.setLong(1, REQUEST_ID);
            ps.setString(2, "test-tenant");
            ps.setString(3, "requester-1");
            ps.setString(4, "PENDING");
            ps.setString(5, "LOW");
            ps.setLong(6, 0L);
            ps.executeUpdate();
        }
    }

    /**
     * 운영(MySQL) 정본 SQL 을 H2(MODE=MySQL) 상에서 실행한다.
     * H2 는 PREPARE / EXECUTE 동적 SQL 을 파싱하지 못하므로 {@code continueOnError=true} 로
     * §1–2 를 우회하고, §3 fallback DROP CONSTRAINT / MODIFY 로 스키마 전환을 검증한다.
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
    @DisplayName("마이그 전: status=ON_HOLD UPDATE 는 CHECK 제약으로 실패")
    void beforeMigration_onHoldUpdateWouldFail() throws Exception {
        try (Connection preConn = DriverManager.getConnection(
                "jdbc:h2:mem:onboarding-pre-mig;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                        + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1",
                "sa", "")) {
            try (Statement st = preConn.createStatement()) {
                st.execute("CREATE TABLE onboarding_request ("
                        + "id BIGINT NOT NULL PRIMARY KEY,"
                        + "status VARCHAR(20) NOT NULL,"
                        + "CONSTRAINT chk_onboarding_status CHECK ("
                        + "status IN ('PENDING','APPROVED','REJECTED','CANCELLED')"
                        + "))");
                st.execute("INSERT INTO onboarding_request (id, status) VALUES (1, 'PENDING')");
            }
            assertThatThrownBy(() -> {
                try (PreparedStatement ps = preConn.prepareStatement(
                        "UPDATE onboarding_request SET status = ? WHERE id = ?")) {
                    ps.setString(1, "ON_HOLD");
                    ps.setLong(2, 1L);
                    ps.executeUpdate();
                }
            }).isInstanceOf(SQLException.class);
        }
    }

    @Test
    @DisplayName("마이그 후: ON_HOLD / IN_REVIEW UPDATE 성공")
    void afterMigration_onHoldAndInReviewUpdateSucceed() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE onboarding_request SET status = ? WHERE id = ?")) {
            ps.setString(1, "ON_HOLD");
            ps.setLong(2, REQUEST_ID);
            assertThat(ps.executeUpdate()).isEqualTo(1);
        }

        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT status FROM onboarding_request WHERE id = ?")) {
            ps.setLong(1, REQUEST_ID);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("ON_HOLD");
            }
        }

        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE onboarding_request SET status = ? WHERE id = ?")) {
            ps.setString(1, "IN_REVIEW");
            ps.setLong(2, REQUEST_ID);
            assertThat(ps.executeUpdate()).isEqualTo(1);
        }

        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT status FROM onboarding_request WHERE id = ?")) {
            ps.setLong(1, REQUEST_ID);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("IN_REVIEW");
            }
        }
    }

    @Test
    @DisplayName("마이그 후: status 컬럼 타입이 VARCHAR(50+)")
    void afterMigration_statusColumnIsVarchar50() throws Exception {
        assertVarcharColumn("status", 50);
    }

    @Test
    @DisplayName("마이그 후: chk_onboarding_status 제거 또는 비차단")
    void afterMigration_checkConstraintGoneOrNonBlocking() throws Exception {
        boolean checkPresent = isCheckConstraintPresent("chk_onboarding_status");
        if (checkPresent) {
            // 남아 있더라도 ON_HOLD 가 통과해야 함 (비차단)
            try (PreparedStatement ps = connection.prepareStatement(
                    "UPDATE onboarding_request SET status = ? WHERE id = ?")) {
                ps.setString(1, "ON_HOLD");
                ps.setLong(2, REQUEST_ID);
                assertThat(ps.executeUpdate()).isEqualTo(1);
            }
        } else {
            assertThat(checkPresent).isFalse();
        }
    }

    @Test
    @DisplayName("마이그 후: risk_level CHECK 유지 (변경 없음)")
    void afterMigration_riskLevelCheckUnchanged() throws Exception {
        assertThatThrownBy(() -> {
            try (PreparedStatement ps = connection.prepareStatement(
                    "UPDATE onboarding_request SET risk_level = ? WHERE id = ?")) {
                ps.setString(1, "CRITICAL");
                ps.setLong(2, REQUEST_ID);
                ps.executeUpdate();
            }
        }).isInstanceOf(SQLException.class);
    }

    @Test
    @DisplayName("마이그 재실행: 멱등 NO-OP (IN_REVIEW 값 유지)")
    void migration_idempotent() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE onboarding_request SET status = ? WHERE id = ?")) {
            ps.setString(1, "IN_REVIEW");
            ps.setLong(2, REQUEST_ID);
            ps.executeUpdate();
        }
        runMigrationScript(MIGRATION_PATH);
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT status FROM onboarding_request WHERE id = ?")) {
            ps.setLong(1, REQUEST_ID);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("IN_REVIEW");
            }
        }
        assertVarcharColumn("status", 50);
    }

    private boolean isCheckConstraintPresent(String constraintName) throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS "
                             + "WHERE TABLE_NAME='onboarding_request' "
                             + "AND CONSTRAINT_NAME='" + constraintName + "' "
                             + "AND CONSTRAINT_TYPE='CHECK'")) {
            assertThat(rs.next()).isTrue();
            return rs.getInt(1) > 0;
        }
    }

    private void assertVarcharColumn(String columnName, int expectedLength) throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='onboarding_request' "
                             + "AND COLUMN_NAME='" + columnName + "'")) {
            assertThat(rs.next()).isTrue();
            String dataType = rs.getString(1).toLowerCase(Locale.ROOT);
            assertThat(dataType)
                    .as("column %s DATA_TYPE", columnName)
                    .isIn("varchar", "character varying");
            assertThat(rs.getInt(2)).isGreaterThanOrEqualTo(expectedLength);
        }
    }
}

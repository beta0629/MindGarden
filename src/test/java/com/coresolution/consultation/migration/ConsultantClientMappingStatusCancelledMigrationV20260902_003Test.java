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
 * V20260902_003 마이그레이션 정착 검증 — consultant_client_mappings status/payment_status
 * VARCHAR(50) 전환으로 terminate CANCELLED truncation 해소.
 *
 * <p>레거시 ENUM status (CANCELLED 미포함) + 짧은 payment_status 로 seed 한 뒤
 * 마이그레이션 적용 후 terminate write-path 와 동일한 UPDATE 가 성공하는지 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260902_003 마이그레이션 검증 — mapping status CANCELLED truncation 해소")
class ConsultantClientMappingStatusCancelledMigrationV20260902_003Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:mapping-status-cancelled-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260902_003__consultant_client_mappings_status_allow_cancelled.sql";

    private static final long MAPPING_ID = 1L;

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedLegacyMappingTable();
        seedPendingPaymentRow();
        runMigrationScript(MIGRATION_PATH);
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    /**
     * 레거시 운영과 동일 — status ENUM 에 CANCELLED 없음, payment_status ENUM(짧은 값 집합).
     */
    private void seedLegacyMappingTable() throws Exception {
        execute("CREATE TABLE consultant_client_mappings ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "status ENUM("
                + "'PENDING_PAYMENT','PAYMENT_CONFIRMED','DEPOSIT_PENDING','DEPOSIT_CONFIRMED',"
                + "'ACTIVE','INACTIVE','SUSPENDED','TERMINATED','SESSIONS_EXHAUSTED'"
                + ") NOT NULL DEFAULT 'PENDING_PAYMENT',"
                + "payment_status ENUM('PENDING','CONFIRMED','APPROVED','REJECTED') "
                + "NOT NULL DEFAULT 'PENDING',"
                + "approved_by VARCHAR(50) NULL,"
                + "assigned_by VARCHAR(50) NULL,"
                + "admin_approval_date TIMESTAMP NULL,"
                + "assigned_at TIMESTAMP NULL,"
                + "version BIGINT NOT NULL DEFAULT 0"
                + ")");
    }

    private void seedPendingPaymentRow() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO consultant_client_mappings "
                        + "(id, status, payment_status, version) VALUES (?, ?, ?, ?)")) {
            ps.setLong(1, MAPPING_ID);
            ps.setString(2, "PENDING_PAYMENT");
            ps.setString(3, "PENDING");
            ps.setLong(4, 0L);
            ps.executeUpdate();
        }
    }

    /**
     * 운영(MySQL) 정본 SQL 을 H2(MODE=MySQL) 상에서 실행한다.
     * H2 는 PREPARE / EXECUTE 동적 SQL 을 파싱하지 못하므로 {@code continueOnError=true} 로
     * §1–4 를 우회하고, §5 fallback direct MODIFY 로 스키마 전환을 검증한다.
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
    @DisplayName("마이그 전: status=CANCELLED UPDATE 는 ENUM 제약으로 실패")
    void beforeMigration_cancelledUpdateWouldFail() throws Exception {
        // 별도 DB 인스턴스에서 prereq 만 적용 (마이그 미실행)
        try (Connection preConn = DriverManager.getConnection(
                "jdbc:h2:mem:mapping-pre-mig;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                        + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1",
                "sa", "")) {
            try (Statement st = preConn.createStatement()) {
                st.execute("CREATE TABLE consultant_client_mappings ("
                        + "id BIGINT NOT NULL PRIMARY KEY,"
                        + "status ENUM('PENDING_PAYMENT','ACTIVE','TERMINATED') NOT NULL,"
                        + "payment_status ENUM('PENDING','REJECTED') NOT NULL DEFAULT 'PENDING',"
                        + "version BIGINT NOT NULL DEFAULT 0)");
                st.execute("INSERT INTO consultant_client_mappings "
                        + "(id, status, payment_status) VALUES (1, 'PENDING_PAYMENT', 'PENDING')");
            }
            assertThatThrownBy(() -> {
                try (PreparedStatement ps = preConn.prepareStatement(
                        "UPDATE consultant_client_mappings "
                                + "SET status = ?, payment_status = ? WHERE id = ?")) {
                    ps.setString(1, "CANCELLED");
                    ps.setString(2, "REJECTED");
                    ps.setLong(3, 1L);
                    ps.executeUpdate();
                }
            }).isInstanceOf(SQLException.class);
        }
    }

    @Test
    @DisplayName("마이그 후: terminate 와 동일 UPDATE (CANCELLED + REJECTED) 성공")
    void afterMigration_terminateUpdateSucceeds() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE consultant_client_mappings "
                        + "SET status = ?, payment_status = ?, "
                        + "approved_by = ?, assigned_by = ? "
                        + "WHERE id = ? AND version = ?")) {
            ps.setString(1, "CANCELLED");
            ps.setString(2, "REJECTED");
            ps.setString(3, "admin-user");
            ps.setString(4, "assigner-user");
            ps.setLong(5, MAPPING_ID);
            ps.setLong(6, 0L);
            assertThat(ps.executeUpdate()).isEqualTo(1);
        }

        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT status, payment_status FROM consultant_client_mappings WHERE id = ?")) {
            ps.setLong(1, MAPPING_ID);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("CANCELLED");
                assertThat(rs.getString(2)).isEqualTo("REJECTED");
            }
        }
    }

    @Test
    @DisplayName("마이그 후: status / payment_status 컬럼 타입이 VARCHAR(50)")
    void afterMigration_columnTypesAreVarchar50() throws Exception {
        assertVarcharColumn("status", 50);
        assertVarcharColumn("payment_status", 50);
    }

    @Test
    @DisplayName("마이그 후: approved_by / assigned_by 가 VARCHAR(100) 으로 확장")
    void afterMigration_auditorColumnsExpanded() throws Exception {
        assertVarcharColumn("approved_by", 100);
        assertVarcharColumn("assigned_by", 100);
    }

    @Test
    @DisplayName("마이그 후: admin_approval_date / assigned_at DATETIME 유지 (변경 없음)")
    void afterMigration_datetimeColumnsUnchanged() throws Exception {
        assertColumnDataType("admin_approval_date", "timestamp");
        assertColumnDataType("assigned_at", "timestamp");
    }

    @Test
    @DisplayName("마이그 재실행: 멱등 NO-OP (CANCELLED 값 유지)")
    void migration_idempotent() throws Exception {
        applyTerminateUpdate();
        runMigrationScript(MIGRATION_PATH);
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT status FROM consultant_client_mappings WHERE id = ?")) {
            ps.setLong(1, MAPPING_ID);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("CANCELLED");
            }
        }
    }

    private void applyTerminateUpdate() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE consultant_client_mappings "
                        + "SET status = ?, payment_status = ? WHERE id = ?")) {
            ps.setString(1, "CANCELLED");
            ps.setString(2, "REJECTED");
            ps.setLong(3, MAPPING_ID);
            ps.executeUpdate();
        }
    }

    private void assertVarcharColumn(String columnName, int expectedLength) throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='consultant_client_mappings' "
                             + "AND COLUMN_NAME='" + columnName + "'")) {
            assertThat(rs.next()).isTrue();
            String dataType = rs.getString(1).toLowerCase(Locale.ROOT);
            assertThat(dataType)
                    .as("column %s DATA_TYPE", columnName)
                    .isIn("varchar", "character varying");
            assertThat(rs.getInt(2)).isGreaterThanOrEqualTo(expectedLength);
        }
    }

    private void assertColumnDataType(String columnName, String expectedDataType) throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='consultant_client_mappings' "
                             + "AND COLUMN_NAME='" + columnName + "'")) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString(1).toLowerCase(Locale.ROOT)).isEqualTo(expectedDataType);
        }
    }
}

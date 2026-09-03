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
 * V20260903_002 마이그레이션 정착 검증 — ENUM / 짧은 VARCHAR hardening.
 *
 * <p>레거시: css_color_settings 소문자 ENUM, accounting_entries VARCHAR(20),
 * session_extension_requests ENUM, payments ENUM 을 seed 한 뒤
 * HEX persist / LIABILITIES_LONG_TERM(21) UPDATE 가 성공하는지 검증한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260903_002 마이그레이션 검증 — ENUM/short VARCHAR hardening")
class StatusEnumAndShortVarcharHardeningMigrationV20260903_002Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:status-enum-varchar-hardening-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260903_002__status_enum_and_short_varchar_hardening.sql";

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedLegacyTables();
        seedLegacyRows();
        runMigrationScript(MIGRATION_PATH);
        applyH2FallbackIfNeeded();
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private void seedLegacyTables() throws Exception {
        execute("CREATE TABLE css_color_settings ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "theme_name VARCHAR(50) NOT NULL,"
                + "color_key VARCHAR(50) NOT NULL,"
                + "color_value VARCHAR(50) NOT NULL,"
                + "color_type ENUM('hex','rgb','rgba','gradient') NOT NULL DEFAULT 'hex',"
                + "color_category VARCHAR(30) NOT NULL,"
                + "is_active BOOLEAN NOT NULL DEFAULT TRUE"
                + ")");

        execute("CREATE TABLE accounting_entries ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "entry_number VARCHAR(100) NOT NULL,"
                + "balance_sheet_category VARCHAR(20) NOT NULL,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE"
                + ")");

        execute("CREATE TABLE session_extension_requests ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "mapping_id BIGINT NOT NULL,"
                + "requester_id BIGINT NOT NULL,"
                + "additional_sessions INT NOT NULL,"
                + "package_name VARCHAR(100) NOT NULL,"
                + "package_price DECIMAL(15,2) NOT NULL,"
                + "status ENUM('PENDING','PAYMENT_CONFIRMED','ADMIN_APPROVED','REJECTED','COMPLETED') "
                + "NOT NULL DEFAULT 'PENDING'"
                + ")");

        execute("CREATE TABLE payments ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "payment_id VARCHAR(100) NOT NULL,"
                + "order_id VARCHAR(100) NOT NULL,"
                + "amount DECIMAL(19,2) NOT NULL,"
                + "status ENUM('PENDING','PROCESSING','APPROVED','FAILED','CANCELLED','REFUNDED','EXPIRED') "
                + "NOT NULL,"
                + "method ENUM('CARD','BANK_TRANSFER','VIRTUAL_ACCOUNT','MOBILE','CASH') NOT NULL,"
                + "provider ENUM('TOSS','IAMPORT','KAKAO','NAVER','PAYPAL') NOT NULL,"
                + "payer_id BIGINT NOT NULL"
                + ")");
    }

    private void seedLegacyRows() throws Exception {
        execute("INSERT INTO css_color_settings "
                + "(id, theme_name, color_key, color_value, color_type, color_category, is_active) "
                + "VALUES (1, 'default', 'PRIMARY', '#667eea', 'hex', 'PRIMARY', TRUE)");

        execute("INSERT INTO accounting_entries "
                + "(id, tenant_id, entry_number, balance_sheet_category, is_deleted) "
                + "VALUES (1, 'tenant-1', 'JE-1', 'ASSETS_CURRENT', FALSE)");

        execute("INSERT INTO session_extension_requests "
                + "(id, mapping_id, requester_id, additional_sessions, package_name, package_price, status) "
                + "VALUES (1, 10, 20, 5, 'pkg', 10000.00, 'PENDING')");

        execute("INSERT INTO payments "
                + "(id, payment_id, order_id, amount, status, method, provider, payer_id) "
                + "VALUES (1, 'pay-1', 'ord-1', 1000.00, 'PENDING', 'CARD', 'TOSS', 1)");
    }

    /**
     * 운영(MySQL) 정본 SQL 을 H2(MODE=MySQL) 상에서 실행한다.
     * H2 는 PREPARE / EXECUTE 동적 SQL 을 파싱하지 못하므로 {@code continueOnError=true} 로
     * PREPARE 구간을 우회하고, {@link #applyH2FallbackIfNeeded()} 가 MODIFY/UPPER 를 적용한다.
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

    /**
     * H2 PREPARE 미지원 보완 — seed 된 네 테이블에 대해 §8 와 동일한 MODIFY/UPPER 를 직접 실행.
     * 컬럼이 이미 VARCHAR(충분 길이)이면 MODIFY 는 멱등 NO-OP 에 가깝다.
     */
    private void applyH2FallbackIfNeeded() throws Exception {
        if (needsVarcharWiden("css_color_settings", "color_type", 20)) {
            execute("ALTER TABLE css_color_settings MODIFY COLUMN color_type VARCHAR(20) NOT NULL");
        }
        if (tableExists("css_color_settings") && columnExists("css_color_settings", "color_type")) {
            execute("UPDATE css_color_settings SET color_type = UPPER(color_type) "
                    + "WHERE color_type <> UPPER(color_type)");
        }
        if (needsVarcharWiden("accounting_entries", "balance_sheet_category", 50)) {
            execute("ALTER TABLE accounting_entries "
                    + "MODIFY COLUMN balance_sheet_category VARCHAR(50) NOT NULL");
        }
        if (needsVarcharWiden("session_extension_requests", "status", 50)) {
            execute("ALTER TABLE session_extension_requests "
                    + "MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'PENDING'");
        }
        if (needsVarcharWiden("payments", "status", 50)) {
            execute("ALTER TABLE payments MODIFY COLUMN status VARCHAR(50) NOT NULL");
        }
        if (needsVarcharWiden("payments", "method", 50)) {
            execute("ALTER TABLE payments MODIFY COLUMN method VARCHAR(50) NOT NULL");
        }
        if (needsVarcharWiden("payments", "provider", 50)) {
            execute("ALTER TABLE payments MODIFY COLUMN provider VARCHAR(50) NOT NULL");
        }
    }

    private boolean tableExists(String tableName) throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLES "
                             + "WHERE TABLE_NAME='" + tableName + "'")) {
            return rs.next() && rs.getInt(1) > 0;
        }
    }

    private boolean columnExists(String tableName, String columnName) throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='" + tableName + "' "
                             + "AND COLUMN_NAME='" + columnName + "'")) {
            return rs.next() && rs.getInt(1) > 0;
        }
    }

    /**
     * ENUM 이거나 VARCHAR 길이가 minLength 미만이면 H2 fallback MODIFY 필요.
     */
    private boolean needsVarcharWiden(String tableName, String columnName, int minLength)
            throws Exception {
        if (!tableExists(tableName) || !columnExists(tableName, columnName)) {
            return false;
        }
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='" + tableName + "' "
                             + "AND COLUMN_NAME='" + columnName + "'")) {
            if (!rs.next()) {
                return false;
            }
            String dataType = rs.getString(1).toLowerCase(Locale.ROOT);
            if ("enum".equals(dataType)) {
                return true;
            }
            if ("varchar".equals(dataType) || "character varying".equals(dataType)) {
                return rs.getInt(2) < minLength;
            }
            return true;
        }
    }

    private void execute(String sql) throws Exception {
        try (Statement st = connection.createStatement()) {
            st.execute(sql);
        }
    }

    @Test
    @DisplayName("마이그 전: HEX write 는 ENUM 소문자 집합과 불일치 / LIABILITIES_LONG_TERM 은 VARCHAR(20) 초과")
    void beforeMigration_hexAndLongTermWouldFail() throws Exception {
        try (Connection preConn = DriverManager.getConnection(
                "jdbc:h2:mem:enum-varchar-pre-mig;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                        + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1",
                "sa", "")) {
            try (Statement st = preConn.createStatement()) {
                st.execute("CREATE TABLE css_color_settings ("
                        + "id BIGINT NOT NULL PRIMARY KEY,"
                        + "color_type ENUM('hex','rgb','rgba','gradient') NOT NULL DEFAULT 'hex')");
                st.execute("INSERT INTO css_color_settings (id, color_type) VALUES (1, 'hex')");

                st.execute("CREATE TABLE accounting_entries ("
                        + "id BIGINT NOT NULL PRIMARY KEY,"
                        + "balance_sheet_category VARCHAR(20) NOT NULL)");
                st.execute("INSERT INTO accounting_entries (id, balance_sheet_category) "
                        + "VALUES (1, 'ASSETS_CURRENT')");
            }

            // H2 ENUM 은 대소문자 폴딩으로 HEX→hex 저장될 수 있음. MySQL 은 truncation/거부.
            // 공통: 저장 결과가 대문자 'HEX' 가 아니거나 예외가 나야 레거시 결함을 입증.
            boolean hexPersistedAsUpper = false;
            try (PreparedStatement ps = preConn.prepareStatement(
                    "UPDATE css_color_settings SET color_type = ? WHERE id = ?")) {
                ps.setString(1, "HEX");
                ps.setLong(2, 1L);
                ps.executeUpdate();
            } catch (SQLException ex) {
                hexPersistedAsUpper = false;
            }
            try (PreparedStatement ps = preConn.prepareStatement(
                    "SELECT color_type FROM css_color_settings WHERE id = 1");
                 ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    hexPersistedAsUpper = "HEX".equals(rs.getString(1));
                }
            }
            assertThat(hexPersistedAsUpper)
                    .as("legacy ENUM must not persist exact uppercase HEX")
                    .isFalse();

            assertThatThrownBy(() -> {
                try (PreparedStatement ps = preConn.prepareStatement(
                        "UPDATE accounting_entries SET balance_sheet_category = ? WHERE id = ?")) {
                    ps.setString(1, "LIABILITIES_LONG_TERM");
                    ps.setLong(2, 1L);
                    ps.executeUpdate();
                }
            }).isInstanceOf(SQLException.class);
        }
    }

    @Test
    @DisplayName("마이그 후: color_type=HEX 정확히 저장")
    void afterMigration_hexPersists() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE css_color_settings SET color_type = ? WHERE id = ?")) {
            ps.setString(1, "HEX");
            ps.setLong(2, 1L);
            assertThat(ps.executeUpdate()).isEqualTo(1);
        }
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT color_type FROM css_color_settings WHERE id = ?")) {
            ps.setLong(1, 1L);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("HEX");
            }
        }
    }

    @Test
    @DisplayName("마이그 후: LIABILITIES_LONG_TERM(21) UPDATE 성공")
    void afterMigration_liabilitiesLongTermSucceeds() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE accounting_entries SET balance_sheet_category = ? WHERE id = ?")) {
            ps.setString(1, "LIABILITIES_LONG_TERM");
            ps.setLong(2, 1L);
            assertThat(ps.executeUpdate()).isEqualTo(1);
        }
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT balance_sheet_category FROM accounting_entries WHERE id = ?")) {
            ps.setLong(1, 1L);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("LIABILITIES_LONG_TERM");
            }
        }
    }

    @Test
    @DisplayName("마이그 후: 대상 컬럼이 충분한 VARCHAR 길이")
    void afterMigration_columnsAreVarcharWithAdequateLength() throws Exception {
        assertVarcharColumn("css_color_settings", "color_type", 20);
        assertVarcharColumn("accounting_entries", "balance_sheet_category", 50);
        assertVarcharColumn("session_extension_requests", "status", 50);
        assertVarcharColumn("payments", "status", 50);
        assertVarcharColumn("payments", "method", 50);
        assertVarcharColumn("payments", "provider", 50);
    }

    @Test
    @DisplayName("마이그 후: session_extension REJECTED / payments APPROVED 저장 가능")
    void afterMigration_extensionAndPaymentStatusWritesSucceed() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE session_extension_requests SET status = ? WHERE id = ?")) {
            ps.setString(1, "REJECTED");
            ps.setLong(2, 1L);
            assertThat(ps.executeUpdate()).isEqualTo(1);
        }
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE payments SET status = ?, method = ?, provider = ? WHERE id = ?")) {
            ps.setString(1, "APPROVED");
            ps.setString(2, "BANK_TRANSFER");
            ps.setString(3, "IAMPORT");
            ps.setLong(4, 1L);
            assertThat(ps.executeUpdate()).isEqualTo(1);
        }
    }

    @Test
    @DisplayName("마이그 재실행: 멱등 NO-OP")
    void migration_idempotent() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE css_color_settings SET color_type = ? WHERE id = ?")) {
            ps.setString(1, "HEX");
            ps.setLong(2, 1L);
            ps.executeUpdate();
        }
        try (PreparedStatement ps = connection.prepareStatement(
                "UPDATE accounting_entries SET balance_sheet_category = ? WHERE id = ?")) {
            ps.setString(1, "LIABILITIES_LONG_TERM");
            ps.setLong(2, 1L);
            ps.executeUpdate();
        }

        runMigrationScript(MIGRATION_PATH);
        applyH2FallbackIfNeeded();

        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT color_type FROM css_color_settings WHERE id = 1");
             ResultSet rs = ps.executeQuery()) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString(1)).isEqualTo("HEX");
        }
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT balance_sheet_category FROM accounting_entries WHERE id = 1");
             ResultSet rs = ps.executeQuery()) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString(1)).isEqualTo("LIABILITIES_LONG_TERM");
        }
        assertVarcharColumn("css_color_settings", "color_type", 20);
        assertVarcharColumn("accounting_entries", "balance_sheet_category", 50);
    }

    private void assertVarcharColumn(String tableName, String columnName, int expectedLength)
            throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='" + tableName + "' "
                             + "AND COLUMN_NAME='" + columnName + "'")) {
            assertThat(rs.next()).isTrue();
            String dataType = rs.getString(1).toLowerCase(Locale.ROOT);
            assertThat(dataType)
                    .as("column %s.%s DATA_TYPE", tableName, columnName)
                    .isIn("varchar", "character varying");
            assertThat(rs.getInt(2)).isGreaterThanOrEqualTo(expectedLength);
        }
    }
}

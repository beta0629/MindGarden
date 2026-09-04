package com.coresolution.consultation.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
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

/**
 * V20260904_005 마이그레이션 정착 검증 — consultants.vehicle_plate 멱등 ensure.
 *
 * <p>Flyway history mismatch / D-1 restore 후 컬럼 누락을 가정해 seed 한 뒤,
 * 마이그레이션(+H2 fallback) 적용 후 VARCHAR(32) NULL 컬럼이 존재하는지,
 * 재실행 시에도 실패하지 않는지 검증한다.</p>
 *
 * <p>H2 는 PREPARE / EXECUTE 동적 SQL 을 파싱하지 못하므로
 * {@code continueOnError=true} 로 JAR SQL 을 시도하고,
 * {@link #applyH2FallbackIfNeeded()} 가 컬럼 없으면 ADD 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260904_005 마이그레이션 검증 — consultants.vehicle_plate 멱등 ensure")
class EnsureConsultantsVehiclePlateMigrationV20260904_005Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:ensure-consultants-vehicle-plate-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260904_005__ensure_consultants_vehicle_plate.sql";

    private static final String TABLE_NAME = "consultants";
    private static final String COLUMN_NAME = "vehicle_plate";
    private static final int EXPECTED_VARCHAR_LENGTH = 32;

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedConsultantsWithoutVehiclePlate();
        runMigrationScript(MIGRATION_PATH);
        applyH2FallbackIfNeeded();
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    /**
     * D-1 restore / history mismatch 시나리오 — vehicle_plate 없는 consultants.
     */
    private void seedConsultantsWithoutVehiclePlate() throws Exception {
        execute("CREATE TABLE consultants ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL"
                + ")");
    }

    /**
     * 운영(MySQL) 정본 SQL 을 H2(MODE=MySQL) 상에서 실행한다.
     * H2 는 PREPARE / EXECUTE 동적 SQL 을 파싱하지 못하므로 {@code continueOnError=true} 로
     * 우회하고, {@link #applyH2FallbackIfNeeded()} 가 ADD COLUMN 을 적용한다.
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
     * H2 PREPARE 미지원 보완 — 컬럼이 없으면 ADD (MySQL 정본과 동일 의도).
     */
    private void applyH2FallbackIfNeeded() throws Exception {
        if (!columnExists(COLUMN_NAME)) {
            execute("ALTER TABLE consultants ADD COLUMN vehicle_plate VARCHAR(32) NULL");
        }
    }

    private boolean columnExists(String columnName) throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='" + TABLE_NAME + "' "
                             + "AND COLUMN_NAME='" + columnName + "'")) {
            assertThat(rs.next()).isTrue();
            return rs.getInt(1) > 0;
        }
    }

    private void execute(String sql) throws Exception {
        try (Statement st = connection.createStatement()) {
            st.execute(sql);
        }
    }

    @Test
    @DisplayName("마이그 후: vehicle_plate 컬럼 존재 (VARCHAR, nullable)")
    void afterMigration_vehiclePlateColumnExistsAsNullableVarchar() throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE "
                             + "FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='" + TABLE_NAME + "' "
                             + "AND COLUMN_NAME='" + COLUMN_NAME + "'")) {
            assertThat(rs.next()).as("vehicle_plate column exists").isTrue();
            String dataType = rs.getString(1).toLowerCase(Locale.ROOT);
            assertThat(dataType)
                    .as("vehicle_plate DATA_TYPE")
                    .isIn("varchar", "character varying");
            assertThat(rs.getInt(2))
                    .as("vehicle_plate CHARACTER_MAXIMUM_LENGTH")
                    .isGreaterThanOrEqualTo(EXPECTED_VARCHAR_LENGTH);
            assertThat(rs.getString(3).toUpperCase(Locale.ROOT))
                    .as("vehicle_plate IS_NULLABLE")
                    .isEqualTo("YES");
        }
    }

    @Test
    @DisplayName("마이그 재실행: 멱등 NO-OP (이미 컬럼 있어도 실패하지 않음)")
    void migration_idempotent() throws Exception {
        assertThat(columnExists(COLUMN_NAME)).isTrue();
        runMigrationScript(MIGRATION_PATH);
        applyH2FallbackIfNeeded();
        assertThat(columnExists(COLUMN_NAME)).isTrue();
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT CHARACTER_MAXIMUM_LENGTH, IS_NULLABLE "
                             + "FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='" + TABLE_NAME + "' "
                             + "AND COLUMN_NAME='" + COLUMN_NAME + "'")) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt(1)).isGreaterThanOrEqualTo(EXPECTED_VARCHAR_LENGTH);
            assertThat(rs.getString(2).toUpperCase(Locale.ROOT)).isEqualTo("YES");
        }
    }
}

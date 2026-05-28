package com.coresolution.consultation.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
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
 * V20260606_009 마이그레이션 정착 검증 — ERP P0 핫픽스
 *  (financial_transactions.id=30 soft-delete 복원 + UpdateAllConsultantPerformance
 *   mind_garden 측 DROP).
 *
 * <p>검증 시나리오:
 * <ol>
 *   <li>Track 1: 운영 측정 보고서 (§M1) 와 동일한 시드 데이터
 *       (id=30, related_entity_id=9, amount=800000, INCOME, is_deleted=1) 적재 후
 *       마이그레이션 1회 실행 → is_deleted=0 + deleted_at=NULL 복원 확인.</li>
 *   <li>Track 1 idempotency: 마이그레이션 재실행 → is_deleted 가 이미 0 이면 WHERE
 *       조건 false → NO-OP 보장.</li>
 *   <li>Track 1 가드 정합: id=30 이지만 amount 불일치 시드 행은 절대 변경되지 않음.</li>
 *   <li>Track 2: mind_garden 스키마 사전 보장 + UpdateAllConsultantPerformance
 *       DROP 이 H2(MODE=MySQL) 환경에서도 fail 없이 실행 완료.</li>
 * </ol>
 *
 * <p>입력 보고서:
 *   docs/project-management/2026-05-28/ERP_AUTOMATION_DB_MEASUREMENT.md (§M1·M7·M8).
 *   참조 합의서: docs/standards/SCHEDULER_E3_FINANCIAL_TENANT_MIGRATION_PLAN.md (v2.0 시나리오 C).
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260606_009 마이그레이션 검증 — ERP P0 데이터 보정 + 프로시저 시그니처 충돌 해소")
class ErpP0DataRepairAndProcedureFixMigrationV20260606_009Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:erp-p0-data-repair-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260606_009__erp_p0_data_repair_and_procedure_signature_fix.sql";

    private static final long TARGET_FT_ID = 30L;
    private static final long TARGET_MAPPING_ID = 9L;
    private static final long TARGET_AMOUNT = 800_000L;

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedFinancialTransactionsTable();
        seedTargetRow();
        seedGuardNegativeRow();
        runMigrationScript(MIGRATION_PATH);
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    /**
     * 운영 financial_transactions 의 핵심 컬럼만 H2 최소 prereq 로 세팅한다.
     * 실 운영은 BaseEntity 가 부가 컬럼을 더 가지지만 본 마이그레이션 검증에는
     * id / related_entity_* / transaction_type / amount / is_deleted / deleted_at
     * / updated_at 만 필요하다.
     */
    private void seedFinancialTransactionsTable() throws Exception {
        execute("CREATE TABLE financial_transactions ("
                + "id BIGINT NOT NULL PRIMARY KEY,"
                + "related_entity_id BIGINT NULL,"
                + "related_entity_type VARCHAR(50) NULL,"
                + "transaction_type VARCHAR(20) NOT NULL,"
                + "amount DECIMAL(15,2) NOT NULL,"
                + "is_deleted TINYINT NOT NULL DEFAULT 0,"
                + "deleted_at TIMESTAMP NULL,"
                + "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
                + ")");
    }

    /**
     * 운영 M1 케이스 — 매칭 9, INCOME 80만원, soft-deleted (is_deleted=1).
     */
    private void seedTargetRow() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO financial_transactions "
                        + "(id, related_entity_id, related_entity_type, transaction_type, "
                        + " amount, is_deleted, deleted_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")) {
            ps.setLong(1, TARGET_FT_ID);
            ps.setLong(2, TARGET_MAPPING_ID);
            ps.setString(3, "CONSULTANT_CLIENT_MAPPING");
            ps.setString(4, "INCOME");
            ps.setLong(5, TARGET_AMOUNT);
            ps.setInt(6, 1);
            ps.executeUpdate();
        }
    }

    /**
     * 가드 정합 검증용 — amount 불일치 행은 마이그레이션 후에도 절대 변경되지 않아야 한다.
     * 일부러 동일 mapping_id + INCOME + is_deleted=1 이지만 amount 만 다르게 세팅.
     */
    private void seedGuardNegativeRow() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO financial_transactions "
                        + "(id, related_entity_id, related_entity_type, transaction_type, "
                        + " amount, is_deleted, deleted_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)")) {
            ps.setLong(1, 31L);
            ps.setLong(2, TARGET_MAPPING_ID);
            ps.setString(3, "CONSULTANT_CLIENT_MAPPING");
            ps.setString(4, "INCOME");
            ps.setLong(5, 750_000L);
            ps.setInt(6, 1);
            ps.executeUpdate();
        }
    }

    /**
     * 운영(MySQL) 정본 SQL 을 H2(MODE=MySQL) 상에서 실행한다.
     * H2 는 stored procedure DDL(DROP PROCEDURE) 자체를 파싱하지 못하므로
     * {@code ignoreFailedDrops=true} 로 DROP 실패만 우회하고 나머지(UPDATE,
     * CREATE SCHEMA) 는 정상 실행되도록 한다. Track 2 의 DROP PROCEDURE 정착은
     * 운영 측정 가이드(§Phase 5) 에서 SHOW PROCEDURE STATUS 로 검증한다.
     */
    private void runMigrationScript(String classpathLocation) throws Exception {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        ScriptUtils.executeSqlScript(
                connection,
                new EncodedResource(resource),
                false,
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
    @DisplayName("Track 1: 매칭 9 + INCOME + 80만원 FT(id=30) 의 is_deleted 가 0 으로 복원된다")
    void track1_targetRow_isDeletedRestored() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT is_deleted, deleted_at FROM financial_transactions WHERE id = ?")) {
            ps.setLong(1, TARGET_FT_ID);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).as("is_deleted").isEqualTo(0);
                assertThat(rs.getTimestamp(2)).as("deleted_at").isNull();
            }
        }
    }

    @Test
    @DisplayName("Track 1 idempotency: 마이그레이션 재실행 후에도 결과는 동일 (NO-OP)")
    void track1_idempotent_replay() throws Exception {
        runMigrationScript(MIGRATION_PATH);
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT is_deleted, deleted_at FROM financial_transactions WHERE id = ?")) {
            ps.setLong(1, TARGET_FT_ID);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).as("is_deleted after replay").isEqualTo(0);
                assertThat(rs.getTimestamp(2)).as("deleted_at after replay").isNull();
            }
        }
    }

    @Test
    @DisplayName("Track 1 가드 정합: amount 불일치 행(id=31)은 절대 변경되지 않는다")
    void track1_guard_amount_mismatch_untouched() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT is_deleted FROM financial_transactions WHERE id = ?")) {
            ps.setLong(1, 31L);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).as("guard row is_deleted (unchanged)").isEqualTo(1);
            }
        }
    }

    @Test
    @DisplayName("Track 2: mind_garden 스키마가 마이그레이션 후 존재한다 (CREATE SCHEMA IF NOT EXISTS)")
    void track2_mindGardenSchema_created() throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA "
                             + "WHERE UPPER(SCHEMA_NAME) = 'MIND_GARDEN'")) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt(1)).as("mind_garden schema count").isEqualTo(1);
        }
    }

    @Test
    @DisplayName("Track 2 SSOT: 마이그레이션 SQL 에 mind_garden.UpdateAllConsultantPerformance DROP 이 포함된다")
    void track2_sql_contains_dropProcedure() throws Exception {
        String sql = readClasspathResourceAsString(MIGRATION_PATH);
        assertThat(sql)
                .as("DROP PROCEDURE IF EXISTS mind_garden.UpdateAllConsultantPerformance statement")
                .containsIgnoringWhitespaces(
                        "DROP PROCEDURE IF EXISTS mind_garden.UpdateAllConsultantPerformance");
    }

    @Test
    @DisplayName("Track 2 SSOT: 마이그레이션 SQL 에 CREATE SCHEMA IF NOT EXISTS mind_garden 사전 가드가 포함된다")
    void track2_sql_contains_schemaGuard() throws Exception {
        String sql = readClasspathResourceAsString(MIGRATION_PATH);
        assertThat(sql)
                .as("CREATE SCHEMA IF NOT EXISTS mind_garden guard")
                .containsIgnoringWhitespaces("CREATE SCHEMA IF NOT EXISTS mind_garden");
    }

    @Test
    @DisplayName("Track 2 idempotency: 동일 마이그레이션 재실행이 H2 에서 fail 없이 완료된다")
    void track2_replay_completesWithoutError() throws Exception {
        runMigrationScript(MIGRATION_PATH);
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT is_deleted FROM financial_transactions WHERE id = ?")) {
            ps.setLong(1, TARGET_FT_ID);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1)).as("is_deleted after replay").isEqualTo(0);
            }
        }
    }

    @Test
    @DisplayName("스키마 존재 가드: 마이그레이션이 mind_garden 스키마를 생성 또는 유지한다")
    void schemaGuard_present_caseInsensitive() throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA")) {
            boolean found = false;
            while (rs.next()) {
                if ("MIND_GARDEN".equals(rs.getString(1).toUpperCase(Locale.ROOT))) {
                    found = true;
                    break;
                }
            }
            assertThat(found).as("mind_garden schema present after migration").isTrue();
        }
    }

    /**
     * 마이그레이션 SQL 정본을 텍스트로 읽어 Track 2 의 DROP PROCEDURE 문구 보존 여부를 검증한다.
     * H2 는 stored procedure 자체를 파싱하지 못하므로 운영(MySQL) SSOT 정착 여부는
     * SQL 파일 문구 grep 으로 보장한다.
     */
    private static String readClasspathResourceAsString(String path) throws Exception {
        try (var in = new ClassPathResource(path).getInputStream()) {
            return new String(in.readAllBytes(), java.nio.charset.StandardCharsets.UTF_8);
        }
    }
}

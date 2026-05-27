package com.coresolution.consultation.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V20260604_001 + V20260604_002 마이그레이션 정착 검증.
 *
 * <p>회원 lifecycle 통합 정책 (USER_LIFECYCLE_TERMINATION_POLICY) 의 W1·W2 P0 게이트
 * 를 정착하는 두 마이그레이션이 빈 DB 위에서 적용 가능하고, 6 신규 테이블의
 * 컬럼·인덱스·FK 매트릭스 와 personal_data_access_logs.target_user_id 의
 * VARCHAR(255) → BIGINT 타입 변경 + fk_pdal_target_user FK 가 정확히 반영되는지 검증.</p>
 *
 * <p>외부 MySQL 없이 인메모리 H2(MODE=MySQL) + 최소 prereq 테이블 만 선세팅한 뒤
 * 두 마이그레이션 SQL 을 그대로 실행한다. 전체 Flyway 마이그레이션 스위트(200+)
 * 가 H2-MySQL 비호환 SQL 을 일부 포함하므로 본 테스트는 W1·W2 두 마이그레이션만
 * 직접 적용해 격리 검증한다.</p>
 *
 * <p>입력 보고서: /tmp/fk-survey-report.md (core-debugger, 2026-05-27) §1.2 / §6 / W1·W2.</p>
 *
 * @author CoreSolution
 * @since 2026-06-04
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260604_001 + V20260604_002 마이그레이션 검증 — lifecycle audit + destruction tables + PDAL FK fix")
class LifecycleAuditAndDestructionMigrationTest {

    private static final String JDBC_URL =
            "jdbc:h2:mem:lifecycle-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_001 =
            "db/migration/V20260604_001__create_lifecycle_audit_and_destruction_tables.sql";
    private static final String MIGRATION_002 =
            "db/migration/V20260604_002__fix_personal_data_access_logs_target_user_id_type.sql";

    private static final List<String> NEW_TABLES = List.of(
            "audit_logs",
            "notifications",
            "personal_data_destruction_logs",
            "consultant_client_mapping_history",
            "session_compensation_history",
            "client_satisfaction_surveys");

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedPrerequisiteTables();
        runMigrationScript(MIGRATION_001);
        runMigrationScript(MIGRATION_002);
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    /**
     * 마이그레이션 적용 전 운영 DB 에 이미 존재하는 최소 prereq 테이블만 선세팅한다.
     * FK 정의 대상이 되는 users(id), consultant_client_mappings(id), 그리고 §6 ALTER 대상인
     * personal_data_access_logs(target_user_id VARCHAR(255)) 만 만들어 둔다.
     */
    private void seedPrerequisiteTables() throws Exception {
        execute("CREATE TABLE users ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(50) NOT NULL,"
                + "email VARCHAR(255) NULL,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE,"
                + "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
                + ")");
        execute("CREATE TABLE consultant_client_mappings ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(50) NOT NULL,"
                + "client_id BIGINT NULL,"
                + "consultant_id BIGINT NULL,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE,"
                + "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
                + ")");
        execute("CREATE TABLE personal_data_access_logs ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(50) NULL,"
                + "accessor_id VARCHAR(255) NOT NULL,"
                + "data_type VARCHAR(255) NOT NULL,"
                + "access_type VARCHAR(255) NOT NULL,"
                + "target_user_id VARCHAR(255) NULL,"
                + "target_user_name VARCHAR(255) NULL,"
                + "access_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                + "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE"
                + ")");
    }

    private void runMigrationScript(String classpathLocation) throws Exception {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        ScriptUtils.executeSqlScript(
                new SingleConnectionDataSource(connection, true).getConnection(),
                resource);
    }

    private void execute(String sql) throws Exception {
        try (Statement st = connection.createStatement()) {
            st.execute(sql);
        }
    }

    @Test
    @DisplayName("V20260604_001: 6 신규 테이블이 모두 생성된다 (W1 P0)")
    void newTables_exist() throws Exception {
        Set<String> tables = listTables();
        for (String expected : NEW_TABLES) {
            assertThat(tables)
                    .as("신규 테이블 %s 는 생성되어야 한다 (W1 P0 — fk-survey §1.2)", expected)
                    .contains(expected);
        }
    }

    @Test
    @DisplayName("V20260604_001: audit_logs 컬럼/인덱스/FK 매트릭스가 기대치와 일치")
    void auditLogs_columns_indexes_fks() throws Exception {
        Set<String> cols = listColumns("audit_logs");
        assertThat(cols).contains(
                "id", "tenant_id", "actor_user_id", "actor_role", "target_user_id",
                "action", "entity_type", "entity_id", "before_json", "after_json",
                "metadata_json", "ip_address", "user_agent", "created_at");

        Set<String> indexes = listIndexes("audit_logs");
        assertThat(indexes).contains(
                "idx_audit_logs_tenant_created",
                "idx_audit_logs_actor",
                "idx_audit_logs_target",
                "idx_audit_logs_action",
                "idx_audit_logs_entity");

        Set<String> fks = listForeignKeyNames("audit_logs");
        assertThat(fks).contains("fk_audit_logs_actor_user", "fk_audit_logs_target_user");
    }

    @Test
    @DisplayName("V20260604_001: notifications 컬럼/인덱스/FK 매트릭스가 기대치와 일치")
    void notifications_columns_indexes_fks() throws Exception {
        Set<String> cols = listColumns("notifications");
        assertThat(cols).contains(
                "id", "tenant_id", "recipient_user_id", "sender_user_id",
                "notification_type", "title", "body", "metadata_json", "status",
                "read_at", "cancelled_at", "cancel_reason",
                "created_at", "updated_at", "is_deleted", "deleted_at");

        Set<String> indexes = listIndexes("notifications");
        assertThat(indexes).contains(
                "idx_notifications_tenant_recipient_status_created",
                "idx_notifications_sender",
                "idx_notifications_type");

        Set<String> fks = listForeignKeyNames("notifications");
        assertThat(fks).contains("fk_notifications_recipient_user", "fk_notifications_sender_user");
    }

    @Test
    @DisplayName("V20260604_001: personal_data_destruction_logs 컬럼/인덱스/FK 매트릭스가 기대치와 일치")
    void destructionLogs_columns_indexes_fks() throws Exception {
        Set<String> cols = listColumns("personal_data_destruction_logs");
        assertThat(cols).contains(
                "id", "tenant_id", "target_user_id", "destruction_type",
                "pii_columns_affected", "before_email_hash", "before_name_hash",
                "before_phone_hash", "executed_by_user_id", "execution_reason",
                "legal_basis", "executed_at", "recovery_window_until", "created_at");

        Set<String> indexes = listIndexes("personal_data_destruction_logs");
        assertThat(indexes).contains(
                "idx_pdd_logs_tenant_executed",
                "idx_pdd_logs_target",
                "idx_pdd_logs_type",
                "idx_pdd_logs_executed_by");

        Set<String> fks = listForeignKeyNames("personal_data_destruction_logs");
        assertThat(fks).contains("fk_pdd_logs_target_user", "fk_pdd_logs_executed_by_user");
    }

    @Test
    @DisplayName("V20260604_001: consultant_client_mapping_history 컬럼/인덱스/FK 매트릭스가 기대치와 일치")
    void mappingHistory_columns_indexes_fks() throws Exception {
        Set<String> cols = listColumns("consultant_client_mapping_history");
        assertThat(cols).contains(
                "id", "tenant_id", "mapping_id", "client_id", "consultant_id",
                "event_type", "before_state_json", "after_state_json",
                "triggered_by_user_id", "reason", "created_at");

        Set<String> indexes = listIndexes("consultant_client_mapping_history");
        assertThat(indexes).contains(
                "idx_ccmh_tenant_mapping_created",
                "idx_ccmh_client",
                "idx_ccmh_consultant",
                "idx_ccmh_event_type");

        Set<String> fks = listForeignKeyNames("consultant_client_mapping_history");
        assertThat(fks).contains(
                "fk_ccmh_mapping",
                "fk_ccmh_client_user",
                "fk_ccmh_consultant_user",
                "fk_ccmh_triggered_by_user");
    }

    @Test
    @DisplayName("V20260604_001: session_compensation_history 컬럼/인덱스/FK 매트릭스가 기대치와 일치")
    void sessionCompensation_columns_indexes_fks() throws Exception {
        Set<String> cols = listColumns("session_compensation_history");
        assertThat(cols).contains(
                "id", "tenant_id", "mapping_id", "client_id", "consultant_id",
                "compensation_type", "session_delta",
                "before_remaining_sessions", "after_remaining_sessions",
                "triggered_by_user_id", "reason", "created_at");

        Set<String> indexes = listIndexes("session_compensation_history");
        assertThat(indexes).contains(
                "idx_sch_tenant_mapping_created",
                "idx_sch_client",
                "idx_sch_type");

        Set<String> fks = listForeignKeyNames("session_compensation_history");
        assertThat(fks).contains(
                "fk_sch_mapping",
                "fk_sch_client_user",
                "fk_sch_triggered_by_user");
    }

    @Test
    @DisplayName("V20260604_001: client_satisfaction_surveys 컬럼/인덱스/FK 매트릭스가 기대치와 일치")
    void satisfactionSurveys_columns_indexes_fks() throws Exception {
        Set<String> cols = listColumns("client_satisfaction_surveys");
        assertThat(cols).contains(
                "id", "tenant_id", "client_id", "consultant_id",
                "mapping_id", "schedule_id",
                "overall_rating", "professionalism_rating",
                "empathy_rating", "recommendation_rating",
                "comment", "is_anonymous", "submitted_at",
                "is_deleted", "deleted_at");

        Set<String> indexes = listIndexes("client_satisfaction_surveys");
        assertThat(indexes).contains(
                "idx_css_tenant_consultant_submitted",
                "idx_css_client",
                "idx_css_mapping");

        Set<String> fks = listForeignKeyNames("client_satisfaction_surveys");
        assertThat(fks).contains(
                "fk_css_client_user",
                "fk_css_consultant_user",
                "fk_css_mapping");
    }

    @Test
    @DisplayName("V20260604_002: personal_data_access_logs.target_user_id 가 BIGINT 로 변경 (W2 P0)")
    void pdal_targetUserId_isBigint() throws Exception {
        String dataType = lookupColumnDataType("personal_data_access_logs", "target_user_id");
        assertThat(dataType.toUpperCase(Locale.ROOT))
                .as("W2 P0: target_user_id 는 BIGINT 여야 한다 (fk-survey W2)")
                .isEqualTo("BIGINT");
    }

    @Test
    @DisplayName("V20260604_002: fk_pdal_target_user FK 가 신설된다 (W2 P0)")
    void pdal_fk_exists() throws Exception {
        Set<String> fks = listForeignKeyNames("personal_data_access_logs");
        assertThat(fks)
                .as("W2 P0: target_user_id → users(id) FK (fk_pdal_target_user) 신설 필수")
                .contains("fk_pdal_target_user");
    }

    /** 신규 6 테이블 모두 NO ACTION FK 인지(운영 56/57 와 정합) 매트릭스 검증. */
    @Test
    @DisplayName("V20260604_001 + _002: 신설 FK 의 ON DELETE 동작은 모두 NO ACTION (운영 56/57 와 정합)")
    void allNewForeignKeys_noAction() throws Exception {
        List<String[]> rows = new ArrayList<>();
        rows.addAll(listForeignKeyRules("audit_logs"));
        rows.addAll(listForeignKeyRules("notifications"));
        rows.addAll(listForeignKeyRules("personal_data_destruction_logs"));
        rows.addAll(listForeignKeyRules("consultant_client_mapping_history"));
        rows.addAll(listForeignKeyRules("session_compensation_history"));
        rows.addAll(listForeignKeyRules("client_satisfaction_surveys"));
        rows.addAll(listForeignKeyRules("personal_data_access_logs"));

        // H2 INFORMATION_SCHEMA 의 DELETE_RULE 값은 "RESTRICT"/"NO ACTION"/"CASCADE"/"SET NULL"/"SET DEFAULT"
        // 중 하나로 노출된다. 본 프로젝트는 명시적으로 ON DELETE 절을 주지 않았으므로 "RESTRICT" 가 기본
        // (MySQL 8 의 NO ACTION 과 동등). 어느 쪽이든 CASCADE / SET NULL 이 아닌지만 검증한다.
        for (String[] row : rows) {
            assertThat(row[1])
                    .as("FK %s 의 DELETE_RULE 은 RESTRICT/NO ACTION 이어야 한다 (실제: %s)", row[0], row[1])
                    .isIn("RESTRICT", "NO ACTION");
        }
    }

    // --- INFORMATION_SCHEMA helpers -----------------------------------------

    private Set<String> listTables() throws Exception {
        Set<String> tables = new HashSet<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT LOWER(TABLE_NAME) FROM INFORMATION_SCHEMA.TABLES "
                        + "WHERE TABLE_SCHEMA = CURRENT_SCHEMA");
                ResultSet rs = ps.executeQuery()) {
            while (rs.next()) {
                tables.add(rs.getString(1));
            }
        }
        return tables;
    }

    private Set<String> listColumns(String table) throws Exception {
        Set<String> cols = new HashSet<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT LOWER(COLUMN_NAME) FROM INFORMATION_SCHEMA.COLUMNS "
                        + "WHERE TABLE_SCHEMA = CURRENT_SCHEMA AND LOWER(TABLE_NAME) = ?")) {
            ps.setString(1, table.toLowerCase(Locale.ROOT));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    cols.add(rs.getString(1));
                }
            }
        }
        return cols;
    }

    private Set<String> listIndexes(String table) throws Exception {
        Set<String> indexes = new HashSet<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT LOWER(INDEX_NAME) FROM INFORMATION_SCHEMA.INDEXES "
                        + "WHERE TABLE_SCHEMA = CURRENT_SCHEMA AND LOWER(TABLE_NAME) = ?")) {
            ps.setString(1, table.toLowerCase(Locale.ROOT));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    indexes.add(rs.getString(1));
                }
            }
        }
        return indexes;
    }

    private Set<String> listForeignKeyNames(String table) throws Exception {
        Set<String> fks = new HashSet<>();
        // H2 의 TABLE_CONSTRAINTS.CONSTRAINT_TYPE 은 버전에 따라 'REFERENTIAL' 또는 'FOREIGN KEY'
        // 로 노출된다. 안전하게 REFERENTIAL_CONSTRAINTS 를 직접 조회한다.
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT DISTINCT LOWER(rc.CONSTRAINT_NAME) "
                        + "FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc "
                        + "JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu "
                        + "  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME "
                        + "WHERE kcu.TABLE_SCHEMA = CURRENT_SCHEMA "
                        + "  AND LOWER(kcu.TABLE_NAME) = ?")) {
            ps.setString(1, table.toLowerCase(Locale.ROOT));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    fks.add(rs.getString(1));
                }
            }
        }
        return fks;
    }

    /** {fkName, deleteRule} 쌍 목록. */
    private List<String[]> listForeignKeyRules(String table) throws Exception {
        List<String[]> rows = new ArrayList<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT DISTINCT LOWER(rc.CONSTRAINT_NAME), rc.DELETE_RULE "
                        + "FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc "
                        + "JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu "
                        + "  ON kcu.CONSTRAINT_NAME = rc.CONSTRAINT_NAME "
                        + "WHERE kcu.TABLE_SCHEMA = CURRENT_SCHEMA "
                        + "  AND LOWER(kcu.TABLE_NAME) = ?")) {
            ps.setString(1, table.toLowerCase(Locale.ROOT));
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    rows.add(new String[]{rs.getString(1), rs.getString(2)});
                }
            }
        }
        return rows;
    }

    private String lookupColumnDataType(String table, String column) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT DATA_TYPE FROM INFORMATION_SCHEMA.COLUMNS "
                        + "WHERE TABLE_SCHEMA = CURRENT_SCHEMA "
                        + "  AND LOWER(TABLE_NAME) = ? "
                        + "  AND LOWER(COLUMN_NAME) = ?")) {
            ps.setString(1, table.toLowerCase(Locale.ROOT));
            ps.setString(2, column.toLowerCase(Locale.ROOT));
            try (ResultSet rs = ps.executeQuery()) {
                if (rs.next()) {
                    return rs.getString(1);
                }
            }
        }
        throw new IllegalStateException("Column not found: " + table + "." + column);
    }
}

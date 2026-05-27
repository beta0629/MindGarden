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
import org.springframework.jdbc.datasource.SingleConnectionDataSource;
import org.springframework.jdbc.datasource.init.ScriptUtils;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V20260605_001 + V20260605_002 마이그레이션 정착 검증 — Phase 1 lifecycle_state SSOT.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.6 (Q1) 의 SSOT 컬럼 도입과 §0.2 골든 윈도우의
 * 운영 0행 안전성을 검증한다. 인메모리 H2(MODE=MySQL) + 최소 prereq users 테이블만 만든 뒤
 * 두 마이그레이션을 그대로 적용해 격리 검증.</p>
 *
 * @author CoreSolution
 * @since 2026-06-05
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260605_001 + V20260605_002 마이그레이션 검증 — lifecycle_state SSOT + withdrawal_requested_at")
class LifecycleStateMigrationV20260605Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:lifecycle-state-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_001 =
            "db/migration/V20260605_001__add_lifecycle_state_to_users.sql";
    private static final String MIGRATION_002 =
            "db/migration/V20260605_002__add_withdrawal_requested_at_to_users.sql";

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedUsersTable();
        seedSampleRows();
        runMigrationScript(MIGRATION_001);
        runMigrationScript(MIGRATION_002);
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private void seedUsersTable() throws Exception {
        // 마이그 전 users — 운영 스키마의 핵심 컬럼만 세팅
        execute("CREATE TABLE users ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(50) NOT NULL,"
                + "email VARCHAR(255) NULL,"
                + "is_active BOOLEAN NOT NULL DEFAULT TRUE,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE,"
                + "created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
                + ")");
    }

    private void seedSampleRows() throws Exception {
        // 매핑 cron 검증용 — 4 패턴 행 사전 적재
        try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO users (tenant_id, email, is_active, is_deleted) VALUES (?, ?, ?, ?)")) {
            // 1) 활성 — DEFAULT 'ACTIVE' 적용 기대
            ps.setString(1, "tenant-A");
            ps.setString(2, "active@a.com");
            ps.setBoolean(3, true);
            ps.setBoolean(4, false);
            ps.executeUpdate();

            // 2) is_deleted=TRUE — ANONYMIZED 매핑 기대
            ps.setString(1, "tenant-A");
            ps.setString(2, "deleted@a.com");
            ps.setBoolean(3, true);
            ps.setBoolean(4, true);
            ps.executeUpdate();

            // 3) is_active=FALSE 단독 — SUSPENDED 매핑 기대
            ps.setString(1, "tenant-B");
            ps.setString(2, "suspended@b.com");
            ps.setBoolean(3, false);
            ps.setBoolean(4, false);
            ps.executeUpdate();

            // 4) is_active=FALSE + is_deleted=TRUE — ANONYMIZED 우선 (is_deleted 우선 매핑)
            ps.setString(1, "tenant-B");
            ps.setString(2, "both@b.com");
            ps.setBoolean(3, false);
            ps.setBoolean(4, true);
            ps.executeUpdate();
        }
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
    @DisplayName("V20260605_001: lifecycle_state 컬럼이 추가된다 (NOT NULL DEFAULT 'ACTIVE')")
    void lifecycleState_column_added() throws Exception {
        Set<String> cols = listColumns("users");
        assertThat(cols).contains("lifecycle_state");
    }

    @Test
    @DisplayName("V20260605_001 매핑 cron: is_deleted=TRUE → ANONYMIZED")
    void mapping_anonymized() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT lifecycle_state FROM users WHERE email = ?")) {
            ps.setString(1, "deleted@a.com");
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("ANONYMIZED");
            }
        }
    }

    @Test
    @DisplayName("V20260605_001 매핑 cron: is_active=FALSE AND is_deleted=FALSE → SUSPENDED")
    void mapping_suspended() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT lifecycle_state FROM users WHERE email = ?")) {
            ps.setString(1, "suspended@b.com");
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("SUSPENDED");
            }
        }
    }

    @Test
    @DisplayName("V20260605_001 매핑 cron: is_deleted=TRUE 가 is_active=FALSE 보다 우선 (ANONYMIZED 채택)")
    void mapping_priority_anonymized() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT lifecycle_state FROM users WHERE email = ?")) {
            ps.setString(1, "both@b.com");
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("ANONYMIZED");
            }
        }
    }

    @Test
    @DisplayName("V20260605_001 DEFAULT: 매칭 안되는 행은 ACTIVE")
    void mapping_default_active() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT lifecycle_state FROM users WHERE email = ?")) {
            ps.setString(1, "active@a.com");
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getString(1)).isEqualTo("ACTIVE");
            }
        }
    }

    @Test
    @DisplayName("V20260605_001: idx_users_lifecycle_state 인덱스 생성")
    void index_lifecycleState_created() throws Exception {
        Set<String> indexes = listIndexes("users");
        assertThat(indexes).contains("idx_users_lifecycle_state");
    }

    @Test
    @DisplayName("V20260605_001: lifecycle_state 컬럼은 NOT NULL")
    void lifecycleState_notNull() throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT IS_NULLABLE FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='users' AND COLUMN_NAME='lifecycle_state'")) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getString(1).toUpperCase(Locale.ROOT)).isEqualTo("NO");
        }
    }

    @Test
    @DisplayName("V20260605_002: withdrawal_requested_at 컬럼이 추가된다 (NULL 허용)")
    void withdrawalRequestedAt_column_added() throws Exception {
        Set<String> cols = listColumns("users");
        assertThat(cols).contains("withdrawal_requested_at");
    }

    @Test
    @DisplayName("V20260605_002: idx_users_withdrawal_pending 인덱스 생성")
    void index_withdrawalPending_created() throws Exception {
        Set<String> indexes = listIndexes("users");
        assertThat(indexes).contains("idx_users_withdrawal_pending");
    }

    @Test
    @DisplayName("V20260605_001 매핑 cron 영향 행: 4행 중 ANONYMIZED 2 / SUSPENDED 1 / ACTIVE 1")
    void mapping_counts() throws Exception {
        assertCount("ANONYMIZED", 2);
        assertCount("SUSPENDED", 1);
        assertCount("ACTIVE", 1);
    }

    private void assertCount(String state, int expected) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT COUNT(*) FROM users WHERE lifecycle_state = ?")) {
            ps.setString(1, state);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                assertThat(rs.getInt(1))
                        .as("lifecycle_state=%s 행 수", state)
                        .isEqualTo(expected);
            }
        }
    }

    private Set<String> listColumns(String tableName) throws Exception {
        Set<String> cols = new HashSet<>();
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS "
                             + "WHERE TABLE_NAME='" + tableName + "'")) {
            while (rs.next()) {
                cols.add(rs.getString(1).toLowerCase(Locale.ROOT));
            }
        }
        return cols;
    }

    private Set<String> listIndexes(String tableName) throws Exception {
        Set<String> indexes = new HashSet<>();
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT INDEX_NAME FROM INFORMATION_SCHEMA.INDEXES "
                             + "WHERE TABLE_NAME='" + tableName + "'")) {
            while (rs.next()) {
                indexes.add(rs.getString(1).toLowerCase(Locale.ROOT));
            }
        }
        return indexes;
    }
}

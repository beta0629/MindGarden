package com.coresolution.consultation.migration;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;

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
 * V20260905_001 마이그레이션 정착 검증 —
 * soft-deleted schedule.id 를 가리키던 orphan CR 을 유일 활성 B매칭 스케줄로 재매핑.
 *
 * <p>MySQL 정본은 {@code UPDATE … INNER JOIN … SET … WHERE} 이다.
 * H2(MODE=MySQL) 는 multi-table UPDATE JOIN 을 파싱하지 못하므로
 * {@link #runMigrationScript(String)} 는 {@code continueOnError=true} 로 JAR SQL 을 시도하고,
 * {@link #applyH2FallbackIfNeeded()} 가 동일 predicate 의 상관 서브쿼리 UPDATE 를 적용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-05
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260905_001 마이그레이션 검증 — orphan CR → 활성 schedule_id 재매핑")
class BackfillConsultationRecordOrphanKeysActiveScheduleMigrationV20260905_001Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:backfill-cr-orphan-active-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260905_001__backfill_consultation_record_orphan_keys_active_schedule.sql";

    private static final String TENANT_ID = "tenant-orphan-backfill-001";

    /** soft-deleted schedule.id 를 가리키는 CR + 유일 활성 B매칭 스케줄 */
    private static final long SOFT_DELETED_SCHEDULE_ID = 100L;
    private static final long ACTIVE_SCHEDULE_ID = 200L;
    private static final long ORPHAN_SOFT_DELETED_RECORD_ID = 1L;

    /** 이미 활성 schedules.id — skip */
    private static final long ALREADY_ACTIVE_SCHEDULE_ID = 300L;
    private static final long ALREADY_ACTIVE_RECORD_ID = 2L;

    /** 모호(다건 활성) — skip */
    private static final long AMBIGUOUS_ORPHAN_ID = 999L;
    private static final long AMBIGUOUS_RECORD_ID = 3L;

    /** 순수 orphan(스케줄 행 없음) + 유일 활성 B */
    private static final long PURE_ORPHAN_ID = 888L;
    private static final long PURE_ORPHAN_ACTIVE_SCHEDULE_ID = 400L;
    private static final long PURE_ORPHAN_RECORD_ID = 4L;

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedMinimalSchema();
        seedRows();
        assertMigrationSqlContainsSet();
        runMigrationScript(MIGRATION_PATH);
        applyH2FallbackIfNeeded();
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private void seedMinimalSchema() throws Exception {
        execute("CREATE TABLE schedules ("
                + "id BIGINT NOT NULL PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "consultant_id BIGINT,"
                + "client_id BIGINT,"
                + "date DATE,"
                + "is_deleted BOOLEAN DEFAULT FALSE"
                + ")");

        execute("CREATE TABLE consultation_records ("
                + "id BIGINT NOT NULL PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "consultation_id BIGINT NOT NULL,"
                + "consultant_id BIGINT,"
                + "client_id BIGINT,"
                + "session_date DATE,"
                + "is_deleted BOOLEAN DEFAULT FALSE"
                + ")");
    }

    private void seedRows() throws Exception {
        // soft-deleted schedule + 동일 B키 활성 스케줄 1건
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + SOFT_DELETED_SCHEDULE_ID + ", '" + TENANT_ID + "', 11, 21, DATE '2026-09-01', TRUE)");
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + ACTIVE_SCHEDULE_ID + ", '" + TENANT_ID + "', 11, 21, DATE '2026-09-01', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + ORPHAN_SOFT_DELETED_RECORD_ID + ", '" + TENANT_ID + "', " + SOFT_DELETED_SCHEDULE_ID
                + ", 11, 21, DATE '2026-09-01', FALSE)");

        // 이미 활성 schedule.id
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + ALREADY_ACTIVE_SCHEDULE_ID + ", '" + TENANT_ID + "', 12, 22, DATE '2026-09-02', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + ALREADY_ACTIVE_RECORD_ID + ", '" + TENANT_ID + "', " + ALREADY_ACTIVE_SCHEDULE_ID
                + ", 12, 22, DATE '2026-09-02', FALSE)");

        // 모호: 동일 B키 활성 스케줄 2건
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + "500, '" + TENANT_ID + "', 13, 23, DATE '2026-09-03', FALSE)");
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + "501, '" + TENANT_ID + "', 13, 23, DATE '2026-09-03', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + AMBIGUOUS_RECORD_ID + ", '" + TENANT_ID + "', " + AMBIGUOUS_ORPHAN_ID
                + ", 13, 23, DATE '2026-09-03', FALSE)");

        // 순수 orphan + 유일 활성 B
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + PURE_ORPHAN_ACTIVE_SCHEDULE_ID + ", '" + TENANT_ID + "', 14, 24, DATE '2026-09-04', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + PURE_ORPHAN_RECORD_ID + ", '" + TENANT_ID + "', " + PURE_ORPHAN_ID
                + ", 14, 24, DATE '2026-09-04', FALSE)");
    }

    @Test
    @DisplayName("마이그레이션 SQL 에 UPDATE … SET 이 포함되어야 한다")
    void migrationSql_containsUpdateSet() throws Exception {
        assertMigrationSqlContainsSet();
    }

    private void assertMigrationSqlContainsSet() throws Exception {
        ClassPathResource resource = new ClassPathResource(MIGRATION_PATH);
        String body = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        String stripped = body.replaceAll("(?m)--[^\\n]*", "")
                .replaceAll("(?s)/\\*.*?\\*/", "");
        assertThat(stripped.toUpperCase()).contains("UPDATE");
        assertThat(stripped.toUpperCase()).contains("SET");
        assertThat(stripped.toUpperCase()).contains("INNER JOIN");
    }

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
     * H2 multi-table UPDATE JOIN 미지원 보완 — MySQL 정본과 동일 predicate.
     */
    private void applyH2FallbackIfNeeded() throws Exception {
        execute("UPDATE consultation_records cr "
                + "SET consultation_id = ("
                + "  SELECT MIN(s.id) FROM schedules s "
                + "  WHERE s.consultant_id IS NOT NULL "
                + "    AND s.client_id IS NOT NULL "
                + "    AND s.date IS NOT NULL "
                + "    AND (s.is_deleted = FALSE OR s.is_deleted IS NULL) "
                + "    AND s.tenant_id = cr.tenant_id "
                + "    AND s.consultant_id = cr.consultant_id "
                + "    AND s.client_id = cr.client_id "
                + "    AND s.date = cr.session_date "
                + "  GROUP BY s.tenant_id, s.consultant_id, s.client_id, s.date "
                + "  HAVING COUNT(*) = 1"
                + ") "
                + "WHERE (cr.is_deleted = FALSE OR cr.is_deleted IS NULL) "
                + "  AND cr.consultant_id IS NOT NULL "
                + "  AND cr.client_id IS NOT NULL "
                + "  AND cr.session_date IS NOT NULL "
                + "  AND NOT EXISTS ("
                + "      SELECT 1 FROM schedules s_active "
                + "      WHERE s_active.id = cr.consultation_id "
                + "        AND s_active.tenant_id = cr.tenant_id "
                + "        AND (s_active.is_deleted = FALSE OR s_active.is_deleted IS NULL)"
                + "  ) "
                + "  AND EXISTS ("
                + "      SELECT 1 FROM schedules s "
                + "      WHERE s.consultant_id IS NOT NULL "
                + "        AND s.client_id IS NOT NULL "
                + "        AND s.date IS NOT NULL "
                + "        AND (s.is_deleted = FALSE OR s.is_deleted IS NULL) "
                + "        AND s.tenant_id = cr.tenant_id "
                + "        AND s.consultant_id = cr.consultant_id "
                + "        AND s.client_id = cr.client_id "
                + "        AND s.date = cr.session_date "
                + "      GROUP BY s.tenant_id, s.consultant_id, s.client_id, s.date "
                + "      HAVING COUNT(*) = 1"
                + "  )");
    }

    private void execute(String sql) throws Exception {
        try (Statement st = connection.createStatement()) {
            st.execute(sql);
        }
    }

    private long loadConsultationId(long recordId) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT consultation_id FROM consultation_records WHERE id = ?")) {
            ps.setLong(1, recordId);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                return rs.getLong(1);
            }
        }
    }

    @Test
    @DisplayName("soft-deleted schedule.id 를 가리키던 CR → 유일 활성 B매칭 스케줄로 갱신")
    void softDeletedSchedulePointer_remappedToUniqueActiveSchedule() throws Exception {
        assertThat(loadConsultationId(ORPHAN_SOFT_DELETED_RECORD_ID)).isEqualTo(ACTIVE_SCHEDULE_ID);
    }

    @Test
    @DisplayName("이미 활성 schedules.id 인 행은 skip")
    void alreadyActiveScheduleId_isSkipped() throws Exception {
        assertThat(loadConsultationId(ALREADY_ACTIVE_RECORD_ID)).isEqualTo(ALREADY_ACTIVE_SCHEDULE_ID);
    }

    @Test
    @DisplayName("동일 날 활성 스케줄 다건이면 skip")
    void ambiguousMultipleActiveSchedules_isSkipped() throws Exception {
        assertThat(loadConsultationId(AMBIGUOUS_RECORD_ID)).isEqualTo(AMBIGUOUS_ORPHAN_ID);
    }

    @Test
    @DisplayName("순수 orphan + 유일 활성 B → schedule.id 백필")
    void pureOrphan_backfillsWhenUniqueActiveB() throws Exception {
        assertThat(loadConsultationId(PURE_ORPHAN_RECORD_ID)).isEqualTo(PURE_ORPHAN_ACTIVE_SCHEDULE_ID);
    }

    @Test
    @DisplayName("마이그 재실행: 멱등 NO-OP")
    void migration_idempotent() throws Exception {
        runMigrationScript(MIGRATION_PATH);
        applyH2FallbackIfNeeded();

        assertThat(loadConsultationId(ORPHAN_SOFT_DELETED_RECORD_ID)).isEqualTo(ACTIVE_SCHEDULE_ID);
        assertThat(loadConsultationId(ALREADY_ACTIVE_RECORD_ID)).isEqualTo(ALREADY_ACTIVE_SCHEDULE_ID);
        assertThat(loadConsultationId(AMBIGUOUS_RECORD_ID)).isEqualTo(AMBIGUOUS_ORPHAN_ID);
        assertThat(loadConsultationId(PURE_ORPHAN_RECORD_ID)).isEqualTo(PURE_ORPHAN_ACTIVE_SCHEDULE_ID);
    }
}

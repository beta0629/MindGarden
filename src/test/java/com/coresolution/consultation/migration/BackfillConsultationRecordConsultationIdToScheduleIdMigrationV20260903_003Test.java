package com.coresolution.consultation.migration;

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
 * V20260903_003 마이그레이션 정착 검증 —
 * consultation_records.consultation_id 를 schedules.id 로 1:1 백필.
 *
 * <p>MySQL 정본은 {@code UPDATE … INNER JOIN … SET … WHERE} 이다.
 * H2(MODE=MySQL) 는 multi-table UPDATE JOIN 을 파싱하지 못하므로
 * {@link #runMigrationScript(String)} 는 {@code continueOnError=true} 로 JAR SQL 을 시도하고,
 * {@link #applyH2FallbackIfNeeded()} 가 동일 predicate 의 상관 서브쿼리 UPDATE 를 적용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260903_003 마이그레이션 검증 — consultation_id → schedule_id 백필")
class BackfillConsultationRecordConsultationIdToScheduleIdMigrationV20260903_003Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:backfill-cr-consultation-id-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260903_003__backfill_consultation_record_consultation_id_to_schedule_id.sql";

    private static final String TENANT_ID = "tenant-backfill-001";

    /** Step1: legacy consultations.id */
    private static final long LEGACY_CONSULTATION_ID = 100L;
    private static final long STEP1_SCHEDULE_ID = 1000L;
    private static final long STEP1_RECORD_ID = 1L;

    /** 이미 schedules.id 를 가리키는 행 — skip */
    private static final long ALREADY_SCHEDULE_ID = 2000L;
    private static final long ALREADY_RECORD_ID = 2L;

    /** Step2: orphan consultation_id + 유일 스케줄 */
    private static final long ORPHAN_CONSULTATION_ID = 999L;
    private static final long STEP2_SCHEDULE_ID = 3000L;
    private static final long STEP2_RECORD_ID = 3L;

    /** 모호(다건) Step2 — skip */
    private static final long AMBIGUOUS_CONSULTATION_ID = 888L;
    private static final long AMBIGUOUS_RECORD_ID = 4L;

    /** Step1 모호(동일 consultation_id 스케줄 2건) — skip */
    private static final long AMBIGUOUS_LEGACY_CONSULTATION_ID = 200L;
    private static final long AMBIGUOUS_STEP1_RECORD_ID = 5L;

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedMinimalSchema();
        seedRows();
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
        execute("CREATE TABLE consultations ("
                + "id BIGINT NOT NULL PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "is_deleted BOOLEAN DEFAULT FALSE"
                + ")");

        execute("CREATE TABLE schedules ("
                + "id BIGINT NOT NULL PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "consultation_id BIGINT,"
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
        // Step1: consultations.id=100 → 단일 schedule.id=1000
        execute("INSERT INTO consultations (id, tenant_id, is_deleted) VALUES ("
                + LEGACY_CONSULTATION_ID + ", '" + TENANT_ID + "', FALSE)");
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + STEP1_SCHEDULE_ID + ", '" + TENANT_ID + "', " + LEGACY_CONSULTATION_ID
                + ", 11, 21, DATE '2026-09-01', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + STEP1_RECORD_ID + ", '" + TENANT_ID + "', " + LEGACY_CONSULTATION_ID
                + ", 11, 21, DATE '2026-09-01', FALSE)");

        // 이미 schedules.id — skip
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + ALREADY_SCHEDULE_ID + ", '" + TENANT_ID + "', NULL, 12, 22, DATE '2026-09-02', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + ALREADY_RECORD_ID + ", '" + TENANT_ID + "', " + ALREADY_SCHEDULE_ID
                + ", 12, 22, DATE '2026-09-02', FALSE)");

        // Step2: orphan id + tenant+consultant+client+session_date 유일 스케줄
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + STEP2_SCHEDULE_ID + ", '" + TENANT_ID + "', NULL, 13, 23, DATE '2026-09-03', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + STEP2_RECORD_ID + ", '" + TENANT_ID + "', " + ORPHAN_CONSULTATION_ID
                + ", 13, 23, DATE '2026-09-03', FALSE)");

        // Step2 모호: 동일 키 스케줄 2건
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + "4000, '" + TENANT_ID + "', NULL, 14, 24, DATE '2026-09-04', FALSE)");
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + "4001, '" + TENANT_ID + "', NULL, 14, 24, DATE '2026-09-04', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + AMBIGUOUS_RECORD_ID + ", '" + TENANT_ID + "', " + AMBIGUOUS_CONSULTATION_ID
                + ", 14, 24, DATE '2026-09-04', FALSE)");

        // Step1 모호: 동일 consultation_id 링크 스케줄 2건
        execute("INSERT INTO consultations (id, tenant_id, is_deleted) VALUES ("
                + AMBIGUOUS_LEGACY_CONSULTATION_ID + ", '" + TENANT_ID + "', FALSE)");
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + "5000, '" + TENANT_ID + "', " + AMBIGUOUS_LEGACY_CONSULTATION_ID
                + ", 15, 25, DATE '2026-09-05', FALSE)");
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, is_deleted) VALUES ("
                + "5001, '" + TENANT_ID + "', " + AMBIGUOUS_LEGACY_CONSULTATION_ID
                + ", 15, 25, DATE '2026-09-05', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + AMBIGUOUS_STEP1_RECORD_ID + ", '" + TENANT_ID + "', " + AMBIGUOUS_LEGACY_CONSULTATION_ID
                + ", 15, 25, DATE '2026-09-05', FALSE)");
    }

    /**
     * 운영(MySQL) 정본 SQL 을 H2(MODE=MySQL) 상에서 실행한다.
     * H2 는 UPDATE…JOIN…SET 을 파싱하지 못하므로 {@code continueOnError=true} 로 우회하고,
     * {@link #applyH2FallbackIfNeeded()} 가 동일 predicate UPDATE 를 적용한다.
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
     * H2 multi-table UPDATE JOIN 미지원 보완 — MySQL 정본과 동일 predicate 의 상관 서브쿼리 UPDATE.
     * 서브쿼리 0건 시 SET NULL 을 막기 위해 EXISTS(HAVING COUNT(*)=1) 가드를 둔다.
     */
    private void applyH2FallbackIfNeeded() throws Exception {
        execute("UPDATE consultation_records cr "
                + "SET consultation_id = ("
                + "  SELECT MIN(s.id) FROM schedules s "
                + "  WHERE s.consultation_id IS NOT NULL "
                + "    AND (s.is_deleted = FALSE OR s.is_deleted IS NULL) "
                + "    AND s.tenant_id = cr.tenant_id "
                + "    AND s.consultation_id = cr.consultation_id "
                + "  GROUP BY s.tenant_id, s.consultation_id "
                + "  HAVING COUNT(*) = 1"
                + ") "
                + "WHERE (cr.is_deleted = FALSE OR cr.is_deleted IS NULL) "
                + "  AND EXISTS ("
                + "      SELECT 1 FROM consultations c "
                + "      WHERE c.id = cr.consultation_id AND c.tenant_id = cr.tenant_id"
                + "  ) "
                + "  AND NOT EXISTS ("
                + "      SELECT 1 FROM schedules s_self "
                + "      WHERE s_self.id = cr.consultation_id AND s_self.tenant_id = cr.tenant_id"
                + "  ) "
                + "  AND EXISTS ("
                + "      SELECT 1 FROM schedules s "
                + "      WHERE s.consultation_id IS NOT NULL "
                + "        AND (s.is_deleted = FALSE OR s.is_deleted IS NULL) "
                + "        AND s.tenant_id = cr.tenant_id "
                + "        AND s.consultation_id = cr.consultation_id "
                + "      GROUP BY s.tenant_id, s.consultation_id "
                + "      HAVING COUNT(*) = 1"
                + "  )");

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
                + "      SELECT 1 FROM schedules s_self "
                + "      WHERE s_self.id = cr.consultation_id AND s_self.tenant_id = cr.tenant_id"
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
    @DisplayName("Step1: legacy consultations.id → 단일 schedule.id 백필")
    void step1_legacyConsultationId_backfillsToUniqueScheduleId() throws Exception {
        assertThat(loadConsultationId(STEP1_RECORD_ID)).isEqualTo(STEP1_SCHEDULE_ID);
    }

    @Test
    @DisplayName("Step2: orphan consultation_id + 유일 스케줄 → schedule.id 백필")
    void step2_orphanId_backfillsWhenUniqueTenantConsultantClientDate() throws Exception {
        assertThat(loadConsultationId(STEP2_RECORD_ID)).isEqualTo(STEP2_SCHEDULE_ID);
    }

    @Test
    @DisplayName("이미 schedules.id 인 행은 skip")
    void alreadyScheduleId_isSkipped() throws Exception {
        assertThat(loadConsultationId(ALREADY_RECORD_ID)).isEqualTo(ALREADY_SCHEDULE_ID);
    }

    @Test
    @DisplayName("Step2 모호(다건 스케줄)는 skip")
    void step2_ambiguousMultipleSchedules_isSkipped() throws Exception {
        assertThat(loadConsultationId(AMBIGUOUS_RECORD_ID)).isEqualTo(AMBIGUOUS_CONSULTATION_ID);
    }

    @Test
    @DisplayName("Step1 모호(동일 consultation_id 스케줄 다건)는 skip")
    void step1_ambiguousMultipleSchedules_isSkipped() throws Exception {
        assertThat(loadConsultationId(AMBIGUOUS_STEP1_RECORD_ID))
                .isEqualTo(AMBIGUOUS_LEGACY_CONSULTATION_ID);
    }

    @Test
    @DisplayName("마이그 재실행: 멱등 NO-OP")
    void migration_idempotent() throws Exception {
        runMigrationScript(MIGRATION_PATH);
        applyH2FallbackIfNeeded();

        assertThat(loadConsultationId(STEP1_RECORD_ID)).isEqualTo(STEP1_SCHEDULE_ID);
        assertThat(loadConsultationId(STEP2_RECORD_ID)).isEqualTo(STEP2_SCHEDULE_ID);
        assertThat(loadConsultationId(ALREADY_RECORD_ID)).isEqualTo(ALREADY_SCHEDULE_ID);
        assertThat(loadConsultationId(AMBIGUOUS_RECORD_ID)).isEqualTo(AMBIGUOUS_CONSULTATION_ID);
        assertThat(loadConsultationId(AMBIGUOUS_STEP1_RECORD_ID))
                .isEqualTo(AMBIGUOUS_LEGACY_CONSULTATION_ID);
    }
}

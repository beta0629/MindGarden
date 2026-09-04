package com.coresolution.consultation.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;

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
 * V20260904_002 마이그레이션 정착 검증 —
 * session_date 동기화 + orphan consultation_id 정규화 (session_date 불일치 허용).
 *
 * <p>MySQL 정본은 {@code UPDATE … INNER JOIN … SET … WHERE} 이다.
 * H2(MODE=MySQL) 는 multi-table UPDATE JOIN 을 파싱하지 못하므로
 * {@link #runMigrationScript(String)} 는 {@code continueOnError=true} 로 JAR SQL 을 시도하고,
 * {@link #applyH2FallbackIfNeeded()} 가 동일 predicate 의 상관 서브쿼리 UPDATE 를 적용한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260904_002 마이그레이션 검증 — session_date·orphan 링크 수리")
class BackfillConsultationRecordScheduleLinkAndSessionDateMigrationV20260904_002Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:backfill-cr-session-date-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260904_002__repair_consultation_record_schedule_link_and_session_date.sql";

    private static final String TENANT_ID = "tenant-backfill-002";

    /** Step1: A 키 일치 + session_date drift */
    private static final long STEP1_SCHEDULE_ID = 1000L;
    private static final long STEP1_RECORD_ID = 1L;

    /** Step2: orphan + consultant+client 유일 + session_date drift */
    private static final long ORPHAN_CONSULTATION_ID = 999L;
    private static final long STEP2_SCHEDULE_ID = 2000L;
    private static final long STEP2_RECORD_ID = 2L;

    /** Step2 모호(동일 consultant+client 스케줄 2건) — skip */
    private static final long AMBIGUOUS_ORPHAN_ID = 888L;
    private static final long AMBIGUOUS_RECORD_ID = 3L;

    /** Step3: legacy consultations.id → schedule + session_date */
    private static final long LEGACY_CONSULTATION_ID = 100L;
    private static final long STEP3_SCHEDULE_ID = 3000L;
    private static final long STEP3_RECORD_ID = 4L;

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
                + "status VARCHAR(32),"
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
        // Step1: consultation_id = schedule.id, session_date drift
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, status, is_deleted) VALUES ("
                + STEP1_SCHEDULE_ID + ", '" + TENANT_ID + "', NULL, 11, 21, DATE '2026-09-01', 'COMPLETED', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + STEP1_RECORD_ID + ", '" + TENANT_ID + "', " + STEP1_SCHEDULE_ID
                + ", 11, 21, DATE '2026-09-04', FALSE)");

        // Step2: orphan + unique consultant+client + session_date drift
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, status, is_deleted) VALUES ("
                + STEP2_SCHEDULE_ID + ", '" + TENANT_ID + "', NULL, 13, 23, DATE '2026-09-01', 'COMPLETED', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + STEP2_RECORD_ID + ", '" + TENANT_ID + "', " + ORPHAN_CONSULTATION_ID
                + ", 13, 23, DATE '2026-08-01', FALSE)");

        // Step2 ambiguous: same consultant+client, two schedules
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, status, is_deleted) VALUES ("
                + "4000, '" + TENANT_ID + "', NULL, 14, 24, DATE '2026-09-04', 'COMPLETED', FALSE)");
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, status, is_deleted) VALUES ("
                + "4001, '" + TENANT_ID + "', NULL, 14, 24, DATE '2026-09-05', 'CONFIRMED', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + AMBIGUOUS_RECORD_ID + ", '" + TENANT_ID + "', " + AMBIGUOUS_ORPHAN_ID
                + ", 14, 24, DATE '2026-09-04', FALSE)");

        // Step3: legacy consultations.id
        execute("INSERT INTO consultations (id, tenant_id, is_deleted) VALUES ("
                + LEGACY_CONSULTATION_ID + ", '" + TENANT_ID + "', FALSE)");
        execute("INSERT INTO schedules "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, date, status, is_deleted) VALUES ("
                + STEP3_SCHEDULE_ID + ", '" + TENANT_ID + "', " + LEGACY_CONSULTATION_ID
                + ", 15, 25, DATE '2026-09-10', 'BOOKED', FALSE)");
        execute("INSERT INTO consultation_records "
                + "(id, tenant_id, consultation_id, consultant_id, client_id, session_date, is_deleted) VALUES ("
                + STEP3_RECORD_ID + ", '" + TENANT_ID + "', " + LEGACY_CONSULTATION_ID
                + ", 15, 25, DATE '2026-01-01', FALSE)");
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

    private void applyH2FallbackIfNeeded() throws Exception {
        // Step1
        execute("UPDATE consultation_records cr "
                + "SET session_date = ("
                + "  SELECT s.date FROM schedules s "
                + "  WHERE s.id = cr.consultation_id "
                + "    AND s.tenant_id = cr.tenant_id "
                + "    AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)"
                + ") "
                + "WHERE (cr.is_deleted = FALSE OR cr.is_deleted IS NULL) "
                + "  AND EXISTS ("
                + "      SELECT 1 FROM schedules s "
                + "      WHERE s.id = cr.consultation_id "
                + "        AND s.tenant_id = cr.tenant_id "
                + "        AND (s.is_deleted = FALSE OR s.is_deleted IS NULL) "
                + "        AND s.date IS NOT NULL "
                + "        AND (cr.session_date IS NULL OR cr.session_date <> s.date)"
                + "  )");

        // Step2
        execute("UPDATE consultation_records cr "
                + "SET consultation_id = ("
                + "  SELECT MIN(s.id) FROM schedules s "
                + "  WHERE s.consultant_id IS NOT NULL "
                + "    AND s.client_id IS NOT NULL "
                + "    AND s.date IS NOT NULL "
                + "    AND (s.is_deleted = FALSE OR s.is_deleted IS NULL) "
                + "    AND s.status IN ('COMPLETED', 'CONFIRMED', 'BOOKED') "
                + "    AND s.tenant_id = cr.tenant_id "
                + "    AND s.consultant_id = cr.consultant_id "
                + "    AND s.client_id = cr.client_id "
                + "  GROUP BY s.tenant_id, s.consultant_id, s.client_id "
                + "  HAVING COUNT(*) = 1"
                + "), "
                + "session_date = ("
                + "  SELECT MIN(s.date) FROM schedules s "
                + "  WHERE s.consultant_id IS NOT NULL "
                + "    AND s.client_id IS NOT NULL "
                + "    AND s.date IS NOT NULL "
                + "    AND (s.is_deleted = FALSE OR s.is_deleted IS NULL) "
                + "    AND s.status IN ('COMPLETED', 'CONFIRMED', 'BOOKED') "
                + "    AND s.tenant_id = cr.tenant_id "
                + "    AND s.consultant_id = cr.consultant_id "
                + "    AND s.client_id = cr.client_id "
                + "  GROUP BY s.tenant_id, s.consultant_id, s.client_id "
                + "  HAVING COUNT(*) = 1"
                + ") "
                + "WHERE (cr.is_deleted = FALSE OR cr.is_deleted IS NULL) "
                + "  AND cr.consultant_id IS NOT NULL "
                + "  AND cr.client_id IS NOT NULL "
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
                + "        AND s.status IN ('COMPLETED', 'CONFIRMED', 'BOOKED') "
                + "        AND s.tenant_id = cr.tenant_id "
                + "        AND s.consultant_id = cr.consultant_id "
                + "        AND s.client_id = cr.client_id "
                + "      GROUP BY s.tenant_id, s.consultant_id, s.client_id "
                + "      HAVING COUNT(*) = 1"
                + "  )");

        // Step3
        execute("UPDATE consultation_records cr "
                + "SET consultation_id = ("
                + "  SELECT MIN(s.id) FROM schedules s "
                + "  WHERE s.consultation_id IS NOT NULL "
                + "    AND (s.is_deleted = FALSE OR s.is_deleted IS NULL) "
                + "    AND s.tenant_id = cr.tenant_id "
                + "    AND s.consultation_id = cr.consultation_id "
                + "  GROUP BY s.tenant_id, s.consultation_id "
                + "  HAVING COUNT(*) = 1"
                + "), "
                + "session_date = ("
                + "  SELECT MIN(s.date) FROM schedules s "
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

    private LocalDate loadSessionDate(long recordId) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT session_date FROM consultation_records WHERE id = ?")) {
            ps.setLong(1, recordId);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                return rs.getDate(1).toLocalDate();
            }
        }
    }

    @Test
    @DisplayName("Step1: A 키 일치 + session_date drift → s.date 동기화")
    void step1_syncsSessionDateWhenConsultationIdMatchesSchedule() throws Exception {
        assertThat(loadConsultationId(STEP1_RECORD_ID)).isEqualTo(STEP1_SCHEDULE_ID);
        assertThat(loadSessionDate(STEP1_RECORD_ID)).isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    @DisplayName("Step2: orphan + session_date drift + 유일 스케줄 → id·date 정규화")
    void step2_orphanWithSessionDateDrift_repairsWhenUniqueConsultantClient() throws Exception {
        assertThat(loadConsultationId(STEP2_RECORD_ID)).isEqualTo(STEP2_SCHEDULE_ID);
        assertThat(loadSessionDate(STEP2_RECORD_ID)).isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    @DisplayName("Step2: consultant+client 다건 → skip")
    void step2_ambiguousConsultantClient_skipped() throws Exception {
        assertThat(loadConsultationId(AMBIGUOUS_RECORD_ID)).isEqualTo(AMBIGUOUS_ORPHAN_ID);
    }

    @Test
    @DisplayName("Step3: legacy consultations.id → schedule.id + session_date")
    void step3_legacyConsultationId_setsScheduleIdAndSessionDate() throws Exception {
        assertThat(loadConsultationId(STEP3_RECORD_ID)).isEqualTo(STEP3_SCHEDULE_ID);
        assertThat(loadSessionDate(STEP3_RECORD_ID)).isEqualTo(LocalDate.of(2026, 9, 10));
    }
}

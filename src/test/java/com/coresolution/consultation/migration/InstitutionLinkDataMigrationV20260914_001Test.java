package com.coresolution.consultation.migration;

import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDate;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.core.io.ClassPathResource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V20260914_001 — 타기관 연계 별 저장소 마이그.
 *
 * <p>회기 매핑 행은 그대로 두고, 마커가 있는 타기관 행만 새 테이블로 복사·소프트삭제한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20260914_001 타기관 연계 데이터 마이그")
class InstitutionLinkDataMigrationV20260914_001Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:institution-link-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20260914_001__create_institution_link_tables_and_migrate.sql";

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";

    private static final long SESSION_MAPPING_ID = 1L;
    private static final long INSTITUTION_MAPPING_ID = 2L;
    private static final long OTHER_TENANT_SESSION_MAPPING_ID = 3L;
    private static final long SESSION_SCHEDULE_ID = 10L;
    private static final long INSTITUTION_SCHEDULE_ID = 20L;
    private static final long SESSION_RECORD_ID = 100L;
    private static final long INSTITUTION_RECORD_ID = 200L;

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedMinimalSchema();
        seedRows();
        applyMigrationDml();
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private void seedMinimalSchema() throws Exception {
        execute("CREATE TABLE common_codes ("
                + "id BIGINT AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(36),"
                + "code_group VARCHAR(50) NOT NULL,"
                + "code_value VARCHAR(50) NOT NULL,"
                + "korean_name VARCHAR(100) NOT NULL,"
                + "code_label VARCHAR(2000) NOT NULL,"
                + "code_description VARCHAR(500),"
                + "extra_data VARCHAR(1000),"
                + "sort_order INT,"
                + "is_active BOOLEAN NOT NULL DEFAULT TRUE,"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "created_by VARCHAR(255),"
                + "updated_by VARCHAR(255),"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE,"
                + "version BIGINT NOT NULL DEFAULT 0"
                + ")");

        execute("CREATE TABLE consultant_client_mappings ("
                + "id BIGINT PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "consultant_id BIGINT NOT NULL,"
                + "client_id BIGINT NOT NULL,"
                + "start_date TIMESTAMP NOT NULL,"
                + "end_date TIMESTAMP,"
                + "status VARCHAR(50) NOT NULL,"
                + "package_name VARCHAR(100),"
                + "notes TEXT,"
                + "special_considerations TEXT,"
                + "responsibility VARCHAR(500),"
                + "payment_amount BIGINT,"
                + "final_amount BIGINT,"
                + "package_price BIGINT,"
                + "payment_date TIMESTAMP,"
                + "remaining_sessions INT NOT NULL DEFAULT 0,"
                + "used_sessions INT DEFAULT 0,"
                + "total_sessions INT NOT NULL DEFAULT 0,"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "deleted_at TIMESTAMP,"
                + "is_deleted BOOLEAN DEFAULT FALSE"
                + ")");

        execute("CREATE TABLE schedules ("
                + "id BIGINT PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "mapping_id BIGINT,"
                + "consultant_id BIGINT,"
                + "client_id BIGINT,"
                + "date DATE,"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "is_deleted BOOLEAN DEFAULT FALSE"
                + ")");

        execute("CREATE TABLE consultation_records ("
                + "id BIGINT PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "consultation_id BIGINT NOT NULL,"
                + "client_id BIGINT NOT NULL,"
                + "consultant_id BIGINT NOT NULL,"
                + "session_date DATE NOT NULL,"
                + "session_number INT,"
                + "client_condition TEXT,"
                + "main_issues TEXT,"
                + "intervention_methods TEXT,"
                + "client_response TEXT,"
                + "next_session_plan TEXT,"
                + "homework_assigned TEXT,"
                + "consultant_observations TEXT,"
                + "consultant_assessment TEXT,"
                + "progress_evaluation TEXT,"
                + "special_considerations TEXT,"
                + "is_session_completed BOOLEAN,"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "deleted_at TIMESTAMP,"
                + "is_deleted BOOLEAN DEFAULT FALSE"
                + ")");

        execute("CREATE TABLE institution_link_contracts ("
                + "id BIGINT AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "consultant_id BIGINT NOT NULL,"
                + "client_id BIGINT NOT NULL,"
                + "period_start DATE NOT NULL,"
                + "period_end DATE,"
                + "prepaid_amount BIGINT,"
                + "prepaid_at TIMESTAMP,"
                + "monthly_amount BIGINT,"
                + "status VARCHAR(50) NOT NULL,"
                + "institution_name VARCHAR(200),"
                + "notes TEXT,"
                + "source_mapping_id BIGINT,"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "deleted_at TIMESTAMP,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE,"
                + "version BIGINT NOT NULL DEFAULT 0"
                + ")");

        execute("CREATE TABLE institution_link_schedule_links ("
                + "id BIGINT AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "contract_id BIGINT NOT NULL,"
                + "schedule_id BIGINT NOT NULL,"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "deleted_at TIMESTAMP,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE,"
                + "version BIGINT NOT NULL DEFAULT 0"
                + ")");

        execute("CREATE TABLE institution_link_consultation_logs ("
                + "id BIGINT AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(36) NOT NULL,"
                + "contract_id BIGINT NOT NULL,"
                + "schedule_id BIGINT,"
                + "client_id BIGINT NOT NULL,"
                + "consultant_id BIGINT NOT NULL,"
                + "session_date DATE NOT NULL,"
                + "session_number INT,"
                + "client_condition TEXT,"
                + "main_issues TEXT,"
                + "intervention_methods TEXT,"
                + "client_response TEXT,"
                + "next_session_plan TEXT,"
                + "homework_assigned TEXT,"
                + "consultant_observations TEXT,"
                + "consultant_assessment TEXT,"
                + "progress_evaluation TEXT,"
                + "special_considerations TEXT,"
                + "is_session_completed BOOLEAN,"
                + "source_record_id BIGINT,"
                + "created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,"
                + "deleted_at TIMESTAMP,"
                + "is_deleted BOOLEAN NOT NULL DEFAULT FALSE,"
                + "version BIGINT NOT NULL DEFAULT 0"
                + ")");
    }

    private void seedRows() throws Exception {
        execute("INSERT INTO common_codes (tenant_id, code_group, code_value, korean_name, code_label, "
                + "is_active, is_deleted, version) VALUES "
                + "(NULL, 'INSTITUTION_LINK_MIG_MARKER', '타기관', '타기관', '타기관', TRUE, FALSE, 0),"
                + "(NULL, 'INSTITUTION_LINK_MIG_MARKER', '기관연계', '기관연계', '기관연계', TRUE, FALSE, 0),"
                + "(NULL, 'INSTITUTION_LINK_MIG_MARKER', '기관 연계', '기관 연계', '기관 연계', TRUE, FALSE, 0),"
                + "(NULL, 'INSTITUTION_LINK_MIG_MARKER', '월결제', '월결제', '월결제', TRUE, FALSE, 0),"
                + "(NULL, 'INSTITUTION_LINK_MIG_MARKER', '월계약', '월계약', '월계약', TRUE, FALSE, 0)");

        execute("INSERT INTO consultant_client_mappings ("
                + "id, tenant_id, consultant_id, client_id, start_date, status, package_name, notes,"
                + "remaining_sessions, used_sessions, total_sessions, is_deleted) VALUES ("
                + SESSION_MAPPING_ID + ", '" + TENANT_A + "', 7, 9, '2026-09-01 10:00:00', 'ACTIVE',"
                + " '10회기 패키지', '회기권', 5, 5, 10, FALSE)");

        execute("INSERT INTO consultant_client_mappings ("
                + "id, tenant_id, consultant_id, client_id, start_date, status, package_name, notes,"
                + "payment_amount, remaining_sessions, used_sessions, total_sessions, is_deleted) VALUES ("
                + INSTITUTION_MAPPING_ID + ", '" + TENANT_A + "', 7, 11, '2026-09-01 10:00:00', 'ACTIVE',"
                + " '타기관 월결제', '월단위 선납', 0, 0, 0, FALSE)");

        execute("INSERT INTO consultant_client_mappings ("
                + "id, tenant_id, consultant_id, client_id, start_date, status, package_name, notes,"
                + "remaining_sessions, used_sessions, total_sessions, is_deleted) VALUES ("
                + OTHER_TENANT_SESSION_MAPPING_ID + ", '" + TENANT_B + "', 8, 12, '2026-09-01 10:00:00',"
                + " 'ACTIVE', '10회기 패키지', '다른 테넌트 회기권', 3, 1, 4, FALSE)");

        execute("INSERT INTO schedules (id, tenant_id, mapping_id, consultant_id, client_id, date, is_deleted)"
                + " VALUES (" + SESSION_SCHEDULE_ID + ", '" + TENANT_A + "', " + SESSION_MAPPING_ID
                + ", 7, 9, DATE '2026-09-10', FALSE)");
        execute("INSERT INTO schedules (id, tenant_id, mapping_id, consultant_id, client_id, date, is_deleted)"
                + " VALUES (" + INSTITUTION_SCHEDULE_ID + ", '" + TENANT_A + "', " + INSTITUTION_MAPPING_ID
                + ", 7, 11, DATE '2026-09-11', FALSE)");

        execute("INSERT INTO consultation_records (id, tenant_id, consultation_id, client_id, consultant_id,"
                + " session_date, session_number, client_condition, is_deleted) VALUES ("
                + SESSION_RECORD_ID + ", '" + TENANT_A + "', " + SESSION_SCHEDULE_ID
                + ", 9, 7, DATE '2026-09-10', 1, '회기 일지', FALSE)");
        execute("INSERT INTO consultation_records (id, tenant_id, consultation_id, client_id, consultant_id,"
                + " session_date, session_number, client_condition, is_deleted) VALUES ("
                + INSTITUTION_RECORD_ID + ", '" + TENANT_A + "', " + INSTITUTION_SCHEDULE_ID
                + ", 11, 7, DATE '2026-09-11', NULL, '타기관 일지', FALSE)");
    }

    /**
     * V20260914_001 DML 과 동일 predicate. H2 는 파일의 ENGINE/COMMENT/공통코드 INSERT 를 생략한다.
     */
    private void applyMigrationDml() throws Exception {
        execute("INSERT INTO institution_link_contracts ("
                + "tenant_id, consultant_id, client_id, period_start, period_end,"
                + "prepaid_amount, prepaid_at, monthly_amount, status, institution_name, notes,"
                + "source_mapping_id, is_deleted, version) "
                + "SELECT m.tenant_id, m.consultant_id, m.client_id, DATE(m.start_date),"
                + " CASE WHEN m.end_date IS NOT NULL THEN DATE(m.end_date) ELSE LAST_DAY(DATE(m.start_date)) END,"
                + " COALESCE(m.payment_amount, m.final_amount, m.package_price), m.payment_date,"
                + " COALESCE(m.payment_amount, m.final_amount, m.package_price),"
                + " CASE WHEN m.status IN ('ACTIVE', 'PAYMENT_CONFIRMED', 'DEPOSIT_CONFIRMED') THEN 'ACTIVE'"
                + " WHEN m.status IN ('PENDING_PAYMENT', 'DEPOSIT_PENDING') THEN 'PREPAID' ELSE 'ENDED' END,"
                + " NULL, m.notes, m.id, FALSE, 0"
                + " FROM consultant_client_mappings m"
                + " WHERE m.tenant_id IS NOT NULL AND m.tenant_id <> ''"
                + " AND m.consultant_id IS NOT NULL AND m.client_id IS NOT NULL AND m.start_date IS NOT NULL"
                + " AND (m.is_deleted = FALSE OR m.is_deleted IS NULL)"
                + " AND EXISTS (SELECT 1 FROM common_codes cc"
                + " WHERE cc.code_group = 'INSTITUTION_LINK_MIG_MARKER' AND cc.is_deleted = FALSE"
                + " AND cc.is_active = TRUE AND (cc.tenant_id IS NULL OR cc.tenant_id = m.tenant_id)"
                + " AND (IFNULL(m.package_name, '') LIKE CONCAT('%', cc.code_value, '%')"
                + " OR IFNULL(m.notes, '') LIKE CONCAT('%', cc.code_value, '%')"
                + " OR IFNULL(m.special_considerations, '') LIKE CONCAT('%', cc.code_value, '%')"
                + " OR IFNULL(m.responsibility, '') LIKE CONCAT('%', cc.code_value, '%')))"
                + " AND NOT EXISTS (SELECT 1 FROM institution_link_contracts c"
                + " WHERE c.tenant_id = m.tenant_id AND c.source_mapping_id = m.id)");

        execute("INSERT INTO institution_link_schedule_links ("
                + "tenant_id, contract_id, schedule_id, is_deleted, version) "
                + "SELECT s.tenant_id, c.id, s.id, FALSE, 0 FROM schedules s"
                + " INNER JOIN institution_link_contracts c ON c.tenant_id = s.tenant_id"
                + " AND c.source_mapping_id = s.mapping_id AND c.is_deleted = FALSE"
                + " WHERE s.tenant_id IS NOT NULL AND s.tenant_id <> '' AND s.mapping_id IS NOT NULL"
                + " AND (s.is_deleted = FALSE OR s.is_deleted IS NULL)"
                + " AND NOT EXISTS (SELECT 1 FROM institution_link_schedule_links l"
                + " WHERE l.tenant_id = s.tenant_id AND l.schedule_id = s.id)");

        execute("INSERT INTO institution_link_consultation_logs ("
                + "tenant_id, contract_id, schedule_id, client_id, consultant_id, session_date, session_number,"
                + "client_condition, main_issues, intervention_methods, client_response, next_session_plan,"
                + "homework_assigned, consultant_observations, consultant_assessment, progress_evaluation,"
                + "special_considerations, is_session_completed, source_record_id, is_deleted, version) "
                + "SELECT r.tenant_id, l.contract_id, l.schedule_id, r.client_id, r.consultant_id, r.session_date,"
                + " r.session_number, r.client_condition, r.main_issues, r.intervention_methods, r.client_response,"
                + " r.next_session_plan, r.homework_assigned, r.consultant_observations, r.consultant_assessment,"
                + " r.progress_evaluation, r.special_considerations, r.is_session_completed, r.id, FALSE, 0"
                + " FROM consultation_records r"
                + " INNER JOIN institution_link_schedule_links l ON l.tenant_id = r.tenant_id"
                + " AND l.schedule_id = r.consultation_id AND l.is_deleted = FALSE"
                + " WHERE r.tenant_id IS NOT NULL AND r.tenant_id <> ''"
                + " AND r.client_id IS NOT NULL AND r.consultant_id IS NOT NULL AND r.session_date IS NOT NULL"
                + " AND (r.is_deleted = FALSE OR r.is_deleted IS NULL)"
                + " AND NOT EXISTS (SELECT 1 FROM institution_link_consultation_logs g"
                + " WHERE g.tenant_id = r.tenant_id AND g.source_record_id = r.id)");

        execute("UPDATE schedules s SET s.mapping_id = NULL WHERE s.tenant_id IS NOT NULL AND s.tenant_id <> ''"
                + " AND s.mapping_id IS NOT NULL AND EXISTS (SELECT 1 FROM institution_link_contracts c"
                + " WHERE c.tenant_id = s.tenant_id AND c.source_mapping_id = s.mapping_id AND c.is_deleted = FALSE)");

        execute("UPDATE consultation_records r SET r.is_deleted = TRUE,"
                + " r.deleted_at = COALESCE(r.deleted_at, CURRENT_TIMESTAMP)"
                + " WHERE r.tenant_id IS NOT NULL AND r.tenant_id <> ''"
                + " AND (r.is_deleted = FALSE OR r.is_deleted IS NULL)"
                + " AND EXISTS (SELECT 1 FROM institution_link_consultation_logs g"
                + " WHERE g.tenant_id = r.tenant_id AND g.source_record_id = r.id)");

        execute("UPDATE consultant_client_mappings m SET m.is_deleted = TRUE,"
                + " m.deleted_at = COALESCE(m.deleted_at, CURRENT_TIMESTAMP)"
                + " WHERE m.tenant_id IS NOT NULL AND m.tenant_id <> ''"
                + " AND (m.is_deleted = FALSE OR m.is_deleted IS NULL)"
                + " AND EXISTS (SELECT 1 FROM institution_link_contracts c"
                + " WHERE c.tenant_id = m.tenant_id AND c.source_mapping_id = m.id)");
    }

    private void execute(String sql) throws Exception {
        try (Statement st = connection.createStatement()) {
            st.execute(sql);
        }
    }

    private int count(String sql) throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(sql)) {
            assertThat(rs.next()).isTrue();
            return rs.getInt(1);
        }
    }

    @Test
    @DisplayName("회기 매핑 행은 삭제되지 않고 remaining_sessions 가 유지된다")
    void sessionMappingRow_untouched() throws Exception {
        assertThat(count("SELECT COUNT(*) FROM consultant_client_mappings WHERE id = "
                + SESSION_MAPPING_ID + " AND tenant_id = '" + TENANT_A + "' AND is_deleted = FALSE"))
                .isEqualTo(1);
        assertThat(count("SELECT remaining_sessions FROM consultant_client_mappings WHERE id = "
                + SESSION_MAPPING_ID)).isEqualTo(5);
        assertThat(count("SELECT COUNT(*) FROM institution_link_contracts WHERE source_mapping_id = "
                + SESSION_MAPPING_ID)).isEqualTo(0);
        assertThat(count("SELECT COUNT(*) FROM schedules WHERE id = " + SESSION_SCHEDULE_ID
                + " AND mapping_id = " + SESSION_MAPPING_ID)).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM consultation_records WHERE id = " + SESSION_RECORD_ID
                + " AND is_deleted = FALSE")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM institution_link_consultation_logs WHERE source_record_id = "
                + SESSION_RECORD_ID)).isEqualTo(0);
    }

    @Test
    @DisplayName("타기관 매핑은 새 계약 테이블로 들어가 회기 매핑은 소프트삭제된다")
    void institutionMapping_copiedToNewTable() throws Exception {
        assertThat(count("SELECT COUNT(*) FROM institution_link_contracts WHERE tenant_id = '"
                + TENANT_A + "' AND source_mapping_id = " + INSTITUTION_MAPPING_ID
                + " AND is_deleted = FALSE")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM consultant_client_mappings WHERE id = "
                + INSTITUTION_MAPPING_ID + " AND is_deleted = TRUE")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM institution_link_schedule_links WHERE tenant_id = '"
                + TENANT_A + "' AND schedule_id = " + INSTITUTION_SCHEDULE_ID)).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM schedules WHERE id = " + INSTITUTION_SCHEDULE_ID
                + " AND mapping_id IS NULL")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM institution_link_consultation_logs WHERE source_record_id = "
                + INSTITUTION_RECORD_ID)).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM consultation_records WHERE id = " + INSTITUTION_RECORD_ID
                + " AND is_deleted = TRUE")).isEqualTo(1);
    }

    @Test
    @DisplayName("다른 테넌트 회기 매핑은 건드리지 않는다")
    void otherTenantSessionMapping_untouched() throws Exception {
        assertThat(count("SELECT COUNT(*) FROM consultant_client_mappings WHERE id = "
                + OTHER_TENANT_SESSION_MAPPING_ID + " AND tenant_id = '" + TENANT_B
                + "' AND is_deleted = FALSE AND remaining_sessions = 3")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM institution_link_contracts WHERE tenant_id = '"
                + TENANT_B + "'")).isEqualTo(0);
    }

    @Test
    @DisplayName("동일 DML 재실행은 멱등이다")
    void migration_repeatable() throws Exception {
        applyMigrationDml();
        assertThat(count("SELECT COUNT(*) FROM institution_link_contracts WHERE tenant_id = '"
                + TENANT_A + "'")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM institution_link_schedule_links")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM institution_link_consultation_logs")).isEqualTo(1);
        assertThat(count("SELECT COUNT(*) FROM consultant_client_mappings WHERE id = "
                + SESSION_MAPPING_ID + " AND is_deleted = FALSE")).isEqualTo(1);
    }

    @Test
    @DisplayName("Flyway 파일은 별 저장소 DDL 이고 바우처·remaining_sessions 컬럼을 만들지 않는다")
    void flywayFile_hasInstitutionTablesAndNoVoucher() throws Exception {
        ClassPathResource resource = new ClassPathResource(MIGRATION_PATH);
        String body = new String(resource.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        assertThat(body).contains("institution_link_contracts");
        assertThat(body).contains("institution_link_schedule_links");
        assertThat(body).contains("institution_link_consultation_logs");
        assertThat(body).contains("CREATE TABLE IF NOT EXISTS institution_link_contracts");
        assertThat(body).doesNotContain("voucher_");
        int contractsInsert = body.indexOf("INSERT INTO institution_link_contracts");
        int schedulesInsert = body.indexOf("INSERT INTO institution_link_schedule_links");
        assertThat(contractsInsert).isGreaterThan(0);
        String contractInsert = body.substring(contractsInsert, schedulesInsert);
        assertThat(contractInsert).doesNotContain("remaining_sessions");
        assertThat(contractInsert).doesNotContain("used_sessions");
        assertThat(contractInsert).doesNotContain("total_sessions");
    }

    @Test
    @DisplayName("이관 기간은 월 기간으로 채워진다")
    void migratedContract_hasMonthlyPeriod() throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT period_start, period_end, prepaid_amount FROM institution_link_contracts"
                             + " WHERE source_mapping_id = " + INSTITUTION_MAPPING_ID)) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getDate(1).toLocalDate()).isEqualTo(LocalDate.of(2026, 9, 1));
            assertThat(rs.getDate(2).toLocalDate()).isEqualTo(LocalDate.of(2026, 9, 30));
            assertThat(rs.getLong(3)).isEqualTo(0L);
        }
    }
}

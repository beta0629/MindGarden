package com.coresolution.consultation.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.Instant;

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
 * V20261127_004 마이그레이션 검증 — ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP
 * menu_name / description 구 SSOT → 신규 라벨 치환 및 커스텀 보존·멱등.
 *
 * <p>RCA: V20260905 trailing UPDATE(매칭) + V20260907 description 미갱신 + OOO 로
 * menu_name 이 매칭에 고착될 수 있음. 본 마이그는 구 SSOT 문자열만 TRIM 일치 시 치환.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20261127_004 마이그레이션 검증 — LNB 미결제 배정 정리 라벨")
class LnbPendingPaymentCleanupLabelMigrationV20261127_004Test {

    private static final String JDBC_URL =
            "jdbc:h2:mem:lnb-pending-payment-cleanup-label-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20261127_004__lnb_pending_payment_cleanup_label.sql";

    private static final String MENU_CODE = "ADM_MAPPINGS_PENDING_PAYMENT_CLEANUP";
    private static final String MENU_NAME_EN = "Pending Payment Mapping Cleanup";
    private static final String OLD_NAME_MATCHING = "디러티 매칭 정리";
    private static final String OLD_NAME_BAEJUNG = "디러티 배정 정리";
    private static final String OLD_DESCRIPTION =
            "디러티 매칭(미결제) 정리 — FE 폴백과 DB SSOT 동기화 (P1)";
    private static final String NEW_NAME = "미결제 배정 정리";
    private static final String NEW_DESCRIPTION = "결제 안 된 배정 정리";
    private static final String CUSTOM_NAME = "센터 커스텀 라벨";
    private static final String CUSTOM_DESCRIPTION = "센터 커스텀 설명";

    /** A: 구 매칭 name + 구 description */
    private static final long ID_MATCHING = 1L;
    /** B: 구 배정 name + 구 description */
    private static final long ID_BAEJUNG = 2L;
    /** C: 커스텀 name + 구 description → name 보존, description 만 갱신 */
    private static final long ID_CUSTOM_NAME_OLD_DESC = 3L;
    /** C': 구 매칭 name + 커스텀 description → name 갱신, description 보존 */
    private static final long ID_OLD_NAME_CUSTOM_DESC = 4L;
    /** D: TRIM 대상 — padded 구 매칭 name + padded 구 description */
    private static final long ID_PADDED = 5L;
    /** E: 이미 신규 라벨 — 멱등 시 무변경 */
    private static final long ID_ALREADY_NEW = 6L;

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedMenusTable();
        seedFixtureRows();
        runMigrationScript(MIGRATION_PATH);
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private void seedMenusTable() throws Exception {
        execute("CREATE TABLE menus ("
                + "id BIGINT NOT NULL PRIMARY KEY,"
                + "menu_code VARCHAR(100) NOT NULL,"
                + "menu_name VARCHAR(200) NOT NULL,"
                + "menu_name_en VARCHAR(200) NULL,"
                + "description VARCHAR(500) NULL,"
                + "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
                + ")");
    }

    private void seedFixtureRows() throws Exception {
        Timestamp now = Timestamp.from(Instant.parse("2026-09-05T00:00:00Z"));
        insertRow(ID_MATCHING, OLD_NAME_MATCHING, OLD_DESCRIPTION, now);
        insertRow(ID_BAEJUNG, OLD_NAME_BAEJUNG, OLD_DESCRIPTION, now);
        insertRow(ID_CUSTOM_NAME_OLD_DESC, CUSTOM_NAME, OLD_DESCRIPTION, now);
        insertRow(ID_OLD_NAME_CUSTOM_DESC, OLD_NAME_MATCHING, CUSTOM_DESCRIPTION, now);
        insertRow(ID_PADDED, "  " + OLD_NAME_MATCHING + "  ", "  " + OLD_DESCRIPTION + "  ", now);
        insertRow(ID_ALREADY_NEW, NEW_NAME, NEW_DESCRIPTION, now);
    }

    private void insertRow(long id, String menuName, String description, Timestamp updatedAt)
            throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO menus "
                        + "(id, menu_code, menu_name, menu_name_en, description, updated_at) "
                        + "VALUES (?, ?, ?, ?, ?, ?)")) {
            ps.setLong(1, id);
            ps.setString(2, MENU_CODE);
            ps.setString(3, menuName);
            ps.setString(4, MENU_NAME_EN);
            ps.setString(5, description);
            ps.setTimestamp(6, updatedAt);
            ps.executeUpdate();
        }
    }

    private void runMigrationScript(String classpathLocation) throws Exception {
        ClassPathResource resource = new ClassPathResource(classpathLocation);
        ScriptUtils.executeSqlScript(
                connection,
                new EncodedResource(resource),
                false,
                false,
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
    @DisplayName("A: 구 매칭 name+desc → 미결제 배정 정리 / 결제 안 된 배정 정리")
    void matchingLegacy_updatedToNewLabels() throws Exception {
        assertLabels(ID_MATCHING, NEW_NAME, NEW_DESCRIPTION);
    }

    @Test
    @DisplayName("B: 구 배정 name+desc → 동일 신규 라벨")
    void baejungLegacy_updatedToNewLabels() throws Exception {
        assertLabels(ID_BAEJUNG, NEW_NAME, NEW_DESCRIPTION);
    }

    @Test
    @DisplayName("C: 커스텀 menu_name 보존 + 구 description 만 갱신")
    void customName_preserved_oldDescriptionUpdated() throws Exception {
        assertLabels(ID_CUSTOM_NAME_OLD_DESC, CUSTOM_NAME, NEW_DESCRIPTION);
    }

    @Test
    @DisplayName("C': 구 menu_name 갱신 + 커스텀 description 보존")
    void oldNameUpdated_customDescriptionPreserved() throws Exception {
        assertLabels(ID_OLD_NAME_CUSTOM_DESC, NEW_NAME, CUSTOM_DESCRIPTION);
    }

    @Test
    @DisplayName("D: TRIM — padded 구 SSOT 도 신규 라벨로 치환")
    void paddedWhitespace_trimmedAndUpdated() throws Exception {
        assertLabels(ID_PADDED, NEW_NAME, NEW_DESCRIPTION);
    }

    @Test
    @DisplayName("E: 이미 신규 라벨이면 무변경")
    void alreadyNew_unchanged() throws Exception {
        assertLabels(ID_ALREADY_NEW, NEW_NAME, NEW_DESCRIPTION);
    }

    @Test
    @DisplayName("menu_name_en 은 전 행 불변")
    void menuNameEn_unchangedForAllRows() throws Exception {
        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery(
                     "SELECT id, menu_name_en FROM menus ORDER BY id")) {
            int count = 0;
            while (rs.next()) {
                assertThat(rs.getString("menu_name_en"))
                        .as("menu_name_en for id=%d", rs.getLong("id"))
                        .isEqualTo(MENU_NAME_EN);
                count++;
            }
            assertThat(count).isEqualTo(6);
        }
    }

    @Test
    @DisplayName("멱등: 마이그 재실행 후에도 동일 결과")
    void migration_idempotentOnRerun() throws Exception {
        runMigrationScript(MIGRATION_PATH);

        assertLabels(ID_MATCHING, NEW_NAME, NEW_DESCRIPTION);
        assertLabels(ID_BAEJUNG, NEW_NAME, NEW_DESCRIPTION);
        assertLabels(ID_CUSTOM_NAME_OLD_DESC, CUSTOM_NAME, NEW_DESCRIPTION);
        assertLabels(ID_OLD_NAME_CUSTOM_DESC, NEW_NAME, CUSTOM_DESCRIPTION);
        assertLabels(ID_PADDED, NEW_NAME, NEW_DESCRIPTION);
        assertLabels(ID_ALREADY_NEW, NEW_NAME, NEW_DESCRIPTION);

        try (Statement st = connection.createStatement();
             ResultSet rs = st.executeQuery("SELECT COUNT(*) FROM menus")) {
            assertThat(rs.next()).isTrue();
            assertThat(rs.getInt(1)).isEqualTo(6);
        }
    }

    private void assertLabels(long id, String expectedName, String expectedDescription)
            throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT menu_name, description, menu_name_en FROM menus WHERE id = ?")) {
            ps.setLong(1, id);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).as("row id=%d exists", id).isTrue();
                assertThat(rs.getString("menu_name"))
                        .as("menu_name id=%d", id)
                        .isEqualTo(expectedName);
                assertThat(rs.getString("description"))
                        .as("description id=%d", id)
                        .isEqualTo(expectedDescription);
                assertThat(rs.getString("menu_name_en"))
                        .as("menu_name_en id=%d", id)
                        .isEqualTo(MENU_NAME_EN);
            }
        }
    }
}

package com.coresolution.consultation.migration;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.Statement;
import java.util.HashMap;
import java.util.Map;

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
 * V20261124_002 마이그레이션 검증 — 테넌트 feature.sct.enabled 전부 false.
 *
 * <p>V20261123_003 이 마인드가든 테넌트를 true 로 시드해도, 본 마이그레이션 적용 후
 * 모든 테넌트 행(tenant_id &lt;&gt; '') 과 전역(tenant_id='') 이 false 인지 검증한다.
 * 행 삭제 없이 UPDATE 만 수행하며 재실행 시에도 멱등이다.</p>
 *
 * @author MindGarden
 * @since 2026-11-24
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@DisplayName("V20261124_002 마이그레이션 검증 — SCT feature flag 테넌트 기본 OFF")
class SctFeatureFlagTenantDefaultOffMigrationTest {

    private static final String JDBC_URL =
            "jdbc:h2:mem:sct-feature-flag-off-mig-test;MODE=MySQL;DATABASE_TO_LOWER=TRUE;"
                    + "CASE_INSENSITIVE_IDENTIFIERS=TRUE;DB_CLOSE_DELAY=-1;"
                    + "NON_KEYWORDS=MONTH,YEAR";

    private static final String MIGRATION_PATH =
            "db/migration/V20261124_002__sct_feature_flag_tenant_default_off.sql";

    private static final String CONFIG_KEY = "feature.sct.enabled";

    private Connection connection;

    @BeforeAll
    void setUp() throws Exception {
        Class.forName("org.h2.Driver");
        connection = DriverManager.getConnection(JDBC_URL, "sa", "");
        seedSystemConfigTable();
        seedFixtureRows();
        runMigrationScript();
    }

    @AfterAll
    void tearDown() throws Exception {
        if (connection != null && !connection.isClosed()) {
            connection.close();
        }
    }

    private void seedSystemConfigTable() throws Exception {
        execute("CREATE TABLE system_config ("
                + "id BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,"
                + "tenant_id VARCHAR(100) NOT NULL DEFAULT '',"
                + "config_key VARCHAR(100) NOT NULL,"
                + "config_value TEXT,"
                + "updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                + "UNIQUE (tenant_id, config_key)"
                + ")");
    }

    private void seedFixtureRows() throws Exception {
        insertRow("", CONFIG_KEY, "false");
        insertRow("tenant-a", CONFIG_KEY, "true");
        insertRow("tenant-b", CONFIG_KEY, "true");
    }

    private void insertRow(String tenantId, String configKey, String configValue) throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "INSERT INTO system_config (tenant_id, config_key, config_value) VALUES (?, ?, ?)")) {
            ps.setString(1, tenantId);
            ps.setString(2, configKey);
            ps.setString(3, configValue);
            ps.executeUpdate();
        }
    }

    private void runMigrationScript() throws Exception {
        ClassPathResource resource = new ClassPathResource(MIGRATION_PATH);
        ScriptUtils.executeSqlScript(
                new SingleConnectionDataSource(connection, true).getConnection(),
                resource);
    }

    private void execute(String sql) throws Exception {
        try (Statement st = connection.createStatement()) {
            st.execute(sql);
        }
    }

    private Map<String, String> loadFlagValues() throws Exception {
        Map<String, String> values = new HashMap<>();
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT tenant_id, config_value FROM system_config WHERE config_key = ?")) {
            ps.setString(1, CONFIG_KEY);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    values.put(rs.getString(1), rs.getString(2));
                }
            }
        }
        return values;
    }

    private int countFlagRows() throws Exception {
        try (PreparedStatement ps = connection.prepareStatement(
                "SELECT COUNT(*) FROM system_config WHERE config_key = ?")) {
            ps.setString(1, CONFIG_KEY);
            try (ResultSet rs = ps.executeQuery()) {
                assertThat(rs.next()).isTrue();
                return rs.getInt(1);
            }
        }
    }

    @Test
    @DisplayName("테넌트 행(tenant_id<>'') 전부 config_value='false'")
    void tenantRows_allFalse() throws Exception {
        Map<String, String> values = loadFlagValues();
        assertThat(values.get("tenant-a")).isEqualTo("false");
        assertThat(values.get("tenant-b")).isEqualTo("false");
        for (Map.Entry<String, String> entry : values.entrySet()) {
            if (!"".equals(entry.getKey())) {
                assertThat(entry.getValue())
                        .as("tenant_id=%s feature.sct.enabled", entry.getKey())
                        .isEqualTo("false");
            }
        }
    }

    @Test
    @DisplayName("전역(tenant_id='') 은 false 유지")
    void globalRow_remainsFalse() throws Exception {
        Map<String, String> values = loadFlagValues();
        assertThat(values.get("")).isEqualTo("false");
    }

    @Test
    @DisplayName("행 삭제 없음: 시드 3행 유지")
    void rows_notDeleted() throws Exception {
        assertThat(countFlagRows()).isEqualTo(3);
    }

    @Test
    @DisplayName("마이그 재실행: 멱등 — 여전히 전부 false, 행 수 유지")
    void migration_idempotent() throws Exception {
        runMigrationScript();
        Map<String, String> values = loadFlagValues();
        assertThat(values).hasSize(3);
        assertThat(values.get("")).isEqualTo("false");
        assertThat(values.get("tenant-a")).isEqualTo("false");
        assertThat(values.get("tenant-b")).isEqualTo("false");
        assertThat(countFlagRows()).isEqualTo(3);
    }
}

package com.coresolution.core.integration;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.Statement;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.testcontainers.containers.MySQLContainer;

/**
 * 개발 DB SHOW CREATE 와 기동 시 적재하는 프로시저 파일만 MySQL 에 올린다.
 * Flyway 는 사용하지 않는다.
 */
final class ApprovalMysqlSchemaLoader {

    private static final AtomicBoolean LOADED = new AtomicBoolean(false);

    private static final String[] DDL = {
            "mysql/onboarding-approval/00_foreign_key_checks_off.sql",
            "mysql/onboarding-approval/01_role_templates.sql",
            "mysql/onboarding-approval/02_tenants.sql",
            "mysql/onboarding-approval/03_branches_dropped_20260612.sql",
            "mysql/onboarding-approval/04_users.sql",
            "mysql/onboarding-approval/05_consultants.sql",
            "mysql/onboarding-approval/06_tenant_roles.sql",
            "mysql/onboarding-approval/07_user_role_assignments.sql",
            "mysql/onboarding-approval/08_tenant_dashboards.sql",
            "mysql/onboarding-approval/09_onboarding_request.sql",
            "mysql/onboarding-approval/10_branches_view.sql",
            "mysql/onboarding-approval/11_foreign_key_checks_on.sql",
            "mysql/onboarding-approval/12_role_template_fixture.sql",
            "mysql/onboarding-approval/13_common_codes.sql"
    };

    /**
     * PlSqlInitializer 가 기동 때 읽는 파일과 같다.
     */
    private static final String[] PROCEDURES = {
            "sql/procedures/create_or_activate_tenant_approval.sql",
            "db/migration/V20251212_001__fix_apply_default_role_templates_procedure.sql",
            "sql/procedures/create_tenant_admin_account.sql",
            "sql/procedures/process_onboarding_approval.sql"
    };

    private static final Pattern LABELED_END = Pattern.compile(
            "(?m)^\\s*END\\s+(?!IF\\b|LOOP\\b|REPEAT\\b|WHILE\\b|CASE\\b)"
                    + "([a-zA-Z_][a-zA-Z0-9_]*)\\s*(\\$\\$)?\\s*$");
    private static final Pattern PROCEDURE_NAME = Pattern.compile(
            "CREATE\\s+PROCEDURE\\s+(\\w+)", Pattern.CASE_INSENSITIVE);

    private ApprovalMysqlSchemaLoader() {
    }

    static void load(MySQLContainer<?> mysql) {
        if (!LOADED.compareAndSet(false, true)) {
            return;
        }
        try (Connection connection = DriverManager.getConnection(
                mysql.getJdbcUrl(), mysql.getUsername(), mysql.getPassword())) {
            for (String path : DDL) {
                ScriptUtils.executeSqlScript(connection, new ClassPathResource(path));
            }
            for (String path : PROCEDURES) {
                installProcedure(connection, path);
            }
        } catch (RuntimeException ex) {
            LOADED.set(false);
            throw ex;
        } catch (Exception ex) {
            LOADED.set(false);
            throw new IllegalStateException("승인 경로 MySQL 스키마를 올리지 못했습니다", ex);
        }
    }

    private static void installProcedure(Connection connection, String classpath) throws Exception {
        String sqlContent;
        try (InputStream in = new ClassPathResource(classpath).getInputStream()) {
            sqlContent = new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
        sqlContent = sqlContent.replaceAll("--[^\n]*\n", "\n");
        sqlContent = sqlContent.replaceAll("/\\*[\\s\\S]*?\\*/", "");
        int createStart = sqlContent.indexOf("CREATE PROCEDURE");
        if (createStart < 0) {
            throw new IllegalStateException("CREATE PROCEDURE 없음: " + classpath);
        }
        String ddl = extractProcedure(sqlContent, createStart);
        Matcher name = PROCEDURE_NAME.matcher(ddl);
        if (!name.find()) {
            throw new IllegalStateException("프로시저 이름 없음: " + classpath);
        }
        try (Statement statement = connection.createStatement()) {
            statement.execute("DROP PROCEDURE IF EXISTS " + name.group(1));
            statement.execute(ddl);
        }
    }

    /**
     * PlSqlInitializer.extractJdbcProcedureDdlFromContent 와 같은 외곽 END 규칙.
     */
    private static String extractProcedure(String sqlContent, int createStart) {
        Matcher labeledMatcher = LABELED_END.matcher(sqlContent);
        int labeledEndExclusive = -1;
        while (labeledMatcher.find()) {
            if (labeledMatcher.start() >= createStart) {
                labeledEndExclusive = labeledMatcher.end();
            }
        }
        String ddl;
        if (labeledEndExclusive > createStart) {
            ddl = sqlContent.substring(createStart, labeledEndExclusive).trim();
            ddl = ddl.replaceAll("\\$\\$\\s*$", "").trim();
        } else {
            int endDollar = sqlContent.lastIndexOf("END$$");
            if (endDollar < createStart) {
                throw new IllegalStateException("프로시저 외곽 END 를 찾지 못했습니다");
            }
            ddl = sqlContent.substring(createStart, endDollar + 3).trim();
        }
        if (!ddl.endsWith(";")) {
            ddl = ddl + ";";
        }
        return ddl;
    }
}

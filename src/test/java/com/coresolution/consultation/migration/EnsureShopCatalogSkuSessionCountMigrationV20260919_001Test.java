package com.coresolution.consultation.migration;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

import org.flywaydb.core.api.configuration.FluentConfiguration;
import org.flywaydb.core.internal.parser.ParsingContext;
import org.flywaydb.core.internal.resource.StringResource;
import org.flywaydb.core.internal.sqlscript.SqlStatement;
import org.flywaydb.core.internal.sqlscript.SqlStatementIterator;
import org.flywaydb.database.mysql.MySQLParser;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V20260919_001 — shop cart 500 hotfix. session_count 컬럼 멱등 ensure.
 *
 * <p>V20260917_001 이 success 로 남아도 Flyway 는 그 스크립트를 다시 실행하지 않는다.
 * 컬럼이 없으면 cart 가 500 이다. 후속 마이그는 프로시저 IF 안에서 ALTER 만 한다.
 * H2 는 DELIMITER 프로시저를 실행하지 못하므로, Flyway 9.22.3 {@link MySQLParser}
 * 가 문장을 어떻게 자르는지로 스모크한다. 실행 가능한 문장에 PREPARE 가 없고,
 * CREATE PROCEDURE 한 블록 안에 두 ALTER 가 그대로 있어야 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-19
 */
@DisplayName("V20260919_001 마이그레이션 검증 — shop session_count 멱등 ensure")
class EnsureShopCatalogSkuSessionCountMigrationV20260919_001Test {

    private static final String MIGRATION_PATH =
            "db/migration/V20260919_001__ensure_shop_session_count_columns.sql";

    private static final String PROCEDURE_NAME = "mg_ensure_shop_session_count_columns";

    /**
     * 마이그 파일이 classpath 에 있고, V20260917 보다 큰 버전이다.
     */
    @Test
    @DisplayName("버전은 V20260917 보다 크고 프로시저 DROP/CREATE/CALL 을 포함한다")
    void migrationFile_isNewerThanV20260917AndDeclaresProcedure() throws IOException {
        assertThat(MIGRATION_PATH).contains("V20260919_001");
        String body = readMigrationBody();

        assertThat(body)
                .contains("DROP PROCEDURE IF EXISTS " + PROCEDURE_NAME)
                .contains("CREATE PROCEDURE " + PROCEDURE_NAME)
                .contains("CALL " + PROCEDURE_NAME + "()")
                .contains("DELIMITER $$")
                .contains("DELIMITER ;")
                .contains("END$$");
    }

    /**
     * 실행 문장(코멘트 제외)에 PREPARE/EXECUTE 가 없고, 두 컬럼 DDL 이 직접 있다.
     */
    @Test
    @DisplayName("코멘트 제외 본문은 PREPARE 없이 두 컬럼을 information_schema 가드로 ALTER 한다")
    void migrationBody_usesDirectAlterNotPrepare() throws IOException {
        String code = stripComments(readMigrationBody());

        assertThat(code.toUpperCase(Locale.ROOT))
                .doesNotContain("PREPARE ")
                .doesNotContain("EXECUTE ")
                .doesNotContain("DEALLOCATE ");

        assertThat(code)
                .contains("information_schema.COLUMNS")
                .contains("TABLE_NAME = 'shop_catalog_skus'")
                .contains("COLUMN_NAME = 'session_count'")
                .contains("ADD COLUMN session_count INT NOT NULL DEFAULT 1")
                .contains("TABLE_NAME = 'shop_client_order_lines'")
                .contains("COLUMN_NAME = 'session_count_snapshot'")
                .contains("ADD COLUMN session_count_snapshot INT NULL");
    }

    /**
     * Flyway MySQLParser 가 프로시저 본문의 세미콜론에서 문장을 쪼개지 않는지 확인한다.
     */
    @Test
    @DisplayName("Flyway MySQLParser: CREATE PROCEDURE 한 문장에 두 ALTER, PREPARE 문장 0")
    void flywayParser_keepsAlterInsideProcedureAndEmitsNoPrepare() throws IOException {
        List<String> statements = parseWithFlywayMysqlParser(readMigrationBody());

        assertThat(statements)
                .as("DROP / CREATE PROCEDURE / CALL / DROP 가 문장으로 남아야 함")
                .hasSizeGreaterThanOrEqualTo(4);

        String procedure = statements.stream()
                .filter(sql -> sql.contains("CREATE PROCEDURE " + PROCEDURE_NAME))
                .findFirst()
                .orElse("");

        assertThat(procedure)
                .as("CREATE PROCEDURE 는 $$ 한 블록이어야 함")
                .contains("BEGIN")
                .contains("ADD COLUMN session_count INT NOT NULL DEFAULT 1")
                .contains("ADD COLUMN session_count_snapshot INT NULL")
                .contains("END");

        assertThat(statements)
                .anyMatch(sql -> sql.contains("CALL " + PROCEDURE_NAME + "()"));

        for (String sql : statements) {
            String code = stripComments(sql).stripLeading().toUpperCase(Locale.ROOT);
            assertThat(code.startsWith("PREPARE") || code.startsWith("EXECUTE") || code.startsWith("DEALLOCATE"))
                    .as("Flyway 가 실행할 문장이 동적 SQL 이면 안 됨: %s", sql)
                    .isFalse();
        }
    }

    private List<String> parseWithFlywayMysqlParser(String sql) {
        MySQLParser parser = new MySQLParser(new FluentConfiguration(), new ParsingContext());
        List<String> statements = new ArrayList<>();
        try (SqlStatementIterator iterator = parser.parse(new StringResource(sql))) {
            while (iterator.hasNext()) {
                SqlStatement statement = iterator.next();
                statements.add(statement.getSql());
            }
        }
        return statements;
    }

    private String readMigrationBody() throws IOException {
        ClassPathResource resource = new ClassPathResource(MIGRATION_PATH);
        try (InputStream in = resource.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /**
     * 라인 코멘트와 블록 코멘트를 제거한다. 헤더의 원인 설명에 동적 SQL 단어가 있어도
     * 실행 본문 검증과 섞이지 않게 한다.
     */
    private String stripComments(String sql) {
        String noLineComments = sql.replaceAll("(?m)--[^\\n]*", "");
        return noLineComments.replaceAll("(?s)/\\*.*?\\*/", "");
    }
}

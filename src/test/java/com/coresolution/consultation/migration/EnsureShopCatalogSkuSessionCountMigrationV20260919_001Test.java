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
 * V20260919_001 — shop cart 500 hotfix. session_count / session_count_snapshot 멱등 ensure.
 *
 * <p>2026-09-23 수정: DELIMITER $$ 저장 프로시저 → PREPARE/EXECUTE 패턴으로 교체.
 * Flyway 9.22.3 + MySQL 8 일부 환경에서 DELIMITER $$ 가 SQLSyntaxErrorException 을 유발해
 * migration 이 FAILED 상태로 기록되는 문제가 재현됨.
 * validate-on-migrate=false 로 체크섬 변경이 기존 환경을 차단하지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-19
 * @revised 2026-09-23
 */
@DisplayName("V20260919_001 마이그레이션 검증 — shop session_count 멱등 ensure (PREPARE/EXECUTE)")
class EnsureShopCatalogSkuSessionCountMigrationV20260919_001Test {

    private static final String MIGRATION_PATH =
            "db/migration/V20260919_001__ensure_shop_session_count_columns.sql";

    /**
     * 마이그 파일이 classpath 에 있고, V20260917 보다 큰 버전이다.
     */
    @Test
    @DisplayName("버전은 V20260917 보다 크고 두 컬럼을 커버한다")
    void migrationFile_isNewerThanV20260917AndCoversColumns() throws IOException {
        assertThat(MIGRATION_PATH).contains("V20260919_001");
        String body = readMigrationBody();

        assertThat(body)
                .contains("session_count")
                .contains("session_count_snapshot")
                .contains("shop_catalog_skus")
                .contains("shop_client_order_lines");
    }

    /**
     * 코멘트 제거 후 본문에 DELIMITER 키워드가 없고 PREPARE/EXECUTE 패턴만 사용하는지 확인한다.
     */
    @Test
    @DisplayName("코멘트 제거 본문에 DELIMITER 없고 PREPARE/EXECUTE 패턴으로만 작성되어야 한다")
    void migrationBody_usesPreparePatterWithoutDelimiter() throws IOException {
        String body = readMigrationBody();
        String codeOnly = stripComments(body).toUpperCase(Locale.ROOT);

        assertThat(codeOnly)
                .as("코멘트 제거 후 실행 코드에 DELIMITER 는 없어야 한다")
                .doesNotContain("DELIMITER");

        assertThat(codeOnly)
                .as("PREPARE/EXECUTE 패턴이 있어야 한다")
                .contains("PREPARE")
                .contains("EXECUTE")
                .contains("DEALLOCATE");

        assertThat(body)
                .contains("INFORMATION_SCHEMA.COLUMNS")
                .contains("shop_catalog_skus")
                .contains("session_count")
                .contains("ADD COLUMN session_count INT NOT NULL DEFAULT 1")
                .contains("shop_client_order_lines")
                .contains("session_count_snapshot")
                .contains("ADD COLUMN session_count_snapshot INT NULL");
    }

    /**
     * Flyway MySQLParser 가 PREPARE/EXECUTE 문장을 포함하는 문장들을 파싱하는지 확인한다.
     */
    @Test
    @DisplayName("Flyway MySQLParser: PREPARE 문장을 올바르게 파싱한다")
    void flywayParser_parsesPrepareStatements() throws IOException {
        List<String> statements = parseWithFlywayMysqlParser(readMigrationBody());

        assertThat(statements)
                .as("최소 1개 이상 문장이 있어야 한다")
                .isNotEmpty();

        boolean hasPrepare = statements.stream()
                .anyMatch(sql -> sql.stripLeading().toUpperCase(Locale.ROOT).startsWith("PREPARE"));
        assertThat(hasPrepare)
                .as("PREPARE 문장이 하나 이상 있어야 한다")
                .isTrue();

        String allStatements = String.join(" ", statements).toUpperCase(Locale.ROOT);
        assertThat(allStatements)
                .contains("SESSION_COUNT")
                .contains("SESSION_COUNT_SNAPSHOT");
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

    private String stripComments(String sql) {
        String noLineComments = sql.replaceAll("(?m)--[^\\n]*", "");
        return noLineComments.replaceAll("(?s)/\\*.*?\\*/", "");
    }
}

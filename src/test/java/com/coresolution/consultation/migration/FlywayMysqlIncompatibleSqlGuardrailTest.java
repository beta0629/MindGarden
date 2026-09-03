package com.coresolution.consultation.migration;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Flyway 마이그레이션 SQL 의 MySQL 비호환·불완전 문법 가드레일.
 *
 * <p>develop 기동 실패 (deploy-backend-dev #1249 / journalctl):
 * {@code V20260903_001} 의 {@code DROP CONSTRAINT IF EXISTS} 가 MySQL 에서
 * {@code SQLSyntaxErrorException} 을 유발해 60초 내 boot 실패·rollback 됨.
 * H2 전용 fallback 은 마이그레이션 JAR 이 아니라 테스트 헬퍼에만 둔다.</p>
 *
 * <p>develop 기동 실패 (deploy-backend-dev #1251 / journalctl):
 * {@code V20260903_003} 의 {@code UPDATE … INNER JOIN … WHERE} 에 {@code SET} 이 누락되어
 * MySQL 1064 가 발생. multi-table UPDATE 는 JOIN/ON 뒤 {@code SET} 이 필수.</p>
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@DisplayName("Flyway SQL MySQL 비호환 문법 가드레일")
class FlywayMysqlIncompatibleSqlGuardrailTest {

    private static final String MIGRATION_LOCATION_PATTERN = "classpath:db/migration/*.sql";

    /**
     * MySQL 은 ALTER TABLE … DROP CONSTRAINT IF EXISTS 를 지원하지 않는다.
     * (PostgreSQL/H2 문법. MySQL 8 CHECK 제거는 DROP CHECK name.)
     */
    private static final Pattern DROP_CONSTRAINT_IF_EXISTS = Pattern.compile(
            "\\bDROP\\s+CONSTRAINT\\s+IF\\s+EXISTS\\b",
            Pattern.CASE_INSENSITIVE);

    /**
     * UPDATE 문 시작부터 다음 문장 끝(;)까지. 코멘트/문자열 제거 후 본문에 적용.
     */
    private static final Pattern UPDATE_STATEMENT = Pattern.compile(
            "\\bUPDATE\\b[\\s\\S]*?;",
            Pattern.CASE_INSENSITIVE);

    private static final Pattern SET_CLAUSE = Pattern.compile(
            "\\bSET\\b",
            Pattern.CASE_INSENSITIVE);

    @Test
    @DisplayName("classpath:db/migration/*.sql 에 DROP CONSTRAINT IF EXISTS 가 없어야 한다")
    void flywayMigrations_mustNotContainDropConstraintIfExists() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources(MIGRATION_LOCATION_PATTERN);
        assertThat(resources)
                .as("Flyway migration SQL resources must exist on classpath")
                .isNotEmpty();

        List<String> offenders = new ArrayList<>();
        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename == null) {
                continue;
            }
            String body = stripCommentsAndStrings(readResource(resource));
            if (DROP_CONSTRAINT_IF_EXISTS.matcher(body).find()) {
                offenders.add(filename);
            }
        }

        assertThat(offenders)
                .as("MySQL-incompatible DROP CONSTRAINT IF EXISTS found in Flyway SQL "
                        + "(keep H2 fallback in test helpers only): %s", offenders)
                .isEmpty();
    }

    @Test
    @DisplayName("classpath:db/migration/*.sql 의 모든 UPDATE 문에 SET 이 있어야 한다")
    void flywayMigrations_everyUpdateMustContainSet() throws IOException {
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        Resource[] resources = resolver.getResources(MIGRATION_LOCATION_PATTERN);
        assertThat(resources)
                .as("Flyway migration SQL resources must exist on classpath")
                .isNotEmpty();

        List<String> offenders = new ArrayList<>();
        for (Resource resource : resources) {
            String filename = resource.getFilename();
            if (filename == null) {
                continue;
            }
            String body = stripCommentsAndStrings(readResource(resource));
            Matcher matcher = UPDATE_STATEMENT.matcher(body);
            int updateIndex = 0;
            while (matcher.find()) {
                updateIndex++;
                String statement = matcher.group();
                if (!SET_CLAUSE.matcher(statement).find()) {
                    offenders.add(filename + "#UPDATE[" + updateIndex + "]");
                }
            }
        }

        assertThat(offenders)
                .as("UPDATE without SET found in Flyway SQL "
                        + "(MySQL multi-table UPDATE requires SET after JOIN/ON): %s", offenders)
                .isEmpty();
    }

    private static String readResource(Resource resource) throws IOException {
        try (InputStream in = resource.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    /**
     * SQL 본문에서 코멘트(--, /* * /)와 문자열 리터럴을 제거하여 실행 코드만 남긴다.
     */
    private static String stripCommentsAndStrings(String sql) {
        String noLineComments = sql.replaceAll("(?m)--[^\\n]*", "");
        String noBlockComments = noLineComments.replaceAll("(?s)/\\*.*?\\*/", "");
        return noBlockComments.replaceAll("'[^']*'", "''");
    }
}

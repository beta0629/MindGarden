package com.coresolution.consultation.migration;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Flyway 마이그레이션 SQL 의 MySQL 비호환 문법 가드레일.
 *
 * <p>develop 기동 실패 (deploy-backend-dev #1249 / journalctl):
 * {@code V20260903_001} 의 {@code DROP CONSTRAINT IF EXISTS} 가 MySQL 에서
 * {@code SQLSyntaxErrorException} 을 유발해 60초 내 boot 실패·rollback 됨.
 * H2 전용 fallback 은 마이그레이션 JAR 이 아니라 테스트 헬퍼에만 둔다.</p>
 *
 * <p>develop 기동 실패 (deploy-backend-dev run 33732858976 / journalctl):
 * {@code V20260903_003} 의 {@code UPDATE … INNER JOIN … WHERE} 에 {@code SET} 누락으로
 * MySQL 1064. MySQL JOIN UPDATE 는 {@code SET} 필수.</p>
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
     * 토큰 경계로 UPDATE / JOIN / SET / WHERE 식별 (식별자 일부 매칭 방지).
     */
    private static final Pattern SQL_KEYWORD = Pattern.compile(
            "\\b(UPDATE|JOIN|SET|WHERE)\\b",
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
    @DisplayName("UPDATE … JOIN … 문은 depth-0 SET 이 있어야 한다 (MySQL JOIN UPDATE)")
    void flywayMigrations_updateJoinMustHaveSetClause() throws IOException {
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
            int missingSetCount = countUpdateJoinWithoutSet(body);
            if (missingSetCount > 0) {
                offenders.add(filename + " (" + missingSetCount + ")");
            }
        }

        assertThat(offenders)
                .as("MySQL UPDATE…JOIN without depth-0 SET found in Flyway SQL "
                        + "(UPDATE alias JOIN … SET … WHERE required): %s", offenders)
                .isEmpty();
    }

    /**
     * UPDATE 문에서 depth-0 JOIN 이 있는데 depth-0 SET 이 없으면 카운트한다.
     * 서브쿼리 안의 JOIN/WHERE/SET 은 괄호 depth 로 무시해 오탐을 줄인다.
     *
     * @param sql 코멘트·문자열 제거된 SQL
     * @return SET 누락 JOIN UPDATE 문 개수
     */
    static int countUpdateJoinWithoutSet(String sql) {
        int offenders = 0;
        int depth = 0;
        boolean inUpdate = false;
        boolean sawJoinAtDepth0 = false;
        boolean sawSetAtDepth0 = false;
        Matcher matcher = SQL_KEYWORD.matcher(sql);

        for (int i = 0; i < sql.length(); i++) {
            char ch = sql.charAt(i);
            if (ch == '(') {
                depth++;
                continue;
            }
            if (ch == ')') {
                if (depth > 0) {
                    depth--;
                }
                continue;
            }
            if (ch == ';' && depth == 0 && inUpdate) {
                if (sawJoinAtDepth0 && !sawSetAtDepth0) {
                    offenders++;
                }
                inUpdate = false;
                sawJoinAtDepth0 = false;
                sawSetAtDepth0 = false;
                continue;
            }

            if (!matcher.find(i) || matcher.start() != i) {
                continue;
            }
            String keyword = matcher.group(1).toUpperCase(Locale.ROOT);
            int end = matcher.end();
            if (depth == 0) {
                if ("UPDATE".equals(keyword)) {
                    if (inUpdate && sawJoinAtDepth0 && !sawSetAtDepth0) {
                        offenders++;
                    }
                    inUpdate = true;
                    sawJoinAtDepth0 = false;
                    sawSetAtDepth0 = false;
                } else if (inUpdate && "JOIN".equals(keyword)) {
                    sawJoinAtDepth0 = true;
                } else if (inUpdate && "SET".equals(keyword)) {
                    sawSetAtDepth0 = true;
                }
            }
            i = end - 1;
        }

        if (inUpdate && sawJoinAtDepth0 && !sawSetAtDepth0) {
            offenders++;
        }
        return offenders;
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

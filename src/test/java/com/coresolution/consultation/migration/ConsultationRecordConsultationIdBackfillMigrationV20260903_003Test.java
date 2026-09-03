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
import org.springframework.core.io.ClassPathResource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V20260903_003 마이그레이션 문법·SSOT 회귀 — consultation_records.consultation_id → schedules.id.
 *
 * <p>deploy-backend-dev run 33732858976: Step1/Step2 가 {@code UPDATE … INNER JOIN … WHERE}
 * 형태로 {@code SET} 이 없어 MySQL 1064 로 boot 실패했다. H2(MODE=MySQL) 는 MySQL JOIN UPDATE
 * 문법을 파싱하지 못하므로, 정적 검증으로 SET 포함과 가드레일 연동을 보장한다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@DisplayName("V20260903_003 마이그레이션 검증 — consultation_id→schedule_id 백필 SET 필수")
class ConsultationRecordConsultationIdBackfillMigrationV20260903_003Test {

    private static final String MIGRATION_PATH =
            "db/migration/V20260903_003__backfill_consultation_record_consultation_id_to_schedule_id.sql";

    private static final String REQUIRED_SET = "SET cr.consultation_id = uniq.schedule_id";

    private static final Pattern STEP_HEADER = Pattern.compile(
            "(?m)^--\\s*-+\\s*$\\n--\\s*(Step[12]):");

    private static final Pattern UPDATE_BLOCK = Pattern.compile(
            "(?is)\\bUPDATE\\s+consultation_records\\s+cr\\b(.*?)(?=\\bUPDATE\\s+consultation_records\\s+cr\\b|\\z)");

    @Test
    @DisplayName("Step1/Step2 각각 SET cr.consultation_id = uniq.schedule_id 가 있어야 한다")
    void step1AndStep2_mustContainSetConsultationIdToScheduleId() throws IOException {
        String sql = readMigration();
        List<String> updateBodies = extractUpdateBodies(sql);

        assertThat(updateBodies)
                .as("V003 must contain exactly two UPDATE consultation_records cr statements")
                .hasSize(2);

        assertThat(updateBodies.get(0))
                .as("Step1 UPDATE must include SET cr.consultation_id = uniq.schedule_id")
                .containsIgnoringCase(REQUIRED_SET);
        assertThat(updateBodies.get(1))
                .as("Step2 UPDATE must include SET cr.consultation_id = uniq.schedule_id")
                .containsIgnoringCase(REQUIRED_SET);
    }

    @Test
    @DisplayName("각 UPDATE…JOIN 블록은 SET 이 WHERE 보다 앞에 와야 한다 (MySQL JOIN UPDATE)")
    void eachUpdateJoin_setMustPrecedeWhereAtDepthZero() throws IOException {
        String sql = stripCommentsAndStrings(readMigration());
        List<String> updateBodies = extractUpdateBodies(sql);

        assertThat(updateBodies).hasSize(2);
        for (int i = 0; i < updateBodies.size(); i++) {
            String body = updateBodies.get(i);
            int setIdx = indexOfKeywordAtDepth0(body, "SET");
            int whereIdx = indexOfKeywordAtDepth0(body, "WHERE");
            int joinIdx = indexOfKeywordAtDepth0(body, "JOIN");

            assertThat(joinIdx)
                    .as("UPDATE body %d must contain depth-0 JOIN", i + 1)
                    .isGreaterThanOrEqualTo(0);
            assertThat(setIdx)
                    .as("UPDATE body %d must contain depth-0 SET after JOIN", i + 1)
                    .isGreaterThan(joinIdx);
            assertThat(whereIdx)
                    .as("UPDATE body %d must contain depth-0 WHERE after SET", i + 1)
                    .isGreaterThan(setIdx);
        }
    }

    @Test
    @DisplayName("가드레일: V003 본문은 UPDATE JOIN without SET 카운트가 0")
    void guardrailHelper_reportsZeroMissingSetOnFixedV003() throws IOException {
        String body = stripCommentsAndStrings(readMigration());
        assertThat(FlywayMysqlIncompatibleSqlGuardrailTest.countUpdateJoinWithoutSet(body))
                .as("fixed V003 must pass UPDATE…JOIN…SET guardrail")
                .isZero();
    }

    @Test
    @DisplayName("회귀: SET 없는 UPDATE JOIN 은 가드레일이 감지해야 한다")
    void guardrailHelper_detectsMissingSetPattern() {
        String broken = ""
                + "UPDATE consultation_records cr "
                + "INNER JOIN (SELECT 1 AS schedule_id WHERE 1=1) uniq ON uniq.schedule_id = cr.id "
                + "WHERE cr.id = 1;";
        assertThat(FlywayMysqlIncompatibleSqlGuardrailTest.countUpdateJoinWithoutSet(broken))
                .isEqualTo(1);

        String fixed = ""
                + "UPDATE consultation_records cr "
                + "INNER JOIN (SELECT 1 AS schedule_id WHERE 1=1) uniq ON uniq.schedule_id = cr.id "
                + "SET cr.consultation_id = uniq.schedule_id "
                + "WHERE cr.id = 1;";
        assertThat(FlywayMysqlIncompatibleSqlGuardrailTest.countUpdateJoinWithoutSet(fixed))
                .isZero();
    }

    @Test
    @DisplayName("헤더에 Step1/Step2 SSOT 의도가 유지되어야 한다")
    void header_retainsSsotIntent() throws IOException {
        String sql = readMigration();
        assertThat(sql).contains("ConsultationRecord.consultationId = Schedule.id");
        assertThat(sql).containsIgnoringCase("MySQL UPDATE");
        assertThat(sql).containsIgnoringCase("SET");

        Matcher stepMatcher = STEP_HEADER.matcher(sql);
        List<String> steps = new ArrayList<>();
        while (stepMatcher.find()) {
            steps.add(stepMatcher.group(1));
        }
        assertThat(steps).containsExactly("Step1", "Step2");
    }

    private static String readMigration() throws IOException {
        ClassPathResource resource = new ClassPathResource(MIGRATION_PATH);
        try (InputStream in = resource.getInputStream()) {
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static List<String> extractUpdateBodies(String sql) {
        Matcher matcher = UPDATE_BLOCK.matcher(sql);
        List<String> bodies = new ArrayList<>();
        while (matcher.find()) {
            bodies.add(matcher.group(1));
        }
        return bodies;
    }

    private static int indexOfKeywordAtDepth0(String sql, String keyword) {
        Pattern pattern = Pattern.compile("\\b" + keyword + "\\b", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(sql);
        int depth = 0;
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
            if (depth == 0 && matcher.find(i) && matcher.start() == i) {
                return i;
            }
        }
        return -1;
    }

    private static String stripCommentsAndStrings(String sql) {
        String noLineComments = sql.replaceAll("(?m)--[^\\n]*", "");
        String noBlockComments = noLineComments.replaceAll("(?s)/\\*.*?\\*/", "");
        return noBlockComments.replaceAll("'[^']*'", "''");
    }
}

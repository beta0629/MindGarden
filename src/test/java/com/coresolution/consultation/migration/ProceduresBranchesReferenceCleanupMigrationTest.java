package com.coresolution.consultation.migration;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.regex.Pattern;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.ClassPathResource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * PR-A — V20260613_001 PL/SQL 프로시저 branches 참조 정리 마이그 검증.
 *
 * <p>PR-7 (#284, V20260612_002) 의 {@code branches → branches_dropped_20260612}
 * RENAME 후 06-13 자정 batch 가 매일 ERROR. 본 마이그는 다음 3개 프로시저를
 * 재배포하여 회귀를 근본 차단한다:
 *
 * <ul>
 *   <li>UpdateAllBranchDailyStatistics — schedules.tenant_id 커서로 전환</li>
 *   <li>UpdateAllConsultantPerformance — schedules.(tenant_id, consultant_id) 커서로 전환</li>
 *   <li>GetOverallBranchStatistics — `FROM branches` → `FROM tenants` 로 전환</li>
 * </ul>
 *
 * <p>검증 (정적 SQL 분석):
 * <ul>
 *   <li>마이그 파일이 존재하고 3개 프로시저 모두 DROP + CREATE 한다</li>
 *   <li>마이그 파일 본문에 {@code FROM branches}, {@code JOIN branches},
 *       {@code UPDATE branches} 등 실 테이블 참조가 0건이다 (코멘트 제외)</li>
 *   <li>마이그 파일은 {@code DELIMITER} + {@code BEGIN/END} 블록 패턴을 정상 보유</li>
 * </ul>
 *
 * <p>본 테스트는 H2 가 MySQL DELIMITER + 커서 + RESIGNAL 의 일부를 지원하지 않으므로
 * 실제 프로시저 실행 검증 대신 정적 SQL 분석으로 회귀 가드를 둔다 — 동일 패턴
 * V20260606_009 / V20260531_004 도 운영 정착 후 정적 가드 + 운영 D+1 검증으로 처리.
 *
 * @author CoreSolution
 * @since 2026-06-13
 */
@DisplayName("PR-A — V20260613_001 PL/SQL branches 참조 정리 마이그 검증")
class ProceduresBranchesReferenceCleanupMigrationTest {

    private static final String MIGRATION_PATH =
            "db/migration/V20260613_001__procedures_branches_reference_cleanup.sql";

    @Test
    @DisplayName("마이그 파일이 존재하고 3개 프로시저 모두 DROP + CREATE 한다")
    void migrationFile_dropsAndCreatesAllThreeProcedures() throws IOException {
        String body = readMigrationBody();

        for (String proc : new String[] {
                "UpdateAllBranchDailyStatistics",
                "UpdateAllConsultantPerformance",
                "GetOverallBranchStatistics"
        }) {
            assertThat(body)
                    .as("마이그가 %s DROP 을 포함해야 함", proc)
                    .contains("DROP PROCEDURE IF EXISTS " + proc);
            assertThat(body)
                    .as("마이그가 %s CREATE 를 포함해야 함", proc)
                    .containsPattern("CREATE\\s+PROCEDURE\\s+" + proc);
        }
    }

    @Test
    @DisplayName("마이그 본문(코멘트 제외)에 branches 테이블 직접 참조가 0건이다")
    void migrationBody_hasNoDirectBranchesTableReferences() throws IOException {
        String body = stripCommentsAndStrings(readMigrationBody());

        Pattern[] forbidden = new Pattern[] {
                Pattern.compile("\\bFROM\\s+branches\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bJOIN\\s+branches\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bUPDATE\\s+branches\\b", Pattern.CASE_INSENSITIVE),
                Pattern.compile("\\bINTO\\s+branches\\b", Pattern.CASE_INSENSITIVE)
        };

        for (Pattern p : forbidden) {
            assertThat(p.matcher(body).find())
                    .as("마이그 본문(코멘트 제외)에 패턴이 잔존: %s", p.pattern())
                    .isFalse();
        }
    }

    @Test
    @DisplayName("마이그 파일은 DELIMITER + BEGIN/END 블록 패턴을 정상 보유")
    void migrationFile_hasDelimiterAndBeginEndPattern() throws IOException {
        String body = readMigrationBody();

        assertThat(body)
                .as("DELIMITER 블록을 시작·종료해야 함 (MySQL 8 호환)")
                .contains("DELIMITER $$")
                .contains("DELIMITER ;");

        long beginCount = countOccurrences(body, "BEGIN");
        long endCount = countOccurrences(body, "END$$");
        assertThat(beginCount)
                .as("BEGIN 블록 ≥ 3 (3개 프로시저 + 핸들러)")
                .isGreaterThanOrEqualTo(3);
        assertThat(endCount)
                .as("END$$ 블록 = 3 (3개 프로시저)")
                .isEqualTo(3);
    }

    private String readMigrationBody() throws IOException {
        ClassPathResource resource = new ClassPathResource(MIGRATION_PATH);
        return Files.readString(resource.getFile().toPath(), StandardCharsets.UTF_8);
    }

    /**
     * SQL 본문에서 코멘트(--, /* * /)와 문자열 리터럴을 제거하여 실 코드만 남긴다.
     */
    private String stripCommentsAndStrings(String sql) {
        // 라인 코멘트 제거 (--로 시작해 줄 끝까지)
        String noLineComments = sql.replaceAll("(?m)--[^\\n]*", "");
        // 블록 코멘트 제거 (/* ... */)
        String noBlockComments = noLineComments.replaceAll("(?s)/\\*.*?\\*/", "");
        // 문자열 리터럴 제거 ('...')
        return noBlockComments.replaceAll("'[^']*'", "''");
    }

    private long countOccurrences(String haystack, String needle) {
        int count = 0;
        int idx = 0;
        while ((idx = haystack.indexOf(needle, idx)) != -1) {
            count++;
            idx += needle.length();
        }
        return count;
    }
}

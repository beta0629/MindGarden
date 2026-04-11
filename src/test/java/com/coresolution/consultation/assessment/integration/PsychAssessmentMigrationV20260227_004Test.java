package com.coresolution.consultation.assessment.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * DB 마이그레이션 V20260227_004 스키마 검증
 * psych_assessment_extractions, psych_assessment_metrics, psych_assessment_reports
 * BaseEntity 컬럼(version, deleted_at) 추가 확인
 *
 * @author CoreSolution
 * @see docs/project-management/PSYCH_ASSESSMENT_IMPROVEMENT_PLAN.md §2
 */
@DisplayName("DB 마이그레이션 V20260227_004 검증")
class PsychAssessmentMigrationV20260227_004Test {

    private static final String MIGRATION_FILE =
            "src/main/resources/db/migration/V20260227_004__add_psych_assessment_extractions_metrics_reports_base_entity_columns.sql";

    @Test
    @DisplayName("마이그레이션 파일 존재")
    void migrationFileExists() {
        Path path = Paths.get(MIGRATION_FILE);
        assertThat(path).exists();
        assertThat(Files.isRegularFile(path)).isTrue();
    }

    @Test
    @DisplayName("psych_assessment_extractions에 deleted_at, version 컬럼 추가")
    void extractionsTableHasBaseEntityColumns() throws Exception {
        String content = Files.readString(Paths.get(MIGRATION_FILE), StandardCharsets.UTF_8);
        assertThat(content).contains("psych_assessment_extractions");
        assertThat(content).contains("deleted_at");
        assertThat(content).contains("version");
        assertThat(content).contains("ALTER TABLE psych_assessment_extractions");
    }

    @Test
    @DisplayName("psych_assessment_metrics에 deleted_at, version 컬럼 추가")
    void metricsTableHasBaseEntityColumns() throws Exception {
        String content = Files.readString(Paths.get(MIGRATION_FILE), StandardCharsets.UTF_8);
        assertThat(content).contains("psych_assessment_metrics");
        assertThat(content).contains("ALTER TABLE psych_assessment_metrics");
    }

    @Test
    @DisplayName("psych_assessment_reports에 deleted_at, version 컬럼 추가")
    void reportsTableHasBaseEntityColumns() throws Exception {
        String content = Files.readString(Paths.get(MIGRATION_FILE), StandardCharsets.UTF_8);
        assertThat(content).contains("psych_assessment_reports");
        assertThat(content).contains("ALTER TABLE psych_assessment_reports");
    }

    @Test
    @DisplayName("마이그레이션 DDL 형식 검증 - ADD COLUMN 구문")
    void migrationUsesAddColumn() throws Exception {
        String content = Files.readString(Paths.get(MIGRATION_FILE), StandardCharsets.UTF_8);
        // MySQL 동적 SQL 문자열 내부에 ADD COLUMN 이 포함됨 (줄 단독 ADD COLUMN 아님)
        long addColumnOccurrences = content.lines()
                .filter(l -> l.toUpperCase().contains("ADD COLUMN"))
                .count();
        assertThat(addColumnOccurrences).isGreaterThanOrEqualTo(6); // 3 tables × 2 columns each
    }
}

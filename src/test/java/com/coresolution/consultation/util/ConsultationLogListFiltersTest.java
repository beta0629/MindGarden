package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 상담일지 목록 요약·검색 파라미터.
 *
 * @author CoreSolution
 * @since 2026-10-10
 */
@DisplayName("ConsultationLogListFilters")
class ConsultationLogListFiltersTest {

    @Test
    @DisplayName("요약은 첫 줄만, 길면 상한에서 자른다")
    void previewUsesFirstLineAndCap() {
        assertThat(ConsultationLogListFilters.preview(null)).isNull();
        assertThat(ConsultationLogListFilters.preview("  ")).isNull();
        assertThat(ConsultationLogListFilters.preview("첫 줄\n둘째 줄")).isEqualTo("첫 줄");

        String longLine = "가".repeat(ConsultationLogListFilters.SUMMARY_PREVIEW_MAX_LENGTH + 5);
        assertThat(ConsultationLogListFilters.preview(longLine))
                .hasSize(ConsultationLogListFilters.SUMMARY_PREVIEW_MAX_LENGTH);
    }

    @Test
    @DisplayName("matchedClientIds 는 양의 정수만 남긴다")
    void parseMatchedClientIdsSkipsInvalidTokens() {
        assertThat(ConsultationLogListFilters.parseMatchedClientIds(null)).isEmpty();
        assertThat(ConsultationLogListFilters.parseMatchedClientIds("12, x, 0, -3, 44"))
                .containsExactly(12L, 44L);
    }

    @Test
    @DisplayName("LIKE 패턴은 와일드카드를 이스케이프한다")
    void likePatternEscapesWildcards() {
        assertThat(ConsultationLogListFilters.likePattern(" 100%_a "))
                .isEqualTo("%100\\%\\_a%");
    }

    @Test
    @DisplayName("목록 DTO 요약은 mainIssues 첫 줄이다")
    void listItemCarriesPreview() {
        com.coresolution.consultation.entity.ConsultationRecord record =
                new com.coresolution.consultation.entity.ConsultationRecord();
        record.setId(7L);
        record.setMainIssues("수면 점검\n다음 줄");
        record.setIsSessionCompleted(true);

        assertThat(com.coresolution.consultation.dto.ConsultationRecordListItemResponse
                .fromEntity(record).getSummaryPreview()).isEqualTo("수면 점검");
    }
}

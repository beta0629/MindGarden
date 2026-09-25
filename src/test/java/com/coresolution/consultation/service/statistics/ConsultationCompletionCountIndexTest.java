package com.coresolution.consultation.service.statistics;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.time.LocalDate;
import java.util.List;

import com.coresolution.consultation.repository.ScheduleRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.data.jpa.repository.Query;

/**
 * 상담 완료 집계 인덱스와 tenantId GROUP BY 쿼리 경계.
 *
 * @author MindGarden
 * @since 2026-09-25
 */
@DisplayName("상담 완료 집계 인덱스")
class ConsultationCompletionCountIndexTest {

    @Test
    @DisplayName("상담사별 행은 ID 로 찾고 없는 상담사는 0")
    void byConsultant_mapsRowsAndMissingIsZero() {
        var counts = ConsultationCompletionCountIndex.byConsultant(List.of(
                new Object[] {10L, 3L},
                new Object[] {11, 1L},
                new Object[] {null, 9L}));

        assertThat(ConsultationCompletionCountIndex.countOf(counts, 10L)).isEqualTo(3L);
        assertThat(ConsultationCompletionCountIndex.countOf(counts, 11L)).isEqualTo(1L);
        assertThat(ConsultationCompletionCountIndex.countOf(counts, 99L)).isZero();
    }

    @Test
    @DisplayName("일자 합계는 시작·종료일을 포함하고 바깥 날짜는 빼지 않는다")
    void sumBetween_isInclusive() {
        LocalDate start = LocalDate.of(2026, 9, 1);
        LocalDate inside = LocalDate.of(2026, 9, 15);
        LocalDate end = LocalDate.of(2026, 9, 30);
        var counts = ConsultationCompletionCountIndex.byDate(List.of(
                new Object[] {start, 2L},
                new Object[] {inside, 4L},
                new Object[] {end, 1L},
                new Object[] {end.plusDays(1), 9L},
                new Object[] {java.sql.Date.valueOf(start.plusDays(1)), 3L}));

        assertThat(ConsultationCompletionCountIndex.sumBetween(counts, start, end)).isEqualTo(10L);
        assertThat(ConsultationCompletionCountIndex.sumBetween(counts, end.plusDays(1), end.plusDays(2)))
                .isEqualTo(9L);
        assertThat(ConsultationCompletionCountIndex.sumBetween(null, start, end)).isZero();
    }

    @Test
    @DisplayName("완료 집계 쿼리는 tenantId GROUP BY 이고 삭제 필터를 더하지 않는다")
    void completedAggregationQueries_requireTenantId() throws Exception {
        assertGroupedTenantQuery("countCompletedByConsultantIdsAndDateBetween");
        assertGroupedTenantQuery("countCompletedByDateForConsultantIds");
    }

    private static void assertGroupedTenantQuery(String methodName) throws Exception {
        Method method = ScheduleRepository.class.getMethod(
                methodName,
                String.class,
                com.coresolution.consultation.constant.ScheduleStatus.class,
                java.util.List.class,
                LocalDate.class,
                LocalDate.class);
        Query query = method.getAnnotation(Query.class);
        assertThat(query).isNotNull();
        assertThat(query.value()).contains("s.tenantId = :tenantId");
        assertThat(query.value()).contains("GROUP BY");
        assertThat(query.value()).doesNotContain("isDeleted");
    }
}

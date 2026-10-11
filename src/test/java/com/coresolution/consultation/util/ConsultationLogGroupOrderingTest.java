package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 상담사 선택 묶음 정렬.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@DisplayName("상담일지 상담사 선택 묶음 정렬")
class ConsultationLogGroupOrderingTest {

    private static final LocalDate EARLY = LocalDate.of(2026, 9, 1);
    private static final LocalDate MID = LocalDate.of(2026, 9, 24);
    private static final LocalDate LATE = LocalDate.of(2026, 10, 8);

    @Test
    @DisplayName("최근 상담일이 늦은 내담자가 먼저이고, 묶음 안은 회기·상담일 오름차순이다")
    void ordersGroupsByLastDateThenSessionsAscending() {
        List<ConsultationLogSortRow> rows = List.of(
                row(3L, 20L, 3, LATE),
                row(1L, 10L, 2, MID),
                row(2L, 10L, 1, EARLY),
                row(4L, 20L, 1, MID));
        Map<Long, LocalDate> lastDates = Map.of(10L, MID, 20L, LATE);

        List<Long> ids = ConsultationLogGroupOrdering.orderByClientGroup(rows, lastDates, Map.of(
                10L, "한서윤",
                20L, "오세아")).stream().map(ConsultationLogSortRow::id).toList();

        assertThat(ids).containsExactly(4L, 3L, 2L, 1L);
    }

    @Test
    @DisplayName("최근 상담일이 같으면 표시명 순이고, 이름이 없으면 뒤로 가며 id로 가른다")
    void sameLastDateUsesNameThenIdAndMissingNameSortsLast() {
        List<ConsultationLogSortRow> rows = List.of(
                row(1L, 30L, 1, LATE),
                row(2L, 10L, 1, LATE),
                row(3L, 20L, 1, LATE));
        Map<Long, LocalDate> lastDates = Map.of(10L, LATE, 20L, LATE, 30L, LATE);

        List<Long> ids = ConsultationLogGroupOrdering.orderByClientGroup(rows, lastDates, Map.of(
                10L, "한서윤",
                20L, "김다온")).stream().map(ConsultationLogSortRow::id).toList();

        assertThat(ids).containsExactly(3L, 2L, 1L);
    }

    @Test
    @DisplayName("회기가 없거나 0 이하면 같은 내담자 묶음 안에서 뒤로 간다")
    void missingSessionNumberSortsAfterRealSessions() {
        List<ConsultationLogSortRow> rows = List.of(
                row(1L, 10L, null, LATE),
                row(2L, 10L, 0, MID),
                row(3L, 10L, 1, EARLY));

        List<Long> ids = ConsultationLogGroupOrdering.orderByClientGroup(
                rows, Map.of(10L, LATE), Map.of(10L, "한서윤"))
                .stream().map(ConsultationLogSortRow::id).toList();

        assertThat(ids).containsExactly(3L, 2L, 1L);
    }

    private static ConsultationLogSortRow row(Long id, Long clientId, Integer sessionNumber, LocalDate sessionDate) {
        return new ConsultationLogSortRow(id, clientId, sessionNumber, sessionDate);
    }
}

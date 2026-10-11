package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 내담자 타임라인 정렬과 30회기 쪽 경계.
 *
 * @author CoreSolution
 * @since 2026-10-11
 */
@DisplayName("상담일지 타임라인 정렬")
class ConsultationLogTimelineOrderingTest {

    private static final Long CLIENT_ID = 30L;
    private static final Long EARLIER_COUNSELOR = 7L;
    private static final Long LATER_COUNSELOR = 8L;
    private static final int SESSION_COUNT = 30;
    private static final int PAGE_SIZE = 10;
    private static final int COUNSELOR_CHANGE_SESSION = 25;

    @Test
    @DisplayName("기본 최근 순은 상담일이 늦은 회기가 앞이고, 같은 날이면 회기가 큰 쪽이 앞이다")
    void recentOrderPutsLaterDateFirst() {
        List<ConsultationLogSortRow> ordered = ConsultationLogTimelineOrdering.order(List.of(
                row(1L, 5, LocalDate.of(2026, 8, 1), EARLIER_COUNSELOR),
                row(2L, 2, LocalDate.of(2026, 10, 1), EARLIER_COUNSELOR),
                row(3L, 2, LocalDate.of(2026, 10, 1), LATER_COUNSELOR)),
                ConsultationLogTimelineSort.RECENT);

        assertThat(ordered).extracting(ConsultationLogSortRow::id).containsExactly(3L, 2L, 1L);
    }

    @Test
    @DisplayName("회기 순은 번호 오름차순이고 알 수 없는 값은 최근 순으로 본다")
    void sessionOrderAndUnknownSort() {
        List<ConsultationLogSortRow> ordered = ConsultationLogTimelineOrdering.order(List.of(
                row(2L, 2, LocalDate.of(2026, 10, 1), EARLIER_COUNSELOR),
                row(1L, 1, LocalDate.of(2026, 8, 1), EARLIER_COUNSELOR)),
                ConsultationLogTimelineSort.from("nope"));

        assertThat(ConsultationLogTimelineSort.from(null)).isEqualTo(ConsultationLogTimelineSort.RECENT);
        assertThat(ConsultationLogTimelineSort.from(" session ")).isEqualTo(ConsultationLogTimelineSort.SESSION);
        assertThat(ordered).extracting(ConsultationLogSortRow::id).containsExactly(2L, 1L);

        List<ConsultationLogSortRow> sessionOrder = ConsultationLogTimelineOrdering.order(List.of(
                row(2L, 2, LocalDate.of(2026, 10, 1), LATER_COUNSELOR),
                row(1L, 1, LocalDate.of(2026, 8, 13), EARLIER_COUNSELOR)),
                ConsultationLogTimelineSort.SESSION);
        assertThat(sessionOrder).extracting(ConsultationLogSortRow::id).containsExactly(1L, 2L);
    }

    @Test
    @DisplayName("30회기 최근 순 2쪽은 같은 상담사 구간이 이어지고 직전 상담사를 경계로 돌려준다")
    void thirtySessionsSecondPageContinuesCounselor() {
        List<ConsultationLogSortRow> ordered = ConsultationLogTimelineOrdering.order(
                thirtySessions(), ConsultationLogTimelineSort.RECENT);

        assertThat(ordered).hasSize(SESSION_COUNT);
        assertThat(ordered.get(0).sessionNumber()).isEqualTo(SESSION_COUNT);
        assertThat(ordered.get(0).consultantId()).isEqualTo(LATER_COUNSELOR);

        ConsultationLogTimelineOrdering.Slice first = ConsultationLogTimelineOrdering.page(ordered, 0, PAGE_SIZE);
        ConsultationLogTimelineOrdering.Slice second = ConsultationLogTimelineOrdering.page(ordered, 1, PAGE_SIZE);

        assertThat(first.preceding()).isNull();
        assertThat(first.rows()).extracting(ConsultationLogSortRow::sessionNumber)
                .containsExactly(30, 29, 28, 27, 26, 25, 24, 23, 22, 21);
        assertThat(first.rows().get(0).consultantId()).isEqualTo(LATER_COUNSELOR);
        assertThat(first.rows().get(6).consultantId()).isEqualTo(EARLIER_COUNSELOR);
        assertThat(second.total()).isEqualTo(SESSION_COUNT);
        assertThat(second.rows()).extracting(ConsultationLogSortRow::sessionNumber)
                .containsExactly(20, 19, 18, 17, 16, 15, 14, 13, 12, 11);
        assertThat(second.preceding()).isNotNull();
        assertThat(second.preceding().sessionNumber()).isEqualTo(21);
        assertThat(second.preceding().consultantId()).isEqualTo(second.rows().get(0).consultantId());
    }

    private static List<ConsultationLogSortRow> thirtySessions() {
        List<ConsultationLogSortRow> rows = new ArrayList<>();
        for (int session = 1; session <= SESSION_COUNT; session++) {
            Long consultantId = session >= COUNSELOR_CHANGE_SESSION ? LATER_COUNSELOR : EARLIER_COUNSELOR;
            rows.add(row((long) session, session, LocalDate.of(2026, 3, session), consultantId));
        }
        return rows;
    }

    private static ConsultationLogSortRow row(Long id, int sessionNumber, LocalDate sessionDate, Long consultantId) {
        return new ConsultationLogSortRow(id, CLIENT_ID, consultantId, sessionNumber, sessionDate);
    }
}

package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * 가예약 rem=0 일정등록 OPEN 점유 SSOT.
 * COMPLETED는 이력 표시만({@link ScheduleStatus#occupiesForConsultationScheduleHistory()}).
 *
 * @author MindGarden
 * @since 2026-09-09
 */
@DisplayName("ScheduleStatus.occupiesForProvisionalMappingGuard")
class ScheduleStatusOccupiesForProvisionalMappingGuardTest {

    @ParameterizedTest
    @EnumSource(
            value = ScheduleStatus.class,
            names = {"BOOKED", "TENTATIVE_PENDING_PAYMENT", "CONFIRMED", "IN_PROGRESS"})
    @DisplayName("OPEN 상담 일정 점유 상태는 true")
    void occupyingStatuses_returnTrue(ScheduleStatus status) {
        assertThat(status.occupiesForProvisionalMappingGuard()).isTrue();
        assertThat(status.occupiesForConsultationScheduleHistory()).isTrue();
    }

    @ParameterizedTest
    @EnumSource(
            value = ScheduleStatus.class,
            names = {"CANCELLED", "AVAILABLE", "VACATION", "COMPLETED"})
    @DisplayName("CANCELLED·AVAILABLE·VACATION·COMPLETED는 가예약 차단 false")
    void nonOccupyingStatuses_returnFalse(ScheduleStatus status) {
        assertThat(status.occupiesForProvisionalMappingGuard()).isFalse();
    }

    @Test
    @DisplayName("occupyingStatusesForProvisionalMapping 목록에 IN_PROGRESS 포함, COMPLETED·CANCELLED 미포함")
    void occupyingStatusesList_includesInProgress_excludesCompletedAndCancelled() {
        List<ScheduleStatus> statuses = ScheduleStatus.occupyingStatusesForProvisionalMapping();
        assertThat(statuses).containsExactlyInAnyOrder(
                ScheduleStatus.BOOKED,
                ScheduleStatus.TENTATIVE_PENDING_PAYMENT,
                ScheduleStatus.CONFIRMED,
                ScheduleStatus.IN_PROGRESS);
        assertThat(statuses).doesNotContain(
                ScheduleStatus.COMPLETED, ScheduleStatus.CANCELLED,
                ScheduleStatus.AVAILABLE, ScheduleStatus.VACATION);
        assertThat(statuses).allMatch(ScheduleStatus::occupiesForProvisionalMappingGuard);
    }

    @Test
    @DisplayName("이력 목록은 COMPLETED를 포함하고 가예약 OPEN 목록과 분리")
    void historyStatusesList_includesCompleted() {
        List<ScheduleStatus> history = ScheduleStatus.occupyingStatusesForConsultationScheduleHistory();
        assertThat(history).contains(ScheduleStatus.COMPLETED, ScheduleStatus.IN_PROGRESS);
        assertThat(history).containsAll(ScheduleStatus.occupyingStatusesForProvisionalMapping());
        assertThat(history).allMatch(ScheduleStatus::occupiesForConsultationScheduleHistory);
    }

    @Test
    @DisplayName("COMPLETED는 가예약 OPEN 비점유·이력 표시 true·시간 슬롯 충돌은 점유")
    void completed_isHistoryNotProvisionalOccupy() {
        assertThat(ScheduleStatus.COMPLETED.occupiesForProvisionalMappingGuard()).isFalse();
        assertThat(ScheduleStatus.COMPLETED.occupiesForConsultationScheduleHistory()).isTrue();
        assertThat(ScheduleStatus.COMPLETED.occupiesTimeForConflictCheck()).isTrue();
    }
}

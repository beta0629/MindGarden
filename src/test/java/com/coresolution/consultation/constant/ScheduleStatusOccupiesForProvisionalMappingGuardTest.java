package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * 가예약 단일 일정 규칙·카드 hasConsultationSchedule enrich 점유 SSOT 검증.
 * 시간 슬롯 충돌({@link ScheduleStatus#occupiesTimeForConflictCheck()})과는 별도 — COMPLETED 포함.
 *
 * @author MindGarden
 * @since 2026-09-09
 */
@DisplayName("ScheduleStatus.occupiesForProvisionalMappingGuard")
class ScheduleStatusOccupiesForProvisionalMappingGuardTest {

    @ParameterizedTest
    @EnumSource(
            value = ScheduleStatus.class,
            names = {"BOOKED", "TENTATIVE_PENDING_PAYMENT", "CONFIRMED", "COMPLETED", "IN_PROGRESS"})
    @DisplayName("상담 일정 점유 상태는 true")
    void occupyingStatuses_returnTrue(ScheduleStatus status) {
        assertThat(status.occupiesForProvisionalMappingGuard()).isTrue();
    }

    @ParameterizedTest
    @EnumSource(
            value = ScheduleStatus.class,
            names = {"CANCELLED", "AVAILABLE", "VACATION"})
    @DisplayName("CANCELLED·AVAILABLE·VACATION은 false")
    void nonOccupyingStatuses_returnFalse(ScheduleStatus status) {
        assertThat(status.occupiesForProvisionalMappingGuard()).isFalse();
    }

    @Test
    @DisplayName("occupyingStatusesForProvisionalMapping 목록에 COMPLETED·IN_PROGRESS 포함, CANCELLED 미포함")
    void occupyingStatusesList_includesCompletedAndInProgress_excludesCancelled() {
        List<ScheduleStatus> statuses = ScheduleStatus.occupyingStatusesForProvisionalMapping();
        assertThat(statuses).containsExactlyInAnyOrder(
                ScheduleStatus.BOOKED,
                ScheduleStatus.TENTATIVE_PENDING_PAYMENT,
                ScheduleStatus.CONFIRMED,
                ScheduleStatus.COMPLETED,
                ScheduleStatus.IN_PROGRESS);
        assertThat(statuses).doesNotContain(ScheduleStatus.CANCELLED, ScheduleStatus.AVAILABLE, ScheduleStatus.VACATION);
        assertThat(statuses).allMatch(ScheduleStatus::occupiesForProvisionalMappingGuard);
    }

    @Test
    @DisplayName("COMPLETED는 슬롯 충돌 비점유이지만 가예약 매핑 가드에는 점유")
    void completed_occupiesProvisionalButNotTimeConflict() {
        assertThat(ScheduleStatus.COMPLETED.occupiesForProvisionalMappingGuard()).isTrue();
        assertThat(ScheduleStatus.COMPLETED.occupiesTimeForConflictCheck()).isFalse();
    }
}

package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * 취소·비점유 상태가 충돌/가용 슬롯 검사에서 제외되는지 ScheduleStatus SSOT 검증.
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@DisplayName("ScheduleStatus.occupiesTimeForConflictCheck")
class ScheduleStatusOccupiesTimeForConflictCheckTest {

    @ParameterizedTest
    @EnumSource(
            value = ScheduleStatus.class,
            names = {"BOOKED", "CONFIRMED", "IN_PROGRESS", "TENTATIVE_PENDING_PAYMENT", "COMPLETED"})
    @DisplayName("활성 예약·완료 상태는 슬롯을 점유한다")
    void occupyingStatuses_returnTrue(ScheduleStatus status) {
        assertThat(status.occupiesTimeForConflictCheck()).isTrue();
    }

    @ParameterizedTest
    @EnumSource(
            value = ScheduleStatus.class,
            names = {"CANCELLED", "AVAILABLE", "VACATION"})
    @DisplayName("취소·가용·휴가는 슬롯을 점유하지 않는다")
    void nonOccupyingStatuses_returnFalse(ScheduleStatus status) {
        assertThat(status.occupiesTimeForConflictCheck()).isFalse();
    }

    @Test
    @DisplayName("CANCELLED는 재예약 가능(비점유)이다")
    void cancelled_doesNotOccupy() {
        assertThat(ScheduleStatus.CANCELLED.occupiesTimeForConflictCheck()).isFalse();
    }
}

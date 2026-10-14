package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ScheduleStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * 일정 확정·재점유 전이 판정.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@DisplayName("ScheduleStatusTransitionPolicy")
class ScheduleStatusTransitionPolicyTest {

    @ParameterizedTest
    @EnumSource(value = ScheduleStatus.class, names = {"BOOKED", "TENTATIVE_PENDING_PAYMENT"})
    @DisplayName("예약됨·가예약만 확정 가능")
    void allowsConfirm_onlyBookedAndTentative(ScheduleStatus status) {
        assertThat(ScheduleStatusTransitionPolicy.allowsConfirm(status)).isTrue();
        assertThat(ScheduleStatusTransitionPolicy.isAlreadyConfirmed(status)).isFalse();
    }

    @ParameterizedTest
    @EnumSource(value = ScheduleStatus.class, names = {
            "CANCELLED", "VACATION", "COMPLETED", "IN_PROGRESS", "AVAILABLE"})
    @DisplayName("그 밖 상태는 확정 불가")
    void allowsConfirm_falseForNonConfirmable(ScheduleStatus status) {
        assertThat(ScheduleStatusTransitionPolicy.allowsConfirm(status)).isFalse();
    }

    @Test
    @DisplayName("이미 확정은 재확정 멱등 대상")
    void alreadyConfirmed_isIdempotentTarget() {
        assertThat(ScheduleStatusTransitionPolicy.isAlreadyConfirmed(ScheduleStatus.CONFIRMED)).isTrue();
        assertThat(ScheduleStatusTransitionPolicy.allowsConfirm(ScheduleStatus.CONFIRMED)).isFalse();
    }

    @Test
    @DisplayName("취소·완료에서 확정·예약으로 되돌리기 불가")
    void terminalReoccupy_denied() {
        assertThat(ScheduleStatusTransitionPolicy.allowsReoccupy(
                ScheduleStatus.CANCELLED, ScheduleStatus.CONFIRMED)).isFalse();
        assertThat(ScheduleStatusTransitionPolicy.allowsReoccupy(
                ScheduleStatus.COMPLETED, ScheduleStatus.BOOKED)).isFalse();
        assertThat(ScheduleStatusTransitionPolicy.allowsReoccupy(
                ScheduleStatus.BOOKED, ScheduleStatus.CONFIRMED)).isTrue();
    }
}

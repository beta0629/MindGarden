package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.util.ConsultationRecordLinkedScheduleCompletion.Action;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ConsultationRecordLinkedScheduleCompletion} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
@DisplayName("ConsultationRecordLinkedScheduleCompletion")
class ConsultationRecordLinkedScheduleCompletionTest {

    @Test
    @DisplayName("COMPLETED → DEDUCT_ONLY")
    void completed_deductOnly() {
        assertThat(ConsultationRecordLinkedScheduleCompletion.resolveAction(schedule(ScheduleStatus.COMPLETED)))
                .isEqualTo(Action.DEDUCT_ONLY);
    }

    @Test
    @DisplayName("BOOKED/CONFIRMED/IN_PROGRESS → DEDUCT_AND_MARK_COMPLETED")
    void occupying_deductAndMarkCompleted() {
        assertThat(ConsultationRecordLinkedScheduleCompletion.resolveAction(schedule(ScheduleStatus.BOOKED)))
                .isEqualTo(Action.DEDUCT_AND_MARK_COMPLETED);
        assertThat(ConsultationRecordLinkedScheduleCompletion.resolveAction(schedule(ScheduleStatus.CONFIRMED)))
                .isEqualTo(Action.DEDUCT_AND_MARK_COMPLETED);
        assertThat(ConsultationRecordLinkedScheduleCompletion.resolveAction(schedule(ScheduleStatus.IN_PROGRESS)))
                .isEqualTo(Action.DEDUCT_AND_MARK_COMPLETED);
    }

    @Test
    @DisplayName("CANCELLED → SKIP")
    void cancelled_skip() {
        assertThat(ConsultationRecordLinkedScheduleCompletion.resolveAction(schedule(ScheduleStatus.CANCELLED)))
                .isEqualTo(Action.SKIP);
    }

    @Test
    @DisplayName("null schedule → SKIP")
    void nullSchedule_skip() {
        assertThat(ConsultationRecordLinkedScheduleCompletion.resolveAction(null)).isEqualTo(Action.SKIP);
    }

    private static Schedule schedule(ScheduleStatus status) {
        Schedule s = new Schedule();
        s.setId(461L);
        s.setStatus(status);
        return s;
    }
}

package com.coresolution.consultation.util;

import java.time.LocalTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link ScheduleSlotTimes} — 이동 시 종료 시각 길이 유지.
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
@DisplayName("ScheduleSlotTimes — 이동 종료 시각")
class ScheduleSlotTimesTest {

    @Test
    @DisplayName("시작 이동 → 기존 길이(50분) 유지")
    void shiftsEndPreservingDuration() {
        assertThat(ScheduleSlotTimes.shiftEndPreservingDuration(
            LocalTime.of(14, 30), LocalTime.of(15, 20), LocalTime.of(8, 30)))
            .isEqualTo(LocalTime.of(9, 20));
    }

    @Test
    @DisplayName("기존 시작·종료 없음 또는 길이 0 이하 → 기존 종료 유지")
    void keepsPreviousEndWhenUndeterminable() {
        assertThat(ScheduleSlotTimes.shiftEndPreservingDuration(null, LocalTime.of(15, 0), LocalTime.of(9, 0)))
            .isEqualTo(LocalTime.of(15, 0));
        assertThat(ScheduleSlotTimes.shiftEndPreservingDuration(LocalTime.of(10, 0), null, LocalTime.of(9, 0)))
            .isNull();
        assertThat(ScheduleSlotTimes.shiftEndPreservingDuration(
            LocalTime.of(10, 0), LocalTime.of(10, 0), LocalTime.of(9, 0)))
            .isEqualTo(LocalTime.of(10, 0));
    }

    @Test
    @DisplayName("이동 결과가 자정을 넘기면 기존 종료 유지")
    void keepsPreviousEndWhenCrossingMidnight() {
        assertThat(ScheduleSlotTimes.shiftEndPreservingDuration(
            LocalTime.of(10, 0), LocalTime.of(11, 0), LocalTime.of(23, 30)))
            .isEqualTo(LocalTime.of(11, 0));
    }
}

package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * 점유 일정 회차의 날짜·시작 시각·id 정렬 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-10-11
 */
@DisplayName("MappingOccupyingSessionSequenceOrder")
class MappingOccupyingSessionSequenceOrderTest {

    @Test
    @DisplayName("날짜, 같은 날이면 시작 시각, 같으면 id 순으로 1..N")
    void assignsOneThroughNByDateStartTimeAndId() {
        Schedule laterSameTimeHigherId = schedule(30L, LocalDate.of(2026, 10, 12), LocalTime.of(19, 0));
        Schedule earlier = schedule(10L, LocalDate.of(2026, 10, 9), LocalTime.of(19, 0));
        Schedule sameDayEarlierStart = schedule(20L, LocalDate.of(2026, 10, 12), LocalTime.of(10, 0));
        Schedule sameSlotLowerId = schedule(25L, LocalDate.of(2026, 10, 12), LocalTime.of(19, 0));
        Schedule undated = schedule(5L, null, null);

        Map<Schedule, Integer> assigned = MappingOccupyingSessionSequenceOrder.assignSequences(
                List.of(laterSameTimeHigherId, undated, sameSlotLowerId, earlier, sameDayEarlierStart));

        assertThat(assigned.get(earlier)).isEqualTo(1);
        assertThat(assigned.get(sameDayEarlierStart)).isEqualTo(2);
        assertThat(assigned.get(sameSlotLowerId)).isEqualTo(3);
        assertThat(assigned.get(laterSameTimeHigherId)).isEqualTo(4);
        assertThat(assigned.get(undated)).isEqualTo(5);
    }

    private static Schedule schedule(Long id, LocalDate date, LocalTime start) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setDate(date);
        schedule.setStartTime(start);
        schedule.setStatus(ScheduleStatus.BOOKED);
        return schedule;
    }
}

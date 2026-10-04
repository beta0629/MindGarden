package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.entity.Schedule;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link ScheduleSessionStartGate} — 시작 전 완료 차단 판정 SSOT.
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@DisplayName("ScheduleSessionStartGate")
class ScheduleSessionStartGateTest {

    private static final LocalDate DATE = LocalDate.of(2026, 10, 10);

    private static Schedule schedule(LocalDate date, LocalTime start) {
        Schedule s = new Schedule();
        s.setDate(date);
        s.setStartTime(start);
        return s;
    }

    @Test
    @DisplayName("시작 1분 전 true, 시작 시각 정각·이후 false")
    void beforeAtAfterStart() {
        Schedule s = schedule(DATE, LocalTime.of(14, 0));
        assertThat(ScheduleSessionStartGate.isBeforeStart(s, DATE.atTime(13, 59))).isTrue();
        assertThat(ScheduleSessionStartGate.isBeforeStart(s, DATE.atTime(14, 0))).isFalse();
        assertThat(ScheduleSessionStartGate.isBeforeStart(s, DATE.atTime(14, 1))).isFalse();
    }

    @Test
    @DisplayName("자정 경계 — 00:00 시작: 전날 23:59 true, 당일 00:00 false / 23:30 시작: 당일 23:29 true")
    void midnightBoundary() {
        Schedule midnight = schedule(DATE, LocalTime.MIDNIGHT);
        assertThat(ScheduleSessionStartGate.isBeforeStart(midnight, DATE.minusDays(1).atTime(23, 59))).isTrue();
        assertThat(ScheduleSessionStartGate.isBeforeStart(midnight, DATE.atStartOfDay())).isFalse();

        Schedule late = schedule(DATE, LocalTime.of(23, 30));
        assertThat(ScheduleSessionStartGate.isBeforeStart(late, DATE.atTime(23, 29))).isTrue();
        assertThat(ScheduleSessionStartGate.isBeforeStart(late, DATE.plusDays(1).atTime(0, 10))).isFalse();
    }

    @Test
    @DisplayName("startTime 없으면 그날 00:00 기준, 날짜·일정 없으면 판정 불가(false)")
    void missingFields() {
        assertThat(ScheduleSessionStartGate.isBeforeStart(schedule(DATE, null), DATE.minusDays(1).atTime(23, 0)))
                .isTrue();
        assertThat(ScheduleSessionStartGate.isBeforeStart(schedule(DATE, null), DATE.atTime(0, 0))).isFalse();
        assertThat(ScheduleSessionStartGate.isBeforeStart(schedule(null, LocalTime.NOON), DATE.atTime(0, 0)))
                .isFalse();
        assertThat(ScheduleSessionStartGate.isBeforeStart(null, DATE.atTime(0, 0))).isFalse();
    }

    @Test
    @DisplayName("now — 설정 시간대 벽시계 기준 (UTC 15:00 = 기본 시간대 다음날 00:00)")
    void nowUsesConfiguredZone() {
        ZoneId zone = ScheduleSessionStartGate.resolveZone("");
        ZonedDateTime utc = ZonedDateTime.of(DATE.minusDays(1).atTime(15, 0), ZoneId.of("UTC"));
        Clock clock = Clock.fixed(utc.toInstant(), zone);
        LocalDateTime now = ScheduleSessionStartGate.now(clock, null);
        assertThat(now).isEqualTo(utc.withZoneSameInstant(zone).toLocalDateTime());
        assertThat(ScheduleSessionStartGate.resolveZone(" " + zone.getId() + " ")).isEqualTo(zone);
    }
}

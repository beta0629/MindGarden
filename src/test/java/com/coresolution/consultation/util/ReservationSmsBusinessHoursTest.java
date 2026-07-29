package com.coresolution.consultation.util;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link ReservationSmsBusinessHours} 경계 시각 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-07-29
 */
@DisplayName("ReservationSmsBusinessHours")
class ReservationSmsBusinessHoursTest {

    private static final ZoneId SEOUL = ReservationSmsBusinessHours.ZONE_SEOUL;
    private static final LocalTime START = LocalTime.of(9, 0);
    private static final LocalTime END = LocalTime.of(18, 0);

    private static Clock fixedAt(String localDateTime) {
        LocalDateTime ldt = LocalDateTime.parse(localDateTime);
        Instant instant = ldt.atZone(SEOUL).toInstant();
        return Clock.fixed(instant, SEOUL);
    }

    @Nested
    @DisplayName("isWithinBusinessHours")
    class IsWithinBusinessHours {

        @ParameterizedTest(name = "{0} → {1}")
        @CsvSource({
                "2026-07-29T08:59:00, false",
                "2026-07-29T09:00:00, true",
                "2026-07-29T17:59:00, true",
                "2026-07-29T18:00:00, false",
                "2026-07-29T23:00:00, false"
        })
        void boundaries(String now, boolean expected) {
            assertThat(ReservationSmsBusinessHours.isWithinBusinessHours(
                    fixedAt(now), START, END))
                    .isEqualTo(expected);
        }
    }

    @Nested
    @DisplayName("resolveDeferredFireAt")
    class ResolveDeferredFireAt {

        @Test
        @DisplayName("08:59 → 당일 09:00")
        void beforeStart_sameDayNine() {
            Optional<LocalDateTime> fireAt = ReservationSmsBusinessHours.resolveDeferredFireAt(
                    fixedAt("2026-07-29T08:59:00"), START, END);
            assertThat(fireAt).contains(LocalDateTime.of(2026, 7, 29, 9, 0));
        }

        @Test
        @DisplayName("09:00 → 즉시(empty)")
        void atStart_immediate() {
            assertThat(ReservationSmsBusinessHours.resolveDeferredFireAt(
                    fixedAt("2026-07-29T09:00:00"), START, END))
                    .isEmpty();
        }

        @Test
        @DisplayName("17:59 → 즉시(empty)")
        void justBeforeEnd_immediate() {
            assertThat(ReservationSmsBusinessHours.resolveDeferredFireAt(
                    fixedAt("2026-07-29T17:59:00"), START, END))
                    .isEmpty();
        }

        @Test
        @DisplayName("18:00 → 익일 09:00")
        void atEnd_nextDayNine() {
            Optional<LocalDateTime> fireAt = ReservationSmsBusinessHours.resolveDeferredFireAt(
                    fixedAt("2026-07-29T18:00:00"), START, END);
            assertThat(fireAt).contains(LocalDateTime.of(2026, 7, 30, 9, 0));
        }

        @Test
        @DisplayName("23:00 → 익일 09:00")
        void lateNight_nextDayNine() {
            Optional<LocalDateTime> fireAt = ReservationSmsBusinessHours.resolveDeferredFireAt(
                    fixedAt("2026-07-29T23:00:00"), START, END);
            assertThat(fireAt).contains(LocalDateTime.of(2026, 7, 30, 9, 0));
        }
    }

    @Nested
    @DisplayName("startOfToday / startOfTomorrow")
    class DayBounds {

        @Test
        @DisplayName("당일·익일 00:00 경계")
        void dayWindow() {
            Clock clock = fixedAt("2026-07-29T15:30:00");
            assertThat(ReservationSmsBusinessHours.startOfToday(clock))
                    .isEqualTo(LocalDateTime.of(2026, 7, 29, 0, 0));
            assertThat(ReservationSmsBusinessHours.startOfTomorrow(clock))
                    .isEqualTo(LocalDateTime.of(2026, 7, 30, 0, 0));
        }
    }
}

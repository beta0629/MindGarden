package com.coresolution.consultation.util;

import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Objects;
import java.util.Optional;

/**
 * 예약 즉시 SMS 업무시간(quiet hours) 판정 유틸.
 *
 * <p>타임존은 {@link #ZONE_SEOUL}({@code Asia/Seoul}) 고정.
 * 윈도우: {@code [businessStartInclusive, businessEndExclusive)} —
 * 기본 09:00 이상 18:00 미만이면 즉시 발송, 그 외는 지연 발송 시각을 계산한다.</p>
 *
 * <p>지연 규칙 (핸드오프 확정):
 * <ul>
 *   <li>{@code 09:00 ≤ t < 18:00} → 즉시 (empty)</li>
 *   <li>{@code t ≥ 18:00} → 다음날 09:00</li>
 *   <li>{@code t < 09:00} → 당일 09:00</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-07-29
 */
public final class ReservationSmsBusinessHours {

    /** 예약 SMS 업무시간 판정용 타임존. */
    public static final ZoneId ZONE_SEOUL = ZoneId.of("Asia/Seoul");

    private ReservationSmsBusinessHours() {
    }

    /**
     * 현재 시각이 업무시간 윈도우 안인지 여부.
     *
     * @param clock               시계 (보통 Asia/Seoul)
     * @param businessStartInclusive 시작(포함), 예: 09:00
     * @param businessEndExclusive   종료(미포함), 예: 18:00
     * @return 업무시간이면 true
     */
    public static boolean isWithinBusinessHours(
            Clock clock, LocalTime businessStartInclusive, LocalTime businessEndExclusive) {
        Objects.requireNonNull(clock, "clock");
        Objects.requireNonNull(businessStartInclusive, "businessStartInclusive");
        Objects.requireNonNull(businessEndExclusive, "businessEndExclusive");
        LocalTime now = LocalTime.now(clock);
        return !now.isBefore(businessStartInclusive) && now.isBefore(businessEndExclusive);
    }

    /**
     * 업무시간 외이면 지연 발송 시각({@code LocalDateTime}, 서버 로컬이 아닌 시계 zone 기준)을 반환.
     * 업무시간 내면 empty.
     *
     * @param clock                  시계
     * @param businessStartInclusive 시작(포함)
     * @param businessEndExclusive   종료(미포함)
     * @return 지연 발송 시각 또는 empty(즉시)
     */
    public static Optional<LocalDateTime> resolveDeferredFireAt(
            Clock clock, LocalTime businessStartInclusive, LocalTime businessEndExclusive) {
        Objects.requireNonNull(clock, "clock");
        Objects.requireNonNull(businessStartInclusive, "businessStartInclusive");
        Objects.requireNonNull(businessEndExclusive, "businessEndExclusive");

        LocalDateTime now = LocalDateTime.now(clock);
        LocalTime time = now.toLocalTime();
        LocalDate date = now.toLocalDate();

        if (!time.isBefore(businessStartInclusive) && time.isBefore(businessEndExclusive)) {
            return Optional.empty();
        }
        if (time.isBefore(businessStartInclusive)) {
            return Optional.of(LocalDateTime.of(date, businessStartInclusive));
        }
        // t >= businessEndExclusive → 익일 업무 시작
        return Optional.of(LocalDateTime.of(date.plusDays(1), businessStartInclusive));
    }
}

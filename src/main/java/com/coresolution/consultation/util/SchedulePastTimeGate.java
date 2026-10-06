package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * {@link ScheduleSlotGuard} 위임 — 과거 시각 판정 SSOT 는 SlotGuard 하나다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 * @deprecated 신규 코드는 {@link ScheduleSlotGuard} 를 직접 호출한다.
 */
@Deprecated
public final class SchedulePastTimeGate {

    private SchedulePastTimeGate() {
    }

    public static LocalDateTime toDateTime(LocalDate date, LocalTime time) {
        return ScheduleSlotGuard.toDateTime(date, time);
    }

    public static LocalDateTime resolveMoveTarget(
            LocalDate previousDate,
            LocalTime previousStartTime,
            LocalDate targetDate,
            LocalTime targetStartTime,
            LocalTime targetEndTime) {
        return ScheduleSlotGuard.resolveMoveTarget(
                previousDate, previousStartTime, targetDate, targetStartTime, targetEndTime);
    }

    public static boolean isInPast(LocalDateTime dateTime, LocalDateTime now) {
        return ScheduleSlotGuard.isInPast(dateTime, now);
    }

    public static ScheduleSlotGuard.Denial resolveMoveDenial(
            LocalDateTime originStart, LocalDateTime target, LocalDateTime now) {
        return ScheduleSlotGuard.resolveMoveDenial(originStart, target, now);
    }

    public static ScheduleSlotGuard.Denial resolveCreateDenial(LocalDateTime start, LocalDateTime now) {
        return ScheduleSlotGuard.resolveCreateDenial(start, now);
    }
}

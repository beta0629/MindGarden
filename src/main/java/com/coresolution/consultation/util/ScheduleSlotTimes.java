package com.coresolution.consultation.util;

import java.time.Duration;
import java.time.LocalTime;

/**
 * 스케줄 일시 이동(재예약) 시 종료 시각 계산 — 드래그·재예약 모달·API 공통.
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
public final class ScheduleSlotTimes {

    private ScheduleSlotTimes() {
    }

    /**
     * 시작 시각만 바뀐 이동에서 기존 상담 길이를 유지한 종료 시각.
     *
     * <p>기존 시작·종료가 없거나 길이가 0 이하이거나, 이동 결과가 자정을 넘기면(같은 날 안에 끝나지 않으면)
     * 판단할 수 없으므로 기존 종료 시각을 그대로 돌려준다.
     *
     * @param previousStart 이동 전 시작 시각
     * @param previousEnd   이동 전 종료 시각
     * @param newStart      이동 후 시작 시각
     * @return 이동 후 종료 시각
     */
    public static LocalTime shiftEndPreservingDuration(
            LocalTime previousStart, LocalTime previousEnd, LocalTime newStart) {
        if (previousStart == null || previousEnd == null || newStart == null
                || !previousEnd.isAfter(previousStart)) {
            return previousEnd;
        }
        Duration duration = Duration.between(previousStart, previousEnd);
        LocalTime newEnd = newStart.plus(duration);
        return newEnd.isAfter(newStart) ? newEnd : previousEnd;
    }
}

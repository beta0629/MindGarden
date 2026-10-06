package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Objects;

/**
 * 일정 일시 이동(드래그·예약 변경 모달·API) 시 «이동 대상 시각» 과거 판정 SSOT.
 *
 * <p>판정은 <b>이동 후 시각</b>만 본다. 원래 시각이 이미 지났더라도(잘못 옮겨진 일정 등)
 * 미래로 옮기는 것은 허용한다. 완료·취소 등 상태 잠금은 {@link ScheduleSlotGuard} 가 따로 판정한다.</p>
 *
 * <p>현재 시각은 {@link ScheduleSessionStartGate#now} 와 같은 설정 시간대(미설정 시 Asia/Seoul)를 쓴다.
 * 시작 시각이 바뀌면 새 시작 시각을, 종료 시각만 바뀌면(리사이즈) 새 종료 시각을 판정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class ScheduleMoveTargetGate {

    /** 과거 시각으로 이동 거부 문구 (HTTP 400 응답 message). */
    public static final String MOVE_TO_PAST_MESSAGE =
            "현재 시각 이전으로는 일정을 옮길 수 없습니다. 지금 이후의 시간을 선택해 주세요.";

    /** 과거 시각으로 이동 거부 오류 코드. */
    public static final String MOVE_TO_PAST_ERROR_CODE = "SCHEDULE_MOVE_TO_PAST";

    private ScheduleMoveTargetGate() {
    }

    /**
     * 판정할 이동 대상 시각을 정한다.
     *
     * @param previousDate      이동 전 날짜
     * @param previousStartTime 이동 전 시작 시각
     * @param targetDate        이동 후 날짜 (null 이면 이동 전 날짜)
     * @param targetStartTime   이동 후 시작 시각 (null 이면 이동 전 시작 시각)
     * @param targetEndTime     이동 후 종료 시각 (종료만 바뀐 경우 판정 대상)
     * @return 판정 대상 일시, 날짜가 없으면 null
     */
    public static LocalDateTime resolveMoveTarget(
            LocalDate previousDate,
            LocalTime previousStartTime,
            LocalDate targetDate,
            LocalTime targetStartTime,
            LocalTime targetEndTime) {
        LocalDate date = targetDate != null ? targetDate : previousDate;
        if (date == null) {
            return null;
        }
        LocalTime start = targetStartTime != null ? targetStartTime : previousStartTime;
        boolean startMoved = !Objects.equals(previousDate, date) || !Objects.equals(previousStartTime, start);
        LocalTime judged = startMoved || targetEndTime == null ? start : targetEndTime;
        return date.atTime(judged != null ? judged : LocalTime.MIDNIGHT);
    }

    /**
     * 이동 대상 시각이 현재보다 이전인지.
     *
     * @param target 이동 대상 일시 (null 이면 판정 불가 → false)
     * @param now    설정 시간대 기준 현재 시각
     * @return 과거이면 true
     */
    public static boolean isTargetInPast(LocalDateTime target, LocalDateTime now) {
        if (target == null || now == null) {
            return false;
        }
        return target.isBefore(now);
    }
}

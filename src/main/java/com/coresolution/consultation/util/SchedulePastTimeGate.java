package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Objects;

/**
 * 일정 생성·가예약 생성·일시 이동(드래그·예약 변경 모달·API) 시 «현재 시각 이전» 판정 SSOT.
 *
 * <ul>
 *   <li>생성: 시작 시각이 현재보다 이전이면 거부.</li>
 *   <li>이동: 원래 시작 시각 <b>또는</b> 이동 후 시각이 현재보다 이전이면 거부.
 *       지난 일정은 완료·취소·노쇼 등 상태 변경으로만 처리한다(일시 변경 불가).</li>
 * </ul>
 *
 * <p>완료·취소 등 상태 잠금은 {@link ScheduleSlotGuard} 가 따로 판정한다.
 * 현재 시각은 {@link ScheduleSessionStartGate#now} 와 같은 설정 시간대(미설정 시 Asia/Seoul)를 쓴다.
 * 이동 후 시각은 시작이 바뀌면 새 시작, 종료만 바뀌면(리사이즈) 새 종료를 본다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
public final class SchedulePastTimeGate {

    /**
     * 거부 사유 — HTTP 400 응답의 errorCode·message.
     */
    public enum Denial {
        /** 원래 시작 시각이 이미 지난 일정의 이동 */
        MOVE_FROM_PAST("SCHEDULE_MOVE_FROM_PAST",
                "이미 시작 시각이 지난 일정은 옮길 수 없습니다. 완료·취소 등 상태 변경으로 처리해 주세요."),
        /** 현재 시각 이전으로의 이동 */
        MOVE_TO_PAST("SCHEDULE_MOVE_TO_PAST",
                "현재 시각 이전으로는 일정을 옮길 수 없습니다. 지금 이후의 시간을 선택해 주세요."),
        /** 현재 시각 이전 시작으로 일정·가예약 생성 */
        CREATE_IN_PAST("SCHEDULE_CREATE_IN_PAST",
                "현재 시각 이전에는 일정을 등록할 수 없습니다. 지금 이후의 시간을 선택해 주세요.");

        private final String errorCode;
        private final String message;

        Denial(String errorCode, String message) {
            this.errorCode = errorCode;
            this.message = message;
        }

        public String getErrorCode() {
            return errorCode;
        }

        public String getMessage() {
            return message;
        }
    }

    private SchedulePastTimeGate() {
    }

    /**
     * 날짜·시각을 일시로 합친다.
     *
     * @param date 날짜 (null 이면 null)
     * @param time 시각 (null 이면 자정)
     * @return 일시
     */
    public static LocalDateTime toDateTime(LocalDate date, LocalTime time) {
        if (date == null) {
            return null;
        }
        return date.atTime(time != null ? time : LocalTime.MIDNIGHT);
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
        return toDateTime(date, judged);
    }

    /**
     * 일시가 현재보다 이전인지.
     *
     * @param dateTime 판정 일시 (null 이면 판정 불가 → false)
     * @param now      설정 시간대 기준 현재 시각
     * @return 과거이면 true
     */
    public static boolean isInPast(LocalDateTime dateTime, LocalDateTime now) {
        if (dateTime == null || now == null) {
            return false;
        }
        return dateTime.isBefore(now);
    }

    /**
     * 이동 거부 사유. 원래 시작이 지났으면 그 사유가 우선한다.
     *
     * @param originStart 원래 시작 일시 (null 이면 원래 시각 판정 생략)
     * @param target      이동 후 판정 일시 (null 이면 이동 후 판정 생략)
     * @param now         설정 시간대 기준 현재 시각
     * @return 거부 사유, 허용이면 null
     */
    public static Denial resolveMoveDenial(LocalDateTime originStart, LocalDateTime target, LocalDateTime now) {
        if (isInPast(originStart, now)) {
            return Denial.MOVE_FROM_PAST;
        }
        if (isInPast(target, now)) {
            return Denial.MOVE_TO_PAST;
        }
        return null;
    }

    /**
     * 생성 거부 사유.
     *
     * @param start 생성할 일정 시작 일시 (null 이면 판정 생략)
     * @param now   설정 시간대 기준 현재 시각
     * @return 거부 사유, 허용이면 null
     */
    public static Denial resolveCreateDenial(LocalDateTime start, LocalDateTime now) {
        return isInPast(start, now) ? Denial.CREATE_IN_PAST : null;
    }
}

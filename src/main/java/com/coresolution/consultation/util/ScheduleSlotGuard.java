package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.Objects;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;

/**
 * 일정 슬롯 변경 잠금 SSOT — 완료·취소 상태와 «현재 시각 이전» 판정.
 *
 * <ul>
 *   <li>상태: 완료·취소 일정의 일시 변경 거부.</li>
 *   <li>이동: 원래 시작 <b>또는</b> 이동 후 시각이 현재(설정 시간대, 기본 KST)보다 이전이면 거부.
 *       지난 일정은 완료·취소 등 상태 변경으로만 처리한다.</li>
 *   <li>생성: 시작 시각이 현재보다 이전이면 거부.</li>
 * </ul>
 *
 * <p>과거 표시용(날짜·종료) {@link #isScheduleSlotInPast(LocalDate, LocalTime)} 와
 * 이동·생성 판정({@link #resolveMoveDenial}, {@link #resolveCreateDenial})을 구분한다.
 * 이동·생성의 현재 시각은 {@link ScheduleSessionStartGate#now} 와 같다.</p>
 *
 * @author CoreSolution
 * @since 2026-08-25
 */
public final class ScheduleSlotGuard {

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

    private ScheduleSlotGuard() {
    }

    /**
     * Asia/Seoul 기준 스케줄 슬롯이 과거인지 여부(표시·레거시).
     *
     * <p>날짜가 오늘 이전이거나, 당일이면서 종료 시각이 현재보다 이전.
     * 이동·생성 허용 판정은 {@link #isInPast} (시작 시각)을 쓴다.</p>
     *
     * @param date    스케줄 날짜
     * @param endTime 종료 시각 (null이면 당일 종료 판정 생략, 날짜만 비교)
     * @return 과거이면 true
     */
    public static boolean isScheduleSlotInPast(LocalDate date, LocalTime endTime) {
        if (date == null) {
            return false;
        }
        ZoneId zone = ReservationSmsBusinessHours.ZONE_SEOUL;
        LocalDate today = LocalDate.now(zone);
        if (date.isBefore(today)) {
            return true;
        }
        if (!date.equals(today) || endTime == null) {
            return false;
        }
        return LocalTime.now(zone).isAfter(endTime);
    }

    /**
     * 상태로 슬롯 변경이 잠긴 경우 사용자 메시지, 허용이면 null.
     *
     * <p>원래·이동 후 시각의 과거 여부는 {@link #resolveMoveDenial} 이 판정한다.</p>
     *
     * @param status 변경 전 상태
     * @return 거부 메시지 또는 null
     */
    public static String resolveSlotChangeDenyMessage(ScheduleStatus status) {
        if (status == ScheduleStatus.COMPLETED) {
            return ScheduleServiceUserFacingMessages.MSG_COMPLETED_SLOT_CHANGE_DENIED;
        }
        if (status == ScheduleStatus.CANCELLED) {
            return ScheduleServiceUserFacingMessages.MSG_CANCELLED_SLOT_CHANGE_DENIED;
        }
        return null;
    }

    /**
     * 상태 잠금 후 원래 시작이 과거라면 이동 거부 메시지.
     *
     * <p>목적지 과거는 {@link #resolveMoveDenial} 에 이동 후 시각을 넣어 판정한다.
     * errorCode 가 필요하면 Denial 을 그대로 쓴다.</p>
     *
     * @param status    변경 전 상태
     * @param date      원래 날짜
     * @param startTime 원래 시작 시각
     * @param now       설정 시간대 기준 현재
     * @return 거부 메시지 또는 null
     */
    public static String resolveSlotChangeDenyMessage(
            ScheduleStatus status, LocalDate date, LocalTime startTime, LocalDateTime now) {
        String statusMessage = resolveSlotChangeDenyMessage(status);
        if (statusMessage != null) {
            return statusMessage;
        }
        Denial denial = resolveMoveDenial(toDateTime(date, startTime), null, now);
        return denial != null ? denial.getMessage() : null;
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
     * 이동 거부 사유. 원래 시작이 지났으면 그 사유가 우선하고, 목적지가 과거라면 그다음이다.
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

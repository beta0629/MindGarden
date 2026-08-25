package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;

/**
 * 스케줄 일시(슬롯) 변경 잠금 — 완료·취소·과거 공통 판정.
 *
 * <p>과거 판정은 Asia/Seoul({@link ReservationSmsBusinessHours#ZONE_SEOUL}) 기준:
 * 날짜가 오늘 이전이거나, 당일이면서 종료 시각이 현재보다 이전.</p>
 *
 * @author CoreSolution
 * @since 2026-08-25
 */
public final class ScheduleSlotGuard {

    private ScheduleSlotGuard() {
    }

    /**
     * Asia/Seoul 기준 스케줄 슬롯이 과거인지 여부.
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
     * 슬롯 변경이 잠긴 경우 사용자 메시지, 허용이면 null.
     *
     * @param status  변경 전 상태
     * @param date    변경 전 날짜
     * @param endTime 변경 전 종료 시각
     * @return 거부 메시지 또는 null
     */
    public static String resolveSlotChangeDenyMessage(
            ScheduleStatus status, LocalDate date, LocalTime endTime) {
        if (status == ScheduleStatus.COMPLETED) {
            return ScheduleServiceUserFacingMessages.MSG_COMPLETED_SLOT_CHANGE_DENIED;
        }
        if (status == ScheduleStatus.CANCELLED) {
            return ScheduleServiceUserFacingMessages.MSG_CANCELLED_SLOT_CHANGE_DENIED;
        }
        if (isScheduleSlotInPast(date, endTime)) {
            return ScheduleServiceUserFacingMessages.MSG_PAST_SLOT_CHANGE_DENIED;
        }
        return null;
    }
}

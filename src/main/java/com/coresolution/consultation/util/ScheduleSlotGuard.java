package com.coresolution.consultation.util;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;

/**
 * 스케줄 일시(슬롯) 변경 잠금 — 완료·취소 상태 판정과 슬롯 과거 여부 유틸.
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
     * 상태로 슬롯 변경이 잠긴 경우 사용자 메시지, 허용이면 null.
     *
     * <p>원래·이동 후 시각의 과거 여부는 {@link SchedulePastTimeGate} 가 따로 판정한다.</p>
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
}

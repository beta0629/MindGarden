package com.coresolution.consultation.constant;

import java.util.Set;

/**
 * 예약 알림(인앱·푸시) 발송 직전에 막는 일정·상담 상태.
 *
 * <p>목록 조회 이후 취소·완료·휴가·삭제·일시 이동, 또는 연결 상담 취소가 있으면 보내지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-23
 */
public final class ScheduleNotificationEligibilityCodes {

    /**
     * 일정 상태가 이 집합이면 리마인더·D-1·변경 푸시를 보내지 않는다.
     */
    public static final Set<ScheduleStatus> BLOCKED_SCHEDULE_STATUSES = Set.of(
            ScheduleStatus.CANCELLED,
            ScheduleStatus.COMPLETED,
            ScheduleStatus.VACATION);

    /**
     * 연결 상담 상태가 이 값이면 일정 행이 BOOKED여도 알림을 보내지 않는다.
     */
    public static final String BLOCKED_CONSULTATION_STATUS = ConsultationStatus.CANCELLED;

    private ScheduleNotificationEligibilityCodes() {
    }
}

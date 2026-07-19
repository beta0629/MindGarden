package com.coresolution.consultation.constant;

/**
 * {@code schedule_change_notification_pending.status} 값 SSOT.
 *
 * @author MindGarden
 * @since 2026-07-19
 */
public final class ScheduleChangeNotificationPendingStatus {

    /** 발송 대기 (fire_at 미도달 또는 미처리). */
    public static final String PENDING = "PENDING";

    /** 외부 채널 발송 완료. */
    public static final String SENT = "SENT";

    /** 스케줄이 CANCELLED 되어 발송 생략. */
    public static final String SKIPPED_CANCELLED = "SKIPPED_CANCELLED";

    /** 동일 scheduleId+slotVersion 이미 발송되어 생략. */
    public static final String SKIPPED_DUPLICATE = "SKIPPED_DUPLICATE";

    private ScheduleChangeNotificationPendingStatus() {
    }
}

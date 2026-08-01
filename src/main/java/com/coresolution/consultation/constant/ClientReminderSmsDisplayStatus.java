package com.coresolution.consultation.constant;

/**
 * 통합 스케줄 내담자 예약 문자 배지 표시 상태 SSOT.
 *
 * <p>UI 노출은 {@link #SENT}/{@link #PENDING}/{@link #FAILED} 만.
 * N/A·SKIPPED 는 DTO null(숨김).</p>
 *
 * @author MindGarden
 * @since 2026-08-01
 */
public final class ClientReminderSmsDisplayStatus {

    public static final String SENT = "SENT";

    public static final String PENDING = "PENDING";

    public static final String FAILED = "FAILED";

    /** 발송 로그 channel_used — 결과 미확정(대기). */
    public static final String CHANNEL_PENDING = "PENDING";

    private ClientReminderSmsDisplayStatus() {
    }
}

package com.coresolution.consultation.constant;

/**
 * 상담 예약 리마인드 푸시(D-N) 정책 상수.
 *
 * <p>2026-06-17 정책: D-2 푸시 미발송, D-1 푸시만 내담자·상담사 양쪽 fanout.
 * SMS/알림톡 D-2 배치({@code RESERVATION_REMINDER_D2})와 분리 — 본 상수는 푸시 전용.
 *
 * @author MindGarden
 * @since 2026-06-17
 */
public final class BookingReminderPushConstants {

    private BookingReminderPushConstants() {
    }

    /** D-1 리마인드: 상담일 기준 하루 전 09:00 KST 배치 대상 일수. */
    public static final int REMINDER_D1_DAYS_AHEAD = 1;

    /** D-1 dedupe 슬롯 코드 — {@link com.coresolution.consultation.service.MobilePushDispatchService#dispatchBookingReminder}. */
    public static final String REMINDER_D1_SLOT_CODE = "D1";

    /**
     * D-1 푸시 본문 리드(임시).
     * TODO(D10): 디자이너 카피 확정 시 {@link com.coresolution.consultation.util.MobilePushMessageFormatter} 로 이관.
     */
    public static final String REMINDER_D1_BODY_LEAD = "내일 상담 예약이 있습니다.";

    /** D-2 푸시 — 2026-06-17 정책으로 발송하지 않음 (SMS D-2 배치와 무관). */
    public static final int REMINDER_D2_DAYS_AHEAD = 2;

    /** @deprecated D-2 푸시 미사용. dedupe·회귀 테스트 참조용으로만 유지. */
    @Deprecated
    public static final String REMINDER_D2_SLOT_CODE = "D2";
}

package com.coresolution.consultation.constant;

/**
 * Expo 앱 {@code pushScenarios.ts} 및 기획서 3.7절과 동일한 canonical 푸시 type 문자열.
 *
 * @author MindGarden
 * @since 2026-05-16
 */
public final class MobilePushCanonicalTypes {

    private MobilePushCanonicalTypes() {
    }

    public static final String BOOKING_REMINDER = "booking_reminder";
    public static final String BOOKING_CONFIRMED = "booking_confirmed";
    public static final String BOOKING_CANCELLED = "booking_cancelled";
    public static final String PAYMENT_COMPLETED = "payment_completed";
    public static final String PAYMENT_FAILED = "payment_failed";
    public static final String SESSION_LOW = "session_low";
}

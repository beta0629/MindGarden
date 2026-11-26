package com.coresolution.consultation.constant;

/**
 * {@code client_event} 실시간 쓰기 훅용 상수 (idempotency·JSON 키·통화).
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public final class ClientEventWriteConstants {

    public static final String CURRENCY_KRW = "KRW";

    public static final String JSON_KEY_STATUS = "status";
    public static final String JSON_KEY_DATE = "date";
    public static final String JSON_KEY_START_TIME = "startTime";
    public static final String JSON_KEY_END_TIME = "endTime";
    public static final String JSON_KEY_TOTAL_SESSIONS = "totalSessions";
    public static final String JSON_KEY_USED_SESSIONS = "usedSessions";
    public static final String JSON_KEY_REMAINING_SESSIONS = "remainingSessions";
    public static final String JSON_KEY_PAYMENT_STATUS = "paymentStatus";
    public static final String JSON_KEY_ORIGIN_MAPPING_ID = "originMappingId";
    public static final String JSON_KEY_TARGET_MAPPING_ID = "targetMappingId";
    public static final String JSON_KEY_ORIGIN = "origin";
    public static final String JSON_KEY_TARGET = "target";
    public static final String JSON_KEY_AMOUNT = "amount";
    public static final String JSON_KEY_PAYMENT_STATUS_CODE = "paymentStatus";

    public static final String IDEMPOTENCY_SESSION_DEDUCTED_SCHEDULE_PREFIX =
            "SESSION_DEDUCTED:schedule:";
    public static final String IDEMPOTENCY_SESSION_RESTORED_SCHEDULE_PREFIX =
            "SESSION_RESTORED:schedule:";
    public static final String IDEMPOTENCY_PAYMENT_COMPLETED_PREFIX = "PAYMENT_COMPLETED:payment:";
    public static final String IDEMPOTENCY_PAYMENT_CANCELLED_PREFIX = "PAYMENT_CANCELLED:payment:";
    public static final String IDEMPOTENCY_PAYMENT_REFUNDED_PREFIX = "PAYMENT_REFUNDED:payment:";
    public static final String IDEMPOTENCY_MAPPING_REASSIGNED_SCHEDULE_PREFIX =
            "MAPPING_REASSIGNED:schedule:";

    private ClientEventWriteConstants() {
    }
}

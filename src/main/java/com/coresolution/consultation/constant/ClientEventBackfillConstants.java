package com.coresolution.consultation.constant;

/**
 * {@code client_event} 백필용 상수 (idempotency 키·모드·JSON 키·경로).
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public final class ClientEventBackfillConstants {

    public static final String MODE_DRY_RUN = "dry-run";
    public static final String MODE_APPLY = "apply";

    public static final String PROFILE_DEV = "dev";
    public static final String PROFILE_PROD = "prod";
    public static final String PROFILE_PRODUCTION = "production";

    public static final String API_PATH = "/api/v1/admin/client-events/backfill";

    /**
     * Actions SSH 백필용 공유 시크릿 헤더명.
     * 값은 {@link #BACKFILL_TOKEN_ENV} 환경 변수와 constant-time 비교한다.
     */
    public static final String BACKFILL_TOKEN_HEADER = "X-Client-Event-Backfill-Token";

    /**
     * 공유 시크릿 env 키 ({@code /etc/mindgarden/dev.env}).
     * 비어 있으면 시크릿 경로 인증 불가 — ADMIN 세션만 허용.
     */
    public static final String BACKFILL_TOKEN_ENV = "CLIENT_EVENT_BACKFILL_TOKEN";

    public static final String IDEMPOTENCY_PREFIX = "BACKFILL:";

    public static final String JSON_KEY_USED_SESSIONS = "usedSessions";
    public static final String JSON_KEY_REMAINING_SESSIONS = "remainingSessions";
    public static final String JSON_KEY_TOTAL_SESSIONS = "totalSessions";

    public static final int PAYMENT_PAGE_SIZE = 200;

    public static final String WORKFLOW_REF_RELEASE_DEV = "refs/heads/release/dev";

    private ClientEventBackfillConstants() {
    }

    /**
     * 배정 생성 백필 멱등 키.
     *
     * @param tenantId 테넌트
     * @param mappingId 배정 ID
     * @return idempotency_key
     */
    public static String idempotencyMappingCreated(String tenantId, Long mappingId) {
        return IDEMPOTENCY_PREFIX + ClientEventType.MAPPING_CREATED.getCode()
                + ":" + tenantId + ":" + mappingId;
    }

    /**
     * 결제 완료 백필 멱등 키.
     *
     * @param tenantId 테넌트
     * @param paymentId payments.id
     * @return idempotency_key
     */
    public static String idempotencyPaymentCompleted(String tenantId, Long paymentId) {
        return IDEMPOTENCY_PREFIX + ClientEventType.PAYMENT_COMPLETED.getCode()
                + ":" + tenantId + ":" + paymentId;
    }

    /**
     * 결제 취소 백필 멱등 키.
     *
     * @param tenantId 테넌트
     * @param paymentId payments.id
     * @return idempotency_key
     */
    public static String idempotencyPaymentCancelled(String tenantId, Long paymentId) {
        return IDEMPOTENCY_PREFIX + ClientEventType.PAYMENT_CANCELLED.getCode()
                + ":" + tenantId + ":" + paymentId;
    }

    /**
     * 결제 환불 백필 멱등 키.
     *
     * @param tenantId 테넌트
     * @param paymentId payments.id
     * @return idempotency_key
     */
    public static String idempotencyPaymentRefunded(String tenantId, Long paymentId) {
        return IDEMPOTENCY_PREFIX + ClientEventType.PAYMENT_REFUNDED.getCode()
                + ":" + tenantId + ":" + paymentId;
    }

    /**
     * 일정·가예약 백필 멱등 키 (이벤트 타입별).
     *
     * @param tenantId 테넌트
     * @param eventType 이벤트 타입
     * @param scheduleId schedules.id
     * @return idempotency_key
     */
    public static String idempotencySchedule(
            String tenantId, ClientEventType eventType, Long scheduleId) {
        return IDEMPOTENCY_PREFIX + eventType.getCode() + ":" + tenantId + ":" + scheduleId;
    }

    /**
     * 매핑 이력(ccmh) 백필 멱등 키.
     *
     * @param tenantId 테넌트
     * @param eventType 변환된 ClientEventType
     * @param historyId consultant_client_mapping_history.id
     * @return idempotency_key
     */
    public static String idempotencyHistory(
            String tenantId, ClientEventType eventType, Long historyId) {
        return IDEMPOTENCY_PREFIX + eventType.getCode()
                + ":" + tenantId + ":ccmh:" + historyId;
    }
}

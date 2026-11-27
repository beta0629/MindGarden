package com.coresolution.consultation.constant;

/**
 * {@code client_event} 백필용 상수 (모드·경로·CLI 프로퍼티·JSON 키).
 *
 * <p>멱등 키는 {@link ClientEventIdempotencyKeys} 를 사용한다.
 * {@link #IDEMPOTENCY_PREFIX} 는 레거시 행 롤백 매칭 전용이다.</p>
 *
 * @author MindGarden
 * @since 2026-11-26
 */
public final class ClientEventBackfillConstants {

    public static final String MODE_DRY_RUN = "dry-run";
    public static final String MODE_APPLY = "apply";
    public static final String MODE_ROLLBACK = "rollback";

    public static final String PROFILE_DEV = "dev";
    public static final String PROFILE_PROD = "prod";
    public static final String PROFILE_PRODUCTION = "production";

    /**
     * .dev HTTP 백필 경로 — {@code @Profile("dev")} 전용. 운영 노출 없음.
     * 운영 백필은 서버 로컬 CLI 만 사용한다.
     */
    public static final String API_PATH = "/api/v1/admin/client-events/backfill";

    /**
     * Actions SSH 백필용 공유 시크릿 헤더명 (.dev HTTP 전용).
     * 값은 {@link #BACKFILL_TOKEN_ENV} 환경 변수와 constant-time 비교한다.
     */
    public static final String BACKFILL_TOKEN_HEADER = "X-Client-Event-Backfill-Token";

    /**
     * 공유 시크릿 env 키 ({@code /etc/mindgarden/dev.env}).
     * 비어 있으면 시크릿 경로 인증 불가 — OPS 세션/JWT 만 허용.
     */
    public static final String BACKFILL_TOKEN_ENV = "CLIENT_EVENT_BACKFILL_TOKEN";

    /**
     * 레거시 백필 멱등 접두 — 롤백 시 과거 {@code BACKFILL:} 행 정리용.
     * 신규 기록에는 사용하지 않는다({@link ClientEventIdempotencyKeys}).
     */
    public static final String IDEMPOTENCY_PREFIX =
            ClientEventIdempotencyKeys.LEGACY_BACKFILL_PREFIX;

    public static final String JSON_KEY_USED_SESSIONS = "usedSessions";
    public static final String JSON_KEY_REMAINING_SESSIONS = "remainingSessions";
    public static final String JSON_KEY_TOTAL_SESSIONS = "totalSessions";

    public static final int PAYMENT_PAGE_SIZE = 200;

    public static final String WORKFLOW_REF_RELEASE_DEV = "refs/heads/release/dev";

    public static final String PROP_PREFIX = "client-event.backfill";
    public static final String PROP_CLI_ENABLED = PROP_PREFIX + ".cli.enabled";
    public static final String PROP_MODE = PROP_PREFIX + ".mode";
    public static final String PROP_TENANT_ID = PROP_PREFIX + ".tenant-id";
    public static final String PROP_CONFIRM = PROP_PREFIX + ".confirm";
    public static final String PROP_ZONE = PROP_PREFIX + ".zone";
    public static final String PROP_BLOCKED_HOUR_START = PROP_PREFIX + ".blocked-hour-start";
    public static final String PROP_BLOCKED_HOUR_END = PROP_PREFIX + ".blocked-hour-end";

    public static final String CONFIRM_APPLY = "APPLY";
    public static final String CONFIRM_ROLLBACK = "ROLLBACK";

    public static final String DEFAULT_ZONE = "Asia/Seoul";
    public static final int DEFAULT_BLOCKED_HOUR_START = 11;
    public static final int DEFAULT_BLOCKED_HOUR_END = 20;

    private ClientEventBackfillConstants() {
    }

    /**
     * 배정 생성 멱등 키 (훅·백필 공통).
     *
     * @param tenantId 테넌트
     * @param mappingId 배정 ID
     * @return idempotency_key
     */
    public static String idempotencyMappingCreated(String tenantId, Long mappingId) {
        return ClientEventIdempotencyKeys.forMapping(
                ClientEventType.MAPPING_CREATED, tenantId, mappingId);
    }

    /**
     * 결제 완료 멱등 키.
     *
     * @param tenantId 테넌트
     * @param paymentId payments.id
     * @return idempotency_key
     */
    public static String idempotencyPaymentCompleted(String tenantId, Long paymentId) {
        return ClientEventIdempotencyKeys.forPayment(
                ClientEventType.PAYMENT_COMPLETED, tenantId, paymentId);
    }

    /**
     * 결제 취소 멱등 키.
     *
     * @param tenantId 테넌트
     * @param paymentId payments.id
     * @return idempotency_key
     */
    public static String idempotencyPaymentCancelled(String tenantId, Long paymentId) {
        return ClientEventIdempotencyKeys.forPayment(
                ClientEventType.PAYMENT_CANCELLED, tenantId, paymentId);
    }

    /**
     * 결제 환불 멱등 키.
     *
     * @param tenantId 테넌트
     * @param paymentId payments.id
     * @return idempotency_key
     */
    public static String idempotencyPaymentRefunded(String tenantId, Long paymentId) {
        return ClientEventIdempotencyKeys.forPayment(
                ClientEventType.PAYMENT_REFUNDED, tenantId, paymentId);
    }

    /**
     * 일정·가예약 멱등 키 (이벤트 타입별).
     *
     * @param tenantId 테넌트
     * @param eventType 이벤트 타입
     * @param scheduleId schedules.id
     * @return idempotency_key
     */
    public static String idempotencySchedule(
            String tenantId, ClientEventType eventType, Long scheduleId) {
        return ClientEventIdempotencyKeys.forSchedule(eventType, tenantId, scheduleId);
    }

    /**
     * 매핑 이력(ccmh) 멱등 키 — schedule 없을 때만.
     *
     * @param tenantId 테넌트
     * @param eventType 변환된 ClientEventType
     * @param historyId consultant_client_mapping_history.id
     * @return idempotency_key
     */
    public static String idempotencyHistory(
            String tenantId, ClientEventType eventType, Long historyId) {
        return ClientEventIdempotencyKeys.forCcmh(eventType, tenantId, historyId);
    }
}

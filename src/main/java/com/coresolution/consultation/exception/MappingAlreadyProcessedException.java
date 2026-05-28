package com.coresolution.consultation.exception;

/**
 * 옵션 B (예약 우선 매칭) 당일 카드 결제 멱등성 가드 예외.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/OPTION_B_RESERVATION_FIRST_PLAN_V2.md} §4·§6 Q11.
 * {@code AdminServiceImpl.checkoutSameDayCard} 진입 시 다음 두 조건 중 하나에 해당하면 발생한다.</p>
 *
 * <ul>
 *   <li>매칭 status 가 {@code PENDING_PAYMENT} 가 아닌 경우 (이미 ACTIVE/TERMINATED/SESSIONS_EXHAUSTED 등)</li>
 *   <li>동일한 클라이언트 요청 ID(Idempotency Key, {@code X-Request-Id} 헤더)가 5분 윈도우 내 재사용된 경우</li>
 * </ul>
 *
 * <p>{@link com.coresolution.consultation.exception.GlobalExceptionHandler} 가 본 예외를 HTTP 409 Conflict
 * 응답으로 매핑하며, 프론트({@code CheckoutSameDayModal}) 는 사용자에게
 * "이미 처리 중입니다. 새 매칭 카드로 확인하세요." 토스트를 표시한다 (Q6 합의 카피).</p>
 *
 * <p>v2.0 합의서 §6 Q11 권장에 따라 {@link IllegalStateException} 을 상속하여 기존 핫픽스 (옵션 B v1.0)
 * 의 {@code paymentStatus == APPROVED} 가드 회귀 테스트를 보존한다. Spring 의 {@code @ExceptionHandler} 는
 * 예외 클래스 계층에서 가장 구체적인 핸들러를 우선하므로 본 예외는 HTTP 409 로 응답된다.</p>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
public class MappingAlreadyProcessedException extends IllegalStateException {

    private static final long serialVersionUID = 1L;

    /**
     * 멱등성 가드 발동 사유 분류.
     */
    public enum Reason {
        /** 매칭 status 가 {@code PENDING_PAYMENT} 가 아님 (이미 ACTIVE/TERMINATED 등). */
        STATUS_NOT_PENDING_PAYMENT,
        /** 동일 클라이언트 요청 ID 재사용 (Idempotency Key 충돌). */
        DUPLICATE_REQUEST_ID
    }

    private final Long mappingId;
    private final String requestId;
    private final Reason reason;

    /**
     * 매칭 status 가드 발동 (요청 ID 충돌이 아닌 일반 경로).
     *
     * @param mappingId 대상 매핑 ID
     * @param message 사용자 친화적 메시지 (토스트 등에 노출)
     */
    public MappingAlreadyProcessedException(Long mappingId, String message) {
        this(mappingId, null, Reason.STATUS_NOT_PENDING_PAYMENT, message);
    }

    /**
     * 분류·요청 ID 정보를 포함한 전체 생성자.
     *
     * @param mappingId 대상 매핑 ID
     * @param requestId 클라이언트 요청 ID (Idempotency Key, 없을 수 있음)
     * @param reason 가드 발동 사유 분류
     * @param message 사용자 친화적 메시지
     */
    public MappingAlreadyProcessedException(Long mappingId, String requestId, Reason reason, String message) {
        super(message);
        this.mappingId = mappingId;
        this.requestId = requestId;
        this.reason = reason;
    }

    public Long getMappingId() {
        return mappingId;
    }

    public String getRequestId() {
        return requestId;
    }

    public Reason getReason() {
        return reason;
    }
}

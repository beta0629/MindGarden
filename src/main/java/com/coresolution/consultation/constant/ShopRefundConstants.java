package com.coresolution.consultation.constant;

/**
 * 어드민 쇼핑 주문 환불 상수.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public final class ShopRefundConstants {

    /** 현금 결제 없음 — PG 환불 대상 아님 */
    public static final String PG_REFUND_STATUS_NOT_APPLICABLE = "NOT_APPLICABLE";

    /** PG·내부 결제 레코드 환불 완료 */
    public static final String PG_REFUND_STATUS_COMPLETED = "COMPLETED";

    /**
     * @deprecated stub 전용. {@link #PG_REFUND_STATUS_COMPLETED} 사용.
     */
    @Deprecated
    public static final String PG_REFUND_STATUS_STUB = "STUB_PENDING";

    /** 어드민 전액 환불 — 고객 요청 */
    public static final String REASON_CUSTOMER_REQUEST = "CUSTOMER_REQUEST";

    /** 어드민 전액 환불 — 운영 오류 */
    public static final String REASON_ADMIN_ERROR = "ADMIN_ERROR";

    /** 어드민 전액 환불 — 이행 전 취소 */
    public static final String REASON_PRE_FULFILLMENT = "PRE_FULFILLMENT";

    /** PortOne V2 cancel 사유 미지정 시 기본값 */
    public static final String DEFAULT_PORTONE_CANCEL_REASON = "Shop admin full refund";

    /**
     * PG(PortOne) 취소 후 Clinic 체인(회기 원복·ERP·주문 REFUNDED) 미완료.
     * 부분 성공 UI 금지 — 재시도·reconcile-refund 로 정합.
     */
    public static final String ERROR_CODE_CLINIC_INCOMPLETE = "SHOP_REFUND_CLINIC_INCOMPLETE";

    /** 환불 경로 DataIntegrityViolation 전용 코드 (이메일 오매핑 금지). */
    public static final String ERROR_CODE_DATA_INTEGRITY = "SHOP_REFUND_DATA_INTEGRITY";

    /**
     * PG 단계 이후 Clinic(회기/ERP/REFUNDED) 미완료.
     * 인자: orderPublicId
     */
    public static final String MSG_PG_CANCELLED_CLINIC_INCOMPLETE_FMT =
            "환불 Clinic 체인(회기 원복·ERP 환불·주문 REFUNDED)이 완료되지 않았습니다"
                    + "(orderPublicId=%s). PG가 이미 취소됐다면 동일 환불 재시도 또는 reconcile-refund로 Clinic을 맞추세요.";

    /** 환불 API 경로의 DB unique/duplicate — 이메일 문구 사용 금지. */
    public static final String MSG_REFUND_DATA_INTEGRITY =
            "환불 처리 중 데이터 중복 제약을 위반했습니다. "
                    + "PG 취소 후라면 환불 재시도 또는 reconcile-refund로 Clinic을 맞추세요.";

    /** 비이메일 unique/duplicate 기본 클라이언트 메시지. */
    public static final String MSG_DATA_DUPLICATE_CONSTRAINT =
            "데이터 중복 제약 위반입니다.";

    /** 이메일 tenant unique ({@code uk_users_email_tenant}) 전용. */
    public static final String MSG_EMAIL_ALREADY_REGISTERED = "이미 등록된 이메일입니다.";

    /** PG 취소 성공 증거 없음 — fail-closed 전환 차단. */
    public static final String ERROR_CODE_PG_CANCEL_NO_EVIDENCE = "SHOP_REFUND_PG_CANCEL_NO_EVIDENCE";

    /** 비-IAMPORT 결제에 PaymentGatewayService 미주입 — fail-closed 차단. */
    public static final String ERROR_CODE_PG_GATEWAY_UNAVAILABLE = "SHOP_REFUND_PG_GATEWAY_UNAVAILABLE";

    /** PortOne 취소 API 호출 실패 (PG 측 거부·타임아웃). */
    public static final String ERROR_CODE_PG_CANCEL_FAILED = "SHOP_REFUND_PG_CANCEL_FAILED";

    /** PortOne 취소 후 상태 검증 실패 메시지 포맷. 인자: paymentId */
    public static final String MSG_PG_CANCEL_NO_EVIDENCE_FMT =
            "PG 취소 증거 없음(fail-closed): paymentId=%s. "
                    + "PortOne 상태가 CANCELLED/PARTIAL_CANCELLED가 아닙니다.";

    /** PaymentGatewayService 미주입 시 메시지. 인자: paymentId */
    public static final String MSG_PG_GATEWAY_UNAVAILABLE_FMT =
            "PaymentGatewayService 미주입으로 PG 환불 불가(fail-closed): paymentId=%s.";

    /**
     * 쇼핑 주문 부분 환불 금지(fail-closed). Payment/주문 상태 변경 전에 차단.
     * 인자: refundAmount, paymentAmount
     */
    public static final String MSG_SHOP_PARTIAL_REFUND_NOT_ALLOWED_FMT =
            "쇼핑 주문은 전액 환불만 허용됩니다(fail-closed): refundAmount=%s, paymentAmount=%s.";

    /**
     * 매핑 측 부분 환불·PG 기취소로 결제액 전액이 이미 환불됨 — PG 호출 없이 거부.
     * 인자: orderPublicId, 결제액, 매핑 측 기환불액, PG 기취소액
     */
    public static final String MSG_REFUND_AMOUNT_EXHAUSTED_FMT =
            "환불 가능 금액이 없습니다(orderPublicId=%s): 결제액 %,d원, 매핑 부분 환불 %,d원, PG 기취소 %,d원.";

    /** 같은 주문의 PG 환불이 진행 중이거나 자동 재시도할 수 없음 (409) */
    public static final String ERROR_CODE_REFUND_IN_PROGRESS = "SHOP_REFUND_IN_PROGRESS";

    /**
     * 같은 주문의 PG 환불 진행 중 — PG 취소를 다시 부르지 않는다.
     * 인자: orderPublicId
     */
    public static final String MSG_REFUND_IN_PROGRESS_FMT =
            "같은 주문의 환불이 진행 중입니다(orderPublicId=%s). 잠시 후 주문 상태를 확인해 주세요.";

    /**
     * PortOne 이 아닌 결제는 PG 취소 요청 이력이 있으면 자동 재시도하지 않는다(이중 환불 방지).
     * 인자: orderPublicId
     */
    public static final String MSG_REFUND_PG_RETRY_MANUAL_CHECK_FMT =
            "이전 PG 환불 요청 결과를 확인할 수 없어 자동 재시도를 막았습니다(orderPublicId=%s). "
                    + "PG 관리 화면에서 취소 여부를 확인한 뒤 환불 정합(reconcile-refund)으로 처리해 주세요.";

    /**
     * 어드민 환불 PortOne 취소 멱등 키. 같은 PG 상태(기취소 누적액)에서 같은 금액을 취소하는 재요청은 같은 키가 된다.
     * 인자: paymentId, PG 기취소 누적액, 이번 취소액
     */
    public static final String PORTONE_CANCEL_IDEMPOTENCY_KEY_FMT = "mg-shop-refund-%s-c%d-a%d";

    /** 어드민 전액 환불 PG 취소 임대 시간 기본값(ms) — {@code shop.admin-refund.pg-lease-ms} 미설정 시 */
    public static final long DEFAULT_ADMIN_REFUND_PG_LEASE_MS = 120_000L;

    private ShopRefundConstants() {
        throw new UnsupportedOperationException("utility");
    }
}

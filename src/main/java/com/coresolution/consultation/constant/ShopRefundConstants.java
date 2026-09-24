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

    private ShopRefundConstants() {
        throw new UnsupportedOperationException("utility");
    }
}

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

    private ShopRefundConstants() {
        throw new UnsupportedOperationException("utility");
    }
}

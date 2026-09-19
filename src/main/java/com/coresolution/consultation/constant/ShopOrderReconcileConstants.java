package com.coresolution.consultation.constant;

/**
 * 어드민 쇼핑 주문 PortOne 결제 정합(reconcile) 메시지·한도 상수.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
public final class ShopOrderReconcileConstants {

    /** PortOne paymentId 최대 길이 */
    public static final int PAYMENT_ID_MAX_LENGTH = 128;

    /** 카드 승인번호 최대 길이 */
    public static final int CARD_APPROVAL_NUMBER_MAX_LENGTH = 64;

    public static final String MSG_TENANT_REQUIRED = "테넌트 정보가 없습니다.";

    public static final String MSG_ORDER_PUBLIC_ID_REQUIRED = "주문 공개 ID가 필요합니다.";

    public static final String MSG_PAYMENT_ID_OR_APPROVAL_REQUIRED =
            "포트원 결제 ID 또는 카드 승인번호가 필요합니다.";

    public static final String MSG_APPROVAL_LOOKUP_FAILED =
            "승인번호로 PortOne 결제 조회에 실패했습니다.";

    public static final String MSG_APPROVAL_LOOKUP_AMBIGUOUS =
            "승인번호로 조회된 PortOne 결제가 여러 건입니다.";

    public static final String MSG_ORDER_NOT_FOUND = "주문을 찾을 수 없습니다.";

    public static final String MSG_ORDER_CANCELLED = "취소된 주문은 결제 정합을 할 수 없습니다.";

    public static final String MSG_ORDER_REFUNDED = "환불된 주문은 결제 정합을 할 수 없습니다.";

    public static final String MSG_ORDER_STATUS_NOT_ALLOWED = "결제 정합을 할 수 없는 주문 상태입니다.";

    public static final String MSG_CASH_DUE_REQUIRED = "현금 결제 금액이 없는 주문은 결제 정합을 할 수 없습니다.";

    public static final String MSG_PORTONE_VERIFY_FAILED =
            "포트원 결제 검증 실패(미승인·금액 불일치·조회 실패)";

    public static final String MSG_PAYMENT_ORDER_MISMATCH =
            "해당 결제 ID가 다른 주문에 연결되어 있습니다.";

    public static final String MSG_PAYMENT_PROVIDER_NOT_IAMPORT =
            "쇼핑 결제 정합은 포트원(IAMPORT) 결제만 지원합니다.";

    public static final String PAYMENT_DESCRIPTION_PREFIX = "Shop admin reconcile ";

    /**
     * PortOne 은 이미 취소됐으나 Clinic Payment 가 APPROVED 로 남은 경우 —
     * {@code POST .../reconcile-refund} 로 PG cancel 없이 clinic chain 을 맞춘다.
     */
    public static final String MSG_PORTONE_NOT_CANCELLED =
            "포트원 결제가 취소(CANCELLED/PARTIAL_CANCELLED) 상태가 아닙니다.";

    /** reconcile-refund — 승인·환불 대상 결제 없음 */
    public static final String MSG_RECONCILE_REFUND_PAYMENT_NOT_FOUND =
            "환불 정합 대상 결제(APPROVED/REFUNDED/CANCELLED)를 찾을 수 없습니다.";

    /** reconcile-refund — PAID/REFUNDED 외 주문 상태 */
    public static final String MSG_RECONCILE_REFUND_ORDER_STATUS_NOT_ALLOWED =
            "환불 정합은 PAID 또는 이미 REFUNDED 인 주문만 가능합니다.";

    /** reconcile-refund 사유 (내부 Payment.failureReason) */
    public static final String RECONCILE_REFUND_REASON =
            "Shop admin reconcile-refund (PortOne already cancelled)";

    private ShopOrderReconcileConstants() {
        throw new UnsupportedOperationException("utility");
    }
}

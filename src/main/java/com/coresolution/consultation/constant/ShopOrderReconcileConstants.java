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

    public static final String MSG_TENANT_REQUIRED = "테넌트 정보가 없습니다.";

    public static final String MSG_ORDER_PUBLIC_ID_REQUIRED = "주문 공개 ID가 필요합니다.";

    public static final String MSG_PAYMENT_ID_REQUIRED = "포트원 결제 ID가 필요합니다.";

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

    private ShopOrderReconcileConstants() {
        throw new UnsupportedOperationException("utility");
    }
}

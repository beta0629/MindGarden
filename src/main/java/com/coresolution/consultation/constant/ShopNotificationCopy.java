package com.coresolution.consultation.constant;

/**
 * 쇼핑몰·리워드 알림 카피(인앱·푸시). {@link MobilePushCanonicalTypes} shop_* type과 정합.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public final class ShopNotificationCopy {

    private ShopNotificationCopy() {
    }

    public static final String MESSAGE_TYPE_PAYMENT = "PAYMENT_COMPLETION";
    public static final String MESSAGE_TYPE_GENERAL = "GENERAL";

    public static final String PUSH_TITLE_ORDER_PAID = "주문 결제 완료";
    public static final String PUSH_TITLE_PAYMENT_FAILED = "주문 결제 실패";
    public static final String PUSH_TITLE_POINT_EARNED = "포인트 적립";
    public static final String PUSH_TITLE_HOLD_EXPIRED = "주문 만료";
    public static final String PUSH_TITLE_REFUNDED = "주문 환불";
    public static final String PUSH_TITLE_FULFILLMENT = "주문 처리 완료";

    public static final String INAPP_TITLE_ORDER_PAID = "주문 결제 완료";
    public static final String INAPP_TITLE_PAYMENT_FAILED = "주문 결제 실패";
    public static final String INAPP_TITLE_POINT_EARNED = "포인트 적립";
    public static final String INAPP_TITLE_HOLD_EXPIRED = "주문 만료";
    public static final String INAPP_TITLE_REFUNDED = "주문 환불";
    public static final String INAPP_TITLE_FULFILLMENT = "주문 처리 완료";

    public static final String INAPP_BODY_ORDER_PAID_FMT =
            "주문이 결제되었습니다.\n주문번호: %s\n결제금액: %s원";
    public static final String INAPP_BODY_PAYMENT_FAILED_FMT =
            "주문 결제에 실패했습니다.\n주문번호: %s\n다시 결제해 주세요.";
    public static final String INAPP_BODY_POINT_EARNED_FMT =
            "구매 적립 포인트 %sP가 지급되었습니다.\n주문번호: %s";
    public static final String INAPP_BODY_HOLD_EXPIRED_FMT =
            "결제 대기 시간이 지나 주문이 만료되었습니다.\n주문번호: %s";
    public static final String INAPP_BODY_REFUNDED_FMT =
            "주문이 전액 환불되었습니다.\n주문번호: %s";
    public static final String INAPP_BODY_FULFILLMENT_CLIENT_FMT =
            "상담 패키지 주문 처리가 완료되었습니다.\n주문번호: %s";
    public static final String INAPP_BODY_FULFILLMENT_CONSULTANT_FMT =
            "내담자 상담 패키지 주문이 처리되었습니다.\n주문번호: %s";

    public static final String FALLBACK_ORDER_LABEL = "주문";
}

package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;

/**
 * 취소·만료로 닫힌 쇼핑 주문에 결제 승인이 들어왔을 때 승인을 거부한다.
 * 호출측은 트랜잭션 밖에서 {@code ShopLatePaymentRefundService} 로 PG 자동 취소를 진행한다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public class ShopOrderClosedForPaymentException extends IllegalStateException {

    private final String orderPublicId;
    private final ShopClientOrderStatus orderStatus;

    /**
     * @param orderPublicId 주문 공개 ID
     * @param orderStatus   닫힌 주문 상태
     */
    public ShopOrderClosedForPaymentException(String orderPublicId, ShopClientOrderStatus orderStatus) {
        this(ShopLatePaymentConstants.MSG_ORDER_CLOSED_FOR_PAYMENT_FMT, orderPublicId, orderStatus);
    }

    /**
     * @param messageFormat 메시지 포맷 (orderPublicId, orderStatus)
     * @param orderPublicId 주문 공개 ID
     * @param orderStatus   승인을 거부한 시점의 주문 상태
     */
    protected ShopOrderClosedForPaymentException(
            String messageFormat, String orderPublicId, ShopClientOrderStatus orderStatus) {
        this(orderPublicId, orderStatus, String.format(messageFormat, orderPublicId, orderStatus));
    }

    /**
     * @param orderPublicId 주문 공개 ID
     * @param orderStatus   승인을 거부한 시점의 주문 상태
     * @param message       완성된 예외 메시지
     */
    protected ShopOrderClosedForPaymentException(
            String orderPublicId, ShopClientOrderStatus orderStatus, String message) {
        super(message);
        this.orderPublicId = orderPublicId;
        this.orderStatus = orderStatus;
    }

    public String getOrderPublicId() {
        return orderPublicId;
    }

    public ShopClientOrderStatus getOrderStatus() {
        return orderStatus;
    }
}

package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;

/**
 * 이미 다른 결제로 PAID 인 쇼핑 주문에 또 다른 결제 승인이 들어왔을 때(이중 결제) 승인을 거부한다.
 * 늦은 결제와 같은 경로로 처리되도록 {@link ShopOrderClosedForPaymentException} 을 상속하며,
 * 호출측은 트랜잭션 밖에서 {@code ShopLatePaymentRefundService} 로 PG 자동 취소를 진행한다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public class ShopDuplicatePaymentException extends ShopOrderClosedForPaymentException {

    /**
     * @param orderPublicId 주문 공개 ID
     * @param orderStatus   주문 상태 (PAID)
     */
    public ShopDuplicatePaymentException(String orderPublicId, ShopClientOrderStatus orderStatus) {
        super(ShopLatePaymentConstants.MSG_DUPLICATE_PAYMENT_ON_PAID_ORDER_FMT, orderPublicId, orderStatus);
    }
}

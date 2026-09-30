package com.coresolution.consultation.exception;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.entity.Payment;

/**
 * 주문은 열려 있으나 결제 건이 승인할 수 없는 상태(취소·환불·환불 필요, 또는 만료 + 금액 불일치)일 때 승인을 거부한다.
 * 늦은 결제와 같은 경로로 처리되도록 {@link ShopOrderClosedForPaymentException} 을 상속하며,
 * 호출측은 트랜잭션 밖에서 {@code ShopLatePaymentRefundService} 로 PG 자동 취소를 진행한다.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public class ShopPaymentNotApprovableException extends ShopOrderClosedForPaymentException {

    /**
     * @param paymentId     결제 ID
     * @param paymentStatus 결제 건 상태
     * @param orderPublicId 주문 공개 ID
     * @param orderStatus   주문 상태 (열림)
     */
    public ShopPaymentNotApprovableException(
            String paymentId,
            Payment.PaymentStatus paymentStatus,
            String orderPublicId,
            ShopClientOrderStatus orderStatus) {
        super(orderPublicId, orderStatus, String.format(
                ShopLatePaymentConstants.MSG_PAYMENT_NOT_APPROVABLE_ON_OPEN_ORDER_FMT,
                paymentId, paymentStatus, orderPublicId, orderStatus));
    }
}

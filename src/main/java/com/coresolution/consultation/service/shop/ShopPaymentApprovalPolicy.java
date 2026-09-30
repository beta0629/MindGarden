package com.coresolution.consultation.service.shop;

import java.math.BigDecimal;
import java.util.EnumSet;
import java.util.Set;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;

/**
 * 쇼핑 주문 결제 승인 가능 여부 규칙 (승인 경로·자동 취소 판정 공통).
 * <ul>
 *   <li>H9: 주문이 열려 있고 결제 건만 EXPIRED 이면 금액·주문이 일치할 때 주문 열림을 기준으로 승인한다.</li>
 *   <li>H9b: 주문이 열려 있어도 결제 건이 승인 불가 상태(취소·환불·환불 필요, 또는 EXPIRED + 금액 불일치)면
 *       승인하지 않고 PG 자동 취소 대상이다. 주문은 열린 채 둔다.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public final class ShopPaymentApprovalPolicy {

    /** 쇼핑 결제 — 이 상태에서 APPROVED 로 뒤집지 않는다 */
    public static final Set<Payment.PaymentStatus> NON_APPROVABLE_PAYMENT_STATUSES = EnumSet.of(
            Payment.PaymentStatus.CANCELLED,
            Payment.PaymentStatus.EXPIRED,
            Payment.PaymentStatus.REFUNDED,
            Payment.PaymentStatus.REFUND_REQUIRED);

    /** 결제 승인을 받을 수 있는 열린 쇼핑 주문 상태 */
    public static final Set<ShopClientOrderStatus> OPEN_ORDER_STATUSES =
            EnumSet.of(ShopClientOrderStatus.CREATED, ShopClientOrderStatus.PENDING_PAYMENT);

    private ShopPaymentApprovalPolicy() {
    }

    /**
     * @param status 주문 상태
     * @return 결제 승인을 받을 수 있는 열린 주문이면 true
     */
    public static boolean isOpenOrder(ShopClientOrderStatus status) {
        return status != null && OPEN_ORDER_STATUSES.contains(status);
    }

    /**
     * @param payment 결제 건
     * @param order   주문
     * @return 결제 금액이 주문 현금 결제액과 같으면 true
     */
    public static boolean amountMatchesOrder(Payment payment, ShopClientOrder order) {
        Long cashDue = order.getCashDueMinor();
        return payment.getAmount() != null && cashDue != null
                && payment.getAmount().compareTo(BigDecimal.valueOf(cashDue)) == 0;
    }

    /**
     * H9 대상 — 열린 주문에 연결된 결제 건만 EXPIRED.
     *
     * @param payment 결제 건
     * @param order   주문
     * @return H9 대상이면 true (금액 일치 여부와 무관)
     */
    public static boolean isExpiredPaymentOnOpenOrder(Payment payment, ShopClientOrder order) {
        return payment.getStatus() == Payment.PaymentStatus.EXPIRED
                && isOpenOrder(order.getStatus())
                && order.getPublicId() != null
                && order.getPublicId().equals(payment.getOrderId());
    }

    /**
     * H9b 대상 — 열린 주문인데 결제 건이 승인할 수 없는 상태.
     *
     * @param payment 결제 건
     * @param order   주문
     * @return 승인하지 않고 PG 자동 취소해야 하면 true
     */
    public static boolean isUnapprovableOnOpenOrder(Payment payment, ShopClientOrder order) {
        if (!isOpenOrder(order.getStatus()) || !NON_APPROVABLE_PAYMENT_STATUSES.contains(payment.getStatus())) {
            return false;
        }
        if (isExpiredPaymentOnOpenOrder(payment, order)) {
            return !amountMatchesOrder(payment, order);
        }
        return true;
    }
}

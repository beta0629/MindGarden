package com.coresolution.consultation.service.shop;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;

/**
 * {@link ShopPaymentApprovalPolicy} — H9(열린 주문 + EXPIRED 결제 승인) / H9b(열린 주문 + 승인 불가 결제 자동 취소) 판정.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@DisplayName("ShopPaymentApprovalPolicy — H9·H9b 판정")
class ShopPaymentApprovalPolicyTest {

    private static final String ORDER_PUBLIC_ID = "order-policy-1";
    private static final long CASH_DUE = 9_000L;

    @ParameterizedTest
    @EnumSource(value = Payment.PaymentStatus.class, names = {"CANCELLED", "REFUNDED", "REFUND_REQUIRED"})
    @DisplayName("열린 주문 + 취소·환불·환불 필요 결제 → H9b 대상")
    void openOrder_cancelledOrRefundedPayment_unapprovable(Payment.PaymentStatus paymentStatus) {
        assertThat(ShopPaymentApprovalPolicy.isUnapprovableOnOpenOrder(
                payment(paymentStatus, CASH_DUE), order(ShopClientOrderStatus.CREATED))).isTrue();
        assertThat(ShopPaymentApprovalPolicy.isUnapprovableOnOpenOrder(
                payment(paymentStatus, CASH_DUE), order(ShopClientOrderStatus.PENDING_PAYMENT))).isTrue();
    }

    @Test
    @DisplayName("H9: 열린 주문 + EXPIRED 결제·금액 일치 → H9b 아님(승인 경로)")
    void openOrder_expiredPaymentAmountMatch_notUnapprovable() {
        assertThat(ShopPaymentApprovalPolicy.isUnapprovableOnOpenOrder(
                payment(Payment.PaymentStatus.EXPIRED, CASH_DUE), order(ShopClientOrderStatus.PENDING_PAYMENT)))
                .isFalse();
    }

    @Test
    @DisplayName("열린 주문 + EXPIRED 결제·금액 불일치 → H9b 대상")
    void openOrder_expiredPaymentAmountMismatch_unapprovable() {
        assertThat(ShopPaymentApprovalPolicy.isUnapprovableOnOpenOrder(
                payment(Payment.PaymentStatus.EXPIRED, CASH_DUE - 1), order(ShopClientOrderStatus.PENDING_PAYMENT)))
                .isTrue();
    }

    @ParameterizedTest
    @EnumSource(value = Payment.PaymentStatus.class, names = {"PENDING", "PROCESSING", "APPROVED", "FAILED"})
    @DisplayName("열린 주문 + 승인 가능 결제 → H9b 아님")
    void openOrder_approvablePayment_notUnapprovable(Payment.PaymentStatus paymentStatus) {
        assertThat(ShopPaymentApprovalPolicy.isUnapprovableOnOpenOrder(
                payment(paymentStatus, CASH_DUE), order(ShopClientOrderStatus.CREATED))).isFalse();
    }

    @ParameterizedTest
    @EnumSource(value = ShopClientOrderStatus.class, names = {"CREATED", "PENDING_PAYMENT"},
            mode = EnumSource.Mode.EXCLUDE)
    @DisplayName("열린 주문이 아니면(닫힘·PAID 등) H9b 아님 — 닫힌 주문은 늦은 결제 경로")
    void notOpenOrder_notUnapprovable(ShopClientOrderStatus orderStatus) {
        assertThat(ShopPaymentApprovalPolicy.isUnapprovableOnOpenOrder(
                payment(Payment.PaymentStatus.CANCELLED, CASH_DUE), order(orderStatus))).isFalse();
    }

    private static Payment payment(Payment.PaymentStatus status, long amount) {
        return Payment.builder()
                .paymentId("pay-policy-1")
                .orderId(ORDER_PUBLIC_ID)
                .amount(BigDecimal.valueOf(amount))
                .status(status)
                .build();
    }

    private static ShopClientOrder order(ShopClientOrderStatus status) {
        return ShopClientOrder.builder()
                .publicId(ORDER_PUBLIC_ID)
                .status(status)
                .cashDueMinor(CASH_DUE)
                .build();
    }
}

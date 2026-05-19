package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopRefundConstants;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.dto.shop.admin.ShopOrderRefundResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.PaymentGatewayService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AdminShopOrderRefundServiceImpl} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopOrderRefundServiceImpl")
class AdminShopOrderRefundServiceImplTest {

    private static final String TENANT = "tenant-a";
    private static final String ORDER_ID = "order-refund-1";
    private static final String REASON = ShopRefundConstants.REASON_PRE_FULFILLMENT;
    private static final String PAYMENT_ID = "pay-shop-001";

    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;

    @Mock
    private ClientPointWalletService clientPointWalletService;

    @Mock
    private PointTenantPolicyService pointTenantPolicyService;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private PaymentService paymentService;

    @Mock
    private PaymentGatewayService paymentGatewayService;

    @Mock
    private ShopNotificationHelper shopNotificationHelper;

    @InjectMocks
    private AdminShopOrderRefundServiceImpl service;

    @Test
    @DisplayName("PAID 주문 전액 환불 — 포인트 복원·clawback·REFUNDED·PG COMPLETED")
    void refundPaidOrder_restoresRedeemClawsEarnAndSetsRefunded() {
        ShopClientOrder order = paidOrder(10_000L, 3_000L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, true, true, 500, 0L, 30));
        when(clientPointWalletService.clawbackEarn(
                        eq(TENANT),
                        eq(42L),
                        eq(ORDER_ID),
                        eq(350L),
                        eq(ShopCheckoutConstants.pointClawbackKey(ORDER_ID))))
                .thenReturn(350L);
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(paymentGatewayService.refundPayment(
                        eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any()))
                .thenReturn(true);

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(3_000L, response.getPointsRestoredMinor());
        assertEquals(350L, response.getPointsClawedBackMinor());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        verify(clientPointWalletService).restoreRedeemOnRefund(
                TENANT,
                42L,
                ORDER_ID,
                3_000L,
                ShopCheckoutConstants.pointCommitReversalKey(ORDER_ID));
        verify(paymentGatewayService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any());
        verify(paymentService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any());
        verify(shopClientOrderRepository).save(order);
        verify(shopNotificationHelper).notifyOrderRefunded(TENANT, order);
    }

    @Test
    @DisplayName("현금 0원 — PG NOT_APPLICABLE, 게이트웨이 미호출")
    void refundPaidOrder_zeroCash_skipsPg() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 0L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, false, false, 0, 0L, 30));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE, response.getPgRefundStatus());
        verify(paymentGatewayService, never()).refundPayment(any(), any(), any());
        verify(paymentService, never()).refundPayment(any(), any(), any());
        verify(shopClientOrderRepository).save(order);
    }

    @Test
    @DisplayName("PG 환불 실패 — IllegalStateException·주문 PAID 유지")
    void refundPaidOrder_pgRefundFails_rollsBackTransactionally() {
        ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, false, false, 0, 0L, 30));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(false);

        assertThrows(IllegalStateException.class, () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        verify(paymentService, never()).refundPayment(any(), any(), any());
        verify(shopClientOrderRepository, never()).save(order);
    }

    @Test
    @DisplayName("PAID→REFUNDED — clawback 멱등(0 반환) 시에도 REFUNDED·clawed 0")
    void refundPaidOrder_clawbackIdempotentZero_stillRefunded() {
        ShopClientOrder order = paidOrder(10_000L, 3_000L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, true, true, 500, 0L, 30));
        when(clientPointWalletService.clawbackEarn(
                        eq(TENANT),
                        eq(42L),
                        eq(ORDER_ID),
                        eq(350L),
                        eq(ShopCheckoutConstants.pointClawbackKey(ORDER_ID))))
                .thenReturn(0L);
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(true);

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(3_000L, response.getPointsRestoredMinor());
        assertEquals(0L, response.getPointsClawedBackMinor());
        verify(clientPointWalletService).clawbackEarn(
                TENANT,
                42L,
                ORDER_ID,
                350L,
                ShopCheckoutConstants.pointClawbackKey(ORDER_ID));
        verify(shopClientOrderRepository).save(order);
    }

    @Test
    @DisplayName("이미 REFUNDED면 멱등 no-op")
    void refundPaidOrder_alreadyRefunded_idempotent() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.of(approvedPayment(BigDecimal.valueOf(5_000L))));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        verify(clientPointWalletService, never()).restoreRedeemOnRefund(any(), any(), any(), any(Long.class), any());
        verify(clientPointWalletService, never()).clawbackEarn(any(), any(), any(), any(Long.class), any());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("PAID가 아니면 환불 불가")
    void refundPaidOrder_notPaid_throws() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
        order.setStatus(ShopClientOrderStatus.CREATED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));

        assertThrows(IllegalArgumentException.class, () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));
    }

    private static ShopClientOrder paidOrder(long subtotal, long points, long cash) {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(42L)
                .status(ShopClientOrderStatus.PAID)
                .subtotalMinor(subtotal)
                .pointsRedeemMinor(points)
                .cashDueMinor(cash)
                .checkoutIdempotencyKey("checkout-key")
                .build();
        order.setTenantId(TENANT);
        return order;
    }

    private static Payment approvedPayment(BigDecimal amount) {
        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_ID)
                .amount(amount)
                .status(Payment.PaymentStatus.APPROVED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS)
                .payerId(42L)
                .build();
        payment.setTenantId(TENANT);
        return payment;
    }
}

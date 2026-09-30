package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.exception.ShopOrderClosedForPaymentException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.ShopLatePaymentOutcome;
import com.coresolution.consultation.service.ShopLatePaymentRefundService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentLookupService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import java.lang.reflect.Method;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * #1311 후속 — 관리자 결제 정합: PortOne 검증 뒤 주문이 닫힌 레이스, 트랜잭션 밖 PortOne 조회.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopOrderReconcileServiceImpl — 늦은 결제 레이스 후속")
class AdminShopOrderReconcileLatePaymentRaceTest {

    private static final String TENANT = "tenant-reconcile-race";
    private static final String ORDER_ID = "order-reconcile-race-1";
    private static final String PORTONE_PAYMENT_ID = "portone-pay-race-001";
    private static final Long CLIENT_ID = 78L;
    private static final long CASH_DUE = 15_000L;
    private static final String VERIFY_BODY = "{\"status\":\"PAID\",\"amount\":{\"total\":15000}}";

    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    @Mock
    private PortOneV2PaymentLookupService portOneV2PaymentLookupService;
    @Mock
    private PaymentService paymentService;
    @Mock
    private ClientShopCheckoutService clientShopCheckoutService;
    @Mock
    private ShopLatePaymentRefundService shopLatePaymentRefundService;

    @InjectMocks
    private AdminShopOrderReconcileServiceImpl service;

    @Test
    @DisplayName("검증 뒤 사용자 취소가 먼저 커밋(승인 잠금 재확인에서 닫힘) → 주문 복구 없이 늦은 결제 자동 환불")
    void reconcilePayment_orderClosedDuringApproval_lateRefund() {
        ShopClientOrder order = pendingOrder();
        Payment pending = pendingIamportPayment();
        stubVerifiedPendingOrder(order, pending);
        when(paymentService.approveShopOrderPayment(PORTONE_PAYMENT_ID)).thenAnswer(inv -> {
            order.setStatus(ShopClientOrderStatus.CANCELLED);
            throw new ShopOrderClosedForPaymentException(ORDER_ID, ShopClientOrderStatus.CANCELLED);
        });
        when(shopLatePaymentRefundService.refundIfOrderClosed(TENANT, PORTONE_PAYMENT_ID))
                .thenReturn(ShopLatePaymentOutcome.REFUNDED);

        ShopOrderReconcilePaymentResponse response =
                service.reconcilePayment(TENANT, ORDER_ID, PORTONE_PAYMENT_ID, null);

        assertEquals(ShopClientOrderStatus.CANCELLED, response.getOrderStatus());
        assertEquals(Payment.PaymentStatus.REFUNDED, response.getPaymentStatus());
        assertFalse(response.isRecovered());
        verify(shopLatePaymentRefundService).refundIfOrderClosed(TENANT, PORTONE_PAYMENT_ID);
        verify(clientShopCheckoutService, never()).completeOrderOnPaymentApproved(any(), any());
    }

    @Test
    @DisplayName("낙관적 락 충돌 + 재조회 닫힌 주문 + PG 취소 실패 → REFUND_REQUIRED 응답(일반 500 아님)")
    void reconcilePayment_optimisticConflict_closedOrder_refundRequired() {
        ShopClientOrder order = pendingOrder();
        Payment pending = pendingIamportPayment();
        stubVerifiedPendingOrder(order, pending);
        when(paymentService.approveShopOrderPayment(PORTONE_PAYMENT_ID)).thenAnswer(inv -> {
            order.setStatus(ShopClientOrderStatus.EXPIRED);
            throw new ObjectOptimisticLockingFailureException(Payment.class, pending.getId());
        });
        when(shopLatePaymentRefundService.refundIfOrderClosed(TENANT, PORTONE_PAYMENT_ID))
                .thenReturn(ShopLatePaymentOutcome.REFUND_REQUIRED);

        ShopOrderReconcilePaymentResponse response =
                service.reconcilePayment(TENANT, ORDER_ID, PORTONE_PAYMENT_ID, null);

        assertEquals(ShopClientOrderStatus.EXPIRED, response.getOrderStatus());
        assertEquals(Payment.PaymentStatus.REFUND_REQUIRED, response.getPaymentStatus());
        verify(clientShopCheckoutService, never()).completeOrderOnPaymentApproved(any(), any());
    }

    @Test
    @DisplayName("낙관적 락 충돌이어도 주문이 열려 있으면 늦은 결제로 처리하지 않고 원래 예외")
    void reconcilePayment_optimisticConflict_orderStillOpen_rethrows() {
        ShopClientOrder order = pendingOrder();
        Payment pending = pendingIamportPayment();
        stubVerifiedPendingOrder(order, pending);
        when(paymentService.approveShopOrderPayment(PORTONE_PAYMENT_ID))
                .thenThrow(new ObjectOptimisticLockingFailureException(Payment.class, pending.getId()));

        assertThrows(ObjectOptimisticLockingFailureException.class,
                () -> service.reconcilePayment(TENANT, ORDER_ID, PORTONE_PAYMENT_ID, null));

        verify(shopLatePaymentRefundService, never()).refundIfOrderClosed(any(), any());
    }

    @Test
    @DisplayName("트랜잭션 경계: 결제·환불 정합은 외부 트랜잭션 없이(NOT_SUPPORTED) — PortOne 조회 중 커넥션 미보유")
    void reconcile_runsWithoutOuterTransaction() throws Exception {
        Method payment = AdminShopOrderReconcileServiceImpl.class.getMethod(
                "reconcilePayment", String.class, String.class, String.class, String.class);

        assertEquals(Propagation.NOT_SUPPORTED, payment.getAnnotation(Transactional.class).propagation());
        for (Method method : AdminShopOrderReconcileServiceImpl.class.getDeclaredMethods()) {
            if ("reconcileRefund".equals(method.getName()) && method.getAnnotation(Transactional.class) != null) {
                assertEquals(Propagation.NOT_SUPPORTED, method.getAnnotation(Transactional.class).propagation());
            }
        }
    }

    private void stubVerifiedPendingOrder(ShopClientOrder order, Payment pending) {
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenAnswer(inv -> Optional.of(order));
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(
                        eq(TENANT), eq(PORTONE_PAYMENT_ID), eq(BigDecimal.valueOf(CASH_DUE))))
                .thenReturn(Optional.of(VERIFY_BODY));
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PORTONE_PAYMENT_ID))
                .thenAnswer(inv -> Optional.of(pending));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private static ShopClientOrder pendingOrder() {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(CLIENT_ID)
                .status(ShopClientOrderStatus.PENDING_PAYMENT)
                .subtotalMinor(CASH_DUE)
                .pointsRedeemMinor(0L)
                .cashDueMinor(CASH_DUE)
                .checkoutIdempotencyKey("idem-reconcile-race")
                .build();
        order.setTenantId(TENANT);
        return order;
    }

    private static Payment pendingIamportPayment() {
        Payment payment = Payment.builder()
                .paymentId(PORTONE_PAYMENT_ID)
                .orderId(ORDER_ID)
                .amount(BigDecimal.valueOf(CASH_DUE))
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(CLIENT_ID)
                .build();
        payment.setId(601L);
        payment.setTenantId(TENANT);
        return payment;
    }
}

package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopLatePaymentConstants;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ShopLatePaymentOutcome;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.core.monitoring.SchedulerFailureNotifier;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * {@link ShopLatePaymentRefundServiceImpl} 닫힌 주문 늦은 결제 자동 취소 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShopLatePaymentRefundServiceImpl")
class ShopLatePaymentRefundServiceImplTest {

    private static final String TENANT = "tenant-late-unit";
    private static final String ORDER_ID = "ord-late-unit";
    private static final String PAYMENT_ID = "pay-late-unit";

    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    @Mock
    private ShopNotificationHelper shopNotificationHelper;
    @Mock
    private ObjectProvider<SchedulerFailureNotifier> failureNotifierProvider;
    @Mock
    private SchedulerFailureNotifier schedulerFailureNotifier;
    @Mock
    private PlatformTransactionManager transactionManager;

    private ShopLatePaymentRefundServiceImpl service;
    private ShopClientOrder order;
    private Payment payment;

    @BeforeEach
    void setUp() {
        service = new ShopLatePaymentRefundServiceImpl(
                paymentRepository,
                shopClientOrderRepository,
                portOneV2PaymentCancelService,
                shopNotificationHelper,
                failureNotifierProvider,
                transactionManager);
        order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(7L)
                .status(ShopClientOrderStatus.CANCELLED)
                .subtotalMinor(5_000L)
                .pointsRedeemMinor(0L)
                .cashDueMinor(5_000L)
                .checkoutIdempotencyKey("idem-late-unit")
                .build();
        order.setTenantId(TENANT);
        payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_ID)
                .status(Payment.PaymentStatus.CANCELLED)
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        payment.setTenantId(TENANT);
        lenient().when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenAnswer(inv -> Optional.of(payment));
        lenient().when(shopClientOrderRepository.lockByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenAnswer(inv -> Optional.of(order));
        lenient().when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(failureNotifierProvider.getIfAvailable()).thenReturn(schedulerFailureNotifier);
    }

    @Test
    @DisplayName("열린 주문 → NOT_APPLICABLE, PortOne 취소·저장·알림 없음")
    void openOrder_notApplicable() {
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);

        assertEquals(ShopLatePaymentOutcome.NOT_APPLICABLE, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        verify(paymentRepository, never()).save(any());
        verify(schedulerFailureNotifier, never()).notifyFailure(any(), any(), any(), any());
    }

    @Test
    @DisplayName("취소 주문 → 주문 잠금 후 REFUND_REQUIRED 선점 → PortOne 취소 → REFUNDED 확정·알림")
    void cancelledOrder_refunded() {
        when(portOneV2PaymentCancelService.cancelPayment(TENANT, PAYMENT_ID, ShopLatePaymentConstants.PORTONE_CANCEL_REASON))
                .thenReturn(true);

        assertEquals(ShopLatePaymentOutcome.REFUNDED, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        assertNotNull(payment.getRefundedAt());
        assertNotNull(payment.getCancelledAt());
        assertEquals(ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER, payment.getFailureReason());
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        InOrder ordered = inOrder(shopClientOrderRepository, paymentRepository, portOneV2PaymentCancelService);
        ordered.verify(shopClientOrderRepository).lockByTenantIdAndPublicId(TENANT, ORDER_ID);
        ordered.verify(paymentRepository).save(payment);
        ordered.verify(portOneV2PaymentCancelService).cancelPayment(any(), any(), any());
        ordered.verify(shopClientOrderRepository).lockByTenantIdAndPublicId(TENANT, ORDER_ID);
        ordered.verify(paymentRepository).save(payment);
        verify(shopNotificationHelper).notifyLatePaymentAutoCancelled(TENANT, order);
        verify(schedulerFailureNotifier).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUNDED),
                eq(TENANT),
                any());
    }

    @Test
    @DisplayName("이미 REFUNDED → ALREADY_REFUNDED, PortOne 재호출·알림 없음")
    void alreadyRefunded_noSecondCancel() {
        payment.setStatus(Payment.PaymentStatus.REFUNDED);

        assertEquals(ShopLatePaymentOutcome.ALREADY_REFUNDED, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        verify(paymentRepository, never()).save(any());
        verify(shopNotificationHelper, never()).notifyLatePaymentAutoCancelled(any(), any());
    }

    @Test
    @DisplayName("PortOne 취소 실패(false·예외) → REFUND_REQUIRED, 관리자 알림, 내담자 안내 없음")
    void cancelFails_refundRequired() {
        when(portOneV2PaymentCancelService.cancelPayment(any(), any(), any()))
                .thenReturn(false)
                .thenThrow(new IllegalStateException("portone down"));

        assertEquals(ShopLatePaymentOutcome.REFUND_REQUIRED, service.refundIfOrderClosed(TENANT, PAYMENT_ID));
        assertEquals(ShopLatePaymentOutcome.REFUND_REQUIRED, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        assertEquals(Payment.PaymentStatus.REFUND_REQUIRED, payment.getStatus());
        verify(schedulerFailureNotifier, times(2)).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUND_REQUIRED),
                eq(TENANT),
                any());
        verify(shopNotificationHelper, never()).notifyLatePaymentAutoCancelled(any(), any());
    }

    @Test
    @DisplayName("만료 주문 + 알림 빈 없음 → REFUNDED, 알림 전송은 건너뜀")
    void expiredOrder_noNotifierBean_stillRefunds() {
        order.setStatus(ShopClientOrderStatus.EXPIRED);
        when(failureNotifierProvider.getIfAvailable()).thenReturn(null);
        when(portOneV2PaymentCancelService.cancelPayment(any(), any(), any())).thenReturn(true);

        assertEquals(ShopLatePaymentOutcome.REFUNDED, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        verify(schedulerFailureNotifier, never()).notifyFailure(any(), any(), any(), any());
    }

    @Test
    @DisplayName("PortOne 결제가 아니면 취소 API 없이 REFUND_REQUIRED(관리자 수동 처리)")
    void nonPortOnePayment_refundRequiredWithoutApi() {
        payment.setProvider(Payment.PaymentProvider.TOSS);

        assertEquals(ShopLatePaymentOutcome.REFUND_REQUIRED, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        assertEquals(Payment.PaymentStatus.REFUND_REQUIRED, payment.getStatus());
    }
}

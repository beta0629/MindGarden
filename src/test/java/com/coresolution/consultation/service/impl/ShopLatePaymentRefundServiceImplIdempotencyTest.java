package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.List;
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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * {@link ShopLatePaymentRefundServiceImpl} 취소 선점 임대·이중 결제 멱등 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShopLatePaymentRefundServiceImpl 선점 임대·이중 결제")
class ShopLatePaymentRefundServiceImplIdempotencyTest {

    private static final String TENANT = "tenant-late-idem";
    private static final String ORDER_ID = "ord-late-idem";
    private static final String PAYMENT_ID = "pay-late-idem";
    private static final String APPROVED_PAYMENT_ID = "pay-late-idem-approved";
    private static final long LEASE_MS = 60_000L;

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
                transactionManager,
                LEASE_MS);
        order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(7L)
                .status(ShopClientOrderStatus.CANCELLED)
                .subtotalMinor(5_000L)
                .pointsRedeemMinor(0L)
                .cashDueMinor(5_000L)
                .checkoutIdempotencyKey("idem-late-idem")
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
    @DisplayName("다른 요청이 취소 선점 중(임대 유효) → REFUND_IN_PROGRESS, PortOne 재호출·저장 없음")
    void activeClaimLease_refundInProgress() {
        claimedAt(LocalDateTime.now());

        assertEquals(ShopLatePaymentOutcome.REFUND_IN_PROGRESS, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        verify(paymentRepository, never()).save(any());
        verify(schedulerFailureNotifier, never()).notifyFailure(any(), any(), any(), any());
    }

    @Test
    @DisplayName("선점 임대 만료(취소 중 서버 중단) → 다시 선점해 PortOne 취소 1회, REFUNDED")
    void expiredClaimLease_reclaimedAndRefunded() {
        claimedAt(LocalDateTime.now().minusSeconds(LEASE_MS / 1_000L + 1L));
        when(portOneV2PaymentCancelService.cancelPayment(TENANT, PAYMENT_ID, ShopLatePaymentConstants.PORTONE_CANCEL_REASON))
                .thenReturn(true);

        assertEquals(ShopLatePaymentOutcome.REFUNDED, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals(ShopLatePaymentConstants.FAILURE_REASON_LATE_PAYMENT_ON_CLOSED_ORDER, payment.getFailureReason());
        verify(portOneV2PaymentCancelService, times(1)).cancelPayment(any(), any(), any());
    }

    @Test
    @DisplayName("이중 결제: 주문 PAID(다른 결제 APPROVED) → 중복 사유로 PortOne 취소, 주문 PAID 유지, 내담자 늦은 결제 안내 없음")
    void duplicatePaymentOnPaidOrder_refundedWithDuplicateReason() {
        order.setStatus(ShopClientOrderStatus.PAID);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        when(paymentRepository.lockByTenantIdAndOrderId(TENANT, ORDER_ID))
                .thenReturn(List.of(payment, approvedPayment()));
        when(portOneV2PaymentCancelService.cancelPayment(
                TENANT, PAYMENT_ID, ShopLatePaymentConstants.PORTONE_CANCEL_REASON_DUPLICATE)).thenReturn(true);

        assertEquals(ShopLatePaymentOutcome.REFUNDED, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        assertEquals(Payment.PaymentStatus.REFUNDED, payment.getStatus());
        assertEquals(ShopLatePaymentConstants.FAILURE_REASON_DUPLICATE_PAYMENT_ON_PAID_ORDER,
                payment.getFailureReason());
        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        verify(shopNotificationHelper, never()).notifyLatePaymentAutoCancelled(any(), any());
        verify(schedulerFailureNotifier).notifyFailure(
                eq(ShopLatePaymentConstants.ADMIN_ALERT_SOURCE),
                eq(ShopLatePaymentConstants.ADMIN_ALERT_STEP_REFUNDED),
                eq(TENANT),
                any());
    }

    @Test
    @DisplayName("주문 PAID 의 정상 승인 결제 자신 → NOT_APPLICABLE, 취소 없음")
    void approvedPaymentOnPaidOrder_notApplicable() {
        order.setStatus(ShopClientOrderStatus.PAID);
        payment.setStatus(Payment.PaymentStatus.APPROVED);

        assertEquals(ShopLatePaymentOutcome.NOT_APPLICABLE, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("주문 PAID 인데 다른 승인 결제 없음 → 이중 결제 아님(NOT_APPLICABLE)")
    void paidOrderWithoutOtherApproved_notApplicable() {
        order.setStatus(ShopClientOrderStatus.PAID);
        payment.setStatus(Payment.PaymentStatus.PENDING);
        when(paymentRepository.lockByTenantIdAndOrderId(TENANT, ORDER_ID)).thenReturn(List.of(payment));

        assertEquals(ShopLatePaymentOutcome.NOT_APPLICABLE, service.refundIfOrderClosed(TENANT, PAYMENT_ID));

        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
    }

    private void claimedAt(LocalDateTime claimedAt) {
        payment.setStatus(Payment.PaymentStatus.REFUND_REQUIRED);
        payment.setFailureReason(ShopLatePaymentConstants.FAILURE_REASON_AUTO_REFUND_IN_PROGRESS);
        payment.setUpdatedAt(claimedAt);
    }

    private Payment approvedPayment() {
        Payment approved = Payment.builder()
                .paymentId(APPROVED_PAYMENT_ID)
                .orderId(ORDER_ID)
                .status(Payment.PaymentStatus.APPROVED)
                .provider(Payment.PaymentProvider.IAMPORT)
                .build();
        approved.setTenantId(TENANT);
        return approved;
    }
}

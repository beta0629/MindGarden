package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.inOrder;
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
import com.coresolution.consultation.exception.ShopRefundClinicChainException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.PaymentGatewayService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentCancelService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

/**
 * {@link AdminShopOrderRefundServiceImpl} 단위 검증 — fail-closed PG 취소 증거(cancelledAt) 정책.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopOrderRefundServiceImpl (fail-closed + cancelledAt)")
class AdminShopOrderRefundServiceImplTest {

    private static final String TENANT = "tenant-a";
    private static final String ORDER_ID = "order-refund-1";
    private static final String REASON = ShopRefundConstants.REASON_PRE_FULFILLMENT;
    private static final String PAYMENT_ID = "pay-shop-001";

    @Mock private ShopClientOrderRepository shopClientOrderRepository;
    @Mock private ClientPointWalletService clientPointWalletService;
    @Mock private PointTenantPolicyService pointTenantPolicyService;
    @Mock private PaymentRepository paymentRepository;
    @Mock private PaymentService paymentService;
    @Mock private PaymentGatewayService paymentGatewayService;
    @Mock private ShopNotificationHelper shopNotificationHelper;
    @Mock private ShopOrderFulfillmentService shopOrderFulfillmentService;
    @Mock private PortOneV2PaymentCancelService portOneV2PaymentCancelService;
    @Mock private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;

    private AdminShopOrderRefundServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new AdminShopOrderRefundServiceImpl(
                shopClientOrderRepository,
                clientPointWalletService,
                pointTenantPolicyService,
                paymentRepository,
                paymentService,
                shopNotificationHelper,
                shopOrderFulfillmentService,
                portOneV2PaymentCancelService,
                portOneV2PaymentVerifyService,
                paymentGatewayService);
    }

    // ── happy path ──

    @Test
    @DisplayName("비-IAMPORT PG 성공 — cancelledAt 기록 + 최종 검증 통과 + REFUNDED")
    void refundPaidOrder_nonIamport_success_cancelledAtRecorded() {
        ShopClientOrder order = paidOrder(10_000L, 3_000L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, true, true, 500, 0L, 30));
        when(clientPointWalletService.clawbackEarn(
                        eq(TENANT), eq(42L), eq(ORDER_ID), eq(350L),
                        eq(ShopCheckoutConstants.pointClawbackKey(ORDER_ID))))
                .thenReturn(350L);
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any()))
                .thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        assertNotNull(payment.getCancelledAt(), "cancelledAt must be set after PG cancel");
        assertEquals(350L, response.getPointsClawedBackMinor());
        verify(paymentRepository).save(payment);
        InOrder inOrder = inOrder(
                paymentGatewayService, paymentRepository, paymentService,
                shopOrderFulfillmentService, clientPointWalletService);
        inOrder.verify(paymentGatewayService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any());
        inOrder.verify(paymentRepository).save(payment);
        inOrder.verify(paymentService).refundPayment(
                eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any(), eq(false));
        inOrder.verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
    }

    @Test
    @DisplayName("IAMPORT — PortOne cancel + 증거 확인 → cancelledAt 기록 + REFUNDED")
    void refundPaidOrder_iamport_cancelWithEvidence_cancelledAtRecorded() {
        ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
        Payment payment = iamportPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, false, false, 0, 0L, 30));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any())).thenReturn(true);
        when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(TENANT, PAYMENT_ID)).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        assertNotNull(payment.getCancelledAt(), "cancelledAt must be set after PortOne cancel evidence");
        verify(paymentRepository).save(payment);
        verify(paymentRepository).findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID);
    }

    @Test
    @DisplayName("empty-events PAID 환불 — PortOne cancel + clinic reverse(팬텀 INCOME은 reverse 측 SSOT)")
    void refundPaidOrder_emptyEventsPaid_portOneCancelThenClinicReverse() {
        ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
        Payment payment = iamportPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, false, false, 0, 0L, 30));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any())).thenReturn(true);
        when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(TENANT, PAYMENT_ID)).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        assertNotNull(payment.getCancelledAt());
        InOrder inOrder = inOrder(portOneV2PaymentCancelService, shopOrderFulfillmentService);
        inOrder.verify(portOneV2PaymentCancelService).cancelPayment(eq(TENANT), eq(PAYMENT_ID), any());
        inOrder.verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        verify(paymentGatewayService, never()).refundPayment(any(), any(), any());
    }

    @Test
    @DisplayName("현금 0원 — PG NOT_APPLICABLE, cancelledAt 미설정, 회기 원복은 수행")
    void refundPaidOrder_zeroCash_skipsPg() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 0L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, false, false, 0, 0L, 30));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE, response.getPgRefundStatus());
        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        verify(paymentGatewayService, never()).refundPayment(any(), any(), any());
        verify(paymentService, never()).refundPayment(any(), any(), any());
        verify(shopClientOrderRepository).save(order);
    }

    @Test
    @DisplayName("clawback 멱등(0 반환) + cancelledAt 기록 → REFUNDED")
    void refundPaidOrder_clawbackIdempotentZero_cancelledAtRecorded() {
        ShopClientOrder order = paidOrder(10_000L, 3_000L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, true, true, 500, 0L, 30));
        when(clientPointWalletService.clawbackEarn(
                        eq(TENANT), eq(42L), eq(ORDER_ID), eq(350L),
                        eq(ShopCheckoutConstants.pointClawbackKey(ORDER_ID))))
                .thenReturn(0L);
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        assertNotNull(payment.getCancelledAt());
        assertEquals(0L, response.getPointsClawedBackMinor());
    }

    // ── fail-closed: PG 취소 실패 → 전체 롤백 ──

    @Nested
    @DisplayName("fail-closed: PG 취소 실패 / 증거 없음 → Clinic REFUNDED 금지")
    class FailClosedPgCancelFailure {

        @Test
        @DisplayName("비-IAMPORT PG 환불 실패 — cancelledAt 미설정, PAID 유지")
        void pgRefundFails_noCancelledAt() {
            ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
            Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                    .thenReturn(Optional.of(payment));
            when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
            when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(false);

            assertThrows(IllegalStateException.class,
                    () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

            assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
            assertNull(payment.getCancelledAt(), "cancelledAt must NOT be set on PG failure");
            verify(paymentService, never()).refundPayment(any(), any(), any());
            verify(shopClientOrderRepository, never()).save(order);
        }

        @Test
        @DisplayName("IAMPORT PortOne cancel 실패 — cancelledAt 미설정, PAID 유지")
        void portOneCancelFails_noCancelledAt() {
            ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
            Payment payment = iamportPayment(BigDecimal.valueOf(7_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                    .thenReturn(Optional.of(payment));
            when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
            when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any()))
                    .thenReturn(false);

            assertThrows(IllegalStateException.class,
                    () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

            assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
            assertNull(payment.getCancelledAt());
            verify(paymentService, never()).refundPayment(any(), any(), any());
        }

        @Test
        @DisplayName("IAMPORT cancel 성공 + PortOne 증거 없음 — cancelledAt 미설정, PAID 유지")
        void portOneCancelOk_butNoEvidence_noCancelledAt() {
            ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
            Payment payment = iamportPayment(BigDecimal.valueOf(7_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                    .thenReturn(Optional.of(payment));
            when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
            when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any()))
                    .thenReturn(true);
            when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(TENANT, PAYMENT_ID))
                    .thenReturn(false);

            IllegalStateException thrown = assertThrows(IllegalStateException.class,
                    () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

            assertTrue(thrown.getMessage().contains("증거 없음"));
            assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
            assertNull(payment.getCancelledAt());
            verify(paymentService, never()).refundPayment(any(), any(), any());
        }

        @Test
        @DisplayName("cancelledAt 최종 검증 실패 — COMPLETED 반환 금지")
        void cancelledAtFinalAssertionFails_blocksCompleted() {
            ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
            Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
            Payment persistedWithoutCancelledAt = approvedPayment(BigDecimal.valueOf(7_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                    .thenReturn(Optional.of(payment));
            when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
            when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(true);
            when(paymentRepository.save(payment)).thenReturn(payment);
            when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                    .thenReturn(Optional.of(persistedWithoutCancelledAt));

            IllegalStateException thrown = assertThrows(IllegalStateException.class,
                    () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

            assertTrue(thrown.getMessage().contains("cancelledAt"));
            assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        }

        @Test
        @DisplayName("PaymentGatewayService 미주입(null) + 현금 결제 — fail-closed 예외")
        void noGateway_withCashDue_throwsFailClosed() {
            AdminShopOrderRefundServiceImpl serviceNoGateway = new AdminShopOrderRefundServiceImpl(
                    shopClientOrderRepository, clientPointWalletService, pointTenantPolicyService,
                    paymentRepository, paymentService, shopNotificationHelper,
                    shopOrderFulfillmentService, portOneV2PaymentCancelService,
                    portOneV2PaymentVerifyService, null);

            ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
            Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                    .thenReturn(Optional.of(payment));
            when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);

            assertThrows(IllegalStateException.class,
                    () -> serviceNoGateway.refundPaidOrder(TENANT, ORDER_ID, REASON));

            assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
            assertNull(payment.getCancelledAt());
        }
    }

    // ── Clinic chain 실패 ──

    @Test
    @DisplayName("회기 원복 실패 — PG 후 Clinic incomplete, cancelledAt은 이미 기록됨")
    void refundPaidOrder_reverseFails_afterPg_cancelledAtRecorded() {
        ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        doThrow(new IllegalStateException("ERP EXPENSE failed"))
                .when(shopOrderFulfillmentService)
                .reversePaidOrderFulfillment(TENANT, order);

        ShopRefundClinicChainException thrown = assertThrows(
                ShopRefundClinicChainException.class,
                () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        assertNotNull(payment.getCancelledAt(), "cancelledAt must be set even if clinic chain fails");
        assertTrue(thrown.isPgCancelCompleted());
        assertEquals(ShopRefundConstants.ERROR_CODE_CLINIC_INCOMPLETE, thrown.getErrorCode());
        verify(paymentService).refundPayment(
                eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any(), eq(false));
    }

    @Test
    @DisplayName("회기 원복 DataIntegrityViolation — Clinic incomplete")
    void refundPaidOrder_reverseDataIntegrity_afterPg() {
        ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(true);
        when(paymentRepository.save(payment)).thenReturn(payment);
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PAYMENT_ID))
                .thenReturn(Optional.of(payment));
        doThrow(new DataIntegrityViolationException("Duplicate entry"))
                .when(shopOrderFulfillmentService)
                .reversePaidOrderFulfillment(TENANT, order);

        ShopRefundClinicChainException thrown = assertThrows(
                ShopRefundClinicChainException.class,
                () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

        assertTrue(thrown.isPgCancelCompleted());
        assertFalse(thrown.getMessage().contains("이메일"));
    }

    // ── 멱등 ──

    @Test
    @DisplayName("이미 REFUNDED + Payment REFUNDED + cancelledAt 있음 — COMPLETED")
    void refundPaidOrder_alreadyRefunded_withCancelledAt_completed() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        Payment refunded = refundedPaymentWithCancelledAt(BigDecimal.valueOf(5_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.of(refunded));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
    }

    @Test
    @DisplayName("이미 REFUNDED + 비-IAMPORT Payment REFUNDED + cancelledAt 없음 — NOT_APPLICABLE (PG 보완 불가)")
    void refundPaidOrder_alreadyRefunded_nonIamport_withoutCancelledAt_notApplicable() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        Payment refunded = refundedPayment(BigDecimal.valueOf(5_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.of(refunded));
        when(portOneV2PaymentVerifyService.isIamportPayment(refunded)).thenReturn(false);

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE, response.getPgRefundStatus());
    }

    @Test
    @DisplayName("이미 REFUNDED + Payment 없음(REFUNDED/APPROVED 모두) — NOT_APPLICABLE")
    void refundPaidOrder_alreadyRefunded_noRefundedPayment_notApplicable() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.empty());

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE, response.getPgRefundStatus());
    }

    @Test
    @DisplayName("이미 REFUNDED + 현금 0원 — NOT_APPLICABLE")
    void refundPaidOrder_alreadyRefunded_zeroCash_notApplicable() {
        ShopClientOrder order = paidOrder(5_000L, 5_000L, 0L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE, response.getPgRefundStatus());
    }

    // ── P0: REFUNDED + IAMPORT + PG 취소 증거 누락 → PG cancel 보완 ──

    @Nested
    @DisplayName("P0: 이미 REFUNDED + IAMPORT + cancelledAt null → PortOne cancel 보완")
    class IdempotentRefundedMissingPgEvidence {

        @Test
        @DisplayName("IAMPORT REFUNDED + cancelledAt null — PortOne cancel 호출 + cancelledAt 기록 + COMPLETED")
        void alreadyRefunded_iamport_noCancelledAt_portOneCancelAttempted() {
            ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
            order.setStatus(ShopClientOrderStatus.REFUNDED);
            Payment refunded = refundedIamportPayment(BigDecimal.valueOf(5_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                    .thenReturn(Optional.of(refunded));
            when(portOneV2PaymentVerifyService.isIamportPayment(refunded)).thenReturn(true);
            when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any()))
                    .thenReturn(true);
            when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(TENANT, PAYMENT_ID))
                    .thenReturn(true);
            when(paymentRepository.save(refunded)).thenReturn(refunded);

            ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

            assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
            assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
            assertNotNull(refunded.getCancelledAt(), "cancelledAt must be set after PG cancel補完");
            verify(portOneV2PaymentCancelService).cancelPayment(eq(TENANT), eq(PAYMENT_ID), any());
            verify(paymentRepository).save(refunded);
        }

        @Test
        @DisplayName("IAMPORT REFUNDED + cancelledAt null + PortOne cancel 실패 — fail-closed 예외")
        void alreadyRefunded_iamport_noCancelledAt_cancelFails_throwsFailClosed() {
            ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
            order.setStatus(ShopClientOrderStatus.REFUNDED);
            Payment refunded = refundedIamportPayment(BigDecimal.valueOf(5_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                    .thenReturn(Optional.of(refunded));
            when(portOneV2PaymentVerifyService.isIamportPayment(refunded)).thenReturn(true);
            when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any()))
                    .thenReturn(false);

            assertThrows(IllegalStateException.class,
                    () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

            assertNull(refunded.getCancelledAt(), "cancelledAt must NOT be set on PG cancel failure");
        }

        @Test
        @DisplayName("IAMPORT REFUNDED + cancelledAt null + cancel OK + 증거 없음 — fail-closed 예외")
        void alreadyRefunded_iamport_noCancelledAt_cancelOkNoEvidence_throwsFailClosed() {
            ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
            order.setStatus(ShopClientOrderStatus.REFUNDED);
            Payment refunded = refundedIamportPayment(BigDecimal.valueOf(5_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                    .thenReturn(Optional.of(refunded));
            when(portOneV2PaymentVerifyService.isIamportPayment(refunded)).thenReturn(true);
            when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any()))
                    .thenReturn(true);
            when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(TENANT, PAYMENT_ID))
                    .thenReturn(false);

            IllegalStateException thrown = assertThrows(IllegalStateException.class,
                    () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

            assertTrue(thrown.getMessage().contains("증거 없음"));
            assertNull(refunded.getCancelledAt());
        }

        @Test
        @DisplayName("IAMPORT APPROVED(결제 상태 미전환) + cancelledAt null — PortOne cancel 보완 + COMPLETED")
        void alreadyRefunded_iamport_approvedPayment_cancelAttempted() {
            ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
            order.setStatus(ShopClientOrderStatus.REFUNDED);
            Payment approved = iamportPayment(BigDecimal.valueOf(5_000L));
            when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                    .thenReturn(Optional.of(order));
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                    .thenReturn(Optional.empty());
            when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                            TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                    .thenReturn(Optional.of(approved));
            when(portOneV2PaymentVerifyService.isIamportPayment(approved)).thenReturn(true);
            when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any()))
                    .thenReturn(true);
            when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(TENANT, PAYMENT_ID))
                    .thenReturn(true);
            when(paymentRepository.save(approved)).thenReturn(approved);

            ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

            assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
            assertNotNull(approved.getCancelledAt());
            verify(portOneV2PaymentCancelService).cancelPayment(eq(TENANT), eq(PAYMENT_ID), any());
        }
    }

    // ── 기본 검증 ──

    @Test
    @DisplayName("PAID가 아니면 환불 불가")
    void refundPaidOrder_notPaid_throws() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
        order.setStatus(ShopClientOrderStatus.CREATED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));

        assertThrows(IllegalArgumentException.class, () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));
    }

    // ── helpers ──

    private static ShopClientOrder paidOrder(long subtotal, long points, long cash) {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID).clientId(42L).status(ShopClientOrderStatus.PAID)
                .subtotalMinor(subtotal).pointsRedeemMinor(points).cashDueMinor(cash)
                .checkoutIdempotencyKey("checkout-key").build();
        order.setTenantId(TENANT);
        return order;
    }

    private static Payment approvedPayment(BigDecimal amount) {
        Payment p = Payment.builder()
                .paymentId(PAYMENT_ID).orderId(ORDER_ID).amount(amount)
                .status(Payment.PaymentStatus.APPROVED).method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS).payerId(42L).build();
        p.setTenantId(TENANT);
        return p;
    }

    private static Payment iamportPayment(BigDecimal amount) {
        Payment p = Payment.builder()
                .paymentId(PAYMENT_ID).orderId(ORDER_ID).amount(amount)
                .status(Payment.PaymentStatus.APPROVED).method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT).payerId(42L).build();
        p.setTenantId(TENANT);
        return p;
    }

    private static Payment refundedPayment(BigDecimal amount) {
        Payment p = Payment.builder()
                .paymentId(PAYMENT_ID).orderId(ORDER_ID).amount(amount)
                .status(Payment.PaymentStatus.REFUNDED).method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS).payerId(42L).build();
        p.setTenantId(TENANT);
        return p;
    }

    private static Payment refundedIamportPayment(BigDecimal amount) {
        Payment p = Payment.builder()
                .paymentId(PAYMENT_ID).orderId(ORDER_ID).amount(amount)
                .status(Payment.PaymentStatus.REFUNDED).method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT).payerId(42L).build();
        p.setTenantId(TENANT);
        return p;
    }

    private static Payment refundedPaymentWithCancelledAt(BigDecimal amount) {
        Payment p = refundedPayment(amount);
        p.setCancelledAt(LocalDateTime.of(2026, 9, 22, 12, 0));
        return p;
    }
}

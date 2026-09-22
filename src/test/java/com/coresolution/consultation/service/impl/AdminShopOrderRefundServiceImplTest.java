package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
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
 * {@link AdminShopOrderRefundServiceImpl} 단위 검증 — fail-closed PG 취소 증거 정책.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopOrderRefundServiceImpl (fail-closed)")
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
    @DisplayName("PAID 주문 전액 환불 — 비-IAMPORT PG 성공 후 회기 원복·포인트·REFUNDED")
    void refundPaidOrder_nonIamport_success() {
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

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(3_000L, response.getPointsRestoredMinor());
        assertEquals(350L, response.getPointsClawedBackMinor());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        InOrder inOrder = inOrder(
                paymentGatewayService, paymentService, shopOrderFulfillmentService, clientPointWalletService);
        inOrder.verify(paymentGatewayService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any());
        inOrder.verify(paymentService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any());
        inOrder.verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        inOrder.verify(clientPointWalletService).restoreRedeemOnRefund(
                TENANT, 42L, ORDER_ID, 3_000L,
                ShopCheckoutConstants.pointCommitReversalKey(ORDER_ID));
        verify(shopClientOrderRepository).save(order);
        verify(shopNotificationHelper).notifyOrderRefunded(TENANT, order);
    }

    @Test
    @DisplayName("IAMPORT 결제 — PortOne V2 cancel + 증거 확인 후 회기 원복")
    void refundPaidOrder_iamport_cancelWithEvidence() {
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

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        InOrder inOrder = inOrder(
                portOneV2PaymentCancelService, portOneV2PaymentVerifyService,
                paymentService, shopOrderFulfillmentService);
        inOrder.verify(portOneV2PaymentCancelService).cancelPayment(eq(TENANT), eq(PAYMENT_ID), any());
        inOrder.verify(portOneV2PaymentVerifyService).isCancelledOrPartialCancelled(TENANT, PAYMENT_ID);
        inOrder.verify(paymentService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any());
        inOrder.verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        verify(paymentGatewayService, never()).refundPayment(any(), any(), any());
    }

    @Test
    @DisplayName("IAMPORT — PortOne 이미 CANCELLED(멱등 cancel true + 증거) → clinic 완료")
    void refundPaidOrder_iamport_alreadyCancelled_completesClinic() {
        ShopClientOrder order = paidOrder(10_000L, 0L, 10_000L);
        Payment payment = iamportPayment(BigDecimal.valueOf(10_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, false, false, 0, 0L, 30));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentCancelService.cancelPayment(eq(TENANT), eq(PAYMENT_ID), any())).thenReturn(true);
        when(portOneV2PaymentVerifyService.isCancelledOrPartialCancelled(TENANT, PAYMENT_ID)).thenReturn(true);

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        verify(paymentService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(10_000L)), any());
        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
    }

    @Test
    @DisplayName("현금 0원 — PG NOT_APPLICABLE, 게이트웨이 미호출·회기 원복은 수행")
    void refundPaidOrder_zeroCash_skipsPg() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 0L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(new EffectivePointTenantPolicies(0L, 0L, false, false, 0, 0L, 30));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE, response.getPgRefundStatus());
        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        verify(paymentGatewayService, never()).refundPayment(any(), any(), any());
        verify(portOneV2PaymentCancelService, never()).cancelPayment(any(), any(), any());
        verify(paymentService, never()).refundPayment(any(), any(), any());
        verify(shopClientOrderRepository).save(order);
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
                        eq(TENANT), eq(42L), eq(ORDER_ID), eq(350L),
                        eq(ShopCheckoutConstants.pointClawbackKey(ORDER_ID))))
                .thenReturn(0L);
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(true);

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        assertEquals(0L, response.getPointsClawedBackMinor());
        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        verify(shopClientOrderRepository).save(order);
    }

    // ── fail-closed: PG 취소 실패 → 전체 롤백 ──

    @Nested
    @DisplayName("fail-closed: PG 취소 실패 시 Clinic REFUNDED 금지")
    class FailClosedPgCancelFailure {

        @Test
        @DisplayName("비-IAMPORT PG 환불 실패 — 회기 원복·주문 REFUNDED 미수행")
        void pgRefundFails_rollsBackCompletely() {
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
            verify(shopOrderFulfillmentService, never()).reversePaidOrderFulfillment(any(), any());
            verify(paymentService, never()).refundPayment(any(), any(), any());
            verify(clientPointWalletService, never())
                    .restoreRedeemOnRefund(any(), any(), any(), any(Long.class), any());
            verify(shopClientOrderRepository, never()).save(order);
        }

        @Test
        @DisplayName("IAMPORT PortOne cancel 실패 — 회기 원복·주문 REFUNDED 미수행")
        void portOneCancelFails_rollsBackCompletely() {
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
            verify(portOneV2PaymentVerifyService, never())
                    .isCancelledOrPartialCancelled(any(), any());
            verify(shopOrderFulfillmentService, never()).reversePaidOrderFulfillment(any(), any());
            verify(paymentService, never()).refundPayment(any(), any(), any());
            verify(shopClientOrderRepository, never()).save(order);
        }

        @Test
        @DisplayName("IAMPORT cancel 성공이지만 PortOne 증거 없음 — fail-closed 롤백")
        void portOneCancelOk_butNoEvidence_rollsBack() {
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
            verify(shopOrderFulfillmentService, never()).reversePaidOrderFulfillment(any(), any());
            verify(paymentService, never()).refundPayment(any(), any(), any());
            verify(shopClientOrderRepository, never()).save(order);
        }

        @Test
        @DisplayName("PaymentGatewayService 미주입(null) + 현금 결제 있음 — fail-closed 예외")
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

            IllegalStateException thrown = assertThrows(IllegalStateException.class,
                    () -> serviceNoGateway.refundPaidOrder(TENANT, ORDER_ID, REASON));

            assertTrue(thrown.getMessage().contains("미주입"));
            assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
            verify(shopOrderFulfillmentService, never()).reversePaidOrderFulfillment(any(), any());
            verify(paymentService, never()).refundPayment(any(), any(), any());
            verify(shopClientOrderRepository, never()).save(order);
        }
    }

    // ── Clinic chain 실패 ──

    @Test
    @DisplayName("회기 원복/EXPENSE 실패 — PG 후 Clinic incomplete(부분성공 금지)")
    void refundPaidOrder_reverseFails_afterPg_throwsClinicIncomplete() {
        ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(true);
        doThrow(new IllegalStateException("ERP EXPENSE failed"))
                .when(shopOrderFulfillmentService)
                .reversePaidOrderFulfillment(TENANT, order);

        ShopRefundClinicChainException thrown = assertThrows(
                ShopRefundClinicChainException.class,
                () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        assertEquals(ORDER_ID, thrown.getOrderPublicId());
        assertTrue(thrown.isPgCancelCompleted());
        assertEquals(ShopRefundConstants.ERROR_CODE_CLINIC_INCOMPLETE, thrown.getErrorCode());
        assertTrue(thrown.getMessage().contains("reconcile-refund"));
        assertFalse(thrown.getMessage().contains("이메일"));
        verify(paymentService).refundPayment(eq(PAYMENT_ID), eq(BigDecimal.valueOf(7_000L)), any());
        verify(shopClientOrderRepository, never()).save(order);
        verify(clientPointWalletService, never()).clawbackEarn(any(), any(), any(), any(Long.class), any());
    }

    @Test
    @DisplayName("회기 원복 DataIntegrityViolation — Clinic incomplete (이메일 문구 없음)")
    void refundPaidOrder_reverseDataIntegrity_afterPg_throwsClinicIncomplete() {
        ShopClientOrder order = paidOrder(10_000L, 0L, 7_000L);
        Payment payment = approvedPayment(BigDecimal.valueOf(7_000L));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(false);
        when(paymentGatewayService.refundPayment(eq(PAYMENT_ID), any(), any())).thenReturn(true);
        doThrow(new DataIntegrityViolationException("Duplicate entry for key 'uk_financial_transactions_dedupe'"))
                .when(shopOrderFulfillmentService)
                .reversePaidOrderFulfillment(TENANT, order);

        ShopRefundClinicChainException thrown = assertThrows(
                ShopRefundClinicChainException.class,
                () -> service.refundPaidOrder(TENANT, ORDER_ID, REASON));

        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        assertTrue(thrown.isPgCancelCompleted());
        assertFalse(thrown.getMessage().contains("이메일"));
        verify(shopClientOrderRepository, never()).save(order);
    }

    // ── 멱등 ──

    @Test
    @DisplayName("이미 REFUNDED + Payment REFUNDED 존재 — 멱등 성공·COMPLETED")
    void refundPaidOrder_alreadyRefunded_paymentRefunded_idempotent() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.of(refundedPayment(BigDecimal.valueOf(5_000L))));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_COMPLETED, response.getPgRefundStatus());
        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        verify(clientPointWalletService, never())
                .restoreRedeemOnRefund(any(), any(), any(), any(Long.class), any());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("이미 REFUNDED + Payment APPROVED(REFUNDED 없음) — NOT_APPLICABLE (증거 불충분)")
    void refundPaidOrder_alreadyRefunded_paymentStillApproved_noEvidence() {
        ShopClientOrder order = paidOrder(5_000L, 0L, 5_000L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.empty());

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE, response.getPgRefundStatus());
        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
    }

    @Test
    @DisplayName("이미 REFUNDED + 현금 0원 — NOT_APPLICABLE (PG 불필요)")
    void refundPaidOrder_alreadyRefunded_zeroCash_notApplicable() {
        ShopClientOrder order = paidOrder(5_000L, 5_000L, 0L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));

        ShopOrderRefundResponse response = service.refundPaidOrder(TENANT, ORDER_ID, REASON);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(ShopRefundConstants.PG_REFUND_STATUS_NOT_APPLICABLE, response.getPgRefundStatus());
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

    private static Payment iamportPayment(BigDecimal amount) {
        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_ID)
                .amount(amount)
                .status(Payment.PaymentStatus.APPROVED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(42L)
                .build();
        payment.setTenantId(TENANT);
        return payment;
    }

    private static Payment refundedPayment(BigDecimal amount) {
        Payment payment = Payment.builder()
                .paymentId(PAYMENT_ID)
                .orderId(ORDER_ID)
                .amount(amount)
                .status(Payment.PaymentStatus.REFUNDED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS)
                .payerId(42L)
                .build();
        payment.setTenantId(TENANT);
        return payment;
    }
}

package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderReconcileConstants;
import com.coresolution.consultation.dto.shop.admin.ShopOrderReconcilePaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentLookupService;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AdminShopOrderReconcileServiceImpl} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopOrderReconcileServiceImpl")
class AdminShopOrderReconcileServiceImplTest {

    private static final String TENANT = "tenant-reconcile";
    private static final String ORDER_ID = "order-reconcile-1";
    private static final String PORTONE_PAYMENT_ID = "portone-pay-fixture-001";
    private static final String CARD_APPROVAL = "APPROVAL-RECONCILE-001";
    private static final Long CLIENT_ID = 77L;
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

    @InjectMocks
    private AdminShopOrderReconcileServiceImpl service;

    @Test
    @DisplayName("행복한 경로 — EXPIRED 주문 + PortOne 검증 성공 → APPROVED/PAID·recovered")
    void reconcilePayment_expiredOrder_happyPath_recoversToPaid() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.EXPIRED);
        Payment pending = pendingIamportPayment("PAY_INTERNAL_OLD");
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(
                        eq(TENANT), eq(PORTONE_PAYMENT_ID), eq(BigDecimal.valueOf(CASH_DUE))))
                .thenReturn(Optional.of(VERIFY_BODY));
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PORTONE_PAYMENT_ID))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(pending));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(pending));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientShopCheckoutService.completeOrderOnPaymentApproved(TENANT, ORDER_ID)).thenAnswer(inv -> {
            order.setStatus(ShopClientOrderStatus.PAID);
            pending.setStatus(Payment.PaymentStatus.APPROVED);
            return true;
        });

        ShopOrderReconcilePaymentResponse response =
                service.reconcilePayment(TENANT, ORDER_ID, PORTONE_PAYMENT_ID, null);

        assertEquals(ORDER_ID, response.getOrderPublicId());
        assertEquals(PORTONE_PAYMENT_ID, response.getPaymentId());
        assertEquals(ShopClientOrderStatus.PAID, response.getOrderStatus());
        assertEquals(Payment.PaymentStatus.APPROVED, response.getPaymentStatus());
        assertTrue(response.isRecovered());
        assertEquals(PORTONE_PAYMENT_ID, pending.getPaymentId());
        assertEquals(VERIFY_BODY, pending.getExternalResponse());
        verify(paymentService).updatePaymentStatus(PORTONE_PAYMENT_ID, Payment.PaymentStatus.APPROVED);
        verify(clientShopCheckoutService).completeOrderOnPaymentApproved(TENANT, ORDER_ID);
        verify(portOneV2PaymentLookupService, never())
                .findPaidPaymentIdByCardApprovalNumber(any(), any(), any(), any());
    }

    @Test
    @DisplayName("cardApprovalNumber 만 — 조회→paymentId→검증 성공")
    void reconcilePayment_onlyCardApprovalNumber_lookupThenVerify() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        Payment pending = pendingIamportPayment("PAY_INTERNAL_OLD");
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentLookupService.findPaidPaymentIdByCardApprovalNumber(
                        eq(TENANT),
                        eq(CARD_APPROVAL),
                        eq(BigDecimal.valueOf(CASH_DUE)),
                        eq(ORDER_ID)))
                .thenReturn(Optional.of(PORTONE_PAYMENT_ID));
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(
                        eq(TENANT), eq(PORTONE_PAYMENT_ID), eq(BigDecimal.valueOf(CASH_DUE))))
                .thenReturn(Optional.of(VERIFY_BODY));
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PORTONE_PAYMENT_ID))
                .thenReturn(Optional.empty())
                .thenReturn(Optional.of(pending));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(pending));
        when(paymentRepository.save(any(Payment.class))).thenAnswer(inv -> inv.getArgument(0));
        when(clientShopCheckoutService.completeOrderOnPaymentApproved(TENANT, ORDER_ID)).thenAnswer(inv -> {
            order.setStatus(ShopClientOrderStatus.PAID);
            pending.setStatus(Payment.PaymentStatus.APPROVED);
            return true;
        });

        ShopOrderReconcilePaymentResponse response =
                service.reconcilePayment(TENANT, ORDER_ID, null, CARD_APPROVAL);

        assertEquals(PORTONE_PAYMENT_ID, response.getPaymentId());
        assertEquals(ShopClientOrderStatus.PAID, response.getOrderStatus());
        assertFalse(response.isRecovered());
        verify(portOneV2PaymentLookupService).findPaidPaymentIdByCardApprovalNumber(
                TENANT, CARD_APPROVAL, BigDecimal.valueOf(CASH_DUE), ORDER_ID);
        verify(paymentService).updatePaymentStatus(PORTONE_PAYMENT_ID, Payment.PaymentStatus.APPROVED);
    }

    @Test
    @DisplayName("금액 불일치·검증 empty — 주문 상태 유지·IllegalStateException")
    void reconcilePayment_verifyEmpty_doesNotMarkPaid() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentVerifyService.verifyPaidAmountBody(
                        eq(TENANT), eq(PORTONE_PAYMENT_ID), eq(BigDecimal.valueOf(CASH_DUE))))
                .thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.reconcilePayment(TENANT, ORDER_ID, PORTONE_PAYMENT_ID, null));

        assertEquals(ShopOrderReconcileConstants.MSG_PORTONE_VERIFY_FAILED, ex.getMessage());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        verify(paymentService, never()).updatePaymentStatus(any(), any());
        verify(clientShopCheckoutService, never()).completeOrderOnPaymentApproved(any(), any());
    }

    @Test
    @DisplayName("paymentId·승인번호 모두 없음 — IllegalArgumentException")
    void reconcilePayment_neitherPaymentIdNorApproval_throws() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.reconcilePayment(TENANT, ORDER_ID, null, null));

        assertEquals(ShopOrderReconcileConstants.MSG_PAYMENT_ID_OR_APPROVAL_REQUIRED, ex.getMessage());
        verify(shopClientOrderRepository, never()).findByTenantIdAndPublicId(any(), any());
    }

    @Test
    @DisplayName("paymentId blank + 승인번호 blank — IllegalArgumentException")
    void reconcilePayment_blankPaymentIdAndApproval_throws() {
        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.reconcilePayment(TENANT, ORDER_ID, "  ", "  "));

        assertEquals(ShopOrderReconcileConstants.MSG_PAYMENT_ID_OR_APPROVAL_REQUIRED, ex.getMessage());
    }

    @Test
    @DisplayName("승인번호 조회 empty — IllegalStateException")
    void reconcilePayment_approvalLookupEmpty_throws() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.EXPIRED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(portOneV2PaymentLookupService.findPaidPaymentIdByCardApprovalNumber(
                        eq(TENANT),
                        eq(CARD_APPROVAL),
                        eq(BigDecimal.valueOf(CASH_DUE)),
                        eq(ORDER_ID)))
                .thenReturn(Optional.empty());

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.reconcilePayment(TENANT, ORDER_ID, null, CARD_APPROVAL));

        assertEquals(ShopOrderReconcileConstants.MSG_APPROVAL_LOOKUP_FAILED, ex.getMessage());
        verify(portOneV2PaymentVerifyService, never()).verifyPaidAmountBody(any(), any(), any());
    }

    @Test
    @DisplayName("이미 PAID — 멱등 성공·recovered false")
    void reconcilePayment_alreadyPaid_idempotent() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.PAID);
        Payment approved = pendingIamportPayment(PORTONE_PAYMENT_ID);
        approved.setStatus(Payment.PaymentStatus.APPROVED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndPaymentIdAndIsDeletedFalse(TENANT, PORTONE_PAYMENT_ID))
                .thenReturn(Optional.of(approved));

        ShopOrderReconcilePaymentResponse response =
                service.reconcilePayment(TENANT, ORDER_ID, PORTONE_PAYMENT_ID, null);

        assertEquals(ShopClientOrderStatus.PAID, response.getOrderStatus());
        assertFalse(response.isRecovered());
        verify(portOneV2PaymentVerifyService, never()).verifyPaidAmountBody(any(), any(), any());
        verify(paymentService, never()).updatePaymentStatus(any(), any());
    }

    private static ShopClientOrder orderWithStatus(ShopClientOrderStatus status) {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(CLIENT_ID)
                .status(status)
                .subtotalMinor(CASH_DUE)
                .pointsRedeemMinor(0L)
                .cashDueMinor(CASH_DUE)
                .checkoutIdempotencyKey("idem-reconcile")
                .build();
        order.setTenantId(TENANT);
        return order;
    }

    private static Payment pendingIamportPayment(String paymentId) {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .orderId(ORDER_ID)
                .amount(BigDecimal.valueOf(CASH_DUE))
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(CLIENT_ID)
                .build();
        payment.setId(501L);
        payment.setTenantId(TENANT);
        return payment;
    }
}

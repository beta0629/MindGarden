package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopUserPaymentCancelConstants;
import com.coresolution.consultation.dto.shop.ShopUserCancelPaymentResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.exception.ForbiddenException;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.portone.PortOnePaymentPaidState;
import com.coresolution.consultation.service.portone.PortOneV2PaymentVerifyService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * {@link ClientShopPaymentCancelServiceImpl} 결제창 사용자 취소 정리 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientShopPaymentCancelServiceImpl")
class ClientShopPaymentCancelServiceImplTest {

    private static final String TENANT = "tenant-shop";
    private static final String ORDER_ID = "order-pub-cancel";
    private static final String PAYMENT_ID = "pay-cancel-1";
    private static final Long CLIENT_ID = 99L;
    private static final Long OTHER_CLIENT_ID = 100L;
    private static final Long ORDER_PK = 5L;
    private static final String SKU = "SKU-1";

    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ClientPointWalletService clientPointWalletService;
    @Mock
    private PortOneV2PaymentVerifyService portOneV2PaymentVerifyService;
    @Mock
    private PlatformTransactionManager transactionManager;

    @InjectMocks
    private ClientShopPaymentCancelServiceImpl service;

    @Test
    @DisplayName("PENDING_PAYMENT + PortOne 미승인 → 주문·결제 건 CANCELLED, hold 해제, PG 취소 없음")
    void cancelByUser_pendingNotPaid_cancelsOrderAndPayment() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 2_000L);
        Payment payment = payment(Payment.PaymentStatus.PENDING);
        stubOrder(order);
        stubLockedOrder(order);
        stubLines();
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.NOT_PAID);

        ShopUserCancelPaymentResponse res = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_CANCELLED, res.getOutcome());
        assertEquals(ShopClientOrderStatus.CANCELLED, order.getStatus());
        assertEquals(Payment.PaymentStatus.CANCELLED, payment.getStatus());
        assertNotNull(payment.getCancelledAt());
        assertEquals(ShopUserPaymentCancelConstants.PAYMENT_FAILURE_REASON_USER_CANCELLED, payment.getFailureReason());
        assertEquals(ShopCheckoutConstants.CHECKOUT_SOURCE_CART, res.getCheckoutSource());
        assertEquals(List.of(SKU), res.getSkuCodes());
        verify(clientPointWalletService).releaseHold(
                TENANT, CLIENT_ID, ORDER_ID, 2_000L, ShopCheckoutConstants.pointReleaseKey(ORDER_ID));
        verify(shopClientOrderRepository).save(order);
        verify(paymentRepository).save(payment);
    }

    @Test
    @DisplayName("PortOne 조회 PAID → 주문·결제 건 변경 없음, outcome=PAID + paymentId")
    void cancelByUser_portOnePaid_noChange() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 0L);
        Payment payment = payment(Payment.PaymentStatus.PENDING);
        stubOrder(order);
        stubLines();
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.PAID);

        ShopUserCancelPaymentResponse res = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_PAID, res.getOutcome());
        assertEquals(PAYMENT_ID, res.getPaymentId());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        assertEquals(Payment.PaymentStatus.PENDING, payment.getStatus());
        verify(shopClientOrderRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
        verify(clientPointWalletService, never()).releaseHold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("PortOne 조회 불명(UNKNOWN) → 변경 없음, outcome=UNVERIFIED")
    void cancelByUser_portOneUnknown_noChange() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 0L);
        Payment payment = payment(Payment.PaymentStatus.PENDING);
        stubOrder(order);
        stubLines();
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.UNKNOWN);

        ShopUserCancelPaymentResponse res = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_UNVERIFIED, res.getOutcome());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        verify(shopClientOrderRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }

    @Test
    @DisplayName("DB 결제 건이 이미 APPROVED → PortOne 조회 없이 변경 없음, outcome=PAID")
    void cancelByUser_dbApproved_noChange() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 0L);
        Payment payment = payment(Payment.PaymentStatus.APPROVED);
        stubOrder(order);
        stubLines();
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(payment));

        ShopUserCancelPaymentResponse res = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_PAID, res.getOutcome());
        verify(portOneV2PaymentVerifyService, never()).resolvePaidState(any(), any());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("타인 주문 → ForbiddenException(403), 아무것도 바꾸지 않음")
    void cancelByUser_otherClient_forbidden() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 0L);
        stubOrder(order);

        assertThrows(ForbiddenException.class, () -> service.cancelByUser(TENANT, OTHER_CLIENT_ID, ORDER_ID));
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        verify(paymentRepository, never()).findByTenantIdAndOrderIdAndIsDeletedFalse(any(), any());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("다른 테넌트·없는 주문 → IllegalArgumentException")
    void cancelByUser_notFound_throws() {
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID));
    }

    @Test
    @DisplayName("멱등 — 두 번 호출해도 CANCELLED, 두 번째는 저장·해제·PortOne 조회 없음")
    void cancelByUser_twice_idempotent() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 2_000L);
        Payment payment = payment(Payment.PaymentStatus.PENDING);
        stubOrder(order);
        stubLockedOrder(order);
        stubLines();
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.NOT_PAID);

        ShopUserCancelPaymentResponse first = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);
        ShopUserCancelPaymentResponse second = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(first.getOutcome(), second.getOutcome());
        assertEquals(first.getOrderStatus(), second.getOrderStatus());
        assertEquals(ShopClientOrderStatus.CANCELLED, second.getOrderStatus());
        verify(shopClientOrderRepository, times(1)).save(order);
        verify(paymentRepository, times(1)).save(payment);
        verify(portOneV2PaymentVerifyService, times(1)).resolvePaidState(TENANT, PAYMENT_ID);
        verify(clientPointWalletService, times(1)).releaseHold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("EXPIRED·PAID 등 → NOT_CANCELLABLE, 변경 없음")
    void cancelByUser_expired_notCancellable() {
        ShopClientOrder order = order(ShopClientOrderStatus.EXPIRED, 0L);
        stubOrder(order);
        stubLines();

        ShopUserCancelPaymentResponse res = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_NOT_CANCELLABLE, res.getOutcome());
        assertEquals(ShopClientOrderStatus.EXPIRED, order.getStatus());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("PortOne READY(결제 진행 중) → 주문·결제 변경 없음, outcome=NOT_CANCELLABLE_IN_PROGRESS, 주문 PENDING 유지")
    void cancelByUser_portOneReady_inProgress_noChange() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 2_000L);
        Payment payment = payment(Payment.PaymentStatus.PENDING);
        stubOrder(order);
        stubLines();
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(payment));
        when(portOneV2PaymentVerifyService.isIamportPayment(payment)).thenReturn(true);
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.IN_PROGRESS);

        ShopUserCancelPaymentResponse res = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_NOT_CANCELLABLE_IN_PROGRESS, res.getOutcome());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, res.getOrderStatus());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        assertEquals(Payment.PaymentStatus.PENDING, payment.getStatus());
        verify(shopClientOrderRepository, never()).lockByTenantIdAndPublicId(any(), any());
        verify(shopClientOrderRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
        verify(clientPointWalletService, never()).releaseHold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("조회는 미승인이었지만 잠금 후 재확인 시 APPROVED → 닫지 않음, outcome=PAID")
    void cancelByUser_approvedAfterLookup_recheckUnderLock_noChange() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 2_000L);
        Payment beforeLookup = payment(Payment.PaymentStatus.PENDING);
        beforeLookup.setId(1L);
        Payment afterApproval = payment(Payment.PaymentStatus.APPROVED);
        afterApproval.setId(1L);
        stubOrder(order);
        stubLockedOrder(order);
        stubLines();
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(beforeLookup))
                .thenReturn(List.of(afterApproval));
        when(portOneV2PaymentVerifyService.isIamportPayment(beforeLookup)).thenReturn(true);
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.NOT_PAID);

        ShopUserCancelPaymentResponse res = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_PAID, res.getOutcome());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        verify(shopClientOrderRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
        verify(clientPointWalletService, never()).releaseHold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("조회 이후 새 결제 시도가 붙음 → 닫지 않음, outcome=NOT_CANCELLABLE_IN_PROGRESS")
    void cancelByUser_newAttemptAfterLookup_inProgress() {
        ShopClientOrder order = order(ShopClientOrderStatus.PENDING_PAYMENT, 0L);
        Payment looked = payment(Payment.PaymentStatus.FAILED);
        looked.setId(1L);
        Payment newAttempt = payment(Payment.PaymentStatus.PENDING);
        newAttempt.setId(2L);
        newAttempt.setPaymentId(PAYMENT_ID + "-retry");
        stubOrder(order);
        stubLockedOrder(order);
        stubLines();
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(looked))
                .thenReturn(List.of(looked, newAttempt));
        when(portOneV2PaymentVerifyService.isIamportPayment(looked)).thenReturn(true);
        when(portOneV2PaymentVerifyService.resolvePaidState(TENANT, PAYMENT_ID))
                .thenReturn(PortOnePaymentPaidState.NOT_PAID);

        ShopUserCancelPaymentResponse res = service.cancelByUser(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopUserPaymentCancelConstants.OUTCOME_NOT_CANCELLABLE_IN_PROGRESS, res.getOutcome());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        assertEquals(Payment.PaymentStatus.PENDING, newAttempt.getStatus());
        verify(shopClientOrderRepository, never()).save(any());
        verify(paymentRepository, never()).save(any());
    }

    private void stubOrder(ShopClientOrder order) {
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
    }

    private void stubLockedOrder(ShopClientOrder order) {
        when(shopClientOrderRepository.lockByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.of(order));
    }

    private void stubLines() {
        ShopClientOrderLine line = ShopClientOrderLine.builder().skuCodeSnapshot(SKU).quantity(1).build();
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
    }

    private static ShopClientOrder order(ShopClientOrderStatus status, long pointsMinor) {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(CLIENT_ID)
                .status(status)
                .subtotalMinor(10_000L)
                .pointsRedeemMinor(pointsMinor)
                .cashDueMinor(10_000L - pointsMinor)
                .checkoutIdempotencyKey("idem-cancel")
                .checkoutSource(ShopCheckoutConstants.CHECKOUT_SOURCE_CART)
                .build();
        order.setId(ORDER_PK);
        order.setTenantId(TENANT);
        return order;
    }

    private static Payment payment(Payment.PaymentStatus status) {
        Payment payment = new Payment();
        payment.setPaymentId(PAYMENT_ID);
        payment.setOrderId(ORDER_ID);
        payment.setStatus(status);
        payment.setProvider(Payment.PaymentProvider.IAMPORT);
        payment.setTenantId(TENANT);
        return payment;
    }
}

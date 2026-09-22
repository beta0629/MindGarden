package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.ClientRegistrationConstants;
import com.coresolution.consultation.constant.PointTenantPolicyKeys;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.PaymentRequest;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.dto.shop.ShopCheckoutRequest;
import com.coresolution.consultation.dto.shop.ShopCheckoutResponse;
import com.coresolution.consultation.dto.shop.ShopOrderResponse;
import com.coresolution.consultation.dto.shop.ShopPointBalanceResponse;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.entity.ShopCart;
import com.coresolution.consultation.entity.ShopCartLine;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopCartLineRepository;
import com.coresolution.consultation.repository.ShopCartRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientProfilePhoneVerificationService;
import com.coresolution.consultation.service.ClientShopConsultantMappingService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import com.coresolution.core.service.TenantPgConfigurationService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * {@link ClientShopCheckoutServiceImpl} PG·포인트·정책 연동 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientShopCheckoutServiceImpl")
class ClientShopCheckoutServiceImplTest {

    private static final String TENANT = "tenant-shop";
    private static final String ORDER_ID = "order-pub-1";
    private static final Long CLIENT_ID = 99L;

    @Mock
    private ShopCartRepository shopCartRepository;
    @Mock
    private ShopCartLineRepository shopCartLineRepository;
    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;
    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock
    private ClientPointWalletService clientPointWalletService;
    @Mock
    private PointTenantPolicyService pointTenantPolicyService;
    @Mock
    private PaymentService paymentService;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private ClientProfilePhoneVerificationService clientProfilePhoneVerificationService;
    @Mock
    private ShopOrderFulfillmentService shopOrderFulfillmentService;
    @Mock
    private ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;
    @Mock
    private ClientShopConsultantMappingService clientShopConsultantMappingService;

    @Mock
    private ShopNotificationHelper shopNotificationHelper;

    @Mock
    private TenantPgConfigurationService tenantPgConfigurationService;

    @InjectMocks
    private ClientShopCheckoutServiceImpl service;

    @AfterEach
    void clearTransactionSynchronization() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.clearSynchronization();
        }
    }

    @Test
    @DisplayName("getOrder — fulfillmentLines·REFUNDED 상태 포함")
    void getOrder_includesFulfillmentLinesAndRefundedStatus() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId()))
                .thenReturn(List.of());
        ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_ID)
                .skuCode("SKU-C")
                .category("CONSULTATION")
                .status("COMPLETED")
                .message("done")
                .build();
        when(shopOrderFulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_ID))
                .thenReturn(List.of(event));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of());

        ShopOrderResponse response = service.getOrder(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(1, response.getFulfillmentLines().size());
        assertEquals("SKU-C", response.getFulfillmentLines().get(0).getSkuCode());
        assertEquals("CONSULTATION", response.getFulfillmentLines().get(0).getCategory());
        assertEquals("COMPLETED", response.getFulfillmentLines().get(0).getStatus());
        assertEquals(Boolean.FALSE, response.getFulfillmentLines().get(0).getRetryable());
        assertEquals(response.getFulfillmentLines(), response.getFulfillmentEvents());
        assertEquals(Boolean.FALSE, response.getClientFulfillRetryAttempted());
        assertEquals(null, response.getPaymentId());
    }

    @Test
    @DisplayName("getOrder — FAILED + retryable 메시지 → fulfillmentLines[0].retryable true")
    void getOrder_failedRetryable_setsRetryableTrueOnFulfillmentLines() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.PAID);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId()))
                .thenReturn(List.of());
        ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_ID)
                .skuCode("SKU-FAIL")
                .category("CONSULTATION")
                .status("FAILED")
                .message("Consultation ERP sync failed (retryable)")
                .build();
        when(shopOrderFulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_ID))
                .thenReturn(List.of(event));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of());

        ShopOrderResponse response = service.getOrder(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(1, response.getFulfillmentLines().size());
        assertEquals("FAILED", response.getFulfillmentLines().get(0).getStatus());
        assertEquals(Boolean.TRUE, response.getFulfillmentLines().get(0).getRetryable());
        assertEquals(response.getFulfillmentLines(), response.getFulfillmentEvents());
        assertEquals(Boolean.TRUE, response.getFulfillmentEvents().get(0).getRetryable());
    }

    @Test
    @DisplayName("getOrder — 결제 행이 있으면 paymentId·paymentStatus 포함")
    void getOrder_includesPaymentIdWhenPaymentExists() {
        ShopClientOrder order = pendingOrder(1_000L);
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        Payment payment = Payment.builder()
                .paymentId("PAY_1789716701414_178df348")
                .orderId(ORDER_ID)
                .amount(java.math.BigDecimal.valueOf(1_000L))
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(CLIENT_ID)
                .build();
        payment.setId(901L);
        payment.setTenantId(TENANT);

        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId()))
                .thenReturn(List.of());
        when(shopOrderFulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_ID))
                .thenReturn(List.of());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(payment));

        ShopOrderResponse response = service.getOrder(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals("PAY_1789716701414_178df348", response.getPaymentId());
        assertEquals("PENDING", response.getPaymentStatus());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, response.getStatus());
    }

    @Test
    @DisplayName("getOrder — 결제 없으면 paymentId·paymentStatus null")
    void getOrder_paymentAbsent_paymentIdNull() {
        ShopClientOrder order = pendingOrder(0L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(order.getId()))
                .thenReturn(List.of());
        when(shopOrderFulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_ID))
                .thenReturn(List.of());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        TENANT, ORDER_ID, Payment.PaymentStatus.REFUNDED))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of());

        ShopOrderResponse response = service.getOrder(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(null, response.getPaymentId());
        assertEquals(null, response.getPaymentStatus());
    }

    @Test
    @DisplayName("PG 승인 시 cashDue 기준 POINT_EARN")
    void completeOrderOnPaymentApproved_creditsEarnOnCashDue() {
        ShopClientOrder order = pendingOrder(5_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        stubEarnPolicies(100, 0L);

        assertTrue(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));

        verify(clientPointWalletService).creditEarn(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(ORDER_ID),
                eq(50L),
                eq(ShopCheckoutConstants.pointEarnKey(ORDER_ID)));
        verify(shopNotificationHelper).notifyOrderPaid(TENANT, order);
        verify(shopNotificationHelper).notifyPointEarned(TENANT, order, 50L);
    }

    @Test
    @DisplayName("적립 상한(earn_cap_per_order) 적용")
    void completeOrderOnPaymentApproved_earnCapApplied() {
        ShopClientOrder order = pendingOrder(0L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        stubEarnPolicies(1_000, 500L);

        assertTrue(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));

        verify(clientPointWalletService).creditEarn(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(ORDER_ID),
                eq(500L),
                eq(ShopCheckoutConstants.pointEarnKey(ORDER_ID)));
    }

    @Test
    @DisplayName("PG 승인 시 PAID·POINT_COMMIT 멱등")
    void completeOrderOnPaymentApproved_commitsPointsAndSetsPaid() {
        ShopClientOrder order = pendingOrder(5_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        stubDefaultPolicies();

        assertTrue(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));
        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        verify(clientPointWalletService).commitHold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(ORDER_ID),
                eq(5_000L),
                eq(ShopCheckoutConstants.pointCommitKey(ORDER_ID)));
        verify(shopClientOrderRepository).save(order);
        verify(shopOrderFulfillmentService, times(1)).fulfillPaidOrder(TENANT, order);
        verify(shopNotificationHelper).notifyOrderPaid(TENANT, order);
        verify(shopNotificationHelper, never()).notifyPointEarned(any(), any(), anyLong());
    }

    @Test
    @DisplayName("활성 TX 동기화 시 fulfill 은 afterCommit 이후에만 실행 (APPROVED 가시성)")
    void completeOrderOnPaymentApproved_defersFulfillUntilAfterCommit() {
        ShopClientOrder order = pendingOrder(5_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        stubDefaultPolicies();
        TransactionSynchronizationManager.initSynchronization();

        assertTrue(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));
        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        verify(shopOrderFulfillmentService, never()).fulfillPaidOrder(any(), any());

        for (TransactionSynchronization sync : TransactionSynchronizationManager.getSynchronizations()) {
            sync.afterCommit();
        }

        verify(shopOrderFulfillmentService, times(1)).fulfillPaidOrder(TENANT, order);
    }

    @Test
    @DisplayName("이미 PAID면 commit 재호출 없음·fulfillPaidOrder 1회(수리 경로)")
    void completeOrderOnPaymentApproved_alreadyPaid_retriesFulfillmentOnly() {
        ShopClientOrder order = pendingOrder(3_000L);
        order.setStatus(ShopClientOrderStatus.PAID);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        assertTrue(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));
        verify(clientPointWalletService, never()).commitHold(
                eq(TENANT), eq(CLIENT_ID), eq(ORDER_ID), eq(3_000L), eq(ShopCheckoutConstants.pointCommitKey(ORDER_ID)));
        verify(shopClientOrderRepository, never()).save(order);
        verify(shopNotificationHelper, never()).notifyOrderPaid(any(), any());
        verify(shopOrderFulfillmentService, times(1)).fulfillPaidOrder(TENANT, order);
    }

    @Test
    @DisplayName("EXPIRED 주문도 PG 승인 후 PAID 복구")
    void completeOrderOnPaymentApproved_expired_recoversToPaid() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.EXPIRED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        stubDefaultPolicies();

        assertTrue(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));
        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        verify(clientPointWalletService).commitHold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(ORDER_ID),
                eq(2_000L),
                eq(ShopCheckoutConstants.pointCommitKey(ORDER_ID)));
        verify(shopClientOrderRepository).save(order);
        verify(shopNotificationHelper).notifyOrderPaid(TENANT, order);
    }

    @Test
    @DisplayName("쇼핑 주문 없으면 false")
    void completeOrderOnPaymentApproved_noOrder_returnsFalse() {
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID)).thenReturn(Optional.empty());
        assertFalse(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));
    }

    @Test
    @DisplayName("이미 PAID면 PG 실패 hold 해제 미호출")
    void releaseOrderHoldOnPaymentFailure_alreadyPaid_noRelease() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.PAID);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        assertTrue(service.releaseOrderHoldOnPaymentFailure(TENANT, ORDER_ID));

        verify(clientPointWalletService, never()).releaseHold(any(), any(), any(), anyLong(), any());
        verify(shopClientOrderRepository, never()).save(order);
        verify(shopOrderFulfillmentService, never()).reversePaidOrderFulfillment(any(), any());
    }

    @Test
    @DisplayName("PAID 주문 PG 취소·환불 — 회기 원복 후 REFUNDED")
    void reconcileOrderOnPaymentCancelOrRefund_paid_reversesAndRefunds() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.PAID);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderRepository.save(order)).thenReturn(order);

        assertTrue(service.reconcileOrderOnPaymentCancelOrRefund(TENANT, ORDER_ID));

        assertEquals(ShopClientOrderStatus.REFUNDED, order.getStatus());
        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        verify(shopClientOrderRepository).save(order);
        verify(shopNotificationHelper).notifyOrderRefunded(TENANT, order);
    }

    @Test
    @DisplayName("이미 REFUNDED — reverse 멱등 수리만, 상태·알림 재전이 없음")
    void reconcileOrderOnPaymentCancelOrRefund_alreadyRefunded_idempotent() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        assertTrue(service.reconcileOrderOnPaymentCancelOrRefund(TENANT, ORDER_ID));

        verify(shopOrderFulfillmentService).reversePaidOrderFulfillment(TENANT, order);
        verify(shopClientOrderRepository, never()).save(order);
        verify(shopNotificationHelper, never()).notifyOrderRefunded(any(), any());
    }

    @Test
    @DisplayName("PENDING_PAYMENT PG 취소 — hold 해제·CREATED (기존 release 경로)")
    void reconcileOrderOnPaymentCancelOrRefund_pending_releasesHold() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderRepository.save(order)).thenReturn(order);

        assertTrue(service.reconcileOrderOnPaymentCancelOrRefund(TENANT, ORDER_ID));

        assertEquals(ShopClientOrderStatus.CREATED, order.getStatus());
        verify(shopOrderFulfillmentService, never()).reversePaidOrderFulfillment(any(), any());
        verify(clientPointWalletService).releaseHold(eq(TENANT), eq(CLIENT_ID), eq(ORDER_ID), eq(2_000L),
                eq(ShopCheckoutConstants.pointReleaseKey(ORDER_ID)));
    }

    @Test
    @DisplayName("CONSULTATION 라인 — 활성 매핑이 있으면 consultantClientMappingId 설정")
    void checkout_consultationLine_setsConsultantClientMappingId() {
        String idemKey = "idem-consult-mapping";
        long subtotal = 30_000L;
        ShopCartLine line = consultationCartLine(subtotal);
        ShopCart cart = line.getCart();
        long mappingId = 42L;

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, CLIENT_ID))
                .thenReturn(List.of(eligibleMapping(mappingId, ConsultantClientMapping.MappingStatus.ACTIVE)));

        ArgumentCaptor<ShopClientOrder> orderCaptor = ArgumentCaptor.forClass(ShopClientOrder.class);
        when(shopClientOrderRepository.save(orderCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        ArgumentCaptor<ShopClientOrderLine> lineCaptor = ArgumentCaptor.forClass(ShopClientOrderLine.class);
        when(shopClientOrderLineRepository.save(lineCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT), anyString()))
                .thenAnswer(inv -> Optional.of(orderCaptor.getValue()));

        ShopCheckoutResponse response = service.checkout(
                TENANT,
                CLIENT_ID,
                ShopCheckoutRequest.builder().idempotencyKey(idemKey).pointsToRedeemMinor(0L).build());

        assertEquals("PAYMENT", response.getNextStep());
        assertEquals(1, lineCaptor.getAllValues().size());
        assertEquals(mappingId, lineCaptor.getValue().getConsultantClientMappingId());
    }

    @Test
    @DisplayName("CONSULTATION 라인 — 활성 매핑 없으면 consultantClientMappingId null")
    void checkout_consultationLine_noActiveMapping_leavesNull() {
        String idemKey = "idem-consult-no-mapping";
        long subtotal = 30_000L;
        ShopCartLine line = consultationCartLine(subtotal);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, CLIENT_ID))
                .thenReturn(List.of());

        ArgumentCaptor<ShopClientOrder> orderCaptor = ArgumentCaptor.forClass(ShopClientOrder.class);
        when(shopClientOrderRepository.save(orderCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        ArgumentCaptor<ShopClientOrderLine> lineCaptor = ArgumentCaptor.forClass(ShopClientOrderLine.class);
        when(shopClientOrderLineRepository.save(lineCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT), anyString()))
                .thenAnswer(inv -> Optional.of(orderCaptor.getValue()));

        service.checkout(
                TENANT,
                CLIENT_ID,
                ShopCheckoutRequest.builder().idempotencyKey(idemKey).pointsToRedeemMinor(0L).build());

        assertEquals(1, lineCaptor.getAllValues().size());
        assertEquals(null, lineCaptor.getValue().getConsultantClientMappingId());
    }

    @Test
    @DisplayName("CONSULTATION 라인 — N>1 중 assigned 1건이면 요청 id 없이 자동 resolve")
    void checkout_consultationLine_uniqueAssignedAmongMany_autoResolves() {
        String idemKey = "idem-consult-unique-assigned";
        long subtotal = 30_000L;
        ShopCartLine line = consultationCartLine(subtotal);
        ShopCart cart = line.getCart();
        long assignedId = 42L;
        long exhaustedId = 99L;

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());
        User consultant = consultantUser(100L);
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, CLIENT_ID))
                .thenReturn(List.of(
                        eligibleMapping(assignedId, ConsultantClientMapping.MappingStatus.ACTIVE, consultant),
                        eligibleMapping(exhaustedId, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED,
                                consultant)));

        ArgumentCaptor<ShopClientOrder> orderCaptor = ArgumentCaptor.forClass(ShopClientOrder.class);
        when(shopClientOrderRepository.save(orderCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        ArgumentCaptor<ShopClientOrderLine> lineCaptor = ArgumentCaptor.forClass(ShopClientOrderLine.class);
        when(shopClientOrderLineRepository.save(lineCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT), anyString()))
                .thenAnswer(inv -> Optional.of(orderCaptor.getValue()));

        ShopCheckoutResponse response = service.checkout(
                TENANT,
                CLIENT_ID,
                ShopCheckoutRequest.builder().idempotencyKey(idemKey).pointsToRedeemMinor(0L).build());

        assertEquals("PAYMENT", response.getNextStep());
        assertEquals(assignedId, lineCaptor.getValue().getConsultantClientMappingId());
    }

    @Test
    @DisplayName("CONSULTATION 라인 — N>1·assigned 0건·요청 id 없으면 selection required")
    void checkout_consultationLine_manyEligibleZeroAssigned_requiresSelection() {
        String idemKey = "idem-consult-zero-assigned";
        long subtotal = 30_000L;
        ShopCartLine line = consultationCartLine(subtotal);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, CLIENT_ID))
                .thenReturn(List.of(
                        eligibleMapping(11L, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED),
                        eligibleMapping(12L, ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED)));

        ShopCheckoutRequest request = ShopCheckoutRequest.builder()
                .idempotencyKey(idemKey)
                .pointsToRedeemMinor(0L)
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.checkout(TENANT, CLIENT_ID, request));
        assertEquals(ShopCheckoutConstants.MSG_CONSULTANT_MAPPING_SELECTION_REQUIRED, ex.getMessage());
    }

    @Test
    @DisplayName("CONSULTATION 라인 — N>1·assigned 2건·요청 id 없으면 selection required")
    void checkout_consultationLine_twoAssigned_requiresSelection() {
        String idemKey = "idem-consult-two-assigned";
        long subtotal = 30_000L;
        ShopCartLine line = consultationCartLine(subtotal);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, CLIENT_ID))
                .thenReturn(List.of(
                        eligibleMapping(21L, ConsultantClientMapping.MappingStatus.ACTIVE, consultantUser(201L)),
                        eligibleMapping(22L, ConsultantClientMapping.MappingStatus.PENDING_PAYMENT,
                                consultantUser(202L))));

        ShopCheckoutRequest request = ShopCheckoutRequest.builder()
                .idempotencyKey(idemKey)
                .pointsToRedeemMinor(0L)
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.checkout(TENANT, CLIENT_ID, request));
        assertEquals(ShopCheckoutConstants.MSG_CONSULTANT_MAPPING_SELECTION_REQUIRED, ex.getMessage());
    }

    @Test
    @DisplayName("CONSULTATION 라인 — 동일 상담사 매핑 2건·요청 id 없으면 자동 resolve")
    void checkout_consultationLine_sameConsultantTwoMappings_autoResolves() {
        String idemKey = "idem-consult-same-consultant";
        long subtotal = 30_000L;
        ShopCartLine line = consultationCartLine(subtotal);
        ShopCart cart = line.getCart();
        User consultant = consultantUser(301L);

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());
        ConsultantClientMapping older = eligibleMapping(31L, ConsultantClientMapping.MappingStatus.ACTIVE, consultant,
                "무료1회");
        older.setStartDate(LocalDateTime.of(2026, 1, 1, 9, 0));
        ConsultantClientMapping newer = eligibleMapping(32L, ConsultantClientMapping.MappingStatus.ACTIVE, consultant,
                "E2E-1125");
        newer.setStartDate(LocalDateTime.of(2026, 2, 1, 9, 0));
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, CLIENT_ID))
                .thenReturn(List.of(older, newer));

        ArgumentCaptor<ShopClientOrder> orderCaptor = ArgumentCaptor.forClass(ShopClientOrder.class);
        when(shopClientOrderRepository.save(orderCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        ArgumentCaptor<ShopClientOrderLine> lineCaptor = ArgumentCaptor.forClass(ShopClientOrderLine.class);
        when(shopClientOrderLineRepository.save(lineCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT), anyString()))
                .thenAnswer(inv -> Optional.of(orderCaptor.getValue()));

        service.checkout(
                TENANT,
                CLIENT_ID,
                ShopCheckoutRequest.builder().idempotencyKey(idemKey).pointsToRedeemMinor(0L).build());

        assertEquals(32L, lineCaptor.getValue().getConsultantClientMappingId());
    }

    @Test
    @DisplayName("CONSULTATION 라인 — 장바구니 상품명과 packageName 일치 매핑 자동 선택")
    void checkout_consultationLine_cartTitleMatchesPackage_bindsMatchingMapping() {
        String idemKey = "idem-consult-title-bind";
        long subtotal = 30_000L;
        ShopCartLine line = consultationCartLine(subtotal);
        line.getSku().setTitle("E2E-1125");
        ShopCart cart = line.getCart();
        User consultant = consultantUser(302L);

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());
        when(clientShopConsultantMappingService.listActiveMappings(TENANT, CLIENT_ID))
                .thenReturn(List.of(
                        eligibleMapping(41L, ConsultantClientMapping.MappingStatus.ACTIVE, consultant, "무료1회"),
                        eligibleMapping(42L, ConsultantClientMapping.MappingStatus.ACTIVE, consultant, "E2E-1125")));

        ArgumentCaptor<ShopClientOrder> orderCaptor = ArgumentCaptor.forClass(ShopClientOrder.class);
        when(shopClientOrderRepository.save(orderCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        ArgumentCaptor<ShopClientOrderLine> lineCaptor = ArgumentCaptor.forClass(ShopClientOrderLine.class);
        when(shopClientOrderLineRepository.save(lineCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT), anyString()))
                .thenAnswer(inv -> Optional.of(orderCaptor.getValue()));

        service.checkout(
                TENANT,
                CLIENT_ID,
                ShopCheckoutRequest.builder().idempotencyKey(idemKey).pointsToRedeemMinor(0L).build());

        assertEquals(42L, lineCaptor.getValue().getConsultantClientMappingId());
    }

    @Test
    @DisplayName("checkout Idempotency-Key가 pointHoldKey로 hold에 전달된다")
    void checkout_idempotencyKey_mapsToPointHoldKey() {
        String idemKey = "idem-hold-map";
        long subtotal = 50_000L;
        long points = 10_000L;
        ShopCartLine line = cartLine(subtotal);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(points).heldMinor(0L).build());

        ArgumentCaptor<ShopClientOrder> orderCaptor = ArgumentCaptor.forClass(ShopClientOrder.class);
        when(shopClientOrderRepository.save(orderCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        ShopCheckoutRequest request = ShopCheckoutRequest.builder()
                .idempotencyKey(idemKey)
                .pointsToRedeemMinor(points)
                .build();

        ShopCheckoutResponse response = service.checkout(TENANT, CLIENT_ID, request);

        assertEquals("PAYMENT", response.getNextStep());
        String orderPublicId = orderCaptor.getValue().getPublicId();
        verify(clientPointWalletService).hold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(orderPublicId),
                eq(points),
                eq(ShopCheckoutConstants.pointHoldKey(idemKey)));
        verify(clientPointWalletService, never()).commitHold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("hold TTL 만료 — CREATED→EXPIRED·hold 해제")
    void expireOrderHold_pendingOrder_expiresAndReleasesHold() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.CREATED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        assertTrue(service.expireOrderHold(TENANT, ORDER_ID));
        assertEquals(ShopClientOrderStatus.EXPIRED, order.getStatus());
        verify(clientPointWalletService).releaseHold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(ORDER_ID),
                eq(2_000L),
                eq(ShopCheckoutConstants.pointReleaseKey(ORDER_ID)));
        verify(shopClientOrderRepository).save(order);
        verify(shopNotificationHelper).notifyOrderHoldExpired(TENANT, order);
    }

    @Test
    @DisplayName("hold TTL 만료 — 이미 EXPIRED면 멱등 false")
    void expireOrderHold_alreadyExpired_idempotentFalse() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.EXPIRED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        assertFalse(service.expireOrderHold(TENANT, ORDER_ID));
        verify(clientPointWalletService, never()).releaseHold(any(), any(), any(), anyLong(), any());
        verify(shopClientOrderRepository, never()).save(order);
    }

    @Test
    @DisplayName("hold TTL 만료 — PAID면 스킵")
    void expireOrderHold_paid_skips() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.PAID);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        assertFalse(service.expireOrderHold(TENANT, ORDER_ID));
        verify(clientPointWalletService, never()).releaseHold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("PG 실패 시 hold 해제·PENDING_PAYMENT→CREATED")
    void releaseOrderHoldOnPaymentFailure_releasesAndRevertsStatus() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        assertTrue(service.releaseOrderHoldOnPaymentFailure(TENANT, ORDER_ID));
        assertEquals(ShopClientOrderStatus.CREATED, order.getStatus());
        verify(clientPointWalletService).releaseHold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(ORDER_ID),
                eq(2_000L),
                eq(ShopCheckoutConstants.pointReleaseKey(ORDER_ID)));
        verify(shopClientOrderRepository).save(order);
        verify(shopNotificationHelper).notifyPaymentFailed(TENANT, order);
    }

    @Test
    @DisplayName("다른 tenantId로 취소 시 주문 없음 거부")
    void cancelOrder_crossTenant_throwsNotFound() {
        when(shopClientOrderRepository.findByTenantIdAndPublicId("tenant-other", ORDER_ID))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.cancelOrder("tenant-other", CLIENT_ID, ORDER_ID));

        assertEquals("주문을 찾을 수 없습니다.", ex.getMessage());
        verify(clientPointWalletService, never()).releaseHold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("취소 시 PENDING_PAYMENT도 hold 해제")
    void cancelOrder_pendingPayment_releasesHold() {
        ShopClientOrder order = pendingOrder(1_000L);
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        service.cancelOrder(TENANT, CLIENT_ID, ORDER_ID);

        ArgumentCaptor<ShopClientOrder> saved = ArgumentCaptor.forClass(ShopClientOrder.class);
        verify(shopClientOrderRepository).save(saved.capture());
        assertEquals(ShopClientOrderStatus.CANCELLED, saved.getValue().getStatus());
        verify(clientPointWalletService).releaseHold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(ORDER_ID),
                eq(1_000L),
                eq(ShopCheckoutConstants.pointReleaseKey(ORDER_ID)));
    }

    @Test
    @DisplayName("포인트 전액 체크아웃 시 즉시 PAID·hold·commit")
    void checkout_pointsOnly_paidImmediately() {
        String idemKey = "idem-points-full";
        long subtotal = 10_000L;
        ShopCartLine line = cartLine(subtotal);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubEarnPolicies(100, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(subtotal).heldMinor(0L).build());

        ArgumentCaptor<ShopClientOrder> orderCaptor = ArgumentCaptor.forClass(ShopClientOrder.class);
        when(shopClientOrderRepository.save(orderCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT), anyString()))
                .thenAnswer(inv -> Optional.of(orderCaptor.getValue()));

        ShopCheckoutRequest request = ShopCheckoutRequest.builder()
                .idempotencyKey(idemKey)
                .pointsToRedeemMinor(subtotal)
                .build();

        ShopCheckoutResponse response = service.checkout(TENANT, CLIENT_ID, request);

        assertEquals("DONE", response.getNextStep());
        assertEquals(ShopClientOrderStatus.PAID, response.getStatus());
        assertEquals(0L, response.getCashDueMinor());
        assertEquals(subtotal, response.getPointsRedeemMinor());

        String orderPublicId = orderCaptor.getValue().getPublicId();
        verify(clientPointWalletService).hold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(orderPublicId),
                eq(subtotal),
                eq(ShopCheckoutConstants.pointHoldKey(idemKey)));
        verify(clientPointWalletService).commitHold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(orderPublicId),
                eq(subtotal),
                eq(ShopCheckoutConstants.pointCommitKey(orderPublicId)));
        verify(clientPointWalletService).creditEarn(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(orderPublicId),
                eq(100L),
                eq(ShopCheckoutConstants.pointEarnKey(orderPublicId)));
        verify(shopCartLineRepository).hardDeleteByCartId(cart.getId());
        verify(paymentService, never()).createPayment(any());
        verify(paymentService, never()).getPayment(any());
        verify(paymentRepository, never())
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        anyString(), anyString(), any());
    }

    @Test
    @DisplayName("cashDue>0 체크아웃 시 장바구니를 비우지 않는다")
    void checkout_cashDue_doesNotClearCart() {
        String idemKey = "idem-cash-keep-cart";
        long subtotal = 50_000L;
        ShopCartLine line = cartLine(subtotal);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());

        ArgumentCaptor<ShopClientOrder> orderCaptor = ArgumentCaptor.forClass(ShopClientOrder.class);
        when(shopClientOrderRepository.save(orderCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));
        when(shopClientOrderRepository.findByTenantIdAndPublicId(eq(TENANT), anyString()))
                .thenAnswer(inv -> Optional.of(orderCaptor.getValue()));

        ShopCheckoutResponse response = service.checkout(
                TENANT,
                CLIENT_ID,
                ShopCheckoutRequest.builder().idempotencyKey(idemKey).pointsToRedeemMinor(0L).build());

        assertEquals("PAYMENT", response.getNextStep());
        assertEquals(ShopClientOrderStatus.CREATED, response.getStatus());
        verify(shopCartLineRepository, never()).hardDeleteByCartId(anyLong());
        verify(clientPointWalletService, never()).commitHold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("PG 승인(PAID) 시 장바구니를 비운다")
    void completeOrderOnPaymentApproved_clearsCart() {
        ShopClientOrder order = pendingOrder(0L);
        ShopCart cart = ShopCart.builder().clientId(CLIENT_ID).build();
        cart.setId(7L);
        cart.setTenantId(TENANT);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        stubDefaultPolicies();

        assertTrue(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));

        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
        verify(shopCartLineRepository).hardDeleteByCartId(7L);
    }

    @Test
    @DisplayName("빈 장바구니 체크아웃은 fail-closed 메시지")
    void checkout_emptyCart_throwsExactMessage() {
        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, "idem-empty"))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.empty());

        IllegalArgumentException missing = assertThrows(
                IllegalArgumentException.class,
                () -> service.checkout(
                        TENANT,
                        CLIENT_ID,
                        ShopCheckoutRequest.builder()
                                .idempotencyKey("idem-empty")
                                .pointsToRedeemMinor(0L)
                                .build()));
        assertEquals("장바구니가 비어 있습니다.", missing.getMessage());

        ShopCart emptyCart = ShopCart.builder().clientId(CLIENT_ID).build();
        emptyCart.setId(3L);
        emptyCart.setTenantId(TENANT);
        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, "idem-empty-lines"))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(emptyCart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(emptyCart.getId())).thenReturn(List.of());

        IllegalArgumentException emptyLines = assertThrows(
                IllegalArgumentException.class,
                () -> service.checkout(
                        TENANT,
                        CLIENT_ID,
                        ShopCheckoutRequest.builder()
                                .idempotencyKey("idem-empty-lines")
                                .pointsToRedeemMinor(0L)
                                .build()));
        assertEquals("장바구니가 비어 있습니다.", emptyLines.getMessage());
        verify(shopCartLineRepository, never()).hardDeleteByCartId(anyLong());
    }

    @Test
    @DisplayName("다른 tenantId로 preparePayment 시 주문 없음 거부")
    void preparePayment_crossTenant_throwsNotFound() {
        when(shopClientOrderRepository.findByTenantIdAndPublicId("tenant-other", ORDER_ID))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.preparePayment(
                        "tenant-other",
                        CLIENT_ID,
                        ORDER_ID,
                        ShopPreparePaymentRequest.builder().build()));

        assertEquals("주문을 찾을 수 없습니다.", ex.getMessage());
        verify(paymentService, never()).createPayment(any());
        verify(paymentService, never()).getPayment(any());
    }

    @Test
    @DisplayName("preparePayment — 휴대폰 미인증 사용자는 fail-closed")
    void preparePayment_unverifiedPhone_throws() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.CREATED);
        order.setCashDueMinor(10_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        User user = User.builder()
                .email("buyer@test.com")
                .name("홍길동")
                .phone("enc-01012345678")
                .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_ID)).thenReturn(Optional.of(user));
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)).thenReturn(false);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.preparePayment(
                        TENANT,
                        CLIENT_ID,
                        ORDER_ID,
                        ShopPreparePaymentRequest.builder().build()));
        assertEquals(ShopCheckoutConstants.MSG_PHONE_VERIFICATION_REQUIRED, ex.getMessage());
        verify(paymentService, never()).createPayment(any());
        verify(paymentRepository, never())
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(any(), any(), any());
    }

    @Test
    @DisplayName("preparePayment — phone VERIFIED(PROFILE/OAuth) 이면 createPayment 호출")
    void preparePayment_verifiedPhone_proceeds() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.CREATED);
        order.setCashDueMinor(10_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                eq(TENANT), eq(ORDER_ID), any()))
                .thenReturn(Optional.empty());

        User user = User.builder()
                .email("buyer@test.com")
                .name("홍길동")
                .phone("enc-01012345678")
                .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_ID)).thenReturn(Optional.of(user));
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)).thenReturn(true);
        when(tenantPgConfigurationService.getActiveConfigurationByProvider(eq(TENANT), any()))
                .thenReturn(null);
        when(paymentService.createPayment(any())).thenReturn(
                com.coresolution.consultation.dto.PaymentResponse.builder()
                        .paymentId("pay-1")
                        .amount(java.math.BigDecimal.valueOf(10_000L))
                        .status("PENDING")
                        .build());
        when(shopClientOrderRepository.save(any(ShopClientOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.preparePayment(
                TENANT,
                CLIENT_ID,
                ORDER_ID,
                ShopPreparePaymentRequest.builder().build());

        assertEquals("pay-1", response.getPaymentId());
        assertEquals("buyer@test.com", response.getCustomerEmail());
        assertEquals("홍길동", response.getCustomerName());
        ArgumentCaptor<PaymentRequest> captor = ArgumentCaptor.forClass(PaymentRequest.class);
        verify(paymentService).createPayment(captor.capture());
        assertEquals("buyer@test.com", captor.getValue().getCustomerEmail());
    }

    @Test
    @DisplayName("preparePayment — 이메일 null + 인증 휴대폰이면 합성 이메일로 createPayment")
    void preparePayment_nullEmail_verifiedPhone_usesSyntheticEmail() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.CREATED);
        order.setCashDueMinor(10_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                eq(TENANT), eq(ORDER_ID), any()))
                .thenReturn(Optional.empty());

        User user = User.builder()
                .email(null)
                .name(null)
                .phone("enc-01012345678")
                .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_ID)).thenReturn(Optional.of(user));
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)).thenReturn(true);
        when(clientProfilePhoneVerificationService.findNormalizedPhoneDigits(user))
                .thenReturn(Optional.of("01012345678"));
        when(tenantPgConfigurationService.getActiveConfigurationByProvider(eq(TENANT), any()))
                .thenReturn(null);
        when(paymentService.createPayment(any())).thenReturn(
                com.coresolution.consultation.dto.PaymentResponse.builder()
                        .paymentId("pay-synth-1")
                        .amount(java.math.BigDecimal.valueOf(10_000L))
                        .status("PENDING")
                        .build());
        when(shopClientOrderRepository.save(any(ShopClientOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        String expectedEmail = ClientRegistrationConstants.buildSyntheticEmail(
                "01012345678",
                ClientRegistrationConstants.sanitizeTenantIdForSyntheticEmailDomain(TENANT),
                0);

        var response = service.preparePayment(
                TENANT,
                CLIENT_ID,
                ORDER_ID,
                ShopPreparePaymentRequest.builder().build());

        assertEquals(expectedEmail, response.getCustomerEmail());
        assertEquals(ShopCheckoutConstants.DEFAULT_PAYMENT_CUSTOMER_NAME, response.getCustomerName());
        ArgumentCaptor<PaymentRequest> captor = ArgumentCaptor.forClass(PaymentRequest.class);
        verify(paymentService).createPayment(captor.capture());
        assertEquals(expectedEmail, captor.getValue().getCustomerEmail());
        assertEquals(ShopCheckoutConstants.DEFAULT_PAYMENT_CUSTOMER_NAME, captor.getValue().getCustomerName());
        assertTrue(expectedEmail.contains(ClientRegistrationConstants.SYNTHETIC_EMAIL_DOMAIN_SUFFIX));
        assertFalse(expectedEmail.contains("mindgarden.com"));
    }

    @Test
    @DisplayName("preparePayment — 실이메일이 있으면 합성 이메일보다 우선")
    void preparePayment_realEmail_preferredOverSynthetic() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.CREATED);
        order.setCashDueMinor(10_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                eq(TENANT), eq(ORDER_ID), any()))
                .thenReturn(Optional.empty());

        User user = User.builder()
                .email("real@oauth.test")
                .name("실명")
                .phone("enc-01099998888")
                .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_ID)).thenReturn(Optional.of(user));
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)).thenReturn(true);
        when(tenantPgConfigurationService.getActiveConfigurationByProvider(eq(TENANT), any()))
                .thenReturn(null);
        when(paymentService.createPayment(any())).thenReturn(
                com.coresolution.consultation.dto.PaymentResponse.builder()
                        .paymentId("pay-real-1")
                        .amount(java.math.BigDecimal.valueOf(10_000L))
                        .status("PENDING")
                        .build());
        when(shopClientOrderRepository.save(any(ShopClientOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.preparePayment(
                TENANT,
                CLIENT_ID,
                ORDER_ID,
                ShopPreparePaymentRequest.builder().build());

        assertEquals("real@oauth.test", response.getCustomerEmail());
        assertEquals("실명", response.getCustomerName());
        ArgumentCaptor<PaymentRequest> captor = ArgumentCaptor.forClass(PaymentRequest.class);
        verify(paymentService).createPayment(captor.capture());
        assertEquals("real@oauth.test", captor.getValue().getCustomerEmail());
        verify(clientProfilePhoneVerificationService, never()).findNormalizedPhoneDigits(any());
    }

    @Test
    @DisplayName("preparePayment — PENDING_PAYMENT 이면 기존 paymentId 재사용(createPayment 없음)")
    void preparePayment_pendingPayment_reusesExistingPaymentId() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        order.setCashDueMinor(10_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        Payment existing = Payment.builder()
                .paymentId("pay-reuse-1")
                .orderId(ORDER_ID)
                .amount(java.math.BigDecimal.valueOf(10_000L))
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(CLIENT_ID)
                .build();
        existing.setId(501L);
        existing.setTenantId(TENANT);
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT, ORDER_ID, Payment.PaymentStatus.PENDING))
                .thenReturn(Optional.of(existing));

        User user = User.builder()
                .email("buyer@test.com")
                .name("홍길동")
                .phone("enc-01012345678")
                .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_ID)).thenReturn(Optional.of(user));
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)).thenReturn(true);
        when(paymentService.getPayment("pay-reuse-1")).thenReturn(
                com.coresolution.consultation.dto.PaymentResponse.builder()
                        .paymentId("pay-reuse-1")
                        .amount(java.math.BigDecimal.valueOf(10_000L))
                        .status("PENDING")
                        .provider(Payment.PaymentProvider.IAMPORT)
                        .build());
        when(tenantPgConfigurationService.getActiveConfigurationByProvider(eq(TENANT), any()))
                .thenReturn(null);

        var response = service.preparePayment(
                TENANT,
                CLIENT_ID,
                ORDER_ID,
                ShopPreparePaymentRequest.builder().build());

        assertEquals("pay-reuse-1", response.getPaymentId());
        verify(paymentService).getPayment("pay-reuse-1");
        verify(paymentService, never()).createPayment(any());
        verify(shopClientOrderRepository, never()).save(any(ShopClientOrder.class));
    }

    @Test
    @DisplayName("preparePayment — EXPIRED + 연결 Payment 있으면 동일 paymentId 반환(createPayment never)")
    void preparePayment_expired_withLinkedPayment_returnsSamePaymentId() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.EXPIRED);
        order.setCashDueMinor(10_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        Payment linked = Payment.builder()
                .paymentId("pay-expired-1")
                .orderId(ORDER_ID)
                .amount(java.math.BigDecimal.valueOf(10_000L))
                .status(Payment.PaymentStatus.PENDING)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(CLIENT_ID)
                .build();
        linked.setId(701L);
        linked.setTenantId(TENANT);
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(linked));

        User user = User.builder()
                .email("buyer@test.com")
                .name("홍길동")
                .phone("enc-01012345678")
                .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_ID)).thenReturn(Optional.of(user));
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)).thenReturn(true);
        when(paymentService.getPayment("pay-expired-1")).thenReturn(
                com.coresolution.consultation.dto.PaymentResponse.builder()
                        .paymentId("pay-expired-1")
                        .amount(java.math.BigDecimal.valueOf(10_000L))
                        .status("PENDING")
                        .provider(Payment.PaymentProvider.IAMPORT)
                        .build());
        when(tenantPgConfigurationService.getActiveConfigurationByProvider(eq(TENANT), any()))
                .thenReturn(null);

        var response = service.preparePayment(
                TENANT,
                CLIENT_ID,
                ORDER_ID,
                ShopPreparePaymentRequest.builder().build());

        assertEquals("pay-expired-1", response.getPaymentId());
        verify(paymentService).getPayment("pay-expired-1");
        verify(paymentService, never()).createPayment(any());
        verify(shopClientOrderRepository, never()).save(any(ShopClientOrder.class));
    }

    @Test
    @DisplayName("preparePayment — EXPIRED + 연결 Payment 없으면 fail-closed")
    void preparePayment_expired_withoutPayment_throws() {
        ShopClientOrder order = pendingOrder(0L);
        order.setStatus(ShopClientOrderStatus.EXPIRED);
        order.setCashDueMinor(10_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of());

        User user = User.builder()
                .email("buyer@test.com")
                .name("홍길동")
                .phone("enc-01012345678")
                .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_ID)).thenReturn(Optional.of(user));
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)).thenReturn(true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.preparePayment(
                        TENANT,
                        CLIENT_ID,
                        ORDER_ID,
                        ShopPreparePaymentRequest.builder().build()));

        assertEquals(ShopCheckoutConstants.MSG_PREPARE_EXPIRED_WITHOUT_PAYMENT, ex.getMessage());
        verify(paymentService, never()).createPayment(any());
        verify(paymentService, never()).getPayment(any());
    }

    @Test
    @DisplayName("preparePayment — PENDING_PAYMENT + FAILED Payment 이면 heal→CREATED 후 createPayment 재시도")
    void preparePayment_pendingWithFailedPayment_healsAndCreatesNewPayment() {
        ShopClientOrder order = pendingOrder(2_000L);
        order.setStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        order.setCashDueMinor(10_000L);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        Payment failed = Payment.builder()
                .paymentId("pay-failed-1")
                .orderId(ORDER_ID)
                .amount(java.math.BigDecimal.valueOf(10_000L))
                .status(Payment.PaymentStatus.FAILED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(CLIENT_ID)
                .build();
        failed.setId(901L);
        failed.setTenantId(TENANT);

        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT, ORDER_ID, Payment.PaymentStatus.PENDING))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(failed));

        User user = User.builder()
                .email("buyer@test.com")
                .name("홍길동")
                .phone("enc-01012345678")
                .build();
        user.setId(CLIENT_ID);
        user.setTenantId(TENANT);
        when(userRepository.findByTenantIdAndId(TENANT, CLIENT_ID)).thenReturn(Optional.of(user));
        when(clientProfilePhoneVerificationService.isPhoneVerifiedForPayment(user)).thenReturn(true);
        when(tenantPgConfigurationService.getActiveConfigurationByProvider(eq(TENANT), any()))
                .thenReturn(null);
        when(paymentService.createPayment(any())).thenReturn(
                com.coresolution.consultation.dto.PaymentResponse.builder()
                        .paymentId("pay-retry-1")
                        .amount(java.math.BigDecimal.valueOf(10_000L))
                        .status("PENDING")
                        .build());
        when(shopClientOrderRepository.save(any(ShopClientOrder.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.preparePayment(
                TENANT,
                CLIENT_ID,
                ORDER_ID,
                ShopPreparePaymentRequest.builder().build());

        assertEquals("pay-retry-1", response.getPaymentId());
        assertEquals(ShopClientOrderStatus.PENDING_PAYMENT, order.getStatus());
        verify(clientPointWalletService).releaseHold(
                eq(TENANT),
                eq(CLIENT_ID),
                eq(ORDER_ID),
                eq(2_000L),
                eq(ShopCheckoutConstants.pointReleaseKey(ORDER_ID)));
        verify(paymentService).createPayment(any());
        verify(paymentService, never()).getPayment(any());
        verify(shopNotificationHelper).notifyPaymentFailed(TENANT, order);
    }

    @Test
    @DisplayName("체크아웃 멱등 키 중복 시 hold 재호출 없음")
    void checkout_duplicateIdempotencyKey_noSecondHold() {
        ShopClientOrder existing = pendingOrder(5_000L);
        existing.setCashDueMinor(0L);
        existing.setStatus(ShopClientOrderStatus.PAID);

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, "idem-dup"))
                .thenReturn(Optional.of(existing));

        ShopCheckoutResponse response = service.checkout(
                TENANT,
                CLIENT_ID,
                ShopCheckoutRequest.builder().idempotencyKey("idem-dup").pointsToRedeemMinor(5_000L).build());

        assertEquals(ShopClientOrderStatus.PAID, response.getStatus());
        verify(clientPointWalletService, never()).hold(any(), any(), any(), anyLong(), any());
        verify(shopCartRepository, never()).findByTenantIdAndClientId(any(), any());
    }

    @Test
    @DisplayName("allow_points_only=false면 포인트 전액 체크아웃 거부")
    void checkout_pointsOnlyDisallowed_throws() {
        String idemKey = "idem-no-points-only";
        ShopCartLine line = cartLine(10_000L);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(false, true, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(10_000L).heldMinor(0L).build());

        ShopCheckoutRequest request = ShopCheckoutRequest.builder()
                .idempotencyKey(idemKey)
                .pointsToRedeemMinor(10_000L)
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.checkout(TENANT, CLIENT_ID, request));
        assertEquals("포인트만으로 결제할 수 없습니다. 카드 결제를 이용해 주세요.", ex.getMessage());
        verify(clientPointWalletService, never()).hold(any(), any(), any(), anyLong(), any());
    }

    @Test
    @DisplayName("min_order_for_redeem 미달 시 포인트 사용 거부")
    void checkout_belowMinOrderForRedeem_throws() {
        String idemKey = "idem-min-order";
        ShopCartLine line = cartLine(3_000L);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, true, 5_000L, 0L);

        ShopCheckoutRequest request = ShopCheckoutRequest.builder()
                .idempotencyKey(idemKey)
                .pointsToRedeemMinor(1_000L)
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.checkout(TENANT, CLIENT_ID, request));
        assertEquals("포인트 사용 가능 최소 주문 금액은 5000원입니다.", ex.getMessage());
    }

    @Test
    @DisplayName("카드 현금 청구액이 MIN_PAYMENT_AMOUNT 미만이면 거부(금액 명시)")
    void checkout_cashDueBelowMinPayment_throws() {
        String idemKey = "idem-min-cash";
        ShopCartLine line = cartLine(800L);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubDefaultPolicies();
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(0L).heldMinor(0L).build());

        ShopCheckoutRequest request = ShopCheckoutRequest.builder()
                .idempotencyKey(idemKey)
                .pointsToRedeemMinor(0L)
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.checkout(TENANT, CLIENT_ID, request));
        assertEquals(ShopCheckoutConstants.msgCashBelowMinPayment(), ex.getMessage());
        assertTrue(ex.getMessage().contains("1,000"));
    }

    @Test
    @DisplayName("allow_pg_mix=false면 혼합 결제 거부")
    void checkout_pgMixDisallowed_throws() {
        String idemKey = "idem-no-mix";
        ShopCartLine line = cartLine(10_000L);
        ShopCart cart = line.getCart();

        when(shopClientOrderRepository.findByTenantClientAndCheckoutKey(TENANT, CLIENT_ID, idemKey))
                .thenReturn(Optional.empty());
        when(shopCartRepository.findByTenantIdAndClientId(TENANT, CLIENT_ID)).thenReturn(Optional.of(cart));
        when(shopCartLineRepository.findByCart_IdAndIsDeletedFalse(cart.getId()))
                .thenReturn(List.of(line));
        stubPolicies(true, false, 0L, 0L);
        when(clientPointWalletService.getBalance(TENANT, CLIENT_ID))
                .thenReturn(ShopPointBalanceResponse.builder().availableMinor(5_000L).heldMinor(0L).build());

        ShopCheckoutRequest request = ShopCheckoutRequest.builder()
                .idempotencyKey(idemKey)
                .pointsToRedeemMinor(5_000L)
                .build();

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class, () -> service.checkout(TENANT, CLIENT_ID, request));
        assertEquals(
                "포인트와 카드 결제를 동시에 사용할 수 없습니다. 포인트 전액 또는 카드 전액으로 결제해 주세요.",
                ex.getMessage());
    }

    private void stubDefaultPolicies() {
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(EffectivePointTenantPolicies.fromPoliciesMap(PointTenantPolicyKeys.defaultPolicies()));
    }

    private void stubEarnPolicies(int earnRatePercentBps, long earnCapMinor) {
        Map<String, Object> policies = new LinkedHashMap<>(PointTenantPolicyKeys.defaultPolicies());
        policies.put(PointTenantPolicyKeys.EARN_RATE, Map.of("percentBps", earnRatePercentBps));
        policies.put(PointTenantPolicyKeys.EARN_CAP_PER_ORDER, Map.of("amountMinor", earnCapMinor));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(EffectivePointTenantPolicies.fromPoliciesMap(policies));
    }

    private void stubPolicies(
            boolean allowPointsOnly, boolean allowPgMix, long minOrderMinor, long maxRedeemMinor) {
        Map<String, Object> policies = new LinkedHashMap<>(PointTenantPolicyKeys.defaultPolicies());
        policies.put(PointTenantPolicyKeys.ALLOW_POINTS_ONLY, allowPointsOnly);
        policies.put(PointTenantPolicyKeys.ALLOW_PG_MIX, allowPgMix);
        policies.put(PointTenantPolicyKeys.MIN_ORDER_FOR_REDEEM, Map.of("amountMinor", minOrderMinor));
        policies.put(PointTenantPolicyKeys.MAX_REDEEM_PER_ORDER, Map.of("amountMinor", maxRedeemMinor));
        when(pointTenantPolicyService.getEffectivePoliciesTyped(TENANT))
                .thenReturn(EffectivePointTenantPolicies.fromPoliciesMap(policies));
    }

    private static User consultantUser(long id) {
        User user = User.builder()
                .userId("consultant-" + id)
                .email("c" + id + "@example.com")
                .password("p")
                .name("enc")
                .role(UserRole.CONSULTANT)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        user.setId(id);
        return user;
    }

    private static ConsultantClientMapping eligibleMapping(
            long id, ConsultantClientMapping.MappingStatus status) {
        return eligibleMapping(id, status, null);
    }

    private static ConsultantClientMapping eligibleMapping(
            long id, ConsultantClientMapping.MappingStatus status, User consultant) {
        return eligibleMapping(id, status, consultant, null);
    }

    private static ConsultantClientMapping eligibleMapping(
            long id,
            ConsultantClientMapping.MappingStatus status,
            User consultant,
            String packageName) {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .consultant(consultant)
                .status(status)
                .packageName(packageName)
                .build();
        mapping.setId(id);
        return mapping;
    }

    private static ShopCartLine consultationCartLine(long unitPriceMinor) {
        ShopCartLine line = cartLine(unitPriceMinor);
        line.getSku().setCatalogCategory(ShopCatalogCategory.CONSULTATION);
        return line;
    }

    private static ShopCartLine cartLine(long unitPriceMinor) {
        ShopCart cart = ShopCart.builder().clientId(CLIENT_ID).build();
        cart.setId(1L);
        cart.setTenantId(TENANT);

        ShopCatalogSku sku = ShopCatalogSku.builder()
                .skuCode("SKU-1")
                .title("상품")
                .unitPriceMinor(unitPriceMinor)
                .sessionCount(10)
                .build();
        sku.setId(10L);
        sku.setTenantId(TENANT);

        ShopCartLine line = ShopCartLine.builder().cart(cart).sku(sku).quantity(1).build();
        line.setId(100L);
        return line;
    }

    private static ShopClientOrder pendingOrder(long pointsMinor) {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(CLIENT_ID)
                .status(ShopClientOrderStatus.PENDING_PAYMENT)
                .subtotalMinor(10_000L)
                .pointsRedeemMinor(pointsMinor)
                .cashDueMinor(10_000L - pointsMinor)
                .checkoutIdempotencyKey("idem-1")
                .build();
        order.setTenantId(TENANT);
        return order;
    }
}

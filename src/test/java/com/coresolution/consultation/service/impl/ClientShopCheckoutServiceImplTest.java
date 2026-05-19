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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import com.coresolution.consultation.constant.PointTenantPolicyKeys;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.EffectivePointTenantPolicies;
import com.coresolution.consultation.dto.shop.ShopCheckoutRequest;
import com.coresolution.consultation.dto.shop.ShopCheckoutResponse;
import com.coresolution.consultation.dto.shop.ShopOrderResponse;
import com.coresolution.consultation.dto.shop.ShopPointBalanceResponse;
import com.coresolution.consultation.dto.shop.ShopPreparePaymentRequest;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.entity.ShopCart;
import com.coresolution.consultation.entity.ShopCartLine;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopCartLineRepository;
import com.coresolution.consultation.repository.ShopCartRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ClientPointWalletService;
import com.coresolution.consultation.service.ClientShopConsultantMappingService;
import com.coresolution.consultation.service.PaymentService;
import com.coresolution.consultation.service.PointTenantPolicyService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.ShopOrderFulfillmentService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

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
    private ShopOrderFulfillmentService shopOrderFulfillmentService;
    @Mock
    private ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;
    @Mock
    private ClientShopConsultantMappingService clientShopConsultantMappingService;

    @Mock
    private ShopNotificationHelper shopNotificationHelper;

    @InjectMocks
    private ClientShopCheckoutServiceImpl service;

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

        ShopOrderResponse response = service.getOrder(TENANT, CLIENT_ID, ORDER_ID);

        assertEquals(ShopClientOrderStatus.REFUNDED, response.getStatus());
        assertEquals(1, response.getFulfillmentLines().size());
        assertEquals("SKU-C", response.getFulfillmentLines().get(0).getSkuCode());
        assertEquals("CONSULTATION", response.getFulfillmentLines().get(0).getCategory());
        assertEquals("COMPLETED", response.getFulfillmentLines().get(0).getStatus());
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
        verify(shopNotificationHelper).notifyOrderPaid(TENANT, order);
        verify(shopNotificationHelper, never()).notifyPointEarned(any(), any(), anyLong());
    }

    @Test
    @DisplayName("이미 PAID면 commit 재호출 없음(멱등)")
    void completeOrderOnPaymentApproved_alreadyPaid_noOp() {
        ShopClientOrder order = pendingOrder(3_000L);
        order.setStatus(ShopClientOrderStatus.PAID);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        assertTrue(service.completeOrderOnPaymentApproved(TENANT, ORDER_ID));
        verify(clientPointWalletService, never()).commitHold(
                eq(TENANT), eq(CLIENT_ID), eq(ORDER_ID), eq(3_000L), eq(ShopCheckoutConstants.pointCommitKey(ORDER_ID)));
        verify(shopClientOrderRepository, never()).save(order);
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
        when(clientShopConsultantMappingService.listActiveMappingIds(TENANT, CLIENT_ID))
                .thenReturn(List.of(mappingId));

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
        when(clientShopConsultantMappingService.listActiveMappingIds(TENANT, CLIENT_ID))
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
        verify(paymentService, never()).createPayment(any());
        verify(paymentService, never()).getPayment(any());
        verify(paymentRepository, never())
                .findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        anyString(), anyString(), any());
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

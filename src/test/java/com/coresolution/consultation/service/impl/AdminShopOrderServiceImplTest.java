package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminSummaryItem;
import com.coresolution.consultation.entity.AuditLog;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.AuditLogService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

/**
 * {@link AdminShopOrderServiceImpl} soft-delete·목록 deletable 가드 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopOrderServiceImpl soft-delete")
class AdminShopOrderServiceImplTest {

    private static final String TENANT = "tenant-shop-del-1";
    private static final String ORDER_ID = "order-del-public-1";

    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;

    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;

    @Mock
    private ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private AuditLogService auditLogService;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private AdminShopOrderServiceImpl service;

    @Test
    @DisplayName("softDelete — CANCELLED·라이브 결제 없음 허용·라인 soft-delete·감사 로그")
    void softDelete_whenCancelled_softDeletesAndAudits() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.CANCELLED);
        ShopClientOrderLine line = ShopClientOrderLine.builder().lineNo(1).build();
        line.setId(11L);

        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of());
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(7L))
                .thenReturn(List.of(line));
        when(auditLogService.record(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        service.softDeleteOrder(TENANT, ORDER_ID);

        assertTrue(Boolean.TRUE.equals(order.getIsDeleted()));
        assertTrue(Boolean.TRUE.equals(line.getIsDeleted()));
        verify(shopClientOrderRepository).save(order);
        verify(shopClientOrderLineRepository).save(line);

        ArgumentCaptor<AuditLog> auditCaptor = ArgumentCaptor.forClass(AuditLog.class);
        verify(auditLogService).record(auditCaptor.capture());
        AuditLog audit = auditCaptor.getValue();
        assertEquals(AuditAction.SHOP_ORDER_SOFT_DELETE, audit.getAction());
        assertEquals(ShopAdminOrderConstants.AUDIT_ENTITY_TYPE, audit.getEntityType());
        assertEquals(7L, audit.getEntityId());
        assertEquals(TENANT, audit.getTenantId());
    }

    @Test
    @DisplayName("softDelete — PAID 거부")
    void softDelete_whenPaid_throws() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.PAID);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.softDeleteOrder(TENANT, ORDER_ID));
        assertEquals(ShopAdminOrderConstants.MSG_DELETE_DENIED_PAID, ex.getMessage());
        verify(shopClientOrderRepository, never()).save(any());
        verify(auditLogService, never()).record(any());
    }

    @Test
    @DisplayName("softDelete — 결제 PENDING(in-flight) 거부")
    void softDelete_whenPaymentPending_throws() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(paymentWithStatus(Payment.PaymentStatus.PENDING)));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.softDeleteOrder(TENANT, ORDER_ID));
        assertEquals(ShopAdminOrderConstants.MSG_DELETE_DENIED_LIVE_PAYMENT, ex.getMessage());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("softDelete — 결제 PROCESSING(in-flight) 거부")
    void softDelete_whenPaymentProcessing_throws() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.CANCELLED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(paymentWithStatus(Payment.PaymentStatus.PROCESSING)));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.softDeleteOrder(TENANT, ORDER_ID));
        assertEquals(ShopAdminOrderConstants.MSG_DELETE_DENIED_LIVE_PAYMENT, ex.getMessage());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("softDelete — PENDING_PAYMENT + APPROVED 결제 거부")
    void softDelete_whenPendingPaymentOrderWithApprovedPayment_throws() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.PENDING_PAYMENT);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(paymentWithStatus(Payment.PaymentStatus.APPROVED)));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.softDeleteOrder(TENANT, ORDER_ID));
        assertEquals(ShopAdminOrderConstants.MSG_DELETE_DENIED_LIVE_PAYMENT, ex.getMessage());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("softDelete — CANCELLED + APPROVED 결제 거부")
    void softDelete_whenCancelledWithApprovedPayment_throws() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.CANCELLED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(paymentWithStatus(Payment.PaymentStatus.APPROVED)));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.softDeleteOrder(TENANT, ORDER_ID));
        assertEquals(ShopAdminOrderConstants.MSG_DELETE_DENIED_LIVE_PAYMENT, ex.getMessage());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("softDelete — REFUNDED 주문·결제 없음 허용")
    void softDelete_whenRefunded_succeeds() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of());
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(7L))
                .thenReturn(List.of());
        when(auditLogService.record(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        service.softDeleteOrder(TENANT, ORDER_ID);

        assertTrue(Boolean.TRUE.equals(order.getIsDeleted()));
        verify(shopClientOrderRepository).save(order);
        verify(auditLogService).record(any(AuditLog.class));
    }

    @Test
    @DisplayName("softDelete — REFUNDED 주문 + REFUNDED 결제 허용")
    void softDelete_whenRefundedOrderWithRefundedPayment_succeeds() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.REFUNDED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(paymentWithStatus(Payment.PaymentStatus.REFUNDED)));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(7L))
                .thenReturn(List.of());
        when(auditLogService.record(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        service.softDeleteOrder(TENANT, ORDER_ID);

        assertTrue(Boolean.TRUE.equals(order.getIsDeleted()));
        verify(shopClientOrderRepository).save(order);
        verify(auditLogService).record(any(AuditLog.class));
    }

    @Test
    @DisplayName("softDelete — CANCELLED + FAILED 결제만 있으면 허용")
    void softDelete_whenCancelledWithFailedPaymentOnly_succeeds() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.CANCELLED);
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(paymentWithStatus(Payment.PaymentStatus.FAILED)));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(7L))
                .thenReturn(List.of());
        when(auditLogService.record(any(AuditLog.class))).thenAnswer(inv -> inv.getArgument(0));

        service.softDeleteOrder(TENANT, ORDER_ID);

        assertTrue(Boolean.TRUE.equals(order.getIsDeleted()));
        verify(shopClientOrderRepository).save(order);
    }

    @Test
    @DisplayName("listRecentOrders — PAID deletable=false, CREATED deletable=true")
    void listRecentOrders_setsDeletableFlags() {
        ShopClientOrder paid = orderWithStatus(ShopClientOrderStatus.PAID);
        paid.setPublicId("paid-1");
        ShopClientOrder created = orderWithStatus(ShopClientOrderStatus.CREATED);
        created.setPublicId("created-1");
        created.setId(8L);

        when(shopClientOrderRepository.findRecentByTenant(eq(TENANT), any(PageRequest.class)))
                .thenReturn(List.of(paid, created));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq("paid-1"), eq(Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq("paid-1"), eq(Payment.PaymentStatus.REFUNDED)))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "paid-1"))
                .thenReturn(List.of());
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "created-1"))
                .thenReturn(List.of());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq("created-1"), eq(Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq("created-1"), eq(Payment.PaymentStatus.REFUNDED)))
                .thenReturn(Optional.empty());

        List<ShopOrderAdminSummaryItem> items = service.listRecentOrders(TENANT, 50);

        assertEquals(2, items.size());
        assertFalse(items.get(0).isDeletable());
        assertTrue(items.get(1).isDeletable());
    }

    @Test
    @DisplayName("listRecentOrders — CANCELLED + APPROVED 결제면 deletable=false")
    void listRecentOrders_whenCancelledWithApprovedPayment_deletableFalse() {
        ShopClientOrder cancelled = orderWithStatus(ShopClientOrderStatus.CANCELLED);
        cancelled.setPublicId("cancelled-approved-1");

        when(shopClientOrderRepository.findRecentByTenant(eq(TENANT), any(PageRequest.class)))
                .thenReturn(List.of(cancelled));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "cancelled-approved-1"))
                .thenReturn(List.of(paymentWithStatus(Payment.PaymentStatus.APPROVED)));

        List<ShopOrderAdminSummaryItem> items = service.listRecentOrders(TENANT, 50);

        assertEquals(1, items.size());
        assertFalse(items.get(0).isDeletable());
    }

    @Test
    @DisplayName("listRecentOrders — REFUNDED + pgAmount 100000 요약에 포함")
    void listRecentOrders_includesPaymentStatusAndPgAmount() {
        ShopClientOrder refunded = orderWithStatus(ShopClientOrderStatus.REFUNDED);
        refunded.setPublicId("refunded-ssot-1");
        refunded.setSubtotalMinor(10_000L);
        refunded.setCashDueMinor(10_000L);

        Payment refundedPayment = Payment.builder()
                .paymentId("portone-refund-1")
                .orderId("refunded-ssot-1")
                .amount(BigDecimal.valueOf(100_000L))
                .status(Payment.PaymentStatus.REFUNDED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(42L)
                .build();
        refundedPayment.setId(900L);
        refundedPayment.setTenantId(TENANT);

        when(shopClientOrderRepository.findRecentByTenant(eq(TENANT), any(PageRequest.class)))
                .thenReturn(List.of(refunded));
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq("refunded-ssot-1"), eq(Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq("refunded-ssot-1"), eq(Payment.PaymentStatus.REFUNDED)))
                .thenReturn(Optional.of(refundedPayment));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "refunded-ssot-1"))
                .thenReturn(List.of(refundedPayment));

        List<ShopOrderAdminSummaryItem> items = service.listRecentOrders(TENANT, 50);

        assertEquals(1, items.size());
        assertEquals(ShopClientOrderStatus.REFUNDED, items.get(0).getStatus());
        assertEquals(Payment.PaymentStatus.REFUNDED.name(), items.get(0).getPaymentStatus());
        assertEquals(100_000L, items.get(0).getPgAmount());
        assertEquals(com.coresolution.consultation.dto.PaymentSource.ONLINE, items.get(0).getPaymentSource());
    }

    @Test
    @DisplayName("getOrderDetail — APPROVED 결제가 있으면 paymentId·paymentStatus 노출")
    void getOrderDetail_whenApprovedPaymentExists_exposesPaymentFields() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.PAID);
        Payment approved = Payment.builder()
                .paymentId("portone-pay-detail-001")
                .orderId(ORDER_ID)
                .amount(BigDecimal.valueOf(10_000L))
                .status(Payment.PaymentStatus.APPROVED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(42L)
                .build();
        approved.setId(501L);
        approved.setTenantId(TENANT);

        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(7L))
                .thenReturn(Collections.emptyList());
        when(shopOrderFulfillmentEventRepository
                        .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(TENANT, ORDER_ID))
                .thenReturn(Collections.emptyList());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq(ORDER_ID), eq(Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.of(approved));

        ShopOrderAdminDetailResponse detail = service.getOrderDetail(TENANT, ORDER_ID);

        assertEquals(ORDER_ID, detail.getOrderPublicId());
        assertEquals("portone-pay-detail-001", detail.getPaymentId());
        assertEquals(Payment.PaymentStatus.APPROVED.name(), detail.getPaymentStatus());
        assertEquals(10_000L, detail.getPgAmount());
        assertFalse(detail.isDeletable());
    }

    @Test
    @DisplayName("getOrderDetail — 결제 없으면 paymentId·paymentStatus null")
    void getOrderDetail_whenNoPayment_leavesPaymentFieldsNull() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.PAID);

        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(7L))
                .thenReturn(Collections.emptyList());
        when(shopOrderFulfillmentEventRepository
                        .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(TENANT, ORDER_ID))
                .thenReturn(Collections.emptyList());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq(ORDER_ID), eq(Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.empty());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq(ORDER_ID), eq(Payment.PaymentStatus.REFUNDED)))
                .thenReturn(Optional.empty());
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of());

        ShopOrderAdminDetailResponse detail = service.getOrderDetail(TENANT, ORDER_ID);

        assertNull(detail.getPaymentId());
        assertNull(detail.getPaymentStatus());
        assertNull(detail.getPgAmount());
    }

    private static ShopClientOrder orderWithStatus(ShopClientOrderStatus status) {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(42L)
                .status(status)
                .subtotalMinor(10_000L)
                .pointsRedeemMinor(0L)
                .cashDueMinor(10_000L)
                .checkoutIdempotencyKey("idem-1")
                .build();
        order.setId(7L);
        order.setTenantId(TENANT);
        order.setIsDeleted(false);
        return order;
    }

    private static Payment paymentWithStatus(Payment.PaymentStatus status) {
        return Payment.builder()
                .orderId(ORDER_ID)
                .status(status)
                .build();
    }
}

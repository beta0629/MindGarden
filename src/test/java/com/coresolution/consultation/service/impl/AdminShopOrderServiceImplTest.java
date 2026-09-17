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

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.constant.ShopAdminOrderConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
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
    @DisplayName("softDelete — CANCELLED 허용·라인 soft-delete·감사 로그")
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
    @DisplayName("softDelete — 결제 PROCESSING(환불 진행) 거부")
    void softDelete_whenPaymentProcessing_throws() {
        ShopClientOrder order = orderWithStatus(ShopClientOrderStatus.CANCELLED);
        Payment processing = Payment.builder()
                .orderId(ORDER_ID)
                .status(Payment.PaymentStatus.PROCESSING)
                .build();
        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, ORDER_ID))
                .thenReturn(List.of(processing));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.softDeleteOrder(TENANT, ORDER_ID));
        assertEquals(ShopAdminOrderConstants.MSG_DELETE_DENIED_REFUND_IN_PROGRESS, ex.getMessage());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("softDelete — REFUNDED 허용")
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
    @DisplayName("listRecentOrders — PAID deletable=false, CREATED deletable=true")
    void listRecentOrders_setsDeletableFlags() {
        ShopClientOrder paid = orderWithStatus(ShopClientOrderStatus.PAID);
        paid.setPublicId("paid-1");
        ShopClientOrder created = orderWithStatus(ShopClientOrderStatus.CREATED);
        created.setPublicId("created-1");
        created.setId(8L);

        when(shopClientOrderRepository.findRecentByTenant(eq(TENANT), any(PageRequest.class)))
                .thenReturn(List.of(paid, created));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(TENANT, "created-1"))
                .thenReturn(List.of());

        List<ShopOrderAdminSummaryItem> items = service.listRecentOrders(TENANT, 50);

        assertEquals(2, items.size());
        assertFalse(items.get(0).isDeletable());
        assertTrue(items.get(1).isDeletable());
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
}

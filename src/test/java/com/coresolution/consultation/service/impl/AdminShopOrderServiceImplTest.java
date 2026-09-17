package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.dto.shop.admin.ShopOrderAdminDetailResponse;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.ClientShopCheckoutService;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AdminShopOrderServiceImpl} — 상세 paymentId 매핑 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminShopOrderServiceImpl")
class AdminShopOrderServiceImplTest {

    private static final String TENANT = "tenant-admin-shop-detail";
    private static final String ORDER_ID = "order-admin-detail-1";
    private static final String PORTONE_PAYMENT_ID = "portone-pay-detail-001";
    private static final Long CLIENT_ID = 42L;
    private static final long CASH_DUE = 10_000L;

    @Mock
    private ShopClientOrderRepository shopClientOrderRepository;

    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;

    @Mock
    private ShopOrderFulfillmentEventRepository shopOrderFulfillmentEventRepository;

    @Mock
    private PaymentRepository paymentRepository;

    @Mock
    private ClientShopCheckoutService clientShopCheckoutService;

    @InjectMocks
    private AdminShopOrderServiceImpl service;

    @Test
    @DisplayName("getOrderDetail — APPROVED 결제가 있으면 paymentId·paymentStatus 노출")
    void getOrderDetail_whenApprovedPaymentExists_exposesPaymentFields() {
        ShopClientOrder order = paidOrder();
        order.setId(11L);
        Payment approved = approvedPayment(PORTONE_PAYMENT_ID, 501L);

        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(11L))
                .thenReturn(Collections.emptyList());
        when(shopOrderFulfillmentEventRepository
                        .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(TENANT, ORDER_ID))
                .thenReturn(Collections.emptyList());
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq(ORDER_ID), eq(Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.of(approved));

        ShopOrderAdminDetailResponse detail = service.getOrderDetail(TENANT, ORDER_ID);

        assertEquals(ORDER_ID, detail.getOrderPublicId());
        assertEquals(PORTONE_PAYMENT_ID, detail.getPaymentId());
        assertEquals(Payment.PaymentStatus.APPROVED.name(), detail.getPaymentStatus());
        verify(paymentRepository).findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                TENANT, ORDER_ID, Payment.PaymentStatus.APPROVED);
    }

    @Test
    @DisplayName("getOrderDetail — 결제 없으면 paymentId·paymentStatus null")
    void getOrderDetail_whenNoPayment_leavesPaymentFieldsNull() {
        ShopClientOrder order = paidOrder();
        order.setId(12L);

        when(shopClientOrderRepository.findByTenantIdAndPublicId(TENANT, ORDER_ID))
                .thenReturn(Optional.of(order));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(12L))
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
    }

    private static ShopClientOrder paidOrder() {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_ID)
                .clientId(CLIENT_ID)
                .status(ShopClientOrderStatus.PAID)
                .subtotalMinor(CASH_DUE)
                .pointsRedeemMinor(0L)
                .cashDueMinor(CASH_DUE)
                .checkoutIdempotencyKey("idem-admin-detail")
                .build();
        order.setTenantId(TENANT);
        return order;
    }

    private static Payment approvedPayment(String paymentId, long id) {
        Payment payment = Payment.builder()
                .paymentId(paymentId)
                .orderId(ORDER_ID)
                .amount(BigDecimal.valueOf(CASH_DUE))
                .status(Payment.PaymentStatus.APPROVED)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .payerId(CLIENT_ID)
                .build();
        payment.setId(id);
        payment.setTenantId(TENANT);
        return payment;
    }
}

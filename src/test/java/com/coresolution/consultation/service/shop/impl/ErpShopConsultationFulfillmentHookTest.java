package com.coresolution.consultation.service.shop.impl;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.service.AdminService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ErpShopConsultationFulfillmentHook} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ErpShopConsultationFulfillmentHook")
class ErpShopConsultationFulfillmentHookTest {

    private static final String TENANT = "tenant-erp-hook";
    private static final String ORDER_PUBLIC_ID = "order-erp-1";
    private static final Long MAPPING_ID = 55L;
    private static final long LINE_TOTAL = 150_000L;

    @Mock
    private AdminService adminService;

    @InjectMocks
    private ErpShopConsultationFulfillmentHook hook;

    @Test
    @DisplayName("mappingId 있으면 confirmPayment(4arg) 1회 호출")
    void onConsultationPackagePaid_withMappingId_callsConfirmPayment() {
        ShopConsultationFulfillmentContext context = ShopConsultationFulfillmentContext.builder()
                .tenantId(TENANT)
                .orderPublicId(ORDER_PUBLIC_ID)
                .clientUserId(10L)
                .skuCode("SKU-PKG")
                .lineTotalMinor(LINE_TOTAL)
                .mappingId(MAPPING_ID)
                .build();

        hook.onConsultationPackagePaid(context);

        verify(adminService).confirmPayment(
                eq(MAPPING_ID),
                eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                eq(ShopCheckoutConstants.consultationPaymentReference(ORDER_PUBLIC_ID)),
                eq(LINE_TOTAL));
    }

    @Test
    @DisplayName("mappingId 없으면 confirmPayment 미호출")
    void onConsultationPackagePaid_noMappingId_skipsConfirmPayment() {
        ShopConsultationFulfillmentContext context = ShopConsultationFulfillmentContext.builder()
                .tenantId(TENANT)
                .orderPublicId(ORDER_PUBLIC_ID)
                .clientUserId(10L)
                .skuCode("SKU-PKG")
                .lineTotalMinor(LINE_TOTAL)
                .build();

        hook.onConsultationPackagePaid(context);

        verify(adminService, never()).confirmPayment(
                eq(MAPPING_ID),
                eq(PaymentConstants.METHOD_CARD),
                eq(ORDER_PUBLIC_ID),
                eq(LINE_TOTAL));
    }
}

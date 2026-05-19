package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopOrderFulfillmentMessages;
import com.coresolution.consultation.constant.ShopOrderFulfillmentStatus;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ShopOrderFulfillmentServiceImpl} 단위 검증.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ShopOrderFulfillmentServiceImpl")
class ShopOrderFulfillmentServiceImplTest {

    private static final String TENANT = "tenant-fulfill";
    private static final String ORDER_PUBLIC_ID = "order-fulfill-1";
    private static final Long CLIENT_ID = 42L;
    private static final Long ORDER_PK = 7L;
    private static final Long MAPPING_ID = 99L;

    @Mock
    private ShopOrderFulfillmentEventRepository fulfillmentEventRepository;
    @Mock
    private ShopClientOrderLineRepository shopClientOrderLineRepository;
    @Mock
    private ShopConsultationFulfillmentHook consultationFulfillmentHook;

    @InjectMocks
    private ShopOrderFulfillmentServiceImpl service;

    @Test
    @DisplayName("CONSULTATION 라인 — mappingId 없으면 SKIPPED, 훅 미호출")
    void fulfillPaidOrder_consultation_noMapping_skippedWithoutHook() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line = orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, null);
        when(fulfillmentEventRepository.existsByTenantIdAndOrderPublicIdAndIsDeletedFalse(TENANT, ORDER_PUBLIC_ID))
                .thenReturn(false);
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));

        service.fulfillPaidOrder(TENANT, order);

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent saved = eventCaptor.getValue();
        assertEquals(ShopOrderFulfillmentStatus.SKIPPED, saved.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_MAPPING_MISSING_SKIPPED, saved.getMessage());
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
    }

    @Test
    @DisplayName("CONSULTATION 라인 + mappingId — COMPLETED 이벤트·훅 1회")
    void fulfillPaidOrder_consultation_withMapping_completesAndInvokesHook() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        when(fulfillmentEventRepository.existsByTenantIdAndOrderPublicIdAndIsDeletedFalse(TENANT, ORDER_PUBLIC_ID))
                .thenReturn(false);
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));

        service.fulfillPaidOrder(TENANT, order);

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent saved = eventCaptor.getValue();
        assertEquals(ORDER_PUBLIC_ID, saved.getOrderPublicId());
        assertEquals("SKU-CONSULT", saved.getSkuCode());
        assertEquals(ShopCatalogCategory.CONSULTATION, saved.getCategory());
        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, saved.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED, saved.getMessage());

        verify(consultationFulfillmentHook).onConsultationPackagePaid(eq(ShopConsultationFulfillmentContext.builder()
                .tenantId(TENANT)
                .orderPublicId(ORDER_PUBLIC_ID)
                .clientUserId(CLIENT_ID)
                .skuCode("SKU-CONSULT")
                .lineTotalMinor(100_000L)
                .mappingId(MAPPING_ID)
                .build()));
    }

    @Test
    @DisplayName("동일 주문 재호출 — 멱등 스킵")
    void fulfillPaidOrder_duplicateOrder_skips() {
        when(fulfillmentEventRepository.existsByTenantIdAndOrderPublicIdAndIsDeletedFalse(TENANT, ORDER_PUBLIC_ID))
                .thenReturn(true);

        service.fulfillPaidOrder(TENANT, paidOrder());

        verify(shopClientOrderLineRepository, never()).findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(any());
        verify(fulfillmentEventRepository, never()).save(any());
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
    }

    @Test
    @DisplayName("ASSESSMENT 라인 — PENDING, 훅 미호출")
    void fulfillPaidOrder_assessment_pendingWithoutHook() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line = orderLine("SKU-ASSESS", ShopCatalogCategory.ASSESSMENT, 50_000L, null);
        when(fulfillmentEventRepository.existsByTenantIdAndOrderPublicIdAndIsDeletedFalse(TENANT, ORDER_PUBLIC_ID))
                .thenReturn(false);
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));

        service.fulfillPaidOrder(TENANT, order);

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent saved = eventCaptor.getValue();
        assertEquals(ShopOrderFulfillmentStatus.PENDING, saved.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.ASSESSMENT_PENDING_PHASE3, saved.getMessage());
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
    }

    private static ShopClientOrder paidOrder() {
        ShopClientOrder order = ShopClientOrder.builder()
                .publicId(ORDER_PUBLIC_ID)
                .clientId(CLIENT_ID)
                .build();
        order.setId(ORDER_PK);
        return order;
    }

    private static ShopClientOrderLine orderLine(
            String skuCode, String category, long lineTotal, Long mappingId) {
        ShopCatalogSku sku = ShopCatalogSku.builder()
                .skuCode(skuCode)
                .catalogCategory(category)
                .build();
        return ShopClientOrderLine.builder()
                .sku(sku)
                .skuCodeSnapshot(skuCode)
                .lineTotalMinor(lineTotal)
                .consultantClientMappingId(mappingId)
                .build();
    }
}

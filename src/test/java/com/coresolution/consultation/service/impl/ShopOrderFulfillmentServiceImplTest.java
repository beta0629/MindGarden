package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopOrderFulfillmentMessages;
import com.coresolution.consultation.constant.ShopOrderFulfillmentStatus;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

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

    @Mock
    private ShopNotificationHelper shopNotificationHelper;

    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @Mock
    private StatusCodeHelper statusCodeHelper;

    @Mock
    private AdminService adminService;

    /** JDBC 없이 TransactionTemplate(REQUIRES_NEW) 콜백만 수행 */
    private final PlatformTransactionManager noopTransactionManager = new AbstractPlatformTransactionManager() {
        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
        }
    };

    private ShopOrderFulfillmentServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new ShopOrderFulfillmentServiceImpl(
                fulfillmentEventRepository,
                shopClientOrderLineRepository,
                consultationFulfillmentHook,
                shopNotificationHelper,
                consultantClientMappingRepository,
                statusCodeHelper,
                adminService,
                noopTransactionManager);
    }

    @Test
    @DisplayName("CONSULTATION 라인 — mappingId 없으면 FAILED, 훅 미호출")
    void fulfillPaidOrder_consultation_noMapping_failedWithoutHook() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line = orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, null);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(Collections.emptyList());
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));

        service.fulfillPaidOrder(TENANT, order);

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent saved = eventCaptor.getValue();
        assertEquals(ShopOrderFulfillmentStatus.FAILED, saved.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_MAPPING_MISSING_FAILED, saved.getMessage());
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
    }

    @Test
    @DisplayName("CONSULTATION 라인 + mappingId — COMPLETED 이벤트·훅 1회")
    void fulfillPaidOrder_consultation_withMapping_completesAndInvokesHook() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(Collections.emptyList());
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
                .sessionsToGrant(10)
                .build()));
        verify(shopNotificationHelper).notifyFulfillmentCompleted(TENANT, order, null, "SKU-CONSULT");
    }

    @Test
    @DisplayName("훅 RuntimeException — REQUIRES_NEW 격리 후 FAILED 기록·fulfill 예외 미전파(UnexpectedRollback 방지)")
    void fulfillPaidOrder_hookThrows_recordsFailedNotCompleted() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(Collections.emptyList());
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        doThrow(new IllegalStateException("mapping not active"))
                .when(consultationFulfillmentHook)
                .onConsultationPackagePaid(any());

        assertDoesNotThrow(() -> service.fulfillPaidOrder(TENANT, order));

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent saved = eventCaptor.getValue();
        assertEquals(ShopOrderFulfillmentStatus.FAILED, saved.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED, saved.getMessage());
        verify(shopNotificationHelper, never()).notifyFulfillmentCompleted(any(), any(), any(), any());
    }

    @Test
    @DisplayName("FAILED 이벤트 존재 시 재시도 — 훅 재호출·이벤트 갱신")
    void fulfillPaidOrder_afterFailed_retriesHook() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failedEvent = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        failedEvent.setTenantId(TENANT);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failedEvent));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));

        service.fulfillPaidOrder(TENANT, order);

        verify(consultationFulfillmentHook, times(1)).onConsultationPackagePaid(any());
        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        assertEquals(failedEvent, eventCaptor.getValue());
        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, failedEvent.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED, failedEvent.getMessage());
    }

    @Test
    @DisplayName("COMPLETED 이벤트 존재 — 멱등 스킵")
    void fulfillPaidOrder_completed_idempotentSkip() {
        ShopOrderFulfillmentEvent completed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(completed));

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
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(Collections.emptyList());
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

    @Test
    @DisplayName("전액 환불 원복 — COMPLETED 상담 라인 회기 차감·REVERSED·paymentStatus REFUNDED")
    void reversePaidOrderFulfillment_completedConsultation_reversesSessions() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        event.setTenantId(TENANT);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .totalSessions(15)
                .remainingSessions(12)
                .usedSessions(3)
                .paymentAmount(100_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .status(ConsultantClientMapping.MappingStatus.ACTIVE)
                .build();
        mapping.setId(MAPPING_ID);

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(event));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(
                        MappingStatusConstants.PAYMENT_STATUS_GROUP, MappingStatusConstants.REFUNDED))
                .thenReturn(MappingStatusConstants.REFUNDED);

        service.reversePaidOrderFulfillment(TENANT, order);

        assertEquals(5, mapping.getTotalSessions());
        assertEquals(2, mapping.getRemainingSessions());
        assertEquals(ConsultantClientMapping.PaymentStatus.REFUNDED, mapping.getPaymentStatus());
        assertEquals(100_000L, mapping.getPaymentAmount());
        assertEquals(ShopOrderFulfillmentStatus.REVERSED, event.getStatus());
        verify(fulfillmentEventRepository).save(event);
        verify(consultantClientMappingRepository).save(mapping);
        verify(adminService).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON);
    }

    @Test
    @DisplayName("전액 환불 원복 재호출 — 이미 REVERSED면 이벤트 미저장, paymentStatus REFUNDED 수리")
    void reversePaidOrderFulfillment_alreadyReversed_repairsPaymentStatus() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.REVERSED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_SESSIONS_REVERSED)
                .build();
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .totalSessions(1)
                .remainingSessions(0)
                .usedSessions(1)
                .paymentAmount(100_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .status(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
                .build();
        mapping.setId(MAPPING_ID);

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(event));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(
                        MappingStatusConstants.PAYMENT_STATUS_GROUP, MappingStatusConstants.REFUNDED))
                .thenReturn(MappingStatusConstants.REFUNDED);

        service.reversePaidOrderFulfillment(TENANT, order);

        assertEquals(ConsultantClientMapping.PaymentStatus.REFUNDED, mapping.getPaymentStatus());
        assertEquals(100_000L, mapping.getPaymentAmount());
        verify(fulfillmentEventRepository, never()).save(any());
        verify(consultantClientMappingRepository).save(mapping);
        verify(adminService).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON);
    }

    @Test
    @DisplayName("전액 환불 — 동일 mappingId 중복 라인도 ERP 환불 1회만 호출")
    void reversePaidOrderFulfillment_duplicateMappingIds_erpRefundOnce() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line1 =
                orderLine("SKU-CONSULT-A", ShopCatalogCategory.CONSULTATION, 50_000L, MAPPING_ID);
        ShopClientOrderLine line2 =
                orderLine("SKU-CONSULT-B", ShopCatalogCategory.CONSULTATION, 50_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent event1 = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT-A")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        event1.setTenantId(TENANT);
        ShopOrderFulfillmentEvent event2 = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT-B")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        event2.setTenantId(TENANT);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .totalSessions(20)
                .remainingSessions(20)
                .usedSessions(0)
                .paymentAmount(100_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .status(ConsultantClientMapping.MappingStatus.ACTIVE)
                .build();
        mapping.setId(MAPPING_ID);

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(event1, event2));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line1, line2));
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(
                        MappingStatusConstants.PAYMENT_STATUS_GROUP, MappingStatusConstants.REFUNDED))
                .thenReturn(MappingStatusConstants.REFUNDED);

        service.reversePaidOrderFulfillment(TENANT, order);

        verify(adminService, times(1)).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON);
    }

    @Test
    @DisplayName("전액 환불 — PENDING 이벤트도 REVERSED (COMPLETED 잔존 방지)")
    void reversePaidOrderFulfillment_pendingAlsoReversed() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line = orderLine("SKU-ASSESS", ShopCatalogCategory.ASSESSMENT, 50_000L, null);
        ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-ASSESS")
                .category(ShopCatalogCategory.ASSESSMENT)
                .status(ShopOrderFulfillmentStatus.PENDING)
                .message(ShopOrderFulfillmentMessages.ASSESSMENT_PENDING_PHASE3)
                .build();
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(event));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));

        service.reversePaidOrderFulfillment(TENANT, order);

        assertEquals(ShopOrderFulfillmentStatus.REVERSED, event.getStatus());
        verify(fulfillmentEventRepository).save(event);
        verify(consultantClientMappingRepository, never()).save(any());
        verify(adminService, never()).createShopOrderMappingRefundExpense(any(), any(), any());
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
                .sessionCount(10)
                .build();
        return ShopClientOrderLine.builder()
                .sku(sku)
                .skuCodeSnapshot(skuCode)
                .sessionCountSnapshot(10)
                .quantity(1)
                .lineTotalMinor(lineTotal)
                .consultantClientMappingId(mappingId)
                .build();
    }
}

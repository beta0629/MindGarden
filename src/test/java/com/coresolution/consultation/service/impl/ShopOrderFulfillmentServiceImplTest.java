package com.coresolution.consultation.service.impl;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.spy;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.constant.MappingStatusConstants;
import com.coresolution.consultation.constant.ShopCatalogCategory;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import com.coresolution.consultation.constant.ShopOrderFulfillmentMessages;
import com.coresolution.consultation.constant.ShopOrderFulfillmentRetryConstants;
import com.coresolution.consultation.constant.ShopOrderFulfillmentStatus;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.ShopCatalogSku;
import com.coresolution.consultation.entity.ShopClientOrder;
import com.coresolution.consultation.entity.ShopClientOrderLine;
import com.coresolution.consultation.entity.ShopOrderFulfillmentEvent;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.ShopClientOrderLineRepository;
import com.coresolution.consultation.repository.ShopClientOrderRepository;
import com.coresolution.consultation.repository.ShopOrderFulfillmentEventRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ShopNotificationHelper;
import com.coresolution.consultation.service.shop.ShopConsultationFulfillmentHook;
import com.coresolution.consultation.service.shop.impl.ErpShopConsultationFulfillmentHook;
import com.coresolution.core.util.StatusCodeHelper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
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
    private ShopClientOrderRepository shopClientOrderRepository;
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
                shopClientOrderRepository,
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
        stubIncomeEnsureMapping();

        service.fulfillPaidOrder(TENANT, order);

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent saved = eventCaptor.getValue();
        assertEquals(ORDER_PUBLIC_ID, saved.getOrderPublicId());
        assertEquals("SKU-CONSULT", saved.getSkuCode());
        assertEquals(ShopCatalogCategory.CONSULTATION, saved.getCategory());
        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, saved.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED, saved.getMessage());
        assertFalse(saved.getMessage().toLowerCase().contains("confirm-payment"));
        assertTrue(saved.getMessage().toLowerCase().contains("deposit income"));

        verify(consultationFulfillmentHook).onConsultationPackagePaid(eq(ShopConsultationFulfillmentContext.builder()
                .tenantId(TENANT)
                .orderPublicId(ORDER_PUBLIC_ID)
                .clientUserId(CLIENT_ID)
                .skuCode("SKU-CONSULT")
                .titleSnapshot("SKU-CONSULT")
                .lineTotalMinor(100_000L)
                .cashDueMinor(0L)
                .mappingId(MAPPING_ID)
                .sessionsToGrant(10)
                .build()));
        verify(adminService).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
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
        assertTrue(saved.getMessage().startsWith(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED));
        assertTrue(saved.getMessage().contains("mapping not active"));
        assertTrue(ShopOrderFulfillmentRetryConstants.isRetryableFailed(saved.getStatus(), saved.getMessage()));
        verify(adminService, never()).ensureConsultationDepositIncome(any());
        verify(shopNotificationHelper, never()).notifyFulfillmentCompleted(any(), any(), any(), any());
    }

    @Test
    @DisplayName("회기 훅 성공·입금 INCOME 실패 — 훅은 호출되고 이벤트는 INCOME FAILED(회기 TX 분리)")
    void fulfillPaidOrder_incomeEnsureFails_sessionsHookCommitted_eventFailed() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(Collections.emptyList());
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();
        doThrow(new IllegalStateException("Path B PAID ERP: 입금 INCOME 보장 실패"))
                .when(adminService)
                .ensureConsultationDepositIncome(any(ConsultantClientMapping.class));

        assertDoesNotThrow(() -> service.fulfillPaidOrder(TENANT, order));

        InOrder orderOfCalls = inOrder(consultationFulfillmentHook, adminService);
        orderOfCalls.verify(consultationFulfillmentHook).onConsultationPackagePaid(any());
        orderOfCalls.verify(adminService).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent saved = eventCaptor.getValue();
        assertEquals(ShopOrderFulfillmentStatus.FAILED, saved.getStatus());
        assertTrue(saved.getMessage().startsWith(ShopOrderFulfillmentMessages.CONSULTATION_INCOME_SYNC_FAILED));
        assertTrue(saved.getMessage().contains("입금 INCOME 보장 실패"));
        assertTrue(ShopOrderFulfillmentRetryConstants.isRetryableFailed(saved.getStatus(), saved.getMessage()));
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
        stubIncomeEnsureMapping();

        service.fulfillPaidOrder(TENANT, order);

        verify(consultationFulfillmentHook, times(1)).onConsultationPackagePaid(any());
        verify(adminService).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor = ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        assertEquals(failedEvent, eventCaptor.getValue());
        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, failedEvent.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED, failedEvent.getMessage());
    }

    @Test
    @DisplayName("COMPLETED 이벤트 존재 — 훅 재실행 없이 INCOME ensure heal")
    void fulfillPaidOrder_completed_idempotentSkip() {
        ShopOrderFulfillmentEvent completed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        ShopClientOrder order = paidOrder();
        order.setCashDueMinor(10_000L);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 10_000L, MAPPING_ID);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(completed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();

        service.fulfillPaidOrder(TENANT, order);

        verify(fulfillmentEventRepository, never()).save(any());
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
        verify(adminService, times(1)).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
        assertFalse(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED.toLowerCase()
                .contains("confirm-payment"));
        assertTrue(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED.toLowerCase()
                .contains("deposit income"));
    }

    @Test
    @DisplayName("COMPLETED+INCOME ensure 실패 — COMPLETED→INCOME_SYNC_FAILED 강등(재시도 가능)")
    void fulfillPaidOrder_completed_healFails_demotesToIncomeSyncFailed() {
        ShopOrderFulfillmentEvent completed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        completed.setTenantId(TENANT);
        ShopClientOrder order = paidOrder();
        order.setCashDueMinor(10_000L);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 10_000L, MAPPING_ID);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(completed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();
        doThrow(new IllegalStateException("Path B PAID ERP: 입금 INCOME 보장 실패(posted INCOME 없음)"))
                .when(adminService)
                .ensureConsultationDepositIncome(any(ConsultantClientMapping.class));

        assertDoesNotThrow(() -> service.fulfillPaidOrder(TENANT, order));

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor =
                ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent demoted = eventCaptor.getValue();
        assertEquals(ShopOrderFulfillmentStatus.FAILED, demoted.getStatus());
        assertTrue(demoted.getMessage().startsWith(ShopOrderFulfillmentMessages.CONSULTATION_INCOME_SYNC_FAILED));
        assertTrue(ShopOrderFulfillmentRetryConstants.isRetryableFailed(
                demoted.getStatus(), demoted.getMessage()));
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
    }

    @Test
    @DisplayName("COMPLETED+INCOME 누락 — fulfill 멱등 경로에서 ensure 재실행")
    void fulfillPaidOrder_completed_missingIncome_healsEnsure() {
        ShopOrderFulfillmentEvent completed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        ShopClientOrder order = paidOrder();
        order.setCashDueMinor(10_000L);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 10_000L, MAPPING_ID);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(completed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();

        service.fulfillPaidOrder(TENANT, order);

        verify(adminService).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
    }

    @Test
    @DisplayName("repairConsultationDepositIncome — 상담 매핑 ensure 호출")
    void repairConsultationDepositIncome_callsEnsure() {
        ShopClientOrder order = paidOrder();
        order.setCashDueMinor(10_000L);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 10_000L, MAPPING_ID);
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();

        service.repairConsultationDepositIncome(TENANT, order);

        verify(adminService).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
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
        assertEquals(ConsultantClientMapping.MappingStatus.ACTIVE, mapping.getStatus());
        assertNull(mapping.getEndDate());
        assertEquals(ShopOrderFulfillmentStatus.REVERSED, event.getStatus());
        verify(fulfillmentEventRepository).save(event);
        verify(consultantClientMappingRepository).save(mapping);
        verify(adminService).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                "SKU-CONSULT", 10);
    }

    @Test
    @DisplayName("전액 환불 rem→0 — PENDING_PAYMENT·REFUNDED·endDate null·연결 유지(재결제)")
    void reversePaidOrderFulfillment_remToZero_keepsShopEligibleConnection() {
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
                .totalSessions(10)
                .remainingSessions(10)
                .usedSessions(0)
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

        assertEquals(0, mapping.getTotalSessions());
        assertEquals(0, mapping.getRemainingSessions());
        assertEquals(ConsultantClientMapping.PaymentStatus.REFUNDED, mapping.getPaymentStatus());
        assertEquals(ConsultantClientMapping.MappingStatus.PENDING_PAYMENT, mapping.getStatus());
        assertNull(mapping.getEndDate());
        assertNotEquals(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED, mapping.getStatus());
        assertNotEquals(ConsultantClientMapping.MappingStatus.INACTIVE, mapping.getStatus());
        assertNotEquals(ConsultantClientMapping.MappingStatus.CANCELLED, mapping.getStatus());
        assertNotEquals(ConsultantClientMapping.MappingStatus.TERMINATED, mapping.getStatus());
        assertFalse(Boolean.TRUE.equals(mapping.getIsDeleted()));
        verify(consultantClientMappingRepository).save(mapping);
        verify(consultantClientMappingRepository, never()).delete(any());
        verify(adminService).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                "SKU-CONSULT", 10);
    }

    @Test
    @DisplayName("전액 환불 재호출 — 이미 SESSIONS_EXHAUSTED+endDate+REFUNDED면 PENDING_PAYMENT·endDate null")
    void reversePaidOrderFulfillment_alreadyExhausted_clearsEndDate() {
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
                .totalSessions(0)
                .remainingSessions(0)
                .usedSessions(0)
                .paymentAmount(100_000L)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED)
                .status(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED)
                .endDate(LocalDateTime.of(2026, 9, 18, 12, 0))
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

        service.reversePaidOrderFulfillment(TENANT, order);

        assertEquals(ConsultantClientMapping.MappingStatus.PENDING_PAYMENT, mapping.getStatus());
        assertNull(mapping.getEndDate());
        assertEquals(ConsultantClientMapping.PaymentStatus.REFUNDED, mapping.getPaymentStatus());
        verify(consultantClientMappingRepository).save(mapping);
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
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                "SKU-CONSULT", 10);
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
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                "SKU-CONSULT-A", 10);
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
        verify(adminService, never()).createShopOrderMappingRefundExpense(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("전액 환불 — FAILED+INCOME_SYNC_FAILED(회기 가산됨)도 회기 원복·ERP EXPENSE")
    void reversePaidOrderFulfillment_failedAfterSessionsGranted_reversesSessions() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_INCOME_SYNC_FAILED + ": deposit timeout")
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
        assertEquals(ShopOrderFulfillmentStatus.REVERSED, event.getStatus());
        verify(adminService).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                "SKU-CONSULT", 10);
    }

    @Test
    @DisplayName("전액 환불 — FAILED+ERP_SYNC_FAILED(회기 미가산)는 회기 유지·paymentStatus REFUNDED만")
    void reversePaidOrderFulfillment_failedBeforeSessions_doesNotReverseSessions() {
        ShopClientOrder order = paidOrder();
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent event = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        event.setTenantId(TENANT);
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .totalSessions(5)
                .remainingSessions(2)
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
        assertEquals(ShopOrderFulfillmentStatus.REVERSED, event.getStatus());
        verify(adminService).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                "SKU-CONSULT", 10);
    }

    @Test
    @DisplayName("전액 환불 원복 2회 — 회기 이중 차감 없음(멱등)")
    void reversePaidOrderFulfillment_secondCall_doesNotDoubleReverseSessions() {
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

        service.reversePaidOrderFulfillment(TENANT, order);
        assertEquals(5, mapping.getTotalSessions());
        assertEquals(2, mapping.getRemainingSessions());
        verify(adminService, times(2)).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                "SKU-CONSULT", 10);
    }

    @Test
    @DisplayName("전액 환불 — ERP EXPENSE 실패 시 예외 전파(삼키지 않음)")
    void reversePaidOrderFulfillment_erpExpenseFails_propagates() {
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
        doThrow(new IllegalStateException("EXPENSE create failed"))
                .when(adminService)
                .createShopOrderMappingRefundExpense(
                        TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                        "SKU-CONSULT", 10);

        assertThrows(IllegalStateException.class, () -> service.reversePaidOrderFulfillment(TENANT, order));
        verify(adminService).createShopOrderMappingRefundExpense(
                TENANT, MAPPING_ID, ShopOrderFulfillmentMessages.SHOP_ORDER_FULL_REFUND_ERP_REASON,
                "SKU-CONSULT", 10);
    }

    @Test
    @DisplayName("retryFailedFulfillment — PAID+매핑 REFUNDED 이면 실훅 heal→COMPLETED+INCOME (Path B)")
    void retryFailedFulfillment_paidOrder_mappingRefunded_healsViaRealHook_completesWithIncome() {
        PaymentRepository paymentRepository = mock(PaymentRepository.class);
        ErpShopConsultationFulfillmentHook realHook = new ErpShopConsultationFulfillmentHook(
                adminService, consultantClientMappingRepository, paymentRepository);
        ShopOrderFulfillmentServiceImpl localService = new ShopOrderFulfillmentServiceImpl(
                fulfillmentEventRepository,
                shopClientOrderLineRepository,
                shopClientOrderRepository,
                realHook,
                shopNotificationHelper,
                consultantClientMappingRepository,
                statusCodeHelper,
                adminService,
                noopTransactionManager);

        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        failed.setTenantId(TENANT);

        ConsultantClientMapping mapping = spy(ConsultantClientMapping.builder()
                .status(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
                .totalSessions(10)
                .remainingSessions(0)
                .usedSessions(0)
                .packagePrice(100_000L)
                .paymentAmount(100_000L)
                .depositConfirmed(false)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED)
                .build());
        mapping.setId(MAPPING_ID);

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Payment approvedPayment = Payment.builder()
                .paymentId("PAY-approved-refunded-heal")
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.APPROVED)
                .build();
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq(ORDER_PUBLIC_ID), eq(Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.of(approvedPayment));

        String paymentReference = ShopCheckoutConstants.consultationPaymentReference(ORDER_PUBLIC_ID);
        when(adminService.confirmPayment(
                        eq(MAPPING_ID),
                        eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                        eq(paymentReference),
                        eq(100_000L)))
                .thenAnswer(inv -> {
                    mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED);
                    mapping.setPaymentReference(paymentReference);
                    return mapping;
                });
        when(adminService.confirmDeposit(eq(MAPPING_ID), eq(paymentReference)))
                .thenAnswer(inv -> {
                    mapping.setStatus(ConsultantClientMapping.MappingStatus.DEPOSIT_PENDING);
                    mapping.setRemainingSessions(10);
                    mapping.setDepositConfirmed(true);
                    mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
                    return mapping;
                });
        when(adminService.approveMapping(
                        eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR)))
                .thenAnswer(inv -> {
                    mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
                    return mapping;
                });

        assertDoesNotThrow(() -> localService.retryFailedFulfillment(TENANT, order, false));

        ArgumentCaptor<ShopOrderFulfillmentEvent> eventCaptor =
                ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(eventCaptor.capture());
        ShopOrderFulfillmentEvent saved = eventCaptor.getValue();
        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, saved.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED, saved.getMessage());

        verify(adminService, times(1)).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));

        InOrder healOrder = inOrder(adminService);
        healOrder.verify(adminService).confirmPayment(
                eq(MAPPING_ID),
                eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                eq(paymentReference),
                eq(100_000L));
        healOrder.verify(adminService).confirmDeposit(eq(MAPPING_ID), eq(paymentReference));

        assertTrue(mapping.getRemainingSessions() > 0);
        assertEquals(ConsultantClientMapping.MappingStatus.ACTIVE, mapping.getStatus());
        verify(mapping, never()).addSessions(any());
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("retryFailedFulfillment — PAID+FAILED retryable 이면 fulfill 경로 호출")
    void retryFailedFulfillment_paidWithRetryableFailed_callsFulfill() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        failed.setTenantId(TENANT);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, false));

        verify(consultationFulfillmentHook, times(1)).onConsultationPackagePaid(any());
        verify(shopClientOrderRepository, never()).save(any());
        assertEquals(ShopClientOrderStatus.PAID, order.getStatus());
    }

    @Test
    @DisplayName("retryFailedFulfillment — INCOME_SYNC_FAILED → COMPLETED+INCOME 1회(회기 훅 재호출·이중 가산은 훅 멱등)")
    void retryFailedFulfillment_incomeSyncFailed_completesWithIncomeOnce() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_INCOME_SYNC_FAILED + ": deposit timeout")
                .build();
        failed.setTenantId(TENANT);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();

        assertTrue(ShopOrderFulfillmentRetryConstants.isRetryableFailed(failed.getStatus(), failed.getMessage()));
        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, false));

        verify(consultationFulfillmentHook, times(1)).onConsultationPackagePaid(any());
        verify(adminService, times(1)).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, failed.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED, failed.getMessage());
        verify(fulfillmentEventRepository).save(failed);
        verify(shopNotificationHelper).notifyFulfillmentCompleted(TENANT, order, null, "SKU-CONSULT");
    }

    @Test
    @DisplayName("fulfill→INCOME fail→retry — FAILED retryable 후 재이행 시 COMPLETED·INCOME 1회")
    void fulfillPaidOrder_incomeFailThenRetry_completesWithoutDoubleIncome() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(Collections.emptyList());
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();
        doThrow(new IllegalStateException("deposit INCOME timeout"))
                .doNothing()
                .when(adminService)
                .ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
        when(fulfillmentEventRepository.save(any(ShopOrderFulfillmentEvent.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> service.fulfillPaidOrder(TENANT, order));

        ArgumentCaptor<ShopOrderFulfillmentEvent> firstCaptor =
                ArgumentCaptor.forClass(ShopOrderFulfillmentEvent.class);
        verify(fulfillmentEventRepository).save(firstCaptor.capture());
        ShopOrderFulfillmentEvent failedEvent = firstCaptor.getValue();
        assertEquals(ShopOrderFulfillmentStatus.FAILED, failedEvent.getStatus());
        assertTrue(failedEvent.getMessage().startsWith(ShopOrderFulfillmentMessages.CONSULTATION_INCOME_SYNC_FAILED));
        assertTrue(ShopOrderFulfillmentRetryConstants.isRetryableFailed(
                failedEvent.getStatus(), failedEvent.getMessage()));

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failedEvent));

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, false));

        verify(consultationFulfillmentHook, times(2)).onConsultationPackagePaid(any());
        verify(adminService, times(2)).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, failedEvent.getStatus());
        assertEquals(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED, failedEvent.getMessage());
    }

    @Test
    @DisplayName("retryFailedFulfillment — 내담자: fulfill 후 여전히 FAILED+retryable 이면 플래그 false·2회째 허용")
    void retryFailedFulfillment_clientOneShot_stillFailed_leavesFlagFalseAndAllowsSecond() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        order.setClientFulfillRetryAttempted(Boolean.FALSE);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        failed.setTenantId(TENANT);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        doThrow(new IllegalStateException("erp still down"))
                .when(consultationFulfillmentHook)
                .onConsultationPackagePaid(any());

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, true));
        assertFalse(Boolean.TRUE.equals(order.getClientFulfillRetryAttempted()));
        verify(shopClientOrderRepository, never()).save(any());
        verify(consultationFulfillmentHook, times(1)).onConsultationPackagePaid(any());
        assertTrue(ShopOrderFulfillmentRetryConstants.isRetryableFailed(failed.getStatus(), failed.getMessage()));

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, true));
        assertFalse(Boolean.TRUE.equals(order.getClientFulfillRetryAttempted()));
        verify(consultationFulfillmentHook, times(2)).onConsultationPackagePaid(any());
        verify(shopClientOrderRepository, never()).save(any());
    }

    @Test
    @DisplayName("retryFailedFulfillment — 내담자: sticky flag + retryable FAILED 이면 heal 후 진행")
    void retryFailedFulfillment_clientOneShot_stickyFlagWithRetryable_healsAndProceeds() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        order.setClientFulfillRetryAttempted(Boolean.TRUE);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        failed.setTenantId(TENANT);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(shopClientOrderRepository.save(order)).thenReturn(order);
        doThrow(new IllegalStateException("erp still down"))
                .when(consultationFulfillmentHook)
                .onConsultationPackagePaid(any());

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, true));

        assertFalse(Boolean.TRUE.equals(order.getClientFulfillRetryAttempted()));
        verify(shopClientOrderRepository, times(1)).save(order);
        verify(consultationFulfillmentHook, times(1)).onConsultationPackagePaid(any());
        assertTrue(ShopOrderFulfillmentRetryConstants.isRetryableFailed(failed.getStatus(), failed.getMessage()));
    }

    @Test
    @DisplayName("retryFailedFulfillment — 내담자: fulfill 후 COMPLETED 이면 플래그 true·2회째 거부")
    void retryFailedFulfillment_clientOneShot_completed_setsFlagAndSecondCallThrows() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        order.setClientFulfillRetryAttempted(Boolean.FALSE);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        failed.setTenantId(TENANT);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(shopClientOrderRepository.save(order)).thenReturn(order);
        stubIncomeEnsureMapping();

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, true));
        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, failed.getStatus());
        assertTrue(Boolean.TRUE.equals(order.getClientFulfillRetryAttempted()));
        verify(shopClientOrderRepository, times(1)).save(order);
        verify(consultationFulfillmentHook, times(1)).onConsultationPackagePaid(any());

        IllegalStateException second = assertThrows(
                IllegalStateException.class,
                () -> service.retryFailedFulfillment(TENANT, order, true));
        assertEquals(ShopOrderFulfillmentRetryConstants.MSG_CLIENT_RETRY_ALREADY_USED, second.getMessage());
        verify(consultationFulfillmentHook, times(1)).onConsultationPackagePaid(any());
    }

    @Test
    @DisplayName("retryFailedFulfillment — 어드민은 플래그 없이 반복 재시도 가능")
    void retryFailedFulfillment_admin_canRetryTwiceWithoutFlagBlock() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        order.setClientFulfillRetryAttempted(Boolean.TRUE);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        failed.setTenantId(TENANT);
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        stubIncomeEnsureMapping();

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, false));

        failed.setStatus(ShopOrderFulfillmentStatus.FAILED);
        failed.setMessage(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED);

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, false));

        verify(consultationFulfillmentHook, times(2)).onConsultationPackagePaid(any());
        verify(shopClientOrderRepository, never()).save(any());
        assertTrue(Boolean.TRUE.equals(order.getClientFulfillRetryAttempted()));
    }

    @Test
    @DisplayName("retryFailedFulfillment — non-PAID 이면 IllegalStateException")
    void retryFailedFulfillment_nonPaid_throws() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.REFUNDED);

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.retryFailedFulfillment(TENANT, order, false));

        assertEquals(ShopOrderFulfillmentRetryConstants.MSG_ORDER_NOT_PAID, ex.getMessage());
        verify(fulfillmentEventRepository, never())
                .findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(any(), any());
    }

    @Test
    @DisplayName("retryFailedFulfillment — retryable FAILED 없으면 IllegalStateException")
    void retryFailedFulfillment_noRetryable_throws() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopOrderFulfillmentEvent completed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-C")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(completed));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.retryFailedFulfillment(TENANT, order, false));

        assertEquals(ShopOrderFulfillmentRetryConstants.MSG_NO_RETRYABLE_FULFILLMENT, ex.getMessage());
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
    }

    @Test
    @DisplayName("retryFailedFulfillment — FAILED Path B 환불재구매 used>0 → remaining +=10")
    void retryFailedFulfillment_paidOrder_pendingPaymentUsedExhausted_grantsViaRealHook() {
        PaymentRepository paymentRepository = mock(PaymentRepository.class);
        ErpShopConsultationFulfillmentHook realHook = new ErpShopConsultationFulfillmentHook(
                adminService, consultantClientMappingRepository, paymentRepository);
        ShopOrderFulfillmentServiceImpl localService = new ShopOrderFulfillmentServiceImpl(
                fulfillmentEventRepository,
                shopClientOrderLineRepository,
                shopClientOrderRepository,
                realHook,
                shopNotificationHelper,
                consultantClientMappingRepository,
                statusCodeHelper,
                adminService,
                noopTransactionManager);

        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent failed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.FAILED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_SYNC_FAILED)
                .build();
        failed.setTenantId(TENANT);

        ConsultantClientMapping mapping = spy(ConsultantClientMapping.builder()
                .status(ConsultantClientMapping.MappingStatus.PENDING_PAYMENT)
                .totalSessions(10)
                .remainingSessions(0)
                .usedSessions(10)
                .packagePrice(0L)
                .paymentAmount(0L)
                .depositConfirmed(false)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.REFUNDED)
                .build());
        mapping.setId(MAPPING_ID);

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(failed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        Payment approvedPayment = Payment.builder()
                .paymentId("PAY-approved-repurchase")
                .orderId(ORDER_PUBLIC_ID)
                .status(Payment.PaymentStatus.APPROVED)
                .build();
        when(paymentRepository.findFirstByTenantIdAndOrderIdAndStatusAndIsDeletedFalseOrderByIdDesc(
                        eq(TENANT), eq(ORDER_PUBLIC_ID), eq(Payment.PaymentStatus.APPROVED)))
                .thenReturn(Optional.of(approvedPayment));

        String paymentReference = ShopCheckoutConstants.consultationPaymentReference(ORDER_PUBLIC_ID);
        when(adminService.confirmAndActivate(
                        eq(MAPPING_ID),
                        eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                        eq(paymentReference),
                        eq(100_000L),
                        org.mockito.ArgumentMatchers.isNull()))
                .thenAnswer(inv -> {
                    int total = mapping.getTotalSessions() != null ? mapping.getTotalSessions() : 0;
                    int used = mapping.getUsedSessions() != null ? mapping.getUsedSessions() : 0;
                    mapping.setRemainingSessions(Math.max(0, total - used));
                    mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
                    mapping.setDepositConfirmed(true);
                    mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
                    mapping.setPaymentReference(paymentReference);
                    return mapping;
                });

        assertDoesNotThrow(() -> localService.retryFailedFulfillment(TENANT, order, false));

        assertEquals(ShopOrderFulfillmentStatus.COMPLETED, failed.getStatus());
        assertEquals(20, mapping.getTotalSessions());
        assertEquals(10, mapping.getRemainingSessions());
        assertEquals(10, mapping.getUsedSessions());
        assertEquals(100_000L, mapping.getPackagePrice());
        assertEquals(100_000L, mapping.getPaymentAmount());
        verify(mapping, never()).addSessions(any());
        verify(adminService, times(1)).ensureConsultationDepositIncome(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("retryFailedFulfillment — COMPLETED+ACTIVE+rem=0+total<=used 이면 +N heal")
    void retryFailedFulfillment_completedActiveZeroRemaining_healsSessionsOnce() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent completed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        completed.setTenantId(TENANT);

        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(ConsultantClientMapping.MappingStatus.ACTIVE)
                .totalSessions(10)
                .remainingSessions(0)
                .usedSessions(10)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference(ORDER_PUBLIC_ID)
                .build();
        mapping.setId(MAPPING_ID);

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(completed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, false));

        assertEquals(20, mapping.getTotalSessions());
        assertEquals(10, mapping.getRemainingSessions());
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
        verify(adminService, never()).ensureConsultationDepositIncome(any());
    }

    @Test
    @DisplayName("retryFailedFulfillment — COMPLETED+PAYMENT_CONFIRMED+rem>0 이면 ACTIVE heal(회기 비가산)")
    void retryFailedFulfillment_completedPaymentConfirmedRemaining_promotesActive() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
        ShopOrderFulfillmentEvent completed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        completed.setTenantId(TENANT);

        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
                .totalSessions(10)
                .remainingSessions(10)
                .usedSessions(0)
                .packagePrice(100_000L)
                .paymentAmount(100_000L)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference(ORDER_PUBLIC_ID)
                .build();
        mapping.setId(MAPPING_ID);

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(completed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, false));

        assertEquals(ConsultantClientMapping.MappingStatus.ACTIVE, mapping.getStatus());
        assertEquals(10, mapping.getTotalSessions());
        assertEquals(10, mapping.getRemainingSessions());
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
        // package/payment already == lineTotal → price heal 스킵, ensure 미호출
        verify(adminService, never()).ensureConsultationDepositIncome(any());
    }

    @Test
    @DisplayName("retryFailedFulfillment — COMPLETED+rem>0+stale packagePrice 이면 sync+ensure INCOME")
    void retryFailedFulfillment_completedRemaining_stalePackage_syncsAndEnsuresIncome() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        final long lineTotal = 10_000L;
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, lineTotal, MAPPING_ID);
        ShopOrderFulfillmentEvent completed = ShopOrderFulfillmentEvent.builder()
                .orderPublicId(ORDER_PUBLIC_ID)
                .skuCode("SKU-CONSULT")
                .category(ShopCatalogCategory.CONSULTATION)
                .status(ShopOrderFulfillmentStatus.COMPLETED)
                .message(ShopOrderFulfillmentMessages.CONSULTATION_ERP_COMPLETED)
                .build();
        completed.setTenantId(TENANT);

        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(ConsultantClientMapping.MappingStatus.PAYMENT_CONFIRMED)
                .totalSessions(10)
                .remainingSessions(10)
                .usedSessions(0)
                .packagePrice(1_000L)
                .paymentAmount(10_000L)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference(ORDER_PUBLIC_ID)
                .build();
        mapping.setId(MAPPING_ID);

        when(fulfillmentEventRepository.findByTenantIdAndOrderPublicIdAndIsDeletedFalseOrderBySkuCodeAsc(
                        TENANT, ORDER_PUBLIC_ID))
                .thenReturn(List.of(completed));
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        assertDoesNotThrow(() -> service.retryFailedFulfillment(TENANT, order, false));

        assertEquals(lineTotal, mapping.getPackagePrice());
        assertEquals(lineTotal, mapping.getPaymentAmount());
        assertEquals(ConsultantClientMapping.MappingStatus.ACTIVE, mapping.getStatus());
        verify(adminService).ensureConsultationDepositIncome(mapping);
        verify(consultationFulfillmentHook, never()).onConsultationPackagePaid(any());
    }

    @Test
    @DisplayName("retryFailedFulfillment — COMPLETED+SESSIONS_EXHAUSTED+rem=0 이면 heal 안 함(fail-closed)")
    void retryFailedFulfillment_completedSessionsExhausted_doesNotHeal() {
        ShopClientOrder order = paidOrder();
        order.setStatus(ShopClientOrderStatus.PAID);
        ShopClientOrderLine line =
                orderLine("SKU-CONSULT", ShopCatalogCategory.CONSULTATION, 100_000L, MAPPING_ID);
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
        when(shopClientOrderLineRepository.findByClientOrder_IdAndIsDeletedFalseOrderByLineNoAsc(ORDER_PK))
                .thenReturn(List.of(line));

        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED)
                .totalSessions(20)
                .remainingSessions(0)
                .usedSessions(20)
                .depositConfirmed(true)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        IllegalStateException ex = assertThrows(
                IllegalStateException.class,
                () -> service.retryFailedFulfillment(TENANT, order, false));

        assertEquals(ShopOrderFulfillmentRetryConstants.MSG_NO_RETRYABLE_FULFILLMENT, ex.getMessage());
        assertEquals(20, mapping.getTotalSessions());
        assertEquals(0, mapping.getRemainingSessions());
        verify(consultantClientMappingRepository, never()).save(any());
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
                .titleSnapshot(skuCode)
                .sessionCountSnapshot(10)
                .quantity(1)
                .lineTotalMinor(lineTotal)
                .consultantClientMappingId(mappingId)
                .build();
    }

    private void stubIncomeEnsureMapping() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(ConsultantClientMapping.MappingStatus.ACTIVE)
                .totalSessions(10)
                .remainingSessions(10)
                .depositConfirmed(true)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
    }
}

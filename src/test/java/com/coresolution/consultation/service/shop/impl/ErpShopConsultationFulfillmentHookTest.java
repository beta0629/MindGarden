package com.coresolution.consultation.service.shop.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PaymentConstants;
import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.dto.shop.ShopConsultationFulfillmentContext;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.service.AdminService;
import java.util.Optional;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
    private static final int SESSIONS_TO_GRANT = 10;

    @Mock
    private AdminService adminService;

    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;

    @InjectMocks
    private ErpShopConsultationFulfillmentHook hook;

    @Test
    @DisplayName("Path A ACTIVE — confirmPayment + sessionCount 가산")
    void onConsultationPackagePaid_active_callsConfirmPaymentAndGrantsSessions() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.ACTIVE)
                .totalSessions(5)
                .remainingSessions(2)
                .usedSessions(3)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        ShopConsultationFulfillmentContext context = baseContext().build();

        hook.onConsultationPackagePaid(context);

        verify(adminService).confirmPayment(
                eq(MAPPING_ID),
                eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                eq(ShopCheckoutConstants.consultationPaymentReference(ORDER_PUBLIC_ID)),
                eq(LINE_TOTAL));
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
        verify(adminService, never()).ensureConsultationDepositIncome(any());
        ArgumentCaptor<ConsultantClientMapping> captor =
                ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(consultantClientMappingRepository).save(captor.capture());
        Assertions.assertEquals(15, captor.getValue().getTotalSessions());
        Assertions.assertEquals(12, captor.getValue().getRemainingSessions());
    }

    @Test
    @DisplayName("Path B PENDING_PAYMENT — confirmAndActivate, addSessions 없음")
    void onConsultationPackagePaid_pendingPayment_activatesWithoutAddSessions() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.PENDING_PAYMENT)
                .totalSessions(10)
                .remainingSessions(0)
                .usedSessions(0)
                .packagePrice(LINE_TOTAL)
                .paymentAmount(LINE_TOTAL)
                .depositConfirmed(false)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(adminService.confirmAndActivate(
                        eq(MAPPING_ID),
                        eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                        eq(ORDER_PUBLIC_ID),
                        eq(LINE_TOTAL),
                        isNull()))
                .thenAnswer(inv -> {
                    mapping.setStatus(MappingStatus.ACTIVE);
                    mapping.setRemainingSessions(10);
                    return mapping;
                });

        hook.onConsultationPackagePaid(baseContext().build());

        verify(adminService).confirmAndActivate(
                eq(MAPPING_ID),
                eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                eq(ORDER_PUBLIC_ID),
                eq(LINE_TOTAL),
                isNull());
        verify(adminService, never()).ensureConsultationDepositIncome(any());
        verify(adminService, never()).confirmPayment(any(), any(), any(), any());
        Assertions.assertEquals(10, mapping.getTotalSessions());
        Assertions.assertEquals(10, mapping.getRemainingSessions());
        Assertions.assertEquals(MappingStatus.ACTIVE, mapping.getStatus());
    }

    @Test
    @DisplayName("Path B PENDING_PAYMENT — 회기 활성화만 하고 같은 호출에서 INCOME ensure 하지 않음")
    void onConsultationPackagePaid_pendingPayment_doesNotEnsureIncomeInActivateTx() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.PENDING_PAYMENT)
                .totalSessions(10)
                .remainingSessions(0)
                .usedSessions(0)
                .packagePrice(LINE_TOTAL)
                .paymentAmount(LINE_TOTAL)
                .depositConfirmed(false)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(adminService.confirmAndActivate(any(), any(), any(), any(), any()))
                .thenAnswer(inv -> {
                    mapping.setStatus(MappingStatus.ACTIVE);
                    mapping.setRemainingSessions(10);
                    mapping.setDepositConfirmed(true);
                    return mapping;
                });

        Assertions.assertDoesNotThrow(() -> hook.onConsultationPackagePaid(baseContext().build()));
        verify(adminService).confirmAndActivate(any(), any(), any(), any(), any());
        verify(adminService, never()).ensureConsultationDepositIncome(any());
        Assertions.assertEquals(10, mapping.getRemainingSessions());
        Assertions.assertEquals(MappingStatus.ACTIVE, mapping.getStatus());
    }

    @Test
    @DisplayName("Path B 재시도 — ACTIVE·입금확인·remaining>0 이면 addSessions 없이 회기 유지")
    void onConsultationPackagePaid_activeDepositConfirmed_skipsAddSessions() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.ACTIVE)
                .totalSessions(10)
                .remainingSessions(10)
                .usedSessions(0)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference(ORDER_PUBLIC_ID + " (입금: " + ORDER_PUBLIC_ID + ")")
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        hook.onConsultationPackagePaid(baseContext().build());

        Assertions.assertEquals(10, mapping.getTotalSessions());
        Assertions.assertEquals(10, mapping.getRemainingSessions());
        verify(consultantClientMappingRepository, never()).save(any());
        verify(adminService, never()).confirmPayment(any(), any(), any(), any());
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
        verify(adminService, never()).confirmDeposit(any(), any());
        verify(adminService, never()).approveMapping(any(), any());
        verify(adminService, never()).ensureConsultationDepositIncome(any());
    }

    @Test
    @DisplayName("Path B 재시도 — DEPOSIT_PENDING·입금확인·remaining>0 이면 approveMapping 만")
    void onConsultationPackagePaid_depositPending_approvesWithoutAddSessions() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.DEPOSIT_PENDING)
                .totalSessions(10)
                .remainingSessions(10)
                .usedSessions(0)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference(ORDER_PUBLIC_ID + " (입금: " + ORDER_PUBLIC_ID + ")")
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(adminService.approveMapping(
                        eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR)))
                .thenAnswer(inv -> {
                    mapping.setStatus(MappingStatus.ACTIVE);
                    return mapping;
                });

        hook.onConsultationPackagePaid(baseContext().build());

        Assertions.assertEquals(10, mapping.getTotalSessions());
        Assertions.assertEquals(10, mapping.getRemainingSessions());
        Assertions.assertEquals(MappingStatus.ACTIVE, mapping.getStatus());
        verify(adminService).approveMapping(
                eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR));
        verify(consultantClientMappingRepository, never()).save(any());
        verify(adminService, never()).confirmPayment(any(), any(), any(), any());
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
        verify(adminService, never()).confirmDeposit(any(), any());
        verify(adminService, never()).ensureConsultationDepositIncome(any());
    }

    @Test
    @DisplayName("Path B 재시도 — DEPOSIT_CONFIRMED·입금확인·remaining>0 이면 heal→DEPOSIT_PENDING 후 approve")
    void onConsultationPackagePaid_depositConfirmed_healsThenApproves() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.DEPOSIT_CONFIRMED)
                .totalSessions(10)
                .remainingSessions(10)
                .usedSessions(0)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference(ORDER_PUBLIC_ID)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(adminService.approveMapping(
                        eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR)))
                .thenAnswer(inv -> {
                    mapping.setStatus(MappingStatus.ACTIVE);
                    return mapping;
                });

        hook.onConsultationPackagePaid(baseContext().build());

        Assertions.assertEquals(10, mapping.getTotalSessions());
        Assertions.assertEquals(10, mapping.getRemainingSessions());
        Assertions.assertEquals(MappingStatus.ACTIVE, mapping.getStatus());
        verify(consultantClientMappingRepository).save(mapping);
        verify(adminService).approveMapping(
                eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR));
        verify(adminService, never()).confirmPayment(any(), any(), any(), any());
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
        verify(adminService, never()).confirmDeposit(any(), any());
    }

    @Test
    @DisplayName("Path B 재시도 — PENDING_PAYMENT+APPROVED+remaining>0+deposit 이면 heal→approve (activate 스킵)")
    void onConsultationPackagePaid_pendingPaymentApprovedWithSessions_healsThenApproves() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.PENDING_PAYMENT)
                .totalSessions(10)
                .remainingSessions(10)
                .usedSessions(0)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference(ORDER_PUBLIC_ID)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(adminService.approveMapping(
                        eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR)))
                .thenAnswer(inv -> {
                    mapping.setStatus(MappingStatus.ACTIVE);
                    return mapping;
                });

        hook.onConsultationPackagePaid(baseContext().build());

        Assertions.assertEquals(10, mapping.getTotalSessions());
        Assertions.assertEquals(10, mapping.getRemainingSessions());
        Assertions.assertEquals(MappingStatus.ACTIVE, mapping.getStatus());
        verify(consultantClientMappingRepository).save(mapping);
        verify(adminService).approveMapping(
                eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR));
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
        verify(adminService, never()).confirmPayment(any(), any(), any(), any());
        verify(adminService, never()).confirmDeposit(any(), any());
    }

    @Test
    @DisplayName("Path B 재개 — PENDING_PAYMENT+CONFIRMED 이면 confirmDeposit+approve (addSessions 없음)")
    void onConsultationPackagePaid_pendingPaymentConfirmed_resumesDepositApprove() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.PENDING_PAYMENT)
                .totalSessions(10)
                .remainingSessions(0)
                .usedSessions(0)
                .packagePrice(LINE_TOTAL)
                .paymentAmount(LINE_TOTAL)
                .depositConfirmed(false)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.CONFIRMED)
                .paymentReference(ORDER_PUBLIC_ID)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(adminService.confirmDeposit(eq(MAPPING_ID), eq(ORDER_PUBLIC_ID)))
                .thenAnswer(inv -> {
                    mapping.setStatus(MappingStatus.DEPOSIT_PENDING);
                    mapping.setRemainingSessions(10);
                    mapping.setDepositConfirmed(true);
                    mapping.setPaymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED);
                    return mapping;
                });
        when(adminService.approveMapping(
                        eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR)))
                .thenAnswer(inv -> {
                    mapping.setStatus(MappingStatus.ACTIVE);
                    return mapping;
                });

        hook.onConsultationPackagePaid(baseContext().build());

        verify(adminService).confirmDeposit(eq(MAPPING_ID), eq(ORDER_PUBLIC_ID));
        verify(adminService).approveMapping(
                eq(MAPPING_ID), eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR));
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
        verify(adminService, never()).confirmPayment(any(), any(), any(), any());
        Assertions.assertEquals(10, mapping.getRemainingSessions());
        Assertions.assertEquals(MappingStatus.ACTIVE, mapping.getStatus());
    }

    @Test
    @DisplayName("Path A 재구매 — 다른 주문 reference·remaining>0 이면 addSessions")
    void onConsultationPackagePaid_activeDifferentOrder_stillGrantsSessions() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.ACTIVE)
                .totalSessions(5)
                .remainingSessions(2)
                .usedSessions(3)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference("other-order-public-id")
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        hook.onConsultationPackagePaid(baseContext().build());

        verify(adminService).confirmPayment(any(), any(), any(), any());
        verify(adminService, never()).ensureConsultationDepositIncome(any());
        Assertions.assertEquals(15, mapping.getTotalSessions());
        Assertions.assertEquals(12, mapping.getRemainingSessions());
    }

    @Test
    @DisplayName("Path A — ACTIVE·입금확인·remaining 0 이면 추가 회기 가산")
    void onConsultationPackagePaid_activeRemainingZero_grantsAdditionalSessions() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.ACTIVE)
                .totalSessions(10)
                .remainingSessions(0)
                .usedSessions(10)
                .depositConfirmed(true)
                .paymentStatus(ConsultantClientMapping.PaymentStatus.APPROVED)
                .paymentReference(ORDER_PUBLIC_ID)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        hook.onConsultationPackagePaid(baseContext().build());

        verify(adminService).confirmPayment(any(), any(), any(), any());
        Assertions.assertEquals(20, mapping.getTotalSessions());
        Assertions.assertEquals(SESSIONS_TO_GRANT, mapping.getRemainingSessions());
    }

    @Test
    @DisplayName("Path B PENDING_PAYMENT totalSessions=0 — sessionsToGrant로 보정 후 activate")
    void onConsultationPackagePaid_pendingPayment_zeroTotal_setsFromContext() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.PENDING_PAYMENT)
                .totalSessions(0)
                .remainingSessions(0)
                .usedSessions(0)
                .depositConfirmed(false)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(consultantClientMappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(adminService.confirmAndActivate(any(), any(), any(), any(), any()))
                .thenReturn(mapping);

        hook.onConsultationPackagePaid(baseContext().build());

        Assertions.assertEquals(SESSIONS_TO_GRANT, mapping.getTotalSessions());
        Assertions.assertEquals(LINE_TOTAL, mapping.getPackagePrice());
        Assertions.assertEquals(LINE_TOTAL, mapping.getPaymentAmount());
        verify(adminService).confirmAndActivate(
                eq(MAPPING_ID),
                eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                eq(ORDER_PUBLIC_ID),
                eq(LINE_TOTAL),
                isNull());
        verify(adminService, never()).ensureConsultationDepositIncome(any());
    }

    @Test
    @DisplayName("TERMINATED — IllegalStateException, ERP 미호출")
    void onConsultationPackagePaid_terminated_throwsWithoutErp() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.TERMINATED)
                .totalSessions(5)
                .remainingSessions(2)
                .usedSessions(3)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        Assertions.assertThrows(IllegalStateException.class, () -> hook.onConsultationPackagePaid(baseContext().build()));
        verify(adminService, never()).confirmPayment(any(), any(), any(), any());
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
        verify(consultantClientMappingRepository, never()).save(any());
    }

    @Test
    @DisplayName("mappingId 없으면 confirmPayment·가산 미호출")
    void onConsultationPackagePaid_noMappingId_skipsConfirmPayment() {
        ShopConsultationFulfillmentContext context = ShopConsultationFulfillmentContext.builder()
                .tenantId(TENANT)
                .orderPublicId(ORDER_PUBLIC_ID)
                .clientUserId(10L)
                .skuCode("SKU-PKG")
                .lineTotalMinor(LINE_TOTAL)
                .sessionsToGrant(SESSIONS_TO_GRANT)
                .build();

        hook.onConsultationPackagePaid(context);

        verify(adminService, never()).confirmPayment(
                eq(MAPPING_ID),
                eq(PaymentConstants.METHOD_CARD),
                eq(ORDER_PUBLIC_ID),
                eq(LINE_TOTAL));
        verify(adminService, never()).confirmAndActivate(any(), any(), any(), any(), any());
        verify(consultantClientMappingRepository, never()).save(any());
    }

    private static ShopConsultationFulfillmentContext.ShopConsultationFulfillmentContextBuilder baseContext() {
        return ShopConsultationFulfillmentContext.builder()
                .tenantId(TENANT)
                .orderPublicId(ORDER_PUBLIC_ID)
                .clientUserId(10L)
                .skuCode("SKU-PKG")
                .lineTotalMinor(LINE_TOTAL)
                .mappingId(MAPPING_ID)
                .sessionsToGrant(SESSIONS_TO_GRANT);
    }
}

package com.coresolution.consultation.service.shop.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
    @DisplayName("mappingId 있으면 confirmPayment + sessionCount 가산")
    void onConsultationPackagePaid_withMappingId_callsConfirmPaymentAndGrantsSessions() {
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

        ShopConsultationFulfillmentContext context = ShopConsultationFulfillmentContext.builder()
                .tenantId(TENANT)
                .orderPublicId(ORDER_PUBLIC_ID)
                .clientUserId(10L)
                .skuCode("SKU-PKG")
                .lineTotalMinor(LINE_TOTAL)
                .mappingId(MAPPING_ID)
                .sessionsToGrant(SESSIONS_TO_GRANT)
                .build();

        hook.onConsultationPackagePaid(context);

        verify(adminService).confirmPayment(
                eq(MAPPING_ID),
                eq(ShopCheckoutConstants.CONSULTATION_FULFILLMENT_PAYMENT_METHOD),
                eq(ShopCheckoutConstants.consultationPaymentReference(ORDER_PUBLIC_ID)),
                eq(LINE_TOTAL));
        ArgumentCaptor<ConsultantClientMapping> captor =
                ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(consultantClientMappingRepository).save(captor.capture());
        Assertions.assertEquals(15, captor.getValue().getTotalSessions());
        Assertions.assertEquals(12, captor.getValue().getRemainingSessions());
    }

    @Test
    @DisplayName("ACTIVE가 아니면 회기 가산·confirmPayment 모두 실패")
    void onConsultationPackagePaid_nonActiveMapping_throwsWithoutConfirmPayment() {
        ConsultantClientMapping mapping = ConsultantClientMapping.builder()
                .status(MappingStatus.TERMINATED)
                .totalSessions(5)
                .remainingSessions(2)
                .usedSessions(3)
                .build();
        mapping.setId(MAPPING_ID);
        when(consultantClientMappingRepository.findByTenantIdAndId(TENANT, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        ShopConsultationFulfillmentContext context = ShopConsultationFulfillmentContext.builder()
                .tenantId(TENANT)
                .orderPublicId(ORDER_PUBLIC_ID)
                .clientUserId(10L)
                .skuCode("SKU-PKG")
                .lineTotalMinor(LINE_TOTAL)
                .mappingId(MAPPING_ID)
                .sessionsToGrant(SESSIONS_TO_GRANT)
                .build();

        Assertions.assertThrows(IllegalStateException.class, () -> hook.onConsultationPackagePaid(context));
        verify(adminService, never()).confirmPayment(any(), any(), any(), any());
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
        verify(consultantClientMappingRepository, never()).save(any());
    }
}

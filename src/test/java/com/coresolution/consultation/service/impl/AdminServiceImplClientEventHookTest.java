package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.dto.ConsultantClientMappingCreateRequest;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.support.ClientEventWriteSupport;
import com.coresolution.core.context.TenantContextHolder;
import java.math.BigDecimal;
import java.util.Collections;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * AdminServiceImpl client_event 훅 — SESSION_ADJUSTED·관리자 결제/환불.
 *
 * @author MindGarden
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl client_event 훅")
class AdminServiceImplClientEventHookTest {

    private static final String TENANT_ID = "tenant-ce-admin-hook";
    private static final Long MAPPING_ID = 900L;

    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private PaymentMethodSsotService paymentMethodSsotService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private PaymentRepository paymentRepository;
    @Mock private ClientEventWriteSupport clientEventWriteSupport;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        PlatformTransactionManager noopTx = new AbstractPlatformTransactionManager() {
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
        adminService = new AdminServiceImpl(
                mock(com.coresolution.consultation.repository.UserRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantRepository.class),
                mock(com.coresolution.consultation.repository.ClientRepository.class),
                mappingRepository,
                mock(com.coresolution.consultation.repository.ConsultantRatingRepository.class),
                mock(com.coresolution.consultation.service.ConsultantRatingService.class),
                mock(com.coresolution.consultation.repository.ScheduleRepository.class),
                mock(com.coresolution.consultation.repository.ConsultationRecordRepository.class),
                mock(com.coresolution.consultation.repository.CommonCodeRepository.class),
                mock(com.coresolution.consultation.service.CommonCodeService.class),
                mock(com.coresolution.core.security.PasswordService.class),
                mock(com.coresolution.consultation.util.PersonalDataEncryptionUtil.class),
                mock(com.coresolution.consultation.service.ConsultantAvailabilityService.class),
                mock(com.coresolution.consultation.service.ConsultationMessageService.class),
                mock(com.coresolution.consultation.service.BranchService.class),
                mock(com.coresolution.consultation.service.NotificationService.class),
                mock(com.coresolution.consultation.service.erp.financial.FinancialTransactionService.class),
                mock(com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService.class),
                paymentMethodSsotService,
                mock(com.coresolution.consultation.service.RealTimeStatisticsService.class),
                mock(com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository.class),
                mock(com.coresolution.consultation.service.AmountManagementService.class),
                mock(com.coresolution.consultation.service.StoredProcedureService.class),
                mock(com.coresolution.core.repository.UserRoleAssignmentRepository.class),
                mock(com.coresolution.core.repository.TenantRoleRepository.class),
                mock(com.coresolution.core.service.UserRoleQueryService.class),
                mock(com.coresolution.core.util.StatusCodeHelper.class),
                mock(com.coresolution.consultation.service.UserPersonalDataCacheService.class),
                mock(com.coresolution.consultation.service.ScheduleListUserFieldsResolver.class),
                mock(com.coresolution.consultation.service.ConsultantStatsService.class),
                mock(com.coresolution.consultation.service.ClientStatsService.class),
                mock(com.coresolution.consultation.service.impl.NotificationChannelPreferenceResolutionService.class),
                mock(com.coresolution.consultation.service.PasswordResetService.class),
                noopTx,
                mock(com.coresolution.consultation.service.UserIdGenerator.class),
                mock(com.coresolution.consultation.service.UserService.class),
                mock(com.coresolution.consultation.repository.ConsultantSalaryProfileRepository.class),
                mock(com.coresolution.consultation.service.ScheduleService.class),
                mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                mock(com.coresolution.consultation.service.ProfessionalProviderTypeService.class),
                mappingSettlementNotificationHelper,
                mock(com.coresolution.consultation.service.BatchNotificationDispatchService.class),
                mock(com.coresolution.consultation.service.RefundAutoCancelNotificationService.class),
                mock(com.coresolution.consultation.service.UserLifecycleService.class),
                mock(com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                paymentRepository);
        ReflectionTestUtils.setField(adminService, "clientEventWriteSupport", clientEventWriteSupport);
        when(paymentMethodSsotService.normalizeToCanonicalCodeValue(anyString(), anyString()))
                .thenAnswer(inv -> inv.getArgument(1));
        when(paymentRepository.findByTenantIdAndOrderIdAndIsDeletedFalse(anyString(), anyString()))
                .thenReturn(Collections.emptyList());
        when(clientEventWriteSupport.toMappingSessionJson(any())).thenReturn("{\"totalSessions\":10}");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("confirmPayment(금액): PAYMENT_COMPLETED + MAPPING_STATUS_CHANGED")
    void confirmPayment_withAmount_recordsPaymentAndStatus() {
        ConsultantClientMapping mapping = pendingMapping();
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.confirmPayment(MAPPING_ID, "CARD", "REF-1", 100_000L);

        verify(clientEventWriteSupport).recordPaymentCompletedForMapping(
                any(ConsultantClientMapping.class),
                eq(BigDecimal.valueOf(100_000L)),
                isNull());
        verify(clientEventWriteSupport).recordMappingStatusChanged(
                any(ConsultantClientMapping.class),
                eq(MappingStatus.PENDING_PAYMENT.name()));
    }

    @Test
    @DisplayName("confirmPayment(금액없음): PAYMENT_COMPLETED + MAPPING_STATUS_CHANGED")
    void confirmPayment_withoutAmount_recordsPaymentAndStatus() {
        ConsultantClientMapping mapping = pendingMapping();
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.confirmPayment(MAPPING_ID, "CARD", "REF-2");

        verify(clientEventWriteSupport).recordPaymentCompletedForMapping(
                any(ConsultantClientMapping.class),
                eq(BigDecimal.valueOf(100_000L)),
                isNull());
        verify(clientEventWriteSupport).recordMappingStatusChanged(
                any(ConsultantClientMapping.class),
                eq(MappingStatus.PENDING_PAYMENT.name()));
    }

    @Test
    @DisplayName("extendSessions: SESSION_ADJUSTED 1행")
    void extendSessions_recordsSessionAdjusted() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        adminService.extendSessions(MAPPING_ID, 5, null, null);

        verify(clientEventWriteSupport).recordSessionAdjusted(
                any(ConsultantClientMapping.class),
                anyString(),
                eq(8),
                eq(2));
        verify(clientEventWriteSupport, never()).recordSessionDeducted(
                any(), anyLong(), anyLong(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("updateMapping totalSessions 변경 시 SESSION_ADJUSTED 1행")
    void updateMapping_totalSessionsChanged_recordsSessionAdjusted() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setTotalSessions(15);

        adminService.updateMapping(MAPPING_ID, dto, "admin");

        verify(clientEventWriteSupport).recordSessionAdjusted(
                any(ConsultantClientMapping.class),
                anyString(),
                eq(8),
                eq(2));
    }

    @Test
    @DisplayName("updateMapping totalSessions 미변경 시 SESSION_ADJUSTED 없음")
    void updateMapping_totalSessionsUnchanged_skipsSessionAdjusted() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setPackageName("same-package");

        adminService.updateMapping(MAPPING_ID, dto, "admin");

        verify(clientEventWriteSupport, never()).recordSessionAdjusted(
                any(), any(), any(), any());
    }

    private ConsultantClientMapping pendingMapping() {
        User client = new User();
        client.setId(42L);
        User consultant = new User();
        consultant.setId(31L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TENANT_ID);
        mapping.setClient(client);
        mapping.setConsultant(consultant);
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentStatus(PaymentStatus.PENDING);
        mapping.setPackagePrice(100_000L);
        mapping.setPaymentAmount(100_000L);
        mapping.setTotalSessions(10);
        mapping.setUsedSessions(0);
        mapping.setRemainingSessions(0);
        return mapping;
    }

    private ConsultantClientMapping activeMapping(int total, int used, int remaining) {
        ConsultantClientMapping mapping = pendingMapping();
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        return mapping;
    }
}

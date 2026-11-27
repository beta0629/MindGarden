package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.PaymentTimingConstants;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
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
 * AdminServiceImpl#updateMapping — 회기 불변식(total = used + remaining) 동기화.
 *
 * @author CoreSolution
 * @since 2026-11-26
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl updateMapping — 회기 불변식")
class AdminServiceImplUpdateMappingSessionInvariantTest {

    private static final String TENANT_ID = "tenant-map-session-invariant";
    private static final Long MAPPING_ID = 444L;

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
    @DisplayName("remaining-only 정정 → used = total - remaining, SESSION_ADJUSTED 1회")
    void updateMapping_remainingOnly_syncsUsedAndRecordsSessionAdjustedOnce() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setRemainingSessions(5);

        adminService.updateMapping(MAPPING_ID, dto, "admin");

        assertThat(mapping.getTotalSessions()).isEqualTo(10);
        assertThat(mapping.getRemainingSessions()).isEqualTo(5);
        assertThat(mapping.getUsedSessions()).isEqualTo(5);
        verify(clientEventWriteSupport, times(1)).recordSessionAdjusted(
                any(ConsultantClientMapping.class),
                anyString(),
                eq(8),
                eq(2));
    }

    @Test
    @DisplayName("remaining > total → IllegalArgumentException")
    void updateMapping_remainingExceedsTotal_throws() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setRemainingSessions(11);

        assertThatThrownBy(() -> adminService.updateMapping(MAPPING_ID, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(String.format(
                        AdminServiceUserFacingMessages.MSG_MAPPING_REMAINING_SESSIONS_EXCEEDS_TOTAL_FMT, 11, 10));
    }

    @Test
    @DisplayName("remaining < 0 → IllegalArgumentException")
    void updateMapping_remainingNegative_throws() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setRemainingSessions(-1);

        assertThatThrownBy(() -> adminService.updateMapping(MAPPING_ID, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(AdminServiceUserFacingMessages.MSG_MAPPING_REMAINING_SESSIONS_NEGATIVE);
    }

    @Test
    @DisplayName("total+remaining 동시 → used = total - remaining, SESSION_ADJUSTED 1회")
    void updateMapping_totalAndRemaining_endsWithInvariant() {
        ConsultantClientMapping mapping = activeMapping(10, 2, 8);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setTotalSessions(12);
        dto.setRemainingSessions(9);

        adminService.updateMapping(MAPPING_ID, dto, "admin");

        assertThat(mapping.getTotalSessions()).isEqualTo(12);
        assertThat(mapping.getRemainingSessions()).isEqualTo(9);
        assertThat(mapping.getUsedSessions()).isEqualTo(3);
        verify(clientEventWriteSupport, times(1)).recordSessionAdjusted(
                any(ConsultantClientMapping.class),
                anyString(),
                eq(8),
                eq(2));
    }

    @Test
    @DisplayName("institution-link total-only → remaining = total - used, 불변식 유지, SESSION_ADJUSTED 1회")
    void updateMapping_institutionLink_totalOnly_derivesRemainingAndHoldsInvariant() {
        ConsultantClientMapping mapping = activeMapping(10, 0, 0);
        mapping.setPaymentTiming(PaymentTimingConstants.INSTITUTION_LINK);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setTotalSessions(12);

        adminService.updateMapping(MAPPING_ID, dto, "admin");

        assertThat(mapping.getPaymentTiming()).isEqualTo(PaymentTimingConstants.INSTITUTION_LINK);
        assertThat(mapping.getTotalSessions()).isEqualTo(12);
        assertThat(mapping.getUsedSessions()).isZero();
        assertThat(mapping.getRemainingSessions()).isEqualTo(12);
        verify(clientEventWriteSupport, times(1)).recordSessionAdjusted(
                any(ConsultantClientMapping.class),
                anyString(),
                eq(0),
                eq(0));
    }

    @Test
    @DisplayName("total-only · total < used → IllegalArgumentException")
    void updateMapping_totalLessThanUsed_throws() {
        ConsultantClientMapping mapping = activeMapping(10, 5, 5);
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID))
                .thenReturn(Optional.of(mapping));

        ConsultantClientMappingCreateRequest dto = new ConsultantClientMappingCreateRequest();
        dto.setTotalSessions(3);

        assertThatThrownBy(() -> adminService.updateMapping(MAPPING_ID, dto, "admin"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage(String.format(
                        AdminServiceUserFacingMessages.MSG_MAPPING_TOTAL_SESSIONS_LESS_THAN_USED_FMT, 3, 5));
    }

    private ConsultantClientMapping activeMapping(int total, int used, int remaining) {
        User client = new User();
        client.setId(42L);
        User consultant = new User();
        consultant.setId(31L);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(TENANT_ID);
        mapping.setClient(client);
        mapping.setConsultant(consultant);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setPackagePrice(100_000L);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        return mapping;
    }
}

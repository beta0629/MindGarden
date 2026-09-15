package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 기관연동 prepaid_amount 표시 enrich (READ only).
 *
 * @author CoreSolution
 * @since 2026-09-15
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl institutionLink prepaid enrich")
class AdminServiceImplInstitutionLinkPrepaidEnrichTest {

    private static final String TENANT_ID = "tenant-il-prepaid-" + UUID.randomUUID();

    @Mock
    private EntityManager entityManager;

    @Mock
    private Query query;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminServiceImpl(
                mock(com.coresolution.consultation.repository.UserRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantRepository.class),
                mock(com.coresolution.consultation.repository.ClientRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantClientMappingRepository.class),
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
                mock(com.coresolution.consultation.service.PaymentMethodSsotService.class),
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
                mock(PlatformTransactionManager.class),
                mock(com.coresolution.consultation.service.UserIdGenerator.class),
                mock(com.coresolution.consultation.service.UserService.class),
                mock(com.coresolution.consultation.repository.ConsultantSalaryProfileRepository.class),
                mock(com.coresolution.consultation.service.ScheduleService.class),
                mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                mock(com.coresolution.consultation.service.ProfessionalProviderTypeService.class),
                mock(com.coresolution.consultation.service.MappingSettlementNotificationHelper.class),
                mock(com.coresolution.consultation.service.BatchNotificationDispatchService.class),
                mock(com.coresolution.consultation.service.RefundAutoCancelNotificationService.class),
                mock(com.coresolution.consultation.service.UserLifecycleService.class),
                mock(com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class));
        ReflectionTestUtils.setField(adminService, "entityManager", entityManager);
    }

    @Test
    @DisplayName("clientId별 prepaid_amount 최신 계약 우선 매핑")
    void getInstitutionLinkPrepaidAmountByClientId_mapsLatestPerClient() {
        when(entityManager.createNativeQuery(anyString())).thenReturn(query);
        when(query.getResultList()).thenReturn(List.of(
                new Object[] {78L, 100000L},
                new Object[] {78L, 90000L},
                new Object[] {99L, 50000L}
        ));

        Map<Long, Long> result = adminService.getInstitutionLinkPrepaidAmountByClientId(
                TENANT_ID, List.of(78L, 99L));

        assertThat(result).containsEntry(78L, 100000L).containsEntry(99L, 50000L);
    }

    @Test
    @DisplayName("clientIds 빈 목록이면 빈 맵")
    void getInstitutionLinkPrepaidAmountByClientId_emptyIds() {
        assertThat(adminService.getInstitutionLinkPrepaidAmountByClientId(
                TENANT_ID, Collections.emptyList())).isEmpty();
    }
}

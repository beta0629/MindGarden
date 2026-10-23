package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.repository.ScheduleRepository;
import java.util.Collections;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 가예약 카드 {@code hasConsultationSchedule} enrich — 상담사·내담자 쌍 이력(날짜 무관·COMPLETED 포함).
 *
 * <p>레거시 {@code mapping_id IS NULL} COMPLETED 일정은 mappingId 전용 쿼리에 잡히지 않으므로
 * 쌍 키 배치 enrich 가 「일정 이력 있음」표시에 필요하다. 가예약 일정등록 차단에는 쓰지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-09-09
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl 가예약 쌍 점유 enrich")
class AdminServiceImplProvisionalOccupancyPairEnrichTest {

    private static final String TENANT_ID = "tenant-pair-enrich-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 501L;
    private static final Long CLIENT_ID = 602L;

    @Mock
    private ScheduleRepository scheduleRepository;

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
                scheduleRepository,
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
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class));
    }

    @Test
    @DisplayName("COMPLETED(null mapping_id) 쌍 → consultantId_clientId 키 반환 + provisional status SSOT")
    void getConsultantClientKeysWithOccupyingConsultationSchedules_completedNullMappingId_returnsPairKey() {
        when(scheduleRepository.findConsultantClientPairsOccupyingSchedules(eq(TENANT_ID), any()))
                .thenReturn(List.<Object[]>of(new Object[] {CONSULTANT_ID, CLIENT_ID}));

        Set<String> keys = adminService.getConsultantClientKeysWithOccupyingConsultationSchedules(TENANT_ID);

        assertThat(keys).containsExactly(CONSULTANT_ID + "_" + CLIENT_ID);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ScheduleStatus>> statusesCaptor = ArgumentCaptor.forClass(List.class);
        verify(scheduleRepository).findConsultantClientPairsOccupyingSchedules(
                eq(TENANT_ID), statusesCaptor.capture());
        assertThat(statusesCaptor.getValue())
                .containsExactlyInAnyOrderElementsOf(
                        ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())
                .contains(ScheduleStatus.COMPLETED, ScheduleStatus.IN_PROGRESS);
    }

    @Test
    @DisplayName("쌍 점유 없음 → 빈 집합")
    void getConsultantClientKeysWithOccupyingConsultationSchedules_emptyRows_returnsEmpty() {
        when(scheduleRepository.findConsultantClientPairsOccupyingSchedules(eq(TENANT_ID), any()))
                .thenReturn(Collections.emptyList());

        Set<String> keys = adminService.getConsultantClientKeysWithOccupyingConsultationSchedules(TENANT_ID);

        assertThat(keys).isEmpty();
    }

    @Test
    @DisplayName("tenantId null/blank → 빈 집합 (쿼리 미호출)")
    void getConsultantClientKeysWithOccupyingConsultationSchedules_blankTenant_returnsEmpty() {
        assertThat(adminService.getConsultantClientKeysWithOccupyingConsultationSchedules(null)).isEmpty();
        assertThat(adminService.getConsultantClientKeysWithOccupyingConsultationSchedules("")).isEmpty();
    }

    @Test
    @DisplayName("OPEN mappingId enrich 는 occupyingStatusesForProvisionalMapping (COMPLETED 제외)")
    void getMappingIdsWithOpenOccupyingConsultationSchedules_usesOpenStatuses() {
        when(scheduleRepository.findDistinctMappingIdsWithOccupyingSchedules(eq(TENANT_ID), any()))
                .thenReturn(List.of(269L));

        Set<Long> ids = adminService.getMappingIdsWithOpenOccupyingConsultationSchedules(TENANT_ID);

        assertThat(ids).containsExactly(269L);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ScheduleStatus>> statusesCaptor = ArgumentCaptor.forClass(List.class);
        verify(scheduleRepository).findDistinctMappingIdsWithOccupyingSchedules(
                eq(TENANT_ID), statusesCaptor.capture());
        assertThat(statusesCaptor.getValue())
                .containsExactlyInAnyOrderElementsOf(ScheduleStatus.occupyingStatusesForProvisionalMapping())
                .doesNotContain(ScheduleStatus.COMPLETED);
    }
}

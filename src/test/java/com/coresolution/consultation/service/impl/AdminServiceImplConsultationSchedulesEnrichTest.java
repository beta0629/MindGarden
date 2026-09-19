package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ScheduleRepository;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
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
 * 배정 카드 청구용 {@code consultationSchedules} enrich.
 *
 * @author CoreSolution
 * @since 2026-09-15
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl consultationSchedules enrich")
class AdminServiceImplConsultationSchedulesEnrichTest {

    private static final String TENANT_ID = "tenant-billing-schedules-" + UUID.randomUUID();
    private static final Long MAPPING_ID = 265L;

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
                mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                mock(com.coresolution.consultation.repository.PartnerInstitutionRepository.class),
                mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                mock(org.springframework.beans.factory.ObjectProvider.class),
                mock(com.coresolution.consultation.repository.PaymentRepository.class));
    }

    @Test
    @DisplayName("점유 일정을 mappingId별 date/status/sessionSequence 로 그룹핑")
    void getConsultationSchedulesByMappingId_groupsOccupyingRows() {
        Schedule completed = new Schedule();
        completed.setId(901L);
        completed.setMappingId(MAPPING_ID);
        completed.setDate(LocalDate.of(2026, 9, 7));
        completed.setStartTime(LocalTime.of(14, 0));
        completed.setStatus(ScheduleStatus.COMPLETED);
        completed.setSessionSequence(1);

        Schedule booked = new Schedule();
        booked.setId(902L);
        booked.setMappingId(MAPPING_ID);
        booked.setDate(LocalDate.of(2026, 9, 14));
        booked.setStartTime(LocalTime.of(15, 0));
        booked.setStatus(ScheduleStatus.BOOKED);
        booked.setSessionSequence(null);

        when(scheduleRepository.findOccupyingSchedulesByMappingIds(eq(TENANT_ID), any(), any()))
                .thenReturn(List.of(completed, booked));

        Map<Long, List<Map<String, Object>>> result =
                adminService.getConsultationSchedulesByMappingId(TENANT_ID, List.of(MAPPING_ID));

        assertThat(result).containsKey(MAPPING_ID);
        assertThat(result.get(MAPPING_ID)).hasSize(2);
        assertThat(result.get(MAPPING_ID).get(0))
                .containsEntry("id", 901L)
                .containsEntry("mappingId", MAPPING_ID)
                .containsEntry("date", "2026-09-07")
                .containsEntry("startTime", "14:00")
                .containsEntry("status", "COMPLETED")
                .containsEntry("sessionSequence", 1);
        assertThat(result.get(MAPPING_ID).get(1))
                .containsEntry("startTime", "15:00")
                .containsEntry("status", "BOOKED")
                .containsEntry("sessionSequence", null);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<ScheduleStatus>> statusesCaptor = ArgumentCaptor.forClass(List.class);
        verify(scheduleRepository).findOccupyingSchedulesByMappingIds(
                eq(TENANT_ID), eq(List.of(MAPPING_ID)), statusesCaptor.capture());
        assertThat(statusesCaptor.getValue())
                .containsExactlyInAnyOrderElementsOf(
                        ScheduleStatus.occupyingStatusesForConsultationScheduleHistory())
                .contains(ScheduleStatus.COMPLETED);
    }

    @Test
    @DisplayName("목록 재조회 시 COMPLETED 추가분이 반영된다 (스냅샷 고정 금지)")
    void getConsultationSchedulesByMappingId_liveRefreshIncludesNewCompleted() {
        Schedule firstCompleted = new Schedule();
        firstCompleted.setId(901L);
        firstCompleted.setMappingId(MAPPING_ID);
        firstCompleted.setDate(LocalDate.of(2026, 9, 7));
        firstCompleted.setStartTime(LocalTime.of(14, 0));
        firstCompleted.setStatus(ScheduleStatus.COMPLETED);

        Schedule secondCompleted = new Schedule();
        secondCompleted.setId(903L);
        secondCompleted.setMappingId(MAPPING_ID);
        secondCompleted.setDate(LocalDate.of(2026, 9, 21));
        secondCompleted.setStartTime(LocalTime.of(14, 0));
        secondCompleted.setStatus(ScheduleStatus.COMPLETED);

        when(scheduleRepository.findOccupyingSchedulesByMappingIds(eq(TENANT_ID), any(), any()))
                .thenReturn(List.of(firstCompleted))
                .thenReturn(List.of(firstCompleted, secondCompleted));

        Map<Long, List<Map<String, Object>>> first =
                adminService.getConsultationSchedulesByMappingId(TENANT_ID, List.of(MAPPING_ID));
        Map<Long, List<Map<String, Object>>> second =
                adminService.getConsultationSchedulesByMappingId(TENANT_ID, List.of(MAPPING_ID));

        assertThat(first.get(MAPPING_ID)).hasSize(1);
        assertThat(second.get(MAPPING_ID)).hasSize(2);
        assertThat(second.get(MAPPING_ID).get(1))
                .containsEntry("id", 903L)
                .containsEntry("date", "2026-09-21")
                .containsEntry("status", "COMPLETED");
    }

    @Test
    @DisplayName("mappingIds 비어 있으면 저장소 호출 없이 빈 맵")
    void getConsultationSchedulesByMappingId_emptyIds_returnsEmpty() {
        Map<Long, List<Map<String, Object>>> result =
                adminService.getConsultationSchedulesByMappingId(TENANT_ID, Collections.emptyList());
        assertThat(result).isEmpty();
    }
}

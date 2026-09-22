package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.core.context.TenantContextHolder;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 관리자 스케줄 필터 조회 — repository 푸시·배치 이름 로드 검증.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl — getSchedulesFiltered")
class AdminServiceImplSchedulesFilteredTest {

    private static final String TENANT_ID = "tenant-schedules-filtered-" + UUID.randomUUID();

    @Mock
    private ScheduleRepository scheduleRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private ClientRepository clientRepository;

    @Mock
    private ConsultantRepository consultantRepository;

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        adminService = new AdminServiceImpl(
                userRepository,
                consultantRepository,
                clientRepository,
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
                mock(NotificationChannelPreferenceResolutionService.class),
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
                mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getSchedulesFiltered(status=BOOKED) 는 repository findFilteredByTenant 를 호출하고 findByTenantId 는 호출하지 않음")
    void getSchedulesFiltered_pushesStatusToRepository() {
        Schedule schedule = new Schedule();
        schedule.setId(99L);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(1L);
        schedule.setClientId(2L);
        schedule.setDate(LocalDate.of(2026, 9, 22));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(ScheduleStatus.BOOKED);

        when(scheduleRepository.findFilteredByTenant(
                eq(TENANT_ID), isNull(), eq(ScheduleStatus.BOOKED), isNull(), isNull()))
                .thenReturn(List.of(schedule));
        when(userRepository.findByTenantIdAndIdIn(eq(TENANT_ID), any()))
                .thenReturn(Collections.emptyList());
        when(clientRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), any()))
                .thenReturn(Collections.emptyList());
        when(consultantRepository.findByTenantIdAndIdInAndIsDeletedFalse(eq(TENANT_ID), any()))
                .thenReturn(Collections.emptyList());

        List<Map<String, Object>> result =
                adminService.getSchedulesFiltered(null, "BOOKED", null, null);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("id")).isEqualTo(99L);
        verify(scheduleRepository).findFilteredByTenant(
                eq(TENANT_ID), isNull(), eq(ScheduleStatus.BOOKED), isNull(), isNull());
        verify(scheduleRepository, never()).findByTenantId(any());
        verify(userRepository).findByTenantIdAndIdIn(eq(TENANT_ID), any());
    }
}

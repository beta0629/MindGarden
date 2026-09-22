package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AmountManagementService;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.ClientStatsService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantRatingService;
import com.coresolution.consultation.service.ConsultantStatsService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MappingSettlementNotificationHelper;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserLifecycleService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.repository.TenantRoleRepository;
import com.coresolution.core.repository.UserRoleAssignmentRepository;
import com.coresolution.core.security.PasswordService;
import com.coresolution.core.service.UserRoleQueryService;
import com.coresolution.core.util.StatusCodeHelper;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * consultation-completion / schedules 필터 배치 조회 검증.
 *
 * @author CoreSolution
 * @since 2026-09-22
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl — dashboard slow-API batch queries")
class AdminServiceImplDashboardPerfBatchTest {

    private static final String TENANT_ID = "tenant-dashboard-perf";

    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRatingRepository consultantRatingRepository;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private PasswordService passwordService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private BranchService branchService;
    @Mock private NotificationService notificationService;
    @Mock private FinancialTransactionService financialTransactionService;
    @Mock private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;
    @Mock private RealTimeStatisticsService realTimeStatisticsService;
    @Mock private FinancialTransactionRepository financialTransactionRepository;
    @Mock private AmountManagementService amountManagementService;
    @Mock private StoredProcedureService storedProcedureService;
    @Mock private UserRoleAssignmentRepository userRoleAssignmentRepository;
    @Mock private TenantRoleRepository tenantRoleRepository;
    @Mock private UserRoleQueryService userRoleQueryService;
    @Mock private StatusCodeHelper statusCodeHelper;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ConsultantStatsService consultantStatsService;
    @Mock private ClientStatsService clientStatsService;
    @Mock private NotificationChannelPreferenceResolutionService notificationChannelPreferenceResolutionService;
    @Mock private PasswordResetService passwordResetService;
    @Mock private PlatformTransactionManager transactionManager;
    @Mock private UserIdGenerator userIdGenerator;
    @Mock private UserService userService;
    @Mock private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private ProfessionalProviderTypeService professionalProviderTypeService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private RefundAutoCancelNotificationService refundAutoCancelNotificationService;
    @Mock private UserLifecycleService userLifecycleService;

    @InjectMocks
    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(userPersonalDataCacheService.getDecryptedUserData(any(User.class))).thenReturn(null);
        when(encryptionUtil.safeDecrypt(any())).thenAnswer(inv -> inv.getArgument(0));
        when(consultantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(userRepository.findCounselingEnabledAdminsByTenantId(TENANT_ID))
                .thenReturn(Collections.emptyList());
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("consultation-completion 은 배치 COUNT 를 사용하고 상담사별 dateBetween 루프를 호출하지 않음")
    void getConsultationCompletionStatistics_usesBatchCounts() {
        Consultant consultant = new Consultant();
        consultant.setId(11L);
        consultant.setTenantId(TENANT_ID);
        consultant.setName("상담사A");
        consultant.setEmail("a@example.com");
        consultant.setRole(UserRole.CONSULTANT);
        consultant.setIsActive(true);
        consultant.setIsDeleted(false);

        when(consultantRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(List.of(consultant));
        when(scheduleRepository.countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.singletonList(new Object[] {11L, 3L}));
        when(scheduleRepository.countSchedulesByConsultantIds(eq(TENANT_ID), anyList()))
                .thenReturn(Collections.singletonList(new Object[] {11L, 10L}));

        List<Map<String, Object>> result =
                adminService.getConsultationCompletionStatistics("2026-09");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).get("completedCount")).isEqualTo(3);
        assertThat(result.get(0).get("totalCount")).isEqualTo(10L);

        verify(scheduleRepository).countCompletedSchedulesByConsultantInDateRange(
                eq(TENANT_ID), eq(ScheduleStatus.COMPLETED), any(LocalDate.class), any(LocalDate.class));
        verify(scheduleRepository).countSchedulesByConsultantIds(eq(TENANT_ID), anyList());
        verify(scheduleRepository, never()).findByTenantIdAndConsultantIdAndStatusAndDateBetween(
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("getSchedulesFiltered(status=BOOKED) 는 repository findFilteredByTenant 를 호출")
    void getSchedulesFiltered_pushesStatusToRepository() {
        Schedule schedule = new Schedule();
        schedule.setId(99L);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(1L);
        schedule.setClientId(2L);
        schedule.setDate(LocalDate.of(2026, 9, 22));
        schedule.setStartTime(java.time.LocalTime.of(10, 0));
        schedule.setEndTime(java.time.LocalTime.of(11, 0));
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
    }
}

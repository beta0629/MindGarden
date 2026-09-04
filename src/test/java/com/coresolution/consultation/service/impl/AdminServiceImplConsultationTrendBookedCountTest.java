package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Consultant;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AdminRequestIdempotencyService;
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
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.ProfessionalProviderTypeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.RefundAutoCancelNotificationService;
import com.coresolution.consultation.service.SalaryLateSessionAutoSyncService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
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
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

/**
 * 상담 추이 {@code bookedCount} SSOT: 완료(COMPLETED) 후에도 예약 볼륨에 포함되는지 검증.
 *
 * @author CoreSolution
 * @since 2026-09-03
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminServiceImpl — 상담 추이 bookedCount(완료 포함 예약 볼륨)")
class AdminServiceImplConsultationTrendBookedCountTest {

    private static final String TEST_TENANT_ID = "tenant-trend-booked-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 501L;

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
    @Mock private PaymentMethodSsotService paymentMethodSsotService;
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
    @Mock private UserIdGenerator userIdGenerator;
    @Mock private UserService userService;
    @Mock private ConsultantSalaryProfileRepository consultantSalaryProfileRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private ProfessionalProviderTypeService professionalProviderTypeService;
    @Mock private MappingSettlementNotificationHelper mappingSettlementNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private RefundAutoCancelNotificationService refundAutoCancelNotificationService;

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

    private AdminServiceImpl adminService;

    @BeforeEach
    void setUp() {
        adminService = new AdminServiceImpl(
                userRepository,
                consultantRepository,
                clientRepository,
                mappingRepository,
                consultantRatingRepository,
                consultantRatingService,
                scheduleRepository,
                consultationRecordRepository,
                commonCodeRepository,
                commonCodeService,
                passwordService,
                encryptionUtil,
                consultantAvailabilityService,
                consultationMessageService,
                branchService,
                notificationService,
                financialTransactionService,
                cardMerchantFeeResolutionService,
                paymentMethodSsotService,
                realTimeStatisticsService,
                financialTransactionRepository,
                amountManagementService,
                storedProcedureService,
                userRoleAssignmentRepository,
                tenantRoleRepository,
                userRoleQueryService,
                statusCodeHelper,
                userPersonalDataCacheService,
                scheduleListUserFieldsResolver,
                consultantStatsService,
                clientStatsService,
                notificationChannelPreferenceResolutionService,
                passwordResetService,
                noopTransactionManager,
                userIdGenerator,
                userService,
                consultantSalaryProfileRepository,
                scheduleService,
                Mockito.mock(SalaryLateSessionAutoSyncService.class),
                professionalProviderTypeService,
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                Mockito.mock(UserLifecycleService.class),
                Mockito.mock(AdminRequestIdempotencyService.class),
                Mockito.mock(SalaryTaxRateLookupService.class));
        TenantContextHolder.setTenantId(TEST_TENANT_ID);

        Consultant consultant = new Consultant();
        consultant.setId(CONSULTANT_ID);
        consultant.setTenantId(TEST_TENANT_ID);
        consultant.setRole(UserRole.CONSULTANT);
        when(consultantRepository.findByTenantIdAndIsDeletedFalse(TEST_TENANT_ID))
                .thenReturn(List.of(consultant));
        when(userRepository.findCounselingEnabledAdminsByTenantId(TEST_TENANT_ID))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByStatusAndDateBetween(
                eq(TEST_TENANT_ID), eq(ScheduleStatus.IN_PROGRESS), any(), any()))
                .thenReturn(0L);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("booked-then-completed: COMPLETED만 있어도 bookedCount >= completedCount 이고 예약>0")
    void getConsultationMonthlyTrend_bookedThenCompleted_includesCompletedInBookedCount() {
        Schedule completed1 = new Schedule();
        completed1.setId(1L);
        Schedule completed2 = new Schedule();
        completed2.setId(2L);
        List<Schedule> completedSchedules = List.of(completed1, completed2);

        when(scheduleRepository.findByTenantIdAndConsultantIdAndStatusAndDateBetween(
                eq(TEST_TENANT_ID), eq(CONSULTANT_ID), eq(ScheduleStatus.COMPLETED), any(), any()))
                .thenReturn(completedSchedules);
        when(scheduleRepository.countByDateBetweenAndStatuses(
                eq(TEST_TENANT_ID), any(), any(), any()))
                .thenReturn(2L);

        List<Map<String, Object>> rows = adminService.getConsultationMonthlyTrend(1);

        assertThat(rows).hasSize(1);
        Map<String, Object> row = rows.get(0);
        Number bookedCount = (Number) row.get("bookedCount");
        Number completedCount = (Number) row.get("completedCount");
        assertThat(completedCount.intValue()).isEqualTo(2);
        assertThat(bookedCount.longValue()).isGreaterThan(0L);
        assertThat(bookedCount.longValue()).isGreaterThanOrEqualTo(completedCount.longValue());

        verify(scheduleRepository, atLeastOnce()).countByDateBetweenAndStatuses(
                eq(TEST_TENANT_ID),
                any(),
                any(),
                argThat(statuses -> statuses != null
                        && statuses.size() == 3
                        && statuses.contains(ScheduleStatus.BOOKED)
                        && statuses.contains(ScheduleStatus.CONFIRMED)
                        && statuses.contains(ScheduleStatus.COMPLETED)
                        && !statuses.contains(ScheduleStatus.CANCELLED)
                        && !statuses.contains(ScheduleStatus.AVAILABLE)
                        && !statuses.contains(ScheduleStatus.VACATION)
                        && !statuses.contains(ScheduleStatus.TENTATIVE_PENDING_PAYMENT)));
    }

    @Test
    @DisplayName("열린 예약만 있는 달: bookedCount > 0, completedCount == 0")
    void getConsultationMonthlyTrend_openBookingsOnly_bookedPositiveCompletedZero() {
        when(scheduleRepository.findByTenantIdAndConsultantIdAndStatusAndDateBetween(
                eq(TEST_TENANT_ID), eq(CONSULTANT_ID), eq(ScheduleStatus.COMPLETED), any(), any()))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.countByDateBetweenAndStatuses(
                eq(TEST_TENANT_ID), any(), any(), any()))
                .thenReturn(3L);

        List<Map<String, Object>> rows = adminService.getConsultationMonthlyTrend(1);

        assertThat(rows).hasSize(1);
        Map<String, Object> row = rows.get(0);
        assertThat(((Number) row.get("bookedCount")).longValue()).isEqualTo(3L);
        assertThat(((Number) row.get("completedCount")).intValue()).isEqualTo(0);

        verify(scheduleRepository, atLeastOnce()).countByDateBetweenAndStatuses(
                eq(TEST_TENANT_ID),
                any(),
                any(),
                argThat(statuses -> statuses != null
                        && statuses.containsAll(List.of(
                                ScheduleStatus.BOOKED,
                                ScheduleStatus.CONFIRMED,
                                ScheduleStatus.COMPLETED))));
    }
}

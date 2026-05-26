package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.CommonCodeRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRatingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultantSalaryProfileRepository;
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
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.StoredProcedureService;
import com.coresolution.consultation.service.UserIdGenerator;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.UserService;
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
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * AdminServiceImpl#partialRefundMapping — 회기 소진(remaining=0) 도달 시 미래 BOOKED/CONFIRMED
 * 일정이 일괄 CANCELLED 로 전이되는지 검증한다.
 *
 * <p>SSOT 핫픽스 2026-05-26 (P0-B): 부분 환불로 remaining=0 도달 시 {@code terminateMapping}
 * 의 미래 일정 일괄 취소 정합을 맞추는 회귀 방지 테스트.</p>
 *
 * @author MindGarden
 * @since 2026-05-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl partialRefundMapping 회기 소진 시 일정 일괄 취소 테스트")
class AdminServiceImplPartialRefundExhaustedScheduleCancelTest {

    private static final String TEST_TENANT_ID = "tenant-test-partial-refund";

    @Mock private UserRepository userRepository;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private ConsultantRatingRepository consultantRatingRepository;
    @Mock private ConsultantRatingService consultantRatingService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private CommonCodeRepository commonCodeRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private PasswordService passwordService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private BranchService branchService;
    @Mock private NotificationService notificationService;
    @Mock private FinancialTransactionService financialTransactionService;
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

    /** JDBC 없이 REQUIRES_NEW 콜백만 수행 (실패해도 부모 트랜잭션 영향 없도록 모킹) */
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
                commonCodeRepository,
                commonCodeService,
                passwordService,
                encryptionUtil,
                consultantAvailabilityService,
                consultationMessageService,
                branchService,
                notificationService,
                financialTransactionService,
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
                professionalProviderTypeService,
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("부분 환불 후 remaining=0 도달 시 미래 BOOKED 일정이 CANCELLED 로 전이된다")
    void partialRefundMapping_whenSessionsExhausted_cancelsFutureBookedSchedules() {
        Long mappingId = 555L;
        Long consultantId = 10L;
        Long clientId = 20L;

        ConsultantClientMapping mapping = buildMappingWithRemaining(mappingId, consultantId, clientId, 3, 7, 10);

        Schedule futureBooked = buildSchedule(900L, consultantId, clientId, LocalDate.now().plusDays(3), ScheduleStatus.BOOKED);
        Schedule futureConfirmed = buildSchedule(901L, consultantId, clientId, LocalDate.now().plusDays(5), ScheduleStatus.CONFIRMED);
        Schedule futureCompleted = buildSchedule(902L, consultantId, clientId, LocalDate.now().plusDays(2), ScheduleStatus.COMPLETED);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        // StatusCodeHelper: enum 이름과 동일하게 반환되도록 stub (코드값이 enum 과 동일한 운영 기본 가정)
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("SESSIONS_EXHAUSTED")))
                .thenReturn(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(ConsultantClientMapping.MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("BOOKED")))
                .thenReturn(ScheduleStatus.BOOKED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CONFIRMED")))
                .thenReturn(ScheduleStatus.CONFIRMED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CANCELLED")))
                .thenReturn(ScheduleStatus.CANCELLED.name());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(consultantId), eq(clientId), any(LocalDate.class)))
                .thenReturn(List.of(futureBooked, futureConfirmed, futureCompleted));

        adminService.partialRefundMapping(mappingId, 3, "고객 요청 부분 환불");

        // remaining=0 으로 떨어졌으므로 SESSIONS_EXHAUSTED 상태 전이
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getTotalSessions()).isEqualTo(7);
        assertThat(mapping.getStatus()).isEqualTo(ConsultantClientMapping.MappingStatus.SESSIONS_EXHAUSTED);

        // BOOKED → CANCELLED, CONFIRMED → CANCELLED, COMPLETED 는 유지
        assertThat(futureBooked.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(futureConfirmed.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(futureCompleted.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);

        // BOOKED + CONFIRMED 2건 만 저장 (COMPLETED 는 변경되지 않으므로 save 미호출)
        verify(scheduleRepository).save(futureBooked);
        verify(scheduleRepository).save(futureConfirmed);
        verify(mappingRepository, atLeastOnce()).save(mapping);
    }

    @Test
    @DisplayName("부분 환불 후 remaining > 0 이면 미래 일정 일괄 취소는 호출되지 않는다")
    void partialRefundMapping_whenRemainingStillPositive_skipsScheduleCancellation() {
        Long mappingId = 556L;
        Long consultantId = 11L;
        Long clientId = 21L;

        ConsultantClientMapping mapping = buildMappingWithRemaining(mappingId, consultantId, clientId, 5, 5, 10);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(ConsultantClientMapping.MappingStatus.TERMINATED.name());

        adminService.partialRefundMapping(mappingId, 2, "일부 환불");

        // remaining 3 (> 0) 이므로 상태 변경 + 일정 취소 미수행
        assertThat(mapping.getRemainingSessions()).isEqualTo(3);
        assertThat(mapping.getStatus()).isEqualTo(ConsultantClientMapping.MappingStatus.ACTIVE);
        org.mockito.Mockito.verify(scheduleRepository, org.mockito.Mockito.never())
                .findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                        eq(TEST_TENANT_ID), eq(consultantId), eq(clientId), any(LocalDate.class));
    }

    private ConsultantClientMapping buildMappingWithRemaining(Long mappingId, Long consultantId, Long clientId,
                                                              int remaining, int used, int total) {
        User consultant = new User();
        consultant.setId(consultantId);
        consultant.setTenantId(TEST_TENANT_ID);
        consultant.setName("상담사_테스트");
        User client = new User();
        client.setId(clientId);
        client.setTenantId(TEST_TENANT_ID);
        client.setName("내담자_테스트");

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setPackageName("테스트패키지");
        mapping.setPackagePrice(100000L);
        mapping.setPaymentDate(LocalDateTime.now().minusDays(3));
        mapping.setStatus(ConsultantClientMapping.MappingStatus.ACTIVE);
        mapping.setTenantId(TEST_TENANT_ID);
        return mapping;
    }

    private Schedule buildSchedule(Long id, Long consultantId, Long clientId, LocalDate date, ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(status);
        schedule.setTenantId(TEST_TENANT_ID);
        return schedule;
    }
}

package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.admin.AdminServiceUserFacingMessages;
import com.coresolution.consultation.dto.MappingStatusCloseResponse;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping.PaymentStatus;
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
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * AdminServiceImpl#closeMappingStatusOnly — 상태-only TERMINATED (환불 terminate 비재사용).
 *
 * @author CoreSolution
 * @since 2026-10-14
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl closeMappingStatusOnly — 상태-only 종료")
class AdminServiceImplCloseMappingStatusOnlyTest {

    private static final String TEST_TENANT_ID = "tenant-status-close-" + UUID.randomUUID();
    private static final String CLOSE_REASON = "상담 완료 — 잔여 회기 상태 종료";
    private static final String ACTOR = "admin@example.com";

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
    @Mock private UserLifecycleService userLifecycleService;
    @Mock private AdminRequestIdempotencyService adminRequestIdempotencyService;

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
        lenient().when(mappingRepository.findByTenantIdAndIdForUpdate(anyString(), anyLong()))
                .thenAnswer(inv -> mappingRepository.findByTenantIdAndId(inv.getArgument(0), inv.getArgument(1)));
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
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryLateSessionAutoSyncService.class),
                professionalProviderTypeService,
                mappingSettlementNotificationHelper,
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                userLifecycleService,
                adminRequestIdempotencyService,
                org.mockito.Mockito.mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class),
                null,
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.InstitutionLinkContractRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.ShopClientOrderLineRepository.class),
                org.mockito.Mockito.mock(com.coresolution.consultation.repository.PaymentRepository.class));
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("잔여>0 ACTIVE → TERMINATED, remaining/used/payment 미변경, ERP 미호출")
    void closeMappingStatusOnly_activeWithRemaining_terminatesWithoutRefundOrSessionChange() {
        Long mappingId = 501L;
        Long consultantId = 11L;
        Long clientId = 22L;
        ConsultantClientMapping mapping = activeMapping(mappingId, consultantId, clientId, 10, 3, 7);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        stubClosedStatusCodes();
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(consultantId), eq(clientId), any(LocalDate.class)))
                .thenReturn(List.of());

        MappingStatusCloseResponse result = adminService.closeMappingStatusOnly(mappingId, CLOSE_REASON, ACTOR);

        assertThat(result.isAlreadyClosed()).isFalse();
        assertThat(result.getStatus()).isEqualTo(MappingStatus.TERMINATED.name());
        assertThat(result.getRemainingSessions()).isEqualTo(7);
        assertThat(result.getUsedSessions()).isEqualTo(3);
        assertThat(result.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED.name());
        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        assertThat(mapping.getRemainingSessions()).isEqualTo(7);
        assertThat(mapping.getUsedSessions()).isEqualTo(3);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        assertThat(mapping.getTerminationReason()).isEqualTo(CLOSE_REASON);
        assertThat(mapping.getTerminatedBy()).isEqualTo(ACTOR);
        assertThat(mapping.getTerminatedAt()).isNotNull();
        assertThat(mapping.getNotes()).contains("상태 종료").contains(CLOSE_REASON).doesNotContain("환불");
        verifyNoInteractions(financialTransactionService, financialTransactionRepository);
        verify(refundAutoCancelNotificationService, never())
                .dispatchRefundAutoCancelNotification(anyString(), any(), anyLong(), org.mockito.ArgumentMatchers.anyInt(), any());
    }

    @Test
    @DisplayName("이미 TERMINATED → 멱등 성공, 저장·일정취소·ERP 미호출")
    void closeMappingStatusOnly_alreadyTerminated_idempotentSuccess() {
        Long mappingId = 502L;
        ConsultantClientMapping mapping = activeMapping(mappingId, 1L, 2L, 5, 5, 0);
        mapping.setStatus(MappingStatus.TERMINATED);
        mapping.setTerminationReason("이전 종료");
        mapping.setTerminatedBy("prior@example.com");
        mapping.setTerminatedAt(LocalDateTime.now().minusDays(1));

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        stubClosedStatusCodes();

        MappingStatusCloseResponse result = adminService.closeMappingStatusOnly(mappingId, CLOSE_REASON, ACTOR);

        assertThat(result.isAlreadyClosed()).isTrue();
        assertThat(result.getStatus()).isEqualTo(MappingStatus.TERMINATED.name());
        assertThat(result.getCancelledScheduleCount()).isZero();
        verify(mappingRepository, never()).save(any());
        verifyNoInteractions(scheduleRepository, financialTransactionService);
    }

    @Test
    @DisplayName("reason blank → IllegalArgumentException (4xx)")
    void closeMappingStatusOnly_blankReason_throws() {
        assertThatThrownBy(() -> adminService.closeMappingStatusOnly(1L, "   ", ACTOR))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(AdminServiceUserFacingMessages.MSG_STATUS_CLOSE_REASON_REQUIRED);
        verify(mappingRepository, never()).findByTenantIdAndIdForUpdate(anyString(), anyLong());
    }

    @Test
    @DisplayName("미래 BOOKED 일정 있으면 STATUS_CLOSE_AUTO_CANCEL 로 CANCELLED")
    void closeMappingStatusOnly_cancelsFutureOccupyingSchedules() {
        Long mappingId = 503L;
        Long consultantId = 31L;
        Long clientId = 41L;
        ConsultantClientMapping mapping = activeMapping(mappingId, consultantId, clientId, 4, 1, 3);
        Schedule futureBooked = buildSchedule(900L, consultantId, clientId, mappingId,
                LocalDate.now().plusDays(2), ScheduleStatus.BOOKED);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        stubClosedStatusCodes();
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("BOOKED")))
                .thenReturn(ScheduleStatus.BOOKED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CONFIRMED")))
                .thenReturn(ScheduleStatus.CONFIRMED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CANCELLED")))
                .thenReturn(ScheduleStatus.CANCELLED.name());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(consultantId), eq(clientId), any(LocalDate.class)))
                .thenReturn(List.of(futureBooked));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        MappingStatusCloseResponse result = adminService.closeMappingStatusOnly(mappingId, CLOSE_REASON, ACTOR);

        assertThat(result.getCancelledScheduleCount()).isEqualTo(1);
        assertThat(futureBooked.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(futureBooked.getNotes()).contains(
                AdminServiceUserFacingMessages.STATUS_CLOSE_AUTO_CANCEL_REASON_CODE);
        assertThat(mapping.getRemainingSessions()).isEqualTo(3);
        ArgumentCaptor<Schedule> scheduleCaptor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(scheduleCaptor.capture());
        assertThat(scheduleCaptor.getValue().getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
    }

    private void stubClosedStatusCodes() {
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("CANCELLED")))
                .thenReturn(MappingStatus.CANCELLED.name());
    }

    private ConsultantClientMapping activeMapping(
            Long mappingId, Long consultantId, Long clientId,
            int total, int used, int remaining) {
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(remaining);
        mapping.setPackagePrice(300000L);
        User consultant = new User();
        consultant.setId(consultantId);
        consultant.setName("상담사");
        User client = new User();
        client.setId(clientId);
        client.setName("내담자");
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        return mapping;
    }

    private Schedule buildSchedule(
            Long scheduleId, Long consultantId, Long clientId, Long mappingId,
            LocalDate date, ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setId(scheduleId);
        schedule.setTenantId(TEST_TENANT_ID);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setMappingId(mappingId);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(status);
        return schedule;
    }
}

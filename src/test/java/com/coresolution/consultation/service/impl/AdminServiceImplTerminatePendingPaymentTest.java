package com.coresolution.consultation.service.impl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.ScheduleStatus;
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
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

/**
 * AdminServiceImpl#terminateMapping — R4 결제 대기(PENDING_PAYMENT) 매칭 관리자 취소 회귀 테스트.
 *
 * <p>합의서: {@code docs/project-management/2026-05-28/R4_PENDING_PAYMENT_CLEANUP_UI_PLAN.md}.
 * 디자이너 시안: {@code docs/project-management/2026-05-28/R4_DESIGN_HANDOFF_DETAIL.md}.
 *
 * <p>매트릭스:
 * <ul>
 *   <li>PENDING_PAYMENT + SAME_DAY_CARD + 연결된 TENTATIVE_PENDING_PAYMENT 가예약 1건
 *       → TERMINATED + paymentStatus REJECTED + 가예약 CANCELLED + 환불/4채널 통지 우회</li>
 *   <li>PENDING_PAYMENT + ADVANCE + TENTATIVE 가예약 없음
 *       → TERMINATED + paymentStatus REJECTED + 가예약 조회만 + 환불 우회</li>
 *   <li>PENDING_PAYMENT + 다른 매칭의 TENTATIVE 가예약 (mappingId 불일치)
 *       → 본 매칭만 TERMINATED + 타 매칭 가예약 미침범</li>
 *   <li>ACTIVE 매칭 → 기존 환불·일정 취소·통지 흐름 회귀 0</li>
 *   <li>이미 TERMINATED 매칭 → RuntimeException ("이미 종료된 매칭입니다")</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-05-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminServiceImpl terminateMapping — R4 결제 대기 매칭 관리자 취소")
class AdminServiceImplTerminatePendingPaymentTest {

    private static final String TEST_TENANT_ID = "tenant-r4-" + UUID.randomUUID();
    private static final String ADMIN_CANCEL_REASON = "관리자 취소 — 디러티 PENDING_PAYMENT 정리";

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
    @Mock private RefundAutoCancelNotificationService refundAutoCancelNotificationService;
    @Mock private UserLifecycleService userLifecycleService;
    @Mock private AdminRequestIdempotencyService adminRequestIdempotencyService;

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
                batchNotificationDispatchService,
                refundAutoCancelNotificationService,
                userLifecycleService,
                adminRequestIdempotencyService);
        TenantContextHolder.setTenantId(TEST_TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("PENDING_PAYMENT + SAME_DAY_CARD + 연결 가예약 1건 → TERMINATED + paymentStatus REJECTED + 가예약 CANCELLED + 환불 우회")
    void terminateMapping_pendingPayment_sameDayCard_cancelsTentativeAndSkipsRefund() {
        Long mappingId = 700L;
        Long consultantId = 80L;
        Long clientId = 90L;

        ConsultantClientMapping mapping = newPendingPaymentMapping(mappingId, consultantId, clientId, "SAME_DAY_CARD");
        Schedule tentative = buildSchedule(800L, consultantId, clientId, mappingId,
                LocalDate.now().plusDays(0), ScheduleStatus.TENTATIVE_PENDING_PAYMENT);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("PENDING_PAYMENT")))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CANCELLED")))
                .thenReturn(ScheduleStatus.CANCELLED.name());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(consultantId), eq(clientId), any(LocalDate.class)))
                .thenReturn(List.of(tentative));

        adminService.terminateMapping(mappingId, ADMIN_CANCEL_REASON);

        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.REJECTED);
        assertThat(mapping.getTerminatedAt()).isNotNull();
        assertThat(mapping.getRemainingSessions()).isZero();
        // 회기 사용 이력 없음 — usedSessions 0 유지 (totalSessions 으로 채우지 않음).
        assertThat(mapping.getUsedSessions()).isZero();
        assertThat(mapping.getNotes())
                .contains("PENDING_PAYMENT 매칭 취소")
                .contains(ADMIN_CANCEL_REASON)
                .contains("취소 가예약 1건");

        assertThat(tentative.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(tentative.getNotes()).contains("PENDING_PAYMENT_CANCEL");

        verify(scheduleRepository).save(tentative);
        verify(mappingRepository, atLeastOnce()).save(mapping);
        // 환불 거래·4채널 통지·환불 완료 알림 모두 우회되어야 한다 (결제 미발생).
        verifyNoInteractions(refundAutoCancelNotificationService);
        verify(notificationService, never()).sendRefundCompleted(any(), anyInt(), anyLong());
    }

    @Test
    @DisplayName("PENDING_PAYMENT + ADVANCE + 가예약 0건 → TERMINATED + paymentStatus REJECTED + 가예약 변경 0건")
    void terminateMapping_pendingPayment_advance_noSchedules_simpleTerminate() {
        Long mappingId = 701L;
        Long consultantId = 81L;
        Long clientId = 91L;

        ConsultantClientMapping mapping = newPendingPaymentMapping(mappingId, consultantId, clientId, "ADVANCE");

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("PENDING_PAYMENT")))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CANCELLED")))
                .thenReturn(ScheduleStatus.CANCELLED.name());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(consultantId), eq(clientId), any(LocalDate.class)))
                .thenReturn(List.of());

        adminService.terminateMapping(mappingId, ADMIN_CANCEL_REASON);

        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.REJECTED);
        assertThat(mapping.getNotes()).contains("취소 가예약 0건");
        verify(scheduleRepository, never()).save(any(Schedule.class));
        verifyNoInteractions(refundAutoCancelNotificationService);
    }

    @Test
    @DisplayName("PENDING_PAYMENT — 동일 상담사·내담자의 타 매칭 TENTATIVE 가예약은 침범하지 않는다 (mappingId 일치 가드)")
    void terminateMapping_pendingPayment_protectsOtherMappingTentativeSchedules() {
        Long targetMappingId = 702L;
        Long otherMappingId = 703L;
        Long consultantId = 82L;
        Long clientId = 92L;

        ConsultantClientMapping mapping = newPendingPaymentMapping(
                targetMappingId, consultantId, clientId, "SAME_DAY_CARD");
        Schedule targetTentative = buildSchedule(810L, consultantId, clientId, targetMappingId,
                LocalDate.now(), ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        Schedule otherTentative = buildSchedule(811L, consultantId, clientId, otherMappingId,
                LocalDate.now().plusDays(1), ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        Schedule nullMappingTentative = buildSchedule(812L, consultantId, clientId, null,
                LocalDate.now().plusDays(2), ScheduleStatus.TENTATIVE_PENDING_PAYMENT);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(targetMappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("PENDING_PAYMENT")))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CANCELLED")))
                .thenReturn(ScheduleStatus.CANCELLED.name());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(consultantId), eq(clientId), any(LocalDate.class)))
                .thenReturn(List.of(targetTentative, otherTentative, nullMappingTentative));

        adminService.terminateMapping(targetMappingId, ADMIN_CANCEL_REASON);

        assertThat(targetTentative.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        // mappingId 불일치 / null 인 가예약은 그대로 유지되어 다른 매칭을 보호한다.
        assertThat(otherTentative.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        assertThat(nullMappingTentative.getStatus()).isEqualTo(ScheduleStatus.TENTATIVE_PENDING_PAYMENT);
        verify(scheduleRepository).save(targetTentative);
        verify(scheduleRepository, never()).save(otherTentative);
        verify(scheduleRepository, never()).save(nullMappingTentative);
    }

    @Test
    @DisplayName("ACTIVE 매칭 → 기존 환불·일정 취소·4채널 통지 흐름 회귀 0 (R4 분기 우회)")
    void terminateMapping_activeMapping_retainsExistingRefundFlow() {
        Long mappingId = 704L;
        Long consultantId = 83L;
        Long clientId = 93L;

        ConsultantClientMapping mapping = newActiveMapping(mappingId, consultantId, clientId,
                3 /* remaining */, 7 /* used */, 10 /* total */);
        Schedule futureBooked = buildSchedule(820L, consultantId, clientId, mappingId,
                LocalDate.now().plusDays(2), ScheduleStatus.BOOKED);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("PENDING_PAYMENT")))
                .thenReturn(MappingStatus.PENDING_PAYMENT.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("BOOKED")))
                .thenReturn(ScheduleStatus.BOOKED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CONFIRMED")))
                .thenReturn(ScheduleStatus.CONFIRMED.name());
        when(statusCodeHelper.getStatusCodeValue(eq("SCHEDULE_STATUS"), eq("CANCELLED")))
                .thenReturn(ScheduleStatus.CANCELLED.name());
        when(scheduleRepository.findByTenantIdAndConsultantIdAndClientIdAndDateGreaterThanEqual(
                eq(TEST_TENANT_ID), eq(consultantId), eq(clientId), any(LocalDate.class)))
                .thenReturn(List.of(futureBooked));

        adminService.terminateMapping(mappingId, "ACTIVE 매칭 강제 종료 — 회귀 0 검증");

        assertThat(mapping.getStatus()).isEqualTo(MappingStatus.TERMINATED);
        // ACTIVE 흐름: paymentStatus 는 변경하지 않는다 (기존 행위 회귀 0).
        assertThat(mapping.getPaymentStatus()).isEqualTo(PaymentStatus.APPROVED);
        // ACTIVE 흐름: usedSessions = totalSessions 으로 채워 invariant 유지 (기존 행위).
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(mapping.getTotalSessions());
        assertThat(mapping.getNotes())
                .contains("강제 종료")
                .doesNotContain("PENDING_PAYMENT 매칭 취소");
        assertThat(futureBooked.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
        assertThat(futureBooked.getNotes()).contains("REFUND_AUTO_CANCEL");
        // ACTIVE 흐름: 4채널 의무 통지 오케스트레이터가 호출되어야 한다.
        verify(refundAutoCancelNotificationService).dispatchRefundAutoCancelNotification(
                eq(TEST_TENANT_ID), any(), eq(mappingId), eq(1), anyString());
    }

    @Test
    @DisplayName("이미 TERMINATED 매칭 → RuntimeException (\"이미 종료된 매칭입니다\")")
    void terminateMapping_alreadyTerminated_throwsRuntime() {
        Long mappingId = 705L;
        ConsultantClientMapping mapping = newPendingPaymentMapping(mappingId, 84L, 94L, "ADVANCE");
        mapping.setStatus(MappingStatus.TERMINATED);

        when(mappingRepository.findByTenantIdAndId(eq(TEST_TENANT_ID), eq(mappingId)))
                .thenReturn(Optional.of(mapping));
        when(statusCodeHelper.getStatusCodeValue(eq("MAPPING_STATUS"), eq("TERMINATED")))
                .thenReturn(MappingStatus.TERMINATED.name());

        org.assertj.core.api.Assertions
                .assertThatThrownBy(() -> adminService.terminateMapping(mappingId, ADMIN_CANCEL_REASON))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("이미 종료된 매칭입니다");

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verifyNoInteractions(refundAutoCancelNotificationService);
    }

    private ConsultantClientMapping newPendingPaymentMapping(Long mappingId, Long consultantId,
            Long clientId, String paymentTiming) {
        ConsultantClientMapping mapping = baseMapping(mappingId, consultantId, clientId);
        mapping.setStatus(MappingStatus.PENDING_PAYMENT);
        mapping.setPaymentStatus(PaymentStatus.PENDING);
        mapping.setPaymentTiming(paymentTiming);
        mapping.setTotalSessions(10);
        mapping.setRemainingSessions(0);
        mapping.setUsedSessions(0);
        return mapping;
    }

    private ConsultantClientMapping newActiveMapping(Long mappingId, Long consultantId, Long clientId,
            int remaining, int used, int total) {
        ConsultantClientMapping mapping = baseMapping(mappingId, consultantId, clientId);
        mapping.setStatus(MappingStatus.ACTIVE);
        mapping.setPaymentStatus(PaymentStatus.APPROVED);
        mapping.setTotalSessions(total);
        mapping.setRemainingSessions(remaining);
        mapping.setUsedSessions(used);
        return mapping;
    }

    private ConsultantClientMapping baseMapping(Long mappingId, Long consultantId, Long clientId) {
        User consultant = new User();
        consultant.setId(consultantId);
        consultant.setTenantId(TEST_TENANT_ID);
        consultant.setName("상담사_R4");

        User client = new User();
        client.setId(clientId);
        client.setTenantId(TEST_TENANT_ID);
        client.setName("내담자_R4");

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(mappingId);
        mapping.setTenantId(TEST_TENANT_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setPackageName("R4-test-pkg");
        mapping.setPackagePrice(500_000L);
        return mapping;
    }

    private Schedule buildSchedule(Long id, Long consultantId, Long clientId, Long mappingId,
            LocalDate date, ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setId(id);
        schedule.setTenantId(TEST_TENANT_ID);
        schedule.setConsultantId(consultantId);
        schedule.setClientId(clientId);
        schedule.setMappingId(mappingId);
        schedule.setDate(date);
        schedule.setStartTime(LocalTime.of(14, 0));
        schedule.setEndTime(LocalTime.of(15, 0));
        schedule.setStatus(status);
        return schedule;
    }
}

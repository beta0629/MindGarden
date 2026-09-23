package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ConsultationRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantClientMappingHistoryService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PlSqlConsultationRecordAlertService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.SalaryLateSessionAutoSyncService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.transaction.PlatformTransactionManager;

/**
 * 일지 세션 완료 → 링크 스케줄 COMPLETED + 회기 차감 회귀 (배영미 1-session 패턴).
 *
 * @author CoreSolution
 * @since 2026-09-23
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationRecordServiceImpl 일지 완료 → 스케줄 COMPLETED/deduct")
class ConsultationRecordServiceImplSessionCompleteScheduleSyncTest {

    private static final Long SCHEDULE_ID = 461L;
    private static final Long RECORD_ID = 9001L;
    private static final Long MAPPING_ID = 276L;
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 27L;

    @Mock private ConsultationRecordRepository consultationRecordRepository;
    @Mock private ConsultationRepository consultationRepository;
    @Mock private PlSqlConsultationRecordAlertService consultationRecordAlertService;
    @Mock private ScheduleRepository scheduleRepository;
    @Mock private ScheduleService scheduleService;
    @Mock private SalaryLateSessionAutoSyncService salaryLateSessionAutoSyncService;
    @Mock private ConsultantClientMappingRepository mappingRepository;
    @Mock private TenantAccessControlService accessControlService;
    @Mock private ConsultantRepository consultantRepository;
    @Mock private ClientRepository clientRepository;
    @Mock private UserRepository userRepository;
    @Mock private VacationRepository vacationRepository;
    @Mock private BranchRepository branchRepository;
    @Mock private CommonCodeService commonCodeService;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private SessionSyncService sessionSyncService;
    @Mock private StatisticsService statisticsService;
    @Mock private ConsultationMessageService consultationMessageService;
    @Mock private DashboardIntegrationService dashboardIntegrationService;
    @Mock private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private NotificationService notificationService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private MobilePushDispatchService mobilePushDispatchService;
    @Mock private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock private BatchNotificationDispatchService batchNotificationDispatchService;
    @Mock private ConsultantClientMappingHistoryService consultantClientMappingHistoryService;
    @Mock private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;

    @InjectMocks
    private ConsultationRecordServiceImpl recordService;

    @InjectMocks
    private ScheduleServiceImpl realScheduleService;

    private AdminServiceImpl adminService;
    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-record-complete-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        adminService = new AdminServiceImpl(
                mock(com.coresolution.consultation.repository.UserRepository.class),
                mock(com.coresolution.consultation.repository.ConsultantRepository.class),
                mock(com.coresolution.consultation.repository.ClientRepository.class),
                mappingRepository,
                mock(com.coresolution.consultation.repository.ConsultantRatingRepository.class),
                mock(com.coresolution.consultation.service.ConsultantRatingService.class),
                scheduleRepository,
                mock(ConsultationRecordRepository.class),
                mock(com.coresolution.consultation.repository.CommonCodeRepository.class),
                mock(CommonCodeService.class),
                mock(com.coresolution.core.security.PasswordService.class),
                mock(com.coresolution.consultation.util.PersonalDataEncryptionUtil.class),
                mock(ConsultantAvailabilityService.class),
                mock(ConsultationMessageService.class),
                mock(com.coresolution.consultation.service.BranchService.class),
                mock(NotificationService.class),
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
                mock(UserPersonalDataCacheService.class),
                mock(ScheduleListUserFieldsResolver.class),
                mock(com.coresolution.consultation.service.ConsultantStatsService.class),
                mock(com.coresolution.consultation.service.ClientStatsService.class),
                mock(NotificationChannelPreferenceResolutionService.class),
                mock(com.coresolution.consultation.service.PasswordResetService.class),
                mock(PlatformTransactionManager.class),
                mock(com.coresolution.consultation.service.UserIdGenerator.class),
                mock(com.coresolution.consultation.service.UserService.class),
                mock(com.coresolution.consultation.repository.ConsultantSalaryProfileRepository.class),
                scheduleService,
                salaryLateSessionAutoSyncService,
                mock(com.coresolution.consultation.service.ProfessionalProviderTypeService.class),
                mock(com.coresolution.consultation.service.MappingSettlementNotificationHelper.class),
                mock(BatchNotificationDispatchService.class),
                mock(com.coresolution.consultation.service.RefundAutoCancelNotificationService.class),
                mock(com.coresolution.consultation.service.UserLifecycleService.class),
                mock(com.coresolution.consultation.service.AdminRequestIdempotencyService.class),
                mock(com.coresolution.consultation.service.SalaryTaxRateLookupService.class));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("completeSession — 1-session BOOKED(sessionSequence null) → COMPLETED + rem=0/SESSIONS_EXHAUSTED")
    void completeSession_oneSessionBooked_deductsToExhausted() {
        ReflectionTestUtils.setField(recordService, "scheduleService", realScheduleService);

        ConsultationRecord record = activeRecord();
        Schedule booked = bookedScheduleWithoutSequence();
        ConsultantClientMapping mapping = oneSessionActiveMapping();

        when(consultationRecordRepository.findByTenantIdAndId(tenantId, RECORD_ID))
                .thenReturn(Optional.of(record));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(booked));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(tenantId, MAPPING_ID))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(adminUser());
            ConsultationRecord saved = recordService.completeSession(RECORD_ID);
            assertThat(saved.getIsSessionCompleted()).isTrue();
        }

        ArgumentCaptor<Schedule> scheduleCaptor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository, org.mockito.Mockito.atLeastOnce()).save(scheduleCaptor.capture());
        assertThat(scheduleCaptor.getAllValues())
                .anySatisfy(s -> assertThat(s.getStatus()).isEqualTo(ScheduleStatus.COMPLETED));
        assertThat(booked.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(booked.getSessionSequence()).isNotNull();

        ArgumentCaptor<ConsultantClientMapping> mappingCaptor =
                ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(mappingCaptor.capture());
        ConsultantClientMapping savedMapping = mappingCaptor.getValue();
        assertThat(savedMapping.getRemainingSessions()).isZero();
        assertThat(savedMapping.getUsedSessions()).isEqualTo(1);
        assertThat(savedMapping.getStatus()).isEqualTo(MappingStatus.SESSIONS_EXHAUSTED);
        verify(salaryLateSessionAutoSyncService).syncAfterScheduleCompleted(booked);
    }

    @Test
    @DisplayName("create isSessionCompleted=true — BOOKED → deduct 호출 + COMPLETED")
    void create_sessionCompleted_bookedSchedule_deductsAndMarksCompleted() {
        Schedule booked = bookedScheduleWithoutSequence();
        booked.setSessionSequence(1);
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(booked));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(consultationRecordAlertService.resolveConsultationRecordAlert(eq(SCHEDULE_ID), any()))
                .thenReturn(Map.of("success", true));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", SCHEDULE_ID);
        payload.put("clientId", CLIENT_ID);
        payload.put("consultantId", CONSULTANT_ID);
        payload.put("sessionNumber", 1);
        payload.put("sessionDate", LocalDate.now().toString());
        payload.put("isSessionCompleted", true);

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(adminUser());
            recordService.createConsultationRecord(payload);
        }

        verify(scheduleService).deductSessionAtCompletionIfNeeded(booked);
        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
    }

    @Test
    @DisplayName("completeSession — 이미 COMPLETED → deduct만 (상태 저장 없음)")
    void completeSession_alreadyCompleted_deductOnly() {
        ConsultationRecord record = activeRecord();
        Schedule completed = bookedScheduleWithoutSequence();
        completed.setStatus(ScheduleStatus.COMPLETED);
        completed.setSessionSequence(1);

        when(consultationRecordRepository.findByTenantIdAndId(tenantId, RECORD_ID))
                .thenReturn(Optional.of(record));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID))
                .thenReturn(Optional.of(completed));

        try (MockedStatic<SessionUtils> session = mockStatic(SessionUtils.class)) {
            session.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(adminUser());
            recordService.completeSession(RECORD_ID);
        }

        verify(scheduleService).deductSessionAtCompletionIfNeeded(completed);
        verify(scheduleRepository, never()).save(any(Schedule.class));
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("stale ACTIVE rem=1 total=1 + COMPLETED≥1 제외, 곽태원 total=2 rem=1(COMPLETED=1) 유지")
    void getActiveMappings_excludesOnlyFullyConsumedOneSessionStale() {
        ConsultantClientMapping bae = mapping(MAPPING_ID, CLIENT_ID, 1, 0, 1);
        ConsultantClientMapping kwak = mapping(277L, 28L, 2, 1, 1);
        when(mappingRepository.findActiveMappingsWithDetailsByTenantId(tenantId))
                .thenReturn(List.of(bae, kwak));
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(tenantId), eq(MAPPING_ID), eq(CONSULTANT_ID), eq(CLIENT_ID), anyCollection()))
                .thenReturn(1L);
        when(scheduleRepository.countOccupyingConsultationSchedulesForMapping(
                eq(tenantId), eq(277L), eq(CONSULTANT_ID), eq(28L), anyCollection()))
                .thenReturn(1L);

        List<ConsultantClientMapping> active = adminService.getActiveMappings();

        assertThat(active).extracting(ConsultantClientMapping::getId).containsExactly(277L);
    }

    private ConsultationRecord activeRecord() {
        ConsultationRecord r = new ConsultationRecord();
        r.setId(RECORD_ID);
        r.setTenantId(tenantId);
        r.setConsultationId(SCHEDULE_ID);
        r.setConsultantId(CONSULTANT_ID);
        r.setClientId(CLIENT_ID);
        r.setIsDeleted(false);
        r.setIsSessionCompleted(false);
        r.setSessionNumber(1);
        return r;
    }

    private Schedule bookedScheduleWithoutSequence() {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(tenantId);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        s.setMappingId(MAPPING_ID);
        s.setStatus(ScheduleStatus.BOOKED);
        s.setScheduleType("CONSULTATION");
        s.setDate(LocalDate.now());
        s.setIsDeleted(false);
        return s;
    }

    private ConsultantClientMapping oneSessionActiveMapping() {
        return mapping(MAPPING_ID, CLIENT_ID, 1, 0, 1);
    }

    private static ConsultantClientMapping mapping(
            Long id, Long clientId, int total, int used, int rem) {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(clientId);
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(id);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setTotalSessions(total);
        m.setUsedSessions(used);
        m.setRemainingSessions(rem);
        m.setStatus(MappingStatus.ACTIVE);
        return m;
    }

    private static User adminUser() {
        User admin = new User();
        admin.setId(1L);
        admin.setRole(UserRole.ADMIN);
        return admin;
    }
}

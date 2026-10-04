package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.ConsultationRecord;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ConsultationRecordDuplicateException;
import com.coresolution.consultation.exception.ValidationException;
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
import com.coresolution.consultation.service.ConsultationLogExistenceSsot;
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
import com.coresolution.consultation.util.ScheduleSessionStartGate;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
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
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 일정 시작 전 완료 차단(회기·급여 변화 0) · 시작 후 1회 차감 · 일정당 일지 1건 회귀.
 *
 * <p>실제 {@link ScheduleServiceImpl} 차감 경로를 쓰고 시계만 고정한다 — 판정은
 * {@link ScheduleSessionStartGate} 하나.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ConsultationRecordServiceImpl 시작 전 완료 차단·일지 중복 거부")
class ConsultationRecordServiceImplBeforeSessionStartTest {

    private static final Long SCHEDULE_ID = 7701L;
    private static final Long RECORD_ID = 8801L;
    private static final Long MAPPING_ID = 9901L;
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 27L;
    private static final ZoneId ZONE = ScheduleSessionStartGate.resolveZone(null);
    private static final LocalDate SESSION_DATE = LocalDate.of(2026, 10, 10);
    private static final LocalTime SESSION_START = LocalTime.of(14, 0);

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
    @Mock private ConsultationLogExistenceSsot consultationLogExistenceSsot;
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

    private String tenantId;
    private MockedStatic<SessionUtils> sessionUtils;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-before-start-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        ReflectionTestUtils.setField(recordService, "scheduleService", realScheduleService);
        sessionUtils = mockStatic(SessionUtils.class);
        sessionUtils.when(() -> SessionUtils.getCurrentUser(null)).thenReturn(adminUser());
    }

    @AfterEach
    void tearDown() {
        sessionUtils.close();
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("시작 전 update isSessionCompleted=true → 일지 미완료 저장, 회기·급여·스케줄 변화 0")
    void update_beforeStart_noDeductNoSalaryNoComplete() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusMinutes(1));
        ConsultationRecord record = activeRecord();
        Schedule booked = bookedSchedule();
        ConsultantClientMapping mapping = oneSessionMapping();
        stubRecordAndSchedule(record, booked);

        ConsultationRecord saved = recordService.updateConsultationRecord(RECORD_ID, completedPayload());

        assertThat(saved.getIsSessionCompleted()).isFalse();
        assertThat(saved.getCompletionTime()).isNull();
        assertThat(booked.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(scheduleRepository, never()).save(any(Schedule.class));
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("자정 경계 — 00:00 시작 일정, 전날 23:59 저장은 차단 / 당일 00:00 저장은 완료")
    void midnightBoundary_startAtMidnight() {
        Schedule midnight = bookedSchedule();
        midnight.setStartTime(LocalTime.MIDNIGHT);

        realScheduleService.useSessionStartClock(clockAt(SESSION_DATE.minusDays(1).atTime(23, 59)));
        assertThat(realScheduleService.isBeforeSessionStart(midnight)).isTrue();

        realScheduleService.useSessionStartClock(clockAt(SESSION_DATE.atStartOfDay()));
        assertThat(realScheduleService.isBeforeSessionStart(midnight)).isFalse();
    }

    @Test
    @DisplayName("시작 전 저장 후 시작 이후 다시 저장 → 회기 정확히 1회 차감, 이후 재저장은 추가 차감 없음")
    void beforeThenAfterStart_deductsExactlyOnce() {
        ConsultationRecord record = activeRecord();
        Schedule booked = bookedSchedule();
        ConsultantClientMapping mapping = oneSessionMapping();
        stubRecordAndSchedule(record, booked);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(tenantId, MAPPING_ID)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));

        useClockAt(SESSION_DATE.atTime(SESSION_START).minusHours(2));
        recordService.updateConsultationRecord(RECORD_ID, completedPayload());
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);

        useClockAt(SESSION_DATE.atTime(SESSION_START).plusMinutes(50));
        ConsultationRecord afterStart = recordService.updateConsultationRecord(RECORD_ID, completedPayload());
        assertThat(afterStart.getIsSessionCompleted()).isTrue();
        assertThat(booked.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(1);

        recordService.updateConsultationRecord(RECORD_ID, completedPayload());
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
        verify(salaryLateSessionAutoSyncService, times(1)).syncAfterScheduleCompleted(booked);
    }

    @Test
    @DisplayName("시작 전 completeSession API → 400(ValidationException), 차감·급여 없음")
    void completeSession_beforeStart_rejected() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusMinutes(30));
        ConsultationRecord record = activeRecord();
        Schedule booked = bookedSchedule();
        when(consultationRecordRepository.findByTenantIdAndId(tenantId, RECORD_ID)).thenReturn(Optional.of(record));
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID)).thenReturn(Optional.of(booked));

        assertThatThrownBy(() -> recordService.completeSession(RECORD_ID))
                .isInstanceOf(ValidationException.class);

        assertThat(record.getIsSessionCompleted()).isFalse();
        verify(consultationRecordRepository, never()).save(any(ConsultationRecord.class));
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("시작 전 create isSessionCompleted=true → 미완료로 저장, 차감·COMPLETED 없음")
    void create_beforeStart_savesContentOnly() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusDays(3));
        Schedule booked = bookedSchedule();
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID)).thenReturn(Optional.of(booked));
        when(consultationRecordRepository.save(any(ConsultationRecord.class))).thenAnswer(inv -> inv.getArgument(0));
        lenient().when(consultationRecordAlertService.resolveConsultationRecordAlert(eq(SCHEDULE_ID), any()))
                .thenReturn(Map.of("success", true));

        ConsultationRecord saved = recordService.createConsultationRecord(createPayload());

        assertThat(saved.getIsSessionCompleted()).isFalse();
        assertThat(booked.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        verify(scheduleRepository, never()).save(any(Schedule.class));
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("같은 일정에 활성 일지가 있으면 두 번째 create 거부 (409 예외·기존 ID 안내), 저장 없음")
    void create_secondRecordForSameSchedule_rejected() {
        Schedule booked = bookedSchedule();
        ConsultationRecord existing = activeRecord();
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID)).thenReturn(Optional.of(booked));
        when(consultationRecordRepository.existsByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, SCHEDULE_ID))
                .thenReturn(true);
        when(consultationRecordRepository.findByTenantIdAndConsultationIdAndIsDeletedFalse(tenantId, SCHEDULE_ID))
                .thenReturn(List.of(existing));

        assertThatThrownBy(() -> recordService.createConsultationRecord(createPayload()))
                .isInstanceOfSatisfying(ConsultationRecordDuplicateException.class,
                        e -> assertThat(e.getExistingRecordId()).isEqualTo(RECORD_ID));

        verify(consultationRecordRepository, never()).save(any(ConsultationRecord.class));
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    @Test
    @DisplayName("동시 생성 경합 — DB 유니크 위반은 409 예외로 변환, 차감 없음")
    void create_concurrentDuplicate_dbUniqueMappedToConflict() {
        Schedule booked = bookedSchedule();
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID)).thenReturn(Optional.of(booked));
        when(consultationRecordRepository.save(any(ConsultationRecord.class)))
                .thenThrow(new DataIntegrityViolationException("uk_consultation_records_active_schedule"));

        assertThatThrownBy(() -> recordService.createConsultationRecord(createPayload()))
                .isInstanceOf(ConsultationRecordDuplicateException.class);

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("타기관 일지 승격(markCompletedAfterConsultationLogIfOpen) — 시작 전이면 COMPLETED·급여 반영 없음")
    void institutionLinkPromotion_beforeStart_skipped() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusMinutes(5));
        Schedule booked = bookedSchedule();
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID)).thenReturn(Optional.of(booked));

        realScheduleService.markCompletedAfterConsultationLogIfOpen(tenantId, SCHEDULE_ID);

        assertThat(booked.getStatus()).isEqualTo(ScheduleStatus.BOOKED);
        verify(scheduleRepository, never()).save(any(Schedule.class));
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
    }

    @Test
    @DisplayName("타기관 일지 승격 — 시작 이후면 COMPLETED + 급여 동기화 1회")
    void institutionLinkPromotion_afterStart_completes() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).plusMinutes(5));
        Schedule booked = bookedSchedule();
        booked.setMappingId(null);
        booked.setScheduleType("INSTITUTION_LINK");
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID)).thenReturn(Optional.of(booked));
        when(consultationLogExistenceSsot.existsActiveForSchedule(tenantId, SCHEDULE_ID)).thenReturn(true);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        realScheduleService.markCompletedAfterConsultationLogIfOpen(tenantId, SCHEDULE_ID);

        assertThat(booked.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(salaryLateSessionAutoSyncService, times(1)).syncAfterScheduleCompleted(booked);
    }

    private void stubRecordAndSchedule(ConsultationRecord record, Schedule schedule) {
        when(consultationRecordRepository.findByTenantIdAndId(tenantId, RECORD_ID)).thenReturn(Optional.of(record));
        when(consultationRecordRepository.save(any(ConsultationRecord.class))).thenAnswer(inv -> inv.getArgument(0));
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID)).thenReturn(Optional.of(schedule));
    }

    private void useClockAt(LocalDateTime now) {
        realScheduleService.useSessionStartClock(clockAt(now));
    }

    private static Clock clockAt(LocalDateTime now) {
        return Clock.fixed(now.atZone(ZONE).toInstant(), ZONE);
    }

    private Map<String, Object> completedPayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", SCHEDULE_ID);
        payload.put("sessionNumber", 1);
        payload.put("isSessionCompleted", true);
        return payload;
    }

    private Map<String, Object> createPayload() {
        Map<String, Object> payload = new HashMap<>();
        payload.put("consultationId", SCHEDULE_ID);
        payload.put("clientId", CLIENT_ID);
        payload.put("consultantId", CONSULTANT_ID);
        payload.put("sessionNumber", 1);
        payload.put("isSessionCompleted", true);
        return payload;
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

    private Schedule bookedSchedule() {
        Schedule s = new Schedule();
        s.setId(SCHEDULE_ID);
        s.setTenantId(tenantId);
        s.setConsultantId(CONSULTANT_ID);
        s.setClientId(CLIENT_ID);
        s.setMappingId(MAPPING_ID);
        s.setStatus(ScheduleStatus.BOOKED);
        s.setScheduleType("CONSULTATION");
        s.setDate(SESSION_DATE);
        s.setStartTime(SESSION_START);
        s.setEndTime(SESSION_START.plusMinutes(50));
        s.setSessionSequence(1);
        s.setIsDeleted(false);
        return s;
    }

    private static ConsultantClientMapping oneSessionMapping() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping m = new ConsultantClientMapping();
        m.setId(MAPPING_ID);
        m.setConsultant(consultant);
        m.setClient(client);
        m.setTotalSessions(1);
        m.setUsedSessions(0);
        m.setRemainingSessions(1);
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

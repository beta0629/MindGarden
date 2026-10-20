package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ScheduleSessionNotStartedException;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.NotificationBatchSendLogRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.service.BatchNotificationDispatchService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantClientMappingHistoryService;
import com.coresolution.consultation.service.ConsultationLogExistenceSsot;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.ImmediateReservationSmsDeferralService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.SalaryLateSessionAutoSyncService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.util.ScheduleSessionStartGate;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.Clock;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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

/**
 * 관리자·수동 완료 경로(completeSchedule, 상태 COMPLETED 수정, 자동완료 배치) 시작 전 차단 회귀.
 *
 * <p>시작 전: {@link ScheduleSessionNotStartedException}(400), 상태·회기·급여 변화 0.
 * 시작 후: 완료되고 회기 정확히 1회 차감. 판정은 {@link ScheduleSessionStartGate} 하나.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl 수동 완료 — 시작 전 차단·시작 후 1회 차감")
class ScheduleServiceImplManualCompletionBeforeStartTest {

    private static final Long SCHEDULE_ID = 6601L;
    private static final Long MAPPING_ID = 6602L;
    private static final Long CONSULTANT_ID = 11L;
    private static final Long CLIENT_ID = 28L;
    private static final ZoneId ZONE = ScheduleSessionStartGate.resolveZone(null);
    private static final LocalDate SESSION_DATE = LocalDate.of(2026, 10, 12);
    private static final LocalTime SESSION_START = LocalTime.of(15, 0);

    @Mock private ScheduleRepository scheduleRepository;
    @Mock private TenantAccessControlService accessControlService;
    @Mock private ConsultantClientMappingRepository mappingRepository;
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
    @Mock private ConsultationRecordRepository consultationRecordRepository;
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
    @Mock private ImmediateReservationSmsDeferralService immediateReservationSmsDeferralService;
    @Mock private NotificationBatchSendLogRepository notificationBatchSendLogRepository;
    @Mock private SalaryLateSessionAutoSyncService salaryLateSessionAutoSyncService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    private String tenantId;
    private Schedule schedule;
    private ConsultantClientMapping mapping;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-manual-complete-" + UUID.randomUUID();
        TenantContextHolder.setTenantId(tenantId);
        schedule = bookedSchedule();
        mapping = oneSessionMapping();
        when(scheduleRepository.findByTenantIdAndId(tenantId, SCHEDULE_ID)).thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findByTenantIdAndId(tenantId, MAPPING_ID)).thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
        when(consultationLogExistenceSsot.existsActiveForSchedule(tenantId, SCHEDULE_ID)).thenReturn(true);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("completeSchedule 시작 전 → 400 예외, 상태 BOOKED·회기·급여 변화 0")
    void completeSchedule_beforeStart_rejectedWithoutSideEffects() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusMinutes(1));

        assertThatThrownBy(() -> scheduleService.completeSchedule(SCHEDULE_ID))
                .isInstanceOf(ScheduleSessionNotStartedException.class)
                .hasMessage(ScheduleSessionStartGate.COMPLETION_BEFORE_START_MESSAGE);

        assertUnchanged();
    }

    @Test
    @DisplayName("completeSchedule 시작 후 → COMPLETED, 회기 1회 차감, 재호출해도 추가 차감 없음")
    void completeSchedule_afterStart_deductsExactlyOnce() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).plusMinutes(10));

        Schedule completed = scheduleService.completeSchedule(SCHEDULE_ID);
        assertThat(completed.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(1);

        scheduleService.completeSchedule(SCHEDULE_ID);
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
    }

    @Test
    @DisplayName("updateSchedule 상태 COMPLETED 시작 전 → 400 예외, 저장·차감·급여 없음")
    void updateSchedule_toCompletedBeforeStart_rejected() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusHours(3));

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.COMPLETED)))
                .isInstanceOf(ScheduleSessionNotStartedException.class);

        assertUnchanged();
    }

    @Test
    @DisplayName("updateSchedule 자정 경계 — 00:00 시작 일정, 전날 23:59 완료 요청 거부")
    void updateSchedule_midnightBoundary_rejectedBeforeMidnight() {
        schedule.setStartTime(LocalTime.MIDNIGHT);
        useClockAt(SESSION_DATE.minusDays(1).atTime(23, 59));

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.COMPLETED)))
                .isInstanceOf(ScheduleSessionNotStartedException.class);

        assertUnchanged();
    }

    @Test
    @DisplayName("updateSchedule 상태 COMPLETED 시작 후 → 완료, 회기 1회 차감·급여 동기 1회")
    void updateSchedule_toCompletedAfterStart_deductsOnce() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).plusMinutes(55));

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.COMPLETED));

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(mapping.getRemainingSessions()).isZero();
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
        verify(salaryLateSessionAutoSyncService, times(1)).syncAfterScheduleCompleted(any(Schedule.class));
    }

    @Test
    @DisplayName("updateSchedule 시작 전 COMPLETED 외 상태 변경(CONFIRMED)은 차단하지 않는다")
    void updateSchedule_nonCompletedStatusBeforeStart_allowed() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusDays(1));

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.CONFIRMED));

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
    }

    @Test
    @DisplayName("자동완료 배치가 시작 전 일정을 받아도 완료·차감하지 않는다")
    void autoCompleteExpiredSchedules_beforeStart_skipped() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusMinutes(5));
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        when(scheduleRepository.findExpiredConfirmedSchedules(eq(tenantId), any(), any()))
                .thenReturn(List.of(schedule));
        when(scheduleRepository.findByDateBeforeAndStatus(eq(tenantId), any(), any()))
                .thenReturn(List.of());

        scheduleService.autoCompleteExpiredSchedules();

        assertUnchanged(ScheduleStatus.CONFIRMED);
    }

    @Test
    @DisplayName("확정 때 이미 차감된 CONFIRMED 일정(잔여 0, 소진 매핑) → 완료 허용, 추가 차감 없음")
    void updateSchedule_alreadyDeductedConfirmed_remainingZero_completesWithoutDeduction() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).plusMinutes(10));
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        markDeducted(1, 1, MappingStatus.SESSIONS_EXHAUSTED);

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.COMPLETED));

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
        assertThat(mapping.getRemainingSessions()).isZero();
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(sessionSyncService, never()).syncAfterSessionUsage(anyLong(), anyLong(), anyLong());
    }

    @Test
    @DisplayName("다회기 마지막 회차(10/10, 잔여 0, ACTIVE) 완료 → 허용, 재요청해도 차감 0")
    void updateSchedule_lastSessionOfPackage_remainingZero_completesIdempotently() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).plusMinutes(10));
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        schedule.setSessionSequence(10);
        markDeducted(10, 10, MappingStatus.ACTIVE);

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.COMPLETED));
        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);

        scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.COMPLETED));

        assertThat(mapping.getUsedSessions()).isEqualTo(10);
        assertThat(mapping.getRemainingSessions()).isZero();
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(salaryLateSessionAutoSyncService, times(1)).syncAfterScheduleCompleted(any(Schedule.class));
    }

    @Test
    @DisplayName("이미 차감된 일정이라도 시작 전 완료는 그대로 400 (#1438 차단 유지)")
    void updateSchedule_alreadyDeducted_beforeStart_stillRejected() {
        useClockAt(SESSION_DATE.atTime(SESSION_START).minusMinutes(30));
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        markDeducted(1, 1, MappingStatus.SESSIONS_EXHAUSTED);

        assertThatThrownBy(() -> scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.COMPLETED)))
                .isInstanceOf(ScheduleSessionNotStartedException.class);

        assertThat(schedule.getStatus()).isEqualTo(ScheduleStatus.CONFIRMED);
        verify(scheduleRepository, never()).save(any(Schedule.class));
    }

    @Test
    @DisplayName("지난 일정(어제) 완료 — 같은 일시를 함께 보내도 이동 판정 없이 COMPLETED, 차감 1회")
    void updateSchedule_pastScheduleCompleteWithSameSlot_allowed() {
        useClockAt(SESSION_DATE.plusDays(1).atTime(SESSION_START));
        Schedule update = statusOnly(ScheduleStatus.COMPLETED);
        update.setDate(SESSION_DATE);
        update.setStartTime(schedule.getStartTime());
        update.setEndTime(schedule.getEndTime());

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, update);

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        assertThat(saved.getDate()).isEqualTo(SESSION_DATE);
        assertThat(mapping.getUsedSessions()).isEqualTo(1);
    }

    @Test
    @DisplayName("지난 일정(어제) 취소 — 상태 변경은 과거 판정 없이 허용")
    void updateSchedule_pastScheduleCancel_allowed() {
        useClockAt(SESSION_DATE.plusDays(1).atTime(SESSION_START));

        Schedule saved = scheduleService.updateSchedule(SCHEDULE_ID, statusOnly(ScheduleStatus.CANCELLED));

        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);
    }

    private void markDeducted(int total, int used, MappingStatus status) {
        mapping.setTotalSessions(total);
        mapping.setUsedSessions(used);
        mapping.setRemainingSessions(total - used);
        mapping.setStatus(status);
    }

    private void assertUnchanged() {
        assertUnchanged(ScheduleStatus.BOOKED);
    }

    private void assertUnchanged(ScheduleStatus expectedStatus) {
        assertThat(schedule.getStatus()).isEqualTo(expectedStatus);
        assertThat(mapping.getRemainingSessions()).isEqualTo(1);
        assertThat(mapping.getUsedSessions()).isZero();
        verify(scheduleRepository, never()).save(any(Schedule.class));
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
        verify(salaryLateSessionAutoSyncService, never()).syncAfterScheduleCompleted(any());
        verify(statisticsService, never()).updateConsultantPerformance(anyLong(), any());
    }

    private void useClockAt(LocalDateTime now) {
        scheduleService.useSessionStartClock(Clock.fixed(now.atZone(ZONE).toInstant(), ZONE));
    }

    private static Schedule statusOnly(ScheduleStatus status) {
        Schedule update = new Schedule();
        update.setStatus(status);
        return update;
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
}

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.Schedule;
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
import com.coresolution.consultation.service.ConsultationLogExistenceSsot;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.ConsultantClientMappingHistoryService;
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
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
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
 * COMPLETED 가드가 classic 만이 아니라 IL 일지도 SSOT 로 인정하는지.
 *
 * @author CoreSolution
 * @since 2026-09-14
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl completeSchedule — IL 일지 SSOT")
class ScheduleServiceImplCompleteIlLogSsotTest {

    private static final String TENANT_ID = "tenant-il-complete-1";
    private static final Long SCHEDULE_ID = 436L;

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

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("IL 일지 존재(SSOT true) → COMPLETED 승격, IllegalStateException 없음")
    void completeSchedule_ilLogExists_succeeds() {
        Schedule schedule = openSchedule(ScheduleStatus.CONFIRMED);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
                .thenReturn(Optional.of(schedule));
        when(consultationLogExistenceSsot.existsActiveForSchedule(TENANT_ID, SCHEDULE_ID))
                .thenReturn(true);
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        Schedule result = scheduleService.completeSchedule(SCHEDULE_ID);

        assertThat(result.getStatus()).isEqualTo(ScheduleStatus.COMPLETED);
        verify(salaryLateSessionAutoSyncService).syncAfterScheduleCompleted(any(Schedule.class));
        verify(consultationRecordRepository, never()).existsActiveForScheduleSsot(any(), any());
    }

    @Test
    @DisplayName("일지 없음(SSOT false) → IllegalStateException")
    void completeSchedule_noLog_throws() {
        Schedule schedule = openSchedule(ScheduleStatus.CONFIRMED);
        when(scheduleRepository.findByTenantIdAndId(TENANT_ID, SCHEDULE_ID))
                .thenReturn(Optional.of(schedule));
        when(consultationLogExistenceSsot.existsActiveForSchedule(TENANT_ID, SCHEDULE_ID))
                .thenReturn(false);

        assertThatThrownBy(() -> scheduleService.completeSchedule(SCHEDULE_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("상담일지를 작성한 후 완료 처리할 수 있습니다.");
        verify(scheduleRepository, never()).save(any());
    }

    @Test
    @DisplayName("hasActiveConsultationLogSsot 는 SSOT 위임")
    void hasActiveConsultationLogSsot_delegates() {
        when(consultationLogExistenceSsot.existsActiveForSchedule(TENANT_ID, SCHEDULE_ID))
                .thenReturn(true);
        assertThat(scheduleService.hasActiveConsultationLogSsot(TENANT_ID, SCHEDULE_ID)).isTrue();
    }

    private Schedule openSchedule(ScheduleStatus status) {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setConsultantId(10L);
        schedule.setClientId(20L);
        schedule.setDate(LocalDate.of(2026, 9, 10));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));
        schedule.setStatus(status);
        schedule.setIsDeleted(false);
        return schedule;
    }
}

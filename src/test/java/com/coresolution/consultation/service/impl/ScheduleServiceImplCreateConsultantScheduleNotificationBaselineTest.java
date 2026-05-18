package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.BranchRepository;
import com.coresolution.consultation.repository.ClientRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ConsultantRepository;
import com.coresolution.consultation.repository.ConsultationRecordRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.VacationRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultationMessageService;
import com.coresolution.consultation.service.MobilePushDispatchService;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collections;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@code POST /api/v1/schedules/consultant} → {@code createConsultantSchedule} 알림 미발화 baseline (P0 코더 전).
 *
 * <p>SSOT: PAYMENT_SCHEDULE_NOTIFICATION_PUSH_AUDIT_ORCHESTRATION §3.3, P0-1.
 * 코더 연동 후 {@code never()} → {@code verify(mobilePushDispatchService).dispatch...} 등으로 갱신.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl createConsultantSchedule 알림 baseline (수정 전)")
class ScheduleServiceImplCreateConsultantScheduleNotificationBaselineTest {

    private static final String TENANT_ID = "tenant-sched-notif-" + UUID.randomUUID();
    private static final Long CONSULTANT_ID = 301L;
    private static final Long CLIENT_ID = 302L;
    private static final Long MAPPING_ID = 9001L;

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
    @Mock private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock private NotificationService notificationService;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private MobilePushDispatchService mobilePushDispatchService;

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
    @DisplayName("BOOKED 일정 등록 성공 후에도 인앱·푸시·알림톡 경로 미호출 (baseline)")
    void createConsultantSchedule_afterSave_doesNotDispatchNotifications() {
        stubConflictCheckAndAutoComplete();
        stubActiveMappingWithSessions();

        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(invocation -> {
            Schedule s = invocation.getArgument(0);
            s.setId(501L);
            return s;
        });

        LocalDate date = LocalDate.of(2026, 8, 1);
        Schedule saved = scheduleService.createConsultantSchedule(
                CONSULTANT_ID, CLIENT_ID, date,
                LocalTime.of(14, 0), LocalTime.of(15, 0),
                "상담", "설명", "VIDEO", null, false);

        assertThat(saved.getId()).isEqualTo(501L);
        assertThat(saved.getStatus()).isEqualTo(ScheduleStatus.BOOKED);

        verify(consultationMessageService, never()).sendMessage(
                anyLong(), anyLong(), any(), anyString(), anyString(), anyString(), anyString(), any(), any());
        verify(notificationService, never()).sendConsultationConfirmed(any(), any(), any(), any());
        verify(mobilePushDispatchService, never()).dispatchBookingConfirmed(anyString(), any(Schedule.class));
        verify(mobilePushDispatchService, never()).dispatchBookingReminder(anyString(), any(Schedule.class),
                anyString(), anyString());
        verify(mobilePushDispatchService, never()).dispatchSessionLow(anyString(), anyLong(), anyLong(), anyInt());
    }

    private void stubConflictCheckAndAutoComplete() {
        when(consultantAvailabilityService.isConsultantOnVacation(
                eq(CONSULTANT_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findExpiredConfirmedSchedules(anyString(), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findByDateBeforeAndStatus(anyString(), any(LocalDate.class), any()))
                .thenReturn(Collections.emptyList());
    }

    private void stubActiveMappingWithSessions() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setRemainingSessions(5);
        mapping.setStatus(MappingStatus.ACTIVE);

        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));

        ConsultantClientMapping fresh = new ConsultantClientMapping();
        fresh.setId(MAPPING_ID);
        fresh.setConsultant(consultant);
        fresh.setClient(client);
        fresh.setRemainingSessions(5);
        fresh.setTotalSessions(10);
        fresh.setUsedSessions(5);
        fresh.setStatus(MappingStatus.ACTIVE);

        when(mappingRepository.findByTenantIdAndId(TENANT_ID, MAPPING_ID)).thenReturn(Optional.of(fresh));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
    }
}

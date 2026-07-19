package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.ScheduleChangeNotificationDebounceService;
import com.coresolution.consultation.service.ScheduleCreatedNotificationHelper;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * confirmSchedule 시 미차감 상담 일정에 대한 회기 차감·sessionSequence 멱등 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl confirmSchedule 회기 차감")
class ScheduleServiceImplConfirmScheduleSessionDeductionTest {

    private static final String TENANT_ID = "tenant-session-1";
    private static final Long SCHEDULE_ID = 82L;
    private static final Long MAPPING_ID = 200L;
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 27L;

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private com.coresolution.consultation.repository.UserRepository userRepository;
    @Mock
    private com.coresolution.consultation.repository.VacationRepository vacationRepository;
    @Mock
    private com.coresolution.consultation.repository.BranchRepository branchRepository;
    @Mock
    private com.coresolution.consultation.service.CommonCodeService commonCodeService;
    @Mock
    private com.coresolution.consultation.service.ConsultantAvailabilityService consultantAvailabilityService;
    @Mock
    private SessionSyncService sessionSyncService;
    @Mock
    private com.coresolution.consultation.service.StatisticsService statisticsService;
    @Mock
    private com.coresolution.consultation.service.ConsultationMessageService consultationMessageService;
    @Mock
    private com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private com.coresolution.consultation.service.MobilePushDispatchService mobilePushDispatchService;
    @Mock
    private ScheduleCreatedNotificationHelper scheduleCreatedNotificationHelper;
    @Mock
    private ScheduleChangeNotificationDebounceService scheduleChangeNotificationDebounceService;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;

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
    @DisplayName("confirmSchedule — sessionSequence 없으면 used+1·sequence 저장")
    void confirmSchedule_deductsSessionWhenNotYetApplied() {
        Schedule schedule = consultationScheduleBookedWithoutSequence();

        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setTotalSessions(2);
        mapping.setUsedSessions(1);
        mapping.setRemainingSessions(1);
        mapping.setStatus(MappingStatus.ACTIVE);

        ConsultantClientMapping fresh = new ConsultantClientMapping();
        fresh.setId(MAPPING_ID);
        fresh.setConsultant(consultant);
        fresh.setClient(client);
        fresh.setTotalSessions(2);
        fresh.setUsedSessions(1);
        fresh.setRemainingSessions(1);
        fresh.setStatus(MappingStatus.ACTIVE);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findActiveOrExhaustedListByTenantIdAndConsultantIdAndClientId(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(java.util.List.of(mapping));
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(MAPPING_ID)))
                .thenReturn(Optional.of(fresh));

        scheduleService.confirmSchedule(SCHEDULE_ID, "관리자 확정");

        ArgumentCaptor<ConsultantClientMapping> mappingCaptor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(mappingCaptor.capture());
        assertThat(mappingCaptor.getValue().getUsedSessions()).isEqualTo(2);
        assertThat(mappingCaptor.getValue().getRemainingSessions()).isEqualTo(0);

        ArgumentCaptor<Schedule> scheduleCaptor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleRepository, org.mockito.Mockito.atLeast(2)).save(scheduleCaptor.capture());
        Schedule lastSaved = scheduleCaptor.getAllValues().get(scheduleCaptor.getAllValues().size() - 1);
        assertThat(lastSaved.getSessionSequence()).isEqualTo(2);
        assertThat(lastSaved.getMappingId()).isEqualTo(MAPPING_ID);
    }

    @Test
    @DisplayName("confirmSchedule — sessionSequence 있으면 중복 차감 안 함")
    void confirmSchedule_skipsDeductionWhenSequencePresent() {
        Schedule schedule = consultationScheduleBookedWithoutSequence();
        schedule.setSessionSequence(1);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.confirmSchedule(SCHEDULE_ID, "확정");

        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }

    private static Schedule consultationScheduleBookedWithoutSequence() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setScheduleType("CONSULTATION");
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);
        return schedule;
    }
}

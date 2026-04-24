package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.ConsultantClientMapping.MappingStatus;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * ScheduleServiceImpl - 예약 취소 시 회기 복원 단위 테스트
 *
 * @author MindGarden
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl 예약 취소 시 회기 복원 단위 테스트")
class ScheduleServiceImplCancelRestoreSessionTest {

    private static final String TENANT_ID = "test-tenant";
    private static final Long SCHEDULE_ID = 1L;
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 20L;

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
    private com.coresolution.consultation.service.SessionSyncService sessionSyncService;
    @Mock
    private com.coresolution.consultation.service.StatisticsService statisticsService;
    @Mock
    private com.coresolution.consultation.service.ConsultationMessageService consultationMessageService;
    @Mock
    private com.coresolution.core.service.DashboardIntegrationService dashboardIntegrationService;

    @Mock
    private NotificationService notificationService;

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
    @DisplayName("cancelSchedule - BOOKED 예약 취소 시 매핑 회기 1회 복원")
    void cancelSchedule_booked_restoresSession() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(100L);
        mapping.setTotalSessions(10);
        mapping.setRemainingSessions(9);
        mapping.setUsedSessions(1);
        mapping.setStatus(MappingStatus.ACTIVE);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(mapping));

        Schedule result = scheduleService.cancelSchedule(SCHEDULE_ID, "테스트 취소");

        assertThat(result.getStatus()).isEqualTo(ScheduleStatus.CANCELLED);

        ArgumentCaptor<ConsultantClientMapping> mappingCaptor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(mappingCaptor.capture());
        ConsultantClientMapping savedMapping = mappingCaptor.getValue();
        assertThat(savedMapping.getRemainingSessions()).isEqualTo(10);
        assertThat(savedMapping.getUsedSessions()).isEqualTo(0);
    }

    @Test
    @DisplayName("cancelSchedule - CONFIRMED 예약 취소 시에도 회기 복원")
    void cancelSchedule_confirmed_restoresSession() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setStatus(ScheduleStatus.CONFIRMED);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(100L);
        mapping.setRemainingSessions(5);
        mapping.setUsedSessions(5);
        mapping.setStatus(MappingStatus.ACTIVE);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));
        when(mappingRepository.findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(
                eq(TENANT_ID), eq(CONSULTANT_ID), eq(CLIENT_ID)))
                .thenReturn(Optional.of(mapping));

        scheduleService.cancelSchedule(SCHEDULE_ID, "사유");

        ArgumentCaptor<ConsultantClientMapping> mappingCaptor = ArgumentCaptor.forClass(ConsultantClientMapping.class);
        verify(mappingRepository).save(mappingCaptor.capture());
        assertThat(mappingCaptor.getValue().getRemainingSessions()).isEqualTo(6);
        assertThat(mappingCaptor.getValue().getUsedSessions()).isEqualTo(4);
    }

    @Test
    @DisplayName("cancelSchedule - COMPLETED 예약은 취소해도 회기 복원 안 함")
    void cancelSchedule_completed_doesNotRestoreSession() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setStatus(ScheduleStatus.COMPLETED);
        schedule.setConsultantId(CONSULTANT_ID);
        schedule.setClientId(CLIENT_ID);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
                .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.cancelSchedule(SCHEDULE_ID, "테스트");

        verify(scheduleRepository).save(any(Schedule.class));
        verify(mappingRepository, never()).findActiveOrExhaustedByTenantIdAndConsultantIdAndClientId(any(), any(), any());
        verify(mappingRepository, never()).save(any(ConsultantClientMapping.class));
    }
}

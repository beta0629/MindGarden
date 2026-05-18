package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.UserRole;
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

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * {@link ScheduleServiceImpl#createConsultantSchedule} 종료 시 알림 발화 검증.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleServiceImpl notifyScheduleCreated")
class ScheduleServiceImplNotifyScheduleCreatedTest {

    private static final String TENANT_ID = "tenant-schedule-notify";
    private static final Long CONSULTANT_ID = 10L;
    private static final Long CLIENT_ID = 20L;

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private TenantAccessControlService accessControlService;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private ConsultantRepository consultantRepository;
    @Mock
    private ClientRepository clientRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private VacationRepository vacationRepository;
    @Mock
    private BranchRepository branchRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock
    private SessionSyncService sessionSyncService;
    @Mock
    private StatisticsService statisticsService;
    @Mock
    private ConsultationMessageService consultationMessageService;
    @Mock
    private DashboardIntegrationService dashboardIntegrationService;
    @Mock
    private ConsultationRecordRepository consultationRecordRepository;
    @Mock
    private PlSqlScheduleValidationService plSqlScheduleValidationService;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private NotificationService notificationService;
    @Mock
    private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock
    private MobilePushDispatchService mobilePushDispatchService;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        when(commonCodeService.getCodeValue("ROLE", UserRole.CONSULTANT.name())).thenReturn("CONSULTANT");
        when(commonCodeService.getCodeValue("ROLE", UserRole.CLIENT.name())).thenReturn("CLIENT");
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", "APPOINTMENT_CONFIRMATION"))
                .thenReturn("APPOINTMENT_CONFIRMATION");
        when(commonCodeService.getCodeValue("MESSAGE_TYPE", "NEW_APPOINTMENT")).thenReturn("NEW_APPOINTMENT");
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("createConsultantSchedule(BOOKED): 인앱 2건·booking_confirmed 푸시")
    void createConsultantSchedule_booked_sendsNotifications() {
        stubConflictCheckAndAutoComplete();
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> {
            Schedule s = inv.getArgument(0);
            s.setId(100L);
            return s;
        });
        stubMappingValidation();

        scheduleService.createConsultantSchedule(
                CONSULTANT_ID,
                CLIENT_ID,
                LocalDate.of(2026, 6, 1),
                LocalTime.of(10, 0),
                LocalTime.of(10, 50),
                "상담",
                "메모",
                false);

        verify(consultationMessageService).sendMessage(
                eq(CONSULTANT_ID),
                eq(CLIENT_ID),
                eq(null),
                eq("CONSULTANT"),
                eq("예약 확인"),
                any(),
                eq("APPOINTMENT_CONFIRMATION"),
                eq(false),
                eq(false));
        verify(consultationMessageService).sendMessage(
                eq(CONSULTANT_ID),
                eq(CLIENT_ID),
                eq(null),
                eq("CLIENT"),
                eq("새 예약"),
                any(),
                eq("NEW_APPOINTMENT"),
                eq(false),
                eq(false));
        verify(mobilePushDispatchService).dispatchBookingConfirmed(eq(TENANT_ID), any(Schedule.class));
    }

    @Test
    @DisplayName("createConsultantSchedule(가예약): 알림 미발송")
    void createConsultantSchedule_tentative_skipsNotifications() {
        stubConflictCheckAndAutoComplete();
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> {
            Schedule s = inv.getArgument(0);
            s.setId(101L);
            return s;
        });
        stubTentativeMappingValidation();

        scheduleService.createConsultantSchedule(
                CONSULTANT_ID,
                CLIENT_ID,
                LocalDate.of(2026, 6, 2),
                LocalTime.of(14, 0),
                LocalTime.of(14, 50),
                "가예약",
                null,
                true);

        verify(consultationMessageService, never()).sendMessage(any(), any(), any(), any(), any(), any(), any(), any(),
                any());
        verify(mobilePushDispatchService, never()).dispatchBookingConfirmed(any(), any());
    }

    private void stubConflictCheckAndAutoComplete() {
        when(consultantAvailabilityService.isConsultantOnVacation(
                eq(CONSULTANT_ID), any(LocalDate.class), any(LocalTime.class), any(LocalTime.class)))
                .thenReturn(false);
        when(scheduleRepository.findByTenantIdAndConsultantIdAndDate(
                eq(TENANT_ID), eq(CONSULTANT_ID), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findExpiredConfirmedSchedules(any(), any(LocalDate.class), any(LocalTime.class)))
                .thenReturn(Collections.emptyList());
        when(scheduleRepository.findByDateBeforeAndStatus(any(), any(LocalDate.class), any()))
                .thenReturn(Collections.emptyList());
    }

    private void stubMappingValidation() {
        ConsultantClientMapping mapping = buildActiveMapping();
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(mapping));
        when(mappingRepository.findByTenantIdAndId(eq(TENANT_ID), eq(mapping.getId())))
                .thenReturn(Optional.of(mapping));
        when(mappingRepository.save(any(ConsultantClientMapping.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    private void stubTentativeMappingValidation() {
        when(mappingRepository.findByTenantIdAndStatus(TENANT_ID, MappingStatus.ACTIVE))
                .thenReturn(List.of(buildActiveMapping()));
    }

    private static ConsultantClientMapping buildActiveMapping() {
        User consultant = new User();
        consultant.setId(CONSULTANT_ID);
        User client = new User();
        client.setId(CLIENT_ID);
        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setId(1L);
        mapping.setConsultant(consultant);
        mapping.setClient(client);
        mapping.setRemainingSessions(5);
        mapping.setStatus(MappingStatus.ACTIVE);
        return mapping;
    }
}

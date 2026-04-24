package com.coresolution.consultation.service.impl;

import com.coresolution.consultation.constant.ScheduleStatus;
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
import com.coresolution.consultation.service.NotificationService;
import com.coresolution.consultation.service.PlSqlScheduleValidationService;
import com.coresolution.consultation.service.SessionSyncService;
import com.coresolution.consultation.service.StatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.security.TenantAccessControlService;
import com.coresolution.core.service.DashboardIntegrationService;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * 관리자 예약 확정 시 NotificationService(알림톡→SMS 폴백) 비차단 호출 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-24
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleServiceImpl confirmSchedule 알림 연동")
class ScheduleServiceImplConfirmScheduleAlimTalkTest {

    private static final String TENANT_ID = "tenant-alim-1";
    private static final Long SCHEDULE_ID = 50L;
    private static final Long CONSULTANT_USER_ID = 11L;
    private static final Long CLIENT_USER_ID = 22L;

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
    @DisplayName("confirmSchedule 성공 시 내담자 User가 있으면 sendConsultationConfirmed 호출")
    void confirmSchedule_dispatchesNotificationWhenClientUserExists() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setConsultantId(CONSULTANT_USER_ID);
        schedule.setClientId(CLIENT_USER_ID);
        schedule.setDate(LocalDate.of(2026, 5, 1));
        schedule.setStartTime(LocalTime.of(10, 0));
        schedule.setEndTime(LocalTime.of(11, 0));

        User consultantUser = new User();
        consultantUser.setId(CONSULTANT_USER_ID);
        consultantUser.setName("enc-name-c");

        User clientUser = new User();
        clientUser.setId(CLIENT_USER_ID);
        clientUser.setName("enc-name-cl");

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
            .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(CLIENT_USER_ID)))
            .thenReturn(Optional.of(clientUser));
        when(userRepository.findByTenantIdAndId(eq(TENANT_ID), eq(CONSULTANT_USER_ID)))
            .thenReturn(Optional.of(consultantUser));

        Map<String, String> consultantDecrypted = new HashMap<>();
        consultantDecrypted.put("name", "이상담");
        when(userPersonalDataCacheService.getDecryptedUserData(eq(consultantUser))).thenReturn(consultantDecrypted);

        scheduleService.confirmSchedule(SCHEDULE_ID, "관리자 확인");

        verify(notificationService).sendConsultationConfirmed(
            eq(clientUser),
            eq("이상담"),
            eq("2026-05-01"),
            eq("10:00-11:00"));
    }

    @Test
    @DisplayName("confirmSchedule — clientId 없으면 알림 미호출")
    void confirmSchedule_skipsNotificationWithoutClient() {
        Schedule schedule = new Schedule();
        schedule.setId(SCHEDULE_ID);
        schedule.setTenantId(TENANT_ID);
        schedule.setStatus(ScheduleStatus.BOOKED);
        schedule.setConsultantId(CONSULTANT_USER_ID);
        schedule.setClientId(null);

        when(scheduleRepository.findByTenantIdAndId(eq(TENANT_ID), eq(SCHEDULE_ID)))
            .thenReturn(Optional.of(schedule));
        when(scheduleRepository.save(any(Schedule.class))).thenAnswer(inv -> inv.getArgument(0));

        scheduleService.confirmSchedule(SCHEDULE_ID, "메모");

        verify(notificationService, never()).sendConsultationConfirmed(any(), any(), any(), any());
    }
}

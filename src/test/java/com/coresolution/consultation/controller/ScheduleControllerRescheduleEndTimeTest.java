package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantDashboardService;
import com.coresolution.consultation.service.ConsultationRecordDraftService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.InstitutionLinkConsultationLogWriteRouter;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.util.ReservationSmsBusinessHours;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link ScheduleController#updateSchedule} — 시작 시각만 보낸 이동(API)은 기존 길이를 유지해 종료 시각도 이동,
 * 종료 시각을 함께 보내면(드래그·재예약 모달) 보낸 값을 그대로 사용.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleController PUT /schedules/{id} — 이동 시 종료 시각")
class ScheduleControllerRescheduleEndTimeTest {

    private static final Long SCHEDULE_ID = 8801L;
    private static final Long OWNER_USER_ID = 99L;
    private static final String TENANT_ID = "tenant-schedule-end-time-test";
    private static final LocalTime OLD_START = LocalTime.of(14, 30);
    private static final LocalTime OLD_END = LocalTime.of(15, 20);

    @Mock private ScheduleService scheduleService;
    @Mock private AdminService adminService;
    @Mock private ConsultationRecordService consultationRecordService;
    @Mock private InstitutionLinkConsultationLogWriteRouter institutionLinkConsultationLogWriteRouter;
    @Mock private ConsultationRecordDraftService consultationRecordDraftService;
    @Mock private CommonCodeService commonCodeService;
    @Mock private RoleCommonCodeAuthorizationService roleCommonCodeAuthorizationService;
    @Mock private ConsultantAvailabilityService consultantAvailabilityService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private UserRepository userRepository;
    @Mock private ScheduleListUserFieldsResolver scheduleListUserFieldsResolver;
    @Mock private ObjectMapper objectMapper;
    @Mock private ConsultantDashboardService consultantDashboardService;
    @Mock private ClientScheduleNoteRepository clientScheduleNoteRepository;
    @Mock private ConsultantClientMappingRepository consultantClientMappingRepository;

    @InjectMocks
    private ScheduleController controller;

    private MockHttpSession session;
    private LocalDate futureDate;

    @BeforeEach
    void setUp() {
        futureDate = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).plusDays(3);
        Schedule existing = new Schedule();
        existing.setId(SCHEDULE_ID);
        existing.setTenantId(TENANT_ID);
        existing.setConsultantId(OWNER_USER_ID);
        existing.setClientId(2L);
        existing.setDate(futureDate);
        existing.setStartTime(OLD_START);
        existing.setEndTime(OLD_END);
        existing.setStatus(ScheduleStatus.BOOKED);
        when(scheduleService.findById(SCHEDULE_ID)).thenReturn(existing);
        when(scheduleService.updateSchedule(eq(SCHEDULE_ID), any(Schedule.class)))
            .thenAnswer(inv -> inv.getArgument(1));

        User admin = new User();
        admin.setId(OWNER_USER_ID);
        admin.setTenantId(TENANT_ID);
        admin.setRole(UserRole.ADMIN);
        session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, admin);
        session.setAttribute(SessionConstants.TENANT_ID, TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("시작 시각만 변경 요청 → 종료 시각도 기존 길이(50분) 유지해 이동")
    void startTimeOnly_shiftsEndTimePreservingDuration() {
        Map<String, Object> body = new HashMap<>();
        body.put("date", futureDate.plusDays(1).toString());
        body.put("startTime", "08:30");

        controller.updateSchedule(SCHEDULE_ID, body, session);

        Schedule saved = captureUpdated();
        assertThat(saved.getDate()).isEqualTo(futureDate.plusDays(1));
        assertThat(saved.getStartTime()).isEqualTo(LocalTime.of(8, 30));
        assertThat(saved.getEndTime()).isEqualTo(LocalTime.of(9, 20));
    }

    @Test
    @DisplayName("시작·종료를 함께 보내면(드래그·재예약 모달) 보낸 종료 시각 사용")
    void startAndEndTime_usesRequestedEndTime() {
        Map<String, Object> body = new HashMap<>();
        body.put("startTime", "10:00");
        body.put("endTime", "11:20");

        controller.updateSchedule(SCHEDULE_ID, body, session);

        Schedule saved = captureUpdated();
        assertThat(saved.getStartTime()).isEqualTo(LocalTime.of(10, 0));
        assertThat(saved.getEndTime()).isEqualTo(LocalTime.of(11, 20));
    }

    private Schedule captureUpdated() {
        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleService).updateSchedule(eq(SCHEDULE_ID), captor.capture());
        return captor.getValue();
    }
}

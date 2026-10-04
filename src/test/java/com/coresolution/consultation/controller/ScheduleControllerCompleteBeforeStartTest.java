package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.ScheduleSessionNotStartedException;
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
 * {@link ScheduleController#updateSchedule} — 상태 COMPLETED 변경(관리자·Expo PUT) 시작 전 차단.
 *
 * <p>시작 전이면 서비스 갱신 전에 400 예외로 끝나 상태·회기·급여 변화가 없다. 같은 요청에서
 * 날짜·시작 시각을 옮기면 옮긴 값으로 판정한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleController PUT /schedules/{id} — 시작 전 COMPLETED 차단")
class ScheduleControllerCompleteBeforeStartTest {

    private static final Long SCHEDULE_ID = 8901L;
    private static final Long OWNER_USER_ID = 98L;
    private static final String TENANT_ID = "tenant-schedule-complete-gate-test";
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
    private Schedule existing;

    @BeforeEach
    void setUp() {
        futureDate = LocalDate.now(ReservationSmsBusinessHours.ZONE_SEOUL).plusDays(3);
        existing = new Schedule();
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
    @DisplayName("시작 전 status=COMPLETED → 400 예외, updateSchedule 미호출")
    void completedBeforeStart_rejectedBeforeServiceUpdate() {
        doThrow(new ScheduleSessionNotStartedException(SCHEDULE_ID))
            .when(scheduleService).requireSessionStartedForCompletion(any(Schedule.class));
        Map<String, Object> body = new HashMap<>();
        body.put("status", ScheduleStatus.COMPLETED.name());

        assertThatThrownBy(() -> controller.updateSchedule(SCHEDULE_ID, body, session))
            .isInstanceOf(ScheduleSessionNotStartedException.class);

        verify(scheduleService).requireSessionStartedForCompletion(existing);
        verify(scheduleService, never()).updateSchedule(any(), any());
    }

    @Test
    @DisplayName("시작 후 status=COMPLETED → 판정 통과 후 updateSchedule 1회")
    void completedAfterStart_delegatesToService() {
        Map<String, Object> body = new HashMap<>();
        body.put("status", ScheduleStatus.COMPLETED.name());

        controller.updateSchedule(SCHEDULE_ID, body, session);

        verify(scheduleService).requireSessionStartedForCompletion(existing);
        verify(scheduleService).updateSchedule(eq(SCHEDULE_ID), any(Schedule.class));
    }

    @Test
    @DisplayName("COMPLETED 외 상태 변경(CONFIRMED)은 시작 판정을 거치지 않는다")
    void nonCompletedStatus_skipsGate() {
        Map<String, Object> body = new HashMap<>();
        body.put("status", ScheduleStatus.CONFIRMED.name());

        controller.updateSchedule(SCHEDULE_ID, body, session);

        verify(scheduleService, never()).requireSessionStartedForCompletion(any());
        verify(scheduleService).updateSchedule(eq(SCHEDULE_ID), any(Schedule.class));
    }

    @Test
    @DisplayName("같은 요청에서 시작 시각을 옮기면 옮긴 시각으로 판정한다")
    void completedWithMovedStart_judgesIntendedSlot() {
        Map<String, Object> body = new HashMap<>();
        body.put("status", ScheduleStatus.COMPLETED.name());
        body.put("startTime", "09:00");

        controller.updateSchedule(SCHEDULE_ID, body, session);

        ArgumentCaptor<Schedule> captor = ArgumentCaptor.forClass(Schedule.class);
        verify(scheduleService).requireSessionStartedForCompletion(captor.capture());
        assertThat(captor.getValue().getStartTime()).isEqualTo(LocalTime.of(9, 0));
    }
}

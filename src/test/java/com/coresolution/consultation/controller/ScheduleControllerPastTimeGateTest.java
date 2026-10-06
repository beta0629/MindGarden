package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.ScheduleServiceUserFacingMessages;
import com.coresolution.consultation.constant.ScheduleStatus;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ScheduleCreateRequest;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.SchedulePastTimeException;
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
import com.coresolution.consultation.util.ScheduleSlotGuard;
import com.coresolution.core.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link ScheduleController} 일정 이동·생성 — {@link ScheduleService#requireMoveTimesNotInPast} /
 * {@link ScheduleService#requireCreateStartNotInPast} 공통 판정 위임.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("ScheduleController — 과거 시각 이동·생성 판정")
class ScheduleControllerPastTimeGateTest {

    private static final Long SCHEDULE_ID = 8802L;
    private static final Long OWNER_USER_ID = 98L;
    private static final Long OTHER_CONSULTANT_ID = 97L;
    private static final String TENANT_ID = "tenant-schedule-move-past-test";
    private static final LocalDate PAST_DATE = LocalDate.of(2026, 10, 6);
    private static final LocalDate FUTURE_DATE = LocalDate.of(2026, 10, 8);
    private static final LocalTime START = LocalTime.of(11, 0);
    private static final LocalTime END = LocalTime.of(11, 50);

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
    private Schedule existing;

    @BeforeEach
    void setUp() {
        existing = new Schedule();
        existing.setId(SCHEDULE_ID);
        existing.setTenantId(TENANT_ID);
        existing.setConsultantId(OWNER_USER_ID);
        existing.setClientId(2L);
        existing.setDate(PAST_DATE);
        existing.setStartTime(START);
        existing.setEndTime(END);
        existing.setStatus(ScheduleStatus.CONFIRMED);
        when(scheduleService.findById(SCHEDULE_ID)).thenReturn(existing);
        when(scheduleService.updateSchedule(eq(SCHEDULE_ID), any(Schedule.class)))
            .thenAnswer(inv -> inv.getArgument(1));
        session = sessionOf(OWNER_USER_ID, UserRole.ADMIN);
        when(dynamicPermissionService.canRegisterScheduler(UserRole.ADMIN)).thenReturn(true);
        when(consultantAvailabilityService.isConsultantOnVacation(any(), any(), any(), any())).thenReturn(false);
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(UserRole.ADMIN)).thenReturn(true);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("지난 일정 미래 이동 → 원래 시작과 이동 후 시각을 공통 판정에 넘김")
    void pastScheduleToFuture_passesOriginAndTarget() {
        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            controller.updateSchedule(SCHEDULE_ID, slotBody(FUTURE_DATE, "11:00", "11:50"), session);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        verify(scheduleService).requireMoveTimesNotInPast(
                SCHEDULE_ID, PAST_DATE.atTime(START), FUTURE_DATE.atTime(START));
        verify(scheduleService).updateSchedule(eq(SCHEDULE_ID), any(Schedule.class));
    }

    @Test
    @DisplayName("지난 일정 이동을 서비스가 거부하면 SchedulePastTimeException 전파, 저장 없음")
    void pastScheduleMove_propagatesFromPast() {
        doThrow(new SchedulePastTimeException(SCHEDULE_ID, ScheduleSlotGuard.Denial.MOVE_FROM_PAST))
            .when(scheduleService).requireMoveTimesNotInPast(eq(SCHEDULE_ID), any(), any());

        assertThatThrownBy(() ->
            controller.updateSchedule(SCHEDULE_ID, slotBody(FUTURE_DATE, "11:00", "11:50"), session))
            .isInstanceOf(SchedulePastTimeException.class)
            .extracting(e -> ((SchedulePastTimeException) e).getErrorCode())
            .isEqualTo("SCHEDULE_MOVE_FROM_PAST");
        verify(scheduleService, never()).updateSchedule(anyLong(), any(Schedule.class));
    }

    @Test
    @DisplayName("과거 시각 이동 → SchedulePastTimeException 전파, 저장 없음")
    void moveToPast_propagatesWithErrorCode() {
        existing.setDate(FUTURE_DATE);
        doThrow(new SchedulePastTimeException(SCHEDULE_ID, ScheduleSlotGuard.Denial.MOVE_TO_PAST))
            .when(scheduleService).requireMoveTimesNotInPast(eq(SCHEDULE_ID), any(LocalDateTime.class),
                any(LocalDateTime.class));

        assertThatThrownBy(() ->
            controller.updateSchedule(SCHEDULE_ID, slotBody(PAST_DATE, "11:00", "11:50"), session))
            .isInstanceOf(SchedulePastTimeException.class);
        verify(scheduleService, never()).updateSchedule(anyLong(), any(Schedule.class));
    }

    @Test
    @DisplayName("서비스 단계 과거 거부를 errorCode 없는 400 으로 바꾸지 않고 전파")
    void serviceMoveToPast_notSwallowedByIllegalStateCatch() {
        when(scheduleService.updateSchedule(eq(SCHEDULE_ID), any(Schedule.class)))
            .thenThrow(new SchedulePastTimeException(SCHEDULE_ID, ScheduleSlotGuard.Denial.MOVE_TO_PAST));

        assertThatThrownBy(() ->
            controller.updateSchedule(SCHEDULE_ID, slotBody(FUTURE_DATE, "11:00", "11:50"), session))
            .isInstanceOf(SchedulePastTimeException.class);
    }

    @Test
    @DisplayName("지난 날짜 그대로 상태만 변경(슬롯 미변경) → 과거 판정 생략")
    void samePastDate_statusOnly_notJudged() {
        Map<String, Object> body = slotBody(PAST_DATE, "11:00", "11:50");
        body.put("status", ScheduleStatus.CONFIRMED.name());

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            controller.updateSchedule(SCHEDULE_ID, body, session);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        verify(scheduleService, never()).requireMoveTimesNotInPast(any(), any(), any());
    }

    @Test
    @DisplayName("COMPLETED 일정 이동 → 기존 문구 400 유지, 과거 판정 호출 없음")
    void completed_existingDenyMessage() {
        existing.setStatus(ScheduleStatus.COMPLETED);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            controller.updateSchedule(SCHEDULE_ID, slotBody(FUTURE_DATE, "11:00", "11:50"), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getMessage())
            .isEqualTo(ScheduleServiceUserFacingMessages.MSG_COMPLETED_SLOT_CHANGE_DENIED);
        verify(scheduleService, never()).requireMoveTimesNotInPast(any(), any(), any());
        verify(scheduleService, never()).updateSchedule(anyLong(), any(Schedule.class));
    }

    @Test
    @DisplayName("미인증 → AccessDenied, 판정·저장 없음")
    void unauthenticated_rejected() {
        assertThatThrownBy(() ->
            controller.updateSchedule(SCHEDULE_ID, slotBody(FUTURE_DATE, "11:00", "11:50"), new MockHttpSession()))
            .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).requireMoveTimesNotInPast(any(), any(), any());
        verify(scheduleService, never()).updateSchedule(anyLong(), any(Schedule.class));
    }

    @Test
    @DisplayName("다른 상담사 일정을 상담사가 이동 → AccessDenied, 판정·저장 없음")
    void otherConsultant_rejected() {
        MockHttpSession consultantSession = sessionOf(OTHER_CONSULTANT_ID, UserRole.CONSULTANT);

        assertThatThrownBy(() ->
            controller.updateSchedule(SCHEDULE_ID, slotBody(FUTURE_DATE, "11:00", "11:50"), consultantSession))
            .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).requireMoveTimesNotInPast(any(), any(), any());
        verify(scheduleService, never()).updateSchedule(anyLong(), any(Schedule.class));
    }

    @Test
    @DisplayName("과거 시작으로 일정 생성 → SchedulePastTimeException, createConsultantSchedule 미호출")
    void create_pastStart_rejected() {
        doThrow(new SchedulePastTimeException(null, ScheduleSlotGuard.Denial.CREATE_IN_PAST))
            .when(scheduleService).requireCreateStartNotInPast(PAST_DATE, START);

        assertThatThrownBy(() -> controller.createConsultantSchedule(createRequest(PAST_DATE, false), session))
            .isInstanceOf(SchedulePastTimeException.class)
            .extracting(e -> ((SchedulePastTimeException) e).getErrorCode())
            .isEqualTo("SCHEDULE_CREATE_IN_PAST");
        verify(scheduleService, never()).createConsultantSchedule(
            any(), any(), any(), any(), any(), any(), any(), any(), any(), anyBoolean());
    }

    @Test
    @DisplayName("과거 시작 가예약 생성 → SchedulePastTimeException, 저장 없음")
    void create_tentativePastStart_rejected() {
        doThrow(new SchedulePastTimeException(null, ScheduleSlotGuard.Denial.CREATE_IN_PAST))
            .when(scheduleService).requireCreateStartNotInPast(PAST_DATE, START);

        assertThatThrownBy(() -> controller.createConsultantSchedule(createRequest(PAST_DATE, true), session))
            .isInstanceOf(SchedulePastTimeException.class);
        verify(scheduleService, never()).createConsultantSchedule(
            any(), any(), any(), any(), any(), any(), any(), any(), any(), anyBoolean());
    }

    @Test
    @DisplayName("미래 시작 생성 → 공통 판정 통과 후 createConsultantSchedule 호출")
    void create_futureStart_allowed() {
        Schedule created = new Schedule();
        created.setId(9101L);
        when(scheduleService.createConsultantSchedule(
            any(), any(), any(), any(), any(), any(), any(), any(), any(), anyBoolean()))
            .thenReturn(created);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
            controller.createConsultantSchedule(createRequest(FUTURE_DATE, false), session);

        assertThat(response.getStatusCode().is2xxSuccessful()).isTrue();
        verify(scheduleService).requireCreateStartNotInPast(FUTURE_DATE, START);
        verify(scheduleService).createConsultantSchedule(
            any(), any(), any(), any(), any(), any(), any(), any(), any(), anyBoolean());
    }

    private Map<String, Object> slotBody(LocalDate date, String start, String end) {
        Map<String, Object> body = new HashMap<>();
        body.put("date", date.toString());
        body.put("startTime", start);
        body.put("endTime", end);
        return body;
    }

    private ScheduleCreateRequest createRequest(LocalDate date, boolean tentative) {
        return ScheduleCreateRequest.builder()
            .consultantId(OWNER_USER_ID)
            .clientId(2L)
            .date(date.toString())
            .startTime("11:00")
            .endTime("11:50")
            .title("create-gate")
            .tentativeBeforeDeposit(tentative)
            .build();
    }

    private MockHttpSession sessionOf(Long userId, UserRole role) {
        User user = new User();
        user.setId(userId);
        user.setTenantId(TENANT_ID);
        user.setRole(role);
        MockHttpSession s = new MockHttpSession();
        s.setAttribute(SessionConstants.USER_OBJECT, user);
        s.setAttribute(SessionConstants.TENANT_ID, TENANT_ID);
        return s;
    }
}

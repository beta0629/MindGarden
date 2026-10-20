package com.coresolution.core.controller.academy;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.Consultation;
import com.coresolution.consultation.entity.Schedule;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.SchedulePastTimeException;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.ConsultationService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.util.ScheduleSlotGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.dto.academy.AcademyConsultationRequest;
import com.coresolution.core.dto.academy.AcademyConsultationResponse;
import com.coresolution.core.service.academy.ClassEnrollmentService;
import java.time.LocalDate;
import java.time.LocalTime;
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
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link AcademyConsultationController#createConsultation} — 일정이 함께 만들어지는 상담 요청은
 * 상담 저장 전에 {@link ScheduleService#requireCreateStartNotInPast} 로 과거 시작을 거부한다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AcademyConsultationController — 과거 시작 상담 요청 판정")
class AcademyConsultationControllerPastTimeTest {

    private static final String TENANT_ID = "tenant-academy-past-test";
    private static final Long ADMIN_ID = 501L;
    private static final Long CLIENT_ID = 502L;
    private static final Long CONSULTANT_ID = 503L;
    private static final LocalDate PAST_DATE = LocalDate.of(2026, 10, 5);
    private static final LocalDate FUTURE_DATE = LocalDate.of(2026, 10, 8);
    private static final LocalTime START = LocalTime.of(11, 0);
    private static final LocalTime END = LocalTime.of(11, 50);

    @Mock private ConsultationService consultationService;
    @Mock private ScheduleService scheduleService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private ConsultationRecordService consultationRecordService;
    @Mock private ClassEnrollmentService enrollmentService;

    @InjectMocks
    private AcademyConsultationController controller;

    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        session = adminSession();
        when(consultationService.createConsultationRequest(any(Consultation.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        Schedule schedule = new Schedule();
        schedule.setId(9001L);
        when(scheduleService.createConsultantSchedule(
            any(), any(), any(), any(), any(), anyString(), any(), anyString(), any()))
            .thenReturn(schedule);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("과거 시작 + 일정 동반 → SchedulePastTimeException(CREATE_IN_PAST), 상담·일정 저장 없음")
    void pastStartWithSchedule_rejectedBeforeConsultationSaved() {
        doThrow(new SchedulePastTimeException(null, ScheduleSlotGuard.Denial.CREATE_IN_PAST))
            .when(scheduleService).requireCreateStartNotInPast(PAST_DATE, START);

        assertThatThrownBy(() -> controller.createConsultation(request(CONSULTANT_ID, PAST_DATE), session))
            .isInstanceOf(SchedulePastTimeException.class)
            .extracting(e -> ((SchedulePastTimeException) e).getErrorCode())
            .isEqualTo(ScheduleSlotGuard.Denial.CREATE_IN_PAST.getErrorCode());
        verify(consultationService, never()).createConsultationRequest(any());
        verify(scheduleService, never()).createConsultantSchedule(
            any(), any(), any(), any(), any(), anyString(), any(), anyString(), any());
    }

    @Test
    @DisplayName("미래 시작 + 일정 동반 → 판정 통과 후 상담·일정 생성(201)")
    void futureStartWithSchedule_created() {
        ResponseEntity<ApiResponse<AcademyConsultationResponse>> response =
            controller.createConsultation(request(CONSULTANT_ID, FUTURE_DATE), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        verify(scheduleService).requireCreateStartNotInPast(FUTURE_DATE, START);
        verify(consultationService).createConsultationRequest(any(Consultation.class));
        verify(scheduleService).createConsultantSchedule(
            any(), any(), any(), any(), any(), anyString(), any(), anyString(), any());
    }

    @Test
    @DisplayName("상담사 미지정(일정 미생성) 요청 → 일정 과거 판정 대상 아님, 상담만 생성")
    void withoutConsultant_noScheduleJudgement() {
        ResponseEntity<ApiResponse<AcademyConsultationResponse>> response =
            controller.createConsultation(request(null, PAST_DATE), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        verify(scheduleService, never()).requireCreateStartNotInPast(any(), any());
        verify(scheduleService, never()).createConsultantSchedule(
            any(), any(), any(), any(), any(), anyString(), any(), anyString(), any());
    }

    @Test
    @DisplayName("미인증 → 401 응답, 판정·저장 없음")
    void unauthenticated_rejected() {
        ResponseEntity<ApiResponse<AcademyConsultationResponse>> response =
            controller.createConsultation(request(CONSULTANT_ID, PAST_DATE), new MockHttpSession());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(scheduleService, never()).requireCreateStartNotInPast(any(), any());
        verify(consultationService, never()).createConsultationRequest(any());
    }

    private AcademyConsultationRequest request(Long consultantId, LocalDate date) {
        return AcademyConsultationRequest.builder()
            .clientId(CLIENT_ID)
            .consultantId(consultantId)
            .consultationDate(date)
            .startTime(START)
            .endTime(END)
            .build();
    }

    private MockHttpSession adminSession() {
        User user = new User();
        user.setId(ADMIN_ID);
        user.setTenantId(TENANT_ID);
        user.setRole(UserRole.ADMIN);
        MockHttpSession s = new MockHttpSession();
        s.setAttribute(SessionConstants.USER_OBJECT, user);
        s.setAttribute(SessionConstants.TENANT_ID, TENANT_ID);
        return s;
    }
}

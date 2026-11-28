package com.coresolution.consultation.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.constant.ApiRequestErrorMessages;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.GlobalExceptionHandler;
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
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * GET /api/v1/schedules/admin/statistics — 기간(startDate/endDate) 누락·형식 오류·역전은 500 이 아니라 400.
 *
 * <p>공통 예외 체계({@link GlobalExceptionHandler})의 MISSING_REQUEST_PARAMETER·INVALID_DATE_FORMAT 을 그대로 쓴다.</p>
 *
 * @author MindGarden
 * @since 2026-11-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleController — 관리자 스케줄 통계 기간 파라미터 검증(400)")
class ScheduleControllerAdminStatisticsParamTest {

    private static final String TENANT_ID = "tenant-admin-stats-1";
    private static final String PATH = "/api/v1/schedules/admin/statistics";

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

    @Spy
    private ClientPathAccessGuard clientPathAccessGuard = new ClientPathAccessGuard(
        mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));

    @InjectMocks
    private ScheduleController controller;

    private MockMvc mvc;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        mvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("기간 누락(startDate·endDate 없음) → 400 MISSING_REQUEST_PARAMETER + 사유 문구, 서비스 미호출")
    void missingPeriod_400() throws Exception {
        mvc.perform(get(PATH).param("userRole", "ADMIN").session(adminSession()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value(ApiRequestErrorMessages.CODE_MISSING_REQUEST_PARAMETER))
                .andExpect(jsonPath("$.message").value(ApiRequestErrorMessages.MISSING_REQUEST_PARAMETER));
        verify(scheduleService, never()).getScheduleStatisticsForAdmin(any(), any());
    }

    @Test
    @DisplayName("endDate 만 누락 → 400")
    void missingEndDate_400() throws Exception {
        mvc.perform(get(PATH).param("userRole", "ADMIN").param("startDate", "2026-11-01")
                        .session(adminSession()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value(ApiRequestErrorMessages.CODE_MISSING_REQUEST_PARAMETER));
    }

    @Test
    @DisplayName("형식 오류(startDate=bad) → 400 INVALID_DATE_FORMAT, 서비스 미호출")
    void badDateFormat_400() throws Exception {
        mvc.perform(get(PATH).param("userRole", "ADMIN").param("startDate", "bad")
                        .param("endDate", "2026-11-28").session(adminSession()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errorCode").value(ApiRequestErrorMessages.CODE_INVALID_DATE_FORMAT))
                .andExpect(jsonPath("$.message").value(ApiRequestErrorMessages.INVALID_DATE_FORMAT));
        verify(scheduleService, never()).getScheduleStatisticsForAdmin(any(), any());
    }

    @Test
    @DisplayName("기간 역전(start > end) → 400 + 사유 문구")
    void reversedPeriod_400() throws Exception {
        mvc.perform(get(PATH).param("userRole", "ADMIN").param("startDate", "2026-11-28")
                        .param("endDate", "2026-11-01").session(adminSession()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(ApiRequestErrorMessages.INVALID_DATE_RANGE));
        verify(scheduleService, never()).getScheduleStatisticsForAdmin(any(), any());
    }

    @Test
    @DisplayName("정상 기간 → 200, 서비스에 LocalDate 로 전달")
    void validPeriod_200() throws Exception {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalSchedules", 3L);
        when(scheduleService.getScheduleStatisticsForAdmin(
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 28))).thenReturn(stats);

        mvc.perform(get(PATH).param("userRole", "ADMIN").param("startDate", "2026-11-01")
                        .param("endDate", "2026-11-28").session(adminSession()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalSchedules").value(3));
        verify(scheduleService).getScheduleStatisticsForAdmin(
                LocalDate.of(2026, 11, 1), LocalDate.of(2026, 11, 28));
    }

    private MockHttpSession adminSession() {
        User user = new User();
        user.setId(1L);
        user.setRole(UserRole.ADMIN);
        user.setTenantId(TENANT_ID);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }
}

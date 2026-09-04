package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.ScheduleResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.ClientScheduleNoteRepository;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.ScheduleRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.ConsultantAvailabilityService;
import com.coresolution.consultation.service.ConsultantDashboardService;
import com.coresolution.consultation.service.ConsultationRecordDraftService;
import com.coresolution.consultation.service.ConsultationRecordService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.RoleCommonCodeAuthorizationService;
import com.coresolution.consultation.service.ScheduleListUserFieldsResolver;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link ScheduleController#getSchedulesByUserRoleAndDateRange} ·
 * {@link ScheduleController#getSchedulesByUserRole} 세션 본인 fail-closed 회귀.
 *
 * <p>상담사 홈 date-range(어제~오늘) 성능·권한 배치. admin integrated-schedule(#807) 경로는 대상 아님.</p>
 *
 * @author CoreSolution
 * @since 2026-09-04
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleController — date-range / schedules fail-closed")
class ScheduleControllerDateRangeFailClosedTest {

    private static final String TENANT_ID = "tenant-date-range-fail-closed-1";
    private static final Long SELF_ID = 42L;
    private static final Long OTHER_ID = 99L;

    @Mock private ScheduleService scheduleService;
    @Mock private AdminService adminService;
    @Mock private ConsultationRecordService consultationRecordService;
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
    @Mock private ScheduleRepository scheduleRepository;

    @InjectMocks
    private ScheduleController controller;

    private HttpSession session;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
        session = Mockito.mock(HttpSession.class);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    private User stubConsultant(Long id) {
        User user = new User();
        user.setId(id);
        user.setRole(UserRole.CONSULTANT);
        user.setTenantId(TENANT_ID);
        return user;
    }

    private User stubAdmin(Long id) {
        User user = new User();
        user.setId(id);
        user.setRole(UserRole.ADMIN);
        user.setTenantId(TENANT_ID);
        return user;
    }

    @Test
    @DisplayName("date-range: CONSULTANT 본인 userId → 200 + 서비스 dateBetween 호출")
    void dateRange_consultantSelf_ok() {
        LocalDate start = LocalDate.of(2026, 9, 3);
        LocalDate end = LocalDate.of(2026, 9, 4);
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(UserRole.CONSULTANT))
                .thenReturn(false);
        when(scheduleService.findScheduleResponsesByUserRoleAndDateBetween(
                eq(SELF_ID), eq("CONSULTANT"), eq(start), eq(end)))
                .thenReturn(Collections.emptyList());

        try (MockedStatic<SessionUtils> sessionUtils = Mockito.mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(stubConsultant(SELF_ID));

            ResponseEntity<ApiResponse<List<ScheduleResponse>>> response =
                    controller.getSchedulesByUserRoleAndDateRange(
                            SELF_ID, "CONSULTANT", start, end, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(scheduleService, times(1)).findScheduleResponsesByUserRoleAndDateBetween(
                    eq(SELF_ID), eq("CONSULTANT"), eq(start), eq(end));
        }
    }

    @Test
    @DisplayName("date-range: CONSULTANT 타인 userId → AccessDenied + 서비스 미호출")
    void dateRange_consultantOther_forbidden() {
        LocalDate start = LocalDate.of(2026, 9, 3);
        LocalDate end = LocalDate.of(2026, 9, 4);
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(UserRole.CONSULTANT))
                .thenReturn(false);

        try (MockedStatic<SessionUtils> sessionUtils = Mockito.mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(stubConsultant(SELF_ID));

            assertThatThrownBy(() -> controller.getSchedulesByUserRoleAndDateRange(
                            OTHER_ID, "CONSULTANT", start, end, session))
                    .isInstanceOf(AccessDeniedException.class);

            verify(scheduleService, never()).findScheduleResponsesByUserRoleAndDateBetween(
                    any(), any(), any(), any());
        }
    }

    @Test
    @DisplayName("date-range: tenantId 없으면 400")
    void dateRange_noTenant_badRequest() {
        TenantContextHolder.clear();
        LocalDate start = LocalDate.of(2026, 9, 3);
        LocalDate end = LocalDate.of(2026, 9, 4);

        try (MockedStatic<SessionUtils> sessionUtils = Mockito.mockStatic(SessionUtils.class)) {
            User consultant = stubConsultant(SELF_ID);
            consultant.setTenantId(null);
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(consultant);
            sessionUtils.when(() -> SessionUtils.getTenantId(session)).thenReturn(null);

            ResponseEntity<ApiResponse<List<ScheduleResponse>>> response =
                    controller.getSchedulesByUserRoleAndDateRange(
                            SELF_ID, "CONSULTANT", start, end, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
            verify(scheduleService, never()).findScheduleResponsesByUserRoleAndDateBetween(
                    any(), any(), any(), any());
        }
    }

    @Test
    @DisplayName("date-range: ADMIN 은 타인 userId 조회 허용")
    void dateRange_adminOther_ok() {
        LocalDate start = LocalDate.of(2026, 9, 3);
        LocalDate end = LocalDate.of(2026, 9, 4);
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(UserRole.ADMIN))
                .thenReturn(true);
        when(scheduleService.findScheduleResponsesByUserRoleAndDateBetween(
                eq(OTHER_ID), eq("CONSULTANT"), eq(start), eq(end)))
                .thenReturn(Collections.emptyList());

        try (MockedStatic<SessionUtils> sessionUtils = Mockito.mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(stubAdmin(1L));

            ResponseEntity<ApiResponse<List<ScheduleResponse>>> response =
                    controller.getSchedulesByUserRoleAndDateRange(
                            OTHER_ID, "CONSULTANT", start, end, session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(scheduleService, times(1)).findScheduleResponsesByUserRoleAndDateBetween(
                    eq(OTHER_ID), eq("CONSULTANT"), eq(start), eq(end));
        }
    }

    @Test
    @DisplayName("GET /schedules: CONSULTANT 타인 userId → AccessDenied")
    void getSchedules_consultantOther_forbidden() {
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(UserRole.CONSULTANT))
                .thenReturn(false);

        try (MockedStatic<SessionUtils> sessionUtils = Mockito.mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(stubConsultant(SELF_ID));

            assertThatThrownBy(() -> controller.getSchedulesByUserRole(OTHER_ID, "CONSULTANT", session))
                    .isInstanceOf(AccessDeniedException.class);

            verify(scheduleService, never()).findSchedulesWithNamesByUserRole(any(), any());
        }
    }

    @Test
    @DisplayName("GET /schedules: CONSULTANT 본인 → 서비스 호출")
    void getSchedules_consultantSelf_ok() {
        when(roleCommonCodeAuthorizationService.isAdminOrStaffRoleFromCommonCode(UserRole.CONSULTANT))
                .thenReturn(false);
        when(scheduleService.findSchedulesWithNamesByUserRole(eq(SELF_ID), eq("CONSULTANT")))
                .thenReturn(Collections.emptyList());

        try (MockedStatic<SessionUtils> sessionUtils = Mockito.mockStatic(SessionUtils.class)) {
            sessionUtils.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(stubConsultant(SELF_ID));

            ResponseEntity<ApiResponse<Map<String, Object>>> response =
                    controller.getSchedulesByUserRole(SELF_ID, "CONSULTANT", session);

            assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
            verify(scheduleService, times(1)).findSchedulesWithNamesByUserRole(eq(SELF_ID), eq("CONSULTANT"));
        }
    }
}

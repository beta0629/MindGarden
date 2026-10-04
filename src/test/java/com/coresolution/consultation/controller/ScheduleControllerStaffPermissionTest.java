package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;

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
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;

/**
 * {@link ScheduleController#confirmSchedule} STAFF == ADMIN 권한 회귀 테스트 (1.0.5).
 *
 * <p>역할은 세션 사용자에서만 읽는다. 요청 파라미터 {@code userRole} 로 위장해도 판정이 바뀌지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ScheduleController — 예약 확정 STAFF == ADMIN 권한 분기(세션 역할)")
class ScheduleControllerStaffPermissionTest {

    private static final String TENANT_ID = "tenant-staff-permission-1";
    private static final String SPOOFED_ADMIN_PARAM = "ADMIN";

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

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("STAFF 가 PUT /schedules/{id}/confirm — 200")
    void staffConfirmSchedule_200() {
        stubConfirm(42L);
        Map<String, Object> body = new HashMap<>();
        body.put("adminNote", "테스트 확정");

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.confirmSchedule(42L, body, null, sessionOf(2L, UserRole.STAFF));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(scheduleService, times(1)).confirmSchedule(eq(42L), anyString());
    }

    @Test
    @DisplayName("ADMIN 이 PUT /schedules/{id}/confirm — 200 (회귀)")
    void adminConfirmSchedule_200() {
        stubConfirm(43L);

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.confirmSchedule(43L, new HashMap<>(), null, sessionOf(1L, UserRole.ADMIN));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("CONSULTANT 가 PUT /schedules/{id}/confirm — 403")
    void consultantConfirmSchedule_forbidden() {
        assertThatThrownBy(() -> controller.confirmSchedule(
                44L, new HashMap<>(), null, sessionOf(3L, UserRole.CONSULTANT)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).confirmSchedule(anyLong(), anyString());
    }

    @Test
    @DisplayName("반례(권한) — CLIENT 가 userRole=ADMIN 으로 위장해도 403, 확정 없음")
    void clientSpoofingAdminParam_forbidden() {
        assertThatThrownBy(() -> controller.confirmSchedule(
                45L, new HashMap<>(), SPOOFED_ADMIN_PARAM, sessionOf(4L, UserRole.CLIENT)))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).confirmSchedule(anyLong(), anyString());
    }

    @Test
    @DisplayName("반례(테넌트) — 다른 기관 관리자는 403, 확정 없음")
    void adminOfOtherTenant_forbidden() {
        MockHttpSession session = sessionOf(5L, UserRole.ADMIN);
        ((User) session.getAttribute(SessionConstants.USER_OBJECT)).setTenantId("tenant-other");

        assertThatThrownBy(() -> controller.confirmSchedule(46L, new HashMap<>(), null, session))
                .isInstanceOf(AccessDeniedException.class);
        verify(scheduleService, never()).confirmSchedule(anyLong(), anyString());
    }

    // POST /schedules/auto-complete 의 역할·테넌트 분기는 ScheduleControllerAutoCompleteAuthTest 가 담당한다.

    private void stubConfirm(Long id) {
        Schedule confirmed = new Schedule();
        confirmed.setId(id);
        confirmed.setStatus(ScheduleStatus.CONFIRMED);
        lenient().when(scheduleService.confirmSchedule(eq(id), anyString())).thenReturn(confirmed);
    }

    private MockHttpSession sessionOf(Long userId, UserRole role) {
        User user = new User();
        user.setId(userId);
        user.setRole(role);
        user.setTenantId(TENANT_ID);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }
}

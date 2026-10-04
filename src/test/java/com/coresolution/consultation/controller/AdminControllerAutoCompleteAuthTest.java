package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.UnauthorizedException;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.ScheduleAutoCompleteService;
import com.coresolution.consultation.service.ScheduleAutoCompleteService.TenantAutoCompleteResult;
import com.coresolution.consultation.service.AdminService;
import com.coresolution.consultation.service.ScheduleService;
import com.coresolution.consultation.service.support.ClientPathAccessGuard;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@code POST /api/v1/admin/schedules/auto-complete} 권한·테넌트 회귀 테스트.
 *
 * <p>이전에는 역할 검사가 전혀 없어 로그인만 하면 전 테넌트 자동 완료가 돌았다. 이제는 세션 역할이
 * 같은 기관의 관리자·사무원일 때만 허용하고, 처리 범위를 호출자 테넌트 1건으로 강제한다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-04
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AdminController 자동 완료 — 세션 역할·테넌트 가드")
class AdminControllerAutoCompleteAuthTest {

    private static final String TENANT_A = "tenant-admin-auto-complete-a";
    private static final String TENANT_B = "tenant-admin-auto-complete-b";

    @Mock private AdminService adminService;
    @Mock private ScheduleService scheduleService;
    @Mock private ScheduleAutoCompleteService scheduleAutoCompleteService;

    @Spy
    private ClientPathAccessGuard clientPathAccessGuard = new ClientPathAccessGuard(
        mock(ConsultantClientMappingRepository.class), mock(UserRepository.class));

    @InjectMocks private AdminController controller;

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.setTenantId(TENANT_A);
        when(scheduleAutoCompleteService.autoCompleteExpiredSchedulesForTenant(TENANT_A))
            .thenReturn(new TenantAutoCompleteResult(TENANT_A, 1, 0));
        // run lock 은 실제처럼 공급자를 실행한다 (점유 경합은 별도 테스트).
        org.mockito.Mockito.lenient().when(scheduleAutoCompleteService.runExclusively(
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any()))
            .thenAnswer(invocation -> ((java.util.function.Supplier<?>) invocation.getArgument(1)).get());
        org.mockito.Mockito.lenient().when(adminService.autoCompleteSchedulesWithReminder())
            .thenReturn(new java.util.HashMap<>(java.util.Map.of("success", true)));
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("같은 기관 관리자 — 200, 자기 테넌트만 처리")
    void admin_ok_scopedToOwnTenant() {
        ResponseEntity<ApiResponse<Void>> response =
            controller.autoCompleteSchedules(sessionOf(1L, UserRole.ADMIN, TENANT_A));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(scheduleAutoCompleteService).autoCompleteExpiredSchedulesForTenant(TENANT_A);
        verify(scheduleAutoCompleteService, never()).autoCompleteExpiredSchedulesForTenant(TENANT_B);
        verify(scheduleService, never()).autoCompleteExpiredSchedules();
    }

    @Test
    @DisplayName("사무원(STAFF) — 200")
    void staff_ok() {
        ResponseEntity<ApiResponse<Void>> response =
            controller.autoCompleteSchedules(sessionOf(2L, UserRole.STAFF, TENANT_A));

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(scheduleAutoCompleteService).autoCompleteExpiredSchedulesForTenant(TENANT_A);
    }

    @Test
    @DisplayName("상담사 — 403, 완료 처리 없음")
    void consultant_forbidden() {
        assertThatThrownBy(() ->
            controller.autoCompleteSchedules(sessionOf(3L, UserRole.CONSULTANT, TENANT_A)))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("내담자 — 403, 완료 처리 없음")
    void client_forbidden() {
        assertThatThrownBy(() ->
            controller.autoCompleteSchedules(sessionOf(4L, UserRole.CLIENT, TENANT_A)))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("반례(권한) — 미인증 호출은 401")
    void unauthenticated_unauthorized() {
        assertThatThrownBy(() -> controller.autoCompleteSchedules(new MockHttpSession()))
            .isInstanceOf(UnauthorizedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("반례(테넌트) — 다른 기관 컨텍스트로 들어온 관리자는 403")
    void adminOfOtherTenant_forbidden() {
        assertThatThrownBy(() ->
            controller.autoCompleteSchedules(sessionOf(5L, UserRole.ADMIN, TENANT_B)))
            .isInstanceOf(AccessDeniedException.class);
        verifyNoCompletion();
    }

    @Test
    @DisplayName("미작성 알림 포함 자동 완료 — 같은 기관 관리자만 200")
    void autoCompleteWithReminder_admin_ok() {
        controller.autoCompleteSchedulesWithReminder(sessionOf(1L, UserRole.ADMIN, TENANT_A));

        verify(adminService).autoCompleteSchedulesWithReminder();
    }

    @Test
    @DisplayName("미작성 알림 포함 자동 완료 — 내담자는 403, 처리 없음")
    void autoCompleteWithReminder_client_forbidden() {
        assertThatThrownBy(() ->
            controller.autoCompleteSchedulesWithReminder(sessionOf(4L, UserRole.CLIENT, TENANT_A)))
            .isInstanceOf(AccessDeniedException.class);
        verify(adminService, never()).autoCompleteSchedulesWithReminder();
    }

    @Test
    @DisplayName("미작성 알림 포함 자동 완료 — 상담사는 403, 처리 없음")
    void autoCompleteWithReminder_consultant_forbidden() {
        assertThatThrownBy(() ->
            controller.autoCompleteSchedulesWithReminder(sessionOf(3L, UserRole.CONSULTANT, TENANT_A)))
            .isInstanceOf(AccessDeniedException.class);
        verify(adminService, never()).autoCompleteSchedulesWithReminder();
    }

    @Test
    @DisplayName("미작성 알림 포함 자동 완료 — 미인증은 401, 처리 없음")
    void autoCompleteWithReminder_unauthenticated() {
        assertThatThrownBy(() -> controller.autoCompleteSchedulesWithReminder(new MockHttpSession()))
            .isInstanceOf(UnauthorizedException.class);
        verify(adminService, never()).autoCompleteSchedulesWithReminder();
    }

    @Test
    @DisplayName("미작성 알림 포함 자동 완료 — 이미 실행 중이면 409, 처리 없음")
    void autoCompleteWithReminder_alreadyRunning_conflict() {
        org.mockito.Mockito.doThrow(new IllegalStateException(ScheduleAutoCompleteService.ALREADY_RUNNING))
            .when(scheduleAutoCompleteService).runExclusively(
                org.mockito.ArgumentMatchers.anyString(), org.mockito.ArgumentMatchers.any());

        var response = controller.autoCompleteSchedulesWithReminder(sessionOf(1L, UserRole.ADMIN, TENANT_A));

        org.assertj.core.api.Assertions.assertThat(response.getStatusCode().value()).isEqualTo(409);
        verify(adminService, never()).autoCompleteSchedulesWithReminder();
    }

    @Test
    @DisplayName("미작성 알림 포함 자동 완료 — 서비스 내부 오류는 공용 500 (원시 문구 없음)")
    void autoCompleteWithReminder_internalError_shared500() {
        java.util.Map<String, Object> failed = new java.util.HashMap<>();
        failed.put("success", false);
        failed.put("traceId", "trace-x");
        when(adminService.autoCompleteSchedulesWithReminder()).thenReturn(failed);

        var response = controller.autoCompleteSchedulesWithReminder(sessionOf(1L, UserRole.ADMIN, TENANT_A));

        org.assertj.core.api.Assertions.assertThat(response.getStatusCode().value()).isEqualTo(500);
        org.assertj.core.api.Assertions.assertThat(String.valueOf(response.getBody().getData()))
            .contains("INTERNAL_SERVER_ERROR").contains("trace-x");
    }

    private void verifyNoCompletion() {
        verify(scheduleAutoCompleteService, never()).autoCompleteExpiredSchedulesForTenant(TENANT_A);
        verify(scheduleAutoCompleteService, never()).autoCompleteExpiredSchedulesForTenant(TENANT_B);
        verify(scheduleService, never()).autoCompleteExpiredSchedules();
    }

    private MockHttpSession sessionOf(Long userId, UserRole role, String tenantId) {
        User user = new User();
        user.setId(userId);
        user.setRole(role);
        user.setTenantId(tenantId);
        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, user);
        return session;
    }
}

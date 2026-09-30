package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.auth.AdminForceLogoutRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.context.TenantContextHolder;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 * 관리자 강제 로그아웃 — ADMIN 전용·동일 테넌트 가드.
 *
 * @author CoreSolution
 * @since 2026-09-30
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminSessionForceLogoutController — ADMIN·동일 테넌트 가드")
class AdminSessionForceLogoutControllerTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";
    private static final String TARGET_EMAIL = "target@example.com";

    @Mock private UserRepository userRepository;
    @Mock private AuthService authService;
    @Mock private HttpSession session;

    private MockedStatic<SessionUtils> sessionUtilsStatic;
    private AdminSessionForceLogoutController controller;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
        controller = new AdminSessionForceLogoutController(userRepository, authService);
        TenantContextHolder.clear();
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
        TenantContextHolder.clear();
    }

    private static User user(Long id, UserRole role, String tenantId, String email) {
        User user = new User();
        user.setId(id);
        user.setEmail(email);
        user.setRole(role);
        user.setTenantId(tenantId);
        return user;
    }

    private static AdminForceLogoutRequest request() {
        return AdminForceLogoutRequest.builder().email(TARGET_EMAIL).build();
    }

    private void loginAs(User actor) {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(actor);
    }

    @Test
    @DisplayName("클래스 레벨 @PreAuthorize hasRole('ADMIN') + /api/v1/admin/sessions 경로")
    void classLevelGuardAndAdminPath() {
        PreAuthorize guard = AdminSessionForceLogoutController.class.getAnnotation(PreAuthorize.class);
        assertThat(guard).isNotNull();
        assertThat(guard.value()).isEqualTo("hasRole('ADMIN')");
        RequestMapping mapping = AdminSessionForceLogoutController.class.getAnnotation(RequestMapping.class);
        assertThat(mapping.value()).containsExactly("/api/v1/admin/sessions");
    }

    @Test
    @DisplayName("미인증 → 401, 세션 종료 없음")
    void unauthenticated_401() {
        loginAs(null);

        ResponseEntity<ApiResponse<Void>> response = controller.forceLogout(request(), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(authService, never()).terminateAllSessionsForUser(any(User.class), anyString());
    }

    @ParameterizedTest
    @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "STAFF"})
    @DisplayName("비관리자(CLIENT/CONSULTANT/STAFF) → 403, 세션 종료 없음")
    void nonAdmin_403(UserRole role) {
        loginAs(user(1L, role, TENANT_A, "actor@example.com"));

        ResponseEntity<ApiResponse<Void>> response = controller.forceLogout(request(), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userRepository, never()).findAllByTenantIdAndEmail(anyString(), anyString());
        verify(authService, never()).terminateAllSessionsForUser(any(User.class), anyString());
    }

    @Test
    @DisplayName("다른 테넌트 관리자 → 403 (자기 테넌트에서만 조회, 교차 테넌트 대상 미존재)")
    void adminOfAnotherTenant_403() {
        loginAs(user(1L, UserRole.ADMIN, TENANT_B, "admin-b@example.com"));
        when(userRepository.findAllByTenantIdAndEmail(TENANT_B, TARGET_EMAIL)).thenReturn(List.of());

        ResponseEntity<ApiResponse<Void>> response = controller.forceLogout(request(), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userRepository, never()).findAllByTenantIdAndEmail(TENANT_A, TARGET_EMAIL);
        verify(authService, never()).terminateAllSessionsForUser(any(User.class), anyString());
    }

    @Test
    @DisplayName("관리자 테넌트와 요청 테넌트 컨텍스트(헤더 등) 불일치 → 403")
    void tenantContextMismatch_403() {
        loginAs(user(1L, UserRole.ADMIN, TENANT_B, "admin-b@example.com"));
        TenantContextHolder.setTenantId(TENANT_A);

        ResponseEntity<ApiResponse<Void>> response = controller.forceLogout(request(), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userRepository, never()).findAllByTenantIdAndEmail(anyString(), anyString());
        verify(authService, never()).terminateAllSessionsForUser(any(User.class), anyString());
    }

    @Test
    @DisplayName("관리자 테넌트 없음 → 403")
    void adminWithoutTenant_403() {
        loginAs(user(1L, UserRole.ADMIN, null, "admin@example.com"));

        ResponseEntity<ApiResponse<Void>> response = controller.forceLogout(request(), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(authService, never()).terminateAllSessionsForUser(any(User.class), anyString());
    }

    @Test
    @DisplayName("동일 테넌트 관리자 → 200, 대상 계정 전체 세션 종료(ADMIN_FORCE)")
    void sameTenantAdmin_200_terminatesAllSessions() {
        loginAs(user(1L, UserRole.ADMIN, TENANT_A, "admin-a@example.com"));
        TenantContextHolder.setTenantId(TENANT_A);
        User target = user(2L, UserRole.CLIENT, TENANT_A, TARGET_EMAIL);
        when(userRepository.findAllByTenantIdAndEmail(TENANT_A, TARGET_EMAIL)).thenReturn(List.of(target));

        ResponseEntity<ApiResponse<Void>> response = controller.forceLogout(request(), session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        verify(authService).terminateAllSessionsForUser(target, SessionManagementConstants.END_REASON_ADMIN_FORCE);
    }
}

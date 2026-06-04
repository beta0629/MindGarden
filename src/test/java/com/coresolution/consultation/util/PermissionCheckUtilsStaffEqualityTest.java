package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import jakarta.servlet.http.HttpSession;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link PermissionCheckUtils#checkPermission} STAFF 동등 분기 단위 검증 (1.0.5).
 *
 * <p>STAFF 역할은 ERP 권한을 제외한 일반 권한(MAPPING_*, USER_MANAGE, SCHEDULE_*,
 * STATISTICS_VIEW 등)에 대해 ADMIN 과 동등하게 자동 통과해야 한다. ERP 권한
 * ({@code ERP_ACCESS}, {@code SALARY_MANAGE} 등)은 동적 권한 시스템으로 흘러가
 * 차단되는지를 검증한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-03
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PermissionCheckUtils — STAFF == ADMIN 동등 (ERP 제외)")
class PermissionCheckUtilsStaffEqualityTest {

    @Mock
    private HttpSession session;

    @Mock
    private DynamicPermissionService dynamicPermissionService;

    @BeforeEach
    void clearSecurityContext() {
        // SessionUtils.getCurrentUser 는 세션이 없으면 SecurityContext 를 fallback 으로 본다.
        // 다른 테스트가 남긴 SecurityContext 잔재를 명시적으로 정리해 401 케이스가 결정적으로 흐른다.
        SecurityContextHolder.clearContext();
    }

    private User userWithRole(UserRole role, String userId) {
        User user = new User();
        user.setUserId(userId);
        user.setEmail(userId + "@example.com");
        user.setName(userId);
        user.setPassword("encoded-password-1234");
        user.setRole(role);
        return user;
    }

    @Test
    @DisplayName("STAFF + MAPPING_MANAGE — 자동 통과 (null 반환)")
    void staff_mappingManage_passes() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.STAFF, "staff01"));

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "MAPPING_MANAGE", dynamicPermissionService);

        assertThat(response).isNull();
        verify(dynamicPermissionService, never()).hasPermission(any(User.class), anyString());
    }

    @Test
    @DisplayName("STAFF + USER_MANAGE — 자동 통과")
    void staff_userManage_passes() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.STAFF, "staff02"));

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "USER_MANAGE", dynamicPermissionService);

        assertThat(response).isNull();
        verify(dynamicPermissionService, never()).hasPermission(any(User.class), anyString());
    }

    @Test
    @DisplayName("STAFF + SCHEDULE_MANAGE — 자동 통과")
    void staff_scheduleManage_passes() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.STAFF, "staff03"));

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "SCHEDULE_MANAGE", dynamicPermissionService);

        assertThat(response).isNull();
        verify(dynamicPermissionService, never()).hasPermission(any(User.class), anyString());
    }

    @Test
    @DisplayName("STAFF + STATISTICS_VIEW — 자동 통과")
    void staff_statisticsView_passes() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.STAFF, "staff04"));

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "STATISTICS_VIEW", dynamicPermissionService);

        assertThat(response).isNull();
        verify(dynamicPermissionService, never()).hasPermission(any(User.class), anyString());
    }

    @Test
    @DisplayName("STAFF + ERP_ACCESS — 단락 미적용, 동적 권한이 거부하면 403")
    void staff_erpAccess_fallsThroughToDynamic() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.STAFF, "staff05"));
        lenient().when(dynamicPermissionService.hasPermission(any(User.class), eq("ERP_ACCESS")))
                .thenReturn(false);

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "ERP_ACCESS", dynamicPermissionService);

        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("STAFF + SALARY_MANAGE — 단락 미적용, 동적 권한이 거부하면 403")
    void staff_salaryManage_fallsThroughToDynamic() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.STAFF, "staff06"));
        lenient()
                .when(dynamicPermissionService.hasPermission(any(User.class), eq("SALARY_MANAGE")))
                .thenReturn(false);

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "SALARY_MANAGE", dynamicPermissionService);

        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("ADMIN + MAPPING_MANAGE — ADMIN 자동 통과(회귀)")
    void admin_mappingManage_passes() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.ADMIN, "admin01"));

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "MAPPING_MANAGE", dynamicPermissionService);

        assertThat(response).isNull();
    }

    @Test
    @DisplayName("ADMIN + ERP_ACCESS — ADMIN 단락 통과(ERP 컨트롤러는 별도 게이트 보유)")
    void admin_erpAccess_passes() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.ADMIN, "admin02"));

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "ERP_ACCESS", dynamicPermissionService);

        assertThat(response).isNull();
    }

    @Test
    @DisplayName("CONSULTANT + MAPPING_MANAGE — 단락 미적용, 동적 권한이 거부하면 403")
    void consultant_mappingManage_fallsThrough() {
        when(session.getAttribute(SessionConstants.USER_OBJECT))
                .thenReturn(userWithRole(UserRole.CONSULTANT, "consultant01"));
        lenient()
                .when(dynamicPermissionService.hasPermission(any(User.class), eq("MAPPING_MANAGE")))
                .thenReturn(false);

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "MAPPING_MANAGE", dynamicPermissionService);

        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("미인증 — 401")
    void unauthenticated_returns401() {
        when(session.getAttribute(SessionConstants.USER_OBJECT)).thenReturn(null);

        ResponseEntity<?> response = PermissionCheckUtils.checkPermission(
                session, "MAPPING_MANAGE", dynamicPermissionService);

        assertThat(response).isNotNull();
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
    }
}

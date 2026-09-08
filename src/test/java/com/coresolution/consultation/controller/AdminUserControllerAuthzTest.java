package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.BranchService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.EmailService;
import com.coresolution.consultation.service.PasswordValidationService;
import com.coresolution.consultation.service.UserAddressService;
import com.coresolution.consultation.service.UserProfileService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.utils.SessionUtils;
import jakarta.servlet.http.HttpSession;
import java.util.Map;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * AdminUserController ADMIN fail-closed 회귀 방어.
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AdminUserController — ADMIN 전용 가드")
class AdminUserControllerAuthzTest {

    @Mock private UserProfileService userProfileService;
    @Mock private UserService userService;
    @Mock private EmailService emailService;
    @Mock private PersonalDataEncryptionUtil encryptionUtil;
    @Mock private UserAddressService userAddressService;
    @Mock private BranchService branchService;
    @Mock private DynamicPermissionService dynamicPermissionService;
    @Mock private PasswordValidationService passwordValidationService;
    @Mock private HttpSession session;

    private MockedStatic<SessionUtils> sessionUtilsStatic;
    private AdminUserController controller;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
        controller = new AdminUserController(
                userProfileService,
                userService,
                emailService,
                encryptionUtil,
                userAddressService,
                branchService,
                dynamicPermissionService,
                passwordValidationService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
        SecurityContextHolder.clearContext();
    }

    private User userWithRole(UserRole role) {
        User user = new User();
        user.setId(1L);
        user.setUserId(role.name().toLowerCase());
        user.setEmail(role.name().toLowerCase() + "@example.com");
        user.setName(role.name());
        user.setPassword("encoded");
        user.setRole(role);
        return user;
    }

    @Test
    @DisplayName("미인증 getAllUsers → 401")
    void getAllUsers_unauthenticated_401() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

        ResponseEntity<Map<String, Object>> response = controller.getAllUsers(false, null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.UNAUTHORIZED);
        verify(userService, never()).findAllActive();
    }

    @Test
    @DisplayName("STAFF getAllUsers → 403 (isAdmin fail-closed)")
    void getAllUsers_staff_403() {
        User staff = userWithRole(UserRole.STAFF);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(staff);

        ResponseEntity<Map<String, Object>> response = controller.getAllUsers(false, null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userService, never()).findAllActive();
    }

    @Test
    @DisplayName("CONSULTANT changeUserRole → 403")
    void changeUserRole_consultant_403() {
        User consultant = userWithRole(UserRole.CONSULTANT);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(consultant);

        ResponseEntity<Map<String, Object>> response =
                controller.changeUserRole(99L, "ADMIN", session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
        verify(userService, never()).findActiveByIdOrThrow(any());
    }

    @Test
    @DisplayName("STAFF resetUserPassword → 403")
    void resetPassword_staff_403() {
        User staff = userWithRole(UserRole.STAFF);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(staff);

        ResponseEntity<Map<String, Object>> response =
                controller.resetUserPassword(99L, null, "NewPass1!", session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    @DisplayName("ADMIN getAllUsers → 허용")
    void getAllUsers_admin_allowed() {
        User admin = userWithRole(UserRole.ADMIN);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);
        when(userService.findAllActive()).thenReturn(java.util.List.of());

        ResponseEntity<Map<String, Object>> response = controller.getAllUsers(false, null, session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsEntry("success", true);
    }
}

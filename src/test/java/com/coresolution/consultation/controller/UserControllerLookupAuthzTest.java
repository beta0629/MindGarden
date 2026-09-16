package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.UserResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import jakarta.servlet.http.HttpSession;
import java.util.Optional;
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
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * UserController 조회 API USER_MANAGE 가드 및 DTO 반환 검증.
 *
 * @author MindGarden
 * @since 2026-09-08
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserController — email/nickname/phone 조회 권한")
class UserControllerLookupAuthzTest {

    @Mock
    private UserService userService;
    @Mock
    private DynamicPermissionService dynamicPermissionService;
    @Mock
    private HttpSession session;

    private MockedStatic<SessionUtils> sessionUtilsStatic;
    private UserController controller;

    @BeforeEach
    void setUp() {
        sessionUtilsStatic = mockStatic(SessionUtils.class);
        controller = new UserController(userService, dynamicPermissionService);
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        sessionUtilsStatic.close();
        SecurityContextHolder.clearContext();
    }

    private User userWithRole(UserRole role) {
        User user = new User();
        user.setId(10L);
        user.setUserId(role.name().toLowerCase());
        user.setEmail(role.name().toLowerCase() + "@example.com");
        user.setName(role.name());
        user.setPassword("encoded-secret");
        user.setRole(role);
        return user;
    }

    @Test
    @DisplayName("미인증 — AccessDeniedException (401 경로)")
    void getByEmail_unauthenticated_denied() {
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(null);

        assertThatThrownBy(() -> controller.getByEmail("a@example.com", session))
                .isInstanceOf(AccessDeniedException.class);
        verify(userService, never()).findByEmail(any());
    }

    @Test
    @DisplayName("CONSULTANT + USER_MANAGE 없음 → AccessDeniedException")
    void getByEmail_consultant_withoutPermission_denied() {
        User consultant = userWithRole(UserRole.CONSULTANT);
        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(consultant);
        lenient().when(dynamicPermissionService.hasPermission(any(User.class), eq("USER_MANAGE")))
                .thenReturn(false);

        assertThatThrownBy(() -> controller.getByEmail("a@example.com", session))
                .isInstanceOf(AccessDeniedException.class);
        verify(userService, never()).findByEmail(any());
    }

    @Test
    @DisplayName("ADMIN — UserResponse 반환, password 필드 없음")
    void getByEmail_admin_returnsUserResponseWithoutPassword() {
        User admin = userWithRole(UserRole.ADMIN);
        User found = userWithRole(UserRole.CLIENT);
        found.setId(99L);
        found.setEmail("client@example.com");
        found.setPassword("must-not-leak");

        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(admin);
        when(userService.findByEmail("client@example.com")).thenReturn(Optional.of(found));

        ResponseEntity<ApiResponse<UserResponse>> response =
                controller.getByEmail("client@example.com", session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getData()).isNotNull();
        assertThat(response.getBody().getData().getEmail()).isEqualTo("client@example.com");
        assertThat(response.getBody().getData().getId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("STAFF — USER_MANAGE 단락 통과 시 조회 허용")
    void getByPhone_staff_allowedViaUserManageShortCircuit() {
        User staff = userWithRole(UserRole.STAFF);
        User found = userWithRole(UserRole.CLIENT);
        found.setPhone("01012345678");

        sessionUtilsStatic.when(() -> SessionUtils.getCurrentUser(session)).thenReturn(staff);
        when(userService.findByPhone("01012345678")).thenReturn(Optional.of(found));

        ResponseEntity<ApiResponse<UserResponse>> response =
                controller.getByPhone("01012345678", session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody().getData()).isNotNull();
    }
}

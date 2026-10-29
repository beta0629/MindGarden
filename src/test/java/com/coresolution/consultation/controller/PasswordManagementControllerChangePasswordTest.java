package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Map;
import java.util.Optional;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.dto.PasswordChangeRequest;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.AuthService;
import com.coresolution.consultation.service.PasswordConfigService;
import com.coresolution.consultation.service.PasswordResetService;
import com.coresolution.consultation.service.PasswordValidationService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.core.security.PasswordService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpSession;

/**
 * 비밀번호 변경 — DB 재조회·trim·세션 갱신·강제 변경(currentPassword 생략).
 *
 * @author MindGarden
 * @since 2026-10-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PasswordManagementController.changePassword")
class PasswordManagementControllerChangePasswordTest {

    private static final String DB_HASH = "$2a$10$db-fresh-hash";
    private static final String SESSION_STALE_HASH = "$2a$10$session-stale-hash";

    @Mock
    private PasswordValidationService passwordValidationService;

    @Mock
    private PasswordConfigService passwordConfigService;

    @Mock
    private PasswordResetService passwordResetService;

    @Mock
    private UserService userService;

    @Mock
    private PasswordService passwordService;

    @Mock
    private AuthService authService;

    @InjectMocks
    private PasswordManagementController controller;

    @Test
    @DisplayName("일반 변경(isPasswordChanged=true): 세션 해시가 아니라 DB 해시로 matches 하고 trim 한다")
    void changePassword_matchesDbHash_andTrims() {
        User sessionUser = user(SESSION_STALE_HASH, true);
        User dbUser = user(DB_HASH, true);
        User refreshed = user(DB_HASH, true);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, sessionUser);
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();

        when(userService.findById(42L)).thenReturn(Optional.of(dbUser), Optional.of(refreshed));
        when(passwordValidationService.validatePassword("NewPass1@"))
                .thenReturn(Map.of("isValid", true, "errors", Map.of()));
        when(passwordService.matches("TempPass1@", DB_HASH)).thenReturn(true);
        when(passwordService.matches("NewPass1@", DB_HASH)).thenReturn(false);
        when(authService.issueTokensForUser(eq(refreshed), any()))
                .thenReturn(AuthResponse.builder()
                        .success(true)
                        .token("access")
                        .refreshToken("refresh")
                        .requiresPasswordChange(false)
                        .build());

        PasswordChangeRequest body = new PasswordChangeRequest();
        body.setCurrentPassword("  TempPass1@  ");
        body.setNewPassword("  NewPass1@  ");
        body.setConfirmPassword("  NewPass1@  ");

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(body, session, httpRequest);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("success", true);
        assertThat(response.getBody()).containsEntry("requiresPasswordChange", false);
        assertThat(response.getBody()).containsEntry("accessToken", "access");

        verify(passwordService).matches("TempPass1@", DB_HASH);
        verify(passwordService, never()).matches(any(), eq(SESSION_STALE_HASH));
        verify(userService).changePassword(42L, "TempPass1@", "NewPass1@");
        verify(authService).issueTokensForUser(eq(refreshed), any());

        User inSession = (User) session.getAttribute(SessionConstants.USER_OBJECT);
        assertThat(inSession).isSameAs(refreshed);
        assertThat(inSession.getIsPasswordChanged()).isTrue();
    }

    @Test
    @DisplayName("일반 변경(isPasswordChanged=true): DB 해시 불일치면 changePassword 를 호출하지 않는다")
    void changePassword_wrongCurrent_rejectsWithoutUpdate() {
        User sessionUser = user(SESSION_STALE_HASH, true);
        User dbUser = user(DB_HASH, true);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, sessionUser);

        when(userService.findById(42L)).thenReturn(Optional.of(dbUser));
        when(passwordValidationService.validatePassword("NewPass1@"))
                .thenReturn(Map.of("isValid", true, "errors", Map.of()));
        when(passwordService.matches("wrong", DB_HASH)).thenReturn(false);

        PasswordChangeRequest body = new PasswordChangeRequest();
        body.setCurrentPassword("wrong");
        body.setNewPassword("NewPass1@");
        body.setConfirmPassword("NewPass1@");

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(body, session, new MockHttpServletRequest());

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).containsEntry("success", false);
        verify(userService, never()).changePassword(any(), any(), any());
        verify(authService, never()).issueTokensForUser(any(), any());
    }

    @Test
    @DisplayName("강제 변경(isPasswordChanged=false): currentPassword 없이도 성공하고 oldPassword=null 로 위임한다")
    void changePassword_mustChange_withoutCurrentPassword_succeeds() {
        User sessionUser = user(SESSION_STALE_HASH, false);
        User dbUser = user(DB_HASH, false);
        User refreshed = user(DB_HASH, true);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, sessionUser);
        MockHttpServletRequest httpRequest = new MockHttpServletRequest();

        when(userService.findById(42L)).thenReturn(Optional.of(dbUser), Optional.of(refreshed));
        when(passwordValidationService.validatePassword("NewPass1@"))
                .thenReturn(Map.of("isValid", true, "errors", Map.of()));
        when(passwordService.matches("NewPass1@", DB_HASH)).thenReturn(false);
        when(authService.issueTokensForUser(eq(refreshed), any()))
                .thenReturn(AuthResponse.builder()
                        .success(true)
                        .token("access-must")
                        .refreshToken("refresh-must")
                        .requiresPasswordChange(false)
                        .build());

        PasswordChangeRequest body = new PasswordChangeRequest();
        body.setCurrentPassword(null);
        body.setNewPassword("NewPass1@");
        body.setConfirmPassword("NewPass1@");

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(body, session, httpRequest);

        assertThat(response.getStatusCode().value()).isEqualTo(200);
        assertThat(response.getBody()).containsEntry("success", true);
        assertThat(response.getBody()).containsEntry("requiresPasswordChange", false);

        verify(passwordService, never()).matches(eq(""), eq(DB_HASH));
        verify(userService).changePassword(eq(42L), isNull(), eq("NewPass1@"));
        verify(authService).issueTokensForUser(eq(refreshed), any());
    }

    @Test
    @DisplayName("강제 변경: 새 비밀번호가 임시 비밀번호와 같으면 거절한다")
    void changePassword_mustChange_rejectsSameAsTemp() {
        User sessionUser = user(DB_HASH, false);
        User dbUser = user(DB_HASH, false);

        MockHttpSession session = new MockHttpSession();
        session.setAttribute(SessionConstants.USER_OBJECT, sessionUser);

        when(userService.findById(42L)).thenReturn(Optional.of(dbUser));
        when(passwordValidationService.validatePassword("SameTemp1@"))
                .thenReturn(Map.of("isValid", true, "errors", Map.of()));
        when(passwordService.matches("SameTemp1@", DB_HASH)).thenReturn(true);

        PasswordChangeRequest body = new PasswordChangeRequest();
        body.setNewPassword("SameTemp1@");
        body.setConfirmPassword("SameTemp1@");

        ResponseEntity<Map<String, Object>> response =
                controller.changePassword(body, session, new MockHttpServletRequest());

        assertThat(response.getStatusCode().value()).isEqualTo(400);
        assertThat(response.getBody()).containsEntry("success", false);
        verify(userService, never()).changePassword(any(), any(), any());
    }

    private static User user(String passwordHash, boolean passwordChanged) {
        User user = User.builder()
                .email("client@example.com")
                .role(UserRole.CLIENT)
                .password(passwordHash)
                .isPasswordChanged(passwordChanged)
                .build();
        user.setId(42L);
        user.setUserId("user-42");
        user.setTenantId("tenant-pwd");
        return user;
    }
}

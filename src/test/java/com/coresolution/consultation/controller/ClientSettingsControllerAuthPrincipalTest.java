package com.coresolution.consultation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.exception.EntityNotFoundException;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.utils.SessionUtils;
import com.coresolution.core.dto.ApiResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * ClientSettingsController — JWT userId principal / 이메일 principal 해석.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ClientSettingsController — JWT/세션 principal 해석")
class ClientSettingsControllerAuthPrincipalTest {

    private static final Long USER_ID = ThreadLocalRandom.current().nextLong(10_000L, 99_000L);
    private static final String USER_EMAIL =
            "client-settings-" + UUID.randomUUID().toString().substring(0, 8) + "@example.test";

    @Mock
    private UserService userService;

    @InjectMocks
    private ClientSettingsController controller;

    private MockHttpSession session;

    @BeforeEach
    void setUp() {
        session = new MockHttpSession();
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private User mockUser() {
        User user = new User();
        user.setId(USER_ID);
        user.setEmail(USER_EMAIL);
        user.setEmailNotification(Boolean.TRUE);
        user.setSmsNotification(Boolean.FALSE);
        user.setPushNotification(Boolean.TRUE);
        user.setProfileVisibility("private");
        user.setDataSharing(Boolean.FALSE);
        user.setAutoReminder(Boolean.TRUE);
        user.setPreferredSessionDuration(50);
        user.setUpdatedAt(LocalDateTime.of(2026, 9, 26, 15, 0));
        return user;
    }

    private void setJwtUserIdPrincipal() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(String.valueOf(USER_ID), null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    private void setEmailPrincipal() {
        UsernamePasswordAuthenticationToken auth =
                new UsernamePasswordAuthenticationToken(USER_EMAIL, null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    @DisplayName("GET settings: JWT principal=userId 문자열 → findById 후 200")
    void getClientSettings_jwtUserIdPrincipal_returns200() {
        User user = mockUser();
        setJwtUserIdPrincipal();
        when(userService.findById(USER_ID)).thenReturn(Optional.of(user));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = controller.getClientSettings(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        assertThat(response.getBody().getData()).isNotNull();
        assertThat(response.getBody().getData().get("notifications")).isInstanceOf(Map.class);
        verify(userService).findById(USER_ID);
        verify(userService, never()).findByEmail(any());
    }

    @Test
    @DisplayName("GET settings: email principal → findByEmail 후 200")
    void getClientSettings_emailPrincipal_returns200() {
        User user = mockUser();
        setEmailPrincipal();
        when(userService.findByEmail(USER_EMAIL)).thenReturn(Optional.of(user));

        ResponseEntity<ApiResponse<Map<String, Object>>> response = controller.getClientSettings(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        verify(userService).findByEmail(USER_EMAIL);
        verify(userService, never()).findById(any());
    }

    @Test
    @DisplayName("GET settings: 세션 User 있으면 findById/findByEmail 없이 200")
    void getClientSettings_sessionUser_returns200() {
        User user = mockUser();
        SessionUtils.setCurrentUser(session, user);

        ResponseEntity<ApiResponse<Map<String, Object>>> response = controller.getClientSettings(session);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        verify(userService, never()).findById(any());
        verify(userService, never()).findByEmail(any());
    }

    @Test
    @DisplayName("GET settings: 없는 사용자 → EntityNotFoundException (404), RuntimeException 아님")
    void getClientSettings_missingUser_throwsEntityNotFound() {
        setJwtUserIdPrincipal();
        when(userService.findById(USER_ID)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.getClientSettings(session))
                .isExactlyInstanceOf(EntityNotFoundException.class)
                .satisfies(ex -> {
                    EntityNotFoundException notFound = (EntityNotFoundException) ex;
                    assertThat(notFound.getEntityName()).isEqualTo("User");
                    assertThat(notFound.getIdentifier()).isEqualTo(String.valueOf(USER_ID));
                });
    }

    @Test
    @DisplayName("GET settings: 미인증 → AccessDeniedException (401/403), 500 아님")
    void getClientSettings_unauthenticated_throwsAccessDenied() {
        assertThatThrownBy(() -> controller.getClientSettings(session))
                .isInstanceOf(AccessDeniedException.class)
                .hasMessageContaining("로그인");
    }

    @Test
    @DisplayName("PUT settings: JWT principal=userId 문자열 → 저장 200")
    void updateClientSettings_jwtUserIdPrincipal_returns200() {
        User user = mockUser();
        setJwtUserIdPrincipal();
        when(userService.findById(USER_ID)).thenReturn(Optional.of(user));
        when(userService.save(any(User.class))).thenReturn(user);

        Map<String, Object> body = Map.of(
                "notifications", Map.of("email", Boolean.FALSE, "sms", Boolean.TRUE, "push", Boolean.TRUE));

        ResponseEntity<ApiResponse<Map<String, Object>>> response =
                controller.updateClientSettings(session, body);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().isSuccess()).isTrue();
        verify(userService).save(user);
    }
}

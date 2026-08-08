package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;

import com.coresolution.consultation.config.DuplicateLoginAccessBlockRegistry;
import com.coresolution.consultation.config.HttpSessionInvalidator;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.UserSessionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AuthServiceImpl#cleanupUserSessions(User, String)} —
 * refresh revoke + HttpSession invalidate + Access 차단 힌트.
 *
 * @author MindGarden
 * @since 2026-06-13
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl.cleanupUserSessions — refresh revoke + HttpSession invalidate")
class AuthServiceImplCleanupUserSessionsTest {

    private static final Long USER_ID = 123L;
    private static final String TENANT_ID = "tenant-cleanup-1";
    private static final String REASON = "USER_CONFIRMED_TERMINATE";
    private static final String OLD_SESSION_ID = "JSESSIONID-OLD-1";

    @Mock
    private UserSessionService userSessionService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private HttpSessionInvalidator httpSessionInvalidator;

    @Mock
    private DuplicateLoginAccessBlockRegistry duplicateLoginAccessBlockRegistry;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @DisplayName("테넌트 사용자 — HttpSession invalidate + tenant deactivate + refresh revoke + Access block")
    void cleanupUserSessions_invalidatesHttpSessionsAndRevokesTokens() {
        User user = userWithId(USER_ID, TENANT_ID);
        UserSession active = UserSession.builder().sessionId(OLD_SESSION_ID).build();
        when(userSessionService.getActiveSessions(user)).thenReturn(List.of(active));
        when(userSessionService.deactivateAllSessionsForTenantUser(eq(TENANT_ID), eq(USER_ID), eq(REASON)))
            .thenReturn(1);

        authService.cleanupUserSessions(user, REASON);

        verify(httpSessionInvalidator).invalidateBySessionId(OLD_SESSION_ID);
        verify(userSessionService).deactivateAllSessionsForTenantUser(TENANT_ID, USER_ID, REASON);
        verify(userSessionService, never()).deactivateAllUserSessions(any(User.class), anyString());
        verify(refreshTokenService).revokeAllUserTokens(USER_ID);
        verify(duplicateLoginAccessBlockRegistry).blockUser(USER_ID);
    }

    @Test
    @DisplayName("tenantId 없음 — 전역 deactivate 폴백")
    void cleanupUserSessions_fallsBackToGlobalDeactivateWithoutTenant() {
        User user = userWithId(USER_ID, null);
        when(userSessionService.getActiveSessions(user)).thenReturn(List.of());
        when(userSessionService.deactivateAllUserSessions(eq(user), eq(REASON))).thenReturn(0);

        authService.cleanupUserSessions(user, REASON);

        verify(userSessionService).deactivateAllUserSessions(eq(user), eq(REASON));
        verify(refreshTokenService).revokeAllUserTokens(USER_ID);
    }

    @Test
    @DisplayName("UserSessionService 예외 발생해도 swallow (로그인 흐름 차단 금지)")
    void cleanupUserSessions_swallowsExceptionFromUserSessionService() {
        User user = userWithId(USER_ID, TENANT_ID);
        when(userSessionService.getActiveSessions(any(User.class)))
            .thenThrow(new RuntimeException("DB error"));

        authService.cleanupUserSessions(user, REASON);

        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
    }

    @Test
    @DisplayName("RefreshTokenService 예외 발생해도 swallow (catch 블록이 잡음)")
    void cleanupUserSessions_swallowsExceptionFromRefreshTokenService() {
        User user = userWithId(USER_ID, TENANT_ID);
        when(userSessionService.getActiveSessions(user)).thenReturn(List.of());
        when(userSessionService.deactivateAllSessionsForTenantUser(eq(TENANT_ID), eq(USER_ID), eq(REASON)))
            .thenReturn(1);
        org.mockito.Mockito.doThrow(new RuntimeException("revoke failed"))
            .when(refreshTokenService).revokeAllUserTokens(USER_ID);

        authService.cleanupUserSessions(user, REASON);

        verify(refreshTokenService).revokeAllUserTokens(USER_ID);
    }

    private static User userWithId(Long id, String tenantId) {
        User user = User.builder()
            .userId("u-" + id)
            .email("u@example.com")
            .role(UserRole.CLIENT)
            .build();
        user.setId(id);
        user.setTenantId(tenantId);
        return user;
    }
}

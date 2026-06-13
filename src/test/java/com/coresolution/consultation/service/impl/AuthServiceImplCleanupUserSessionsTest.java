package com.coresolution.consultation.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.UserSessionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link AuthServiceImpl#cleanupUserSessions(User, String)} P1 회귀 핫픽스 단위 테스트.
 *
 * <p>배경 (2026-06-13 16:00 KST P1 운영 회귀):
 * <ul>
 *   <li>PR #293 의 silent skip 정책으로 {@link AuthServiceImpl#checkDuplicateLogin(User)} 은
 *       {@code user_sessions} OR {@code refresh_token_store} 양쪽을 검사하지만
 *       {@code cleanupUserSessions} 는 {@code user_sessions} 만 deactivate 했음.</li>
 *   <li>결과 — 모달 "기존 세션 종료" 클릭이 모바일 JWT 흐름에 무력화되고 60초 폴링이
 *       강제 로그아웃 알림을 띄움.</li>
 *   <li>핫픽스 — {@code cleanupUserSessions} 가
 *       {@link RefreshTokenService#revokeAllUserTokens(Long)} 를 호출하도록 통합.</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-13
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("AuthServiceImpl.cleanupUserSessions — refresh_token revoke 통합 (P1 핫픽스)")
class AuthServiceImplCleanupUserSessionsTest {

    private static final Long USER_ID = 123L;
    private static final String REASON = "USER_CONFIRMED_TERMINATE";

    @Mock
    private UserSessionService userSessionService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @DisplayName("user_sessions 와 refresh_token_store 모두 정리한다")
    void cleanupUserSessions_revokesUserSessionsAndRefreshTokens() {
        User user = userWithId(USER_ID);
        when(userSessionService.deactivateAllUserSessions(eq(user), eq(REASON))).thenReturn(2);

        authService.cleanupUserSessions(user, REASON);

        verify(userSessionService).deactivateAllUserSessions(eq(user), eq(REASON));
        verify(refreshTokenService).revokeAllUserTokens(USER_ID);
    }

    @Test
    @DisplayName("UserSessionService 예외 발생해도 swallow (로그인 흐름 차단 금지)")
    void cleanupUserSessions_swallowsExceptionFromUserSessionService() {
        User user = userWithId(USER_ID);
        when(userSessionService.deactivateAllUserSessions(any(User.class), anyString()))
            .thenThrow(new RuntimeException("DB error"));

        // 예외가 외부로 전파되지 않아야 함
        authService.cleanupUserSessions(user, REASON);

        // user_sessions deactivate 단계에서 throw 됐기 때문에 refresh_token revoke 는 시도되지 않음
        verify(userSessionService).deactivateAllUserSessions(eq(user), eq(REASON));
        verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
    }

    @Test
    @DisplayName("RefreshTokenService 예외 발생해도 swallow (catch 블록이 잡음)")
    void cleanupUserSessions_swallowsExceptionFromRefreshTokenService() {
        User user = userWithId(USER_ID);
        when(userSessionService.deactivateAllUserSessions(eq(user), eq(REASON))).thenReturn(1);
        org.mockito.Mockito.doThrow(new RuntimeException("revoke failed"))
            .when(refreshTokenService).revokeAllUserTokens(USER_ID);

        // 예외가 외부로 전파되지 않아야 함
        authService.cleanupUserSessions(user, REASON);

        verify(userSessionService).deactivateAllUserSessions(eq(user), eq(REASON));
        verify(refreshTokenService).revokeAllUserTokens(USER_ID);
    }

    private static User userWithId(Long id) {
        User user = User.builder()
            .userId("u-" + id)
            .email("u@example.com")
            .password("{bcrypt}$2a$10$0123456789012345678901x")
            .name("테스트")
            .role(UserRole.CLIENT)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
        user.setId(id);
        user.setTenantId("tenant-cleanup");
        return user;
    }
}

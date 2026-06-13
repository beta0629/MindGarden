package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.List;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.RefreshToken;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.UserSessionService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link AuthServiceImpl#checkDuplicateLogin(User)} 및 {@link AuthServiceImpl#cleanupUserSessions(User, String)}
 * 의 단기 hotfix (silent skip A1) 단위 테스트.
 *
 * <p>관련 의제:
 * <ul>
 *   <li>P0-1: 중복 감지 대상 확장 — {@code user_sessions} + {@code refresh_token_store}</li>
 *   <li>P0-2/P0-3 silent skip: 모달 클릭 시 기존 {@code refresh_token_store} row 는 revoke 하지 않는다(장기 PR 대상).</li>
 * </ul>
 *
 * @author MindGarden
 * @since 2026-06-13
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthServiceImpl — 중복 로그인 감지 hotfix (silent skip A1)")
class AuthServiceImplDuplicateLoginHotfixTest {

    private static final Long USER_ID = 42L;
    private static final String TENANT_ID = "tenant-hotfix";

    @Mock
    private UserSessionService userSessionService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @InjectMocks
    private AuthServiceImpl authService;

    @Nested
    @DisplayName("checkDuplicateLogin — user_sessions + refresh_token_store OR 결합")
    class CheckDuplicateLogin {

        @Test
        @DisplayName("U1 — user_sessions=0, refresh_token_store=1 → true (모바일 JWT 흐름 감지)")
        void detectsRefreshTokenOnlyDuplicate() {
            User user = userWithTenant(TENANT_ID);
            when(userSessionService.getActiveSessionCount(user)).thenReturn(0L);
            when(refreshTokenService.findActiveTokensByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(List.of(mockRefreshToken()));

            boolean result = authService.checkDuplicateLogin(user);

            assertThat(result)
                .as("user_sessions 0 + refresh_token_store 1 은 중복 로그인으로 판정되어야 함")
                .isTrue();
        }

        @Test
        @DisplayName("U2 — user_sessions=0, refresh_token_store=0 → false (정상 단일 로그인)")
        void returnsFalseWhenNoActiveSessionAndNoActiveToken() {
            User user = userWithTenant(TENANT_ID);
            when(userSessionService.getActiveSessionCount(user)).thenReturn(0L);
            when(refreshTokenService.findActiveTokensByUserIdAndTenantId(USER_ID, TENANT_ID))
                .thenReturn(Collections.emptyList());

            boolean result = authService.checkDuplicateLogin(user);

            assertThat(result)
                .as("user_sessions 와 refresh_token_store 모두 비어 있으면 중복 아님")
                .isFalse();
        }

        @Test
        @DisplayName("U3 — user_sessions ≥ 1 이면 refresh_token_store 조회 없이 즉시 true (short-circuit)")
        void shortCircuitsOnActiveUserSession() {
            User user = userWithTenant(TENANT_ID);
            when(userSessionService.getActiveSessionCount(user)).thenReturn(2L);

            boolean result = authService.checkDuplicateLogin(user);

            assertThat(result).isTrue();
            verify(refreshTokenService, never()).findActiveTokensByUserIdAndTenantId(anyLong(), anyString());
            verify(refreshTokenService, never()).findActiveTokensByUserId(anyLong());
        }

        @Test
        @DisplayName("U2b — tenantId 없음 + refresh_token_store=0 → false (글로벌 폴백 사용)")
        void usesGlobalFallbackWhenTenantIdMissing() {
            User user = userWithTenant(null);
            when(userSessionService.getActiveSessionCount(user)).thenReturn(0L);
            when(refreshTokenService.findActiveTokensByUserId(USER_ID)).thenReturn(Collections.emptyList());

            boolean result = authService.checkDuplicateLogin(user);

            assertThat(result).isFalse();
            verify(refreshTokenService).findActiveTokensByUserId(USER_ID);
            verify(refreshTokenService, never()).findActiveTokensByUserIdAndTenantId(anyLong(), anyString());
        }

        @Test
        @DisplayName("예외 발생 시 false 반환 (보호적 차단 — 로그인 자체 차단하지 않음)")
        void returnsFalseOnException() {
            User user = userWithTenant(TENANT_ID);
            when(userSessionService.getActiveSessionCount(user))
                .thenThrow(new RuntimeException("DB error"));

            boolean result = authService.checkDuplicateLogin(user);

            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("cleanupUserSessions — silent skip 정책 (refresh_token_store revoke 안 함)")
    class CleanupUserSessionsSilentSkip {

        @Test
        @DisplayName("U5 — confirm 분기에서 호출되어도 refresh_token revoke 호출 0회 (silent skip 정책)")
        void doesNotRevokeRefreshTokens() {
            User user = userWithTenant(TENANT_ID);
            when(userSessionService.deactivateAllUserSessions(eq(user), anyString())).thenReturn(0);

            authService.cleanupUserSessions(user, "USER_CONFIRMED_TERMINATE");

            verify(userSessionService).deactivateAllUserSessions(eq(user), eq("USER_CONFIRMED_TERMINATE"));
            verify(refreshTokenService, never()).revokeAllUserTokens(anyLong());
            verify(refreshTokenService, never()).revokeRefreshToken(anyString());
        }
    }

    private static User userWithTenant(String tenantId) {
        User user = User.builder()
            .userId("u-" + USER_ID)
            .email("u@example.com")
            .password("{bcrypt}$2a$10$0123456789012345678901x")
            .name("테스트")
            .role(UserRole.CLIENT)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
        user.setId(USER_ID);
        user.setTenantId(tenantId);
        return user;
    }

    private static RefreshToken mockRefreshToken() {
        return RefreshToken.builder()
            .tokenId("token-" + USER_ID)
            .userId(USER_ID)
            .tenantId(TENANT_ID)
            .refreshTokenHash("hash")
            .revoked(false)
            .build();
    }
}

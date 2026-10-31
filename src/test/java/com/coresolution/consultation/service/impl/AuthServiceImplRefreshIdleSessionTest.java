package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BearerIdleSessionService;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

/**
 * {@link AuthServiceImpl#refreshToken} Bearer 유휴 게이트 단위 테스트.
 *
 * <p>Access sid(= Refresh tokenId) 기준 {@code isBearerSessionActive} 실패 시
 * {@link SessionManagementConstants#SESSION_EXPIRED_MESSAGE} 로 거부한다.</p>
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthServiceImpl refresh — Bearer 유휴 게이트")
class AuthServiceImplRefreshIdleSessionTest {

    @Mock
    private JwtService jwtService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserDetailsService userDetailsService;

    @Mock
    private DynamicPermissionService dynamicPermissionService;

    @Mock
    private RefreshTokenService refreshTokenService;

    @Mock
    private UserSessionService userSessionService;

    @Mock
    private BearerIdleSessionService bearerIdleSessionService;

    @InjectMocks
    private AuthServiceImpl authService;

    private String tenantId;
    private String userId;
    private String email;
    private String refreshToken;
    private String oldSid;

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @ParameterizedTest(name = "{0} idle 실패 → SESSION_EXPIRED_MESSAGE")
    @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
    @DisplayName("Bearer 유휴 만료 시 refresh 거부 — SESSION_EXPIRED_MESSAGE")
    void refreshDeniedWhenBearerIdleExpired(UserRole role) {
        // Given
        initIds();
        User user = activeUser(role);
        stubThroughTokenValidity(user);
        when(jwtService.extractTokenId(refreshToken)).thenReturn(oldSid);
        when(bearerIdleSessionService.isBearerSessionActive(oldSid, role)).thenReturn(false);

        // When
        AuthResponse response = authService.refreshToken(refreshToken);

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage())
                .isEqualTo(SessionManagementConstants.SESSION_EXPIRED_MESSAGE);
        verify(bearerIdleSessionService).isBearerSessionActive(oldSid, role);
        verify(dynamicPermissionService, never()).getUserPermissionsAsStringList(any());
        verify(jwtService, never()).generateToken(any(User.class), any(), anyBoolean());
    }

    @ParameterizedTest(name = "{0} old sid 없음 → SESSION_EXPIRED_MESSAGE")
    @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
    @DisplayName("Refresh tokenId(sid) 비어 있으면 유휴 실패로 거부")
    void refreshDeniedWhenOldSidBlank(UserRole role) {
        // Given
        initIds();
        User user = activeUser(role);
        stubThroughTokenValidity(user);
        when(jwtService.extractTokenId(refreshToken)).thenReturn("  ");

        // When
        AuthResponse response = authService.refreshToken(refreshToken);

        // Then
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage())
                .isEqualTo(SessionManagementConstants.SESSION_EXPIRED_MESSAGE);
        verify(bearerIdleSessionService, never()).isBearerSessionActive(anyString(), any());
    }

    @ParameterizedTest(name = "{0} idle 활성 → refresh 게이트 통과")
    @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
    @DisplayName("Bearer 유휴 미초과 시 refresh 게이트 통과 → 토큰 재발급")
    void refreshAllowedWhenBearerIdleActive(UserRole role) {
        // Given
        initIds();
        User user = activeUser(role);
        stubThroughTokenValidity(user);
        when(jwtService.extractTokenId(refreshToken)).thenReturn(oldSid);
        when(bearerIdleSessionService.isBearerSessionActive(oldSid, role)).thenReturn(true);

        stubSuccessfulTokenRotation(user);

        // When
        AuthResponse response = authService.refreshToken(refreshToken);

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isNotEqualTo(SessionManagementConstants.SESSION_EXPIRED_MESSAGE);
        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getRefreshToken()).isNotBlank();
        verify(bearerIdleSessionService).isBearerSessionActive(oldSid, role);
        verify(refreshTokenService).revokeRefreshToken(oldSid);
        verify(bearerIdleSessionService).ensureActiveSession(eq(user), anyString(), any(), any());
    }

    @Test
    @DisplayName("BearerIdleSessionService null 이면 유휴 게이트를 건너뛴다")
    void nullIdleService_skipsIdleGate() {
        // Given — @InjectMocks 가 mock 을 주입한 뒤 필드를 null 로 비움
        initIds();
        org.springframework.test.util.ReflectionTestUtils.setField(
                authService, "bearerIdleSessionService", null);
        User user = activeUser(UserRole.CLIENT);
        stubThroughTokenValidity(user);
        when(jwtService.extractTokenId(refreshToken)).thenReturn(oldSid);
        stubSuccessfulTokenRotation(user);

        // When
        AuthResponse response = authService.refreshToken(refreshToken);

        // Then
        assertThat(response.isSuccess()).isTrue();
        assertThat(response.getMessage()).isNotEqualTo(SessionManagementConstants.SESSION_EXPIRED_MESSAGE);
    }

    private void initIds() {
        tenantId = "tenant-" + UUID.randomUUID();
        userId = "user-" + UUID.randomUUID();
        email = userId + "@example.com";
        refreshToken = "refresh." + UUID.randomUUID() + ".jwt";
        oldSid = UUID.randomUUID().toString().replace("-", "");
    }

    private User activeUser(UserRole role) {
        User user = User.builder()
                .userId(userId)
                .email(email)
                .password("{bcrypt}$2a$10$0123456789012345678901y")
                .name("refresh-idle-test")
                .role(role)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        user.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setTenantId(tenantId);
        user.setLifecycleState(LifecycleState.ACTIVE);
        return user;
    }

    private void stubThroughTokenValidity(User user) {
        lenient().when(jwtService.extractUsername(refreshToken)).thenReturn(userId);
        lenient().when(jwtService.extractTenantId(refreshToken)).thenReturn(tenantId);
        lenient().when(userRepository.findByTenantIdAndUserId(tenantId, userId))
                .thenReturn(Optional.of(user));
        UserDetails userDetails = org.mockito.Mockito.mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(userDetails);
        when(jwtService.isTokenValid(refreshToken, userDetails)).thenReturn(true);
        lenient().when(jwtService.extractIssuedAt(refreshToken)).thenReturn(null);
    }

    private void stubSuccessfulTokenRotation(User user) {
        String newAccess = "new.access." + UUID.randomUUID();
        String newRefresh = "new.refresh." + UUID.randomUUID();
        String newSid = UUID.randomUUID().toString().replace("-", "");
        when(dynamicPermissionService.getUserPermissionsAsStringList(user))
                .thenReturn(Collections.emptyList());
        when(jwtService.isPasswordChangeRequired(refreshToken)).thenReturn(false);
        when(jwtService.generateToken(eq(user), any(), eq(true))).thenReturn(newAccess);
        when(jwtService.extractSessionId(newAccess)).thenReturn(newSid);
        when(jwtService.generateRefreshToken(eq(user), eq(newSid), eq(true))).thenReturn(newRefresh);
        when(refreshTokenService.createRefreshToken(eq(user), eq(newRefresh), any()))
                .thenReturn(null);
        lenient().when(userSessionService.deactivateSession(anyString(), anyString())).thenReturn(true);
    }
}

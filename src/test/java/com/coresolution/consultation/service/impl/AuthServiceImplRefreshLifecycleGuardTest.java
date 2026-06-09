package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.RefreshTokenService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;

/**
 * {@link AuthServiceImpl#refreshToken(String)} lifecycle_state 게이트 단위 테스트.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.6 — refresh 시 lifecycle_state 가
 * {@link LifecycleState#ACTIVE_LIKE_STATES} 가 아니면 거부되어야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthServiceImpl refresh lifecycle_state 게이트")
class AuthServiceImplRefreshLifecycleGuardTest {

    private static final String TENANT = "tenant-refresh-lc";
    private static final String USER_ID = "user-13";
    private static final String EMAIL = "user13@example.com";
    private static final String REFRESH_TOKEN = "refresh.jwt.token";

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

    @InjectMocks
    private AuthServiceImpl authService;

    @Test
    @DisplayName("lifecycle_state=ANONYMIZED 이면 refresh 거부")
    void refreshDeniedWhenAnonymized() {
        User user = userWithLifecycle(LifecycleState.ANONYMIZED, true);
        stubTokenLookup(user);

        AuthResponse response = authService.refreshToken(REFRESH_TOKEN);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("비활성");
        assertThat(response.getMessage()).doesNotContain("ANONYMIZED");
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    @DisplayName("lifecycle_state=DELETED_BY_ADMIN 이면 refresh 거부")
    void refreshDeniedWhenDeletedByAdmin() {
        User user = userWithLifecycle(LifecycleState.DELETED_BY_ADMIN, false);
        stubTokenLookup(user);

        AuthResponse response = authService.refreshToken(REFRESH_TOKEN);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("비활성");
        assertThat(response.getMessage()).doesNotContain("DELETED_BY_ADMIN");
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    @DisplayName("lifecycle_state=HARD_DELETED 이면 refresh 거부 (ACTIVE_LIKE 아님)")
    void refreshDeniedWhenHardDeleted() {
        User user = userWithLifecycle(LifecycleState.HARD_DELETED, false);
        stubTokenLookup(user);

        AuthResponse response = authService.refreshToken(REFRESH_TOKEN);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("비활성");
        assertThat(response.getMessage()).doesNotContain("HARD_DELETED");
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    @DisplayName("lifecycle_state=null 이면 refresh 거부 (보호적 차단)")
    void refreshDeniedWhenLifecycleNull() {
        User user = userWithLifecycle(null, true);
        stubTokenLookup(user);

        AuthResponse response = authService.refreshToken(REFRESH_TOKEN);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("비활성");
        verify(userDetailsService, never()).loadUserByUsername(anyString());
    }

    @Test
    @DisplayName("lifecycle_state=ACTIVE 이면 refresh 게이트 통과 → loadUserByUsername 호출")
    void refreshAllowedWhenActive() {
        User user = userWithLifecycle(LifecycleState.ACTIVE, true);
        stubTokenLookup(user);

        // 게이트 통과 후 토큰 유효성 검사 단계까지 진행되도록 — 유효성 검사를 false 로 stub 하여
        // "유효하지 않은 리프레시 토큰" 으로 종료시킨다 (lifecycle 게이트가 거부하지 않았음을 입증).
        UserDetails userDetails = org.mockito.Mockito.mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenReturn(userDetails);
        when(jwtService.isTokenValid(REFRESH_TOKEN, userDetails)).thenReturn(false);

        AuthResponse response = authService.refreshToken(REFRESH_TOKEN);

        verify(userDetailsService).loadUserByUsername(EMAIL);
        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("유효하지 않은 리프레시 토큰");
    }

    private User userWithLifecycle(LifecycleState state, boolean isActive) {
        User user = User.builder()
            .userId(USER_ID)
            .email(EMAIL)
            .password("{bcrypt}$2a$10$0123456789012345678901x")
            .name("테스트")
            .role(UserRole.CLIENT)
            .isActive(isActive)
            .isPasswordChanged(true)
            .build();
        user.setId(13L);
        user.setTenantId(TENANT);
        user.setLifecycleState(state);
        return user;
    }

    private void stubTokenLookup(User user) {
        lenient().when(jwtService.extractUsername(REFRESH_TOKEN)).thenReturn(USER_ID);
        lenient().when(jwtService.extractTenantId(REFRESH_TOKEN)).thenReturn(TENANT);
        lenient().when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID))
            .thenReturn(Optional.of(user));
    }
}

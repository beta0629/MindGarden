package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Collections;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.AuthResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.DynamicPermissionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.RefreshTokenService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
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
 * refreshToken 처리 시 TenantContext 설정 회귀 방지.
 *
 * <p>운영 로그 {@code Tenant ID is not set in current context} —
 * {@code CustomUserDetailsService} → {@code UserService.findByEmail} 경로.</p>
 *
 * @author MindGarden
 * @since 2026-08-05
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("AuthServiceImpl refresh TenantContext")
class AuthServiceImplRefreshTenantContextTest {

    private static final String TENANT = "tenant-refresh-ctx";
    private static final String USER_ID = "user-refresh-1";
    private static final String EMAIL = "refresh-user@example.com";
    private static final String REFRESH_TOKEN = "refresh.jwt.token";
    private static final String NEW_ACCESS = "new.access.jwt";
    private static final String NEW_REFRESH = "new.refresh.jwt";

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

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("loadUserByUsername 호출 시점에 TenantContext에 JWT tenantId가 설정된다")
    void setsTenantContextBeforeLoadUserByUsername() {
        User user = activeUser();
        stubTokenLookup(user);

        AtomicReference<String> tenantAtLoad = new AtomicReference<>();
        UserDetails userDetails = org.mockito.Mockito.mock(UserDetails.class);
        when(userDetailsService.loadUserByUsername(EMAIL)).thenAnswer(invocation -> {
            tenantAtLoad.set(TenantContextHolder.getTenantId());
            return userDetails;
        });
        when(jwtService.isTokenValid(REFRESH_TOKEN, userDetails)).thenReturn(true);
        when(dynamicPermissionService.getUserPermissionsAsStringList(user))
            .thenReturn(Collections.emptyList());
        when(jwtService.generateToken(eq(user), any())).thenReturn(NEW_ACCESS);
        when(jwtService.extractTokenId(REFRESH_TOKEN)).thenReturn(null);
        when(jwtService.generateRefreshToken(eq(user), anyString())).thenReturn(NEW_REFRESH);
        when(refreshTokenService.createRefreshToken(eq(user), eq(NEW_REFRESH), any()))
            .thenReturn(null);

        AuthResponse response = authService.refreshToken(REFRESH_TOKEN, null);

        assertThat(response.isSuccess()).isTrue();
        assertThat(tenantAtLoad.get()).isEqualTo(TENANT);
        verify(userDetailsService).loadUserByUsername(EMAIL);
        assertThat(TenantContextHolder.getTenantId()).isNull();
    }

    @Test
    @DisplayName("JWT에 tenantId가 없으면 fail-closed — findAllByEmail 없이 실패")
    void rejectsRefreshWhenJwtTenantMissing() {
        User user = activeUser();
        lenient().when(jwtService.extractUsername(REFRESH_TOKEN)).thenReturn(USER_ID);
        lenient().when(jwtService.extractTenantId(REFRESH_TOKEN)).thenReturn(null);
        lenient().when(jwtService.extractEmail(REFRESH_TOKEN)).thenReturn(EMAIL);
        lenient().when(userRepository.findAllByEmail(EMAIL)).thenReturn(Collections.singletonList(user));

        AuthResponse response = authService.refreshToken(REFRESH_TOKEN);

        assertThat(response.isSuccess()).isFalse();
        assertThat(response.getMessage()).contains("유효하지 않은 리프레시 토큰");
        org.mockito.Mockito.verify(userRepository, org.mockito.Mockito.never()).findAllByEmail(anyString());
        assertThat(TenantContextHolder.getTenantId()).isNull();
    }

    private User activeUser() {
        User user = User.builder()
            .userId(USER_ID)
            .email(EMAIL)
            .password("{bcrypt}$2a$10$0123456789012345678901x")
            .name("테스트")
            .role(UserRole.CLIENT)
            .isActive(true)
            .isPasswordChanged(true)
            .build();
        user.setId(42L);
        user.setTenantId(TENANT);
        user.setLifecycleState(LifecycleState.ACTIVE);
        return user;
    }

    private void stubTokenLookup(User user) {
        lenient().when(jwtService.extractUsername(REFRESH_TOKEN)).thenReturn(USER_ID);
        lenient().when(jwtService.extractTenantId(REFRESH_TOKEN)).thenReturn(TENANT);
        lenient().when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID))
            .thenReturn(Optional.of(user));
    }
}

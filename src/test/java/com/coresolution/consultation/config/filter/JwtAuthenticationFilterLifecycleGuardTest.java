package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link JwtAuthenticationFilter} lifecycle_state 게이트 단위 테스트.
 *
 * <p>USER_LIFECYCLE_TERMINATION_POLICY §3.6 — 매 요청마다 lifecycle_state 가
 * {@link LifecycleState#ACTIVE_LIKE_STATES} 가 아니면 SecurityContext 미설정 →
 * 후속 보호 엔드포인트 401/403.</p>
 *
 * @author MindGarden
 * @since 2026-06-09
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtAuthenticationFilter lifecycle_state 게이트")
class JwtAuthenticationFilterLifecycleGuardTest {

    private static final String TENANT = "tenant-jwt-filter-lc";
    private static final String USER_ID = "user-13";
    private static final String EMAIL = "user13@example.com";
    private static final String TOKEN = "valid.jwt.token";
    private static final String AUTH_HEADER = "Bearer " + TOKEN;
    private static final String REQUEST_PATH = "/api/v1/clients/me";

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private HttpServletRequest request;

    @Mock
    private HttpServletResponse response;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private JwtAuthenticationFilter filter;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("lifecycle_state=ACTIVE: SecurityContext 설정 후 다음 필터 진행")
    void activeUser_setsSecurityContext() throws Exception {
        User user = lifecycleUser(LifecycleState.ACTIVE, true);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication())
            .as("ACTIVE 사용자는 SecurityContext 에 인증 정보가 설정되어야 한다")
            .isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
            .isEqualTo(USER_ID);
    }

    @Test
    @DisplayName("lifecycle_state=ANONYMIZED: SecurityContext 미설정 → 후속 401/403")
    void anonymizedUser_skipsSecurityContext() throws Exception {
        User user = lifecycleUser(LifecycleState.ANONYMIZED, true);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication())
            .as("ANONYMIZED 사용자는 SecurityContext 에 인증 정보가 설정되면 안 된다")
            .isNull();
    }

    @Test
    @DisplayName("lifecycle_state=DELETED_BY_ADMIN: SecurityContext 미설정")
    void deletedByAdminUser_skipsSecurityContext() throws Exception {
        User user = lifecycleUser(LifecycleState.DELETED_BY_ADMIN, false);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("lifecycle_state=ACTIVE 이지만 is_active=false 면 SecurityContext 미설정")
    void activeButIsActiveFalse_skipsSecurityContext() throws Exception {
        User user = lifecycleUser(LifecycleState.ACTIVE, false);
        stubRequest(user);

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    private User lifecycleUser(LifecycleState state, boolean isActive) {
        User user = User.builder()
            .userId(USER_ID)
            .email(EMAIL)
            .password("{bcrypt}$2a$10$0123456789012345678901w")
            .name("filter-test")
            .role(UserRole.CLIENT)
            .isActive(isActive)
            .isPasswordChanged(true)
            .build();
        user.setId(13L);
        user.setTenantId(TENANT);
        user.setLifecycleState(state);
        return user;
    }

    private void stubRequest(User user) {
        when(request.getRequestURI()).thenReturn(REQUEST_PATH);
        when(request.getHeader("Authorization")).thenReturn(AUTH_HEADER);
        when(jwtService.isTokenValid(TOKEN)).thenReturn(true);
        when(jwtService.extractUsername(TOKEN)).thenReturn(USER_ID);
        when(jwtService.extractTenantId(TOKEN)).thenReturn(TENANT);
        when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID))
            .thenReturn(Optional.of(user));
    }
}

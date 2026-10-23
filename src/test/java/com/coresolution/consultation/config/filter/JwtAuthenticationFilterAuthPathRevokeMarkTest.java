package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Date;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import com.coresolution.consultation.config.DuplicateLoginAccessBlockRegistry;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuthTokenRevocationService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.util.AccessTokenRevocationRequestMarker;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@code /api/auth/**} 경로에서 Bearer 폐기 시 마커만 설정하고 인증하지 않는지 검증.
 *
 * @author MindGarden
 * @since 2026-10-22
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtAuthenticationFilter /api/auth 폐기 마커 전용")
class JwtAuthenticationFilterAuthPathRevokeMarkTest {

    private static final String AUTH_WEB_SESSION_TOKENS_PATH =
            "/api/auth/oauth2/web-session-tokens";

    @Mock private JwtService jwtService;
    @Mock private UserService userService;
    @Mock private UserRepository userRepository;
    @Mock private DuplicateLoginAccessBlockRegistry blockRegistry;
    @Mock private AuthTokenRevocationService revocationService;
    @Mock private FilterChain filterChain;

    private JwtAuthenticationFilter filter;
    private MockHttpServletRequest request;
    private MockHttpServletResponse response;
    private String tenantId;
    private String userId;
    private String token;
    private Long userPk;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-" + UUID.randomUUID();
        userId = "user-" + UUID.randomUUID();
        token = "auth.access." + UUID.randomUUID();
        userPk = ThreadLocalRandom.current().nextLong(1_000L, 9_000_000L);

        filter = new JwtAuthenticationFilter(jwtService, userService, userRepository, blockRegistry,
                revocationService);
        request = new MockHttpServletRequest("POST", AUTH_WEB_SESSION_TOKENS_PATH);
        request.setRequestURI(AUTH_WEB_SESSION_TOKENS_PATH);
        response = new MockHttpServletResponse();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("shouldNotFilter: /api/auth + Bearer 없음 → skip true")
    void shouldNotFilter_authPathWithoutBearer_skips() throws Exception {
        assertThat(invokeShouldNotFilter(request)).isTrue();
    }

    @Test
    @DisplayName("shouldNotFilter: /api/auth + Bearer 있음 → skip false(필터 진입)")
    void shouldNotFilter_authPathWithBearer_entersFilter() throws Exception {
        request.addHeader("Authorization", "Bearer " + token);
        assertThat(invokeShouldNotFilter(request)).isFalse();
    }

    @Test
    @DisplayName("/api/auth + 폐기 Bearer → 마커 설정, Authentication null")
    void authPath_revokedBearer_marksWithoutAuthentication() throws Exception {
        request.addHeader("Authorization", "Bearer " + token);
        User user = activeCenterUser();
        when(jwtService.isTokenValid(token)).thenReturn(true);
        when(jwtService.extractUsername(token)).thenReturn(userId);
        when(jwtService.extractTenantId(token)).thenReturn(tenantId);
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        assertThat(request.getAttribute(SessionManagementConstants.REQUEST_ATTR_ACCESS_TOKEN_REVOKED))
                .isEqualTo(Boolean.TRUE);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(jwtService, never()).extractActorRole(token);
    }

    @Test
    @DisplayName("/api/auth + 유효 Bearer(미폐기) → 마커 없음, Authentication null(인증 금지)")
    void authPath_validBearer_noMarkAndNoAuthentication() throws Exception {
        request.addHeader("Authorization", "Bearer " + token);
        User user = activeCenterUser();
        when(jwtService.isTokenValid(token)).thenReturn(true);
        when(jwtService.extractUsername(token)).thenReturn(userId);
        when(jwtService.extractTenantId(token)).thenReturn(tenantId);
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isFalse();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("/api/auth + 무효 Bearer → 마커 없음")
    void authPath_invalidBearer_noMark() throws Exception {
        request.addHeader("Authorization", "Bearer " + token);
        when(jwtService.isTokenValid(token)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isFalse();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
        verify(userRepository, never()).findByTenantIdAndUserId(tenantId, userId);
    }

    @Test
    @DisplayName("ops 경로 + 폐기 Bearer → 기존처럼 mark + Authentication null(회귀)")
    void opsPath_revokedBearer_stillMarksWithoutAuth() throws Exception {
        request.setRequestURI("/api/v1/ops/dashboard/metrics");
        request.addHeader("Authorization", "Bearer " + token);
        User user = activeCenterUser();
        when(jwtService.isTokenValid(token)).thenReturn(true);
        when(jwtService.extractUsername(token)).thenReturn(userId);
        when(jwtService.extractTenantId(token)).thenReturn(tenantId);
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(filterChain).doFilter(request, response);
    }

    private boolean invokeShouldNotFilter(HttpServletRequest httpRequest) throws Exception {
        java.lang.reflect.Method method = JwtAuthenticationFilter.class
                .getDeclaredMethod("shouldNotFilter", HttpServletRequest.class);
        method.setAccessible(true);
        return (boolean) method.invoke(filter, httpRequest);
    }

    private User activeCenterUser() {
        User user = User.builder()
                .userId(userId)
                .email("auth-path-" + UUID.randomUUID() + "@example.com")
                .role(UserRole.CLIENT)
                .isActive(true)
                .lifecycleState(LifecycleState.ACTIVE)
                .build();
        user.setId(userPk);
        user.setTenantId(tenantId);
        return user;
    }
}

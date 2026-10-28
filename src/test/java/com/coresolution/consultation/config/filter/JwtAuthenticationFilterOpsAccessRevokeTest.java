package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

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
import com.coresolution.core.constants.SecurityRoleConstants;
import jakarta.servlet.FilterChain;
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
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * Ops API 경로에서도 Access JWT 폐기·컷오프·중복로그인 차단을 센터 경로와 동일하게 적용하는지 검증.
 *
 * <p>SecurityContext 미설정 = 후속 보호 엔드포인트 401과 동일 의미(필터가 직접 401을 쓰지 않음).</p>
 *
 * @author MindGarden
 * @since 2026-10-22
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtAuthenticationFilter ops 경로 Access 폐기 게이트")
class JwtAuthenticationFilterOpsAccessRevokeTest {

    private static final String OPS_REQUEST_PATH = "/api/v1/ops/dashboard/metrics";

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
        token = "ops.access." + UUID.randomUUID();
        userPk = ThreadLocalRandom.current().nextLong(1_000L, 9_000_000L);

        filter = new JwtAuthenticationFilter(jwtService, userService, userRepository, blockRegistry,
            revocationService);
        request = new MockHttpServletRequest("GET", OPS_REQUEST_PATH);
        request.addHeader("Authorization", "Bearer " + token);
        response = new MockHttpServletResponse();
        when(jwtService.isTokenValid(token)).thenReturn(true);
        when(jwtService.extractUsername(token)).thenReturn(userId);
        when(jwtService.extractTenantId(token)).thenReturn(tenantId);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("A) ops 경로 + 정상 센터 DB user 토큰 → Authentication 설정")
    void opsPath_validCenterUserToken_setsAuthentication() throws Exception {
        User user = activeCenterUser();
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isFalse();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("ops 경로 + 센터 DB user + denylist true → Authentication null + mark")
    void opsPath_denylistRevoked_skipsAuthentication() throws Exception {
        // Given
        User user = activeCenterUser();
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(true);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        assertThat(request.getAttribute(SessionManagementConstants.REQUEST_ATTR_ACCESS_TOKEN_REVOKED))
            .isEqualTo(Boolean.TRUE);
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("ops 경로 + tokens_invalidated_at 이전 발급 → Authentication null + mark")
    void opsPath_issuedBeforeAccountCutoff_skipsAuthentication() throws Exception {
        // Given
        User user = activeCenterUser();
        user.setTokensInvalidatedAt(LocalDateTime.now().truncatedTo(ChronoUnit.SECONDS));
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token))
            .thenReturn(new Date(System.currentTimeMillis() - 60_000L));

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("ops 경로 + DuplicateLoginAccessBlockRegistry block → Authentication null + mark")
    void opsPath_blockedByRegistry_skipsAuthentication() throws Exception {
        // Given
        User user = activeCenterUser();
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(true);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("C) /api/v1/ops/onboarding/ + denylist → Authentication null")
    void opsOnboardingPath_denylistRevoked_skipsAuthentication() throws Exception {
        request.setRequestURI("/api/v1/ops/onboarding/tenants");
        User user = activeCenterUser();
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("C) /api/v1/ops/onboarding/ + 정상 토큰 → Authentication 설정")
    void opsOnboardingPath_validToken_setsAuthentication() throws Exception {
        request.setRequestURI("/api/v1/ops/onboarding/tenants");
        User user = activeCenterUser();
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isFalse();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("D) tenantId null + email 조회 경로 + denylist → Authentication null")
    void emailClaimPath_denylistRevoked_skipsAuthentication() throws Exception {
        String email = "email-claim-" + UUID.randomUUID() + "@example.com";
        User user = activeCenterUser();
        user.setEmail(email);
        when(jwtService.extractTenantId(token)).thenReturn(null);
        when(jwtService.extractEmail(token)).thenReturn(email);
        when(userService.findByEmail(email)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(true);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("D) tenantId null + email 조회 경로 + 정상 → Authentication 설정")
    void emailClaimPath_validToken_setsAuthentication() throws Exception {
        String email = "email-claim-" + UUID.randomUUID() + "@example.com";
        User user = activeCenterUser();
        user.setEmail(email);
        when(jwtService.extractTenantId(token)).thenReturn(null);
        when(jwtService.extractEmail(token)).thenReturn(email);
        when(userService.findByEmail(email)).thenReturn(Optional.of(user));
        when(blockRegistry.isBlocked(userPk)).thenReturn(false);
        when(jwtService.extractIssuedAt(token)).thenReturn(new Date());
        when(revocationService.isAccessTokenRevoked(token)).thenReturn(false);

        filter.doFilterInternal(request, response, filterChain);

        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isFalse();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("ops 경로 + tenantId 없는 순수 ops 토큰(HQ_ADMIN) → Authentication 설정 + ROLE_OPS (mark 없음)")
    void opsPath_pureOpsTokenWithoutTenant_setsAuthenticationWithRoleOps() throws Exception {
        // Given — tenantId 없음 + DB 미스 → user==null (순수 ops). revoke 게이트는 if (user != null) 밖.
        when(jwtService.extractTenantId(token)).thenReturn(null);
        when(jwtService.extractEmail(token)).thenReturn(null);
        when(jwtService.extractActorRole(token))
            .thenReturn(SecurityRoleConstants.ACTOR_ROLE_HQ_ADMIN);

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        Set<String> authorities = authentication.getAuthorities().stream()
            .map(GrantedAuthority::getAuthority)
            .collect(Collectors.toSet());
        assertThat(authorities).contains(SecurityRoleConstants.ROLE_OPS);
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isFalse();
        verify(filterChain).doFilter(request, response);
    }

    private User activeCenterUser() {
        User user = User.builder()
            .userId(userId)
            .email("ops-center-" + UUID.randomUUID() + "@example.com")
            .role(UserRole.ADMIN)
            .isActive(true)
            .lifecycleState(LifecycleState.ACTIVE)
            .build();
        user.setId(userPk);
        user.setTenantId(tenantId);
        return user;
    }
}

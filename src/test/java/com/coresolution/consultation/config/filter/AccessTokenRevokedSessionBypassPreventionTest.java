package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.config.SessionBasedAuthenticationFilter;
import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.AuthTokenRevocationService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.consultation.util.AccessTokenRevocationRequestMarker;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * 폐기 Bearer 가 SecurityContext 를 비운 뒤, 살아 있는 JSESSIONID 로 세션 복원되지 않는지 검증.
 *
 * <p>Jwt → Session 필터 순 수동 체인 및 MockMvc(addFilters) 통합.</p>
 *
 * @author MindGarden
 * @since 2026-10-22
 */
@DisplayName("폐기 Access JWT — 세션 복원 방지")
class AccessTokenRevokedSessionBypassPreventionTest {

    private static final String TENANT = "tenant-revoke-bypass";
    private static final String USER_ID = "user-revoke-bypass";
    private static final String EMAIL = "revoke-bypass@example.com";
    private static final Long USER_PK = 501L;
    private static final String SESSION_ID = "AABBCCDDEEFF00112233445566778899";
    private static final String CENTER_PATH = "/api/v1/clients/me";

    private JwtService jwtService;
    private JwtAuthenticationFilter jwtFilter;
    private SessionBasedAuthenticationFilter sessionFilter;
    private AuthTokenRevocationService revocationService;
    private UserRepository userRepository;
    private UserSessionService userSessionService;
    private User user;

    @BeforeEach
    @SuppressWarnings("unchecked")
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secretKey",
                Base64.getEncoder().encodeToString(new byte[32]));
        ReflectionTestUtils.setField(jwtService, "jwtExpiration", 3_600_000L);
        ReflectionTestUtils.setField(jwtService, "refreshExpiration", 604_800_000L);

        ObjectProvider<StringRedisTemplate> noRedis = mock(ObjectProvider.class);
        revocationService = new AuthTokenRevocationService(noRedis);

        user = User.builder()
                .userId(USER_ID)
                .email(EMAIL)
                .role(UserRole.CLIENT)
                .isActive(true)
                .isPasswordChanged(true)
                .lifecycleState(LifecycleState.ACTIVE)
                .build();
        user.setId(USER_PK);
        user.setTenantId(TENANT);

        userRepository = mock(UserRepository.class);
        when(userRepository.findByTenantIdAndUserId(TENANT, USER_ID)).thenReturn(Optional.of(user));

        userSessionService = mock(UserSessionService.class);
        UserSession dbSession = UserSession.builder()
                .sessionId(SESSION_ID)
                .user(user)
                .isActive(true)
                .lastActivityAt(LocalDateTime.now().minusMinutes(1))
                .expiresAt(LocalDateTime.now().plusHours(2))
                .build();
        when(userSessionService.getActiveSession(SESSION_ID)).thenReturn(dbSession);
        when(userSessionService.slideActiveSession(
                eq(SESSION_ID),
                eq(240),
                eq((long) SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS)))
                .thenReturn(true);

        jwtFilter = new JwtAuthenticationFilter(
                jwtService, mock(UserService.class), userRepository, null, revocationService);

        sessionFilter = new SessionBasedAuthenticationFilter();
        ReflectionTestUtils.setField(sessionFilter, "userSessionService", userSessionService);
        ReflectionTestUtils.setField(sessionFilter, "userRepository", userRepository);
        ReflectionTestUtils.setField(
                sessionFilter,
                "sessionTimeoutProperties",
                new SessionTimeoutProperties(Duration.ofHours(4)));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        RequestContextHolder.resetRequestAttributes();
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("B) 폐기 Bearer + 살아 있는 세션 — Jwt→Session 체인 후 Auth null")
    void revokedBearerWithLiveSession_leavesUnauthenticated() throws Exception {
        String accessToken = issueAccessToken();
        revokeAccess(accessToken);

        MockHttpServletRequest request = centerRequestWithSession();
        request.addHeader("Authorization", "Bearer " + accessToken);
        MockHttpServletResponse response = new MockHttpServletResponse();

        runJwtThenSession(request, response);

        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("E) MockMvc: 폐기 Bearer+세션 → 401, 정상 세션만(Bearer 없음) → 200")
    void mockMvc_revokedBearerDenied_sessionOnlyStillAuthenticated() throws Exception {
        String accessToken = issueAccessToken();
        revokeAccess(accessToken);

        MockMvc mockMvc = MockMvcBuilders.standaloneSetup(new ProbeController())
                .addFilters(jwtFilter, sessionFilter)
                .build();

        mockMvc.perform(get(CENTER_PATH)
                        .header("Authorization", "Bearer " + accessToken)
                        .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", SESSION_ID))
                        .session(liveHttpSession()))
                .andExpect(status().isUnauthorized());

        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();

        mockMvc.perform(get(CENTER_PATH)
                        .cookie(new jakarta.servlet.http.Cookie("JSESSIONID", SESSION_ID))
                        .session(liveHttpSession()))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("정상 Bearer + ops 경로 — Authentication 설정(필터 통과)")
    void validBearerOnOpsPath_setsAuthentication() throws Exception {
        String accessToken = issueAccessToken();
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/v1/ops/dashboard/metrics");
        request.addHeader("Authorization", "Bearer " + accessToken);

        jwtFilter.doFilter(request, new MockHttpServletResponse(), new MockFilterChain());

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        assertThat(authentication).isNotNull();
        assertThat(AccessTokenRevocationRequestMarker.isMarked(request)).isFalse();
    }

    private void runJwtThenSession(HttpServletRequest request, HttpServletResponse response)
            throws Exception {
        FilterChain chain = (req, res) -> sessionFilter.doFilter(req, res, new MockFilterChain());
        jwtFilter.doFilter(request, response, chain);
    }

    private MockHttpServletRequest centerRequestWithSession() {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", CENTER_PATH);
        request.setSession(liveHttpSession());
        request.setCookies(new jakarta.servlet.http.Cookie("JSESSIONID", SESSION_ID));
        return request;
    }

    private MockHttpSession liveHttpSession() {
        MockHttpSession httpSession = new MockHttpSession(null, SESSION_ID);
        httpSession.setAttribute(SessionConstants.USER_OBJECT, user);
        httpSession.setAttribute(SessionConstants.SESSION_ID, SESSION_ID);
        return httpSession;
    }

    private String issueAccessToken() {
        RequestContextHolder.setRequestAttributes(new ServletRequestAttributes(new MockHttpServletRequest()));
        try {
            return jwtService.generateToken(user, Collections.emptyList());
        } finally {
            RequestContextHolder.resetRequestAttributes();
        }
    }

    private void revokeAccess(String accessToken) {
        revocationService.revokeAccessToken(accessToken, System.currentTimeMillis() + Duration.ofHours(1).toMillis());
    }

    /**
     * 인증 여부만 확인하는 프로브 — Auth null 이면 401, 있으면 200.
     */
    @RestController
    static class ProbeController {
        @GetMapping("/api/v1/clients/me")
        public String me() {
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                throw new org.springframework.web.server.ResponseStatusException(
                        org.springframework.http.HttpStatus.UNAUTHORIZED);
            }
            return "ok-" + UUID.randomUUID();
        }
    }
}

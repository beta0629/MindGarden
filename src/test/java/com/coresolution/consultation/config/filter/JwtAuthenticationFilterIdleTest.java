package com.coresolution.consultation.config.filter;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeast;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.config.SessionTimeoutProperties;
import com.coresolution.consultation.constant.LifecycleState;
import com.coresolution.consultation.constant.SessionManagementConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.BearerIdleSessionService;
import com.coresolution.consultation.service.JwtService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.impl.BearerIdleSessionServiceImpl;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.context.SecurityContextHolder;

/**
 * {@link JwtAuthenticationFilter} Bearer 유휴 세션 게이트 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-10-31
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("JwtAuthenticationFilter — Bearer 유휴 세션")
class JwtAuthenticationFilterIdleTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();

    @Mock
    private JwtService jwtService;

    @Mock
    private UserService userService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private BearerIdleSessionService bearerIdleSessionService;

    @Mock
    private HttpServletRequest request;

    @Mock
    private FilterChain filterChain;

    private JwtAuthenticationFilter filter;

    private String tenantId;
    private String userId;
    private String token;
    private String sid;
    private String requestPath;

    @BeforeEach
    void setUp() {
        tenantId = "tenant-" + UUID.randomUUID();
        userId = "user-" + UUID.randomUUID();
        token = "access." + UUID.randomUUID() + ".jwt";
        sid = UUID.randomUUID().toString().replace("-", "");
        requestPath = "/api/v1/clients/" + UUID.randomUUID();

        filter = new JwtAuthenticationFilter(
                jwtService,
                userService,
                userRepository,
                null,
                null,
                bearerIdleSessionService);
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @ParameterizedTest(name = "{0} idle 비활성 → 401·체인 미호출")
    @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
    @DisplayName("유휴 만료 시 writeUnauthorizedIdle 후 체인 중단")
    void inactiveSession_writesUnauthorizedAndStopsChain(UserRole role) throws Exception {
        // Given
        User user = activeUser(role);
        stubValidBearerRequest(user);
        when(bearerIdleSessionService.isBearerSessionActive(sid, role)).thenReturn(false);
        // 실구현과 동일 JSON shape 로 401 기록
        BearerIdleSessionServiceImpl realWriter = new BearerIdleSessionServiceImpl(
                org.mockito.Mockito.mock(com.coresolution.consultation.service.UserSessionService.class),
                new SessionTimeoutProperties(Duration.ofHours(4)));
        doAnswer(invocation -> {
            realWriter.writeUnauthorizedIdle(invocation.getArgument(0), invocation.getArgument(1));
            return null;
        }).when(bearerIdleSessionService).writeUnauthorizedIdle(any(), any());

        MockHttpServletResponse response = new MockHttpServletResponse();

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(bearerIdleSessionService).isBearerSessionActive(sid, role);
        verify(bearerIdleSessionService).writeUnauthorizedIdle(eq(request), eq(response));
        verify(bearerIdleSessionService, never()).touchActivity(any(), any());
        verify(filterChain, never()).doFilter(any(), any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
        JsonNode body = OBJECT_MAPPER.readTree(response.getContentAsByteArray());
        assertThat(body.get("redirectToLogin").asBoolean()).isTrue();
        assertThat(body.get("message").asText())
                .isEqualTo(SessionManagementConstants.SESSION_EXPIRED_MESSAGE);
    }

    @ParameterizedTest(name = "{0} idle 활성 → 체인 진행·touchActivity")
    @EnumSource(value = UserRole.class, names = {"CLIENT", "CONSULTANT", "ADMIN"})
    @DisplayName("유휴 미초과 시 touchActivity 후 체인 진행")
    void activeSession_touchesAndContinuesChain(UserRole role) throws Exception {
        // Given
        User user = activeUser(role);
        stubValidBearerRequest(user);
        when(bearerIdleSessionService.isBearerSessionActive(sid, role)).thenReturn(true);
        when(bearerIdleSessionService.touchActivity(sid, role)).thenReturn(true);

        MockHttpServletResponse response = new MockHttpServletResponse();

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(bearerIdleSessionService).isBearerSessionActive(sid, role);
        verify(bearerIdleSessionService).touchActivity(sid, role);
        verify(bearerIdleSessionService, never()).writeUnauthorizedIdle(any(), any());
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getPrincipal())
                .isEqualTo(userId);
    }

    @Test
    @DisplayName("BearerIdleSessionService 가 null 이면 유휴 게이트를 건너뛴다")
    void nullIdleService_skipsIdleGate() throws Exception {
        // Given
        filter = new JwtAuthenticationFilter(
                jwtService, userService, userRepository, null, null, null);
        User user = activeUser(UserRole.CLIENT);
        stubValidBearerRequest(user);
        MockHttpServletResponse response = new MockHttpServletResponse();

        // When
        filter.doFilterInternal(request, response, filterChain);

        // Then
        verify(filterChain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    @Test
    @DisplayName("활성 세션 직후 doFilter 5회 연속 성공 — 매번 touchActivity 호출")
    void activeSession_fiveConsecutiveFilters_touchEachTime() throws Exception {
        // Given
        UserRole role = UserRole.CONSULTANT;
        User user = activeUser(role);
        stubValidBearerRequest(user);
        when(bearerIdleSessionService.isBearerSessionActive(sid, role)).thenReturn(true);
        when(bearerIdleSessionService.touchActivity(sid, role)).thenReturn(true);

        // When — 요청 단위 SecurityContext 클리어 (실제 요청 경계와 동일)
        for (int i = 0; i < 5; i++) {
            SecurityContextHolder.clearContext();
            MockHttpServletResponse response = new MockHttpServletResponse();
            filter.doFilterInternal(request, response, filterChain);
            assertThat(response.getStatus())
                    .as("연속 요청 #%d 는 401 이 아니어야 함", i + 1)
                    .isNotEqualTo(HttpServletResponse.SC_UNAUTHORIZED);
            assertThat(SecurityContextHolder.getContext().getAuthentication())
                    .as("연속 요청 #%d 인증 설정", i + 1)
                    .isNotNull();
        }

        // Then
        verify(bearerIdleSessionService, times(5)).isBearerSessionActive(sid, role);
        verify(bearerIdleSessionService, times(5)).touchActivity(sid, role);
        verify(bearerIdleSessionService, never()).writeUnauthorizedIdle(any(), any());
        verify(filterChain, times(5)).doFilter(eq(request), any(HttpServletResponse.class));
        verify(filterChain, atLeast(5)).doFilter(any(), any());
    }

    private void stubValidBearerRequest(User user) {
        when(request.getRequestURI()).thenReturn(requestPath);
        when(request.getHeader("Authorization")).thenReturn("Bearer " + token);
        when(jwtService.isTokenValid(token)).thenReturn(true);
        when(jwtService.isPasswordChangeRequired(token)).thenReturn(false);
        when(jwtService.extractUsername(token)).thenReturn(userId);
        when(jwtService.extractTenantId(token)).thenReturn(tenantId);
        when(jwtService.extractSessionId(token)).thenReturn(sid);
        when(userRepository.findByTenantIdAndUserId(tenantId, userId)).thenReturn(Optional.of(user));
    }

    private User activeUser(UserRole role) {
        User user = User.builder()
                .userId(userId)
                .email(userId + "@example.com")
                .password("{bcrypt}$2a$10$0123456789012345678901z")
                .name("idle-filter-test")
                .role(role)
                .isActive(true)
                .isPasswordChanged(true)
                .build();
        user.setId(Math.abs(UUID.randomUUID().getMostSignificantBits()));
        user.setTenantId(tenantId);
        user.setLifecycleState(LifecycleState.ACTIVE);
        return user;
    }
}

package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.constant.auth.PasswordChangeGate;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserSessionService;
import com.coresolution.core.context.TenantContextHolder;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * 변경 전 세션은 허용 경로 밖에서 403.
 *
 * @author MindGarden
 * @since 2026-10-14
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SessionBasedAuthenticationFilter 비밀번호 변경 가드")
class SessionBasedAuthenticationFilterPasswordChangeGateTest {

    private static final String SESSION_ID = "AABBCCDDEEFF00112233445566778899";

    @Mock
    private UserSessionService userSessionService;

    @Mock
    private UserRepository userRepository;

    @Mock
    private FilterChain filterChain;

    @InjectMocks
    private SessionBasedAuthenticationFilter filter;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(
                filter,
                "sessionTimeoutProperties",
                new SessionTimeoutProperties(Duration.ofHours(4)));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("변경 전 상담사 세션의 다른 API 는 403")
    void unchangedConsultant_blocksOtherApi() throws Exception {
        MockHttpServletResponse response = exercise("GET", "/api/v1/schedules", false);

        verify(filterChain, never()).doFilter(
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any());
        assertThat(response.getStatus()).isEqualTo(403);
        assertThat(response.getContentAsString()).contains(PasswordChangeGate.ERROR_CODE);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    @Test
    @DisplayName("변경 전 세션도 현재 사용자 조회는 통과")
    void unchangedClient_allowsCurrentUser() throws Exception {
        MockHttpServletRequest request = sessionRequest("GET", "/api/v1/auth/current-user", false, false);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(403);
    }

    @Test
    @DisplayName("OAuth 세션은 isPasswordChanged=false 여도 다른 API 통과")
    void oauthSession_skipsPasswordChangeGate() throws Exception {
        MockHttpServletRequest request = sessionRequest("GET", "/api/v1/schedules", false, true);
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(filterChain).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(403);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
    }

    private MockHttpServletResponse exercise(String method, String path, boolean passwordChanged) throws Exception {
        MockHttpServletRequest request = sessionRequest(method, path, passwordChanged, false);
        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilterInternal(request, response, filterChain);
        return response;
    }

    private MockHttpServletRequest sessionRequest(String method, String path, boolean passwordChanged,
            boolean oauthLogin) {
        User user = User.builder()
                .email("consultant@example.com")
                .role(UserRole.CONSULTANT)
                .isPasswordChanged(passwordChanged)
                .build();
        user.setId(42L);
        user.setTenantId("tenant-session-gate");

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
                eq(SessionConstants.SESSION_TIMEOUT_SECONDS_CONSULTANT),
                eq((long) SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS)))
                .thenReturn(true);

        MockHttpSession httpSession = new MockHttpSession(null, SESSION_ID);
        httpSession.setAttribute(SessionConstants.USER_OBJECT, user);
        httpSession.setAttribute(SessionConstants.SESSION_ID, SESSION_ID);
        if (oauthLogin) {
            httpSession.setAttribute(SessionConstants.OAUTH_LOGIN, Boolean.TRUE);
        }

        MockHttpServletRequest request = new MockHttpServletRequest(method, path);
        request.setSession(httpSession);
        request.setCookies(new jakarta.servlet.http.Cookie("JSESSIONID", SESSION_ID));
        return request;
    }
}

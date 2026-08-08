package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Duration;
import java.time.LocalDateTime;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.UserSession;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.service.UserSessionService;
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
 * 만료 전 활동(핑)이 DB 슬라이딩을 호출하고 HttpSession 을 invalidate 하지 않는지 검증.
 *
 * @author MindGarden
 * @since 2026-08-07
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("SessionBasedAuthenticationFilter — DB 세션 슬라이딩")
class SessionBasedAuthenticationFilterSlidingTest {

    private static final String SESSION_ID = "AABBCCDDEEFF00112233445566778899";
    private static final String REQUEST_PATH = "/api/v1/schedules/consultation-records";

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
    }

    @Test
    @DisplayName("활성 DB 세션 + 핑: slideActiveSession 호출, 세션 invalidate 안 함, 인증 유지")
    void activeSession_ping_slidesAndKeepsHttpSession() throws Exception {
        User user = consultantUser();
        UserSession dbSession = UserSession.builder()
                .sessionId(SESSION_ID)
                .user(user)
                .isActive(true)
                .lastActivityAt(LocalDateTime.now().minusMinutes(10))
                .expiresAt(LocalDateTime.now().plusHours(2))
                .build();

        when(userSessionService.getActiveSession(SESSION_ID)).thenReturn(dbSession);
        when(userSessionService.slideActiveSession(
                eq(SESSION_ID),
                eq(240),
                eq((long) SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS)))
                .thenReturn(true);

        MockHttpSession httpSession = new MockHttpSession(null, SESSION_ID);
        httpSession.setAttribute(SessionConstants.USER_OBJECT, user);
        httpSession.setAttribute(SessionConstants.SESSION_ID, SESSION_ID);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setSession(httpSession);
        request.setCookies(new jakarta.servlet.http.Cookie("JSESSIONID", SESSION_ID));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        verify(userSessionService).slideActiveSession(
                eq(SESSION_ID),
                eq(240),
                eq((long) SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS));
        assertThat(httpSession.isInvalid()).isFalse();
        assertThat(SecurityContextHolder.getContext().getAuthentication())
                .as("활성 세션 핑 후 인증이 유지되어야 함")
                .isNotNull();
        verify(filterChain).doFilter(request, response);
    }

    @Test
    @DisplayName("DB 세션 비활성(중복로그인 cleanup): HttpSession invalidate, slide 미호출")
    void inactiveDbSession_invalidatesWithoutSliding() throws Exception {
        User user = consultantUser();
        when(userSessionService.getActiveSession(SESSION_ID)).thenReturn(null);

        MockHttpSession httpSession = new MockHttpSession(null, SESSION_ID);
        httpSession.setAttribute(SessionConstants.USER_OBJECT, user);
        httpSession.setAttribute(SessionConstants.SESSION_ID, SESSION_ID);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setSession(httpSession);
        request.setCookies(new jakarta.servlet.http.Cookie("JSESSIONID", SESSION_ID));
        MockHttpServletResponse response = new MockHttpServletResponse();

        filter.doFilterInternal(request, response, filterChain);

        assertThat(httpSession.isInvalid()).isTrue();
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verify(userSessionService, never()).slideActiveSession(anyString(), anyInt(), anyLong());
        verify(filterChain).doFilter(request, response);
    }

    private static User consultantUser() {
        User user = User.builder()
                .email("consultant-slide@example.com")
                .role(UserRole.CONSULTANT)
                .build();
        user.setId(42L);
        user.setTenantId("tenant-slide-filter");
        return user;
    }
}

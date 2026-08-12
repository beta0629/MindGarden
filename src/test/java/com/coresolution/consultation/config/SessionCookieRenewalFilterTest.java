package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.AuthorityUtils;
import org.springframework.security.core.context.SecurityContextHolder;

import com.coresolution.consultation.constant.SessionConstants;

/**
 * {@link SessionCookieRenewalFilter} — 스로틀 전후 Set-Cookie / Max-Age 검증.
 *
 * <p>회귀 가드: JSON 응답처럼 체인에서 응답이 <strong>커밋</strong>되어도
 * pre-chain 발급으로 Set-Cookie 가 남아야 한다.</p>
 *
 * @author MindGarden
 * @since 2026-08-10
 */
@DisplayName("SessionCookieRenewalFilter — Max-Age 슬라이딩·스로틀")
class SessionCookieRenewalFilterTest {

    private static final String SESSION_ID = "AABBCCDDEEFF00112233445566778899";
    private static final String REQUEST_PATH = "/api/v1/schedules/consultation-records";
    private static final int MAX_INACTIVE = SessionConstants.SESSION_TIMEOUT_SECONDS;

    private SessionCookieRenewalFilter filter;
    private MockEnvironment environment;

    @BeforeEach
    void setUp() {
        environment = new MockEnvironment();
        environment.setProperty("SESSION_COOKIE_DOMAIN", "core-solution.co.kr");
        environment.setProperty("server.servlet.session.cookie.http-only", "true");
        environment.setProperty("server.servlet.session.cookie.secure", "true");
        environment.setProperty("server.servlet.session.cookie.same-site", "Lax");
        filter = new SessionCookieRenewalFilter(
                new SessionCookieSupport(environment),
                new SessionTimeoutProperties(Duration.ofSeconds(MAX_INACTIVE)));
        SecurityContextHolder.clearContext();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("인증+세션: 첫 요청에 Set-Cookie Max-Age·Domain·HttpOnly·SameSite 발급")
    void firstAuthenticatedRequest_setsCookieWithMaxAgeAndAlignedAttrs() throws Exception {
        MockHttpSession session = new MockHttpSession(null, SESSION_ID);
        session.setMaxInactiveInterval(MAX_INACTIVE);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setSession(session);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        setAuthenticated();

        filter.doFilterInternal(request, response, chain);

        verify(chain).doFilter(request, response);
        String header = findJsessionSetCookie(response);
        assertThat(header).contains("Max-Age=" + MAX_INACTIVE);
        assertThat(header).contains("Domain=core-solution.co.kr");
        assertThat(header).containsIgnoringCase("HttpOnly");
        assertThat(header).containsIgnoringCase("SameSite=Lax");
        assertThat(header).containsIgnoringCase("Secure");
        assertThat(session.getAttribute(SessionConstants.SESSION_COOKIE_LAST_RENEWED))
                .isInstanceOf(Long.class);
    }

    @Test
    @DisplayName("스로틀 내 재요청: Set-Cookie 미발급")
    void withinThrottle_skipsSetCookie() throws Exception {
        MockHttpSession session = new MockHttpSession(null, SESSION_ID);
        session.setMaxInactiveInterval(MAX_INACTIVE);
        session.setAttribute(
                SessionConstants.SESSION_COOKIE_LAST_RENEWED,
                Instant.now().getEpochSecond());

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setSession(session);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        setAuthenticated();
        filter.doFilterInternal(request, response, chain);

        assertThat(response.getHeaders(HttpHeaders.SET_COOKIE)).isEmpty();
    }

    @Test
    @DisplayName("스로틀 경과 후: Set-Cookie Max-Age 재발급")
    void afterThrottle_renewsSetCookie() throws Exception {
        MockHttpSession session = new MockHttpSession(null, SESSION_ID);
        session.setMaxInactiveInterval(MAX_INACTIVE);
        long past = Instant.now().getEpochSecond()
                - SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS
                - 1L;
        session.setAttribute(SessionConstants.SESSION_COOKIE_LAST_RENEWED, past);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setSession(session);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        setAuthenticated();
        filter.doFilterInternal(request, response, chain);

        String header = findJsessionSetCookie(response);
        assertThat(header).contains("Max-Age=" + MAX_INACTIVE);
        assertThat(header).contains("Domain=core-solution.co.kr");
        Long renewed = (Long) session.getAttribute(SessionConstants.SESSION_COOKIE_LAST_RENEWED);
        assertThat(renewed).isGreaterThan(past);
    }

    @Test
    @DisplayName("체인에서 응답이 커밋되어도(JSON 응답) Set-Cookie Max-Age 발급 — 회귀 가드")
    void committedResponse_stillSetsCookie() throws Exception {
        MockHttpSession session = new MockHttpSession(null, SESSION_ID);
        session.setMaxInactiveInterval(MAX_INACTIVE);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setSession(session);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        doAnswer(invocation -> {
            // Spring MVC 메시지 컨버터가 바디를 flush 하며 응답을 커밋하는 상황 재현
            ((HttpServletResponse) invocation.getArgument(1)).flushBuffer();
            return null;
        }).when(chain).doFilter(any(), any());

        setAuthenticated();
        filter.doFilterInternal(request, response, chain);

        assertThat(response.isCommitted()).isTrue();
        assertThat(findJsessionSetCookie(response)).contains("Max-Age=" + MAX_INACTIVE);
    }

    @Test
    @DisplayName("HttpSession maxInactiveInterval 이 SSOT와 다르면 SSOT로 정렬 후 동일 Max-Age 발급")
    void misalignedSessionTimeout_isRealignedToSsot() throws Exception {
        MockHttpSession session = new MockHttpSession(null, SESSION_ID);
        session.setMaxInactiveInterval(SessionConstants.SESSION_REFRESH_INTERVAL_SECONDS);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setSession(session);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        setAuthenticated();
        filter.doFilterInternal(request, response, chain);

        assertThat(session.getMaxInactiveInterval()).isEqualTo(MAX_INACTIVE);
        assertThat(findJsessionSetCookie(response)).contains("Max-Age=" + MAX_INACTIVE);
    }

    @Test
    @DisplayName("미인증: Set-Cookie 미발급")
    void unauthenticated_skipsSetCookie() throws Exception {
        MockHttpSession session = new MockHttpSession(null, SESSION_ID);
        session.setMaxInactiveInterval(MAX_INACTIVE);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", REQUEST_PATH);
        request.setSession(session);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilterInternal(request, response, chain);

        assertThat(response.getHeaders(HttpHeaders.SET_COOKIE)).isEmpty();
    }

    /**
     * 응답 헤더에서 JSESSIONID Set-Cookie 한 줄을 찾는다(없으면 실패).
     */
    private static String findJsessionSetCookie(MockHttpServletResponse response) {
        List<String> setCookies = response.getHeaders(HttpHeaders.SET_COOKIE);
        assertThat(setCookies).isNotEmpty();
        return setCookies.stream()
                .filter(header -> header.startsWith(SessionConstants.SESSION_COOKIE_NAME + "="))
                .findFirst()
                .orElseThrow();
    }

    private static void setAuthenticated() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user",
                        "n/a",
                        AuthorityUtils.createAuthorityList("ROLE_USER")));
    }
}

package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;

import java.time.Instant;
import java.util.List;

import jakarta.servlet.FilterChain;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
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
 * @author MindGarden
 * @since 2026-08-10
 */
@DisplayName("SessionCookieRenewalFilter — Max-Age 슬라이딩·스로틀")
class SessionCookieRenewalFilterTest {

    private static final String SESSION_ID = "AABBCCDDEEFF00112233445566778899";
    private static final String REQUEST_PATH = "/api/v1/schedules/consultation-records";
    private static final int MAX_INACTIVE = 4 * 60 * 60;

    private SessionCookieRenewalFilter filter;
    private MockEnvironment environment;

    @BeforeEach
    void setUp() {
        environment = new MockEnvironment();
        environment.setProperty("SESSION_COOKIE_DOMAIN", "core-solution.co.kr");
        environment.setProperty("server.servlet.session.cookie.http-only", "true");
        environment.setProperty("server.servlet.session.cookie.secure", "true");
        environment.setProperty("server.servlet.session.cookie.same-site", "Lax");
        filter = new SessionCookieRenewalFilter(new SessionCookieSupport(environment));
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
        List<String> setCookies = response.getHeaders("Set-Cookie");
        assertThat(setCookies).isNotEmpty();
        String header = setCookies.stream()
                .filter(h -> h.startsWith(SessionConstants.SESSION_COOKIE_NAME + "="))
                .findFirst()
                .orElseThrow();
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

        assertThat(response.getHeaders("Set-Cookie")).isEmpty();
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

        List<String> setCookies = response.getHeaders("Set-Cookie");
        assertThat(setCookies).isNotEmpty();
        String header = setCookies.stream()
                .filter(h -> h.startsWith(SessionConstants.SESSION_COOKIE_NAME + "="))
                .findFirst()
                .orElseThrow();
        assertThat(header).contains("Max-Age=" + MAX_INACTIVE);
        assertThat(header).contains("Domain=core-solution.co.kr");
        Long renewed = (Long) session.getAttribute(SessionConstants.SESSION_COOKIE_LAST_RENEWED);
        assertThat(renewed).isGreaterThan(past);
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

        assertThat(response.getHeaders("Set-Cookie")).isEmpty();
    }

    private static void setAuthenticated() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(
                        "user",
                        "n/a",
                        AuthorityUtils.createAuthorityList("ROLE_USER")));
    }
}

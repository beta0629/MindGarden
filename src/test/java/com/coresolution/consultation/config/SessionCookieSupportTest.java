package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseCookie;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;

import com.coresolution.consultation.constant.SessionConstants;

/**
 * {@link SessionCookieSupport} — Domain/HttpOnly/SameSite/Secure/Max-Age SSOT 단위 검증.
 *
 * @author MindGarden
 * @since 2026-08-10
 */
@DisplayName("SessionCookieSupport — JSESSIONID Set-Cookie 속성")
class SessionCookieSupportTest {

    private static final String SESSION_ID = "AABBCCDDEEFF00112233445566778899";
    private static final int MAX_AGE = 4 * 60 * 60;

    @Test
    @DisplayName("기본: HttpOnly + SameSite=Lax + Max-Age, Domain 없음")
    void build_defaultAttrs_withoutDomain() {
        MockEnvironment env = new MockEnvironment();
        SessionCookieSupport support = new SessionCookieSupport(env);
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setSecure(true);

        ResponseCookie cookie = support.buildJsessionCookie(SESSION_ID, MAX_AGE, request);
        String header = cookie.toString();

        assertThat(cookie.getName()).isEqualTo(SessionConstants.SESSION_COOKIE_NAME);
        assertThat(cookie.getValue()).isEqualTo(SESSION_ID);
        assertThat(cookie.getMaxAge().getSeconds()).isEqualTo(MAX_AGE);
        assertThat(cookie.isHttpOnly()).isTrue();
        assertThat(cookie.getSameSite()).isEqualToIgnoringCase("Lax");
        assertThat(cookie.getDomain()).isNull();
        assertThat(header).contains("Max-Age=" + MAX_AGE);
        assertThat(header).doesNotContain("Domain=");
    }

    @Test
    @DisplayName("SESSION_COOKIE_DOMAIN 설정 시 Domain·Secure·HttpOnly 반영")
    void build_withDomainAndCookieProps() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("SESSION_COOKIE_DOMAIN", "  core-solution.co.kr  ");
        env.setProperty("server.servlet.session.cookie.http-only", "true");
        env.setProperty("server.servlet.session.cookie.secure", "true");
        env.setProperty("server.servlet.session.cookie.same-site", "Lax");
        SessionCookieSupport support = new SessionCookieSupport(env);

        String header = support.buildJsessionSetCookieHeader(
                SESSION_ID, MAX_AGE, new MockHttpServletRequest());

        assertThat(header).contains("Domain=core-solution.co.kr");
        assertThat(header).containsIgnoringCase("HttpOnly");
        assertThat(header).containsIgnoringCase("Secure");
        assertThat(header).containsIgnoringCase("SameSite=Lax");
        assertThat(header).contains("Max-Age=" + MAX_AGE);
        assertThat(header).doesNotContain("SameSite=None");
        assertThat(header).doesNotContain("HttpOnly=false");
    }

    @Test
    @DisplayName("SESSION_COOKIE_DOMAIN 공백이면 Domain 미설정")
    void build_blankDomain_omitsDomain() {
        MockEnvironment env = new MockEnvironment();
        env.setProperty("SESSION_COOKIE_DOMAIN", "   ");
        SessionCookieSupport support = new SessionCookieSupport(env);

        ResponseCookie cookie = support.buildJsessionCookie(
                SESSION_ID, MAX_AGE, new MockHttpServletRequest());

        assertThat(cookie.getDomain()).isNull();
        assertThat(support.resolveDomain()).isNull();
    }
}

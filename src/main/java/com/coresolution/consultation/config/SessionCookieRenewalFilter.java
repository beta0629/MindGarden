package com.coresolution.consultation.config;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.core.env.Environment;
import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import lombok.extern.slf4j.Slf4j;

/**
 * JSESSIONID 쿠키 Max-Age 슬라이딩 갱신 필터.
 *
 * <p>서버 세션의 {@code maxInactiveInterval}은 요청마다 자동으로 슬라이딩되지만,
 * 브라우저 쿠키의 {@code Max-Age}는 로그인 시 한 번만 설정되어 고정된다.
 * 이 필터는 인증된 요청에 대해 쿠키의 {@code Max-Age}를 세션 타임아웃과 동기화하여,
 * 쿠키가 서버 세션보다 먼저 만료되는 문제를 방지한다.</p>
 *
 * <p>성능을 위해 갱신은 {@link #COOKIE_RENEWAL_INTERVAL_SECONDS} 간격으로 스로틀링된다.</p>
 *
 * @author MindGarden
 * @since 2026-05-12
 */
@Slf4j
@Component
public class SessionCookieRenewalFilter extends OncePerRequestFilter {

    /**
     * 쿠키 갱신 스로틀링 간격 (초). 이 간격 내에는 중복 갱신하지 않는다.
     */
    private static final long COOKIE_RENEWAL_INTERVAL_SECONDS = 1800;

    /**
     * 세션에 마지막 쿠키 갱신 시각을 저장하는 속성 키
     */
    private static final String SESSION_ATTR_COOKIE_LAST_RENEWED = "SESSION_COOKIE_LAST_RENEWED";

    private static final String JSESSIONID = "JSESSIONID";

    private static final AntPathMatcher PATH_MATCHER = new AntPathMatcher();

    private static final Set<String> EXCLUDED_PATTERNS = Set.of(
            "/api/v1/auth/login",
            "/api/v1/auth/register",
            "/api/auth/**",
            "/actuator/**",
            "/static/**",
            "/assets/**",
            "/css/**",
            "/js/**",
            "/images/**",
            "/fonts/**"
    );

    private static final Set<String> EXCLUDED_EXTENSIONS = Set.of(
            ".js", ".css", ".html", ".png", ".jpg", ".jpeg",
            ".gif", ".svg", ".ico", ".woff", ".woff2", ".ttf", ".map"
    );

    private final Environment environment;

    public SessionCookieRenewalFilter(Environment environment) {
        this.environment = environment;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        filterChain.doFilter(request, response);

        if (response.isCommitted()) {
            return;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }

        HttpSession session = request.getSession(false);
        if (session == null) {
            return;
        }

        if (!shouldRenew(session)) {
            return;
        }

        renewCookie(request, response, session);
    }

    /**
     * 스로틀링: 마지막 갱신으로부터 {@link #COOKIE_RENEWAL_INTERVAL_SECONDS} 이상 경과했는지 확인
     */
    private boolean shouldRenew(HttpSession session) {
        Object lastRenewedObj = session.getAttribute(SESSION_ATTR_COOKIE_LAST_RENEWED);
        if (lastRenewedObj instanceof Long lastRenewed) {
            long elapsed = Instant.now().getEpochSecond() - lastRenewed;
            return elapsed >= COOKIE_RENEWAL_INTERVAL_SECONDS;
        }
        return true;
    }

    private void renewCookie(HttpServletRequest request,
                             HttpServletResponse response,
                             HttpSession session) {
        int maxAge = session.getMaxInactiveInterval();
        if (maxAge <= 0) {
            return;
        }

        boolean httpOnly = resolveHttpOnly();
        boolean secure = resolveSecure(request);
        String sameSite = resolveSameSite();
        String domain = resolveDomain();

        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
                .from(JSESSIONID, session.getId())
                .path("/")
                .httpOnly(httpOnly)
                .secure(secure)
                .sameSite(sameSite)
                .maxAge(maxAge);

        if (StringUtils.hasText(domain)) {
            builder.domain(domain);
        }

        response.addHeader("Set-Cookie", builder.build().toString());

        session.setAttribute(SESSION_ATTR_COOKIE_LAST_RENEWED, Instant.now().getEpochSecond());

        log.debug("JSESSIONID 쿠키 Max-Age 갱신: maxAge={}s, sessionId={}", maxAge, session.getId());
    }

    /**
     * {@code server.servlet.session.cookie.http-only} 설정 참조
     */
    private boolean resolveHttpOnly() {
        return environment.getProperty(
                "server.servlet.session.cookie.http-only", Boolean.class, true);
    }

    /**
     * {@code server.servlet.session.cookie.secure} 설정 참조.
     * 미설정 시 요청 프로토콜 기반 판단.
     */
    private boolean resolveSecure(HttpServletRequest request) {
        String secureProp = environment.getProperty("server.servlet.session.cookie.secure");
        if (secureProp != null) {
            return Boolean.parseBoolean(secureProp);
        }
        return request.isSecure();
    }

    /**
     * {@code server.servlet.session.cookie.same-site} 설정 참조
     */
    private String resolveSameSite() {
        return environment.getProperty(
                "server.servlet.session.cookie.same-site", "Lax");
    }

    /**
     * {@code SESSION_COOKIE_DOMAIN} 환경변수 참조.
     * 빈 문자열이면 도메인을 설정하지 않는다 (호스트 전용 쿠키).
     *
     * @see com.coresolution.core.config.SessionCookieDomainWebServerCustomizer
     */
    private String resolveDomain() {
        return environment.getProperty("SESSION_COOKIE_DOMAIN");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();

        for (String ext : EXCLUDED_EXTENSIONS) {
            if (path.endsWith(ext)) {
                return true;
            }
        }

        for (String pattern : EXCLUDED_PATTERNS) {
            if (PATH_MATCHER.match(pattern, path)) {
                return true;
            }
        }

        return false;
    }
}

package com.coresolution.consultation.config;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.ResponseCookie;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.coresolution.consultation.constant.SessionConstants;

import lombok.extern.slf4j.Slf4j;

/**
 * JSESSIONID 쿠키 Max-Age 슬라이딩 갱신 필터.
 *
 * <p>서버 세션의 {@code maxInactiveInterval}은 요청마다 자동으로 슬라이딩되지만,
 * 브라우저 쿠키의 {@code Max-Age}는 로그인 시 한 번만 설정되어 고정된다.
 * 이 필터는 인증된 요청에 대해 쿠키의 {@code Max-Age}를 세션 타임아웃과 동기화하여,
 * 쿠키가 서버 세션보다 먼저 만료되는 문제를 방지한다.</p>
 *
 * <p>성능을 위해 갱신은 {@link SessionConstants#SESSION_SLIDING_THROTTLE_SECONDS} 간격으로 스로틀링된다.
 * 이 값은 쿠키 Set-Cookie 헤더 갱신 빈도 제한이며, HttpSession TTL
 * ({@code HTTP_SESSION_MAX_INACTIVE} / 기본 4h)과 무관하다.
 * DB {@code user_sessions} 슬라이딩도 동일 스로틀을 사용한다.</p>
 *
 * <p>쿠키 Domain/HttpOnly/SameSite/Secure 는 {@link SessionCookieSupport} 로
 * OAuth 초기 발급과 동일 속성을 유지한다 (속성 불일치 시 브라우저가 갱신을 무시할 수 있음).</p>
 *
 * @author MindGarden
 * @since 2026-05-12
 */
@Slf4j
@Component
public class SessionCookieRenewalFilter extends OncePerRequestFilter {

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

    private final SessionCookieSupport sessionCookieSupport;

    /**
     * @param sessionCookieSupport JSESSIONID Set-Cookie 속성 SSOT
     */
    public SessionCookieRenewalFilter(SessionCookieSupport sessionCookieSupport) {
        this.sessionCookieSupport = sessionCookieSupport;
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
     * 스로틀링: 마지막 갱신으로부터 {@link SessionConstants#SESSION_SLIDING_THROTTLE_SECONDS} 이상 경과했는지 확인
     */
    private boolean shouldRenew(HttpSession session) {
        Object lastRenewedObj = session.getAttribute(SessionConstants.SESSION_COOKIE_LAST_RENEWED);
        if (lastRenewedObj instanceof Long lastRenewed) {
            long elapsed = Instant.now().getEpochSecond() - lastRenewed;
            return elapsed >= SessionConstants.SESSION_SLIDING_THROTTLE_SECONDS;
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

        ResponseCookie cookie = sessionCookieSupport.buildJsessionCookie(
                session.getId(), maxAge, request);
        response.addHeader("Set-Cookie", cookie.toString());

        session.setAttribute(SessionConstants.SESSION_COOKIE_LAST_RENEWED, Instant.now().getEpochSecond());

        log.debug("JSESSIONID 쿠키 Max-Age 갱신: maxAge={}s, sessionId={}", maxAge, session.getId());
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

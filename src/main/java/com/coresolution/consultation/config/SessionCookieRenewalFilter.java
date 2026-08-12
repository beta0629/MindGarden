package com.coresolution.consultation.config;

import java.io.IOException;
import java.time.Instant;
import java.util.Set;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import org.springframework.security.authentication.AnonymousAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.util.AntPathMatcher;
import org.springframework.web.filter.OncePerRequestFilter;

import com.coresolution.consultation.constant.SessionConstants;
import com.coresolution.consultation.util.TokenLogMasking;

import lombok.extern.slf4j.Slf4j;

/**
 * JSESSIONID 쿠키 Max-Age 슬라이딩 갱신 필터.
 *
 * <p>Tomcat 은 세션 <strong>생성 시 1회만</strong> {@code Set-Cookie} 를 보내므로,
 * {@code server.servlet.session.cookie.max-age} 가 설정된 환경에서는 사용자가 계속 활동해도
 * 브라우저 쿠키가 로그인 시점 + TTL 에 삭제된다(절대 만료). 이 필터는 인증된 요청에서
 * 쿠키 {@code Max-Age} 를 다시 발급해 <strong>쿠키·HttpSession·DB 세션이 함께</strong>
 * 슬라이딩되도록 한다.</p>
 *
 * <p><strong>발급 시점</strong>: {@code Set-Cookie} 는 반드시 응답이 커밋되기 <strong>전</strong>에
 * 넣어야 한다. Spring MVC 의 JSON 응답은 핸들러 내부 메시지 컨버터가 바디를 flush 하면서
 * 응답을 커밋하므로, 체인 이후(post-chain)에 헤더를 추가하면 무효가 된다.
 * 따라서 갱신은 {@code filterChain.doFilter(...)} <strong>호출 전(pre-chain)</strong> 에 수행하고,
 * pre-chain 시점에 아직 인증이 없던 요청만 커밋되지 않은 응답에 대해 1회 폴백 재시도한다.
 * (이 필터는 {@link SecurityConfig} 에서 {@code SessionBasedAuthenticationFilter} 뒤에 등록되어
 * pre-chain 시점에 이미 {@code SecurityContextHolder} 가 채워져 있다.)</p>
 *
 * <p><strong>TTL SSOT</strong>: Max-Age 와 {@code HttpSession#setMaxInactiveInterval} 은 모두
 * {@link SessionTimeoutProperties#getTimeoutSeconds()} ({@code HTTP_SESSION_MAX_INACTIVE}) 를 쓴다.</p>
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
    private final SessionTimeoutProperties sessionTimeoutProperties;

    /**
     * @param sessionCookieSupport     JSESSIONID Set-Cookie 속성 SSOT
     * @param sessionTimeoutProperties HttpSession TTL SSOT ({@code HTTP_SESSION_MAX_INACTIVE})
     */
    public SessionCookieRenewalFilter(SessionCookieSupport sessionCookieSupport,
                                      SessionTimeoutProperties sessionTimeoutProperties) {
        this.sessionCookieSupport = sessionCookieSupport;
        this.sessionTimeoutProperties = sessionTimeoutProperties;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        // JSON 응답은 핸들러 내부에서 커밋되므로 반드시 체인 호출 전에 Set-Cookie 를 넣는다.
        boolean renewed = renewIfEligible(request, response);

        filterChain.doFilter(request, response);

        // pre-chain 시점에 아직 인증이 없던 요청(뒤늦게 인증되는 경로) 폴백.
        // 커밋된 응답에는 헤더 추가가 무효이므로 미커밋일 때만 1회 재시도한다.
        if (!renewed && !response.isCommitted()) {
            renewIfEligible(request, response);
        }
    }

    /**
     * 인증·세션·스로틀 조건을 모두 만족하면 Set-Cookie 를 발급한다.
     *
     * @param request  요청
     * @param response 응답
     * @return 실제로 Set-Cookie 를 추가했으면 true
     */
    private boolean renewIfEligible(HttpServletRequest request, HttpServletResponse response) {
        if (!isAuthenticated()) {
            return false;
        }

        HttpSession session = request.getSession(false);
        if (session == null || !shouldRenew(session)) {
            return false;
        }

        return renewCookie(request, response, session);
    }

    /**
     * 익명 인증(AnonymousAuthenticationToken)은 로그인 세션이 아니므로 갱신 대상에서 제외한다.
     */
    private boolean isAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.isAuthenticated()
                && !(authentication instanceof AnonymousAuthenticationToken);
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

    /**
     * 쿠키 Max-Age 와 HttpSession {@code maxInactiveInterval} 을 TTL SSOT 로 함께 연장한다.
     *
     * @return Set-Cookie 를 추가했으면 true
     */
    private boolean renewCookie(HttpServletRequest request,
                                HttpServletResponse response,
                                HttpSession session) {
        int ttlSeconds = sessionTimeoutProperties.getTimeoutSeconds();
        if (ttlSeconds <= 0) {
            return false;
        }

        // 컨테이너 세션과 쿠키가 서로 다른 만료를 갖지 않도록 SSOT 로 정렬 (UI 리필만으로 착시 금지)
        if (session.getMaxInactiveInterval() != ttlSeconds) {
            session.setMaxInactiveInterval(ttlSeconds);
        }

        ResponseCookie cookie = sessionCookieSupport.buildJsessionCookie(
                session.getId(), ttlSeconds, request);
        response.addHeader(HttpHeaders.SET_COOKIE, cookie.toString());

        session.setAttribute(SessionConstants.SESSION_COOKIE_LAST_RENEWED, Instant.now().getEpochSecond());

        log.info("JSESSIONID 쿠키 Max-Age 슬라이딩 갱신: maxAge={}s, sessionId={}",
                ttlSeconds, TokenLogMasking.maskForLog(session.getId()));
        return true;
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

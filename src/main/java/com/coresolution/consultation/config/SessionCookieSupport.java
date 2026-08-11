package com.coresolution.consultation.config;

import jakarta.servlet.http.HttpServletRequest;

import org.springframework.core.env.Environment;
import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import com.coresolution.consultation.constant.SessionConstants;

/**
 * JSESSIONID {@code Set-Cookie} 속성 SSOT.
 *
 * <p>{@link SessionCookieRenewalFilter} 슬라이딩 갱신과 OAuth/수동 로그인 초기 발급이
 * Domain / HttpOnly / SameSite / Secure / Max-Age 를 동일하게 쓰도록 한다.
 * 속성이 어긋나면 브라우저가 갱신 {@code Set-Cookie}를 무시할 수 있다.</p>
 *
 * <p>참조 키: {@code server.servlet.session.cookie.*}, 환경변수 {@code SESSION_COOKIE_DOMAIN}.</p>
 *
 * @author MindGarden
 * @since 2026-08-10
 * @see com.coresolution.core.config.SessionCookieDomainWebServerCustomizer
 * @see SessionCookieRenewalFilter
 */
@Component
public class SessionCookieSupport {

    private final Environment environment;

    /**
     * @param environment Spring Environment ({@code SESSION_COOKIE_DOMAIN}, cookie.* 키)
     */
    public SessionCookieSupport(Environment environment) {
        this.environment = environment;
    }

    /**
     * JSESSIONID {@link ResponseCookie} 를 서버 세션 쿠키 설정과 정합되게 만든다.
     *
     * @param sessionId     세션 ID
     * @param maxAgeSeconds Max-Age (초). {@link SessionTimeoutProperties#getTimeoutSeconds()} 권장
     * @param request       Secure 미설정 시 요청 프로토콜 판단용 (nullable 허용, null이면 Secure=false 폴백)
     * @return ResponseCookie
     */
    public ResponseCookie buildJsessionCookie(String sessionId, int maxAgeSeconds,
                                              HttpServletRequest request) {
        boolean httpOnly = resolveHttpOnly();
        boolean secure = resolveSecure(request);
        String sameSite = resolveSameSite();
        String domain = resolveDomain();

        ResponseCookie.ResponseCookieBuilder builder = ResponseCookie
                .from(SessionConstants.SESSION_COOKIE_NAME, sessionId)
                .path("/")
                .httpOnly(httpOnly)
                .secure(secure)
                .sameSite(sameSite)
                .maxAge(maxAgeSeconds);

        if (StringUtils.hasText(domain)) {
            builder.domain(domain.trim());
        }

        return builder.build();
    }

    /**
     * {@code Set-Cookie} 헤더 값 문자열.
     *
     * @param sessionId     세션 ID
     * @param maxAgeSeconds Max-Age (초)
     * @param request       요청 (Secure 판단)
     * @return Set-Cookie 헤더 값
     */
    public String buildJsessionSetCookieHeader(String sessionId, int maxAgeSeconds,
                                               HttpServletRequest request) {
        return buildJsessionCookie(sessionId, maxAgeSeconds, request).toString();
    }

    /**
     * {@code server.servlet.session.cookie.http-only} (기본 true).
     *
     * @return HttpOnly 여부
     */
    public boolean resolveHttpOnly() {
        return environment.getProperty(
                "server.servlet.session.cookie.http-only", Boolean.class, true);
    }

    /**
     * {@code server.servlet.session.cookie.secure}. 미설정 시 요청 프로토콜.
     *
     * @param request 요청 (nullable)
     * @return Secure 여부
     */
    public boolean resolveSecure(HttpServletRequest request) {
        String secureProp = environment.getProperty("server.servlet.session.cookie.secure");
        if (secureProp != null) {
            return Boolean.parseBoolean(secureProp);
        }
        return request != null && request.isSecure();
    }

    /**
     * {@code server.servlet.session.cookie.same-site} (기본 Lax).
     *
     * @return SameSite 값
     */
    public String resolveSameSite() {
        return environment.getProperty(
                "server.servlet.session.cookie.same-site", "Lax");
    }

    /**
     * {@code SESSION_COOKIE_DOMAIN}. 공백/미설정이면 null (호스트 전용).
     *
     * @return 도메인 또는 null
     * @see com.coresolution.core.config.SessionCookieDomainWebServerCustomizer
     */
    public String resolveDomain() {
        String domain = environment.getProperty("SESSION_COOKIE_DOMAIN");
        if (!StringUtils.hasText(domain)) {
            return null;
        }
        return domain.trim();
    }
}

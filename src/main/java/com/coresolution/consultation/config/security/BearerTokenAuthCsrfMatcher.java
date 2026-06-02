package com.coresolution.consultation.config.security;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpHeaders;
import org.springframework.security.web.util.matcher.RequestMatcher;

/**
 * Bearer 토큰 인증 요청에 대한 CSRF 면제용 {@link RequestMatcher}.
 *
 * <p>OWASP REST 보안 가이드 및 Spring Security 권고에 따라
 * {@code Authorization: Bearer ...} 헤더가 첨부된 요청은
 * <em>stateless</em> 인증이므로 CSRF 보호 대상에서 제외한다.
 *
 * <ul>
 *   <li>모바일/SDK(Expo 등): Bearer 토큰을 첨부하므로 자연스럽게 면제된다.</li>
 *   <li>웹 프론트(세션 쿠키 기반): Bearer 미사용이므로 그대로 CSRF 보호를 받는다.</li>
 * </ul>
 *
 * <p>매칭 규칙(RFC 6750 §2.1, scheme 식별자는 대소문자 구분 없음):
 * <ol>
 *   <li>{@code Authorization} 헤더가 비어있지 않다.</li>
 *   <li>선행 공백을 제거한 헤더 값이 {@code bearer} 로 시작한다(대소문자 무관).</li>
 *   <li>scheme 뒤에 최소 1개 이상의 공백 + 토큰 문자가 존재한다.</li>
 * </ol>
 *
 * @author MindGarden
 * @since 2026-06-02
 */
public final class BearerTokenAuthCsrfMatcher implements RequestMatcher {

    /** RFC 6750 표준 Bearer scheme 식별자 (소문자 비교 전제). */
    private static final String BEARER_SCHEME = "bearer";

    /**
     * 요청이 Bearer 토큰 기반 stateless 인증을 사용하는지 판단한다.
     *
     * @param request HTTP 요청
     * @return {@code Authorization} 헤더가 Bearer 토큰을 포함하면 true, 그 외 false
     */
    @Override
    public boolean matches(HttpServletRequest request) {
        if (request == null) {
            return false;
        }
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null) {
            return false;
        }
        String trimmed = header.stripLeading();
        if (trimmed.length() <= BEARER_SCHEME.length()) {
            return false;
        }
        String schemePrefix = trimmed.substring(0, BEARER_SCHEME.length());
        if (!schemePrefix.equalsIgnoreCase(BEARER_SCHEME)) {
            return false;
        }
        // scheme 뒤에는 RFC 7235에 따라 최소 1개의 공백(SP)이 와야 한다.
        char separator = trimmed.charAt(BEARER_SCHEME.length());
        if (separator != ' ' && separator != '\t') {
            return false;
        }
        String token = trimmed.substring(BEARER_SCHEME.length() + 1).strip();
        return !token.isEmpty();
    }
}

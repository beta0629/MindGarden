package com.coresolution.consultation.config;

import java.io.IOException;
import java.util.regex.Pattern;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;
import lombok.extern.slf4j.Slf4j;

/**
 * XSS 방지 필터
 * HTML 태그 및 스크립트 태그 제거
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
@Order(2)
public class XssFilter implements Filter {

    /**
     * OAuth 콜백/authorize 경로에서는 {@link XssRequestWrapper} 적용을 건너뛴다.
     *
     * <p>이유: {@link #sanitizeXss(String)} 의 HTML 엔티티 이스케이프가
     * Google authorization code (예: {@code 4/0Adk...}) 의 슬래시(/) 를
     * {@code &#x2F;} 로 치환하면 Google {@code /token} 이
     * {@code "Malformed auth code."} 로 거부한다.
     * (디버거 9067073e 확정 — PR #204 server-side auth-code 흐름 도입 이후 회귀)</p>
     *
     * <p>XSS 본질 가드(스크립트/이벤트 핸들러 등 정규식 차단)는 다른 모든 경로에서 그대로 유지된다.
     * OAuth provider 가 응답하는 {@code code} / {@code state} 는 본질적으로 사용자 입력이 아니며
     * 후속 처리(컨트롤러)에서 검증·소비된다.</p>
     *
     * <p>매칭 예:
     * <ul>
     *   <li>{@code /api/v1/auth/google/callback}, {@code /api/auth/google/callback}</li>
     *   <li>{@code /api/v1/auth/kakao/callback}, {@code /api/v1/auth/naver/callback}</li>
     *   <li>{@code /api/v1/auth/oauth/apple/callback}</li>
     *   <li>{@code /api/v1/auth/oauth2/google/authorize} 등 각 provider authorize</li>
     *   <li>{@code /api/v1/auth/oauth2/callback} (프론트 공통 콜백)</li>
     * </ul></p>
     */
    private static final Pattern OAUTH_BYPASS_PATH_PATTERN =
            Pattern.compile("^/api/(v1/)?auth/.*/(callback|authorize)$");

    // XSS 공격 패턴
    private static final Pattern[] XSS_PATTERNS = {
        Pattern.compile("<script[^>]*>.*?</script>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<iframe[^>]*>.*?</iframe>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<object[^>]*>.*?</object>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<embed[^>]*>.*?</embed>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<link[^>]*>.*?</link>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<meta[^>]*>.*?</meta>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("<style[^>]*>.*?</style>", Pattern.CASE_INSENSITIVE),
        Pattern.compile("javascript:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("vbscript:", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onload\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onerror\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onclick\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onmouseover\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onfocus\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onblur\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onchange\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onsubmit\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onreset\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onselect\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onkeydown\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onkeyup\\s*=", Pattern.CASE_INSENSITIVE),
        Pattern.compile("onkeypress\\s*=", Pattern.CASE_INSENSITIVE)
    };

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("XSS 방지 필터 초기화 완료");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        String requestUri = httpRequest.getRequestURI();

        // OAuth 콜백/authorize 경로는 sanitize 우회 (OAUTH_BYPASS_PATH_PATTERN JavaDoc 참고).
        // Google authorization code 의 슬래시(/) 가 &#x2F; 로 변형되어
        // "Malformed auth code." 로 거부되던 P0 회귀 방지.
        if (requestUri != null && OAUTH_BYPASS_PATH_PATTERN.matcher(requestUri).matches()) {
            if (log.isDebugEnabled()) {
                log.debug("XSS 필터 우회 - OAuth 콜백/authorize 경로: {}", requestUri);
            }
            chain.doFilter(request, response);
            return;
        }

        // XSS 필터링된 요청 래퍼 생성
        XssRequestWrapper wrappedRequest = new XssRequestWrapper(httpRequest);

        chain.doFilter(wrappedRequest, response);
    }

    /**
     * XSS 필터링된 요청 래퍼
     */
    public static class XssRequestWrapper extends HttpServletRequestWrapper {

        public XssRequestWrapper(HttpServletRequest request) {
            super(request);
        }

        @Override
        public String getParameter(String name) {
            String value = super.getParameter(name);
            return sanitizeXss(value);
        }

        @Override
        public String[] getParameterValues(String name) {
            String[] values = super.getParameterValues(name);
            if (values != null) {
                for (int i = 0; i < values.length; i++) {
                    values[i] = sanitizeXss(values[i]);
                }
            }
            return values;
        }

        @Override
        public String getHeader(String name) {
            String value = super.getHeader(name);
            return sanitizeXss(value);
        }
    }

    /**
     * XSS 공격 패턴 제거
     */
    public static String sanitizeXss(String value) {
        if (value == null || value.trim().isEmpty()) {
            return value;
        }

        String sanitized = value;
        
        // XSS 패턴 제거
        for (Pattern pattern : XSS_PATTERNS) {
            sanitized = pattern.matcher(sanitized).replaceAll("");
        }
        
        // HTML 엔티티 이스케이프
        sanitized = sanitized.replace("&", "&amp;")
                           .replace("<", "&lt;")
                           .replace(">", "&gt;")
                           .replace("\"", "&quot;")
                           .replace("'", "&#x27;")
                           .replace("/", "&#x2F;");

        // XSS 공격이 감지된 경우 로그 기록
        if (!value.equals(sanitized)) {
            log.warn("XSS 공격 시도 감지 및 차단: 원본='{}', 필터링='{}'", value, sanitized);
        }

        return sanitized;
    }

    @Override
    public void destroy() {
        log.info("XSS 방지 필터 종료");
    }
}

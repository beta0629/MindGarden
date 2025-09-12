package com.mindgarden.consultation.config;

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

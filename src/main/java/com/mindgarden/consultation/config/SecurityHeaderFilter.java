package com.mindgarden.consultation.config;

import java.io.IOException;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * 보안 헤더 필터
 * XSS, Clickjacking, MIME 타입 스니핑 등 공격 방지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityHeaderFilter implements Filter {

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("보안 헤더 필터 초기화 완료");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // 보안 헤더 설정
        setSecurityHeaders(httpResponse);
        
        chain.doFilter(request, response);
    }

    /**
     * 보안 헤더 설정
     */
    private void setSecurityHeaders(HttpServletResponse response) {
        // X-Frame-Options: Clickjacking 방지
        response.setHeader("X-Frame-Options", "DENY");
        
        // X-Content-Type-Options: MIME 타입 스니핑 방지
        response.setHeader("X-Content-Type-Options", "nosniff");
        
        // X-XSS-Protection: XSS 필터 활성화
        response.setHeader("X-XSS-Protection", "1; mode=block");
        
        // Referrer-Policy: 리퍼러 정보 제한
        response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
        
        // Permissions-Policy: 브라우저 기능 제한
        response.setHeader("Permissions-Policy", 
            "geolocation=(), microphone=(), camera=(), payment=(), usb=(), magnetometer=(), gyroscope=(), speaker=()");
        
        // Strict-Transport-Security: HTTPS 강제 (HTTPS 환경에서만)
        if (isHttpsRequest()) {
            response.setHeader("Strict-Transport-Security", 
                "max-age=31536000; includeSubDomains; preload");
        }
        
        // Content-Security-Policy: XSS 및 데이터 인젝션 공격 방지 (정적 파일 허용)
        response.setHeader("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' data:; " +
            "style-src 'self' 'unsafe-inline' data: blob:; " +
            "img-src 'self' data: https: blob:; " +
            "font-src 'self' data: https:; " +
            "connect-src 'self' https: wss:; " +
            "media-src 'self' data: blob:; " +
            "object-src 'none'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'");
        
        // Cache-Control: 민감한 정보 캐싱 방지
        if (isSensitiveEndpoint()) {
            response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
            response.setHeader("Pragma", "no-cache");
            response.setHeader("Expires", "0");
        }
    }

    /**
     * HTTPS 요청 여부 확인
     */
    private boolean isHttpsRequest() {
        // 실제 구현에서는 request 객체를 통해 확인
        return false; // 로컬 개발 환경에서는 false
    }

    /**
     * 민감한 엔드포인트 여부 확인
     */
    private boolean isSensitiveEndpoint() {
        // 실제 구현에서는 request URI를 통해 확인
        return false;
    }

    @Override
    public void destroy() {
        log.info("보안 헤더 필터 종료");
    }
}

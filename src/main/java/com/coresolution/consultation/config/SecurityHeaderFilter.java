package com.coresolution.consultation.config;

import java.io.IOException;
import java.util.List;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.FilterConfig;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
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

    private static final String HEADER_CACHE_CONTROL = "Cache-Control";
    private static final String HEADER_PRAGMA = "Pragma";
    private static final String HEADER_EXPIRES = "Expires";
    private static final String CACHE_CONTROL_NO_STORE =
            "no-store, no-cache, must-revalidate, private";
    private static final String PRAGMA_NO_CACHE = "no-cache";
    private static final String EXPIRES_IMMEDIATELY = "0";

    /**
     * {@code no-store} 를 강제할 요청 경로 조각 (임상 기록 본문 응답).
     *
     * <p>호스트·테넌트가 아닌 API 경로 조각만 둔다. 새 상담일지 계열 경로를 추가할 때 함께 등록한다.</p>
     */
    private static final List<String> NO_STORE_PATH_FRAGMENTS = List.of(
            "/consultation-records",
            "/consultation-messages",
            "/clinical-automation",
            "/clinical-reports",
            "/emotion-analysis",
            "/psych-assessments");

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("보안 헤더 필터 초기화 완료");
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        // 보안 헤더 설정
        setSecurityHeaders(httpResponse, resolveRequestPath(request));
        
        chain.doFilter(request, response);
    }

    /**
     * 보안 헤더 설정
     *
     * @param response    응답
     * @param requestPath 요청 경로 (민감 엔드포인트 판정용. null 허용)
     */
    private void setSecurityHeaders(HttpServletResponse response, String requestPath) {
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
        // 토스페이먼츠 SDK 허용: https://js.tosspayments.com
        response.setHeader("Content-Security-Policy", 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: https://js.tosspayments.com; " +
            "style-src 'self' 'unsafe-inline' data: blob:; " +
            "img-src 'self' data: https: blob:; " +
            "font-src 'self' data: https:; " +
            "connect-src 'self' https: wss: https://api.tosspayments.com; " +
            "media-src 'self' data: blob:; " +
            "object-src 'none'; " +
            "frame-ancestors 'none'; " +
            "base-uri 'self'; " +
            "form-action 'self'");
        
        // Cache-Control: 민감한 정보 캐싱 방지
        if (isSensitiveEndpoint(requestPath)) {
            response.setHeader(HEADER_CACHE_CONTROL, CACHE_CONTROL_NO_STORE);
            response.setHeader(HEADER_PRAGMA, PRAGMA_NO_CACHE);
            response.setHeader(HEADER_EXPIRES, EXPIRES_IMMEDIATELY);
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
     * 요청 경로 추출. {@link HttpServletRequest} 가 아니면 null.
     *
     * @param request 서블릿 요청
     * @return 요청 경로 또는 null
     */
    private static String resolveRequestPath(ServletRequest request) {
        if (request instanceof HttpServletRequest httpRequest) {
            return httpRequest.getRequestURI();
        }
        return null;
    }

    /**
     * 민감한(브라우저·프록시 캐싱 금지) 엔드포인트 여부.
     *
     * <p>상담일지 본문·초안·임상 리포트·심리검사 문서 등 임상 기록을 돌려주는 경로는
     * 디스크 캐시·뒤로가기 캐시에 남지 않도록 {@code no-store} 를 강제한다.</p>
     *
     * @param requestPath 요청 경로 (null 허용)
     * @return 민감 엔드포인트면 true
     */
    private static boolean isSensitiveEndpoint(String requestPath) {
        if (requestPath == null || requestPath.isEmpty()) {
            return false;
        }
        for (String prefix : NO_STORE_PATH_FRAGMENTS) {
            if (requestPath.contains(prefix)) {
                return true;
            }
        }
        return false;
    }

    @Override
    public void destroy() {
        log.info("보안 헤더 필터 종료");
    }
}

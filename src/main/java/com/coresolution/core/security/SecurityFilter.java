package com.coresolution.core.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import jakarta.servlet.*;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * 보안 필터
 * 모든 HTTP 요청에 대해 보안 검사를 수행하는 필터
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class SecurityFilter implements Filter {

    private final SecurityAuditService securityAuditService;

    // 보안 검사에서 제외할 경로
    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
        "/api/health",
        "/api/actuator",
        "/css/",
        "/js/",
        "/images/",
        "/favicon.ico",
        "/robots.txt"
    );

    // 보안 헤더
    private static final String HEADER_X_FRAME_OPTIONS = "X-Frame-Options";
    private static final String HEADER_X_CONTENT_TYPE_OPTIONS = "X-Content-Type-Options";
    private static final String HEADER_X_XSS_PROTECTION = "X-XSS-Protection";
    private static final String HEADER_STRICT_TRANSPORT_SECURITY = "Strict-Transport-Security";
    private static final String HEADER_CONTENT_SECURITY_POLICY = "Content-Security-Policy";
    private static final String HEADER_REFERRER_POLICY = "Referrer-Policy";

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {

        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        try {
            // 1. 보안 헤더 설정
            setSecurityHeaders(httpResponse);

            // 2. 경로 확인 - 제외 경로인지 검사
            String requestURI = httpRequest.getRequestURI();
            if (isExcludedPath(requestURI)) {
                chain.doFilter(request, response);
                return;
            }

            // 3. 보안 검사 수행
            SecurityCheckResult securityResult = securityAuditService.performSecurityCheck(httpRequest);

            // 4. 위협이 감지된 경우 처리
            if (securityResult.hasThreats()) {
                handleSecurityThreats(httpRequest, httpResponse, securityResult);
                
                // 차단 대상인 경우 요청 중단
                if (securityResult.isBlocked()) {
                    sendSecurityErrorResponse(httpResponse, securityResult);
                    return;
                }
            }

            // 5. 정상 요청 처리 계속
            chain.doFilter(request, response);

        } catch (Exception e) {
            log.error("보안 필터 처리 중 오류 발생", e);
            // 보안 필터 오류가 발생해도 요청은 계속 처리
            chain.doFilter(request, response);
        }
    }

    /**
     * 보안 헤더 설정
     */
    private void setSecurityHeaders(HttpServletResponse response) {
        // Clickjacking 방지
        response.setHeader(HEADER_X_FRAME_OPTIONS, "DENY");
        
        // MIME 타입 스니핑 방지
        response.setHeader(HEADER_X_CONTENT_TYPE_OPTIONS, "nosniff");
        
        // XSS 보호
        response.setHeader(HEADER_X_XSS_PROTECTION, "1; mode=block");
        
        // HTTPS 강제 (프로덕션 환경에서만)
        if (isProductionEnvironment()) {
            response.setHeader(HEADER_STRICT_TRANSPORT_SECURITY, "max-age=31536000; includeSubDomains");
        }
        
        // Content Security Policy
        response.setHeader(HEADER_CONTENT_SECURITY_POLICY, 
            "default-src 'self'; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; " +
            "style-src 'self' 'unsafe-inline'; " +
            "img-src 'self' data: https:; " +
            "font-src 'self' https:; " +
            "connect-src 'self'; " +
            "frame-ancestors 'none'");
        
        // Referrer Policy
        response.setHeader(HEADER_REFERRER_POLICY, "strict-origin-when-cross-origin");
    }

    /**
     * 제외 경로 확인
     */
    private boolean isExcludedPath(String requestURI) {
        return EXCLUDED_PATHS.stream().anyMatch(requestURI::startsWith);
    }

    /**
     * 보안 위협 처리
     */
    private void handleSecurityThreats(HttpServletRequest request, HttpServletResponse response, 
                                     SecurityCheckResult securityResult) {
        
        String clientIP = getClientIP(request);
        String userAgent = request.getHeader("User-Agent");
        
        // 각 위협에 대해 적절한 보안 이벤트 기록
        for (SecurityThreatType threat : securityResult.getThreats()) {
            SecurityEventType eventType = mapThreatToEvent(threat);
            securityAuditService.recordSecurityEvent(eventType, clientIP, userAgent, 
                "위협 감지: " + threat.getDisplayName() + " in " + request.getRequestURI());
        }

        // 긴급 대응이 필요한 경우
        if (securityResult.requiresImmediateAction()) {
            log.error("🚨 긴급 보안 위협 감지: {} | IP: {} | URI: {}", 
                securityResult.getThreatSummary(), clientIP, request.getRequestURI());
        }
    }

    /**
     * 보안 오류 응답 전송
     */
    private void sendSecurityErrorResponse(HttpServletResponse response, SecurityCheckResult securityResult) 
            throws IOException {
        
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        
        String jsonResponse = String.format(
            "{\"error\":\"Security Violation\",\"message\":\"%s\",\"blocked\":true,\"timestamp\":\"%s\"}",
            securityResult.getBlockReason(),
            securityResult.getTimestamp()
        );
        
        response.getWriter().write(jsonResponse);
        response.getWriter().flush();
    }

    /**
     * 위협 타입을 보안 이벤트 타입으로 매핑
     */
    private SecurityEventType mapThreatToEvent(SecurityThreatType threat) {
        return switch (threat) {
            case SQL_INJECTION -> SecurityEventType.SQL_INJECTION_ATTEMPT;
            case XSS -> SecurityEventType.XSS_ATTEMPT;
            case CSRF -> SecurityEventType.CSRF_ATTEMPT;
            case PATH_TRAVERSAL -> SecurityEventType.PATH_TRAVERSAL_ATTEMPT;
            case BRUTE_FORCE -> SecurityEventType.BRUTE_FORCE_ATTACK;
            case SESSION_HIJACKING -> SecurityEventType.SESSION_HIJACK_ATTEMPT;
            case PRIVILEGE_ESCALATION -> SecurityEventType.PRIVILEGE_ESCALATION_ATTEMPT;
            case MALICIOUS_FILE -> SecurityEventType.MALICIOUS_FILE_UPLOAD;
            case SUSPICIOUS_IP -> SecurityEventType.SUSPICIOUS_ACTIVITY;
            case ABNORMAL_PATTERN -> SecurityEventType.ABNORMAL_REQUEST_PATTERN;
            case RATE_LIMIT_ABUSE -> SecurityEventType.RATE_LIMIT_EXCEEDED;
            case VULNERABILITY_EXPLOIT -> SecurityEventType.VULNERABILITY_EXPLOIT_ATTEMPT;
            default -> SecurityEventType.SUSPICIOUS_ACTIVITY;
        };
    }

    /**
     * 클라이언트 IP 추출
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        
        String xRealIP = request.getHeader("X-Real-IP");
        if (xRealIP != null && !xRealIP.isEmpty()) {
            return xRealIP;
        }
        
        return request.getRemoteAddr();
    }

    /**
     * 프로덕션 환경 확인
     */
    private boolean isProductionEnvironment() {
        String profile = System.getProperty("spring.profiles.active", "dev");
        return "prod".equals(profile) || "production".equals(profile);
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("🔒 보안 필터 초기화 완료");
    }

    @Override
    public void destroy() {
        log.info("🔒 보안 필터 종료");
    }
}

package com.mindgarden.consultation.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.lang.NonNull;

import java.io.IOException;
import java.util.regex.Pattern;

/**
 * 입력 데이터 검증 설정 클래스
 * XSS, SQL Injection, 기타 보안 위협 방지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Configuration
public class InputValidationConfig {

    /**
     * 입력 검증 필터 Bean
     */
    @Bean
    public InputValidationFilter inputValidationFilter() {
        return new InputValidationFilter();
    }

    /**
     * 입력 검증 필터 구현
     */
    @Slf4j
    public static class InputValidationFilter extends OncePerRequestFilter {

        // SQL Injection 패턴들
        private static final Pattern[] SQL_INJECTION_PATTERNS = {
            Pattern.compile("(?i).*union.*select.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*drop.*table.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*delete.*from.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*insert.*into.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*update.*set.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*or.*1=1.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*and.*1=1.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*'.*or.*'.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*'.*and.*'.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*;.*--.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*;.*#.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*xp_.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*sp_.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*exec.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?i).*execute.*", Pattern.CASE_INSENSITIVE)
        };

        // XSS 패턴들
        private static final Pattern[] XSS_PATTERNS = {
            Pattern.compile(".*<script.*>.*</script>.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*javascript:.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*onload.*=.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*onerror.*=.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*onclick.*=.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*<iframe.*>.*</iframe>.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*<object.*>.*</object>.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*<embed.*>.*</embed>.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*<form.*>.*</form>.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*<input.*>.*", Pattern.CASE_INSENSITIVE)
        };

        // 경로 순회 공격 패턴들
        private static final Pattern[] PATH_TRAVERSAL_PATTERNS = {
            Pattern.compile(".*\\.\\..*"),
            Pattern.compile(".*%2e%2e.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*%252e%252e.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*\\.\\.%2f.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*%2f%2e%2e.*", Pattern.CASE_INSENSITIVE)
        };

        // 명령어 주입 패턴들
        private static final Pattern[] COMMAND_INJECTION_PATTERNS = {
            Pattern.compile(".*;.*ls.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*;.*cat.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*;.*rm.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*;.*wget.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*;.*curl.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*\\|.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*&&.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*\\|\\|.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*`.*`.*", Pattern.CASE_INSENSITIVE),
            Pattern.compile(".*\\$\\{.*\\}.*", Pattern.CASE_INSENSITIVE)
        };

        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                      @NonNull HttpServletResponse response, 
                                      @NonNull FilterChain filterChain) throws ServletException, IOException {
            
            String requestPath = request.getRequestURI();
            String queryString = request.getQueryString();
            String clientIp = getClientIpAddress(request);
            
            // 입력 검증이 필요한 경로들
            if (shouldValidate(requestPath)) {
                
                // SQL Injection 검사
                if (isSqlInjectionAttempt(requestPath, queryString)) {
                    logSecurityThreat("SQL_INJECTION", request, clientIp, "SQL Injection 시도 감지");
                    sendSecurityErrorResponse(response, "잘못된 요청입니다.");
                    return;
                }
                
                // XSS 검사
                if (isXssAttempt(requestPath, queryString)) {
                    logSecurityThreat("XSS", request, clientIp, "XSS 공격 시도 감지");
                    sendSecurityErrorResponse(response, "잘못된 요청입니다.");
                    return;
                }
                
                // 경로 순회 공격 검사
                if (isPathTraversalAttempt(requestPath)) {
                    logSecurityThreat("PATH_TRAVERSAL", request, clientIp, "경로 순회 공격 시도 감지");
                    sendSecurityErrorResponse(response, "잘못된 요청입니다.");
                    return;
                }
                
                // 명령어 주입 검사
                if (isCommandInjectionAttempt(requestPath, queryString)) {
                    logSecurityThreat("COMMAND_INJECTION", request, clientIp, "명령어 주입 시도 감지");
                    sendSecurityErrorResponse(response, "잘못된 요청입니다.");
                    return;
                }
            }
            
            filterChain.doFilter(request, response);
        }

        /**
         * 입력 검증이 필요한 경로인지 확인
         */
        private boolean shouldValidate(String requestPath) {
            return requestPath.startsWith("/api/") ||
                   requestPath.startsWith("/oauth2/") ||
                   requestPath.contains("?") ||
                   requestPath.contains("=");
        }

        /**
         * SQL Injection 시도 검사
         */
        private boolean isSqlInjectionAttempt(String requestPath, String queryString) {
            String fullPath = requestPath + (queryString != null ? "?" + queryString : "");
            
            for (Pattern pattern : SQL_INJECTION_PATTERNS) {
                if (pattern.matcher(fullPath).matches()) {
                    return true;
                }
            }
            return false;
        }

        /**
         * XSS 공격 시도 검사
         */
        private boolean isXssAttempt(String requestPath, String queryString) {
            String fullPath = requestPath + (queryString != null ? "?" + queryString : "");
            
            for (Pattern pattern : XSS_PATTERNS) {
                if (pattern.matcher(fullPath).matches()) {
                    return true;
                }
            }
            return false;
        }

        /**
         * 경로 순회 공격 시도 검사
         */
        private boolean isPathTraversalAttempt(String requestPath) {
            for (Pattern pattern : PATH_TRAVERSAL_PATTERNS) {
                if (pattern.matcher(requestPath).matches()) {
                    return true;
                }
            }
            return false;
        }

        /**
         * 명령어 주입 시도 검사
         */
        private boolean isCommandInjectionAttempt(String requestPath, String queryString) {
            String fullPath = requestPath + (queryString != null ? "?" + queryString : "");
            
            for (Pattern pattern : COMMAND_INJECTION_PATTERNS) {
                if (pattern.matcher(fullPath).matches()) {
                    return true;
                }
            }
            return false;
        }

        /**
         * 보안 위협 로깅
         */
        private void logSecurityThreat(String threatType, HttpServletRequest request, String clientIp, String message) {
            log.warn("🚨 SECURITY_THREAT [{}] - IP: {}, Path: {}, Query: {}, Message: {}", 
                threatType, clientIp, request.getRequestURI(), request.getQueryString(), message);
        }

        /**
         * 보안 오류 응답 전송
         */
        private void sendSecurityErrorResponse(HttpServletResponse response, String message) throws IOException {
            response.setStatus(HttpServletResponse.SC_BAD_REQUEST);
            response.setContentType("application/json;charset=UTF-8");
            
            String errorResponse = String.format(
                "{\"success\":false,\"message\":\"%s\",\"timestamp\":%d,\"status\":400}",
                message, System.currentTimeMillis()
            );
            
            response.getWriter().write(errorResponse);
        }

        /**
         * 클라이언트 IP 주소 추출
         */
        private String getClientIpAddress(HttpServletRequest request) {
            String xForwardedFor = request.getHeader("X-Forwarded-For");
            if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                return xForwardedFor.split(",")[0].trim();
            }
            
            String xRealIp = request.getHeader("X-Real-IP");
            if (xRealIp != null && !xRealIp.isEmpty()) {
                return xRealIp;
            }
            
            return request.getRemoteAddr();
        }
    }
}

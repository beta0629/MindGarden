package com.coresolution.consultation.config;

import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import com.coresolution.consultation.service.SecurityAlertService;
import com.coresolution.core.util.HttpRequestClientIp;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;

/**
 * 보안 감사 로깅 설정 클래스
 * 권한 변경, 민감한 작업, 보안 이벤트 추적
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2025-01-17
 */
@Configuration
public class AuditLoggingConfig {

    @Autowired
    private SecurityAlertService securityAlertService;

    /**
     * 감사 로깅 필터 Bean
     */
    @Bean
    public AuditLoggingFilter auditLoggingFilter() {
        return new AuditLoggingFilter(securityAlertService);
    }

    /**
     * 감사 로깅 필터 구현
     */
    @Slf4j
    public static class AuditLoggingFilter extends OncePerRequestFilter {

        private final ObjectMapper objectMapper = new ObjectMapper();
        private final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        private final SecurityAlertService securityAlertService;
        
        public AuditLoggingFilter(SecurityAlertService securityAlertService) {
            this.securityAlertService = securityAlertService;
        }

        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                      @NonNull HttpServletResponse response, 
                                      @NonNull FilterChain filterChain) throws ServletException, IOException {
            
            String requestPath = request.getRequestURI();
            String clientIp = getClientIpAddress(request);
            String userAgent = request.getHeader("User-Agent");
            
            // 감사 로깅이 필요한 경로들
            if (shouldAudit(requestPath)) {
                long startTime = System.currentTimeMillis();
                
                try {
                    filterChain.doFilter(request, response);
                    
                    // 성공적인 요청 로깅
                    long duration = System.currentTimeMillis() - startTime;
                    logAuditEvent("SUCCESS", request, response, clientIp, userAgent, duration, null);
                    
                } catch (Exception e) {
                    // 실패한 요청 로깅
                    long duration = System.currentTimeMillis() - startTime;
                    logAuditEvent("ERROR", request, response, clientIp, userAgent, duration, e.getMessage());
                    throw e;
                }
            } else {
                filterChain.doFilter(request, response);
            }
        }

        /**
         * 감사 로깅이 필요한 경로인지 확인
         */
        private boolean shouldAudit(String requestPath) {
            return requestPath.startsWith("/api/auth/") ||
                   requestPath.startsWith("/api/users/") ||
                   requestPath.startsWith("/api/admin/") ||
                   requestPath.startsWith("/api/hq/") ||
                   requestPath.startsWith("/api/erp/") ||
                   requestPath.startsWith("/api/consultations/") ||
                   requestPath.startsWith("/api/payments/") ||
                   requestPath.startsWith("/oauth2/");
        }

        /**
         * 감사 이벤트 로깅
         */
        private void logAuditEvent(String eventType, HttpServletRequest request, 
                                 HttpServletResponse response, String clientIp, 
                                 String userAgent, long duration, String errorMessage) {
            
            try {
                Map<String, Object> auditData = new HashMap<>();
                auditData.put("timestamp", LocalDateTime.now().format(formatter));
                auditData.put("eventType", eventType);
                auditData.put("method", request.getMethod());
                auditData.put("path", request.getRequestURI());
                auditData.put("queryString", request.getQueryString());
                auditData.put("clientIp", clientIp);
                auditData.put("userAgent", userAgent);
                auditData.put("responseStatus", response.getStatus());
                auditData.put("duration", duration + "ms");
                
                // 사용자 정보 (세션에서 추출)
                String userId = getUserIdFromSession(request);
                if (userId != null) {
                    auditData.put("userId", userId);
                }
                
                // 에러 메시지
                if (errorMessage != null) {
                    auditData.put("error", errorMessage);
                }
                
                // 민감한 데이터 마스킹
                auditData.put("requestBody", maskSensitiveData(request));
                
                // 보안 이벤트 분류
                String securityLevel = classifySecurityEvent(request.getRequestURI(), response.getStatus());
                auditData.put("securityLevel", securityLevel);
                
                // JSON 형태로 로깅
                String auditJson = objectMapper.writeValueAsString(auditData);
                
                // 보안 레벨에 따른 로깅
                switch (securityLevel) {
                    case "HIGH":
                        log.warn("🔒 SECURITY_AUDIT_HIGH: {}", auditJson);
                        // HIGH 레벨 이벤트는 보안 알림 발송
                        if (securityAlertService != null) {
                            securityAlertService.sendSecurityAlert(
                                "SECURITY_AUDIT_HIGH",
                                "HIGH",
                                auditData
                            );
                        }
                        break;
                    case "MEDIUM":
                        log.info("🔍 SECURITY_AUDIT_MEDIUM: {}", auditJson);
                        break;
                    case "LOW":
                        log.debug("📝 SECURITY_AUDIT_LOW: {}", auditJson);
                        break;
                    default:
                        log.info("📋 SECURITY_AUDIT: {}", auditJson);
                }
                
                // 인증 실패 이벤트 감지
                String requestPath = request.getRequestURI();
                if (requestPath.contains("/auth/login") && response.getStatus() == 401) {
                    String email = extractEmailFromRequest(request);
                    if (email != null && securityAlertService != null) {
                        // 로그인 실패 알림 (실제 실패 횟수는 별도로 추적 필요)
                        securityAlertService.sendLoginFailureAlert(
                            email,
                            clientIp,
                            1 // 실제로는 실패 횟수를 추적해야 함
                        );
                    }
                }
                
                // 권한 없음 이벤트 감지
                if (response.getStatus() == 403 && securityAlertService != null) {
                    String targetUserId = userId; // 이미 위에서 추출한 userId 사용
                    if (targetUserId != null) {
                        securityAlertService.sendUnauthorizedAccessAlert(
                            Long.parseLong(targetUserId),
                            requestPath,
                            clientIp
                        );
                    }
                }
                
            } catch (Exception e) {
                log.error("❌ 감사 로깅 중 오류 발생: {}", e.getMessage(), e);
            }
        }

        /**
         * 보안 이벤트 분류
         */
        private String classifySecurityEvent(String requestPath, int responseStatus) {
            // 인증 관련
            if (requestPath.contains("/auth/login") || requestPath.contains("/auth/logout")) {
                return responseStatus >= 400 ? "HIGH" : "MEDIUM";
            }
            
            // 권한 관련
            if (requestPath.contains("/admin/") || requestPath.contains("/hq/")) {
                return responseStatus >= 400 ? "HIGH" : "MEDIUM";
            }
            
            // 결제 관련
            if (requestPath.contains("/payments/")) {
                return "HIGH";
            }
            
            // 사용자 관리
            if (requestPath.contains("/users/")) {
                return responseStatus >= 400 ? "HIGH" : "MEDIUM";
            }
            
            // ERP 데이터
            if (requestPath.contains("/erp/")) {
                return responseStatus >= 400 ? "MEDIUM" : "LOW";
            }
            
            // 일반 API
            return responseStatus >= 400 ? "MEDIUM" : "LOW";
        }

        /**
         * 세션에서 사용자 ID 추출
         */
        private String getUserIdFromSession(HttpServletRequest request) {
            try {
                // 실제 구현에서는 세션에서 사용자 정보를 추출
                Object userId = request.getSession().getAttribute("userId");
                return userId != null ? userId.toString() : null;
            } catch (Exception e) {
                return null;
            }
        }
        
        /**
         * 요청에서 이메일 추출 (로그인 요청의 경우)
         */
        private String extractEmailFromRequest(HttpServletRequest request) {
            try {
                // 로그인 요청의 경우 요청 본문에서 이메일을 추출할 수 있지만
                // 필터에서는 요청 본문을 읽을 수 없으므로 null 반환
                // 실제로는 별도의 로그인 실패 추적 메커니즘이 필요
                return null;
            } catch (Exception e) {
                return null;
            }
        }

        /**
         * 민감한 데이터 마스킹
         */
        private String maskSensitiveData(HttpServletRequest request) {
            try {
                // 실제 구현에서는 요청 본문을 읽어서 민감한 데이터를 마스킹
                // 여기서는 간단히 경로만 반환
                return request.getRequestURI();
            } catch (Exception e) {
                return "MASKED";
            }
        }

        /**
         * 클라이언트 IP 주소 추출
         */
        private String getClientIpAddress(HttpServletRequest request) {
            return HttpRequestClientIp.resolve(request);
        }
    }
}

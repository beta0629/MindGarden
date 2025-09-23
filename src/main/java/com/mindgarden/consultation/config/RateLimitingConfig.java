package com.mindgarden.consultation.config;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.web.filter.OncePerRequestFilter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * Rate Limiting 설정 클래스
 * Brute Force 공격 방지를 위한 API 호출 제한
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Configuration
public class RateLimitingConfig {

    /**
     * Rate Limiting 필터 Bean
     */
    @Bean
    public RateLimitingFilter rateLimitingFilter() {
        return new RateLimitingFilter();
    }

    /**
     * Rate Limiting 필터 구현
     */
    @Slf4j
    public static class RateLimitingFilter extends OncePerRequestFilter {
        
        // IP별 요청 횟수를 저장하는 맵 (간단한 구현)
        private final Map<String, RequestInfo> requestCounts = new ConcurrentHashMap<>();
        
        // RequestInfo 내부 클래스
        private static class RequestInfo {
            private int count;
            private long lastRequestTime;
            
            public RequestInfo() {
                this.count = 1;
                this.lastRequestTime = System.currentTimeMillis();
            }
            
            public void increment() {
                this.count++;
                this.lastRequestTime = System.currentTimeMillis();
            }
            
            public int getCount() { return count; }
            public long getLastRequestTime() { return lastRequestTime; }
        }
        
        // Rate Limiting 설정
        private static final int MAX_REQUESTS_PER_MINUTE = 60;  // 분당 최대 60회
        private static final int MAX_LOGIN_ATTEMPTS = 5;        // 로그인 시도 최대 5회
        private static final long LOGIN_COOLDOWN_MINUTES = 15;  // 로그인 실패 후 15분 대기
        
        @Override
        protected void doFilterInternal(@NonNull HttpServletRequest request, 
                                      @NonNull HttpServletResponse response, 
                                      @NonNull FilterChain filterChain) throws ServletException, IOException {
            
            String clientIp = getClientIpAddress(request);
            String requestPath = request.getRequestURI();
            
            // 오래된 요청 정보 정리 (1분 이상 된 것들)
            cleanupOldRequests();
            
            // Rate Limiting이 적용되는 경로들
            if (shouldApplyRateLimit(requestPath)) {
                if (!isAllowed(clientIp, requestPath)) {
                    handleRateLimitExceeded(response, requestPath);
                    return;
                }
            }
            
            // 요청 카운트 증가
            incrementRequestCount(clientIp, requestPath);
            
            filterChain.doFilter(request, response);
        }
        
        /**
         * Rate Limiting이 적용되어야 하는 경로인지 확인
         */
        private boolean shouldApplyRateLimit(String requestPath) {
            return requestPath.startsWith("/api/auth/login") ||
                   requestPath.startsWith("/api/auth/") ||
                   requestPath.startsWith("/api/") ||
                   requestPath.startsWith("/oauth2/");
        }
        
        /**
         * 요청이 허용되는지 확인
         */
        private boolean isAllowed(String clientIp, String requestPath) {
            // 로그인 시도에 대한 특별한 처리
            if (requestPath.contains("/login")) {
                return isLoginAllowed(clientIp);
            }
            
            // 일반 API 요청에 대한 처리
            return isGeneralApiAllowed(clientIp);
        }
        
        /**
         * 로그인 요청이 허용되는지 확인
         */
        private boolean isLoginAllowed(String clientIp) {
            RequestInfo loginInfo = requestCounts.get(clientIp + "_login");
            
            if (loginInfo == null) {
                return true;
            }
            
            // 최대 시도 횟수 초과
            if (loginInfo.getCount() >= MAX_LOGIN_ATTEMPTS) {
                long timeSinceLastAttempt = System.currentTimeMillis() - loginInfo.getLastRequestTime();
                long cooldownMs = LOGIN_COOLDOWN_MINUTES * 60 * 1000;
                
                // 쿨다운 시간이 지났으면 리셋
                if (timeSinceLastAttempt > cooldownMs) {
                    requestCounts.remove(clientIp + "_login");
                    return true;
                }
                return false;
            }
            
            return true;
        }
        
        /**
         * 일반 API 요청이 허용되는지 확인
         */
        private boolean isGeneralApiAllowed(String clientIp) {
            RequestInfo apiInfo = requestCounts.get(clientIp + "_api");
            return apiInfo == null || apiInfo.getCount() < MAX_REQUESTS_PER_MINUTE;
        }
        
        /**
         * 요청 카운트 증가
         */
        private void incrementRequestCount(String clientIp, String requestPath) {
            if (requestPath.contains("/login")) {
                // 로그인 시도 카운트 증가
                RequestInfo loginInfo = requestCounts.get(clientIp + "_login");
                if (loginInfo == null) {
                    loginInfo = new RequestInfo();
                    requestCounts.put(clientIp + "_login", loginInfo);
                } else {
                    loginInfo.increment();
                }
            } else {
                // 일반 API 요청 카운트 증가
                RequestInfo apiInfo = requestCounts.get(clientIp + "_api");
                if (apiInfo == null) {
                    apiInfo = new RequestInfo();
                    requestCounts.put(clientIp + "_api", apiInfo);
                } else {
                    apiInfo.increment();
                }
            }
        }
        
        /**
         * 오래된 요청 정보 정리
         */
        private void cleanupOldRequests() {
            long currentTime = System.currentTimeMillis();
            long expireTime = 60 * 1000; // 1분
            
            requestCounts.entrySet().removeIf(entry -> {
                return (currentTime - entry.getValue().getLastRequestTime()) > expireTime;
            });
        }
        
        /**
         * Rate Limit 초과 시 처리
         */
        private void handleRateLimitExceeded(HttpServletResponse response, String requestPath) throws IOException {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            
            if (requestPath.contains("/login")) {
                errorResponse.put("message", "로그인 시도 횟수가 초과되었습니다. 15분 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", LOGIN_COOLDOWN_MINUTES * 60); // 초 단위
            } else {
                errorResponse.put("message", "API 호출 횟수가 초과되었습니다. 잠시 후 다시 시도해주세요.");
                errorResponse.put("retryAfter", 60); // 1분
            }
            
            errorResponse.put("timestamp", System.currentTimeMillis());
            errorResponse.put("status", HttpStatus.TOO_MANY_REQUESTS.value());
            
            response.getWriter().write(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(errorResponse));
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

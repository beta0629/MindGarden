package com.mindgarden.consultation.config;

import java.io.IOException;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
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
 * Rate Limiting 필터
 * API 요청 제한 및 DDoS 공격 방지
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
@Order(1)
public class RateLimitingFilter implements Filter {

    // 사용자별 요청 카운터 저장
    private final ConcurrentHashMap<String, ClientRateLimit> rateLimiters = new ConcurrentHashMap<>();
    
    // 기본 Rate Limiting 설정
    private static final int DEFAULT_RATE = 200; // 초당 200 요청 (개발 환경용)
    private static final long WINDOW_SIZE = 1000; // 1초 윈도우
    
    // Rate Limiter 정리 주기 (분)
    private static final long CLEANUP_INTERVAL = 5;
    private static final long MAX_IDLE_TIME = 30; // 30분간 사용하지 않으면 제거

    /**
     * 클라이언트별 Rate Limit 정보
     */
    private static class ClientRateLimit {
        private final AtomicInteger requestCount = new AtomicInteger(0);
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());
        private final AtomicLong lastAccess = new AtomicLong(System.currentTimeMillis());
        
        public boolean tryAcquire() {
            long currentTime = System.currentTimeMillis();
            long windowStartTime = windowStart.get();
            
            // 윈도우가 지났으면 리셋
            if (currentTime - windowStartTime >= WINDOW_SIZE) {
                if (windowStart.compareAndSet(windowStartTime, currentTime)) {
                    requestCount.set(0);
                }
            }
            
            // 요청 카운트 증가
            int currentCount = requestCount.incrementAndGet();
            lastAccess.set(currentTime);
            
            return currentCount <= DEFAULT_RATE;
        }
        
        public long getLastAccess() {
            return lastAccess.get();
        }
    }

    @Override
    public void init(FilterConfig filterConfig) throws ServletException {
        log.info("Rate Limiting 필터 초기화 완료");
        
        // 주기적으로 사용하지 않는 Rate Limiter 정리
        startCleanupTask();
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;
        
        String clientId = getClientIdentifier(httpRequest);
        String requestPath = httpRequest.getRequestURI();
        
        // Rate Limiting 적용 여부 확인
        if (shouldApplyRateLimit(requestPath)) {
            ClientRateLimit rateLimit = getOrCreateRateLimit(clientId);
            
            if (!rateLimit.tryAcquire()) {
                log.warn("Rate limit exceeded for client: {} on path: {}", clientId, requestPath);
                
                httpResponse.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"error\":\"Rate limit exceeded\",\"message\":\"너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.\"}");
                return;
            }
        }
        
        chain.doFilter(request, response);
    }

    /**
     * 클라이언트 식별자 생성
     */
    private String getClientIdentifier(HttpServletRequest request) {
        String clientIp = getClientIpAddress(request);
        String userAgent = request.getHeader("User-Agent");
        
        // IP + User-Agent 조합으로 클라이언트 식별
        return clientIp + ":" + (userAgent != null ? userAgent.hashCode() : "unknown");
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

    /**
     * Rate Limiting 적용 여부 확인
     */
    private boolean shouldApplyRateLimit(String requestPath) {
        // 정적 리소스는 제외
        if (requestPath.startsWith("/static/") || 
            requestPath.startsWith("/css/") || 
            requestPath.startsWith("/js/") || 
            requestPath.startsWith("/images/") ||
            requestPath.startsWith("/favicon.ico")) {
            return false;
        }
        
        // 헬스체크 엔드포인트는 제외
        if (requestPath.equals("/actuator/health") || 
            requestPath.equals("/actuator/info")) {
            return false;
        }
        
        return true;
    }

    /**
     * 클라이언트별 Rate Limit 가져오기 또는 생성
     */
    private ClientRateLimit getOrCreateRateLimit(String clientId) {
        return rateLimiters.computeIfAbsent(clientId, id -> new ClientRateLimit());
    }

    /**
     * 사용하지 않는 Rate Limiter 정리 작업 시작
     */
    private void startCleanupTask() {
        Thread cleanupThread = new Thread(() -> {
            while (true) {
                try {
                    Thread.sleep(CLEANUP_INTERVAL * 60 * 1000); // 분 단위
                    
                    long currentTime = System.currentTimeMillis();
                    rateLimiters.entrySet().removeIf(entry -> {
                        // 30분간 사용하지 않은 Rate Limit 제거
                        return currentTime - entry.getValue().getLastAccess() > MAX_IDLE_TIME * 60 * 1000;
                    });
                    
                    log.debug("Rate Limiter 정리 완료. 현재 활성 클라이언트: {}", rateLimiters.size());
                    
                } catch (InterruptedException e) {
                    log.warn("Rate Limiter 정리 스레드 중단됨");
                    break;
                }
            }
        });
        
        cleanupThread.setDaemon(true);
        cleanupThread.setName("RateLimiter-Cleanup");
        cleanupThread.start();
    }

    @Override
    public void destroy() {
        log.info("Rate Limiting 필터 종료");
        rateLimiters.clear();
    }
}
package com.coresolution.core.interceptor;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * API 성능 모니터링 인터셉터
 * 모든 API 호출의 응답 시간을 측정하고 통계를 수집
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@Component
public class ApiPerformanceInterceptor implements HandlerInterceptor {

    // 요청별 시작 시간 저장
    private static final String START_TIME_ATTRIBUTE = "startTime";
    
    // API 성능 통계 저장
    private final ConcurrentHashMap<String, ApiStats> apiStatsMap = new ConcurrentHashMap<>();
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // 요청 시작 시간 기록
        request.setAttribute(START_TIME_ATTRIBUTE, System.currentTimeMillis());
        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                              Object handler, Exception ex) {
        
        Long startTime = (Long) request.getAttribute(START_TIME_ATTRIBUTE);
        if (startTime != null) {
            long duration = System.currentTimeMillis() - startTime;
            String endpoint = getEndpointKey(request);
            
            // 통계 업데이트
            updateApiStats(endpoint, duration, response.getStatus(), ex != null);
            
            // 느린 API 로깅 (500ms 이상)
            if (duration > 500) {
                log.warn("🐌 느린 API 감지: {} - {}ms (상태: {})", 
                    endpoint, duration, response.getStatus());
            }
            
            // 매우 느린 API 경고 (2초 이상)
            if (duration > 2000) {
                log.error("🚨 매우 느린 API: {} - {}ms (상태: {})", 
                    endpoint, duration, response.getStatus());
            }
        }
    }

    /**
     * 엔드포인트 키 생성
     */
    private String getEndpointKey(HttpServletRequest request) {
        String method = request.getMethod();
        String uri = request.getRequestURI();
        
        // 동적 경로 파라미터 정규화 (예: /api/users/123 -> /api/users/{id})
        uri = normalizePath(uri);
        
        return method + " " + uri;
    }

    /**
     * 경로 정규화 (ID 등 동적 파라미터를 플레이스홀더로 변경)
     */
    private String normalizePath(String path) {
        // 숫자 ID를 {id}로 변경
        path = path.replaceAll("/\\d+", "/{id}");
        
        // UUID 패턴을 {uuid}로 변경
        path = path.replaceAll("/[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}", "/{uuid}");
        
        return path;
    }

    /**
     * API 통계 업데이트
     */
    private void updateApiStats(String endpoint, long duration, int statusCode, boolean hasError) {
        apiStatsMap.compute(endpoint, (key, stats) -> {
            if (stats == null) {
                stats = new ApiStats(endpoint);
            }
            
            stats.recordRequest(duration, statusCode, hasError);
            return stats;
        });
    }

    /**
     * 모든 API 통계 조회
     */
    public ConcurrentHashMap<String, ApiStats> getAllApiStats() {
        return new ConcurrentHashMap<>(apiStatsMap);
    }

    /**
     * 특정 API 통계 조회
     */
    public ApiStats getApiStats(String endpoint) {
        return apiStatsMap.get(endpoint);
    }

    /**
     * 통계 초기화
     */
    public void clearStats() {
        apiStatsMap.clear();
        log.info("✅ API 성능 통계가 초기화되었습니다.");
    }

    /**
     * API 통계 데이터 클래스
     */
    public static class ApiStats {
        private final String endpoint;
        private final AtomicLong totalRequests = new AtomicLong(0);
        private final AtomicLong totalDuration = new AtomicLong(0);
        private final AtomicLong errorCount = new AtomicLong(0);
        private volatile long minDuration = Long.MAX_VALUE;
        private volatile long maxDuration = 0;
        private final ConcurrentHashMap<Integer, AtomicLong> statusCodeCounts = new ConcurrentHashMap<>();

        public ApiStats(String endpoint) {
            this.endpoint = endpoint;
        }

        public void recordRequest(long duration, int statusCode, boolean hasError) {
            totalRequests.incrementAndGet();
            totalDuration.addAndGet(duration);
            
            if (hasError) {
                errorCount.incrementAndGet();
            }
            
            // 최소/최대 응답시간 업데이트
            updateMinDuration(duration);
            updateMaxDuration(duration);
            
            // 상태 코드별 카운트
            statusCodeCounts.computeIfAbsent(statusCode, k -> new AtomicLong(0)).incrementAndGet();
        }

        private synchronized void updateMinDuration(long duration) {
            if (duration < minDuration) {
                minDuration = duration;
            }
        }

        private synchronized void updateMaxDuration(long duration) {
            if (duration > maxDuration) {
                maxDuration = duration;
            }
        }

        // Getters
        public String getEndpoint() { return endpoint; }
        public long getTotalRequests() { return totalRequests.get(); }
        public long getTotalDuration() { return totalDuration.get(); }
        public long getErrorCount() { return errorCount.get(); }
        public long getMinDuration() { return minDuration == Long.MAX_VALUE ? 0 : minDuration; }
        public long getMaxDuration() { return maxDuration; }
        
        public double getAverageDuration() {
            long requests = totalRequests.get();
            return requests > 0 ? (double) totalDuration.get() / requests : 0.0;
        }
        
        public double getErrorRate() {
            long requests = totalRequests.get();
            return requests > 0 ? (double) errorCount.get() / requests * 100 : 0.0;
        }
        
        public ConcurrentHashMap<Integer, AtomicLong> getStatusCodeCounts() {
            return new ConcurrentHashMap<>(statusCodeCounts);
        }
    }
}

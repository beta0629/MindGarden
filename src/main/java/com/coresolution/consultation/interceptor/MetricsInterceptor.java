package com.coresolution.consultation.interceptor;

import com.coresolution.core.util.ApiUriSanitizer;
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * API 응답 시간 모니터링 인터셉터
 * Week 13 Day 2: 런타임 메트릭 수집 구현
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-01-XX
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MetricsInterceptor implements HandlerInterceptor {
    
    private final MeterRegistry meterRegistry;
    
    private static final String METRIC_API_REQUESTS = "api.requests";
    private static final String METRIC_API_DURATION = "api.duration";
    private static final String METRIC_API_ERRORS = "api.errors";
    
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        request.setAttribute("startTime", System.currentTimeMillis());
        return true;
    }
    
    @Override
    public void afterCompletion(
            HttpServletRequest request, 
            HttpServletResponse response, 
            Object handler, 
            Exception ex) {
        
        Long startTime = (Long) request.getAttribute("startTime");
        if (startTime == null) {
            return;
        }
        
        long duration = System.currentTimeMillis() - startTime;
        String method = request.getMethod();
        String uri = request.getRequestURI();
        int status = response.getStatus();
        
        // API 요청 수 카운터
        Counter.builder(METRIC_API_REQUESTS)
                .tag("method", method)
                .tag("uri", ApiUriSanitizer.forMetrics(uri))
                .tag("status", String.valueOf(status))
                .register(meterRegistry)
                .increment();
        
        // API 응답 시간 타이머
        Timer.builder(METRIC_API_DURATION)
                .tag("method", method)
                .tag("uri", ApiUriSanitizer.forMetrics(uri))
                .tag("status", String.valueOf(status))
                .register(meterRegistry)
                .record(duration, java.util.concurrent.TimeUnit.MILLISECONDS);
        
        // 에러 카운터 (4xx, 5xx)
        if (status >= 400) {
            Counter.builder(METRIC_API_ERRORS)
                    .tag("method", method)
                    .tag("uri", ApiUriSanitizer.forMetrics(uri))
                    .tag("status", String.valueOf(status))
                    .register(meterRegistry)
                    .increment();
        }
        
        // 예외 발생 시
        if (ex != null) {
            Counter.builder(METRIC_API_ERRORS)
                    .tag("method", method)
                    .tag("uri", ApiUriSanitizer.forMetrics(uri))
                    .tag("exception", ex.getClass().getSimpleName())
                    .register(meterRegistry)
                    .increment();
        }
    }
}


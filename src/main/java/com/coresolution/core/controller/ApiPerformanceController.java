package com.coresolution.core.controller;

import com.coresolution.core.dto.ApiResponse;
import com.coresolution.core.interceptor.ApiPerformanceInterceptor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

/**
 * API 성능 모니터링 컨트롤러
 * API 응답 시간 및 성능 통계 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/performance", "/api/admin/performance"})
@RequiredArgsConstructor
public class ApiPerformanceController {

    private final ApiPerformanceInterceptor performanceInterceptor;

    /**
     * 모든 API 성능 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllPerformanceStats() {
        log.info("📊 API 성능 통계 조회 요청");
        
        ConcurrentHashMap<String, ApiPerformanceInterceptor.ApiStats> allStats = 
            performanceInterceptor.getAllApiStats();
        
        Map<String, Object> response = new HashMap<>();
        Map<String, Object> apiStats = new HashMap<>();
        
        // 전체 통계 계산
        long totalRequests = 0;
        long totalDuration = 0;
        long totalErrors = 0;
        long slowestRequest = 0;
        String slowestEndpoint = "";
        
        for (Map.Entry<String, ApiPerformanceInterceptor.ApiStats> entry : allStats.entrySet()) {
            String endpoint = entry.getKey();
            ApiPerformanceInterceptor.ApiStats stats = entry.getValue();
            
            // 개별 API 통계
            Map<String, Object> endpointStats = new HashMap<>();
            endpointStats.put("totalRequests", stats.getTotalRequests());
            endpointStats.put("averageDuration", Math.round(stats.getAverageDuration()));
            endpointStats.put("minDuration", stats.getMinDuration());
            endpointStats.put("maxDuration", stats.getMaxDuration());
            endpointStats.put("errorRate", Math.round(stats.getErrorRate() * 100) / 100.0);
            endpointStats.put("statusCodes", stats.getStatusCodeCounts().entrySet().stream()
                .collect(Collectors.toMap(
                    e -> e.getKey().toString(),
                    e -> e.getValue().get()
                )));
            
            apiStats.put(endpoint, endpointStats);
            
            // 전체 통계 누적
            totalRequests += stats.getTotalRequests();
            totalDuration += stats.getTotalDuration();
            totalErrors += stats.getErrorCount();
            
            // 가장 느린 요청 추적
            if (stats.getMaxDuration() > slowestRequest) {
                slowestRequest = stats.getMaxDuration();
                slowestEndpoint = endpoint;
            }
        }
        
        // 전체 요약 통계
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalApiEndpoints", allStats.size());
        summary.put("totalRequests", totalRequests);
        summary.put("averageResponseTime", totalRequests > 0 ? Math.round((double) totalDuration / totalRequests) : 0);
        summary.put("totalErrors", totalErrors);
        summary.put("overallErrorRate", totalRequests > 0 ? Math.round((double) totalErrors / totalRequests * 10000) / 100.0 : 0);
        summary.put("slowestRequest", slowestRequest);
        summary.put("slowestEndpoint", slowestEndpoint);
        
        response.put("summary", summary);
        response.put("endpoints", apiStats);
        
        log.info("✅ API 성능 통계 조회 완료: {} 개 엔드포인트, {} 개 요청", 
            allStats.size(), totalRequests);
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 특정 API 성능 통계 조회
     */
    @GetMapping("/stats/{endpoint}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getEndpointStats(@PathVariable String endpoint) {
        log.info("📊 특정 API 성능 통계 조회: {}", endpoint);
        
        // URL 디코딩 (공백을 + 또는 %20으로 인코딩된 경우 처리)
        endpoint = endpoint.replace("+", " ").replace("%20", " ");
        
        ApiPerformanceInterceptor.ApiStats stats = performanceInterceptor.getApiStats(endpoint);
        
        if (stats == null) {
            return ResponseEntity.ok(ApiResponse.error("해당 엔드포인트의 통계를 찾을 수 없습니다: " + endpoint));
        }
        
        Map<String, Object> response = new HashMap<>();
        response.put("endpoint", stats.getEndpoint());
        response.put("totalRequests", stats.getTotalRequests());
        response.put("averageDuration", Math.round(stats.getAverageDuration()));
        response.put("minDuration", stats.getMinDuration());
        response.put("maxDuration", stats.getMaxDuration());
        response.put("errorCount", stats.getErrorCount());
        response.put("errorRate", Math.round(stats.getErrorRate() * 100) / 100.0);
        response.put("statusCodes", stats.getStatusCodeCounts().entrySet().stream()
            .collect(Collectors.toMap(
                e -> e.getKey().toString(),
                e -> e.getValue().get()
            )));
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 성능 통계 초기화
     */
    @DeleteMapping("/stats")
    public ResponseEntity<ApiResponse<String>> clearPerformanceStats() {
        log.info("🧹 API 성능 통계 초기화 요청");
        
        performanceInterceptor.clearStats();
        
        return ResponseEntity.ok(ApiResponse.success("API 성능 통계가 초기화되었습니다."));
    }

    /**
     * 느린 API 목록 조회 (평균 응답시간 기준)
     */
    @GetMapping("/slow-apis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getSlowApis(
            @RequestParam(defaultValue = "500") long thresholdMs) {
        
        log.info("🐌 느린 API 목록 조회 (임계값: {}ms)", thresholdMs);
        
        ConcurrentHashMap<String, ApiPerformanceInterceptor.ApiStats> allStats = 
            performanceInterceptor.getAllApiStats();
        
        Map<String, Object> slowApis = allStats.entrySet().stream()
            .filter(entry -> entry.getValue().getAverageDuration() > thresholdMs)
            .sorted((e1, e2) -> Double.compare(e2.getValue().getAverageDuration(), e1.getValue().getAverageDuration()))
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> {
                    ApiPerformanceInterceptor.ApiStats stats = entry.getValue();
                    Map<String, Object> apiInfo = new HashMap<>();
                    apiInfo.put("averageDuration", Math.round(stats.getAverageDuration()));
                    apiInfo.put("maxDuration", stats.getMaxDuration());
                    apiInfo.put("totalRequests", stats.getTotalRequests());
                    apiInfo.put("errorRate", Math.round(stats.getErrorRate() * 100) / 100.0);
                    return apiInfo;
                },
                (e1, e2) -> e1,
                java.util.LinkedHashMap::new
            ));
        
        Map<String, Object> response = new HashMap<>();
        response.put("threshold", thresholdMs);
        response.put("slowApiCount", slowApis.size());
        response.put("slowApis", slowApis);
        
        log.info("✅ 느린 API {} 개 발견", slowApis.size());
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    /**
     * 에러율이 높은 API 목록 조회
     */
    @GetMapping("/error-prone-apis")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getErrorProneApis(
            @RequestParam(defaultValue = "5.0") double errorRateThreshold) {
        
        log.info("🚨 에러율 높은 API 목록 조회 (임계값: {}%)", errorRateThreshold);
        
        ConcurrentHashMap<String, ApiPerformanceInterceptor.ApiStats> allStats = 
            performanceInterceptor.getAllApiStats();
        
        Map<String, Object> errorProneApis = allStats.entrySet().stream()
            .filter(entry -> entry.getValue().getErrorRate() > errorRateThreshold && 
                           entry.getValue().getTotalRequests() >= 10) // 최소 10회 이상 호출된 API만
            .sorted((e1, e2) -> Double.compare(e2.getValue().getErrorRate(), e1.getValue().getErrorRate()))
            .collect(Collectors.toMap(
                Map.Entry::getKey,
                entry -> {
                    ApiPerformanceInterceptor.ApiStats stats = entry.getValue();
                    Map<String, Object> apiInfo = new HashMap<>();
                    apiInfo.put("errorRate", Math.round(stats.getErrorRate() * 100) / 100.0);
                    apiInfo.put("errorCount", stats.getErrorCount());
                    apiInfo.put("totalRequests", stats.getTotalRequests());
                    apiInfo.put("averageDuration", Math.round(stats.getAverageDuration()));
                    return apiInfo;
                },
                (e1, e2) -> e1,
                java.util.LinkedHashMap::new
            ));
        
        Map<String, Object> response = new HashMap<>();
        response.put("errorRateThreshold", errorRateThreshold);
        response.put("errorProneApiCount", errorProneApis.size());
        response.put("errorProneApis", errorProneApis);
        
        log.info("✅ 에러율 높은 API {} 개 발견", errorProneApis.size());
        
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}

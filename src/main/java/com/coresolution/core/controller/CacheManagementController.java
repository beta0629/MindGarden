package com.coresolution.core.controller;

import com.coresolution.core.service.CacheStatsService;
import com.coresolution.core.dto.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * 캐시 관리 컨트롤러
 * 캐시 통계 조회 및 관리 기능 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@RestController
@RequestMapping({"/api/v1/admin/cache", "/api/admin/cache"})
@RequiredArgsConstructor
public class CacheManagementController {

    private final CacheStatsService cacheStatsService;

    /**
     * 모든 캐시 통계 조회
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getAllCacheStats() {
        log.info("📊 모든 캐시 통계 조회 요청");
        
        Map<String, Object> stats = cacheStatsService.getAllCacheStats();
        
        log.info("✅ 캐시 통계 조회 완료: {} 개 캐시", stats.size());
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * 특정 캐시 통계 조회
     */
    @GetMapping("/stats/{cacheName}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getCacheStats(@PathVariable String cacheName) {
        log.info("📊 캐시 통계 조회 요청: {}", cacheName);
        
        Map<String, Object> stats = cacheStatsService.getCacheStats(cacheName);
        
        log.info("✅ 캐시 통계 조회 완료: {}", cacheName);
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    /**
     * 특정 캐시 클리어
     */
    @DeleteMapping("/{cacheName}")
    public ResponseEntity<ApiResponse<String>> clearCache(@PathVariable String cacheName) {
        log.info("🧹 캐시 클리어 요청: {}", cacheName);
        
        cacheStatsService.clearCache(cacheName);
        
        return ResponseEntity.ok(ApiResponse.success("캐시가 클리어되었습니다: " + cacheName));
    }

    /**
     * 모든 캐시 클리어
     */
    @DeleteMapping("/all")
    public ResponseEntity<ApiResponse<String>> clearAllCaches() {
        log.info("🧹 모든 캐시 클리어 요청");
        
        cacheStatsService.clearAllCaches();
        
        return ResponseEntity.ok(ApiResponse.success("모든 캐시가 클리어되었습니다."));
    }

    /**
     * 캐시 워밍업
     */
    @PostMapping("/warmup")
    public ResponseEntity<ApiResponse<String>> warmupCache() {
        log.info("🔥 캐시 워밍업 요청");
        
        cacheStatsService.warmupCache();
        
        return ResponseEntity.ok(ApiResponse.success("캐시 워밍업이 완료되었습니다."));
    }
}

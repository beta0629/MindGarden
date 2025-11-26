package com.coresolution.core.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.CacheManager;
import org.springframework.cache.concurrent.ConcurrentMapCache;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

/**
 * 캐시 통계 서비스
 * 캐시 성능 모니터링 및 통계 제공
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheStatsService {

    private final CacheManager cacheManager;

    /**
     * 모든 캐시 통계 조회
     */
    public Map<String, Object> getAllCacheStats() {
        Map<String, Object> stats = new HashMap<>();
        
        cacheManager.getCacheNames().forEach(cacheName -> {
            stats.put(cacheName, getCacheStats(cacheName));
        });
        
        return stats;
    }

    /**
     * 특정 캐시 통계 조회
     */
    public Map<String, Object> getCacheStats(String cacheName) {
        Map<String, Object> stats = new HashMap<>();
        
        try {
            var cache = cacheManager.getCache(cacheName);
            if (cache instanceof ConcurrentMapCache) {
                ConcurrentMapCache concurrentMapCache = (ConcurrentMapCache) cache;
                var nativeCache = concurrentMapCache.getNativeCache();
                
                stats.put("name", cacheName);
                stats.put("size", nativeCache.size());
                stats.put("keys", nativeCache.keySet());
                stats.put("isEmpty", nativeCache.isEmpty());
            }
        } catch (Exception e) {
            log.error("캐시 통계 조회 실패: {}", cacheName, e);
            stats.put("error", e.getMessage());
        }
        
        return stats;
    }

    /**
     * 캐시 클리어
     */
    public void clearCache(String cacheName) {
        try {
            var cache = cacheManager.getCache(cacheName);
            if (cache != null) {
                cache.clear();
                log.info("✅ 캐시 클리어 완료: {}", cacheName);
            }
        } catch (Exception e) {
            log.error("❌ 캐시 클리어 실패: {}", cacheName, e);
        }
    }

    /**
     * 모든 캐시 클리어
     */
    public void clearAllCaches() {
        cacheManager.getCacheNames().forEach(this::clearCache);
        log.info("✅ 모든 캐시 클리어 완료");
    }

    /**
     * 캐시 워밍업 (자주 사용되는 데이터 미리 로드)
     */
    public void warmupCache() {
        log.info("🔥 캐시 워밍업 시작...");
        
        // 여기에 자주 사용되는 코드 그룹들을 미리 로드하는 로직 추가
        // 예: USER_STATUS, ROLE, CONSULTATION_PACKAGE 등
        
        log.info("🔥 캐시 워밍업 완료");
    }
}

package com.coresolution.core.config;

import java.util.concurrent.TimeUnit;
import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.cache.interceptor.SimpleKeyGenerator;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 캐시 설정
 * 테넌트 코드 조회 성능 최적화를 위한 캐시 구성
 *
 * <p>Phase1 B7 (2026-06-12): Caffeine 기반으로 전환하여 per-cache TTL/사이즈 제어 지원.
 * 기존 캐시 이름({@code tenantCodes}, {@code coreCodes}, {@code userPersonalData})은
 * 기본 스펙(사이즈 상한 + TTL 없음)으로 동작하여 동작 호환성을 유지한다.
 * 신규 캐시({@code permissionGroupCodes}, {@code tenantById})만 TTL 을 가진다.</p>
 *
 * @author CoreSolution
 * @version 2.0.0
 * @since 2025-11-26
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * 캐시 매니저 설정 — Caffeine 기반.
     *
     * <ul>
     *   <li>기본 스펙: {@code maximumSize=10000}, TTL 없음 → 기존 @Cacheable 동작 유지</li>
     *   <li>{@code permissionGroupCodes}: {@code maximumSize=10000}, {@code expireAfterWrite=5m}
     *       — 권한 그룹 코드 조회 (Phase1 B7)</li>
     *   <li>{@code tenantById}: {@code maximumSize=1000}, {@code expireAfterWrite=10m}
     *       — 테넌트 단건 조회 (Phase1 B7)</li>
     * </ul>
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager cacheManager = new CaffeineCacheManager();

        // 기본 스펙: 사이즈 상한만(기존 ConcurrentMapCacheManager 무제한 → OOM 위험 차단).
        cacheManager.setCaffeine(Caffeine.newBuilder()
                .maximumSize(10_000)
                .recordStats());

        // null 값 허용 (빈 결과도 캐시 가능 — 기존 동작 유지)
        cacheManager.setAllowNullValues(true);

        // 신규 캐시: per-cache TTL/사이즈
        cacheManager.registerCustomCache(
                "permissionGroupCodes",
                Caffeine.newBuilder()
                        .maximumSize(10_000)
                        .expireAfterWrite(5, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        cacheManager.registerCustomCache(
                "tenantById",
                Caffeine.newBuilder()
                        .maximumSize(1_000)
                        .expireAfterWrite(10, TimeUnit.MINUTES)
                        .recordStats()
                        .build());

        return cacheManager;
    }

    /**
     * 캐시 키 생성기
     * 테넌트 ID와 코드 그룹을 조합한 키 생성
     */
    @Bean("tenantCodeKeyGenerator")
    public KeyGenerator tenantCodeKeyGenerator() {
        return (target, method, params) -> {
            StringBuilder keyBuilder = new StringBuilder();

            // 메서드명 포함
            keyBuilder.append(method.getName()).append(":");

            // 파라미터 조합
            for (int i = 0; i < params.length; i++) {
                if (i > 0) {
                    keyBuilder.append(":");
                }
                keyBuilder.append(params[i] != null ? params[i].toString() : "null");
            }

            return keyBuilder.toString();
        };
    }

    /**
     * 단순 키 생성기 (기본)
     */
    @Bean("simpleKeyGenerator")
    public KeyGenerator simpleKeyGenerator() {
        return new SimpleKeyGenerator();
    }
}

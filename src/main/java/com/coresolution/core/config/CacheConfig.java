package com.coresolution.core.config;

import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.cache.interceptor.KeyGenerator;
import org.springframework.cache.interceptor.SimpleKeyGenerator;

/**
 * 캐시 설정
 * 테넌트 코드 조회 성능 최적화를 위한 캐시 구성
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-11-26
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /**
     * 캐시 매니저 설정
     * 메모리 기반 캐시 사용 (개발/테스트 환경)
     */
    @Bean
    public CacheManager cacheManager() {
        ConcurrentMapCacheManager cacheManager = new ConcurrentMapCacheManager();
        
        // 캐시 이름 사전 등록
        cacheManager.setCacheNames(java.util.Arrays.asList(
            "tenantCodes",      // 테넌트별 공통코드 캐시
            "coreCodes",        // 코어 공통코드 캐시
            "codeMetadata"      // 코드 그룹 메타데이터 캐시
        ));
        
        // 동적 캐시 생성 허용
        cacheManager.setAllowNullValues(false);
        
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

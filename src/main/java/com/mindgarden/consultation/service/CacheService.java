package com.mindgarden.consultation.service;

import java.util.Optional;

/**
 * 캐시 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
public interface CacheService {
    
    /**
     * 캐시에서 값 조회
     */
    <T> Optional<T> get(String key, Class<T> type);
    
    /**
     * 캐시에 값 저장
     */
    void put(String key, Object value);
    
    /**
     * 캐시에 값 저장 (TTL 지정)
     */
    void put(String key, Object value, long ttlSeconds);
    
    /**
     * 캐시에서 값 제거
     */
    void evict(String key);
    
    /**
     * 캐시 패턴으로 값들 제거
     */
    void evictPattern(String pattern);
    
    /**
     * 캐시 전체 초기화
     */
    void clear();
    
    /**
     * 캐시 키 존재 여부 확인
     */
    boolean exists(String key);
}

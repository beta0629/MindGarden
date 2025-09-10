package com.mindgarden.consultation.service.impl;

import java.util.Optional;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import com.mindgarden.consultation.service.CacheService;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 캐시 서비스 구현체
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class CacheServiceImpl implements CacheService {
    
    private final CacheManager cacheManager;
    private final RedisTemplate<String, Object> redisTemplate;
    
    @Override
    public <T> Optional<T> get(String key, Class<T> type) {
        try {
            log.debug("캐시 조회: key={}, type={}", key, type.getSimpleName());
            
            // Spring Cache를 통한 조회 시도
            Cache cache = cacheManager.getCache("default");
            if (cache != null) {
                Cache.ValueWrapper wrapper = cache.get(key);
                if (wrapper != null) {
                    Object value = wrapper.get();
                    if (type.isInstance(value)) {
                        log.debug("캐시 히트 (Spring Cache): key={}", key);
                        return Optional.of(type.cast(value));
                    }
                }
            }
            
            // Redis 직접 조회
            Object value = redisTemplate.opsForValue().get(key);
            if (value != null && type.isInstance(value)) {
                log.debug("캐시 히트 (Redis): key={}", key);
                return Optional.of(type.cast(value));
            }
            
            log.debug("캐시 미스: key={}", key);
            return Optional.empty();
            
        } catch (Exception e) {
            log.warn("캐시 조회 실패: key={}, error={}", key, e.getMessage());
            return Optional.empty();
        }
    }
    
    @Override
    public void put(String key, Object value) {
        try {
            log.debug("캐시 저장: key={}", key);
            
            // Spring Cache를 통한 저장
            Cache cache = cacheManager.getCache("default");
            if (cache != null) {
                cache.put(key, value);
            }
            
            // Redis 직접 저장
            redisTemplate.opsForValue().set(key, value);
            
            log.debug("캐시 저장 완료: key={}", key);
            
        } catch (Exception e) {
            log.warn("캐시 저장 실패: key={}, error={}", key, e.getMessage());
        }
    }
    
    @Override
    public void put(String key, Object value, long ttlSeconds) {
        try {
            log.debug("캐시 저장 (TTL): key={}, ttl={}초", key, ttlSeconds);
            
            // Redis 직접 저장 (TTL 적용)
            redisTemplate.opsForValue().set(key, value, ttlSeconds, TimeUnit.SECONDS);
            
            log.debug("캐시 저장 완료 (TTL): key={}", key);
            
        } catch (Exception e) {
            log.warn("캐시 저장 실패 (TTL): key={}, error={}", key, e.getMessage());
        }
    }
    
    @Override
    public void evict(String key) {
        try {
            log.debug("캐시 제거: key={}", key);
            
            // Spring Cache를 통한 제거
            Cache cache = cacheManager.getCache("default");
            if (cache != null) {
                cache.evict(key);
            }
            
            // Redis 직접 제거
            redisTemplate.delete(key);
            
            log.debug("캐시 제거 완료: key={}", key);
            
        } catch (Exception e) {
            log.warn("캐시 제거 실패: key={}, error={}", key, e.getMessage());
        }
    }
    
    @Override
    public void evictPattern(String pattern) {
        try {
            log.debug("캐시 패턴 제거: pattern={}", pattern);
            
            // Redis 패턴 매칭으로 키 조회
            Set<String> keys = redisTemplate.keys(pattern);
            if (keys != null && !keys.isEmpty()) {
                redisTemplate.delete(keys);
                log.debug("캐시 패턴 제거 완료: pattern={}, count={}", pattern, keys.size());
            } else {
                log.debug("캐시 패턴 매칭 없음: pattern={}", pattern);
            }
            
        } catch (Exception e) {
            log.warn("캐시 패턴 제거 실패: pattern={}, error={}", pattern, e.getMessage());
        }
    }
    
    @Override
    public void clear() {
        try {
            log.debug("캐시 전체 초기화");
            
            // Spring Cache 초기화
            Cache cache = cacheManager.getCache("default");
            if (cache != null) {
                cache.clear();
            }
            
            // Redis 전체 초기화
            redisTemplate.getConnectionFactory().getConnection().flushAll();
            
            log.debug("캐시 전체 초기화 완료");
            
        } catch (Exception e) {
            log.warn("캐시 전체 초기화 실패: error={}", e.getMessage());
        }
    }
    
    @Override
    public boolean exists(String key) {
        try {
            log.debug("캐시 키 존재 확인: key={}", key);
            
            Boolean exists = redisTemplate.hasKey(key);
            boolean result = exists != null && exists;
            
            log.debug("캐시 키 존재 여부: key={}, exists={}", key, result);
            return result;
            
        } catch (Exception e) {
            log.warn("캐시 키 존재 확인 실패: key={}, error={}", key, e.getMessage());
            return false;
        }
    }
}

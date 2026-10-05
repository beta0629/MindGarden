package com.coresolution.consultation.cache;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.stereotype.Component;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

/**
 * 테넌트·코어 공통코드 캐시({@code tenantCodes}, {@code coreCodes})를 비운다.
 * <p>
 * {@code @CacheEvict} 를 같은 클래스에서 호출하면 프록시를 타지 않으므로
 * {@link CacheManager} 로 직접 {@code clear()} 한다.
 * {@code CacheConfig} 의 {@code ConcurrentMapCacheManager} 는 TTL 이 없다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-10-05
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class TenantCommonCodeCacheEvictor {

    /** {@link com.coresolution.consultation.service.impl.CommonCodeServiceImpl} 테넌트 코드 캐시 이름. */
    private static final String CACHE_TENANT_CODES = "tenantCodes";

    /** {@link com.coresolution.consultation.service.impl.CommonCodeServiceImpl} 코어 코드 캐시 이름. */
    private static final String CACHE_CORE_CODES = "coreCodes";

    private final CacheManager cacheManager;

    /**
     * 트랜잭션 동기화가 있으면 커밋 후, 없으면 즉시 공통코드 캐시를 비운다.
     */
    public void evictTenantAndCoreCodesAfterCommit() {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    clearTenantAndCoreCodeCaches();
                }
            });
            return;
        }
        clearTenantAndCoreCodeCaches();
    }

    /**
     * {@code tenantCodes} 와 {@code coreCodes} 캐시가 있으면 전체 엔트리를 제거한다.
     */
    private void clearTenantAndCoreCodeCaches() {
        clearCacheIfPresent(CACHE_TENANT_CODES);
        clearCacheIfPresent(CACHE_CORE_CODES);
        log.debug("공통코드 캐시 비움: {}, {}", CACHE_TENANT_CODES, CACHE_CORE_CODES);
    }

    /**
     * 캐시 이름이 등록되어 있으면 clear 한다. 없으면 건너뛴다.
     *
     * @param cacheName Spring 캐시 이름
     */
    private void clearCacheIfPresent(String cacheName) {
        Cache cache = cacheManager.getCache(cacheName);
        if (cache != null) {
            cache.clear();
        }
    }
}

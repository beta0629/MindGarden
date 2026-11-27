package com.coresolution.consultation.sct.unit;

import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.atomic.AtomicReference;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

/**
 * SCT verify 세션 단위 테스트용 — Redis mock(메모리 map). 프로덕션 ConcurrentHashMap 폴백 아님.
 *
 * @author MindGarden
 * @since 2026-03-27
 */
public final class SctVerifySessionRedisTestSupport {

    private SctVerifySessionRedisTestSupport() {
    }

    /**
     * set/get/expire/delete 를 공유 ConcurrentHashMap 에 기록하는 Redis mock.
     *
     * @return provider + lastTtlSeconds 캡처
     */
    @SuppressWarnings("unchecked")
    public static RedisHarness memoryRedis() {
        ConcurrentHashMap<String, String> map = new ConcurrentHashMap<>();
        ConcurrentHashMap<String, Long> ttlSec = new ConcurrentHashMap<>();
        AtomicLong lastTtlSeconds = new AtomicLong(-1L);
        AtomicReference<String> lastKey = new AtomicReference<>();

        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(ops);

        doAnswer(inv -> {
            String key = inv.getArgument(0);
            String json = inv.getArgument(1);
            long ttl = inv.getArgument(2);
            map.put(key, json);
            ttlSec.put(key, ttl);
            lastTtlSeconds.set(ttl);
            lastKey.set(key);
            return null;
        }).when(ops).set(anyString(), anyString(), anyLong(), eq(TimeUnit.SECONDS));

        when(ops.get(anyString())).thenAnswer(inv -> map.get(inv.getArgument(0)));

        when(redis.expire(anyString(), anyLong(), eq(TimeUnit.SECONDS))).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            long ttl = inv.getArgument(1);
            if (!map.containsKey(key)) {
                return Boolean.FALSE;
            }
            ttlSec.put(key, ttl);
            lastTtlSeconds.set(ttl);
            lastKey.set(key);
            return Boolean.TRUE;
        });

        when(redis.delete(anyString())).thenAnswer(inv -> {
            String key = inv.getArgument(0);
            ttlSec.remove(key);
            return map.remove(key) != null;
        });

        return new RedisHarness(provider, map, ttlSec, lastTtlSeconds);
    }

    public static ObjectProvider<StringRedisTemplate> noRedis() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
    }

    /**
     * @param provider       ObjectProvider
     * @param map            키→값
     * @param ttlSeconds     키→TTL 초
     * @param lastTtlSeconds 최근 set/expire TTL
     */
    public record RedisHarness(
            ObjectProvider<StringRedisTemplate> provider,
            ConcurrentHashMap<String, String> map,
            ConcurrentHashMap<String, Long> ttlSeconds,
            AtomicLong lastTtlSeconds) {

        /**
         * @return mock {@link StringRedisTemplate}
         */
        public StringRedisTemplate template() {
            return provider.getIfAvailable();
        }
    }
}

package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.time.Instant;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

/**
 * {@link OAuthWebSessionExchangeCodeService} — StringRedisTemplate JSON + 로컬 폴백.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@DisplayName("OAuthWebSessionExchangeCodeService — 일회용 교환 코드")
class OAuthWebSessionExchangeCodeServiceTest {

    @SuppressWarnings("unchecked")
    private static ObjectProvider<StringRedisTemplate> noRedis() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
    }

    @Test
    @DisplayName("Redis 없음 — 발급·1회 소비·재소비 실패")
    void issueAndConsumeOnce() {
        OAuthWebSessionExchangeCodeService service =
                new OAuthWebSessionExchangeCodeService(noRedis(), true, 90L);

        Optional<String> code = service.issue("access", "refresh", 9L, "tenant-a");
        assertThat(code).isPresent();

        Optional<OAuthWebSessionExchangeCodeService.StashEntry> first = service.consume(code.get());
        assertThat(first).isPresent();
        assertThat(first.get().accessToken()).isEqualTo("access");
        assertThat(first.get().refreshToken()).isEqualTo("refresh");
        assertThat(first.get().userId()).isEqualTo(9L);
        assertThat(first.get().tenantId()).isEqualTo("tenant-a");

        assertThat(service.consume(code.get())).isEmpty();
    }

    @Test
    @DisplayName("비활성 시 발급 안 함")
    void disabled_returnsEmpty() {
        OAuthWebSessionExchangeCodeService service =
                new OAuthWebSessionExchangeCodeService(noRedis(), false, 90L);
        assertThat(service.issue("a", "r", 1L, null)).isEmpty();
        assertThat(service.isEnabled()).isFalse();
    }

    @Test
    @DisplayName("Redis mock 정상 — set JSON·getAndDelete·1회 소비")
    @SuppressWarnings("unchecked")
    void redis_setAndGetAndDeleteOnce() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(ops);

        AtomicReference<String> storedJson = new AtomicReference<>();
        doAnswer(inv -> {
            storedJson.set(inv.getArgument(1));
            return null;
        }).when(ops).set(anyString(), anyString(), anyLong(), eq(TimeUnit.SECONDS));
        when(ops.getAndDelete(anyString())).thenAnswer(inv -> storedJson.getAndSet(null));

        OAuthWebSessionExchangeCodeService service =
                new OAuthWebSessionExchangeCodeService(provider, true, 90L);
        Optional<String> code = service.issue("access-jwt", "refresh-jwt", 9L, "tenant-a");
        assertThat(code).isPresent();

        verify(ops).set(startsWith("oauth:web-session-exchange:"), anyString(), eq(90L),
            eq(TimeUnit.SECONDS));
        assertThat(storedJson.get()).contains("\"userId\":9");
        assertThat(storedJson.get()).contains("expiresAt");

        Optional<OAuthWebSessionExchangeCodeService.StashEntry> first = service.consume(code.get());
        assertThat(first).isPresent();
        assertThat(first.get().userId()).isEqualTo(9L);
        assertThat(first.get().accessToken()).isEqualTo("access-jwt");
        verify(ops).getAndDelete(startsWith("oauth:web-session-exchange:"));

        assertThat(service.consume(code.get())).isEmpty();
    }

    @Test
    @DisplayName("Redis 장애(set throw) — local fallback 동작")
    @SuppressWarnings("unchecked")
    void redisSetFailure_fallsBackToLocal() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(ops);
        doThrow(new RuntimeException("redis down")).when(ops)
            .set(anyString(), anyString(), anyLong(), eq(TimeUnit.SECONDS));

        OAuthWebSessionExchangeCodeService service =
                new OAuthWebSessionExchangeCodeService(provider, true, 90L);
        Optional<String> code = service.issue("a", "r", 1L, "t");
        assertThat(code).isPresent();
        assertThat(service.consume(code.get())).isPresent();
        assertThat(service.consume(code.get())).isEmpty();
    }

    @Test
    @DisplayName("Redis 장애(get throw) — local fallback 소비")
    @SuppressWarnings("unchecked")
    void redisGetFailure_fallsBackToLocal() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(ops);
        doThrow(new RuntimeException("redis down")).when(ops)
            .set(anyString(), anyString(), anyLong(), eq(TimeUnit.SECONDS));
        when(ops.getAndDelete(anyString())).thenThrow(new RuntimeException("redis get fail"));
        when(ops.get(anyString())).thenThrow(new RuntimeException("redis get fail"));

        OAuthWebSessionExchangeCodeService service =
                new OAuthWebSessionExchangeCodeService(provider, true, 90L);
        Optional<String> code = service.issue("a", "r", 1L, "t");
        assertThat(code).isPresent();
        assertThat(service.consume(code.get())).isPresent();
        assertThat(service.consume(code.get())).isEmpty();
    }

    @Test
    @DisplayName("TTL 만료 — Redis 만료 JSON 반환 시 empty")
    @SuppressWarnings("unchecked")
    void redisExpiredJson_returnsEmpty() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(ops);
        doNothing().when(ops).set(anyString(), anyString(), anyLong(), eq(TimeUnit.SECONDS));

        String expiredJson = "{\"accessToken\":\"a\",\"refreshToken\":\"r\",\"userId\":9,"
            + "\"tenantId\":\"tenant-a\",\"expiresAt\":\"2020-01-01T00:00:00Z\"}";
        when(ops.getAndDelete(anyString())).thenReturn(expiredJson);

        OAuthWebSessionExchangeCodeService service =
                new OAuthWebSessionExchangeCodeService(provider, true, 90L);
        Optional<String> code = service.issue("a", "r", 9L, "tenant-a");
        assertThat(code).isPresent();
        assertThat(service.consume(code.get())).isEmpty();
    }

    @Test
    @DisplayName("TTL 만료 — local expiresAt 과거면 empty")
    @SuppressWarnings("unchecked")
    void localExpiredEntry_returnsEmpty() throws Exception {
        OAuthWebSessionExchangeCodeService service =
                new OAuthWebSessionExchangeCodeService(noRedis(), true, 90L);
        Optional<String> code = service.issue("a", "r", 9L, "tenant-a");
        assertThat(code).isPresent();

        Field localStoreField = OAuthWebSessionExchangeCodeService.class.getDeclaredField("localStore");
        localStoreField.setAccessible(true);
        ConcurrentHashMap<String, OAuthWebSessionExchangeCodeService.StashEntry> localStore =
            (ConcurrentHashMap<String, OAuthWebSessionExchangeCodeService.StashEntry>)
                localStoreField.get(service);
        localStore.put(code.get(), new OAuthWebSessionExchangeCodeService.StashEntry(
            "a", "r", 9L, "tenant-a", Instant.parse("2020-01-01T00:00:00Z")));

        assertThat(service.consume(code.get())).isEmpty();
    }
}

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
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
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
 * {@link PasswordResetOpaqueTokenStore} — StringRedisTemplate JSON + 로컬 폴백.
 *
 * @author MindGarden
 * @since 2026-11-01
 */
@DisplayName("PasswordResetOpaqueTokenStore")
class PasswordResetOpaqueTokenStoreTest {

    private static final String TENANT_A = "tenant-a";
    private static final String TENANT_B = "tenant-b";
    private static final long OTP_ID = 42L;

    @SuppressWarnings("unchecked")
    private static ObjectProvider<StringRedisTemplate> noRedis() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
    }

    @Test
    @DisplayName("Redis 없음 — local 발급·소비·재소비 empty")
    void localFallback_issueConsumeOnce() {
        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(noRedis(), 180L, 300L);

        String proof = store.issueProof(TENANT_A, OTP_ID);
        assertThat(proof).isNotBlank();
        assertThat(proof).doesNotContain(".");

        Optional<PasswordResetOpaqueTokenStore.TokenEntry> first = store.consumeProof(proof, TENANT_A);
        assertThat(first).isPresent();
        assertThat(first.get().kind()).isEqualTo(PasswordResetOpaqueTokenStore.Kind.PROOF);
        assertThat(first.get().otpId()).isEqualTo(OTP_ID);
        assertThat(first.get().tenantId()).isEqualTo(TENANT_A);

        assertThat(store.consumeProof(proof, TENANT_A)).isEmpty();
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

        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(provider, 180L, 300L);
        String proof = store.issueProof(TENANT_A, OTP_ID);

        verify(ops).set(startsWith("password-reset:opaque:"), anyString(), eq(300L), eq(TimeUnit.SECONDS));
        assertThat(storedJson.get()).contains("\"kind\":\"PROOF\"");
        assertThat(storedJson.get()).contains("\"otpId\":42");

        Optional<PasswordResetOpaqueTokenStore.TokenEntry> first = store.consumeProof(proof, TENANT_A);
        assertThat(first).isPresent();
        assertThat(first.get().otpId()).isEqualTo(OTP_ID);
        verify(ops).getAndDelete(startsWith("password-reset:opaque:"));

        assertThat(store.consumeProof(proof, TENANT_A)).isEmpty();
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

        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(provider, 180L, 300L);
        String proof = store.issueProof(TENANT_A, OTP_ID);

        assertThat(store.consumeProof(proof, TENANT_A)).isPresent();
        assertThat(store.consumeProof(proof, TENANT_A)).isEmpty();
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

        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(provider, 180L, 300L);
        String proof = store.issueProof(TENANT_A, OTP_ID);

        assertThat(store.consumeProof(proof, TENANT_A)).isPresent();
        assertThat(store.consumeProof(proof, TENANT_A)).isEmpty();
    }

    @Test
    @DisplayName("resolve 는 get 만 — 삭제하지 않음")
    @SuppressWarnings("unchecked")
    void resolve_usesGetOnly() {
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
        when(ops.get(anyString())).thenAnswer(inv -> storedJson.get());

        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(provider, 180L, 300L);
        String challenge = store.issueChallenge(TENANT_A, OTP_ID);

        assertThat(store.resolveChallenge(challenge, TENANT_A)).isPresent();
        assertThat(store.resolveChallenge(challenge, TENANT_A)).isPresent();
        verify(ops, never()).getAndDelete(anyString());
        verify(redis, never()).delete(anyString());
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

        String expiredJson = "{\"kind\":\"PROOF\",\"tenantId\":\"tenant-a\",\"otpId\":42,"
            + "\"expiresAtEpochMs\":1}";
        when(ops.getAndDelete(anyString())).thenReturn(expiredJson);

        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(provider, 180L, 300L);
        String proof = store.issueProof(TENANT_A, OTP_ID);

        assertThat(store.consumeProof(proof, TENANT_A)).isEmpty();
    }

    @Test
    @DisplayName("TTL 만료 — local expiresAt 과거면 empty")
    @SuppressWarnings("unchecked")
    void localExpiredEntry_returnsEmpty() throws Exception {
        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(noRedis(), 180L, 300L);
        String proof = store.issueProof(TENANT_A, OTP_ID);

        Field localStoreField = PasswordResetOpaqueTokenStore.class.getDeclaredField("localStore");
        localStoreField.setAccessible(true);
        ConcurrentHashMap<String, PasswordResetOpaqueTokenStore.TokenEntry> localStore =
            (ConcurrentHashMap<String, PasswordResetOpaqueTokenStore.TokenEntry>) localStoreField.get(store);
        assertThat(localStore).hasSize(1);
        String key = localStore.keySet().iterator().next();
        localStore.put(key, new PasswordResetOpaqueTokenStore.TokenEntry(
            PasswordResetOpaqueTokenStore.Kind.PROOF, TENANT_A, OTP_ID, 1L));

        assertThat(store.consumeProof(proof, TENANT_A)).isEmpty();
        assertThat(store.resolveProof(proof, TENANT_A)).isEmpty();
    }

    @Test
    @DisplayName("테넌트 불일치 — empty")
    void tenantMismatch_returnsEmpty() {
        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(noRedis(), 180L, 300L);
        String proof = store.issueProof(TENANT_A, OTP_ID);

        assertThat(store.resolveProof(proof, TENANT_B)).isEmpty();
        assertThat(store.resolveProof(proof, TENANT_A)).isPresent();
        assertThat(store.consumeProof(proof, TENANT_B)).isEmpty();
    }

    @Test
    @DisplayName("challenge/proof kind 불일치 — empty")
    void kindMismatch_returnsEmpty() {
        PasswordResetOpaqueTokenStore store = new PasswordResetOpaqueTokenStore(noRedis(), 180L, 300L);
        String challenge = store.issueChallenge(TENANT_A, OTP_ID);
        String proof = store.issueProof(TENANT_A, OTP_ID);

        assertThat(store.resolveProof(challenge, TENANT_A)).isEmpty();
        assertThat(store.resolveChallenge(proof, TENANT_A)).isEmpty();
        assertThat(store.resolveChallenge(challenge, TENANT_A)).isPresent();
        assertThat(store.resolveProof(proof, TENANT_A)).isPresent();
        assertThat(store.consumeProof(proof, TENANT_A)).isPresent();
    }
}

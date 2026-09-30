package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.startsWith;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.concurrent.TimeUnit;

import com.coresolution.consultation.constant.SessionManagementConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.ValueOperations;

/**
 * {@link AuthTokenRevocationService} — 개별 토큰 폐기 목록 (원문 미저장, 만료 시각까지만 유지).
 *
 * @author MindGarden
 * @since 2026-09-30
 */
@DisplayName("AuthTokenRevocationService")
class AuthTokenRevocationServiceTest {

    private static final String ACCESS = "header.payload.signature-a";
    private static final String OTHER_ACCESS = "header.payload.signature-b";

    @Test
    @DisplayName("Redis 없음 — 로컬 저장소로 해당 토큰만 폐기")
    @SuppressWarnings("unchecked")
    void localFallback_revokesOnlyThatToken() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        AuthTokenRevocationService service = new AuthTokenRevocationService(provider);

        service.revokeAccessToken(ACCESS, System.currentTimeMillis() + 60_000L);
        service.revokeRefreshTokenId("token-id-1", System.currentTimeMillis() + 60_000L);

        assertThat(service.isAccessTokenRevoked(ACCESS)).isTrue();
        assertThat(service.isAccessTokenRevoked(OTHER_ACCESS)).isFalse();
        assertThat(service.isRefreshTokenIdRevoked("token-id-1")).isTrue();
        assertThat(service.isRefreshTokenIdRevoked("token-id-2")).isFalse();
    }

    @Test
    @DisplayName("이미 만료된 토큰은 저장하지 않음")
    @SuppressWarnings("unchecked")
    void expiredToken_isNotStored() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        AuthTokenRevocationService service = new AuthTokenRevocationService(provider);

        service.revokeAccessToken(ACCESS, System.currentTimeMillis() - 1L);

        assertThat(service.isAccessTokenRevoked(ACCESS)).isFalse();
    }

    @Test
    @DisplayName("Redis 있음 — 해시 키·TTL 로 저장하고 원문 토큰은 키에 넣지 않음")
    @SuppressWarnings("unchecked")
    void redis_storesHashedKeyWithTtl() {
        ObjectProvider<StringRedisTemplate> provider = mock(ObjectProvider.class);
        StringRedisTemplate redis = mock(StringRedisTemplate.class);
        ValueOperations<String, String> ops = mock(ValueOperations.class);
        when(provider.getIfAvailable()).thenReturn(redis);
        when(redis.opsForValue()).thenReturn(ops);
        AuthTokenRevocationService service = new AuthTokenRevocationService(provider);

        service.revokeAccessToken(ACCESS, System.currentTimeMillis() + 60_000L);

        verify(ops).set(startsWith(SessionManagementConstants.REVOKED_ACCESS_TOKEN_KEY_PREFIX), eq("1"),
            anyLong(), eq(TimeUnit.MILLISECONDS));
        verify(ops, never()).set(eq(SessionManagementConstants.REVOKED_ACCESS_TOKEN_KEY_PREFIX + ACCESS),
            anyString(), anyLong(), eq(TimeUnit.MILLISECONDS));
    }
}

package com.coresolution.consultation.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.core.RedisTemplate;

/**
 * {@link OAuthWebSessionExchangeCodeService} 로컬 스토어 단위 검증.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@DisplayName("OAuthWebSessionExchangeCodeService — 일회용 교환 코드")
class OAuthWebSessionExchangeCodeServiceTest {

    @SuppressWarnings("unchecked")
    private static ObjectProvider<RedisTemplate<String, Object>> noRedis() {
        ObjectProvider<RedisTemplate<String, Object>> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
    }

    @Test
    @DisplayName("발급·1회 소비·재소비 실패")
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
}

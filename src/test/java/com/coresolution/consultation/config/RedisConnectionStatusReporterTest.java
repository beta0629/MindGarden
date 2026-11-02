package com.coresolution.consultation.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.redis.connection.RedisConnection;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.mock.env.MockEnvironment;

/**
 * {@link RedisConnectionStatusReporter} — host/ping 판정·시크릿 미포함 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-11-02
 */
@DisplayName("RedisConnectionStatusReporter")
class RedisConnectionStatusReporterTest {

    private static final String SAMPLE_PASSWORD = "super-secret-redis-password";
    private static final String SAMPLE_HOST = "redis.example.test";

    @Test
    @DisplayName("host unset → MEMORY_FALLBACK (REDIS_HOST unset)")
    void hostUnset_memoryFallback() {
        String line = RedisConnectionStatusReporter.buildStatusLine(null, null);
        assertThat(line).isEqualTo(
                "Redis connection status: MEMORY_FALLBACK (REDIS_HOST unset)");
        assertThat(line).doesNotContain(SAMPLE_PASSWORD);

        assertThat(RedisConnectionStatusReporter.buildStatusLine("", "PONG"))
                .contains(RedisConnectionStatusReporter.STATUS_MEMORY_FALLBACK)
                .contains("REDIS_HOST unset");
        assertThat(RedisConnectionStatusReporter.buildStatusLine("   ", null))
                .contains("REDIS_HOST unset");
    }

    @Test
    @DisplayName("host set + ping ok → IN_USE")
    void hostSet_pingOk_inUse() {
        String line = RedisConnectionStatusReporter.buildStatusLine(SAMPLE_HOST, "PONG");
        assertThat(line).isEqualTo("Redis connection status: IN_USE (ping=PONG)");
        assertThat(line).contains(RedisConnectionStatusReporter.STATUS_IN_USE);
        assertThat(line).doesNotContain(SAMPLE_PASSWORD);
        assertThat(line).doesNotContain(SAMPLE_HOST);
    }

    @Test
    @DisplayName("host set + ping fail → MEMORY_FALLBACK (connection failed)")
    void hostSet_pingFail_memoryFallback() {
        String line = RedisConnectionStatusReporter.buildStatusLine(SAMPLE_HOST, null);
        assertThat(line).isEqualTo(
                "Redis connection status: MEMORY_FALLBACK (connection failed)");
        assertThat(line).doesNotContain(SAMPLE_PASSWORD);
        assertThat(line).doesNotContain(SAMPLE_HOST);
    }

    @Test
    @DisplayName("host set + ping 비정상 응답 → MEMORY_FALLBACK")
    void hostSet_pingUnexpected_memoryFallback() {
        String line = RedisConnectionStatusReporter.buildStatusLine(SAMPLE_HOST, "ERR");
        assertThat(line).contains(RedisConnectionStatusReporter.STATUS_MEMORY_FALLBACK)
                .contains("connection failed");
    }

    @Test
    @DisplayName("resolveRedisHost — REDIS_HOST 우선, 없으면 spring.data.redis.host")
    void resolveRedisHost_prefersEnvThenProperty() {
        MockEnvironment envOnlyProp = new MockEnvironment()
                .withProperty(RedisConnectionStatusReporter.PROP_REDIS_HOST, SAMPLE_HOST);
        assertThat(RedisConnectionStatusReporter.resolveRedisHost(envOnlyProp)).isEqualTo(SAMPLE_HOST);

        MockEnvironment envBoth = new MockEnvironment()
                .withProperty(RedisConnectionStatusReporter.ENV_REDIS_HOST, "from-env")
                .withProperty(RedisConnectionStatusReporter.PROP_REDIS_HOST, "from-prop");
        assertThat(RedisConnectionStatusReporter.resolveRedisHost(envBoth)).isEqualTo("from-env");

        MockEnvironment empty = new MockEnvironment()
                .withProperty(RedisConnectionStatusReporter.PROP_REDIS_HOST, "");
        assertThat(RedisConnectionStatusReporter.resolveRedisHost(empty)).isNullOrEmpty();
    }

    @Test
    @DisplayName("tryPing — factory null → null (MEMORY_FALLBACK 경로)")
    @SuppressWarnings("unchecked")
    void tryPing_factoryNull_returnsNull() {
        ObjectProvider<RedisConnectionFactory> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);

        assertThat(RedisConnectionStatusReporter.tryPing(provider)).isNull();
    }

    @Test
    @DisplayName("tryPing — ping 성공 → PONG")
    @SuppressWarnings("unchecked")
    void tryPing_success_returnsPong() {
        ObjectProvider<RedisConnectionFactory> provider = mock(ObjectProvider.class);
        RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
        RedisConnection connection = mock(RedisConnection.class);
        when(provider.getIfAvailable()).thenReturn(factory);
        when(factory.getConnection()).thenReturn(connection);
        when(connection.ping()).thenReturn("PONG");

        assertThat(RedisConnectionStatusReporter.tryPing(provider)).isEqualTo("PONG");
    }

    @Test
    @DisplayName("tryPing — getConnection 예외 → null (기동 중단 없음)")
    @SuppressWarnings("unchecked")
    void tryPing_connectionThrows_returnsNull() {
        ObjectProvider<RedisConnectionFactory> provider = mock(ObjectProvider.class);
        RedisConnectionFactory factory = mock(RedisConnectionFactory.class);
        when(provider.getIfAvailable()).thenReturn(factory);
        when(factory.getConnection()).thenThrow(new RuntimeException("boom"));

        assertThat(RedisConnectionStatusReporter.tryPing(provider)).isNull();
    }

    @Test
    @DisplayName("상태 문자열에 비밀번호·host 시크릿 미포함")
    void statusLine_neverContainsPassword() {
        String withPasswordHost = RedisConnectionStatusReporter.buildStatusLine(
                SAMPLE_HOST + ":" + SAMPLE_PASSWORD, "PONG");
        // host 자체는 로그에 넣지 않음 — 비밀번호가 host에 섞여 있어도 노출되지 않음
        assertThat(withPasswordHost).doesNotContain(SAMPLE_PASSWORD);
        assertThat(withPasswordHost).doesNotContain(SAMPLE_HOST);

        String fallback = RedisConnectionStatusReporter.buildStatusLine(SAMPLE_PASSWORD, null);
        assertThat(fallback).doesNotContain(SAMPLE_PASSWORD);
        assertThat(fallback).contains("connection failed");
    }
}

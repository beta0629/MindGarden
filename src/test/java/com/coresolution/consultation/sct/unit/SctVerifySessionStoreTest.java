package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;
import com.coresolution.consultation.sct.service.SctVerifySessionStore;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Redis verify 세션 — sliding idle·absolute cap·재시작·fail-closed.
 *
 * @author MindGarden
 * @since 2026-03-27
 */
class SctVerifySessionStoreTest {

    private static final long IDLE_SEC = 600L;
    private static final Instant T0 = Instant.parse("2026-03-27T00:00:00Z");

    @Test
    @DisplayName("validate 성공 시 idle TTL sliding")
    void validate_slidesIdleTtl() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        AtomicReference<Instant> now = new AtomicReference<>(T0);
        Clock clock = clockOf(now);
        Instant absolute = T0.plusSeconds(3600);

        SctVerifySessionStore store = new SctVerifySessionStore(redis.provider(), clock, IDLE_SEC);
        String sid = store.issue(100L, "tenant-a", absolute);
        assertEquals(IDLE_SEC, redis.lastTtlSeconds().get());

        now.set(T0.plusSeconds(120));
        Optional<String> tenant = store.validate(sid, 100L, absolute);
        assertEquals("tenant-a", tenant.orElseThrow());
        assertEquals(IDLE_SEC, redis.lastTtlSeconds().get());
    }

    @Test
    @DisplayName("sliding 이 absoluteExpiresAt 을 넘지 않음")
    void validate_cannotSlidePastAbsolute() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        AtomicReference<Instant> now = new AtomicReference<>(T0);
        Clock clock = clockOf(now);
        Instant absolute = T0.plusSeconds(200);

        SctVerifySessionStore store = new SctVerifySessionStore(redis.provider(), clock, IDLE_SEC);
        String sid = store.issue(100L, "tenant-a", absolute);
        assertEquals(200L, redis.lastTtlSeconds().get());

        now.set(T0.plusSeconds(150));
        assertTrue(store.validate(sid, 100L, absolute).isPresent());
        assertEquals(50L, redis.lastTtlSeconds().get());
    }

    @Test
    @DisplayName("만료·삭제된 세션은 empty")
    void expiredOrRemoved_returnsEmpty() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        AtomicReference<Instant> now = new AtomicReference<>(T0);
        Clock clock = clockOf(now);
        Instant absolute = T0.plusSeconds(100);

        SctVerifySessionStore store = new SctVerifySessionStore(redis.provider(), clock, IDLE_SEC);
        String sid = store.issue(100L, "tenant-a", absolute);

        now.set(T0.plusSeconds(101));
        assertTrue(store.validate(sid, 100L, absolute).isEmpty());

        now.set(T0);
        String sid2 = store.issue(100L, "tenant-a", absolute);
        redis.map().clear();
        assertTrue(store.validate(sid2, 100L, absolute).isEmpty());
    }

    @Test
    @DisplayName("다른 invitationId 는 empty")
    void wrongInvitation_returnsEmpty() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        SctVerifySessionStore store = new SctVerifySessionStore(
                redis.provider(), Clock.fixed(T0, ZoneOffset.UTC), IDLE_SEC);
        Instant absolute = T0.plusSeconds(3600);
        String sid = store.issue(100L, "tenant-a", absolute);
        assertTrue(store.validate(sid, 999L, absolute).isEmpty());
    }

    @Test
    @DisplayName("재시작 — 같은 Redis mock 을 쓰는 새 Store 가 세션 유지")
    void restart_newStoreSameRedis_validates() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        Instant absolute = T0.plusSeconds(3600);
        SctVerifySessionStore storeA = new SctVerifySessionStore(
                redis.provider(), Clock.fixed(T0, ZoneOffset.UTC), IDLE_SEC);
        String sid = storeA.issue(100L, "tenant-a", absolute);

        SctVerifySessionStore storeB = new SctVerifySessionStore(
                redis.provider(), Clock.fixed(T0.plusSeconds(30), ZoneOffset.UTC), IDLE_SEC);
        assertEquals("tenant-a", storeB.validate(sid, 100L, absolute).orElseThrow());
    }

    @Test
    @DisplayName("Redis 없으면 issue fail-closed")
    void noRedis_issueThrows() {
        SctVerifySessionStore store = new SctVerifySessionStore(
                SctVerifySessionRedisTestSupport.noRedis(),
                Clock.fixed(T0, ZoneOffset.UTC),
                IDLE_SEC);
        assertThrows(IllegalStateException.class,
                () -> store.issue(1L, "t", T0.plusSeconds(60)));
    }

    @Test
    @DisplayName("Redis 없으면 validate empty")
    void noRedis_validateEmpty() {
        SctVerifySessionStore store = new SctVerifySessionStore(
                SctVerifySessionRedisTestSupport.noRedis(),
                Clock.fixed(T0, ZoneOffset.UTC),
                IDLE_SEC);
        assertTrue(store.validate("any", 1L, T0.plusSeconds(60)).isEmpty());
    }

    private static Clock clockOf(AtomicReference<Instant> now) {
        return new Clock() {
            @Override
            public ZoneOffset getZone() {
                return ZoneOffset.UTC;
            }

            @Override
            public Clock withZone(java.time.ZoneId zone) {
                return this;
            }

            @Override
            public Instant instant() {
                return now.get();
            }
        };
    }
}

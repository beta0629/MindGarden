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
 * Redis verify 세션 — idle 만료 없음·absolute 만료·재시작·fail-closed.
 *
 * @author MindGarden
 * @since 2026-03-27
 */
class SctVerifySessionStoreTest {

    private static final Instant T0 = Instant.parse("2026-03-27T00:00:00Z");

    @Test
    @DisplayName("idle 만료 없음 — 발급 TTL=절대 만료까지, validate 는 TTL 을 바꾸지 않고 90분 무입력 후에도 성공")
    void noIdleExpiry_validAcrossLongIdle() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        AtomicReference<Instant> now = new AtomicReference<>(T0);
        Clock clock = clockOf(now);
        Instant absolute = T0.plusSeconds(6 * 3600L);

        SctVerifySessionStore store = new SctVerifySessionStore(redis.provider(), clock);
        String sid = store.issue(100L, "tenant-a", absolute);
        assertEquals(6 * 3600L, redis.lastTtlSeconds().get());

        now.set(T0.plusSeconds(90 * 60L));
        assertEquals("tenant-a", store.validate(sid, 100L, absolute).orElseThrow());
        assertEquals(6 * 3600L, redis.lastTtlSeconds().get(), "validate 는 TTL 을 연장/단축하지 않는다");
        assertEquals(6 * 3600 - 90 * 60, store.remainingSeconds(absolute));
    }

    @Test
    @DisplayName("절대 만료(초대 만료) 이후에는 거부")
    void validate_rejectedAfterAbsolute() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        AtomicReference<Instant> now = new AtomicReference<>(T0);
        Clock clock = clockOf(now);
        Instant absolute = T0.plusSeconds(200);

        SctVerifySessionStore store = new SctVerifySessionStore(redis.provider(), clock);
        String sid = store.issue(100L, "tenant-a", absolute);
        assertEquals(200L, redis.lastTtlSeconds().get());

        now.set(T0.plusSeconds(150));
        assertTrue(store.validate(sid, 100L, absolute).isPresent());
        now.set(T0.plusSeconds(201));
        assertTrue(store.validate(sid, 100L, absolute).isEmpty());
    }

    @Test
    @DisplayName("절대 만료 null(만료 시각 없는 초대)은 발급 거부·검증 empty — 임의 기본 수명 없음")
    void nullAbsolute_failClosed() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        SctVerifySessionStore store = new SctVerifySessionStore(
                redis.provider(), Clock.fixed(T0, ZoneOffset.UTC));
        assertThrows(IllegalArgumentException.class, () -> store.issue(100L, "tenant-a", null));
        assertTrue(store.validate("sid", 100L, null).isEmpty());
    }

    @Test
    @DisplayName("만료·삭제된 세션은 empty")
    void expiredOrRemoved_returnsEmpty() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        AtomicReference<Instant> now = new AtomicReference<>(T0);
        Clock clock = clockOf(now);
        Instant absolute = T0.plusSeconds(100);

        SctVerifySessionStore store = new SctVerifySessionStore(redis.provider(), clock);
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
                redis.provider(), Clock.fixed(T0, ZoneOffset.UTC));
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
                redis.provider(), Clock.fixed(T0, ZoneOffset.UTC));
        String sid = storeA.issue(100L, "tenant-a", absolute);

        SctVerifySessionStore storeB = new SctVerifySessionStore(
                redis.provider(), Clock.fixed(T0.plusSeconds(30), ZoneOffset.UTC));
        assertEquals("tenant-a", storeB.validate(sid, 100L, absolute).orElseThrow());
    }

    @Test
    @DisplayName("Redis 없으면 issue fail-closed")
    void noRedis_issueThrows() {
        SctVerifySessionStore store = new SctVerifySessionStore(
                SctVerifySessionRedisTestSupport.noRedis(),
                Clock.fixed(T0, ZoneOffset.UTC));
        assertThrows(IllegalStateException.class,
                () -> store.issue(1L, "t", T0.plusSeconds(60)));
    }

    @Test
    @DisplayName("Redis 없으면 validate empty")
    void noRedis_validateEmpty() {
        SctVerifySessionStore store = new SctVerifySessionStore(
                SctVerifySessionRedisTestSupport.noRedis(),
                Clock.fixed(T0, ZoneOffset.UTC));
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

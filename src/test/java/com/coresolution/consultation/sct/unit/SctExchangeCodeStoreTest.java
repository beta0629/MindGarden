package com.coresolution.consultation.sct.unit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.util.Optional;
import com.coresolution.consultation.sct.service.SctExchangeCodeStore;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * SCT 단축 링크 교환 코드 — tokenHash 바인딩.
 *
 * @author MindGarden
 * @since 2026-11-27
 */
class SctExchangeCodeStoreTest {

    @Test
    @DisplayName("issue — tokenHash 필수·resolve 시 유지")
    void issue_requiresTokenHash_andPersists() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        SctExchangeCodeStore store = new SctExchangeCodeStore(redis.provider(), 600L);

        String code = store.issue(10L, "tenant-a", null, "token-hash-abc");
        Optional<SctExchangeCodeStore.ExchangeEntry> resolved = store.resolve(code);

        assertTrue(resolved.isPresent());
        assertEquals(10L, resolved.get().invitationId());
        assertEquals("tenant-a", resolved.get().tenantId());
        assertEquals("token-hash-abc", resolved.get().tokenHash());
        assertTrue(resolved.get().used());
    }

    @Test
    @DisplayName("issue — tokenHash 없으면 거부")
    void issue_blankTokenHash_rejected() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        SctExchangeCodeStore store = new SctExchangeCodeStore(redis.provider(), 600L);

        assertThrows(IllegalArgumentException.class,
                () -> store.issue(10L, "tenant-a", null, null));
        assertThrows(IllegalArgumentException.class,
                () -> store.issue(10L, "tenant-a", null, "  "));
    }

    @Test
    @DisplayName("resolve — tokenHash 없는 레거시 JSON 은 무시(fail-closed)")
    void resolve_legacyJsonWithoutTokenHash_empty() {
        SctVerifySessionRedisTestSupport.RedisHarness redis =
                SctVerifySessionRedisTestSupport.memoryRedis();
        SctExchangeCodeStore store = new SctExchangeCodeStore(redis.provider(), 600L);
        String code = store.issue(10L, "tenant-a", null, "token-hash-abc");
        assertEquals(1, redis.map().size());
        String key = redis.map().keySet().iterator().next();
        redis.map().put(key,
                "{\"invitationId\":10,\"tenantId\":\"tenant-a\",\"landingStatus\":null,\"used\":false}");

        assertFalse(store.resolve(code).isPresent());
    }
}

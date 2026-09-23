package com.coresolution.consultation.service.portone;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link PortOneChannelKeyResolver} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-16
 */
@DisplayName("PortOneChannelKeyResolver")
class PortOneChannelKeyResolverTest {

    @Test
    @DisplayName("testMode=true 이면 portoneChannelKeyTest 선택")
    void resolve_testMode_usesTestKey() {
        String json = "{\"portoneChannelKey\":\"live-key\",\"portoneChannelKeyTest\":\"test-key\"}";
        assertEquals("test-key", PortOneChannelKeyResolver.resolveChannelKey(json, true));
    }

    @Test
    @DisplayName("testMode=false 이면 portoneChannelKey 선택")
    void resolve_liveMode_usesLiveKey() {
        String json = "{\"portoneChannelKey\":\"live-key\",\"portoneChannelKeyTest\":\"test-key\"}";
        assertEquals("live-key", PortOneChannelKeyResolver.resolveChannelKey(json, false));
    }

    @Test
    @DisplayName("해당 모드 키 없으면 null")
    void resolve_missingKey_returnsNull() {
        String json = "{\"portoneChannelKey\":\"live-only\"}";
        assertNull(PortOneChannelKeyResolver.resolveChannelKey(json, true));
    }

    @Test
    @DisplayName("빈 JSON / null 은 null")
    void resolve_blank_returnsNull() {
        assertNull(PortOneChannelKeyResolver.resolveChannelKey(null, true));
        assertNull(PortOneChannelKeyResolver.resolveChannelKey("  ", false));
    }
}

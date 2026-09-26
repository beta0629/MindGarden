package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Spring Session Base64 쿠키 ↔ raw sessionId 정규화 단위 테스트.
 *
 * @author MindGarden
 * @since 2026-09-26
 */
@DisplayName("SessionIdCookieCodec")
class SessionIdCookieCodecTest {

    private static final String RAW = "AABBCCDDEEFF00112233445566778899";

    @Test
    @DisplayName("Base64 쿠키 → raw canonical")
    void toCanonical_decodesBase64Cookie() {
        String cookie = SessionIdCookieCodec.encodeBase64Utf8(RAW);
        assertThat(SessionIdCookieCodec.toCanonicalSessionId(cookie)).isEqualTo(RAW);
    }

    @Test
    @DisplayName("이미 raw 이면 그대로")
    void toCanonical_keepsRaw() {
        assertThat(SessionIdCookieCodec.toCanonicalSessionId(RAW)).isEqualTo(RAW);
    }

    @Test
    @DisplayName("matches: Base64 쿠키와 raw HttpSession ID")
    void matches_base64CookieAndRawId() {
        String cookie = SessionIdCookieCodec.encodeBase64Utf8(RAW);
        assertThat(SessionIdCookieCodec.matches(cookie, RAW)).isTrue();
        assertThat(SessionIdCookieCodec.matches(RAW, RAW)).isTrue();
        assertThat(SessionIdCookieCodec.matches(cookie, "DEADBEEFDEADBEEFDEADBEEFDEADBEEF")).isFalse();
    }

    @Test
    @DisplayName("lookupCandidates: raw·Base64 모두 포함")
    void lookupCandidates_includesRawAndBase64() {
        String cookie = SessionIdCookieCodec.encodeBase64Utf8(RAW);
        assertThat(SessionIdCookieCodec.lookupCandidates(cookie))
                .contains(cookie, RAW);
        assertThat(SessionIdCookieCodec.lookupCandidates(RAW))
                .contains(RAW, cookie);
    }
}

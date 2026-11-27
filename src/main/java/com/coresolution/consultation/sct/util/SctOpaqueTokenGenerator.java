package com.coresolution.consultation.sct.util;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * SCT opaque 토큰 생성 (평문 DB 저장 금지 — 해시는 {@code PiiHmacService}).
 *
 * @author MindGarden
 * @since 2026-11-27
 */
public final class SctOpaqueTokenGenerator {

    private static final int TOKEN_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SctOpaqueTokenGenerator() {
    }

    /**
     * URL-safe Base64 opaque 토큰 생성.
     *
     * @return 평문 토큰 (DB 저장 금지)
     */
    public static String generateOpaqueToken() {
        byte[] bytes = new byte[TOKEN_BYTES];
        SECURE_RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}

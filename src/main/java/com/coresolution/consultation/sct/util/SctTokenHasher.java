package com.coresolution.consultation.sct.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.HexFormat;

import com.coresolution.consultation.sct.constant.SctConstants;

/**
 * SCT opaque 토큰 생성·SHA-256 해시 (평문 DB 금지).
 *
 * @author MindGarden
 * @since 2026-11-23
 */
public final class SctTokenHasher {

    private static final int TOKEN_BYTES = 32;
    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private SctTokenHasher() {
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

    /**
     * SHA-256 hex (소문자 64자).
     *
     * @param raw 평문 토큰·IP·이메일 등
     * @return hex 해시, raw null이면 null
     */
    public static String sha256Hex(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            MessageDigest md = MessageDigest.getInstance(SctConstants.HASH_ALGORITHM);
            byte[] digest = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 미지원", e);
        }
    }
}

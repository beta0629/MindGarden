package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.MobilePushConstants;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 푸시 토큰 문자열의 SHA-256(hex) — DB 유니크·조회용.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public final class MobilePushTokenHasher {

    private MobilePushTokenHasher() {
    }

    /**
     * UTF-8 바이트 기준 SHA-256 소문자 hex.
     *
     * @param rawToken 원문 토큰
     * @return 64자 hex
     */
    public static String sha256Hex(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance(MobilePushConstants.SHA256);
            byte[] hash = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(MobilePushConstants.TOKEN_SHA256_HEX_LENGTH);
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }
}

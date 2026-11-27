package com.coresolution.consultation.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Locale;

/**
 * 정규화된 한국 휴대폰 digits 의 SHA-256 hex — {@code phone_otp_attempts.phone_hash} SSOT.
 *
 * <p>OAuth/Apple 휴대폰 매칭과 동일 알고리즘(UTF-8 · SHA-256 · 소문자 hex 64자).
 * 프로필 결제 게이트·OAuth 시도 장부가 동일 해시로 조회되도록 한곳에서만 계산한다.</p>
 *
 * @author MindGarden
 * @since 2026-09-18
 */
public final class PhoneHashUtils {

    private static final String PHONE_HASH_ALGORITHM = "SHA-256";

    private PhoneHashUtils() {
    }

    /**
     * 정규화된 한국 휴대폰 digits 의 SHA-256 hex (소문자, 64자).
     *
     * @param normalizedPhoneDigits {@code 01012345678} 형태 (null 이면 null)
     * @return 64자 hex 또는 null
     */
    public static String sha256Hex(String normalizedPhoneDigits) {
        if (normalizedPhoneDigits == null) {
            return null;
        }
        try {
            MessageDigest md = MessageDigest.getInstance(PHONE_HASH_ALGORITHM);
            byte[] bytes = md.digest(normalizedPhoneDigits.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format(Locale.ROOT, "%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 미지원 — JRE 비정상", e);
        }
    }
}

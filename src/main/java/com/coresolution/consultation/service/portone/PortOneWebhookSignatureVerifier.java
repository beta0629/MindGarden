package com.coresolution.consultation.service.portone;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * 포트원 결제모듈 V2 웹훅 서명 검증 (Content-Type application/json, Version 2024-04-25).
 * 메시지: {@code webhook-timestamp + "." + rawBody} (UTF-8), HMAC-SHA256(웹훅 시크릿, 메시지) → Base64,
 * 헤더 {@code webhook-signature} 형식 {@code v1,<base64>} 과 타이밍 안전 비교.
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
public final class PortOneWebhookSignatureVerifier {

    private static final String HMAC_SHA256 = "HmacSHA256";
    private static final String V1_PREFIX = "v1,";

    private PortOneWebhookSignatureVerifier() {
    }

    /**
     * 포트원 V2 웹훅 서명을 검증한다.
     *
     * @param rawBodyUtf8       원시 요청 바디(UTF-8 문자열, 파싱 전과 동일해야 함)
     * @param webhookTimestamp  {@code webhook-timestamp} 헤더
     * @param webhookSignature  {@code webhook-signature} 헤더 ({@code v1,<base64>})
     * @param webhookSecret     웹훅 시크릿(평문)
     * @return 검증 성공 시 true
     */
    public static boolean isValid(
            String rawBodyUtf8,
            String webhookTimestamp,
            String webhookSignature,
            String webhookSecret) {
        if (rawBodyUtf8 == null || webhookTimestamp == null || webhookTimestamp.isEmpty()
                || webhookSignature == null || webhookSignature.isEmpty()
                || webhookSecret == null || webhookSecret.isEmpty()) {
            return false;
        }
        String trimmedSig = webhookSignature.trim();
        if (!trimmedSig.regionMatches(true, 0, V1_PREFIX, 0, V1_PREFIX.length())) {
            return false;
        }
        String encoded = trimmedSig.substring(V1_PREFIX.length()).trim();
        byte[] actualMac;
        try {
            actualMac = Base64.getDecoder().decode(encoded);
        } catch (IllegalArgumentException e) {
            return false;
        }
        byte[] expectedMac = hmacSha256(webhookSecret, webhookTimestamp + "." + rawBodyUtf8);
        if (expectedMac == null) {
            return false;
        }
        return MessageDigest.isEqual(expectedMac, actualMac);
    }

    private static byte[] hmacSha256(String secret, String message) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_SHA256));
            return mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return null;
        }
    }
}

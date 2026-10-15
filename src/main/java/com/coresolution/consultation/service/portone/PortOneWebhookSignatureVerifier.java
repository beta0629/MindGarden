package com.coresolution.consultation.service.portone;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Base64;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

/**
 * 포트원 결제모듈 V2 웹훅 서명 검증 (Standard Webhooks).
 * <p>
 * 포트원 server-sdk {@code javascript/src/webhook.ts} 와 같다.
 * 서명 대상은 {@code webhook-id + "." + webhook-timestamp + "." + rawBody} (UTF-8) 이다.
 * 시크릿은 {@code whsec_} 접두사를 제거한 뒤 Base64 디코드한 바이트를 HMAC-SHA256 키로 쓴다.
 * {@code webhook-signature} 는 공백으로 구분된 {@code v1,<base64>} 가 여러 개일 수 있으며,
 * 하나라도 일치하면 성공한다. 비교는 {@link MessageDigest#isEqual(byte[], byte[])} 로 한다.
 * 타임스탬프가 기준 시각에서 허용 오차(기본 5분)를 벗어나면 거부한다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
public final class PortOneWebhookSignatureVerifier {

    /** Standard Webhooks / 포트원 server-sdk {@code WEBHOOK_TOLERANCE_IN_SECONDS} (5분). */
    public static final int DEFAULT_TOLERANCE_SECONDS = 5 * 60;

    /** Standard Webhooks 대칭키 시크릿 접두사. */
    public static final String SECRET_PREFIX = "whsec_";

    /** 대칭키(HMAC-SHA256) 서명 버전. */
    public static final String SIGNATURE_VERSION_V1 = "v1";

    private static final String HMAC_SHA256 = "HmacSHA256";

    private PortOneWebhookSignatureVerifier() {
    }

    /**
     * 포트원 V2 웹훅 서명을 검증한다. 기준 시각은 현재, 허용 오차는 {@link #DEFAULT_TOLERANCE_SECONDS} 이다.
     *
     * @param rawBodyUtf8      원시 요청 바디(UTF-8 문자열, 파싱 전과 동일해야 함)
     * @param webhookId        {@code webhook-id} 헤더
     * @param webhookTimestamp {@code webhook-timestamp} 헤더 (unix 초)
     * @param webhookSignature {@code webhook-signature} 헤더 ({@code v1,<base64>} 를 공백으로 구분)
     * @param webhookSecret    웹훅 시크릿 ({@code whsec_} + Base64, 또는 Base64)
     * @return 검증 성공 시 true
     */
    public static boolean isValid(
            String rawBodyUtf8,
            String webhookId,
            String webhookTimestamp,
            String webhookSignature,
            String webhookSecret) {
        return isValid(
                rawBodyUtf8,
                webhookId,
                webhookTimestamp,
                webhookSignature,
                webhookSecret,
                Instant.now(),
                DEFAULT_TOLERANCE_SECONDS);
    }

    /**
     * 포트원 V2 웹훅 서명을 검증한다.
     *
     * @param rawBodyUtf8       원시 요청 바디(UTF-8 문자열, 파싱 전과 동일해야 함)
     * @param webhookId         {@code webhook-id} 헤더
     * @param webhookTimestamp  {@code webhook-timestamp} 헤더 (unix 초)
     * @param webhookSignature  {@code webhook-signature} 헤더
     * @param webhookSecret     웹훅 시크릿 ({@code whsec_} + Base64, 또는 Base64)
     * @param now               타임스탬프 허용 오차의 기준 시각
     * @param toleranceSeconds  허용 오차(초). 음수이면 {@link #DEFAULT_TOLERANCE_SECONDS}
     * @return 검증 성공 시 true
     */
    public static boolean isValid(
            String rawBodyUtf8,
            String webhookId,
            String webhookTimestamp,
            String webhookSignature,
            String webhookSecret,
            Instant now,
            int toleranceSeconds) {
        if (rawBodyUtf8 == null || webhookId == null || webhookId.isBlank()
                || webhookTimestamp == null || webhookTimestamp.isBlank()
                || webhookSignature == null || webhookSignature.isBlank()
                || webhookSecret == null || webhookSecret.isBlank()) {
            return false;
        }
        String trimmedId = webhookId.trim();
        String trimmedTimestamp = webhookTimestamp.trim();
        if (trimmedId.isEmpty() || !isWithinTolerance(trimmedTimestamp, now, toleranceSeconds)) {
            return false;
        }
        byte[] key = decodeSecret(webhookSecret);
        if (key == null) {
            return false;
        }
        try {
            String signedContent = trimmedId + "." + trimmedTimestamp + "." + rawBodyUtf8;
            byte[] expectedMac = hmacSha256(key, signedContent);
            if (expectedMac == null) {
                return false;
            }
            return anySignatureMatches(webhookSignature, expectedMac);
        } finally {
            Arrays.fill(key, (byte) 0);
        }
    }

    private static boolean isWithinTolerance(String timestampHeader, Instant now, int toleranceSeconds) {
        final long timestampSeconds;
        try {
            timestampSeconds = Long.parseLong(timestampHeader);
        } catch (NumberFormatException e) {
            return false;
        }
        Instant effectiveNow = now == null ? Instant.now() : now;
        long tolerance = toleranceSeconds < 0 ? DEFAULT_TOLERANCE_SECONDS : toleranceSeconds;
        long nowSeconds = effectiveNow.getEpochSecond();
        if (nowSeconds - timestampSeconds > tolerance) {
            return false;
        }
        return timestampSeconds <= nowSeconds + tolerance;
    }

    private static byte[] decodeSecret(String webhookSecret) {
        String material = webhookSecret.trim();
        if (material.startsWith(SECRET_PREFIX)) {
            material = material.substring(SECRET_PREFIX.length());
        }
        if (material.isEmpty()) {
            return null;
        }
        try {
            byte[] key = Base64.getDecoder().decode(material);
            return key.length == 0 ? null : key;
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private static boolean anySignatureMatches(String webhookSignature, byte[] expectedMac) {
        String[] tokens = webhookSignature.trim().split(" ");
        for (String token : tokens) {
            if (token == null || token.isEmpty()) {
                continue;
            }
            int comma = token.indexOf(',');
            if (comma <= 0 || comma >= token.length() - 1) {
                continue;
            }
            String version = token.substring(0, comma);
            if (!SIGNATURE_VERSION_V1.equals(version)) {
                continue;
            }
            byte[] actualMac;
            try {
                actualMac = Base64.getDecoder().decode(token.substring(comma + 1).trim());
            } catch (IllegalArgumentException e) {
                continue;
            }
            if (MessageDigest.isEqual(expectedMac, actualMac)) {
                return true;
            }
        }
        return false;
    }

    private static byte[] hmacSha256(byte[] key, String message) {
        try {
            Mac mac = Mac.getInstance(HMAC_SHA256);
            mac.init(new SecretKeySpec(key, HMAC_SHA256));
            return mac.doFinal(message.getBytes(StandardCharsets.UTF_8));
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            return null;
        }
    }
}

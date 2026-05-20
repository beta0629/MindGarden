package com.coresolution.consultation.integration.solapi;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.format.DateTimeFormatter;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.stereotype.Component;

/**
 * 솔라피(Solapi/CoolSMS) 공통 HMAC 서명 유틸.
 *
 * <p>알고리즘: {@code HMAC-SHA256(apiSecret, date + salt)} → 16진수 인코딩.<br>
 * 헤더: {@code Authorization: HMAC-SHA256 apiKey=..., date=..., salt=..., signature=...}.
 *
 * <p>SMS·알림톡 등 솔라피 기반 채널이 공유한다. public API 시그니처는 안정적으로 유지하고,
 * 변경이 필요하면 호출자(SMS Provider, 알림톡 Provider 등)와 함께 검토한다.
 *
 * @author CoreSolution
 * @since 2026-05-20
 */
@Component
public class SolapiSignatureSigner {

    /** HMAC-SHA256 알고리즘 식별자. */
    public static final String HMAC_ALGORITHM = "HmacSHA256";

    /** Solapi 인증 스킴. */
    public static final String AUTH_SCHEME = "HMAC-SHA256";

    /** Solapi 인증 헤더명. */
    public static final String AUTH_HEADER = "Authorization";

    private static final int SALT_LENGTH = 32;

    private static final char[] HEX_CHARS = "0123456789abcdef".toCharArray();

    private final SecureRandom secureRandom = new SecureRandom();

    /**
     * 현재 시각·임의 salt로 솔라피 인증 헤더값을 생성한다.
     *
     * @param apiKey    Solapi API Key
     * @param apiSecret Solapi API Secret
     * @return Authorization 헤더값
     */
    public String buildAuthorizationHeader(String apiKey, String apiSecret) {
        return buildAuthorizationHeader(apiKey, apiSecret, currentDate(), generateSalt());
    }

    /**
     * 호출자가 결정한 date·salt로 인증 헤더값을 생성한다(테스트·재현 용도).
     *
     * @param apiKey    Solapi API Key
     * @param apiSecret Solapi API Secret
     * @param date      ISO-8601 UTC 날짜 문자열
     * @param salt      12자 이상의 임의 문자열
     * @return Authorization 헤더값
     */
    public String buildAuthorizationHeader(String apiKey, String apiSecret, String date, String salt) {
        validate(apiKey, apiSecret, date, salt);
        String signature = sign(apiSecret, date, salt);
        return String.format(
            "%s apiKey=%s, date=%s, salt=%s, signature=%s",
            AUTH_SCHEME, apiKey, date, salt, signature);
    }

    /**
     * 결정 가능한 HMAC-SHA256 서명값(소문자 hex)을 반환한다.
     *
     * @param apiSecret Solapi API Secret
     * @param date      ISO-8601 UTC 날짜 문자열
     * @param salt      임의 salt
     * @return hex 인코딩된 서명
     */
    public String sign(String apiSecret, String date, String salt) {
        if (apiSecret == null || apiSecret.isEmpty()) {
            throw new IllegalArgumentException("apiSecret must not be empty");
        }
        if (date == null || date.isEmpty()) {
            throw new IllegalArgumentException("date must not be empty");
        }
        if (salt == null || salt.isEmpty()) {
            throw new IllegalArgumentException("salt must not be empty");
        }

        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(apiSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] hash = mac.doFinal((date + salt).getBytes(StandardCharsets.UTF_8));
            return toHex(hash);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("Failed to build Solapi HMAC signature", e);
        }
    }

    /**
     * 현재 UTC 시각을 ISO-8601(밀리초) 형식으로 반환한다.
     *
     * @return ISO-8601 문자열
     */
    public String currentDate() {
        return DateTimeFormatter.ISO_INSTANT.format(Instant.now());
    }

    /**
     * 32자 hex salt를 생성한다.
     *
     * @return 32자 소문자 hex
     */
    public String generateSalt() {
        byte[] bytes = new byte[SALT_LENGTH / 2];
        secureRandom.nextBytes(bytes);
        return toHex(bytes);
    }

    private static void validate(String apiKey, String apiSecret, String date, String salt) {
        if (apiKey == null || apiKey.isEmpty()) {
            throw new IllegalArgumentException("apiKey must not be empty");
        }
        if (apiSecret == null || apiSecret.isEmpty()) {
            throw new IllegalArgumentException("apiSecret must not be empty");
        }
        if (date == null || date.isEmpty()) {
            throw new IllegalArgumentException("date must not be empty");
        }
        if (salt == null || salt.length() < 12) {
            throw new IllegalArgumentException("salt must be at least 12 characters");
        }
    }

    private static String toHex(byte[] bytes) {
        char[] out = new char[bytes.length * 2];
        for (int i = 0; i < bytes.length; i++) {
            int v = bytes[i] & 0xff;
            out[i * 2] = HEX_CHARS[v >>> 4];
            out[i * 2 + 1] = HEX_CHARS[v & 0x0f];
        }
        return new String(out);
    }
}

package com.coresolution.consultation.security.pii;

import java.nio.charset.StandardCharsets;
import java.security.InvalidKeyException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Clinic-OS 공통 PII 검색 해시 (HMAC-SHA256).
 *
 * <p>신규 쓰기는 HMAC-SHA256 hex. 조회는 HMAC 또는 레거시 SHA-256 dual-verify.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
@Component
public class PiiHmacService {

    private static final String HMAC_ALGORITHM = "HmacSHA256";
    private static final String SHA_ALGORITHM = "SHA-256";

    private final String hmacSecret;

    /**
     * @param hmacSecret {@code encryption.personal-data.hmac-secret} /
     *                   {@code PERSONAL_DATA_HMAC_SECRET}
     */
    public PiiHmacService(
        @Value("${encryption.personal-data.hmac-secret:}") String hmacSecret) {
        this.hmacSecret = hmacSecret == null ? "" : hmacSecret;
    }

    /**
     * HMAC 시크릿이 설정되었는지 여부.
     *
     * @return 시크릿이 있으면 true
     */
    public boolean hasSecret() {
        return StringUtils.hasText(hmacSecret);
    }

    /**
     * HMAC-SHA256 hex (소문자 64자). 쓰기 경로 — 시크릿 없으면 fail-closed.
     *
     * @param raw 평문 (전화·이메일·토큰·IP 등)
     * @return hex 해시, raw null 이면 null
     * @throws IllegalStateException 시크릿 미설정
     */
    public String hmacHex(String raw) {
        if (raw == null) {
            return null;
        }
        if (!hasSecret()) {
            throw new IllegalStateException(
                "PERSONAL_DATA_HMAC_SECRET 미설정 — PII 해시 쓰기 금지 (fail-closed)");
        }
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(hmacSecret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] digest = mac.doFinal(raw.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException | InvalidKeyException e) {
            throw new IllegalStateException("HMAC-SHA256 계산 실패", e);
        }
    }

    /**
     * 레거시 SHA-256 hex (전환기 dual-verify / 러너 비교용).
     *
     * @param raw 평문
     * @return 소문자 hex 64자, raw null 이면 null
     */
    public String legacySha256Hex(String raw) {
        if (raw == null) {
            return null;
        }
        try {
            MessageDigest md = MessageDigest.getInstance(SHA_ALGORITHM);
            byte[] bytes = md.digest(raw.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder(bytes.length * 2);
            for (byte b : bytes) {
                sb.append(String.format(Locale.ROOT, "%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 미지원 — JRE 비정상", e);
        }
    }

    /**
     * 저장된 해시가 raw 의 HMAC 또는 레거시 SHA-256 과 일치하는지 검증.
     *
     * @param raw    평문
     * @param stored DB 저장 해시
     * @return 일치하면 true
     */
    public boolean matches(String raw, String stored) {
        if (raw == null || !StringUtils.hasText(stored)) {
            return false;
        }
        if (hasSecret()) {
            try {
                if (constantTimeEquals(hmacHex(raw), stored)) {
                    return true;
                }
            } catch (IllegalStateException e) {
                log.debug("HMAC 비교 스킵: {}", e.getMessage());
            }
        }
        return constantTimeEquals(legacySha256Hex(raw), stored);
    }

    /**
     * 조회용 후보 해시 목록 (HMAC 우선, 레거시 SHA 보조).
     *
     * @param raw 평문
     * @return 1~2개 후보 (null raw 이면 빈 배열)
     */
    public String[] lookupCandidates(String raw) {
        if (raw == null) {
            return new String[0];
        }
        String legacy = legacySha256Hex(raw);
        if (hasSecret()) {
            return new String[] { hmacHex(raw), legacy };
        }
        return new String[] { legacy };
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }
        if (a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }
}

package com.coresolution.consultation.security.pii;

import java.util.regex.Pattern;
import org.springframework.util.StringUtils;

/**
 * PII 암호문 버전 마커 판별 헬퍼 (v1 CBC / v2 GCM).
 *
 * <p>형식:</p>
 * <ul>
 *   <li>v1 (읽기 전용 레거시): {@code {keyId}::{base64}}</li>
 *   <li>v2 (신규 쓰기): {@code {keyId}:v2::{base64(nonce||ct||tag)}}</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
public final class PiiCipherFormats {

    /** 버전 구분자. */
    public static final String VERSION_DELIMITER = "::";

    /** v2 마커 접미사 ({@code {keyId}:v2}). */
    public static final String RANDOM_IV_VERSION_SUFFIX = ":v2";

    /**
     * 버전 마커 — v1 {@code {keyId}::{base64}} · v2 {@code {keyId}:v2::{base64}}.
     * keyId 는 영숫자·{@code _.-} 만 허용.
     */
    private static final Pattern ENCRYPTED_MARKER =
        Pattern.compile("^[A-Za-z0-9_.\\-]{1,32}(:v2)?::[A-Za-z0-9+/=\\r\\n]+$");

    private PiiCipherFormats() {
    }

    /**
     * 암호문 마커(v1 또는 v2) 여부.
     *
     * @param value 검사할 값
     * @return 마커 형식이면 true
     */
    public static boolean looksEncrypted(String value) {
        return value != null && ENCRYPTED_MARKER.matcher(value).matches();
    }

    /**
     * v2(GCM) 암호문 여부.
     *
     * @param value 검사할 값
     * @return v2 이면 true
     */
    public static boolean looksV2(String value) {
        if (!StringUtils.hasText(value)) {
            return false;
        }
        int delimiterIndex = value.indexOf(VERSION_DELIMITER);
        return delimiterIndex > 0
            && value.substring(0, delimiterIndex).endsWith(RANDOM_IV_VERSION_SUFFIX);
    }

    /**
     * v1(CBC) 암호문 여부 (마커는 있으나 v2 가 아님).
     *
     * @param value 검사할 값
     * @return v1 이면 true
     */
    public static boolean looksV1(String value) {
        return looksEncrypted(value) && !looksV2(value);
    }

    /**
     * 암호문에서 keyId 를 추출한다. v2 는 {@code :v2} 접미사를 제거한다.
     *
     * @param encryptedText 암호문
     * @return keyId. 마커가 없으면 null
     */
    public static String extractKeyId(String encryptedText) {
        if (!StringUtils.hasText(encryptedText) || !encryptedText.contains(VERSION_DELIMITER)) {
            return null;
        }
        int delimiterIndex = encryptedText.indexOf(VERSION_DELIMITER);
        if (delimiterIndex <= 0) {
            return null;
        }
        String marker = encryptedText.substring(0, delimiterIndex);
        if (marker.endsWith(RANDOM_IV_VERSION_SUFFIX)) {
            String keyId = marker.substring(0, marker.length() - RANDOM_IV_VERSION_SUFFIX.length());
            return keyId.isEmpty() ? null : keyId;
        }
        return marker;
    }

    /**
     * 복호화 결과가 평문인지 검증한다. 암호문 입력인데 복호화가 실패(원본 반환·암호문 유지·페이로드만 반환)
     * 하면 null 을 돌려 GCM 재암호화·HMAC 을 막는다.
     *
     * <p>평문 입력은 그대로 통과한다. {@code decrypt}/{@code safeDecrypt} 읽기 fail-open 은 유지하되,
     * 업그레이드·재암호화 경로에서만 이 가드를 사용한다.</p>
     *
     * @param original  복호화 전 값
     * @param decrypted {@code decryptCompatible} 결과
     * @return 평문으로 확신할 수 있으면 decrypted, 아니면 null
     */
    public static String requirePlaintextAfterDecrypt(String original, String decrypted) {
        if (!StringUtils.hasText(original)) {
            return null;
        }
        if (!looksEncrypted(original)) {
            return decrypted;
        }
        if (!StringUtils.hasText(decrypted)) {
            return null;
        }
        if (decrypted.equals(original) || looksEncrypted(decrypted)) {
            return null;
        }
        // 키 부재 시 decrypt 가 마커를 벗긴 base64 페이로드만 반환하는 fail-open
        int delimiterIndex = original.indexOf(VERSION_DELIMITER);
        if (delimiterIndex > 0) {
            String payload = original.substring(delimiterIndex + VERSION_DELIMITER.length());
            if (payload.equals(decrypted)) {
                return null;
            }
        }
        return decrypted;
    }
}

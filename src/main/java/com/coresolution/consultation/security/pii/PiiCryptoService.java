package com.coresolution.consultation.security.pii;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Collection;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import com.coresolution.consultation.util.PersonalDataEncryptionKeyProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Clinic-OS 공통 PII 암복호화 서비스 (AES-256/GCM 쓰기 SSOT).
 *
 * <p>신규 쓰기는 항상 AES-256/GCM + 12바이트 랜덤 nonce (v2).
 * 읽기는 v2 · 레거시 v1(CBC 고정 IV) · 평문을 호환한다.
 * 키 부재·암호화 예외 시 평문 반환 없이 fail-closed 한다.</p>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PiiCryptoService {

    private static final String ALGORITHM_CBC = "AES/CBC/PKCS5Padding";
    private static final String ALGORITHM_GCM = "AES/GCM/NoPadding";
    private static final int GCM_NONCE_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    private static final String LEGACY_PREFIX = "legacy::";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PersonalDataEncryptionKeyProvider keyProvider;

    /**
     * 활성 AES 키가 준비되었는지 여부.
     *
     * @return 활성 키가 있으면 true
     */
    public boolean hasActiveKey() {
        return keyProvider.getActiveKey() != null;
    }

    /**
     * AES-256/GCM(v2) 암호화. 신규 쓰기 전용.
     *
     * @param plainText 평문
     * @return {@code {keyId}:v2::{base64(nonce||ct||tag)}}
     * @throws IllegalStateException 키 없음·암호화 실패 (평문 반환 금지)
     */
    public String encryptGcm(String plainText) {
        if (plainText == null || plainText.trim().isEmpty()) {
            return plainText;
        }

        try {
            PersonalDataEncryptionKeyProvider.KeyMaterial keyMaterial = keyProvider.getActiveKey();
            if (keyMaterial == null) {
                throw new IllegalStateException("활성 암호화 키를 찾을 수 없습니다.");
            }

            byte[] nonce = new byte[GCM_NONCE_LENGTH_BYTES];
            SECURE_RANDOM.nextBytes(nonce);

            Cipher cipher = Cipher.getInstance(ALGORITHM_GCM);
            cipher.init(Cipher.ENCRYPT_MODE, keyMaterial.getSecretKey(),
                new GCMParameterSpec(GCM_TAG_LENGTH_BITS, nonce));

            byte[] cipherBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            byte[] payload = new byte[nonce.length + cipherBytes.length];
            System.arraycopy(nonce, 0, payload, 0, nonce.length);
            System.arraycopy(cipherBytes, 0, payload, nonce.length, cipherBytes.length);

            return keyMaterial.getKeyId() + PiiCipherFormats.RANDOM_IV_VERSION_SUFFIX
                + PiiCipherFormats.VERSION_DELIMITER
                + Base64.getEncoder().encodeToString(payload);

        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            log.error("PII GCM 암호화 실패: {}", e.getMessage());
            throw new IllegalStateException("개인정보 암호화에 실패했습니다.", e);
        }
    }

    /**
     * 신규 쓰기 암호화 — 항상 GCM(v2).
     *
     * @param plainText 평문
     * @return v2 암호문
     */
    public String encrypt(String plainText) {
        return encryptGcm(plainText);
    }

    /**
     * 호환 복호화 — v2 GCM · v1 CBC · 평문.
     *
     * @param encryptedText 암호문 또는 평문
     * @return 평문 (실패 시 원본 반환 — 읽기 허용)
     */
    public String decryptCompatible(String encryptedText) {
        return decrypt(encryptedText);
    }

    /**
     * 개인정보 복호화 (v1 · v2 · 평문 혼재).
     *
     * @param encryptedText 복호화할 값
     * @return 복호화된 평문 또는 원본
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.trim().isEmpty()) {
            return encryptedText;
        }

        try {
            if (encryptedText.contains(PiiCipherFormats.VERSION_DELIMITER)) {
                return decryptWithVersionedCipher(encryptedText);
            }
            return decryptWithFallbackKeys(encryptedText);
        } catch (Exception e) {
            log.debug("복호화 실패, 평문 데이터로 처리");
            return encryptedText;
        }
    }

    /**
     * 이미 암호문이면 활성 키 v2 로 보장하고, 평문이면 GCM 암호화.
     *
     * @param text 평문 또는 암호문
     * @return 활성 키 v2 암호문
     */
    public String safeEncrypt(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }
        return ensureActiveKeyEncryption(text);
    }

    /**
     * 안전한 복호화 (암호화되지 않은 경우 그대로 반환).
     *
     * <p>버전 마커 암호문 복호화에 실패하면 마커가 벗겨진 페이로드가 아니라
     * <strong>원본 암호문 문자열</strong>을 반환한다. (JPA flush 재암호화 파괴 방지)</p>
     *
     * @param text 복호화할 텍스트
     * @return 평문 또는 (복호화 실패 시) 원본 암호문
     */
    public String safeDecrypt(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }
        String result;
        if (!isEncrypted(text)) {
            result = text;
        } else {
            result = decrypt(text);
            String plain = PiiCipherFormats.requirePlaintextAfterDecrypt(text, result);
            if (plain == null) {
                return text;
            }
            result = plain;
        }
        if (result != null && result.startsWith(LEGACY_PREFIX)) {
            return result.substring(LEGACY_PREFIX.length());
        }
        return result;
    }

    /**
     * 활성 키 GCM(v2) 암호문으로 보장한다. 레거시 CBC/타 키는 재암호화한다.
     * 암호문인데 복호화 실패 시 fail-closed ({@link IllegalStateException}) —
     * ciphertext 를 GCM 으로 감싸지 않는다.
     *
     * <p><strong>JPA {@link PiiAttributeConverter} 쓰기 경로에서는 호출하지 않는다.</strong>
     * JDBC 배치·키 로테이션·레거시 업그레이드 전용이다. 컨버터는 평문만
     * {@link #encryptGcm(String)} 한다.</p>
     *
     * @param text 평문 또는 암호문
     * @return 활성 키 v2 암호문
     * @throws IllegalStateException 암호문 복호화 실패
     */
    public String ensureActiveKeyEncryption(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        if (PiiCipherFormats.looksV2(text) && isEncryptedWithActiveKey(text)) {
            return text;
        }

        if (PiiCipherFormats.looksEncrypted(text)) {
            String decrypted = decryptCompatible(text);
            String plain = PiiCipherFormats.requirePlaintextAfterDecrypt(text, decrypted);
            if (plain == null) {
                throw new IllegalStateException(
                    "PII 재암호화 실패: 암호문을 복호화할 수 없습니다 (키링 불일치 가능).");
            }
            return encryptGcm(plain);
        }

        return encryptGcm(text);
    }

    /**
     * 암호화된 데이터인지 확인.
     *
     * @param text 확인할 텍스트
     * @return 암호화된 데이터 여부
     */
    public boolean isEncrypted(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        if (text.contains(PiiCipherFormats.VERSION_DELIMITER)) {
            String version = extractKeyVersion(text);
            return StringUtils.hasText(version) && keyProvider.hasKey(version);
        }

        try {
            Base64.getDecoder().decode(text);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * 활성 키로 암호화되었는지 확인.
     *
     * @param text 검사할 값
     * @return 활성 키 암호문이면 true
     */
    public boolean isEncryptedWithActiveKey(String text) {
        if (!isEncrypted(text)) {
            return false;
        }
        String version = extractKeyVersion(text);
        if (!StringUtils.hasText(version)) {
            return false;
        }
        return keyProvider.getActiveKeyId().equals(version);
    }

    /**
     * 암호문에서 키 ID 추출.
     *
     * @param encryptedText 암호문
     * @return keyId
     */
    public String extractKeyVersion(String encryptedText) {
        return PiiCipherFormats.extractKeyId(encryptedText);
    }

    /**
     * v2(GCM) 암호문 여부.
     *
     * @param text 검사할 값
     * @return v2 이면 true
     */
    public boolean isRandomIvEncrypted(String text) {
        return PiiCipherFormats.looksV2(text);
    }

    /**
     * 활성 키 ID.
     *
     * @return 활성 키 ID
     */
    public String getActiveKeyId() {
        return keyProvider.getActiveKeyId();
    }

    /**
     * 이름 마스킹.
     *
     * @param name 원본 이름
     * @return 마스킹된 이름
     */
    public String maskName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }
        if (name.length() <= 1) {
            return name;
        }
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }

    /**
     * 이메일 마스킹.
     *
     * @param email 원본 이메일
     * @return 마스킹된 이메일
     */
    public String maskEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return email;
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 1) {
            return email;
        }
        String localPart = email.substring(0, atIndex);
        String domainPart = email.substring(atIndex);
        if (localPart.length() <= 2) {
            return email;
        }
        String maskedLocalPart = localPart.charAt(0)
            + "*".repeat(localPart.length() - 2)
            + localPart.charAt(localPart.length() - 1);
        return maskedLocalPart + domainPart;
    }

    /**
     * 레거시 CBC(v1) 암호화 — 테스트·호환 검증용. 신규 쓰기 경로에서는 사용하지 않는다.
     *
     * @param plainText 평문
     * @return v1 암호문
     */
    public String encryptCbcForLegacyCompat(String plainText) {
        if (plainText == null || plainText.trim().isEmpty()) {
            return plainText;
        }
        try {
            PersonalDataEncryptionKeyProvider.KeyMaterial keyMaterial = keyProvider.getActiveKey();
            if (keyMaterial == null) {
                throw new IllegalStateException("활성 암호화 키를 찾을 수 없습니다.");
            }
            Cipher cipher = Cipher.getInstance(ALGORITHM_CBC);
            cipher.init(Cipher.ENCRYPT_MODE, keyMaterial.getSecretKey(), keyMaterial.getIv());
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return keyMaterial.getKeyId() + PiiCipherFormats.VERSION_DELIMITER
                + Base64.getEncoder().encodeToString(encryptedBytes);
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException("레거시 CBC 암호화 실패", e);
        }
    }

    private String decryptWithVersionedCipher(String encryptedText) throws Exception {
        int delimiterIndex = encryptedText.indexOf(PiiCipherFormats.VERSION_DELIMITER);
        String marker = encryptedText.substring(0, delimiterIndex);
        String cipherPayload = encryptedText.substring(
            delimiterIndex + PiiCipherFormats.VERSION_DELIMITER.length());
        boolean randomIv = marker.endsWith(PiiCipherFormats.RANDOM_IV_VERSION_SUFFIX);
        String keyId = randomIv
            ? marker.substring(0, marker.length() - PiiCipherFormats.RANDOM_IV_VERSION_SUFFIX.length())
            : marker;

        PersonalDataEncryptionKeyProvider.KeyMaterial keyMaterial = keyProvider.getKey(keyId);
        if (keyMaterial == null) {
            log.warn("암호화 키를 찾을 수 없습니다. keyId={}", keyId);
            String fallback = randomIv
                ? decryptWithRandomIvFallbackKeys(cipherPayload)
                : decryptWithFallbackKeys(cipherPayload);
            // 실패 시 마커 제거된 페이로드가 아니라 원본 암호문 전체 반환
            if (cipherPayload.equals(fallback)) {
                return encryptedText;
            }
            return fallback;
        }

        return randomIv
            ? decryptWithRandomIvMaterial(cipherPayload, keyMaterial)
            : decryptWithMaterial(cipherPayload, keyMaterial);
    }

    private String decryptWithRandomIvFallbackKeys(String cipherPayload) throws Exception {
        Collection<PersonalDataEncryptionKeyProvider.KeyMaterial> candidates =
            keyProvider.getAllKeysByPriority();
        for (PersonalDataEncryptionKeyProvider.KeyMaterial material : candidates) {
            try {
                return decryptWithRandomIvMaterial(cipherPayload, material);
            } catch (Exception e) {
                log.debug("암호화 키({})로 v2 복호화 실패: {}", material.getKeyId(), e.getMessage());
            }
        }
        log.debug("v2 복호화 가능한 키를 찾지 못했습니다. 원본 암호문을 유지합니다.");
        return cipherPayload;
    }

    private String decryptWithRandomIvMaterial(String cipherPayload,
        PersonalDataEncryptionKeyProvider.KeyMaterial material) throws Exception {
        byte[] payload = Base64.getDecoder().decode(cipherPayload);
        if (payload.length <= GCM_NONCE_LENGTH_BYTES) {
            throw new IllegalArgumentException("v2 암호문 길이가 nonce 보다 짧습니다.");
        }
        byte[] nonce = new byte[GCM_NONCE_LENGTH_BYTES];
        System.arraycopy(payload, 0, nonce, 0, GCM_NONCE_LENGTH_BYTES);
        byte[] cipherBytes = new byte[payload.length - GCM_NONCE_LENGTH_BYTES];
        System.arraycopy(payload, GCM_NONCE_LENGTH_BYTES, cipherBytes, 0, cipherBytes.length);

        Cipher cipher = Cipher.getInstance(ALGORITHM_GCM);
        cipher.init(Cipher.DECRYPT_MODE, material.getSecretKey(),
            new GCMParameterSpec(GCM_TAG_LENGTH_BITS, nonce));
        return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
    }

    private String decryptWithFallbackKeys(String cipherText) throws Exception {
        Collection<PersonalDataEncryptionKeyProvider.KeyMaterial> candidates =
            keyProvider.getAllKeysByPriority();
        for (PersonalDataEncryptionKeyProvider.KeyMaterial material : candidates) {
            try {
                return decryptWithMaterial(cipherText, material);
            } catch (Exception e) {
                log.debug("암호화 키({})로 복호화 실패: {}", material.getKeyId(), e.getMessage());
            }
        }
        log.debug("복호화 가능한 키를 찾지 못했습니다. 평문으로 간주합니다.");
        return cipherText;
    }

    private String decryptWithMaterial(String cipherPayload,
        PersonalDataEncryptionKeyProvider.KeyMaterial material) throws Exception {
        Cipher cipher = Cipher.getInstance(ALGORITHM_CBC);
        cipher.init(Cipher.DECRYPT_MODE, material.getSecretKey(), material.getIv());
        byte[] encryptedBytes = Base64.getDecoder().decode(cipherPayload);
        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}

package com.coresolution.consultation.util;

import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Collection;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * 개인정보 암호화/복호화 유틸리티
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PersonalDataEncryptionUtil {

    /** v1 — 키별 고정 IV. 같은 평문이 같은 암호문이 되어 동등 비교 조회(이메일·전화)가 가능하다. */
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    /** v2 — 메시지별 랜덤 nonce. 동등 비교 불가, 서술형 본문 전용. */
    private static final String ALGORITHM_RANDOM_IV = "AES/GCM/NoPadding";
    private static final String VERSION_DELIMITER = "::";
    /** v2 암호문 접두어는 {@code {keyId}:v2::} 형태 */
    private static final String RANDOM_IV_VERSION_SUFFIX = ":v2";
    private static final int GCM_NONCE_LENGTH_BYTES = 12;
    private static final int GCM_TAG_LENGTH_BITS = 128;
    /** legacy 마이그레이션 시 DB에 저장된 접두어. 복호화 불가 시 제거 후 평문만 반환용 */
    private static final String LEGACY_PREFIX = "legacy::";

    private static final SecureRandom SECURE_RANDOM = new SecureRandom();

    private final PersonalDataEncryptionKeyProvider keyProvider;

    /**
     * 개인정보 암호화
     * 
     * @param plainText 암호화할 평문
     * @return 암호화된 문자열 (Base64 인코딩)
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.trim().isEmpty()) {
            return plainText;
        }
        
        try {
            PersonalDataEncryptionKeyProvider.KeyMaterial keyMaterial = keyProvider.getActiveKey();
            if (keyMaterial == null) {
                throw new IllegalStateException("활성 암호화 키를 찾을 수 없습니다.");
            }

            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, keyMaterial.getSecretKey(), keyMaterial.getIv());

            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            String cipherText = Base64.getEncoder().encodeToString(encryptedBytes);
            return keyMaterial.getKeyId() + VERSION_DELIMITER + cipherText;

        } catch (Exception e) {
            log.error("개인정보 암호화 실패: {}", e.getMessage(), e);
            throw new RuntimeException("개인정보 암호화에 실패했습니다.", e);
        }
    }
    
    /**
     * 메시지별 랜덤 IV 암호화 (AES-GCM, v2).
     *
     * <p>{@link #encrypt(String)} 는 키별 고정 IV 라 같은 평문이 항상 같은 암호문이 된다.
     * 동등 비교 조회가 필요 없는 <strong>서술형 본문</strong>(상담일지 본문·초안 payload·
     * 상담 녹취 등) 은 이 메서드를 써서 같은 평문도 매번 다른 암호문이 되게 한다.</p>
     *
     * <p>출력 형식: {@code {keyId}:v2::base64(nonce(12B) || ciphertext || tag(16B))}.
     * {@link #decrypt(String)} 가 v1·v2·평문을 모두 읽으므로 전환 중 혼재가 허용된다.</p>
     *
     * @param plainText 암호화할 평문 (null·빈 문자열은 그대로 반환)
     * @return v2 마커가 붙은 암호문
     * @throws RuntimeException 활성 키가 없거나 암호화에 실패한 경우
     */
    public String encryptWithRandomIv(String plainText) {
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

            Cipher cipher = Cipher.getInstance(ALGORITHM_RANDOM_IV);
            cipher.init(Cipher.ENCRYPT_MODE, keyMaterial.getSecretKey(),
                new GCMParameterSpec(GCM_TAG_LENGTH_BITS, nonce));

            byte[] cipherBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            byte[] payload = new byte[nonce.length + cipherBytes.length];
            System.arraycopy(nonce, 0, payload, 0, nonce.length);
            System.arraycopy(cipherBytes, 0, payload, nonce.length, cipherBytes.length);

            return keyMaterial.getKeyId() + RANDOM_IV_VERSION_SUFFIX + VERSION_DELIMITER
                + Base64.getEncoder().encodeToString(payload);

        } catch (Exception e) {
            log.error("개인정보 랜덤 IV 암호화 실패: {}", e.getMessage(), e);
            throw new RuntimeException("개인정보 암호화에 실패했습니다.", e);
        }
    }

    /**
     * 개인정보 복호화 (v1 고정 IV · v2 랜덤 IV · 평문 혼재 모두 처리)
     * 
     * @param encryptedText 복호화할 암호문 (Base64 인코딩)
     * @return 복호화된 평문
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.trim().isEmpty()) {
            return encryptedText;
        }
        
        try {
            if (encryptedText.contains(VERSION_DELIMITER)) {
                return decryptWithVersionedCipher(encryptedText);
            }

            // legacy data (Base64 without version)
            return decryptWithFallbackKeys(encryptedText);

        } catch (Exception e) {
            log.debug("복호화 실패, 평문 데이터로 처리: {}", encryptedText);
            return encryptedText;
        }
    }
    
    /**
     * 이름 마스킹 처리
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
     * 이메일 마스킹 처리
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
        
        String maskedLocalPart = localPart.charAt(0) + "*".repeat(localPart.length() - 2) + localPart.charAt(localPart.length() - 1);
        return maskedLocalPart + domainPart;
    }
    
    /**
     * 암호화 키 생성
     */
    /**
     * 암호화된 데이터인지 확인
     *
     * @param text 확인할 텍스트
     * @return 암호화된 데이터 여부
     */
    public boolean isEncrypted(String text) {
        if (text == null || text.trim().isEmpty()) {
            return false;
        }

        if (text.contains(VERSION_DELIMITER)) {
            String version = extractKeyVersion(text);
            return StringUtils.hasText(version) && keyProvider.hasKey(version);
        }

        // legacy format: Base64 string (may fail)
        try {
            Base64.getDecoder().decode(text);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    /**
     * 지정된 텍스트가 활성 키로 암호화 되었는지 확인
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
     * 안전한 암호화 (이미 암호화된 경우 활성 키 사용 여부에 따라 재암호화)
     *
     * @param text 암호화할 텍스트
     * @return 암호화된 텍스트
     */
    public String safeEncrypt(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        return ensureActiveKeyEncryption(text);
    }

    /**
     * 안전한 복호화 (암호화되지 않은 경우 그대로 반환)
     *
     * @param text 복호화할 텍스트
     * @return 복호화된 텍스트
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
        }
        // 키 없음/복호화 실패로 legacy:: 접두어가 남은 경우 제거 후 평문만 반환
        if (result != null && result.startsWith(LEGACY_PREFIX)) {
            return result.substring(LEGACY_PREFIX.length());
        }
        return result;
    }

    /**
     * 활성 키로 암호화되도록 보장한다. (필요 시 재암호화 수행)
     */
    public String ensureActiveKeyEncryption(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }

        if (!isEncrypted(text)) {
            return encrypt(text);
        }

        if (isEncryptedWithActiveKey(text)) {
            return text;
        }

        // 회전 시에도 암호화 방식(v1 고정 IV / v2 랜덤 IV)은 유지한다.
        // v2 를 v1 로 되돌리면 서술형 본문이 다시 동등 비교 가능한 암호문이 된다.
        boolean randomIv = isRandomIvEncrypted(text);
        String decrypted = decrypt(text);
        return randomIv ? encryptWithRandomIv(decrypted) : encrypt(decrypted);
    }

    /**
     * 암호화 데이터에서 키 ID 를 추출한다. v2({@code {keyId}:v2::}) 는 버전 접미사를 떼고 돌려준다.
     *
     * @param encryptedText 암호문
     * @return keyId. 마커가 없으면 null
     */
    public String extractKeyVersion(String encryptedText) {
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
     * 메시지별 랜덤 IV(v2) 로 암호화된 값인지 여부.
     *
     * @param text 검사할 값
     * @return v2 마커를 가진 암호문이면 true
     */
    public boolean isRandomIvEncrypted(String text) {
        if (!StringUtils.hasText(text)) {
            return false;
        }
        int delimiterIndex = text.indexOf(VERSION_DELIMITER);
        return delimiterIndex > 0 && text.substring(0, delimiterIndex).endsWith(RANDOM_IV_VERSION_SUFFIX);
    }

    public String getActiveKeyId() {
        return keyProvider.getActiveKeyId();
    }

    private String decryptWithVersionedCipher(String encryptedText) throws Exception {
        int delimiterIndex = encryptedText.indexOf(VERSION_DELIMITER);
        String marker = encryptedText.substring(0, delimiterIndex);
        String cipherPayload = encryptedText.substring(delimiterIndex + VERSION_DELIMITER.length());
        boolean randomIv = marker.endsWith(RANDOM_IV_VERSION_SUFFIX);
        String keyId = randomIv
            ? marker.substring(0, marker.length() - RANDOM_IV_VERSION_SUFFIX.length())
            : marker;

        PersonalDataEncryptionKeyProvider.KeyMaterial keyMaterial = keyProvider.getKey(keyId);
        if (keyMaterial == null) {
            log.warn("⚠️ 암호화 키를 찾을 수 없습니다. keyId={}", keyId);
            return randomIv
                ? decryptWithRandomIvFallbackKeys(cipherPayload)
                : decryptWithFallbackKeys(cipherPayload);
        }

        return randomIv
            ? decryptWithRandomIvMaterial(cipherPayload, keyMaterial)
            : decryptWithMaterial(cipherPayload, keyMaterial);
    }

    private String decryptWithRandomIvFallbackKeys(String cipherPayload) throws Exception {
        Collection<PersonalDataEncryptionKeyProvider.KeyMaterial> candidates = keyProvider.getAllKeysByPriority();
        for (PersonalDataEncryptionKeyProvider.KeyMaterial material : candidates) {
            try {
                return decryptWithRandomIvMaterial(cipherPayload, material);
            } catch (Exception e) {
                log.debug("암호화 키({})로 v2 복호화 실패: {}", material.getKeyId(), e.getMessage());
            }
        }
        log.debug("v2 복호화 가능한 키를 찾지 못했습니다. 원본을 그대로 반환합니다.");
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

        Cipher cipher = Cipher.getInstance(ALGORITHM_RANDOM_IV);
        cipher.init(Cipher.DECRYPT_MODE, material.getSecretKey(),
            new GCMParameterSpec(GCM_TAG_LENGTH_BITS, nonce));
        return new String(cipher.doFinal(cipherBytes), StandardCharsets.UTF_8);
    }

    private String decryptWithFallbackKeys(String cipherText) throws Exception {
        Collection<PersonalDataEncryptionKeyProvider.KeyMaterial> candidates = keyProvider.getAllKeysByPriority();
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

    private String decryptWithMaterial(String cipherPayload, PersonalDataEncryptionKeyProvider.KeyMaterial material)
        throws Exception {
        Cipher cipher = Cipher.getInstance(ALGORITHM);
        cipher.init(Cipher.DECRYPT_MODE, material.getSecretKey(), material.getIv());
        byte[] encryptedBytes = Base64.getDecoder().decode(cipherPayload);
        byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
        return new String(decryptedBytes, StandardCharsets.UTF_8);
    }
}

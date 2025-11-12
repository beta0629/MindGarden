package com.mindgarden.consultation.util;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Collection;
import javax.crypto.Cipher;
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

    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String VERSION_DELIMITER = "::";

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
     * 개인정보 복호화
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
        
        // 암호화되지 않은 경우 그대로 반환
        if (!isEncrypted(text)) {
            return text;
        }
        
        return decrypt(text);
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

        String decrypted = decrypt(text);
        return encrypt(decrypted);
    }

    /**
     * 암호화 데이터에서 키 버전을 추출한다.
     */
    public String extractKeyVersion(String encryptedText) {
        if (!StringUtils.hasText(encryptedText) || !encryptedText.contains(VERSION_DELIMITER)) {
            return null;
        }
        int delimiterIndex = encryptedText.indexOf(VERSION_DELIMITER);
        if (delimiterIndex <= 0) {
            return null;
        }
        return encryptedText.substring(0, delimiterIndex);
    }

    public String getActiveKeyId() {
        return keyProvider.getActiveKeyId();
    }

    private String decryptWithVersionedCipher(String encryptedText) throws Exception {
        int delimiterIndex = encryptedText.indexOf(VERSION_DELIMITER);
        String keyId = encryptedText.substring(0, delimiterIndex);
        String cipherPayload = encryptedText.substring(delimiterIndex + VERSION_DELIMITER.length());

        PersonalDataEncryptionKeyProvider.KeyMaterial keyMaterial = keyProvider.getKey(keyId);
        if (keyMaterial == null) {
            log.warn("⚠️ 암호화 키를 찾을 수 없습니다. keyId={}", keyId);
            return decryptWithFallbackKeys(cipherPayload);
        }

        return decryptWithMaterial(cipherPayload, keyMaterial);
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

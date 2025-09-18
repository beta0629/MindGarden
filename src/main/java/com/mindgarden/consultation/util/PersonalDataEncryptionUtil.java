package com.mindgarden.consultation.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import lombok.extern.slf4j.Slf4j;

/**
 * 개인정보 암호화/복호화 유틸리티
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
public class PersonalDataEncryptionUtil {

    @Value("${encryption.personal-data.key:MindGarden2025SecretKey!@#}")
    private String encryptionKey;
    
    @Value("${encryption.personal-data.iv:MindGarden2025IV!@#789}")
    private String encryptionIv;
    
    private static final String ALGORITHM = "AES/CBC/PKCS5Padding";
    private static final String KEY_ALGORITHM = "AES";
    
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
        
        if (encryptionKey == null || encryptionKey.trim().isEmpty()) {
            throw new IllegalArgumentException("암호화 키가 설정되지 않았습니다.");
        }
        
        if (encryptionIv == null || encryptionIv.trim().isEmpty()) {
            throw new IllegalArgumentException("암호화 IV가 설정되지 않았습니다.");
        }
        
        try {
            // 키와 IV 생성
            SecretKeySpec secretKey = generateKey();
            IvParameterSpec iv = generateIv();
            
            // 암호화
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey, iv);
            
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
            
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
            // Base64 디코딩 시도
            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedText);
            
            // 키와 IV 생성
            SecretKeySpec secretKey = generateKey();
            IvParameterSpec iv = generateIv();
            
            // 복호화
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, secretKey, iv);
            
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            
            return new String(decryptedBytes, StandardCharsets.UTF_8);
            
        } catch (IllegalArgumentException e) {
            // Base64 디코딩 실패 - 평문 데이터로 판단
            log.debug("Base64 디코딩 실패, 평문 데이터로 처리: {}", encryptedText);
            return encryptedText;
        } catch (Exception e) {
            // 복호화 실패 - 평문 데이터로 판단
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
    private SecretKeySpec generateKey() throws Exception {
        // SHA-256으로 키 해시 생성하여 32바이트 키 생성
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(encryptionKey.getBytes(StandardCharsets.UTF_8));
        return new SecretKeySpec(hash, KEY_ALGORITHM);
    }
    
    /**
     * 초기화 벡터(IV) 생성
     */
    private IvParameterSpec generateIv() throws Exception {
        // SHA-256으로 IV 해시 생성하여 16바이트 IV 생성
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(encryptionIv.getBytes(StandardCharsets.UTF_8));
        byte[] ivBytes = new byte[16];
        System.arraycopy(hash, 0, ivBytes, 0, 16);
        return new IvParameterSpec(ivBytes);
    }
    
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
        
        try {
            // Base64 디코딩 시도
            Base64.getDecoder().decode(text);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }
    
    /**
     * 안전한 암호화 (이미 암호화된 경우 재암호화하지 않음)
     * 
     * @param text 암호화할 텍스트
     * @return 암호화된 텍스트
     */
    public String safeEncrypt(String text) {
        if (text == null || text.trim().isEmpty()) {
            return text;
        }
        
        // 이미 암호화된 경우 그대로 반환
        if (isEncrypted(text)) {
            return text;
        }
        
        return encrypt(text);
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
}

package com.mindgarden.consultation.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import javax.crypto.Cipher;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

/**
 * 개인정보 암호화 서비스
 * 
 * ⚠️ 보안 개선: 하드코딩된 키 제거, 환경변수 기반 키 관리로 변경
 * 
 * @author MindGarden
 * @version 2.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
public class PersonalDataEncryptionService {
    
    private static final String ALGORITHM = "AES";
    private static final String TRANSFORMATION = "AES/ECB/PKCS5Padding";
    
    @Value("${encryption.personal-data.key:}")
    private String encryptionKey;
    
    private final SecretKey secretKey;
    
    public PersonalDataEncryptionService(@Value("${encryption.personal-data.key:}") String encryptionKey) {
        if (encryptionKey == null || encryptionKey.trim().isEmpty()) {
            throw new IllegalStateException(
                "암호화 키가 설정되지 않았습니다. " +
                "환경변수 PERSONAL_DATA_ENCRYPTION_KEY를 설정해주세요. " +
                "보안상 하드코딩된 키는 사용할 수 없습니다."
            );
        }
        
        if (encryptionKey.length() < 32) {
            throw new IllegalStateException(
                "암호화 키는 최소 32자 이상이어야 합니다. " +
                "현재 키 길이: " + encryptionKey.length()
            );
        }
        
        this.encryptionKey = encryptionKey;
        // 키를 32바이트로 맞춤 (SHA-256 해시 사용 권장)
        byte[] keyBytes = encryptionKey.getBytes(StandardCharsets.UTF_8);
        if (keyBytes.length < 32) {
            // 키가 짧은 경우 반복하여 32바이트로 확장 (임시 조치)
            byte[] extendedKey = new byte[32];
            System.arraycopy(keyBytes, 0, extendedKey, 0, Math.min(keyBytes.length, 32));
            this.secretKey = new SecretKeySpec(extendedKey, ALGORITHM);
        } else {
            this.secretKey = new SecretKeySpec(keyBytes, 0, 32, ALGORITHM);
        }
        
        log.info("✅ PersonalDataEncryptionService 초기화 완료 (환경변수 기반 키 사용)");
    }
    
    /**
     * 개인정보 암호화
     * 
     * @param plainText 암호화할 평문
     * @return 암호화된 문자열
     */
    public String encrypt(String plainText) {
        if (plainText == null || plainText.isEmpty()) {
            return plainText;
        }
        
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.ENCRYPT_MODE, secretKey);
            
            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(encryptedBytes);
            
        } catch (Exception e) {
            throw new RuntimeException("개인정보 암호화 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 개인정보 복호화
     * 
     * @param encryptedText 복호화할 암호문
     * @return 복호화된 평문
     */
    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isEmpty()) {
            return encryptedText;
        }
        
        try {
            Cipher cipher = Cipher.getInstance(TRANSFORMATION);
            cipher.init(Cipher.DECRYPT_MODE, secretKey);
            
            byte[] encryptedBytes = Base64.getDecoder().decode(encryptedText);
            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);
            return new String(decryptedBytes, StandardCharsets.UTF_8);
            
        } catch (Exception e) {
            throw new RuntimeException("개인정보 복호화 중 오류가 발생했습니다.", e);
        }
    }
    
    /**
     * 개인정보 마스킹 (일부만 표시)
     * 
     * @param personalData 마스킹할 개인정보
     * @param visibleLength 표시할 문자 수
     * @return 마스킹된 개인정보
     */
    public String maskPersonalData(String personalData, int visibleLength) {
        if (personalData == null || personalData.isEmpty()) {
            return personalData;
        }
        
        if (personalData.length() <= visibleLength) {
            return "*".repeat(personalData.length());
        }
        
        String visiblePart = personalData.substring(0, visibleLength);
        String maskedPart = "*".repeat(personalData.length() - visibleLength);
        
        return visiblePart + maskedPart;
    }
    
    /**
     * 이메일 마스킹
     * 
     * @param email 마스킹할 이메일
     * @return 마스킹된 이메일
     */
    public String maskEmail(String email) {
        if (email == null || !email.contains("@")) {
            return email;
        }
        
        String[] parts = email.split("@");
        String username = parts[0];
        String domain = parts[1];
        
        if (username.length() <= 2) {
            return "*".repeat(username.length()) + "@" + domain;
        }
        
        String maskedUsername = username.charAt(0) + "*".repeat(username.length() - 2) + username.charAt(username.length() - 1);
        return maskedUsername + "@" + domain;
    }
    
    /**
     * 전화번호 마스킹
     * 
     * @param phoneNumber 마스킹할 전화번호
     * @return 마스킹된 전화번호
     */
    public String maskPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isEmpty()) {
            return phoneNumber;
        }
        
        // 숫자만 추출
        String digits = phoneNumber.replaceAll("[^0-9]", "");
        
        if (digits.length() < 4) {
            return "*".repeat(phoneNumber.length());
        }
        
        String visiblePart = digits.substring(0, 3);
        String maskedPart = "*".repeat(digits.length() - 3);
        String result = visiblePart + maskedPart;
        
        // 원래 형식에 맞게 복원
        if (phoneNumber.contains("-")) {
            result = result.substring(0, 3) + "-" + result.substring(3, 7) + "-" + result.substring(7);
        }
        
        return result;
    }
    
    /**
     * 주소 마스킹
     * 
     * @param address 마스킹할 주소
     * @return 마스킹된 주소
     */
    public String maskAddress(String address) {
        if (address == null || address.isEmpty()) {
            return address;
        }
        
        if (address.length() <= 4) {
            return "*".repeat(address.length());
        }
        
        String visiblePart = address.substring(0, 2);
        String maskedPart = "*".repeat(address.length() - 2);
        
        return visiblePart + maskedPart;
    }
    
    /**
     * 개인정보 암호화 여부 확인
     * 
     * @param data 확인할 데이터
     * @return 암호화된 데이터 여부
     */
    public boolean isEncrypted(String data) {
        if (data == null || data.isEmpty()) {
            return false;
        }
        
        try {
            // Base64 디코딩 시도
            Base64.getDecoder().decode(data);
            // 복호화 시도
            decrypt(data);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}

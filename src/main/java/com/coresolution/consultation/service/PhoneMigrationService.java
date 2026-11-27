package com.coresolution.consultation.service;

import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.consultation.util.PhoneLogMasking;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 전화번호 암호화 마이그레이션 서비스
 * - 전화번호만 암호화 (이름은 평문 유지)
 * - 개인정보보호법 준수를 위한 전화번호 암호화
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PhoneMigrationService {
    
    private final UserRepository userRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    /**
     * 전화번호 암호화 마이그레이션 실행
     */
    @Transactional
    public void migratePhoneNumbers() {
        log.info("🔄 전화번호 암호화 마이그레이션 시작");
        
        try {
            // 모든 사용자 조회
            List<User> allUsers = userRepository.findAll();
            int totalUsers = allUsers.size();
            int migratedCount = 0;
            int alreadyEncryptedCount = 0;
            int errorCount = 0;
            
            log.info("📊 총 사용자 수: {}", totalUsers);
            
            for (User user : allUsers) {
                try {
                    String originalPhone = user.getPhone();
                    
                    if (originalPhone == null || originalPhone.trim().isEmpty()) {
                        log.debug("👤 사용자 ID {}: 전화번호가 비어있음", user.getId());
                        continue;
                    }
                    
                    // 이미 암호화된 데이터인지 확인
                    if (isEncryptedData(originalPhone)) {
                        alreadyEncryptedCount++;
                        log.debug("👤 사용자 ID {}: 이미 암호화된 전화번호", user.getId());
                        continue;
                    }
                    
                    // 평문 전화번호를 암호화
                    String encryptedPhone = encryptionUtil.encrypt(originalPhone);
                    user.setPhone(encryptedPhone);
                    userRepository.save(user);
                    
                    migratedCount++;
                    log.info("✅ 사용자 ID {}: 전화번호 암호화 완료 ({} -> 암호화됨)", 
                        user.getId(), PhoneLogMasking.maskForLog(originalPhone));
                    
                } catch (Exception e) {
                    errorCount++;
                    log.error("❌ 사용자 ID {}: 전화번호 암호화 실패 - {}", user.getId(), e.getMessage());
                }
            }
            
            log.info("🏁 전화번호 암호화 마이그레이션 완료");
            log.info("📊 결과 - 총 사용자: {}, 마이그레이션: {}, 이미 암호화: {}, 오류: {}", 
                totalUsers, migratedCount, alreadyEncryptedCount, errorCount);
            
        } catch (Exception e) {
            log.error("❌ 전화번호 암호화 마이그레이션 실패", e);
            throw new RuntimeException("전화번호 암호화 마이그레이션에 실패했습니다.", e);
        }
    }
    
    /**
     * 전화번호 암호화 상태 확인
     */
    public void checkPhoneEncryptionStatus() {
        log.info("🔍 전화번호 암호화 상태 확인 시작");
        
        try {
            List<User> allUsers = userRepository.findAll();
            int totalUsers = allUsers.size();
            int encryptedCount = 0;
            int plainTextCount = 0;
            int emptyCount = 0;
            
            log.info("📊 총 사용자 수: {}", totalUsers);
            
            for (User user : allUsers) {
                String phone = user.getPhone();
                
                if (phone == null || phone.trim().isEmpty()) {
                    emptyCount++;
                    continue;
                }
                
                if (isEncryptedData(phone)) {
                    encryptedCount++;
                    log.debug("👤 사용자 ID {}: 암호화된 전화번호", user.getId());
                } else {
                    plainTextCount++;
                    log.info("👤 사용자 ID {}: 평문 전화번호 - {}", user.getId(), PhoneLogMasking.maskForLog(phone));
                }
            }
            
            log.info("🏁 전화번호 암호화 상태 확인 완료");
            log.info("📊 결과 - 총 사용자: {}, 암호화됨: {}, 평문: {}, 비어있음: {}", 
                totalUsers, encryptedCount, plainTextCount, emptyCount);
            
        } catch (Exception e) {
            log.error("❌ 전화번호 암호화 상태 확인 실패", e);
        }
    }
    
    /**
     * 데이터가 암호화된 데이터인지 확인
     */
    private boolean isEncryptedData(String data) {
        if (data == null || data.trim().isEmpty()) {
            return false;
        }
        
        // Base64 패턴 확인 (A-Z, a-z, 0-9, +, /, =)
        if (!data.matches("^[A-Za-z0-9+/]*={0,2}$")) {
            return false;
        }
        
        // 암호화된 데이터는 일반적으로 20자 이상
        if (data.length() < 20) {
            return false;
        }
        
        // 한글이나 특수문자가 포함된 경우 평문으로 판단
        if (data.matches(".*[가-힣].*") || data.matches(".*[^A-Za-z0-9+/=].*")) {
            return false;
        }
        
        return true;
    }
    
    /**
     * 이름 마스킹
     */
    private String maskName(String name) {
        if (name == null || name.length() <= 1) {
            return name;
        }
        
        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }
        
        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }
}

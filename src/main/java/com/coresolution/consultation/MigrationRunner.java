package com.coresolution.consultation;

import java.util.List;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 전화번호 암호화 마이그레이션 실행기
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2024-12-19
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class MigrationRunner implements CommandLineRunner {
    
    private final UserRepository userRepository;
    private final PersonalDataEncryptionUtil encryptionUtil;
    
    @Override
    public void run(String... args) throws Exception {
        // 마이그레이션 실행 여부를 확인하는 시스템 프로퍼티
        String runMigration = System.getProperty("run.migration");
        
        if ("true".equals(runMigration)) {
            log.info("🔄 전화번호 암호화 마이그레이션 시작");
            migratePhoneNumbers();
            log.info("✅ 전화번호 암호화 마이그레이션 완료");
        } else {
            log.info("⏭️ 마이그레이션 건너뜀 (run.migration이 true가 아니므로 건너뜀)");
        }
    }
    
    /**
     * 전화번호 암호화 마이그레이션 실행
     */
    public void migratePhoneNumbers() {
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
                        user.getId(), maskPhone(originalPhone));
                    
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
     * 전화번호 마스킹
     */
    private String maskPhone(String phone) {
        if (phone == null || phone.length() < 4) {
            return phone;
        }
        
        if (phone.length() <= 8) {
            return phone.substring(0, 3) + "****";
        }
        
        return phone.substring(0, 3) + "****" + phone.substring(phone.length() - 4);
    }
}

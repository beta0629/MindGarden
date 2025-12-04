package com.coresolution.core.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

import jakarta.annotation.PostConstruct;

/**
 * 환경 변수 검증 설정
 * 
 * 운영 환경에서 필수 환경 변수가 설정되지 않으면 애플리케이션 시작을 중단합니다.
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-04
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "environment.validation.enabled", havingValue = "true", matchIfMissing = false)
public class EnvironmentValidationConfig {
    
    @Value("${spring.profiles.active:local}")
    private String activeProfile;
    
    @Value("${jwt.secret:}")
    private String jwtSecret;
    
    @Value("${encryption.personal-data.key:}")
    private String encryptionKey;
    
    @Value("${encryption.personal-data.iv:}")
    private String encryptionIv;
    
    @Value("${spring.datasource.password:}")
    private String dbPassword;
    
    /**
     * 운영 환경에서 필수 환경 변수 검증
     */
    @PostConstruct
    public void validateEnvironmentVariables() {
        // 운영 환경에서만 검증 수행
        if (!isProductionProfile()) {
            log.info("🔍 환경 변수 검증 스킵 (비운영 환경: {})", activeProfile);
            return;
        }
        
        log.info("🔐 운영 환경 변수 검증 시작...");
        
        boolean hasErrors = false;
        
        // 1. JWT Secret 검증
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            log.error("❌ 필수 환경 변수 누락: JWT_SECRET");
            hasErrors = true;
        }
        
        // 2. 암호화 키 검증
        if (encryptionKey == null || encryptionKey.trim().isEmpty()) {
            log.error("❌ 필수 환경 변수 누락: PERSONAL_DATA_ENCRYPTION_KEY");
            hasErrors = true;
        }
        
        // 3. 암호화 IV 검증
        if (encryptionIv == null || encryptionIv.trim().isEmpty()) {
            log.error("❌ 필수 환경 변수 누락: PERSONAL_DATA_ENCRYPTION_IV");
            hasErrors = true;
        }
        
        // 4. DB 비밀번호 검증
        if (dbPassword == null || dbPassword.trim().isEmpty()) {
            log.error("❌ 필수 환경 변수 누락: DB_PASSWORD");
            hasErrors = true;
        }
        
        // 5. 암호화 키 길이 검증
        if (encryptionKey != null && encryptionKey.length() < 32) {
            log.error("❌ 암호화 키 길이 부족: PERSONAL_DATA_ENCRYPTION_KEY (최소 32자 필요, 현재: {}자)", encryptionKey.length());
            hasErrors = true;
        }
        
        // 6. JWT Secret 길이 검증
        if (jwtSecret != null && jwtSecret.length() < 32) {
            log.error("❌ JWT Secret 길이 부족: JWT_SECRET (최소 32자 필요, 현재: {}자)", jwtSecret.length());
            hasErrors = true;
        }
        
        if (hasErrors) {
            String errorMsg = "운영 환경에서 필수 환경 변수가 설정되지 않았거나 유효하지 않습니다. " +
                    "환경 변수를 확인하고 다시 시작하세요.";
            log.error("❌ {}", errorMsg);
            throw new IllegalStateException(errorMsg);
        }
        
        log.info("✅ 운영 환경 변수 검증 완료");
    }
    
    /**
     * 운영 환경 프로파일 확인
     */
    private boolean isProductionProfile() {
        return "prod".equals(activeProfile) || 
               "production".equals(activeProfile) ||
               activeProfile != null && activeProfile.contains("prod");
    }
}


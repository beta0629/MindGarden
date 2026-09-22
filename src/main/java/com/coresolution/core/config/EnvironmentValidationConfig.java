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
        
        // 5. 심리검사 문서 암호화 키 검증 (AES 32바이트 Base64)
        String psychDocKeyB64 = System.getenv("PSYCH_DOC_KEY_B64");
        if (psychDocKeyB64 == null || psychDocKeyB64.trim().isEmpty()) {
            log.error("❌ 필수 환경 변수 누락: PSYCH_DOC_KEY_B64 (심리검사 PDF 암호화용)");
            hasErrors = true;
        }

        // 6. Redis — 캐시 + Spring Session 공유. REDIS_HOST 없으면 기동 중단 (blue/green 세션 생존 전제)
        // application-prod.yml: spring.data.redis.host=${REDIS_HOST}, password=${REDIS_PASSWORD:}
        // REDIS_PASSWORD: null/빈/공백만 → 허용 (requirepass 없는 운영 Redis). 비밀번호 값 자체는 절대 로그하지 않음.
        String redisHost = System.getenv("REDIS_HOST");
        if (redisHost == null || redisHost.trim().isEmpty()) {
            log.error("❌ 필수 환경 변수 누락: REDIS_HOST (캐시·Spring Session Redis)");
            hasErrors = true;
        }
        // REDIS_PASSWORD: 비어 있어도 fail-closed 하지 않음 (ops Redis without AUTH / requirepass 없음)
        String redisPassword = System.getenv("REDIS_PASSWORD");
        if (redisPassword != null && !redisPassword.trim().isEmpty()) {
            log.info("✅ REDIS_PASSWORD 설정됨 (값 미출력)");
        } else {
            log.info("ℹ️ REDIS_PASSWORD 비어 있음 — requirepass 없는 Redis로 연결 (AUTH 미사용)");
        }
        
        // 7. 암호화 키 길이 검증
        // PERSONAL_DATA_ENCRYPTION_KEY는 PersonalDataEncryptionKeyProvider에서 32바이트 미만이면
        // SHA-256으로 정규화되므로, 레거시 짧은 문자열이라도 비어 있기만 않으면 유효하다.
        if (encryptionKey != null && encryptionKey.length() > 0 && encryptionKey.length() < 32) {
            log.warn("⚠️ PERSONAL_DATA_ENCRYPTION_KEY 문자열 길이가 32 미만입니다 ({}자). 내부 정규화로 32바이트 키를 사용합니다.",
                    encryptionKey.length());
        }
        
        // 8. JWT Secret 길이 검증
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


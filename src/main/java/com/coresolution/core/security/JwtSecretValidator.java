package com.coresolution.core.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.annotation.PostConstruct;

/**
 * JWT 비밀키 검증 컴포넌트
 * 
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Component
public class JwtSecretValidator {
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    private static final int JWT_SECRET_MIN_LENGTH = 32;
    private static final int JWT_SECRET_MAX_LENGTH = 512;
    
    /**
     * 애플리케이션 시작 시 JWT 비밀키 검증
     */
    @PostConstruct
    public void validateJwtSecret() {
        log.info("🔐 JWT 비밀키 검증 시작...");
        
        // 1. NULL 체크
        if (jwtSecret == null || jwtSecret.trim().isEmpty()) {
            String errorMsg = "JWT 비밀키가 설정되지 않았습니다. JWT_SECRET 환경 변수를 설정하세요.";
            log.error("❌ {}", errorMsg);
            throw new SecurityException(errorMsg);
        }
        
        // 2. 최소 길이 체크
        if (jwtSecret.length() < JWT_SECRET_MIN_LENGTH) {
            String errorMsg = String.format(
                "JWT 비밀키는 최소 %d자 이상이어야 합니다. 현재: %d자",
                JWT_SECRET_MIN_LENGTH,
                jwtSecret.length()
            );
            log.error("❌ {}", errorMsg);
            throw new SecurityException(errorMsg);
        }
        
        // 3. 최대 길이 체크
        if (jwtSecret.length() > JWT_SECRET_MAX_LENGTH) {
            String errorMsg = String.format(
                "JWT 비밀키는 최대 %d자 이하여야 합니다. 현재: %d자",
                JWT_SECRET_MAX_LENGTH,
                jwtSecret.length()
            );
            log.error("❌ {}", errorMsg);
            throw new SecurityException(errorMsg);
        }
        
        // 4. 기본값 사용 경고
        if (isDefaultSecret(jwtSecret)) {
            log.warn("⚠️ JWT 비밀키가 기본값을 사용하고 있습니다!");
            log.warn("⚠️ 운영 환경에서는 반드시 강력한 비밀키로 변경하세요!");
            log.warn("⚠️ 권장: 32자 이상의 무작위 문자열 (영문 대소문자, 숫자, 특수문자 조합)");
        }
        
        // 5. 약한 비밀키 경고
        if (isWeakSecret(jwtSecret)) {
            log.warn("⚠️ JWT 비밀키가 약합니다. 더 강력한 비밀키를 사용하세요.");
            log.warn("⚠️ 권장: 영문 대소문자, 숫자, 특수문자를 모두 포함한 32자 이상");
        }
        
        log.info("✅ JWT 비밀키 검증 완료: 길이={}자", jwtSecret.length());
    }
    
    /**
     * 기본값 사용 여부 확인
     */
    private boolean isDefaultSecret(String secret) {
        String lowerSecret = secret.toLowerCase();
        
        // 위험한 기본값 패턴
        String[] dangerousPatterns = {
            "mindgarden",
            "coresolution",
            "default",
            "secret",
            "password",
            "test",
            "demo",
            "sample",
            "example",
            "12345",
            "qwerty"
        };
        
        for (String pattern : dangerousPatterns) {
            if (lowerSecret.contains(pattern)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 약한 비밀키 여부 확인
     */
    private boolean isWeakSecret(String secret) {
        // 1. 길이가 짧음
        if (secret.length() < 40) {
            return true;
        }
        
        // 2. 대문자 없음
        if (!secret.matches(".*[A-Z].*")) {
            return true;
        }
        
        // 3. 소문자 없음
        if (!secret.matches(".*[a-z].*")) {
            return true;
        }
        
        // 4. 숫자 없음
        if (!secret.matches(".*[0-9].*")) {
            return true;
        }
        
        // 5. 특수문자 없음
        if (!secret.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            return true;
        }
        
        // 6. 반복 패턴 (aaa, 111 등)
        if (secret.matches(".*(.)\\1{2,}.*")) {
            return true;
        }
        
        return false;
    }
    
    /**
     * 비밀키 강도 평가
     */
    public String evaluateSecretStrength() {
        if (jwtSecret == null || jwtSecret.length() < JWT_SECRET_MIN_LENGTH) {
            return "INVALID";
        }
        
        if (isDefaultSecret(jwtSecret)) {
            return "WEAK";
        }
        
        if (isWeakSecret(jwtSecret)) {
            return "MEDIUM";
        }
        
        return "STRONG";
    }
}


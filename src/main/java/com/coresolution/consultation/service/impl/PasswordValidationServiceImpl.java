package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.service.PasswordConfigService;
import com.coresolution.consultation.service.PasswordValidationService;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 비밀번호 검증 서비스 구현체
 * 공통코드 기반 비밀번호 정책 검증
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordValidationServiceImpl implements PasswordValidationService {
    
    private final PasswordConfigService passwordConfigService;
    
    @Override
    public Map<String, Object> validatePassword(String password) {
        log.debug("🔍 비밀번호 검증: length={}", password != null ? password.length() : 0);
        
        Map<String, Object> result = new HashMap<>();
        Map<String, Object> policy = passwordConfigService.getPasswordPolicy();
        Map<String, String> messages = (Map<String, String>) policy.get("messages");
        
        // 기본 검증 결과
        result.put("isValid", true);
        result.put("errors", new HashMap<String, String>());
        result.put("warnings", new HashMap<String, String>());
        result.put("strength", "WEAK");
        
        if (password == null || password.trim().isEmpty()) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("required", messages.get("required"));
            return result;
        }
        
        // 길이 검증
        int minLength = (Integer) policy.get("minLength");
        int maxLength = (Integer) policy.get("maxLength");
        
        if (password.length() < minLength) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("tooShort", 
                messages.get("tooShort").replace("{minLength}", String.valueOf(minLength)));
        }
        
        if (password.length() > maxLength) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("tooLong", 
                messages.get("tooLong").replace("{maxLength}", String.valueOf(maxLength)));
        }
        
        // 문자 유형 검증
        if ((Boolean) policy.get("requireUppercase") && !password.matches(".*[A-Z].*")) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("uppercaseRequired", messages.get("uppercaseRequired"));
        }
        
        if ((Boolean) policy.get("requireLowercase") && !password.matches(".*[a-z].*")) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("lowercaseRequired", messages.get("lowercaseRequired"));
        }
        
        if ((Boolean) policy.get("requireDigits") && !password.matches(".*[0-9].*")) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("digitRequired", messages.get("digitRequired"));
        }
        
        if ((Boolean) policy.get("requireSpecialChars") && !password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("specialRequired", messages.get("specialRequired"));
        }
        
        // 연속 문자 검증
        int maxConsecutive = (Integer) policy.get("maxConsecutive");
        if (hasConsecutiveCharacters(password, maxConsecutive + 1)) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("consecutiveForbidden", messages.get("consecutiveForbidden"));
        }
        
        // 반복 문자 검증
        int maxRepeated = (Integer) policy.get("maxRepeated");
        if (hasRepeatedCharacters(password, maxRepeated + 1)) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("repeatedForbidden", messages.get("repeatedForbidden"));
        }
        
        // 일반적인 패턴 검증
        if ((Boolean) policy.get("checkCommonPatterns") && isCommonPattern(password)) {
            result.put("isValid", false);
            ((Map<String, String>) result.get("errors")).put("commonPattern", messages.get("commonPattern"));
        }
        
        // 비밀번호 강도 측정
        Map<String, Object> strengthResult = measurePasswordStrength(password);
        result.put("strength", strengthResult.get("strength"));
        result.put("score", strengthResult.get("score"));
        
        log.debug("✅ 비밀번호 검증 완료: isValid={}, strength={}", result.get("isValid"), result.get("strength"));
        
        return result;
    }
    
    @Override
    public Map<String, Object> measurePasswordStrength(String password) {
        if (password == null || password.isEmpty()) {
            return Map.of("strength", "WEAK", "score", 0);
        }
        
        int score = 0;
        String strength = "WEAK";
        
        // 길이 점수 (최대 30점)
        if (password.length() >= 8) score += 10;
        if (password.length() >= 12) score += 10;
        if (password.length() >= 16) score += 10;
        
        // 문자 유형 점수 (최대 40점)
        if (password.matches(".*[a-z].*")) score += 10; // 소문자
        if (password.matches(".*[A-Z].*")) score += 10; // 대문자
        if (password.matches(".*[0-9].*")) score += 10; // 숫자
        if (password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) score += 10; // 특수문자
        
        // 복잡성 점수 (최대 30점)
        if (password.length() >= 8 && !hasConsecutiveCharacters(password, 3)) score += 10;
        if (password.length() >= 8 && !hasRepeatedCharacters(password, 3)) score += 10;
        if (password.length() >= 8 && !isCommonPattern(password)) score += 10;
        
        // 강도 분류
        if (score >= 80) {
            strength = "VERY_STRONG";
        } else if (score >= 60) {
            strength = "STRONG";
        } else if (score >= 40) {
            strength = "MEDIUM";
        } else if (score >= 20) {
            strength = "WEAK";
        } else {
            strength = "VERY_WEAK";
        }
        
        return Map.of(
            "strength", strength,
            "score", score,
            "maxScore", 100
        );
    }
    
    @Override
    public Map<String, Object> getPasswordRequirements() {
        Map<String, Object> policy = passwordConfigService.getPasswordPolicy();
        Map<String, String> messages = (Map<String, String>) policy.get("messages");
        
        Map<String, Object> requirements = new HashMap<>();
        requirements.put("minLength", policy.get("minLength"));
        requirements.put("maxLength", policy.get("maxLength"));
        requirements.put("requireUppercase", policy.get("requireUppercase"));
        requirements.put("requireLowercase", policy.get("requireLowercase"));
        requirements.put("requireDigits", policy.get("requireDigits"));
        requirements.put("requireSpecialChars", policy.get("requireSpecialChars"));
        requirements.put("maxConsecutive", policy.get("maxConsecutive"));
        requirements.put("maxRepeated", policy.get("maxRepeated"));
        requirements.put("checkCommonPatterns", policy.get("checkCommonPatterns"));
        requirements.put("messages", messages);
        
        return requirements;
    }
    
    /**
     * 연속된 문자 확인
     */
    private boolean hasConsecutiveCharacters(String password, int maxConsecutive) {
        for (int i = 0; i < password.length() - maxConsecutive + 1; i++) {
            boolean isConsecutive = true;
            for (int j = 1; j < maxConsecutive; j++) {
                char c1 = password.charAt(i + j - 1);
                char c2 = password.charAt(i + j);
                
                if (!((c2 == c1 + 1) || (c2 == c1 - 1))) {
                    isConsecutive = false;
                    break;
                }
            }
            if (isConsecutive) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 반복 문자 확인
     */
    private boolean hasRepeatedCharacters(String password, int maxRepeated) {
        for (int i = 0; i < password.length() - maxRepeated + 1; i++) {
            boolean isRepeated = true;
            for (int j = 1; j < maxRepeated; j++) {
                if (password.charAt(i) != password.charAt(i + j)) {
                    isRepeated = false;
                    break;
                }
            }
            if (isRepeated) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 일반적인 패턴 확인
     */
    private boolean isCommonPattern(String password) {
        String lowerPassword = password.toLowerCase();
        
        String[] commonPatterns = {
            "password", "123456", "qwerty", "admin", "user",
            "password123", "admin123", "test123", "hello123",
            "welcome", "login", "letmein", "master", "secret"
        };
        
        for (String pattern : commonPatterns) {
            if (lowerPassword.contains(pattern)) {
                return true;
            }
        }
        
        return false;
    }
}

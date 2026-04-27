package com.coresolution.consultation.service.impl;

import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.Map;
import com.coresolution.consultation.service.PasswordConfigService;
import com.coresolution.consultation.service.PasswordValidationService;
import com.coresolution.core.security.PasswordPolicy;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 비밀번호 검증 서비스 구현체.
 * 로그인 저장 정책은 {@link PasswordPolicy} SSOT이며, 공통코드({@link PasswordConfigService})는 메시지·요구사항 표시용이다.
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
        @SuppressWarnings("unchecked")
        Map<String, String> messages = (Map<String, String>) policy.get("messages");

        Map<String, String> errors = new LinkedHashMap<>();
        result.put("isValid", true);
        result.put("errors", errors);
        result.put("warnings", new HashMap<String, String>());
        result.put("strength", "WEAK");

        if (password == null || password.trim().isEmpty()) {
            result.put("isValid", false);
            errors.put("required", resolveMessage(messages, "required", "비밀번호를 입력해주세요."));
            return result;
        }

        String trimmed = password.trim();
        Map<String, String> violations = PasswordPolicy.collectLoginStorageViolations(trimmed);
        if (!violations.isEmpty()) {
            result.put("isValid", false);
            for (Map.Entry<String, String> e : violations.entrySet()) {
                errors.put(e.getKey(), resolveViolationMessage(messages, e.getKey(), e.getValue()));
            }
        }

        Map<String, Object> strengthResult = measurePasswordStrength(trimmed);
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
        if (password.matches(".*[@$!%*?&].*")) {
            score += 10;
        }

        // 복잡성 점수 (최대 30점)
        if (password.length() >= 8 && !PasswordPolicy.hasSequentialCharacters(password)) {
            score += 10;
        }
        if (password.length() >= 8 && !PasswordPolicy.hasRepeatedCharacters(password)) {
            score += 10;
        }
        if (password.length() >= 8 && !PasswordPolicy.isCommonPattern(password)) {
            score += 10;
        }
        
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
        @SuppressWarnings("unchecked")
        Map<String, String> messages = (Map<String, String>) policy.get("messages");

        Map<String, Object> requirements = new HashMap<>();
        requirements.put("minLength", PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH);
        requirements.put("maxLength", PasswordPolicy.LOGIN_PASSWORD_MAX_LENGTH);
        requirements.put("requireUppercase", true);
        requirements.put("requireLowercase", true);
        requirements.put("requireDigits", true);
        requirements.put("requireSpecialChars", true);
        requirements.put("allowedLoginSpecialCharacters", PasswordPolicy.LOGIN_PASSWORD_ALLOWED_SPECIALS);
        requirements.put("maxConsecutive", 2);
        requirements.put("maxRepeated", 2);
        requirements.put("checkCommonPatterns", true);
        requirements.put("messages", messages);

        return requirements;
    }

    private static String resolveMessage(Map<String, String> messages, String key, String fallback) {
        if (messages == null) {
            return fallback;
        }
        return messages.getOrDefault(key, fallback);
    }

    private static String resolveViolationMessage(Map<String, String> messages, String violationKey,
        String defaultMessage) {
        if (messages == null) {
            return defaultMessage;
        }
        if ("tooShort".equals(violationKey)) {
            return messages.getOrDefault("tooShort", defaultMessage)
                .replace("{minLength}", String.valueOf(PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH));
        }
        if ("tooLong".equals(violationKey)) {
            return messages.getOrDefault("tooLong", defaultMessage)
                .replace("{maxLength}", String.valueOf(PasswordPolicy.LOGIN_PASSWORD_MAX_LENGTH));
        }
        return messages.getOrDefault(violationKey, defaultMessage);
    }
}

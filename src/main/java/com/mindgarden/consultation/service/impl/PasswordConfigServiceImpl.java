package com.mindgarden.consultation.service.impl;

import com.mindgarden.consultation.entity.CommonCode;
import com.mindgarden.consultation.repository.CommonCodeRepository;
import com.mindgarden.consultation.service.PasswordConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 비밀번호 설정 서비스 구현체
 * 공통코드를 사용한 비밀번호 정책 관리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordConfigServiceImpl implements PasswordConfigService {
    
    private final CommonCodeRepository commonCodeRepository;
    
    // 공통코드 그룹 상수
    private static final String PASSWORD_POLICY_GROUP = "PASSWORD_POLICY";
    private static final String EMAIL_CONFIG_GROUP = "EMAIL_CONFIG";
    private static final String PASSWORD_RESET_GROUP = "PASSWORD_RESET";
    
    @Override
    public Map<String, Object> getPasswordPolicy() {
        log.debug("🔍 비밀번호 정책 설정 조회");
        
        Map<String, Object> policy = new HashMap<>();
        
        // 기본값 설정
        policy.put("minLength", getConfigIntValue(PASSWORD_POLICY_GROUP, "MIN_LENGTH", 8));
        policy.put("maxLength", getConfigIntValue(PASSWORD_POLICY_GROUP, "MAX_LENGTH", 128));
        policy.put("requireUppercase", getConfigBooleanValue(PASSWORD_POLICY_GROUP, "REQUIRE_UPPERCASE", true));
        policy.put("requireLowercase", getConfigBooleanValue(PASSWORD_POLICY_GROUP, "REQUIRE_LOWERCASE", true));
        policy.put("requireDigits", getConfigBooleanValue(PASSWORD_POLICY_GROUP, "REQUIRE_DIGITS", true));
        policy.put("requireSpecialChars", getConfigBooleanValue(PASSWORD_POLICY_GROUP, "REQUIRE_SPECIAL_CHARS", true));
        policy.put("maxConsecutive", getConfigIntValue(PASSWORD_POLICY_GROUP, "MAX_CONSECUTIVE", 2));
        policy.put("maxRepeated", getConfigIntValue(PASSWORD_POLICY_GROUP, "MAX_REPEATED", 2));
        policy.put("checkCommonPatterns", getConfigBooleanValue(PASSWORD_POLICY_GROUP, "CHECK_COMMON_PATTERNS", true));
        policy.put("historyCount", getConfigIntValue(PASSWORD_POLICY_GROUP, "HISTORY_COUNT", 5));
        policy.put("changeCooldownHours", getConfigIntValue(PASSWORD_POLICY_GROUP, "CHANGE_COOLDOWN_HOURS", 1));
        
        // 정책 메시지
        policy.put("messages", getPasswordPolicyMessages());
        
        return policy;
    }
    
    @Override
    public Map<String, Object> getEmailConfig() {
        log.debug("🔍 이메일 설정 조회");
        
        Map<String, Object> config = new HashMap<>();
        
        config.put("fromEmail", getConfigValue(EMAIL_CONFIG_GROUP, "FROM_EMAIL", "noreply@mindgarden.com"));
        config.put("fromName", getConfigValue(EMAIL_CONFIG_GROUP, "FROM_NAME", "마인드가든"));
        config.put("replyToEmail", getConfigValue(EMAIL_CONFIG_GROUP, "REPLY_TO_EMAIL", "support@mindgarden.com"));
        config.put("supportEmail", getConfigValue(EMAIL_CONFIG_GROUP, "SUPPORT_EMAIL", "support@mindgarden.com"));
        config.put("resetPasswordUrl", getConfigValue(EMAIL_CONFIG_GROUP, "RESET_PASSWORD_URL", "http://localhost:3000/reset-password"));
        config.put("companyName", getConfigValue(EMAIL_CONFIG_GROUP, "COMPANY_NAME", "마인드가든"));
        
        return config;
    }
    
    @Override
    public Map<String, Object> getPasswordResetConfig() {
        log.debug("🔍 비밀번호 재설정 설정 조회");
        
        Map<String, Object> config = new HashMap<>();
        
        config.put("tokenExpiryHours", getConfigIntValue(PASSWORD_RESET_GROUP, "TOKEN_EXPIRY_HOURS", 24));
        config.put("maxAttempts", getConfigIntValue(PASSWORD_RESET_GROUP, "MAX_ATTEMPTS", 3));
        config.put("cooldownMinutes", getConfigIntValue(PASSWORD_RESET_GROUP, "COOLDOWN_MINUTES", 15));
        config.put("enableEmailReset", getConfigBooleanValue(PASSWORD_RESET_GROUP, "ENABLE_EMAIL_RESET", true));
        config.put("enableSmsReset", getConfigBooleanValue(PASSWORD_RESET_GROUP, "ENABLE_SMS_RESET", false));
        
        return config;
    }
    
    @Override
    public String getConfigValue(String codeGroup, String codeValue, String defaultValue) {
        try {
            return commonCodeRepository.findByCodeGroupAndCodeValueAndIsActiveTrue(codeGroup, codeValue)
                .map(CommonCode::getExtraData)
                .map(this::parseJsonValue)
                .orElse(defaultValue);
        } catch (Exception e) {
            log.warn("⚠️ 공통코드 조회 실패: {}:{}, 기본값 사용: {}", codeGroup, codeValue, defaultValue, e);
            return defaultValue;
        }
    }
    
    @Override
    public Integer getConfigIntValue(String codeGroup, String codeValue, Integer defaultValue) {
        try {
            String value = getConfigValue(codeGroup, codeValue, String.valueOf(defaultValue));
            return Integer.parseInt(value);
        } catch (NumberFormatException e) {
            log.warn("⚠️ 숫자 변환 실패: {}:{}, 기본값 사용: {}", codeGroup, codeValue, defaultValue, e);
            return defaultValue;
        }
    }
    
    @Override
    public Boolean getConfigBooleanValue(String codeGroup, String codeValue, Boolean defaultValue) {
        try {
            String value = getConfigValue(codeGroup, codeValue, String.valueOf(defaultValue));
            return Boolean.parseBoolean(value);
        } catch (Exception e) {
            log.warn("⚠️ 불린 변환 실패: {}:{}, 기본값 사용: {}", codeGroup, codeValue, defaultValue, e);
            return defaultValue;
        }
    }
    
    /**
     * 비밀번호 정책 메시지 조회
     */
    private Map<String, String> getPasswordPolicyMessages() {
        Map<String, String> messages = new HashMap<>();
        
        messages.put("required", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_REQUIRED", "비밀번호를 입력해주세요."));
        messages.put("tooShort", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_TOO_SHORT", "비밀번호는 최소 {minLength}자 이상이어야 합니다."));
        messages.put("tooLong", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_TOO_LONG", "비밀번호는 최대 {maxLength}자 이하여야 합니다."));
        messages.put("uppercaseRequired", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_UPPERCASE_REQUIRED", "비밀번호는 최소 1개의 대문자를 포함해야 합니다."));
        messages.put("lowercaseRequired", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_LOWERCASE_REQUIRED", "비밀번호는 최소 1개의 소문자를 포함해야 합니다."));
        messages.put("digitRequired", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_DIGIT_REQUIRED", "비밀번호는 최소 1개의 숫자를 포함해야 합니다."));
        messages.put("specialRequired", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_SPECIAL_REQUIRED", "비밀번호는 최소 1개의 특수문자를 포함해야 합니다."));
        messages.put("consecutiveForbidden", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_CONSECUTIVE_FORBIDDEN", "비밀번호에 연속된 3개 이상의 문자는 사용할 수 없습니다."));
        messages.put("repeatedForbidden", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_REPEATED_FORBIDDEN", "비밀번호에 동일한 문자가 3개 이상 연속으로 사용될 수 없습니다."));
        messages.put("commonPattern", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_COMMON_PATTERN", "일반적인 패턴의 비밀번호는 사용할 수 없습니다."));
        messages.put("validationSuccess", getConfigValue(PASSWORD_POLICY_GROUP, "MSG_VALIDATION_SUCCESS", "비밀번호가 정책을 만족합니다."));
        
        return messages;
    }
    
    /**
     * JSON 값 파싱 (간단한 형태)
     */
    private String parseJsonValue(String jsonValue) {
        if (jsonValue == null || jsonValue.trim().isEmpty()) {
            return null;
        }
        
        // 간단한 JSON 파싱: {"value": "actual_value"} 형태
        if (jsonValue.contains("\"value\"")) {
            try {
                int start = jsonValue.indexOf("\"value\"") + 8;
                int end = jsonValue.lastIndexOf("\"");
                if (start > 7 && end > start) {
                    return jsonValue.substring(start, end);
                }
            } catch (Exception e) {
                log.debug("JSON 파싱 실패, 원본 값 사용: {}", jsonValue);
            }
        }
        
        return jsonValue;
    }
}

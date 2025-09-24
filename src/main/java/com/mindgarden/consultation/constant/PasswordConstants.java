package com.mindgarden.consultation.constant;

/**
 * 비밀번호 관련 상수 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
public final class PasswordConstants {
    
    // === 비밀번호 정책 상수 ===
    public static final int MIN_LENGTH = 8;
    public static final int MAX_LENGTH = 128;
    public static final int MIN_UPPERCASE = 1;
    public static final int MIN_LOWERCASE = 1;
    public static final int MIN_DIGITS = 1;
    public static final int MIN_SPECIAL_CHARS = 1;
    public static final int MAX_CONSECUTIVE = 2;
    public static final int MAX_REPEATED = 2;
    
    // === 비밀번호 재설정 상수 ===
    public static final int TOKEN_EXPIRY_HOURS = 24;
    public static final int MAX_RESET_ATTEMPTS = 3;
    public static final int RESET_COOLDOWN_MINUTES = 15;
    
    // === 비밀번호 변경 상수 ===
    public static final int PASSWORD_HISTORY_COUNT = 5;
    public static final int PASSWORD_CHANGE_COOLDOWN_HOURS = 1;
    
    // === 비밀번호 정책 메시지 ===
    public static final String MSG_PASSWORD_REQUIRED = "비밀번호를 입력해주세요.";
    public static final String MSG_PASSWORD_TOO_SHORT = "비밀번호는 최소 " + MIN_LENGTH + "자 이상이어야 합니다.";
    public static final String MSG_PASSWORD_TOO_LONG = "비밀번호는 최대 " + MAX_LENGTH + "자 이하여야 합니다.";
    public static final String MSG_PASSWORD_UPPERCASE_REQUIRED = "비밀번호는 최소 " + MIN_UPPERCASE + "개의 대문자를 포함해야 합니다.";
    public static final String MSG_PASSWORD_LOWERCASE_REQUIRED = "비밀번호는 최소 " + MIN_LOWERCASE + "개의 소문자를 포함해야 합니다.";
    public static final String MSG_PASSWORD_DIGIT_REQUIRED = "비밀번호는 최소 " + MIN_DIGITS + "개의 숫자를 포함해야 합니다.";
    public static final String MSG_PASSWORD_SPECIAL_REQUIRED = "비밀번호는 최소 " + MIN_SPECIAL_CHARS + "개의 특수문자를 포함해야 합니다.";
    public static final String MSG_PASSWORD_CONSECUTIVE_FORBIDDEN = "비밀번호에 연속된 " + (MAX_CONSECUTIVE + 1) + "개 이상의 문자는 사용할 수 없습니다.";
    public static final String MSG_PASSWORD_REPEATED_FORBIDDEN = "비밀번호에 동일한 문자가 " + (MAX_REPEATED + 1) + "개 이상 연속으로 사용될 수 없습니다.";
    public static final String MSG_PASSWORD_COMMON_PATTERN = "일반적인 패턴의 비밀번호는 사용할 수 없습니다.";
    public static final String MSG_PASSWORD_VALIDATION_SUCCESS = "비밀번호가 정책을 만족합니다.";
    
    // === 비밀번호 재설정 메시지 ===
    public static final String MSG_RESET_EMAIL_SENT = "비밀번호 재설정 이메일이 발송되었습니다.";
    public static final String MSG_RESET_EMAIL_FAILED = "비밀번호 재설정 이메일 발송에 실패했습니다.";
    public static final String MSG_RESET_TOKEN_INVALID = "유효하지 않은 재설정 토큰입니다.";
    public static final String MSG_RESET_TOKEN_EXPIRED = "재설정 토큰이 만료되었습니다.";
    public static final String MSG_RESET_TOKEN_USED = "이미 사용된 재설정 토큰입니다.";
    public static final String MSG_RESET_SUCCESS = "비밀번호가 성공적으로 재설정되었습니다.";
    public static final String MSG_RESET_FAILED = "비밀번호 재설정에 실패했습니다.";
    public static final String MSG_RESET_ATTEMPTS_EXCEEDED = "비밀번호 재설정 시도 횟수를 초과했습니다.";
    public static final String MSG_RESET_COOLDOWN = "비밀번호 재설정 요청은 " + RESET_COOLDOWN_MINUTES + "분 후에 다시 시도해주세요.";
    
    // === 비밀번호 변경 메시지 ===
    public static final String MSG_CHANGE_CURRENT_PASSWORD_INCORRECT = "현재 비밀번호가 올바르지 않습니다.";
    public static final String MSG_CHANGE_NEW_PASSWORD_SAME = "새 비밀번호는 현재 비밀번호와 달라야 합니다.";
    public static final String MSG_CHANGE_CONFIRM_PASSWORD_MISMATCH = "비밀번호 확인이 일치하지 않습니다.";
    public static final String MSG_CHANGE_SUCCESS = "비밀번호가 성공적으로 변경되었습니다.";
    public static final String MSG_CHANGE_FAILED = "비밀번호 변경에 실패했습니다.";
    public static final String MSG_CHANGE_COOLDOWN = "비밀번호 변경은 " + PASSWORD_CHANGE_COOLDOWN_HOURS + "시간 후에 다시 시도해주세요.";
    public static final String MSG_CHANGE_HISTORY_DUPLICATE = "최근 사용한 비밀번호는 사용할 수 없습니다.";
    
    // === 비밀번호 정책 패턴 ===
    public static final String PATTERN_UPPERCASE = ".*[A-Z].*";
    public static final String PATTERN_LOWERCASE = ".*[a-z].*";
    public static final String PATTERN_DIGITS = ".*[0-9].*";
    public static final String PATTERN_SPECIAL_CHARS = ".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*";
    
    // === 일반적인 비밀번호 패턴 ===
    public static final String[] COMMON_PATTERNS = {
        "password", "123456", "qwerty", "admin", "user",
        "password123", "admin123", "test123", "hello123",
        "welcome", "login", "letmein", "master", "secret"
    };
    
    // === 비밀번호 재설정 이메일 템플릿 변수 ===
    public static final String VAR_RESET_LINK = "{{resetLink}}";
    public static final String VAR_USER_NAME = "{{userName}}";
    public static final String VAR_EXPIRY_HOURS = "{{expiryHours}}";
    public static final String VAR_COMPANY_NAME = "{{companyName}}";
    public static final String VAR_SUPPORT_EMAIL = "{{supportEmail}}";
    
    private PasswordConstants() {
        // 유틸리티 클래스이므로 인스턴스 생성 방지
        throw new UnsupportedOperationException("유틸리티 클래스입니다.");
    }
}

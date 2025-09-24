package com.mindgarden.consultation.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * 비밀번호 정책 설정 클래스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-17
 */
@Configuration
public class PasswordPolicyConfig {

    @Value("${security.password.strength:12}")
    private int bcryptStrength;

    /**
     * 강화된 비밀번호 인코더
     * BCrypt 강도 12 (권장값: 10-12)
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(bcryptStrength);
    }

    /**
     * 비밀번호 정책 검증기
     */
    @Bean
    public PasswordValidator passwordValidator() {
        return new PasswordValidator();
    }

    /**
     * 비밀번호 정책 검증 클래스
     */
    public static class PasswordValidator {
        
        private static final int MIN_LENGTH = 8;
        private static final int MAX_LENGTH = 128;
        
        /**
         * 비밀번호 정책 검증
         * 
         * @param password 검증할 비밀번호
         * @return 검증 결과 메시지 (null이면 통과)
         */
        public String validatePassword(String password) {
            if (password == null || password.trim().isEmpty()) {
                return "비밀번호를 입력해주세요.";
            }
            
            if (password.length() < MIN_LENGTH) {
                return "비밀번호는 최소 " + MIN_LENGTH + "자 이상이어야 합니다.";
            }
            
            if (password.length() > MAX_LENGTH) {
                return "비밀번호는 최대 " + MAX_LENGTH + "자 이하여야 합니다.";
            }
            
            // 대문자 포함 확인
            if (!password.matches(".*[A-Z].*")) {
                return "비밀번호는 최소 1개의 대문자를 포함해야 합니다.";
            }
            
            // 소문자 포함 확인
            if (!password.matches(".*[a-z].*")) {
                return "비밀번호는 최소 1개의 소문자를 포함해야 합니다.";
            }
            
            // 숫자 포함 확인
            if (!password.matches(".*[0-9].*")) {
                return "비밀번호는 최소 1개의 숫자를 포함해야 합니다.";
            }
            
            // 특수문자 포함 확인
            if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
                return "비밀번호는 최소 1개의 특수문자를 포함해야 합니다.";
            }
            
            // 연속된 문자 확인 (3개 이상)
            if (hasConsecutiveCharacters(password)) {
                return "비밀번호에 연속된 3개 이상의 문자는 사용할 수 없습니다.";
            }
            
            // 반복 문자 확인 (3개 이상)
            if (hasRepeatedCharacters(password)) {
                return "비밀번호에 동일한 문자가 3개 이상 연속으로 사용될 수 없습니다.";
            }
            
            // 일반적인 패턴 확인
            if (isCommonPattern(password)) {
                return "일반적인 패턴의 비밀번호는 사용할 수 없습니다.";
            }
            
            return null; // 검증 통과
        }
        
        /**
         * 연속된 문자 확인 (abc, 123 등)
         */
        private boolean hasConsecutiveCharacters(String password) {
            for (int i = 0; i < password.length() - 2; i++) {
                char c1 = password.charAt(i);
                char c2 = password.charAt(i + 1);
                char c3 = password.charAt(i + 2);
                
                if ((c2 == c1 + 1 && c3 == c2 + 1) || 
                    (c2 == c1 - 1 && c3 == c2 - 1)) {
                    return true;
                }
            }
            return false;
        }
        
        /**
         * 반복 문자 확인 (aaa, 111 등)
         */
        private boolean hasRepeatedCharacters(String password) {
            for (int i = 0; i < password.length() - 2; i++) {
                char c1 = password.charAt(i);
                char c2 = password.charAt(i + 1);
                char c3 = password.charAt(i + 2);
                
                if (c1 == c2 && c2 == c3) {
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
            
            // 일반적인 패턴들
            String[] commonPatterns = {
                "password", "123456", "qwerty", "admin", "user",
                "password123", "admin123", "test123", "hello123"
            };
            
            for (String pattern : commonPatterns) {
                if (lowerPassword.contains(pattern)) {
                    return true;
                }
            }
            
            return false;
        }
    }
}

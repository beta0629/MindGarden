package com.coresolution.consultation.config;

import com.coresolution.core.security.PasswordPolicy;
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

        /**
         * 비밀번호 정책 검증(로그인 저장 정책 SSOT: {@link PasswordPolicy}).
         *
         * @param password 검증할 비밀번호
         * @return 검증 결과 메시지 (null이면 통과)
         */
        public String validatePassword(String password) {
            if (password == null || password.trim().isEmpty()) {
                return "비밀번호를 입력해주세요.";
            }
            return PasswordPolicy.firstLoginStorageViolationMessage(password.trim());
        }
    }
}

package com.coresolution.core.security;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

/**
 * 비밀번호·시크릿 BCrypt 처리 단일 진입점.
 * <ul>
 *   <li>로그인용 비밀번호(사용자·관리자 입력) 저장/변경: {@link #encodePassword} — 정책 검증 후 인코딩</li>
 *   <li>시스템/소셜 플레이스홀더, 임시 비밀번호, 시드, 토큰 해시 등: {@link #encodeSecret} — 동일 {@link PasswordEncoder} 빈만 사용, 정책 없음</li>
 * </ul>
 *
 * @author CoreSolution
 * @version 1.0.0
 * @since 2025-12-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PasswordService {
    
    private final PasswordEncoder passwordEncoder;
    
    /**
     * 비밀번호 검증(로그인 저장 정책 SSOT: {@link PasswordPolicy}).
     *
     * @param password 평문 비밀번호
     * @throws InvalidPasswordException 정책 불충족 시
     */
    public void validatePassword(String password) {
        String violation = PasswordPolicy.firstLoginStorageViolationMessage(password);
        if (violation != null) {
            throw new InvalidPasswordException(violation);
        }
    }
    
    /**
     * 로그인 비밀번호 암호화(정책 검증 후 BCrypt).
     *
     * @param rawPassword 평문 비밀번호
     * @return BCrypt 해시
     */
    public String encodePassword(String rawPassword) {
        validatePassword(rawPassword);
        String encoded = passwordEncoder.encode(rawPassword);
        log.debug("비밀번호 암호화 완료");
        return encoded;
    }

    /**
     * 정책 검증 없이 평문을 BCrypt 인코딩한다.
     * OAuth 소셜용 플레이스홀더 비밀번호, 자동 생성 임시 비밀번호, 개발 시드, 리프레시 토큰 해시 저장 등에 사용한다.
     *
     * @param rawSecret null이 아닌 평문
     * @return BCrypt 해시
     * @throws IllegalArgumentException {@code rawSecret == null}
     */
    public String encodeSecret(String rawSecret) {
        if (rawSecret == null) {
            throw new IllegalArgumentException("rawSecret must not be null");
        }
        String encoded = passwordEncoder.encode(rawSecret);
        log.debug("시크릿 인코딩 완료(정책 미적용)");
        return encoded;
    }
    
    /**
     * 비밀번호 일치 확인
     */
    public boolean matches(String rawPassword, String encodedPassword) {
        boolean matches = passwordEncoder.matches(rawPassword, encodedPassword);
        log.debug("비밀번호 일치 확인: {}", matches ? "성공" : "실패");
        return matches;
    }
    
    /**
     * 비밀번호 강도 평가
     */
    public PasswordStrength evaluateStrength(String password) {
        if (password == null || password.length() < PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH) {
            return PasswordStrength.WEAK;
        }
        
        int score = 0;
        
        // 길이 점수
        if (password.length() >= 12) score += 2;
        else if (password.length() >= 10) score += 1;
        
        // 대문자 포함
        if (password.matches(".*[A-Z].*")) score += 1;
        
        // 소문자 포함
        if (password.matches(".*[a-z].*")) score += 1;
        
        // 숫자 포함
        if (password.matches(".*[0-9].*")) score += 1;
        
        // 허용 특수문자 포함(저장 정책과 동일 집합)
        if (PasswordPolicy.containsRequiredLoginSpecial(password)) {
            score += 1;
        }
        
        if (score >= 6) return PasswordStrength.VERY_STRONG;
        if (score >= 5) return PasswordStrength.STRONG;
        if (score >= 4) return PasswordStrength.MEDIUM;
        return PasswordStrength.WEAK;
    }
    
    /**
     * 비밀번호 강도 Enum
     */
    public enum PasswordStrength {
        WEAK("약함"),
        MEDIUM("보통"),
        STRONG("강함"),
        VERY_STRONG("매우 강함");
        
        private final String description;
        
        PasswordStrength(String description) {
            this.description = description;
        }
        
        public String getDescription() {
            return description;
        }
    }
    
    /**
     * 비밀번호 예외
     */
    public static class InvalidPasswordException extends RuntimeException {
        public InvalidPasswordException(String message) {
            super(message);
        }
    }
}


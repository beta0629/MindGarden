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
    
    // 비밀번호 정책
    private static final int PASSWORD_MIN_LENGTH = 8;
    private static final int PASSWORD_MAX_LENGTH = 100;
    private static final String PASSWORD_PATTERN = 
        "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$";
    
    /**
     * 비밀번호 검증
     */
    public void validatePassword(String password) {
        if (password == null || password.length() < PASSWORD_MIN_LENGTH) {
            throw new InvalidPasswordException(
                String.format("비밀번호는 최소 %d자 이상이어야 합니다.", PASSWORD_MIN_LENGTH)
            );
        }
        
        if (password.length() > PASSWORD_MAX_LENGTH) {
            throw new InvalidPasswordException(
                String.format("비밀번호는 최대 %d자 이하여야 합니다.", PASSWORD_MAX_LENGTH)
            );
        }
        
        if (!password.matches(PASSWORD_PATTERN)) {
            throw new InvalidPasswordException(
                "비밀번호는 영문 대소문자, 숫자, 특수문자(@$!%*?&)를 각각 1개 이상 포함해야 합니다."
            );
        }
        
        // 연속된 문자 체크 (abc, 123 등)
        if (hasSequentialCharacters(password)) {
            throw new InvalidPasswordException(
                "비밀번호에 연속된 문자(abc, 123 등)를 사용할 수 없습니다."
            );
        }
        
        // 반복된 문자 체크 (aaa, 111 등)
        if (hasRepeatedCharacters(password)) {
            throw new InvalidPasswordException(
                "비밀번호에 동일한 문자가 3회 이상 반복될 수 없습니다."
            );
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
        if (password == null || password.length() < PASSWORD_MIN_LENGTH) {
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
        
        // 특수문자 포함
        if (password.matches(".*[@$!%*?&].*")) score += 1;
        
        // 다양한 특수문자 포함
        if (password.matches(".*[^A-Za-z0-9].*")) score += 1;
        
        if (score >= 6) return PasswordStrength.VERY_STRONG;
        if (score >= 5) return PasswordStrength.STRONG;
        if (score >= 4) return PasswordStrength.MEDIUM;
        return PasswordStrength.WEAK;
    }
    
    /**
     * 연속된 문자 체크
     */
    private boolean hasSequentialCharacters(String password) {
        for (int i = 0; i < password.length() - 2; i++) {
            char c1 = password.charAt(i);
            char c2 = password.charAt(i + 1);
            char c3 = password.charAt(i + 2);
            
            // 연속된 숫자 (123, 234 등)
            if (c1 + 1 == c2 && c2 + 1 == c3) {
                return true;
            }
            
            // 역순 연속 숫자 (321, 432 등)
            if (c1 - 1 == c2 && c2 - 1 == c3) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 반복된 문자 체크
     */
    private boolean hasRepeatedCharacters(String password) {
        return password.matches(".*(.)\\1{2,}.*");
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


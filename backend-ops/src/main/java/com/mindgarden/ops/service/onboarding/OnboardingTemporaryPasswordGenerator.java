package com.mindgarden.ops.service.onboarding;

import java.security.SecureRandom;

/**
 * 온보딩 관리자 임시 비밀번호를 요청마다 생성한다.
 * 문자 규칙은 메인 앱 {@code com.coresolution.core.security.PasswordPolicy} 와 같다.
 * 평문은 로그·상수로 남기지 않고, 호출부가 {@code PasswordEncoder} 로 해시한다.
 *
 * @author MindGarden
 * @since 2026-10-03
 */
public final class OnboardingTemporaryPasswordGenerator {

    /** 로그인 비밀번호 최소 길이. PasswordPolicy.LOGIN_PASSWORD_MIN_LENGTH 와 동일. */
    static final int MIN_LENGTH = 8;

    /** 로그인 비밀번호 최대 길이. PasswordPolicy.LOGIN_PASSWORD_MAX_LENGTH 와 동일. */
    static final int MAX_LENGTH = 100;

    private static final String ALLOWED_SPECIALS = "@$!%*?&";

    private static final String ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789" + ALLOWED_SPECIALS;

    private static final String[] COMMON_SUBSTRINGS = {
        "password", "123456", "qwerty", "admin", "user",
        "password123", "admin123", "test123", "hello123",
        "welcome", "login", "letmein", "master", "secret"
    };

    private static final SecureRandom RANDOM = new SecureRandom();

    private OnboardingTemporaryPasswordGenerator() {
    }

    /**
     * 정책 통과 평문을 새로 만든다. 호출마다 값이 달라진다.
     *
     * @return 정책 통과 평문
     * @throws IllegalStateException 반복 생성에 실패한 경우
     */
    public static String generate() {
        for (int attempt = 0; attempt < 512; attempt++) {
            int length = 14 + RANDOM.nextInt(9);
            StringBuilder sb = new StringBuilder(length);
            for (int i = 0; i < length; i++) {
                sb.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
            }
            String candidate = sb.toString();
            if (meetsLoginPolicy(candidate)) {
                return candidate;
            }
        }
        throw new IllegalStateException("온보딩 임시 비밀번호 생성에 실패했습니다.");
    }

    /**
     * 로그인 저장 정책 통과 여부. 해시 문자열은 대상이 아니다.
     *
     * @param password 평문
     * @return 통과하면 true
     */
    static boolean meetsLoginPolicy(String password) {
        if (password == null || password.length() < MIN_LENGTH || password.length() > MAX_LENGTH) {
            return false;
        }
        if (!password.matches("[A-Za-z\\d@$!%*?&]+")) {
            return false;
        }
        if (!password.matches(".*[a-z].*") || !password.matches(".*[A-Z].*")
                || !password.matches(".*\\d.*") || !password.matches(".*[@$!%*?&].*")) {
            return false;
        }
        if (hasSequentialCharacters(password) || hasRepeatedCharacters(password)
                || isCommonPattern(password)) {
            return false;
        }
        return true;
    }

    private static boolean isCommonPattern(String password) {
        String lower = password.toLowerCase();
        for (String pattern : COMMON_SUBSTRINGS) {
            if (lower.contains(pattern)) {
                return true;
            }
        }
        return false;
    }

    private static boolean hasSequentialCharacters(String password) {
        for (int i = 0; i < password.length() - 2; i++) {
            char c1 = password.charAt(i);
            char c2 = password.charAt(i + 1);
            char c3 = password.charAt(i + 2);
            if ((c1 + 1 == c2 && c2 + 1 == c3) || (c1 - 1 == c2 && c2 - 1 == c3)) {
                return true;
            }
        }
        return false;
    }

    private static boolean hasRepeatedCharacters(String password) {
        return password.matches(".*(.)\\1{2,}.*");
    }
}

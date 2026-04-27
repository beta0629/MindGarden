package com.coresolution.core.security;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 로그인 비밀번호 저장(BCrypt 인코딩) 정책의 단일 진입점(SSOT).
 * {@link PasswordService#encodePassword(String)} 및 클라이언트/관리자 검증 API가 동일 규칙을 사용한다.
 *
 * @author CoreSolution
 * @since 2026-04-27
 */
public final class PasswordPolicy {

    /**
     * 로그인 비밀번호 최소 길이.
     */
    public static final int LOGIN_PASSWORD_MIN_LENGTH = 8;

    /**
     * 로그인 비밀번호 최대 길이.
     */
    public static final int LOGIN_PASSWORD_MAX_LENGTH = 100;

    /**
     * 비밀번호 본문에 허용되는 특수문자(반드시 1개 이상 포함).
     */
    public static final String LOGIN_PASSWORD_ALLOWED_SPECIALS = "@$!%*?&";

    private static final String LOGIN_CHARSET_CLASS = "A-Za-z\\d@$!%*?&";

    private static final String[] COMMON_SUBSTRINGS = {
        "password", "123456", "qwerty", "admin", "user",
        "password123", "admin123", "test123", "hello123",
        "welcome", "login", "letmein", "master", "secret"
    };

    private PasswordPolicy() {
    }

    /**
     * 로그인 저장 정책 위반을 순서대로 수집한다. 비어 있으면 통과.
     *
     * @param password 평문(이미 trim 되었을 것으로 가정; null 허용)
     * @return 위반 코드 → 메시지(한국어), 통과 시 빈 맵
     */
    public static Map<String, String> collectLoginStorageViolations(String password) {
        LinkedHashMap<String, String> errors = new LinkedHashMap<>();
        if (password == null || password.length() < LOGIN_PASSWORD_MIN_LENGTH) {
            errors.put("tooShort", String.format("비밀번호는 최소 %d자 이상이어야 합니다.", LOGIN_PASSWORD_MIN_LENGTH));
            return errors;
        }
        if (password.length() > LOGIN_PASSWORD_MAX_LENGTH) {
            errors.put("tooLong", String.format("비밀번호는 최대 %d자 이하여야 합니다.", LOGIN_PASSWORD_MAX_LENGTH));
            return errors;
        }
        if (!password.matches("[" + LOGIN_CHARSET_CLASS + "]+")) {
            errors.put("invalidCharacters",
                "비밀번호에 허용되지 않은 문자가 포함되어 있습니다. 특수문자는 "
                    + LOGIN_PASSWORD_ALLOWED_SPECIALS + "만 사용할 수 있습니다.");
            return errors;
        }
        if (!password.matches(".*[a-z].*")) {
            errors.put("lowercaseRequired", "비밀번호는 최소 1개의 소문자를 포함해야 합니다.");
            return errors;
        }
        if (!password.matches(".*[A-Z].*")) {
            errors.put("uppercaseRequired", "비밀번호는 최소 1개의 대문자를 포함해야 합니다.");
            return errors;
        }
        if (!password.matches(".*\\d.*")) {
            errors.put("digitRequired", "비밀번호는 최소 1개의 숫자를 포함해야 합니다.");
            return errors;
        }
        if (!password.matches(".*[@$!%*?&].*")) {
            errors.put("specialRequired",
                "비밀번호는 특수문자(" + LOGIN_PASSWORD_ALLOWED_SPECIALS + ")를 최소 1개 포함해야 합니다.");
            return errors;
        }
        if (hasSequentialCharacters(password)) {
            errors.put("consecutiveForbidden", "비밀번호에 연속된 문자(abc, 123 등)를 사용할 수 없습니다.");
            return errors;
        }
        if (hasRepeatedCharacters(password)) {
            errors.put("repeatedForbidden", "비밀번호에 동일한 문자가 3회 이상 반복될 수 없습니다.");
            return errors;
        }
        if (isCommonPattern(password)) {
            errors.put("commonPattern", "일반적인 패턴의 비밀번호는 사용할 수 없습니다.");
            return errors;
        }
        return errors;
    }

    /**
     * {@link PasswordService#validatePassword(String)}와 동일한 첫 거절 메시지.
     *
     * @param password 평문
     * @return 통과 시 {@code null}
     */
    public static String firstLoginStorageViolationMessage(String password) {
        Map<String, String> m = collectLoginStorageViolations(password);
        return m.isEmpty() ? null : m.values().iterator().next();
    }

    /**
     * 로그인 비밀번호에 사용 가능한 문자만 포함하는지.
     *
     * @param password 평문
     * @return 허용 문자만이면 true
     */
    public static boolean containsOnlyLoginPasswordCharset(String password) {
        return password != null && password.matches("[" + LOGIN_CHARSET_CLASS + "]+");
    }

    /**
     * 허용 특수문자 중 하나 이상 포함 여부.
     *
     * @param password 평문
     * @return 포함 시 true
     */
    public static boolean containsRequiredLoginSpecial(String password) {
        return password != null && password.matches(".*[@$!%*?&].*");
    }

    /**
     * 일반적으로 금지하는 부분 문자열 포함 여부.
     *
     * @param password 평문
     * @return 포함 시 true
     */
    public static boolean isCommonPattern(String password) {
        if (password == null) {
            return false;
        }
        String lower = password.toLowerCase();
        for (String p : COMMON_SUBSTRINGS) {
            if (lower.contains(p)) {
                return true;
            }
        }
        return false;
    }

    /**
     * 연속 증가/감소 문자 3개 이상(문자 코드 기준).
     */
    public static boolean hasSequentialCharacters(String password) {
        for (int i = 0; i < password.length() - 2; i++) {
            char c1 = password.charAt(i);
            char c2 = password.charAt(i + 1);
            char c3 = password.charAt(i + 2);
            if (c1 + 1 == c2 && c2 + 1 == c3) {
                return true;
            }
            if (c1 - 1 == c2 && c2 - 1 == c3) {
                return true;
            }
        }
        return false;
    }

    /**
     * 동일 문자 3회 이상 연속.
     */
    public static boolean hasRepeatedCharacters(String password) {
        return password.matches(".*(.)\\1{2,}.*");
    }
}

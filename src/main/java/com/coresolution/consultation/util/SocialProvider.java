package com.coresolution.consultation.util;

import java.util.Locale;

/**
 * 소셜 로그인·간편가입에서 provider·이메일 저장·조회 정규화.
 *
 * @author MindGarden
 * @since 2026-04-09
 */
public final class SocialProvider {

    private SocialProvider() {
    }

    /**
     * SNS 제공자명 정규화: trim 후 {@link Locale#ROOT} 대문자. null·공백만이면 null.
     *
     * @param provider 원본 제공자 문자열
     * @return 정규형 또는 null
     */
    public static String normalize(String provider) {
        if (provider == null) {
            return null;
        }
        String trimmed = provider.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.toUpperCase(Locale.ROOT);
    }

    /**
     * 로그인·중복검사용 이메일: trim 후 소문자. null·공백만이면 null.
     *
     * @param email 원본 이메일
     * @return 정규형 또는 null
     */
    public static String normalizeEmail(String email) {
        if (email == null) {
            return null;
        }
        String trimmed = email.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        return trimmed.toLowerCase(Locale.ROOT);
    }
}

package com.coresolution.consultation.util;

/**
 * 차량번호 정규화·형식 검증 (MVP: 숫자·한글·영문·하이픈·공백, trim·연속 공백 축소·영문 대문자).
 *
 * @author CoreSolution
 * @since 2026-03-28
 */
public final class VehiclePlateText {

    private VehiclePlateText() {
    }

    /**
     * 앞뒤 trim, 연속 공백을 단일 공백으로 축소, 영문 소문자는 대문자로 변환.
     * 빈 문자열이면 {@code null}.
     *
     * @param raw 입력
     * @return 정규화 값 또는 null
     */
    public static String normalizeOrNull(String raw) {
        if (raw == null) {
            return null;
        }
        String trimmed = raw.trim();
        if (trimmed.isEmpty()) {
            return null;
        }
        String collapsed = trimmed.replaceAll("\\s+", " ");
        StringBuilder sb = new StringBuilder(collapsed.length());
        for (int i = 0; i < collapsed.length(); i++) {
            char c = collapsed.charAt(i);
            if (c >= 'a' && c <= 'z') {
                sb.append(Character.toUpperCase(c));
            } else {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    /**
     * 정규화된 문자열이 규칙을 만족하는지 검사 (null·빈 문자열은 유효로 간주).
     *
     * @param normalized {@link #normalizeOrNull(String)} 결과
     * @return 규칙 충족 시 true
     */
    public static boolean isValidNormalized(String normalized) {
        if (normalized == null || normalized.isEmpty()) {
            return true;
        }
        if (normalized.length() > 32) {
            return false;
        }
        for (int i = 0; i < normalized.length(); i++) {
            char c = normalized.charAt(i);
            if (c >= '0' && c <= '9') {
                continue;
            }
            if (c >= 'A' && c <= 'Z') {
                continue;
            }
            if (c == '-' || c == ' ') {
                continue;
            }
            if (isHangulChar(c)) {
                continue;
            }
            return false;
        }
        return true;
    }

    private static boolean isHangulChar(char c) {
        Character.UnicodeBlock block = Character.UnicodeBlock.of(c);
        return block == Character.UnicodeBlock.HANGUL_SYLLABLES
                || block == Character.UnicodeBlock.HANGUL_JAMO
                || block == Character.UnicodeBlock.HANGUL_COMPATIBILITY_JAMO;
    }
}

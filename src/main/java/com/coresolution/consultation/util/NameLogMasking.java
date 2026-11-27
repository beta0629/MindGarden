package com.coresolution.consultation.util;

/**
 * 로그 출력용 이름 마스킹 유틸.
 *
 * <p>{@link PhoneLogMasking}·{@link EmailLogMasking}와 동일 계열로, 단순 문자열 변환만 수행하며
 * 외부 의존성·설정 기반 규칙은 갖지 않는다. 규칙은 {@link PersonalDataEncryptionUtil#maskName(String)}과 동일하다.</p>
 *
 * <p>마스킹 규칙:</p>
 * <ul>
 *     <li>{@code null} 또는 공백만이면 원본 그대로</li>
 *     <li>길이 1: 원본 그대로</li>
 *     <li>길이 2: 첫 글자 + {@code *}</li>
 *     <li>그 외: 첫 글자 + 중간 {@code *} + 끝 글자</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-11-27
 */
public final class NameLogMasking {

    private NameLogMasking() {
    }

    /**
     * 로그용 이름 마스킹.
     *
     * @param name 원본 이름(평문)
     * @return 마스킹된 이름
     */
    public static String maskForLog(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }

        if (name.length() <= 1) {
            return name;
        }

        if (name.length() == 2) {
            return name.charAt(0) + "*";
        }

        return name.charAt(0) + "*".repeat(name.length() - 2) + name.charAt(name.length() - 1);
    }
}

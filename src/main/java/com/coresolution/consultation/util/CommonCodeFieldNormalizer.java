package com.coresolution.consultation.util;

/**
 * 공통코드 식별·부모 코드 필드 공백 정규화.
 * <p>대상: {@code codeGroup}, {@code codeValue}, {@code parentCodeGroup}, {@code parentCodeValue}.
 * null-safe trim. trim 후 빈 문자열이면 null (기존 parent trimToNull 관례와 동일).</p>
 * <p>{@code codeLabel}, {@code codeDescription}, {@code koreanName}, {@code extraData} 등
 * 라벨·본문 필드는 trim 하지 않는다 (SMS_TEMPLATE 본문 줄바꿈 등 보존).</p>
 *
 * @author CoreSolution
 * @since 2026-10-18
 */
public final class CommonCodeFieldNormalizer {

    private CommonCodeFieldNormalizer() {
    }

    /**
     * null-safe trim. null 유지. trim 후 공백뿐이면 null.
     *
     * @param value 원본
     * @return 정규화된 값 또는 null
     */
    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    /**
     * @param codeGroup 코드 그룹
     * @return 정규화된 codeGroup
     */
    public static String normalizeCodeGroup(String codeGroup) {
        return trimToNull(codeGroup);
    }

    /**
     * @param codeValue 코드 값
     * @return 정규화된 codeValue
     */
    public static String normalizeCodeValue(String codeValue) {
        return trimToNull(codeValue);
    }
}

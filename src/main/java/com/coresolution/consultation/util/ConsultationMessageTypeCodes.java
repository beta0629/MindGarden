package com.coresolution.consultation.util;

import com.coresolution.consultation.service.CommonCodeService;

/**
 * {@link com.coresolution.consultation.entity.ConsultationMessage#messageType} DB 컬럼(20자)에 맞는 코드값 해석.
 *
 * @author MindGarden
 * @since 2026-05-18
 */
public final class ConsultationMessageTypeCodes {

    public static final int MAX_MESSAGE_TYPE_LENGTH = 20;
    public static final String COMMON_CODE_GROUP = "MESSAGE_TYPE";
    public static final String CANONICAL_APPOINTMENT = "APPOINTMENT";
    public static final String CANONICAL_NEW_APPOINTMENT = "NEW_APPOINTMENT";
    public static final String CANONICAL_PAYMENT_COMPLETION = "PAYMENT_COMPLETION";
    public static final String CANONICAL_GENERAL = "GENERAL";

    private ConsultationMessageTypeCodes() {
    }

    /**
     * 공통코드 MESSAGE_TYPE 조회 후 20자 이하만 반환. 초과·null·예외 시 canonicalFallback 사용.
     */
    public static String resolve(CommonCodeService commonCodeService, String codeKey, String canonicalFallback) {
        String fallback = normalize(canonicalFallback, CANONICAL_GENERAL);
        if (commonCodeService == null || codeKey == null || codeKey.isBlank()) {
            return fallback;
        }
        try {
            String codeValue = commonCodeService.getCodeValue(COMMON_CODE_GROUP, codeKey);
            String candidate = codeValue != null && !codeValue.isBlank() ? codeValue : codeKey;
            return normalize(candidate, fallback);
        } catch (Exception ignored) {
            return fallback;
        }
    }

    static String normalize(String value, String fallback) {
        if (value != null && !value.isBlank() && value.length() <= MAX_MESSAGE_TYPE_LENGTH) {
            return value;
        }
        if (fallback != null && !fallback.isBlank() && fallback.length() <= MAX_MESSAGE_TYPE_LENGTH) {
            return fallback;
        }
        return CANONICAL_GENERAL;
    }
}

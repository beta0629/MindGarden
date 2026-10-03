package com.coresolution.consultation.util;

/**
 * 시크릿 값(API 키·웹훅 시크릿 등) 응답 마스킹 유틸리티.
 *
 * <p>P0 보안(2026-10-03): 서버는 어떤 응답에서도 시크릿 평문을 내려주지 않는다.
 * 마지막 4자리만 노출하고 나머지는 {@link #MASK_CHAR} 로 치환한다. 4자 이하의 값은
 * 전체를 마스킹한다(길이 추정만 가능).
 *
 * <p>로그 마스킹은 {@link TokenLogMasking} 을 사용한다. 본 클래스는 API 응답 전용이다.
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-10-03
 */
public final class SecretValueMasking {

    /** 마스킹 문자. */
    public static final char MASK_CHAR = '*';

    /** 노출을 허용하는 꼬리 길이. */
    public static final int VISIBLE_TAIL_LENGTH = 4;

    /** 값이 없을 때 응답에 사용하는 빈 문자열. */
    public static final String EMPTY = "";

    private SecretValueMasking() {
    }

    /**
     * 시크릿 값을 마스킹한다.
     *
     * @param value 원본 값 (null 허용)
     * @return 마지막 4자리만 남긴 마스킹 문자열. 값이 비어 있으면 빈 문자열
     */
    public static String mask(String value) {
        if (value == null || value.isEmpty()) {
            return EMPTY;
        }
        int length = value.length();
        if (length <= VISIBLE_TAIL_LENGTH) {
            return String.valueOf(MASK_CHAR).repeat(length);
        }
        int maskedLength = length - VISIBLE_TAIL_LENGTH;
        return String.valueOf(MASK_CHAR).repeat(maskedLength)
                + value.substring(maskedLength);
    }

    /**
     * 값이 설정되어 있는지 여부 (프론트의 설정/미설정 배지용).
     *
     * @param value 원본 값 (null 허용)
     * @return 비어 있지 않으면 true
     */
    public static boolean isConfigured(String value) {
        return value != null && !value.isBlank();
    }
}

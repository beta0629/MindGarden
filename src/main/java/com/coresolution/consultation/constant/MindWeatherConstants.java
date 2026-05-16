package com.coresolution.consultation.constant;

/**
 * 마음 날씨 API 상수 (Expo {@code MIND_WEATHER_SOURCES}·길이 제한과 정합).
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public final class MindWeatherConstants {

    public static final int TEXT_MIN_LENGTH = 5;
    public static final int TEXT_MAX_LENGTH = 500;
    public static final int KEYWORD_DISPLAY_LIMIT = 5;

    public static final String SOURCE_MEMO = "memo";
    public static final String SOURCE_MOOD_JOURNAL = "mood-journal";
    public static final String SOURCE_VOICE = "voice";

    public static final String TONE_POSITIVE = "positive";
    public static final String TONE_NEGATIVE = "negative";
    public static final String TONE_MIXED = "mixed";
    public static final String TONE_EMPTY = "empty";

    /**
     * DB·복호화 결과에 남는 제네릭 표기는 실명으로 보지 않고 회원 ID 접미 표기로 넘긴다.
     */
    public static final String GENERIC_CLIENT_DISPLAY_LABEL = "내담자";

    private MindWeatherConstants() {
    }

    /**
     * 내담자 표시명이 비었거나 제네릭 라벨만인지 검사한다.
     *
     * @param value 표시 후보
     * @return 비실명·빈 값이면 true
     */
    public static boolean isGenericClientDisplayLabel(String value) {
        if (value == null) {
            return true;
        }
        String t = value.trim();
        return t.isEmpty() || GENERIC_CLIENT_DISPLAY_LABEL.equals(t);
    }

    /**
     * 허용된 source 값인지 검사한다.
     *
     * @param source 요청 source
     * @return 허용 시 true
     */
    public static boolean isAllowedSource(String source) {
        if (source == null) {
            return false;
        }
        return SOURCE_MEMO.equals(source) || SOURCE_MOOD_JOURNAL.equals(source) || SOURCE_VOICE.equals(source);
    }
}

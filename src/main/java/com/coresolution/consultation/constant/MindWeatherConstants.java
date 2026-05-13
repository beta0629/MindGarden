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

    private MindWeatherConstants() {
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

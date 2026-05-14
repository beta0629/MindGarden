package com.coresolution.consultation.constant;

import java.util.Map;

/**
 * 감정 일기 도메인 상수 (Expo {@code moodJournalService} 정합).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public final class MoodJournalConstants {

    public static final int MIN_MOOD_VALUE = 1;
    public static final int MAX_MOOD_VALUE = 5;
    public static final int MAX_MEMO_CHARS = 2000;
    public static final int MAX_TAGS = 20;
    public static final int MAX_TAG_LENGTH = 32;

    private static final Map<Integer, String> VALUE_TO_EMOJI = Map.of(
        1, "\uD83D\uDE22",
        2, "\uD83D\uDE1F",
        3, "\uD83D\uDE10",
        4, "\uD83D\uDE42",
        5, "\uD83D\uDE0A"
    );

    private MoodJournalConstants() {
    }

    /**
     * @param moodValue 1~5
     * @return 표시 이모지 (알 수 없으면 보통)
     */
    public static String emojiForMoodValue(int moodValue) {
        return VALUE_TO_EMOJI.getOrDefault(moodValue, "\uD83D\uDE10");
    }
}

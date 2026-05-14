package com.coresolution.consultation.constant;

import java.util.Arrays;
import java.util.Optional;

/**
 * Expo {@code AssessmentType} — PHQ9 / GAD7 / PSS.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public enum SelfAssessmentType {
    PHQ9,
    GAD7,
    PSS;

    /**
     * @param raw 클라이언트 문자열
     * @return 매칭 타입
     */
    public static Optional<SelfAssessmentType> fromClient(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String t = raw.trim();
        return Arrays.stream(values())
            .filter(v -> v.name().equalsIgnoreCase(t))
            .findFirst();
    }

    /**
     * @return 문항 수
     */
    public int expectedAnswerCount() {
        return switch (this) {
            case PHQ9 -> 9;
            case GAD7 -> 7;
            case PSS -> 10;
        };
    }
}

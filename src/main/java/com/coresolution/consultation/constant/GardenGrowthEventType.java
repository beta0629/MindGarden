package com.coresolution.consultation.constant;

import java.util.Optional;

/**
 * 「마음 정원」성장 이벤트 유형 — Expo {@code GardenGrowthEventType} 과 동일한 식별자.
 *
 * @author MindGarden
 * @since 2026-05-13
 */
public enum GardenGrowthEventType {
    SESSION_COMPLETED,
    HOMEWORK_COMPLETED,
    SELF_CARE_COMPLETED;

    /**
     * 클라이언트 문자열을 이벤트 유형으로 변환한다.
     *
     * @param raw 요청 본문의 eventType
     * @return 매칭되면 해당 enum, 아니면 empty
     */
    public static Optional<GardenGrowthEventType> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(GardenGrowthEventType.valueOf(raw.trim()));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}

package com.coresolution.consultation.dto.admin.wellness;

import java.time.LocalDateTime;

/**
 * 테넌트 단위 마음 날씨 관측 요약.
 *
 * @param totalCards              활성 카드 수
 * @param cardsWithShareSummary   요약 공유 true 수
 * @param cardsCreatedLast24Hours 최근 24시간 생성 수
 * @param newestCardCreatedAt     가장 최근 생성 시각(없으면 null)
 * @author MindGarden
 * @since 2026-05-14
 */
public record MindWeatherAdminSummaryResponse(
        long totalCards,
        long cardsWithShareSummary,
        long cardsCreatedLast24Hours,
        LocalDateTime newestCardCreatedAt) {
}

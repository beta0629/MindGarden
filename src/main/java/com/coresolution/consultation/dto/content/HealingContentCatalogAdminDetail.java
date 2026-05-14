package com.coresolution.consultation.dto.content;

/**
 * 힐링 카탈로그 어드민 상세.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public record HealingContentCatalogAdminDetail(
        Long id,
        String code,
        boolean published,
        int sortOrder,
        String title,
        String description,
        String category,
        String mediaType,
        String thumbnailUrl,
        String contentUrl,
        Integer durationMinutes
) {
}

package com.coresolution.consultation.dto.content;

/**
 * 힐링 카탈로그 어드민 상세.
 *
 * <p>Apple 1.4.1 — 출처 4 필드를 어드민 폼에서 편집할 수 있도록 raw 값을 그대로 노출한다.</p>
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
        Integer durationMinutes,
        String sourceLabel,
        String sourceUrl,
        String sourceAuthor,
        Integer sourcePublishedYear
) {
}

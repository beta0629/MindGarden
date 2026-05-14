package com.coresolution.consultation.dto.content;

import java.time.LocalDateTime;

/**
 * 힐링 카탈로그 어드민 목록 행.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public record HealingContentCatalogAdminItem(
        Long id,
        String code,
        String title,
        String category,
        String mediaType,
        boolean published,
        int sortOrder,
        LocalDateTime updatedAt
) {
}

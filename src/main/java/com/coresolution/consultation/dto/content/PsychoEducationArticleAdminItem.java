package com.coresolution.consultation.dto.content;

import java.time.LocalDateTime;

/**
 * 심리교육 마스터 어드민 목록 행.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public record PsychoEducationArticleAdminItem(
        Long id,
        String slug,
        String title,
        String category,
        boolean published,
        int sortOrder,
        LocalDateTime updatedAt
) {
}

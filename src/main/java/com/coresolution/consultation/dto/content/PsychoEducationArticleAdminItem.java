package com.coresolution.consultation.dto.content;

import java.time.LocalDateTime;

/**
 * 심리교육 마스터 어드민 목록 행.
 *
 * <p>Apple 1.4.1 — 출처 입력 여부({@code hasSource})를 어드민 목록에 노출하여
 * 미입력 콘텐츠를 한눈에 파악할 수 있게 한다.</p>
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
        LocalDateTime updatedAt,
        boolean hasSource
) {
}

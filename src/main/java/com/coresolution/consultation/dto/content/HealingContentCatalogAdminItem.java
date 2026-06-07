package com.coresolution.consultation.dto.content;

import java.time.LocalDateTime;

/**
 * 힐링 카탈로그 어드민 목록 행.
 *
 * <p>Apple 1.4.1 — 출처 입력 여부({@code hasSource})를 어드민 목록에 노출하여
 * 미입력 콘텐츠를 한눈에 파악할 수 있게 한다.</p>
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
        LocalDateTime updatedAt,
        boolean hasSource
) {
}

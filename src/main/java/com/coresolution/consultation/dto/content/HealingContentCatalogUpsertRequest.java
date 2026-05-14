package com.coresolution.consultation.dto.content;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * 힐링 카탈로그 마스터 생성·수정 요청.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public record HealingContentCatalogUpsertRequest(
        @NotBlank @Size(max = 64) String code,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 600) String description,
        @NotBlank @Size(max = 64) String category,
        @NotBlank @Size(max = 32) String mediaType,
        @Size(max = 512) String thumbnailUrl,
        @Size(max = 512) String contentUrl,
        Integer durationMinutes,
        boolean published,
        int sortOrder
) {
}

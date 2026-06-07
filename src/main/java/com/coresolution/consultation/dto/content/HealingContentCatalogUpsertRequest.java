package com.coresolution.consultation.dto.content;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * 힐링 카탈로그 마스터 생성·수정 요청.
 *
 * <p>Apple 1.4.1 (Medical Citations) — 출처 4 필드는 선택 입력. 미입력 시 사용자
 * 화면에 출처 섹션이 노출되지 않는다.</p>
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
        @PositiveOrZero Integer durationMinutes,
        boolean published,
        int sortOrder,
        @Size(max = 200) String sourceLabel,
        @Size(max = 500) String sourceUrl,
        @Size(max = 200) String sourceAuthor,
        @Min(1900) @Max(2100) Integer sourcePublishedYear
) {
}

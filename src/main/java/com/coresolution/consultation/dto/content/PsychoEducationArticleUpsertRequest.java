package com.coresolution.consultation.dto.content;

import com.coresolution.consultation.dto.PsychoEducationArticleResponse;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.util.List;

/**
 * 심리교육 마스터 생성·수정 요청.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public record PsychoEducationArticleUpsertRequest(
        @NotBlank @Size(max = 128) String slug,
        @NotBlank @Size(max = 200) String title,
        @NotBlank @Size(max = 600) String summary,
        @NotBlank String body,
        @NotBlank @Size(max = 32) String category,
        @NotBlank @Size(max = 64) String categoryLabel,
        @PositiveOrZero int readMinutes,
        @NotNull @NotEmpty List<PsychoEducationArticleResponse.Page> pages,
        boolean published,
        int sortOrder
) {
}

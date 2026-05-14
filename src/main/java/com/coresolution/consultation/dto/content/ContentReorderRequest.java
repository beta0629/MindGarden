package com.coresolution.consultation.dto.content;

import jakarta.validation.constraints.NotEmpty;
import java.util.List;

/**
 * 콘텐츠 마스터 정렬 일괄 반영(표시 순서).
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public record ContentReorderRequest(
        @NotEmpty List<Long> orderedIds
) {
}

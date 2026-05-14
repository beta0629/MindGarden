package com.coresolution.consultation.dto.content;

import jakarta.validation.constraints.NotNull;

/**
 * 클라이언트 노출(비노출) 토글.
 *
 * @author MindGarden
 * @since 2026-05-15
 */
public record PublishedPatchRequest(
        @NotNull Boolean published
) {
}

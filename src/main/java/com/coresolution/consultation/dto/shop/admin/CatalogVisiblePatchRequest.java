package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.constraints.NotNull;

/**
 * PLP 노출(catalog_visible) 토글.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record CatalogVisiblePatchRequest(
        @NotNull Boolean catalogVisible
) {
}

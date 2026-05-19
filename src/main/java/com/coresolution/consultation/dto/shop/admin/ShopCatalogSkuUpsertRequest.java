package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * 어드민 SKU 생성·수정 요청.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record ShopCatalogSkuUpsertRequest(
        @NotBlank @Size(max = 64) String skuCode,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String descriptionText,
        @NotNull @Min(0) Long unitPriceMinor,
        @Size(min = 3, max = 3) String currency,
        boolean catalogVisible,
        boolean active,
        @PositiveOrZero int sortOrder
) {
}

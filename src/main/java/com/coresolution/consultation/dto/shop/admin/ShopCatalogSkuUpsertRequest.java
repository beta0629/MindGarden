package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * 어드민 SKU 생성·수정 요청.
 * <p>신규 생성 시 {@code skuCode} 생략 가능(서버 자동 발급). 수정 시 skuCode는 변경되지 않습니다.</p>
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record ShopCatalogSkuUpsertRequest(
        @Size(max = 64) String skuCode,
        @NotBlank @Size(max = 200) String title,
        @Size(max = 4000) String descriptionText,
        @NotNull @Min(0) Long unitPriceMinor,
        @Size(min = 3, max = 3) String currency,
        @Size(max = 32) String catalogCategory,
        @Size(max = 512) String thumbnailUrl,
        boolean catalogVisible,
        boolean active,
        @PositiveOrZero int sortOrder
) {
}

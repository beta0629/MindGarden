package com.coresolution.consultation.dto.shop.admin;

/**
 * 어드민 SKU 상세.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record ShopCatalogSkuAdminDetail(
        Long id,
        String skuCode,
        String title,
        String descriptionText,
        long unitPriceMinor,
        String currency,
        String catalogCategory,
        String thumbnailUrl,
        boolean catalogVisible,
        boolean active,
        int sortOrder
) {
}

package com.coresolution.consultation.dto.shop.admin;

import java.time.LocalDateTime;

/**
 * 어드민 SKU 목록 행.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public record ShopCatalogSkuAdminItem(
        Long id,
        String skuCode,
        String title,
        long unitPriceMinor,
        String currency,
        boolean catalogVisible,
        boolean active,
        int sortOrder,
        LocalDateTime updatedAt
) {
}

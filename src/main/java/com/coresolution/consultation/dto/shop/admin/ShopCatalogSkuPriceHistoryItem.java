package com.coresolution.consultation.dto.shop.admin;

import java.time.LocalDateTime;

/**
 * SKU 단가 변경 이력 항목.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
public record ShopCatalogSkuPriceHistoryItem(
        Long id,
        Long skuId,
        String skuCode,
        Long unitPriceMinor,
        String currency,
        LocalDateTime changedAt,
        String changedBy) {
}

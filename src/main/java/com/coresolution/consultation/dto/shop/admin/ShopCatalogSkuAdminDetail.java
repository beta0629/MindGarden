package com.coresolution.consultation.dto.shop.admin;

/**
 * 어드민 SKU 상세.
 * <p>이벤트 단가·기간은 {@code /event-prices} 목록으로 조회한다.</p>
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
        int sortOrder,
        int sessionCount,
        String packageType,
        String fieldCode,
        Long consultantId,
        boolean eventOnly,
        Integer sessionMinutes
) {
}

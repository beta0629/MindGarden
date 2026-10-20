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
        String catalogCategory,
        String thumbnailUrl,
        boolean catalogVisible,
        boolean active,
        int sortOrder,
        LocalDateTime updatedAt,
        int sessionCount,
        String packageType,
        String fieldCode,
        Long consultantId,
        /** 연결된 상담 패키지 코드 (CONSULTATION_PACKAGE). 연결 없으면 null */
        String sourcePackageCode
) {
}

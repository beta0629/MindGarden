package com.coresolution.consultation.dto.shop.admin;

import java.util.List;

/**
 * 온라인 상품 화면 목록.
 *
 * @param packages 패키지 요금 관리 행
 * @param unlinkedSkus 요금에 연결되지 않은 기존 SKU
 * @author MindGarden
 * @since 2026-09-24
 */
public record ShopCatalogPackageFeeListResponse(
        List<ShopCatalogPackageFeeItem> packages,
        List<ShopCatalogLegacySkuItem> unlinkedSkus
) {
}

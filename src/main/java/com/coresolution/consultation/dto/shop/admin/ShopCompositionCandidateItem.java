package com.coresolution.consultation.dto.shop.admin;

/**
 * 구성 후보 몰 SKU.
 *
 * @param skuId SKU ID
 * @param skuCode SKU 코드
 * @param title 상품명
 * @param catalogCategory 상품 유형
 * @param unitPriceMinor 몰 판매가(원)
 * @param sessionCount 회기 (실물 0)
 * @param composed 이미 자기 구성이 있는 상품이면 true (담으면 400)
 * @author MindGarden
 * @since 2026-10-12
 */
public record ShopCompositionCandidateItem(
        Long skuId,
        String skuCode,
        String title,
        String catalogCategory,
        long unitPriceMinor,
        int sessionCount,
        boolean composed) {
}

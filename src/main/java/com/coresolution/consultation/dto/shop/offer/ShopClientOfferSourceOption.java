package com.coresolution.consultation.dto.shop.offer;

/**
 * 지정 화면의 몰 상품 선택지.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public record ShopClientOfferSourceOption(
        String skuCode,
        String title,
        long unitPriceMinor,
        Integer sessionCount
) {
}

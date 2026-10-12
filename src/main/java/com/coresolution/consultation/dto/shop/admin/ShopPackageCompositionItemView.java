package com.coresolution.consultation.dto.shop.admin;

/**
 * 상품 구성 항목 조회 값.
 *
 * @param id 구성 항목 ID
 * @param skuId 몰 SKU ID
 * @param skuCode 몰 SKU 코드
 * @param title 상품명 (SKU 가 사라졌으면 null)
 * @param catalogCategory 상품 유형
 * @param quantity 수량
 * @param sortOrder 순서
 * @param unitPriceSnapshot 저장 시점 단가(원)
 * @param sessionCountSnapshot 저장 시점 회기
 * @param currentUnitPrice 현재 몰 판매가(원). 판매 불가·삭제면 null
 * @param priceChanged 스냅샷과 현재가가 다르면 true
 * @param available 지금도 구성에 담을 수 있는 상품이면 true
 * @author MindGarden
 * @since 2026-10-12
 */
public record ShopPackageCompositionItemView(
        Long id,
        Long skuId,
        String skuCode,
        String title,
        String catalogCategory,
        int quantity,
        int sortOrder,
        long unitPriceSnapshot,
        int sessionCountSnapshot,
        Long currentUnitPrice,
        boolean priceChanged,
        boolean available) {
}

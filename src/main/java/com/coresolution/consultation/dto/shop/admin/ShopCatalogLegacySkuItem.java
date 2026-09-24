package com.coresolution.consultation.dto.shop.admin;

/**
 * 요금 관리에 연결되지 않은 기존 카탈로그 SKU.
 * <p>새 상품 등록은 받지 않고, 노출을 끄는 용도로만 내려준다.</p>
 *
 * @param id SKU ID
 * @param skuCode SKU 코드
 * @param title 저장된 상품명
 * @param unitPriceMinor 저장된 단가
 * @param catalogVisible 노출 여부
 * @author MindGarden
 * @since 2026-09-24
 */
public record ShopCatalogLegacySkuItem(
        Long id,
        String skuCode,
        String title,
        long unitPriceMinor,
        boolean catalogVisible
) {
}

package com.coresolution.consultation.dto.shop;

/**
 * 패키지 요금 관리 한 행에서 온라인 상품이 읽는 식별 값.
 *
 * @param packageCode CONSULTATION_PACKAGE code_value
 * @param packageName 상품명 (koreanName)
 * @param unitPriceMinor 단가(원). 준비되지 않으면 null
 * @param sessionCount 회기수. 준비되지 않으면 null
 * @param active 요금 관리 사용 여부
 * @param priceReady 단가·회기가 판매 가능하면 true
 * @author MindGarden
 * @since 2026-09-24
 */
public record ShopCatalogPackageIdentity(
        String packageCode,
        String packageName,
        Long unitPriceMinor,
        Integer sessionCount,
        boolean active,
        boolean priceReady
) {
}

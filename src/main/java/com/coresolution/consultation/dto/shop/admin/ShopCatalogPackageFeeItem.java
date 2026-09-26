package com.coresolution.consultation.dto.shop.admin;

/**
 * 온라인 상품 화면의 패키지 요금 행.
 * <p>상품명·단가·회기는 요금 관리 값이고,
 * 설명·이미지·노출은 연결된 카탈로그 행이다.</p>
 *
 * @param packageCode 패키지 코드
 * @param packageName 상품명
 * @param unitPriceMinor 단가(원). 없으면 null
 * @param sessionCount 회기수. 없으면 null
 * @param packageActive 요금 관리 사용 여부
 * @param priceReady 단가·회기 판매 가능 여부
 * @param skuId 연결된 카탈로그 행 ID. 없으면 null
 * @param skuCode 연결된 SKU 코드. 없으면 null
 * @param descriptionText 카탈로그 설명
 * @param thumbnailUrl 대표 이미지 URL
 * @param catalogVisible 온라인 노출
 * @param sortOrder 정렬 순서
 * @param catalogCategory CONSULTATION 또는 ASSESSMENT
 * @param fieldCode 분야 공통코드. 없으면 null
 * @author MindGarden
 * @since 2026-09-24
 */
public record ShopCatalogPackageFeeItem(
        String packageCode,
        String packageName,
        Long unitPriceMinor,
        Integer sessionCount,
        boolean packageActive,
        boolean priceReady,
        Long skuId,
        String skuCode,
        String descriptionText,
        String thumbnailUrl,
        boolean catalogVisible,
        int sortOrder,
        String catalogCategory,
        String fieldCode
) {
}

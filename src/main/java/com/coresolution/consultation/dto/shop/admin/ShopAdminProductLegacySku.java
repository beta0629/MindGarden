package com.coresolution.consultation.dto.shop.admin;

/**
 * 직접 등록(패키지 미연결) SKU 요약.
 *
 * @param id              SKU id
 * @param skuCode         SKU 코드
 * @param title           상품명
 * @param unitPriceMinor  단가
 * @param catalogVisible  몰 노출
 * @param active          판매 사용
 * @param catalogCategory 카테고리
 * @param thumbnailUrl    대표 이미지
 * @param descriptionText 설명
 * @param sortOrder       정렬
 * @param validityMonths  사용 기한(개월), null 이면 기한 없음
 * @author MindGarden
 * @since 2026-09-29
 */
public record ShopAdminProductLegacySku(
        Long id,
        String skuCode,
        String title,
        Long unitPriceMinor,
        boolean catalogVisible,
        boolean active,
        String catalogCategory,
        String thumbnailUrl,
        String descriptionText,
        Integer sortOrder,
        Integer validityMonths
) {
}

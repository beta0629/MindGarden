package com.coresolution.consultation.dto.shop.admin;

/**
 * 어드민 「상품」 통합 목록 한 행.
 *
 * @param kind      {@code PACKAGE} 또는 {@code LEGACY}
 * @param code      패키지 코드 또는 SKU 코드
 * @param name      표시 상품명
 * @param active    판매 중 여부
 * @param codeRow   공통코드 원본 (PACKAGE 이고 코드가 있을 때)
 * @param fee       패키지 요금 온라인 SKU (PACKAGE)
 * @param legacySku 직접 등록 SKU (LEGACY)
 * @author MindGarden
 * @since 2026-09-29
 */
public record ShopAdminProductItem(
        String kind,
        String code,
        String name,
        boolean active,
        ShopAdminProductCodeRow codeRow,
        ShopCatalogPackageFeeItem fee,
        ShopAdminProductLegacySku legacySku
) {
}

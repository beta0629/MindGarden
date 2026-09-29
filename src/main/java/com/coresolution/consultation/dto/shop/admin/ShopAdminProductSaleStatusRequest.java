package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 상품 판매 상태 변경. 중지 시 홈 공개·몰 노출을 함께 끈다. 재개는 판매 사용만 켠다.
 *
 * @param kind        {@code PACKAGE} 또는 {@code LEGACY}
 * @param packageCode PACKAGE 일 때 패키지 코드
 * @param skuId       LEGACY 일 때 SKU id
 * @param onSale      true 판매 재개, false 판매 중지
 * @author MindGarden
 * @since 2026-09-29
 */
public record ShopAdminProductSaleStatusRequest(
        @NotBlank String kind,
        String packageCode,
        Long skuId,
        @NotNull Boolean onSale
) {
}

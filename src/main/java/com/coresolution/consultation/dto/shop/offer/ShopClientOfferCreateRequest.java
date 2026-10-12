package com.coresolution.consultation.dto.shop.offer;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * 내담자별 지정 생성 요청. 금액은 서버가 확정하므로 최종가는 받지 않는다.
 *
 * @param clientId      대상 내담자 users.id
 * @param sourceSkuCode 원본 몰 상품 SKU 코드
 * @param discountType  AMOUNT | RATE
 * @param discountValue 금액(원) 또는 율(%)
 * @author MindGarden
 * @since 2026-10-12
 */
public record ShopClientOfferCreateRequest(
        @NotNull Long clientId,
        @NotBlank String sourceSkuCode,
        @NotBlank String discountType,
        @NotNull @Min(1) Long discountValue
) {
}

package com.coresolution.consultation.dto.shop.offer;

import java.time.LocalDateTime;

/**
 * 내담자별 지정 내역(관리자·내담자 공용). {@code offerSkuCode} 가 결제 때 쓰는 바로 구매 SKU 이다.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public record ShopClientOfferResponse(
        Long id,
        Long clientId,
        String sourceSkuCode,
        String offerSkuCode,
        String title,
        String discountType,
        long discountValue,
        long originalPriceMinor,
        long finalPriceMinor,
        String status,
        Integer sessionCount,
        Integer validityMonths,
        boolean paid,
        LocalDateTime createdAt
) {
}

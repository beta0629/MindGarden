package com.coresolution.consultation.dto.shop.admin;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * 어드민 SKU 이벤트 가격 기간 응답.
 *
 * @param id 이벤트 가격 ID
 * @param eventPriceMinor 이벤트 단가(원)
 * @param startDate 시작일(포함)
 * @param endDate 종료일(포함)
 * @param updatedAt 수정 시각
 * @author MindGarden
 * @since 2026-11-11
 */
public record ShopCatalogSkuEventPriceItem(
        Long id,
        long eventPriceMinor,
        LocalDate startDate,
        LocalDate endDate,
        LocalDateTime updatedAt
) {
}

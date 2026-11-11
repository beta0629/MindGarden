package com.coresolution.consultation.dto.shop.admin;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

/**
 * 어드민 SKU 이벤트 가격 기간 생성·수정 요청.
 *
 * @param eventPriceMinor 이벤트 단가(원). 정상가보다 낮아야 함
 * @param startDate 시작일(포함)
 * @param endDate 종료일(포함)
 * @author MindGarden
 * @since 2026-11-11
 */
public record ShopCatalogSkuEventPriceUpsertRequest(
        @NotNull @Min(0) Long eventPriceMinor,
        @NotNull LocalDate startDate,
        @NotNull LocalDate endDate
) {
}

package com.coresolution.consultation.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 주문 라인 응답.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopOrderLineResponse {

    private int lineNo;
    private String skuCode;
    private String title;
    private int quantity;
    private long unitPriceMinor;
    private long lineTotalMinor;
}

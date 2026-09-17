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

    /** 결제 시점 회기수 스냅샷(없으면 SKU 현재값 폴백 전 0 가능). */
    private int sessionCount;

    /** {@code SINGLE} | {@code PACKAGE} */
    private String packageType;
}

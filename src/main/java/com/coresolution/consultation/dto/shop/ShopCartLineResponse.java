package com.coresolution.consultation.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 장바구니 라인 응답 (서버 가격).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopCartLineResponse {

    private String skuCode;
    private String title;
    private int quantity;
    private long unitPriceMinor;
    private long lineTotalMinor;
}

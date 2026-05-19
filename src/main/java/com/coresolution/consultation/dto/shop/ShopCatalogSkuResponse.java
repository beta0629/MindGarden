package com.coresolution.consultation.dto.shop;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * PLP용 카탈로그 SKU 응답.
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ShopCatalogSkuResponse {

    private String skuCode;
    private String title;
    private String descriptionText;
    private long unitPriceMinor;
    private String currency;
    /** CONSULTATION | ASSESSMENT */
    private String catalogCategory;

    /** PLP/PDP 대표 이미지 URL */
    private String thumbnailUrl;
}

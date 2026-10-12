package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 내담자별 지정 상품·할인가 (원가·할인·최종가 기록, 전용 숨김 SKU 연결).
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@Entity
@Table(name = "shop_client_offers")
@Getter
@Setter
@NoArgsConstructor
public class ShopClientOffer extends BaseEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Column(name = "source_sku_code", nullable = false, length = 64)
    private String sourceSkuCode;

    @Column(name = "offer_sku_code", nullable = false, length = 64)
    private String offerSkuCode;

    @Column(name = "discount_type", nullable = false, length = 16)
    private String discountType;

    @Column(name = "discount_value", nullable = false)
    private Long discountValue;

    @Column(name = "original_price_minor", nullable = false)
    private Long originalPriceMinor;

    @Column(name = "final_price_minor", nullable = false)
    private Long finalPriceMinor;

    @Column(name = "status", nullable = false, length = 16)
    private String status;

    @Column(name = "created_by_user_id")
    private Long createdByUserId;
}

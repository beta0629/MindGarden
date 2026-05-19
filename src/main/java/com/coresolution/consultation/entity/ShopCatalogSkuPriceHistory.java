package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 카탈로그 SKU 단가 변경 이력.
 *
 * @author MindGarden
 * @since 2026-05-20
 */
@Entity
@Table(name = "shop_catalog_sku_price_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopCatalogSkuPriceHistory extends BaseEntity {

    @Column(name = "sku_id", nullable = false)
    private Long skuId;

    @Column(name = "sku_code", nullable = false, length = 64)
    private String skuCode;

    @Column(name = "unit_price_minor", nullable = false)
    private Long unitPriceMinor;

    @Column(name = "currency", nullable = false, length = 3)
    private String currency;

    @Column(name = "changed_at", nullable = false)
    private LocalDateTime changedAt;

    @Column(name = "changed_by", length = 100)
    private String changedBy;
}

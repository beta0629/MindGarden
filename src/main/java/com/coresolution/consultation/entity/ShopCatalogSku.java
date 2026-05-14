package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 온라인 카탈로그 SKU (서버 단가 권위).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(name = "shop_catalog_skus", uniqueConstraints = {
    @UniqueConstraint(name = "uk_shop_sku_tenant_code", columnNames = {"tenant_id", "sku_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopCatalogSku extends BaseEntity {

    @Column(name = "sku_code", nullable = false, length = 64)
    private String skuCode;

    @Column(name = "title", nullable = false, length = 200)
    private String title;

    @Column(name = "description_text", columnDefinition = "TEXT")
    private String descriptionText;

    @Column(name = "unit_price_minor", nullable = false)
    private Long unitPriceMinor;

    @Column(name = "currency", nullable = false, length = 3)
    @Builder.Default
    private String currency = "KRW";

    @Column(name = "catalog_visible", nullable = false)
    @Builder.Default
    private Boolean catalogVisible = true;

    @Column(name = "active", nullable = false)
    @Builder.Default
    private Boolean active = true;

    @Column(name = "sort_order", nullable = false)
    @Builder.Default
    private Integer sortOrder = 0;
}

package com.coresolution.consultation.entity;

import java.time.LocalDate;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 카탈로그 SKU 이벤트 가격 기간(테넌트·SKU 스코프, soft-delete).
 *
 * @author MindGarden
 * @since 2026-11-11
 */
@Entity
@Table(name = "shop_catalog_sku_event_prices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopCatalogSkuEventPrice extends BaseEntity {

    @Column(name = "sku_id", nullable = false)
    private Long skuId;

    @Column(name = "event_price_minor", nullable = false)
    private Long eventPriceMinor;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;
}

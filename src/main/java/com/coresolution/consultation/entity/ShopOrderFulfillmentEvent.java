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
 * 쇼핑 주문 PAID 후 이행 이벤트 (append-only, 라인·SKU 단위).
 *
 * @author MindGarden
 * @since 2026-05-19
 */
@Entity
@Table(name = "shop_order_fulfillment_events", uniqueConstraints = {
    @UniqueConstraint(
            name = "uk_shop_fulfillment_order_sku",
            columnNames = {"tenant_id", "order_public_id", "sku_code"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopOrderFulfillmentEvent extends BaseEntity {

    @Column(name = "order_public_id", nullable = false, length = 36)
    private String orderPublicId;

    @Column(name = "sku_code", nullable = false, length = 64)
    private String skuCode;

    @Column(name = "category", nullable = false, length = 32)
    private String category;

    @Column(name = "status", nullable = false, length = 32)
    private String status;

    @Column(name = "message", length = 500)
    private String message;
}

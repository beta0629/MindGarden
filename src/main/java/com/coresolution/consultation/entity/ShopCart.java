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
 * 내담자 장바구니 (테넌트·클라이언트당 1건).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(name = "shop_carts", uniqueConstraints = {
    @UniqueConstraint(name = "uk_shop_cart_tenant_client", columnNames = {"tenant_id", "client_id"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopCart extends BaseEntity {

    @Column(name = "client_id", nullable = false)
    private Long clientId;
}

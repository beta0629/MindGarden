package com.coresolution.consultation.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 상품 구성 항목 — 패키지 코드 하나에 몰 카탈로그 SKU 를 수량과 함께 담는다.
 * 단가·회기는 저장 시점 스냅샷이며, 현재가와 달라도 자동으로 다시 계산하지 않는다.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
@Entity
@Table(name = "shop_package_composition_items")
@Getter
@Setter
@NoArgsConstructor
public class ShopPackageCompositionItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, updatable = false)
    private Long id;

    @Column(name = "tenant_id", nullable = false, length = 36)
    private String tenantId;

    @Column(name = "package_code", nullable = false, length = 50)
    private String packageCode;

    @Column(name = "item_sku_id", nullable = false)
    private Long itemSkuId;

    @Column(name = "quantity", nullable = false)
    private Integer quantity;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder;

    @Column(name = "unit_price_snapshot", nullable = false)
    private Long unitPriceSnapshot;

    @Column(name = "session_count_snapshot", nullable = false)
    private Integer sessionCountSnapshot;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}

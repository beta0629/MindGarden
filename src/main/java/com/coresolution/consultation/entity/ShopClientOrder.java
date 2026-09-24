package com.coresolution.consultation.entity;

import com.coresolution.consultation.constant.ShopClientOrderStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 내담자 온라인 주문 (스냅샷·포인트 사용액).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
@Entity
@Table(name = "shop_client_orders", uniqueConstraints = {
    @UniqueConstraint(name = "uk_shop_order_public", columnNames = {"public_id"}),
    @UniqueConstraint(name = "uk_shop_order_checkout_idem", columnNames = {"tenant_id", "client_id", "checkout_idempotency_key"})
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ShopClientOrder extends BaseEntity {

    @Column(name = "public_id", nullable = false, length = 36, updatable = false)
    private String publicId;

    @Column(name = "client_id", nullable = false)
    private Long clientId;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 32)
    private ShopClientOrderStatus status;

    @Column(name = "subtotal_minor", nullable = false)
    private Long subtotalMinor;

    @Column(name = "points_redeem_minor", nullable = false)
    @Builder.Default
    private Long pointsRedeemMinor = 0L;

    @Column(name = "cash_due_minor", nullable = false)
    @Builder.Default
    private Long cashDueMinor = 0L;

    @Column(name = "checkout_idempotency_key", nullable = false, length = 128)
    private String checkoutIdempotencyKey;

    /**
     * 내담자 fulfill-retry 성공 1회 소진 여부.
     * true 이면 내담자가 재시도 가능 FAILED 를 해소한 재이행을 이미 한 번 완료한 것.
     * FAILED+retryable 잔존 시에는 false 유지. 어드민 재시도는 이 플래그를 무시한다.
     */
    @Column(name = "client_fulfill_retry_attempted", nullable = false)
    @Builder.Default
    private Boolean clientFulfillRetryAttempted = Boolean.FALSE;
}

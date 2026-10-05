package com.coresolution.consultation.entity;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOrderStatus;
import java.time.LocalDateTime;
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

    /**
     * 주문 생성 경로 ({@link ShopCheckoutConstants#CHECKOUT_SOURCE_CART} |
     * {@link ShopCheckoutConstants#CHECKOUT_SOURCE_BUY_NOW}). 바로 구매 주문은 PAID 시 장바구니를 비우지 않는다.
     */
    @Column(name = "checkout_source", nullable = false, length = 16)
    @Builder.Default
    private String checkoutSource = ShopCheckoutConstants.CHECKOUT_SOURCE_CART;

    /**
     * 어드민 전액 환불 PG 취소 진행 임대 만료 시각. 이 시각 전에는 다른 환불 요청이 PG 취소를 부르지 않는다.
     * null 이면 진행 중인 환불 없음.
     */
    @Column(name = "refund_pg_lease_until")
    private LocalDateTime refundPgLeaseUntil;

    /**
     * 어드민 전액 환불 PG 취소를 요청한 시각(마지막). 값이 있으면 PG 취소가 이미 반영됐을 수 있으므로
     * 재시도는 PortOne 누적 취소액으로 잔액을 다시 계산하고, 잔액 0 이면 PG 호출 없이 Clinic 반영만 한다.
     */
    @Column(name = "refund_pg_attempted_at")
    private LocalDateTime refundPgAttemptedAt;
}

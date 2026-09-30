package com.coresolution.consultation.service;

/**
 * 취소·만료로 닫힌 쇼핑 주문에 늦게 승인된 결제를 PortOne 전액 취소(환불)한다.
 * <p>주문은 되살리지 않는다. 호출측 트랜잭션은 일시 중단되고, PortOne 호출은 DB 트랜잭션 밖에서 한다.
 * 상태 반영은 주문 행을 잠근 짧은 트랜잭션에서만 한다. 이행·ERP·일반 환불 흐름은 타지 않는다.</p>
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public interface ShopLatePaymentRefundService {

    /**
     * 결제 건의 주문이 닫혀 있으면 PortOne 전액 취소 후 결제 건을 REFUNDED(실패 시 REFUND_REQUIRED)로 둔다.
     * 이미 REFUNDED 면 취소 API 를 다시 부르지 않는다.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 결제 ID (PortOne paymentId = 내부 payment_id)
     * @return 처리 결과 (주문이 열려 있으면 {@link ShopLatePaymentOutcome#NOT_APPLICABLE})
     */
    ShopLatePaymentOutcome refundIfOrderClosed(String tenantId, String paymentId);

    /**
     * 승인 트랜잭션이 결제 건을 승인 불가로 거부한 뒤 호출한다. {@link #refundIfOrderClosed} 대상에 더해
     * 열린 주문(CREATED/PENDING_PAYMENT)이지만 결제 건이 승인 불가 상태인 결제(H9b)도 PortOne 전액 취소한다.
     * 주문 상태는 바꾸지 않는다. 이미 REFUNDED 면 취소 API 를 다시 부르지 않는다.
     *
     * @param tenantId  테넌트 ID
     * @param paymentId 결제 ID (PortOne paymentId = 내부 payment_id)
     * @return 처리 결과 (승인 가능한 결제 등 대상이 아니면 {@link ShopLatePaymentOutcome#NOT_APPLICABLE})
     */
    ShopLatePaymentOutcome refundUnapprovableOnOpenOrder(String tenantId, String paymentId);
}

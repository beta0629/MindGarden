package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.ShopClientOrder;

/**
 * 쇼핑 주문 PAID 직후 이행(fulfillment) 및 전액 환불 시 회기 원복.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface ShopOrderFulfillmentService {

    /**
     * PAID 확정 직후 주문 라인별 이행 이벤트 기록. 멱등 키 {@code orderPublicId:FULFILL}.
     *
     * @param tenantId 테넌트 ID
     * @param order    PAID 상태 주문
     */
    void fulfillPaidOrder(String tenantId, ShopClientOrder order);

    /**
     * 전액 환불 시 CONSULTATION 이행으로 가산된 회기를 원복한다 (멱등).
     *
     * <p>이미 {@code REVERSED} 인 이벤트는 건너뛴다. COMPLETED 상담 라인만 차감한다.</p>
     *
     * @param tenantId 테넌트 ID
     * @param order    환불 대상 주문(아직 PAID 이거나 동 트랜잭션 내)
     */
    void reversePaidOrderFulfillment(String tenantId, ShopClientOrder order);

    /**
     * PAID 주문의 재시도 가능한 FAILED 이행만 다시 처리한다. 주문 상태는 PAID 유지.
     *
     * @param tenantId 테넌트 ID
     * @param order    대상 주문
     * @throws IllegalArgumentException 테넌트·주문 유효성 실패(fail-closed)
     * @throws IllegalStateException    PAID 아님·재시도 가능 FAILED 없음
     */
    void retryFailedFulfillment(String tenantId, ShopClientOrder order);
}

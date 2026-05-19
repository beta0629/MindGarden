package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.ShopClientOrder;

/**
 * 쇼핑 주문 PAID 직후 이행(fulfillment) 처리.
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
}

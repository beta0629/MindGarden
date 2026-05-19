package com.coresolution.consultation.service;

import com.coresolution.consultation.entity.ShopClientOrder;

/**
 * 쇼핑몰·리워드 P0 알림(인앱·모바일 푸시). PG generic 결제 알림과 분리.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public interface ShopNotificationHelper {

    /**
     * 주문 PAID 확정 시 내담자 알림.
     *
     * @param tenantId 테넌트 ID
     * @param order 주문(상태 PAID 반영 후)
     */
    void notifyOrderPaid(String tenantId, ShopClientOrder order);

    /**
     * PG 실패·주문 CREATED 복귀 시 내담자 알림.
     *
     * @param tenantId 테넌트 ID
     * @param order 주문
     */
    void notifyPaymentFailed(String tenantId, ShopClientOrder order);

    /**
     * 결제 적립 포인트 지급 시 내담자 알림.
     *
     * @param tenantId 테넌트 ID
     * @param order 주문
     * @param earnAmountMinor 적립 포인트(원 단위 minor)
     */
    void notifyPointEarned(String tenantId, ShopClientOrder order, long earnAmountMinor);

    /**
     * hold TTL 만료(EXPIRED) 시 내담자 알림.
     *
     * @param tenantId 테넌트 ID
     * @param order 주문
     */
    void notifyOrderHoldExpired(String tenantId, ShopClientOrder order);

    /**
     * 어드민 전액 환불(REFUNDED) 시 내담자 알림.
     *
     * @param tenantId 테넌트 ID
     * @param order 주문
     */
    void notifyOrderRefunded(String tenantId, ShopClientOrder order);

    /**
     * CONSULTATION fulfillment COMPLETED 시 내담자(·선택 상담사) 알림.
     *
     * @param tenantId 테넌트 ID
     * @param order 주문
     * @param consultantUserId 담당 상담사 users.id (없으면 내담자만)
     * @param skuCode SKU 코드
     */
    void notifyFulfillmentCompleted(
            String tenantId, ShopClientOrder order, Long consultantUserId, String skuCode);
}

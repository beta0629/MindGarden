package com.coresolution.consultation.constant;

/**
 * 주문 이행(fulfillment) 이벤트 상태.
 *
 * @author MindGarden
 * @since 2026-05-19
 */
public final class ShopOrderFulfillmentStatus {

    public static final String PENDING = "PENDING";
    public static final String COMPLETED = "COMPLETED";
    public static final String SKIPPED = "SKIPPED";

    private ShopOrderFulfillmentStatus() {
    }
}

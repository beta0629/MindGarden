package com.coresolution.consultation.constant;

/**
 * 내담자 온라인 주문 상태 (카탈로그·체크아웃 MVP).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public enum ShopClientOrderStatus {
    CREATED,
    PENDING_PAYMENT,
    PAID,
    CANCELLED,
    EXPIRED,
    /** 전액 환불(이행 전 MVP) */
    REFUNDED
}

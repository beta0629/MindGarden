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
    /** PG 전액 취소가 한도까지 실패해 수동 확인이 필요함 */
    CANCEL_FAILED,
    EXPIRED,
    /** 전액 환불(이행 전 MVP) */
    REFUNDED
}

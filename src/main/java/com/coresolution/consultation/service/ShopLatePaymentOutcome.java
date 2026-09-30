package com.coresolution.consultation.service;

/**
 * 닫힌 주문 늦은 결제 처리 결과.
 *
 * @author MindGarden
 * @since 2026-09-30
 */
public enum ShopLatePaymentOutcome {
    /** 주문이 닫혀 있지 않음(또는 쇼핑 결제 아님) — 일반 승인 흐름 */
    NOT_APPLICABLE,
    /** 이번 호출에서 PortOne 전액 취소 성공 → 결제 건 REFUNDED */
    REFUNDED,
    /** 이미 REFUNDED — 취소 API 재호출 없음(멱등) */
    ALREADY_REFUNDED,
    /** PortOne 취소 실패 → 결제 건 REFUND_REQUIRED (웹훅 재시도·관리자 재처리) */
    REFUND_REQUIRED,
    /** 다른 요청이 PortOne 취소를 선점해 진행 중 — 이번 호출은 취소 API 를 부르지 않음(중복 환불 방지) */
    REFUND_IN_PROGRESS
}

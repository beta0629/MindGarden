package com.coresolution.consultation.service.portone;

/**
 * PortOne V2 결제 승인 여부 (사용자 취소 정리용 3상태).
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public enum PortOnePaymentPaidState {
    /** status=PAID */
    PAID,
    /** 결제 건 없음(404) 또는 FAILED — 승인되지 않았음이 확인됨 */
    NOT_PAID,
    /** READY(다른 탭에서 인증 중일 수 있음)·PAY_PENDING 등 결제 진행 중이거나 판단이 애매함 — 주문을 건드리지 않는다 */
    IN_PROGRESS,
    /** 조회 실패·설정 없음 — 주문을 건드리지 않는다 */
    UNKNOWN
}

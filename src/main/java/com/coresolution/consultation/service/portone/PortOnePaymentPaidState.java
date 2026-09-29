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
    /** 결제 건 없음(404) 또는 READY/FAILED — 승인되지 않았음이 확인됨 */
    NOT_PAID,
    /** 조회 실패·설정 없음·진행 중/취소 등 판단 보류 — 주문을 건드리지 않는다 */
    UNKNOWN
}

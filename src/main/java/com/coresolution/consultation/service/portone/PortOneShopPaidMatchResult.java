package com.coresolution.consultation.service.portone;

/**
 * 쇼핑 주문 PortOne PAID 정합 검증 삼상(tri-state).
 * <p>
 * {@code MATCH} 만 승인·이행, {@code MISMATCH} 만 전액 취소.
 * {@code UNKNOWN}(조회 실패·일시 미승인 등)은 취소·이행하지 않는다.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-10-16
 */
public enum PortOneShopPaidMatchResult {
    /** status=PAID 이고 금액·통화·paymentId·주문 참조가 모두 일치 */
    MATCH,
    /** status=PAID 이지만 금액·통화·paymentId·주문 참조 중 하나 이상 불일치 (재시도 없음) */
    MISMATCH,
    /** PG 설정·조회·파싱 실패, 또는 재시도 후에도 PAID 아님 — 취소 금지 */
    UNKNOWN
}

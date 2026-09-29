package com.coresolution.consultation.constant;

/**
 * 내담자가 PortOne 결제창을 직접 닫았을 때(사용자 취소) 주문 정리 상수.
 * PG 취소 API 는 호출하지 않는다 — 결제가 승인되지 않은 주문만 닫는다.
 *
 * @author MindGarden
 * @since 2026-09-29
 */
public final class ShopUserPaymentCancelConstants {

    /** 주문·결제를 CANCELLED 로 닫음 (재호출 시에도 같은 값 — 멱등) */
    public static final String OUTCOME_CANCELLED = "CANCELLED";

    /** PortOne 조회가 PAID — 아무것도 바꾸지 않고 정상 결제 확인으로 진행 */
    public static final String OUTCOME_PAID = "PAID";

    /** PortOne 조회 실패·진행 중 상태 — 주문을 건드리지 않음 (재결제 시 같은 주문 재사용) */
    public static final String OUTCOME_UNVERIFIED = "UNVERIFIED";

    /** 이미 결제·만료·환불 등 닫을 대상이 아닌 상태 — 변경 없음 */
    public static final String OUTCOME_NOT_CANCELLABLE = "NOT_CANCELLABLE";

    /** 사용자 취소로 닫은 결제 건 사유 */
    public static final String PAYMENT_FAILURE_REASON_USER_CANCELLED = "사용자 결제 취소";

    /** 만료로 닫은 결제 건 사유 */
    public static final String PAYMENT_FAILURE_REASON_ORDER_EXPIRED = "주문 결제 대기 시간 만료";

    private ShopUserPaymentCancelConstants() {
    }
}

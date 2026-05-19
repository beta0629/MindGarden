package com.coresolution.consultation.constant;

/**
 * 내담자 쇼핑 체크아웃 상수 (장바구니·PG 최소 금액 정합).
 *
 * @author MindGarden
 * @since 2026-05-14
 */
public final class ShopCheckoutConstants {

    /** 장바구니 최대 라인 수 */
    public static final int MAX_CART_LINES = 30;

    /** 단일 라인 최대 수량 */
    public static final int MAX_LINE_QUANTITY = 99;

    /**
     * PG 결제 생성 시 최소 현금 청구액({@link PaymentConstants#MIN_PAYMENT_AMOUNT})과 동일해야 함.
     * 0원 전액 포인트 결제는 PG 없이 주문만 PAID 처리.
     */
    public static final long MIN_CASH_FOR_PAYMENT_GATEWAY = PaymentConstants.MIN_PAYMENT_AMOUNT;

    /** 체크아웃 멱등 키 접미사 — 포인트 hold (원장 POINT_HOLD) */
    public static final String POINT_HOLD_SUFFIX = ":POINT_HOLD";

    /** 주문 공개 ID 접미사 — 포인트 확정 commit (원장 POINT_COMMIT) */
    public static final String POINT_COMMIT_SUFFIX = ":POINT_COMMIT";

    /** 주문 공개 ID 접미사 — hold 해제 (원장 POINT_HOLD_RELEASE) */
    public static final String POINT_RELEASE_SUFFIX = ":POINT_RELEASE";

    /** 주문 PAID 시 포인트 적립 earn (원장 POINT_EARN) */
    public static final String POINT_EARN_SUFFIX = ":POINT_EARN";

    /** 주문 PAID 후 이행(fulfillment) 멱등 키 접미사 */
    public static final String ORDER_FULFILL_SUFFIX = ":FULFILL";

    /** CONSULTATION PAID → confirm-payment(4arg) 결제 수단 (PG 카드) */
    public static final String CONSULTATION_FULFILLMENT_PAYMENT_METHOD = PaymentConstants.METHOD_CARD;

    /** 활성 매핑 2건 이상인데 체크아웃 요청에 mappingId 없음 */
    public static final String MSG_CONSULTANT_MAPPING_SELECTION_REQUIRED = "담당 상담사를 선택해 주세요.";

    /** 요청 mappingId가 내담자 ACTIVE 매핑이 아님 */
    public static final String MSG_CONSULTANT_MAPPING_INVALID = "유효하지 않은 상담 연결입니다.";

    /** 전액 환불 시 사용 포인트 복원 (원장 COMMIT_REVERSAL) */
    public static final String POINT_COMMIT_REVERSAL_SUFFIX = ":POINT_COMMIT_REVERSAL";

    /** 전액 환불 시 적립 회수 (원장 CLAWBACK) */
    public static final String POINT_CLAWBACK_SUFFIX = ":POINT_CLAWBACK";

    /**
     * 체크아웃 멱등 키 기준 포인트 hold 원장 키.
     *
     * @param checkoutIdempotencyKey 체크아웃 Idempotency-Key
     * @return 원장 멱등 키
     */
    public static String pointHoldKey(String checkoutIdempotencyKey) {
        return checkoutIdempotencyKey + POINT_HOLD_SUFFIX;
    }

    /**
     * 주문 PAID 시 포인트 commit 원장 키.
     *
     * @param orderPublicId 주문 공개 ID
     * @return 원장 멱등 키
     */
    public static String pointCommitKey(String orderPublicId) {
        return orderPublicId + POINT_COMMIT_SUFFIX;
    }

    /**
     * 주문 취소·결제 실패 시 hold 해제 원장 키.
     *
     * @param orderPublicId 주문 공개 ID
     * @return 원장 멱등 키
     */
    public static String pointReleaseKey(String orderPublicId) {
        return orderPublicId + POINT_RELEASE_SUFFIX;
    }

    /**
     * 주문 PAID 시 포인트 적립(EARN) 원장 키.
     *
     * @param orderPublicId 주문 공개 ID
     * @return 원장 멱등 키
     */
    public static String pointEarnKey(String orderPublicId) {
        return orderPublicId + POINT_EARN_SUFFIX;
    }

    /**
     * 주문 PAID 후 이행 멱등 키 (이벤트 존재 여부로 검사).
     *
     * @param orderPublicId 주문 공개 ID
     * @return 멱등 키
     */
    public static String orderFulfillKey(String orderPublicId) {
        return orderPublicId + ORDER_FULFILL_SUFFIX;
    }

    /**
     * 쇼핑 주문 PAID → 매핑 confirm-payment paymentReference (주문 공개 ID).
     *
     * @param orderPublicId 주문 공개 ID
     * @return paymentReference
     */
    public static String consultationPaymentReference(String orderPublicId) {
        return orderPublicId;
    }

    /**
     * 전액 환불 시 사용 포인트 복원 원장 키.
     *
     * @param orderPublicId 주문 공개 ID
     * @return 원장 멱등 키
     */
    public static String pointCommitReversalKey(String orderPublicId) {
        return orderPublicId + POINT_COMMIT_REVERSAL_SUFFIX;
    }

    /**
     * 전액 환불 시 적립 clawback 원장 키.
     *
     * @param orderPublicId 주문 공개 ID
     * @return 원장 멱등 키
     */
    public static String pointClawbackKey(String orderPublicId) {
        return orderPublicId + POINT_CLAWBACK_SUFFIX;
    }

    private ShopCheckoutConstants() {
        throw new UnsupportedOperationException("utility");
    }
}

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

    /**
     * 카드(PG) 결제 최소 금액 미만 안내 (금액 숫자 명시).
     *
     * @return 사용자 메시지
     */
    public static String msgCashBelowMinPayment() {
        return String.format(
                java.util.Locale.KOREA,
                "카드 결제는 %,d원 이상이어야 합니다.",
                MIN_CASH_FOR_PAYMENT_GATEWAY);
    }

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

    /**
     * 쇼핑 회기 가산(Path A) 또는 미결제 패키지 활성화(Path B)에 허용되지 않는 매핑 상태.
     * 허용: ACTIVE / SESSIONS_EXHAUSTED / PENDING_PAYMENT / PAYMENT_CONFIRMED.
     */
    public static final String MSG_SESSION_GRANT_MAPPING_NOT_ACTIVE =
            "회기를 가산하거나 활성화할 수 없는 매핑 상태입니다.";

    /** Path B PAYMENT_CONFIRMED 활성화 시 approveMapping 시스템 액터 */
    public static final String CONSULTATION_FULFILLMENT_ACTIVATE_ACTOR = "SYSTEM_AUTO_SHOP_FULFILL";

    /**
     * PG prepare 전 휴대폰 OTP 소유 확인 미완료 (번호 문자열 존재 ≠ verified).
     */
    public static final String MSG_PHONE_VERIFICATION_REQUIRED =
            "결제하려면 휴대폰 인증이 필요합니다. 설정(/client/settings)에서 휴대폰 번호를 인증해 주세요.";

    /**
     * preparePayment — CREATED / PENDING_PAYMENT / EXPIRED 외 주문 상태.
     */
    public static final String MSG_PREPARE_INVALID_ORDER_STATUS =
            "결제를 준비할 수 없는 주문 상태입니다.";

    /**
     * preparePayment — PENDING_PAYMENT 인데 재사용 가능한 연결 Payment 없음 (fail-closed).
     */
    public static final String MSG_PREPARE_PENDING_WITHOUT_PAYMENT =
            "결제 대기 주문에 연결된 결제 정보가 없습니다. 고객센터에 문의해 주세요.";

    /**
     * preparePayment — EXPIRED 인데 연결 Payment 없음 (새 createPayment 금지, fail-closed).
     */
    public static final String MSG_PREPARE_EXPIRED_WITHOUT_PAYMENT =
            "만료된 주문에 연결된 결제 정보가 없습니다. 새 주문을 진행해 주세요.";

    /**
     * PortOne/PG customerName soft fallback (세션 이름 없을 때). 결제 게이트 대상 아님.
     */
    public static final String DEFAULT_PAYMENT_CUSTOMER_NAME = "고객";

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

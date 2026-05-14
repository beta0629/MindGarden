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

    private ShopCheckoutConstants() {
        throw new UnsupportedOperationException("utility");
    }
}

package com.coresolution.consultation.constant;

/**
 * 내담자별 지정 상품·할인가 상수.
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public final class ShopClientOfferConstants {

    private ShopClientOfferConstants() {
    }

    /** 내담자 전용 숨김 SKU 코드 접두어 (관리자 목록 제외 기준과 같은 값) */
    public static final String SKU_CODE_PREFIX = "OFFER_";

    /** SKU 코드 무작위 부분 길이 */
    public static final int SKU_CODE_RANDOM_LENGTH = 12;

    public static final String DISCOUNT_TYPE_AMOUNT = "AMOUNT";
    public static final String DISCOUNT_TYPE_RATE = "RATE";

    public static final String STATUS_ACTIVE = "ACTIVE";
    public static final String STATUS_CANCELED = "CANCELED";

    /** 할인율 상한(%) — 100 미만만 허용 */
    public static final long RATE_MAX_PERCENT = 99L;

    public static final String MSG_CLIENT_NOT_FOUND = "대상 내담자를 찾을 수 없어요.";
    public static final String MSG_SOURCE_NOT_FOUND = "지정할 상품을 찾을 수 없어요.";
    public static final String MSG_SOURCE_NOT_SELLABLE = "판매할 수 없는 상품이에요.";
    public static final String MSG_DISCOUNT_TYPE_INVALID = "할인 방식이 올바르지 않아요.";
    public static final String MSG_DISCOUNT_VALUE_INVALID = "할인 값이 올바르지 않아요.";
    public static final String MSG_FINAL_PRICE_INVALID = "할인 후 금액이 결제 가능 최소 금액보다 작아요.";
    public static final String MSG_CLIENT_NOT_ELIGIBLE =
            "이 내담자의 상담 배정과 맞지 않는 상품이라 지정할 수 없어요.";
    public static final String MSG_OFFER_NOT_FOUND = "지정 내역을 찾을 수 없어요.";
}

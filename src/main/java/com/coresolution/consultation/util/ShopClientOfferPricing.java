package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOfferConstants;

/**
 * 내담자별 판매 금액(정가 그대로·직접 입력·할인) 최종가 계산 (서버 확정 단일 로직).
 *
 * @author MindGarden
 * @since 2026-10-12
 */
public final class ShopClientOfferPricing {

    private ShopClientOfferPricing() {
    }

    /**
     * 원가에 할인을 적용한 최종가.
     *
     * @param originalMinor 원가(원)
     * @param type NONE | PRICE | AMOUNT | RATE
     * @param rawValue NONE: 비움(또는 0) · PRICE: 판매 금액(원, 비우면 정가) · AMOUNT: 할인 금액(원) · RATE: 율(%)
     * @return 최종가(원). 정가를 넘지 않는다
     * @throws IllegalArgumentException 방식·값·최종가가 올바르지 않을 때
     */
    public static long finalPrice(long originalMinor, String type, Long rawValue) {
        if (ShopClientOfferConstants.DISCOUNT_TYPE_NONE.equals(type)) {
            if (rawValue != null && rawValue != 0L) {
                throw new IllegalArgumentException(ShopClientOfferConstants.MSG_DISCOUNT_VALUE_INVALID);
            }
            return requirePayable(originalMinor);
        }
        if (ShopClientOfferConstants.DISCOUNT_TYPE_PRICE.equals(type)) {
            if (rawValue == null) {
                return requirePayable(originalMinor);
            }
            // 0원·음수 거부, 정가 초과 거부(정가 이하만 허용)
            if (rawValue <= 0L || rawValue > originalMinor) {
                throw new IllegalArgumentException(ShopClientOfferConstants.MSG_OFFER_PRICE_INVALID);
            }
            return requirePayable(rawValue);
        }
        if (rawValue == null) {
            throw new IllegalArgumentException(ShopClientOfferConstants.MSG_DISCOUNT_VALUE_INVALID);
        }
        long value = rawValue;
        long discount;
        if (ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT.equals(type)) {
            if (value <= 0L || value >= originalMinor) {
                throw new IllegalArgumentException(ShopClientOfferConstants.MSG_DISCOUNT_VALUE_INVALID);
            }
            discount = value;
        } else if (ShopClientOfferConstants.DISCOUNT_TYPE_RATE.equals(type)) {
            if (value <= 0L || value > ShopClientOfferConstants.RATE_MAX_PERCENT) {
                throw new IllegalArgumentException(ShopClientOfferConstants.MSG_DISCOUNT_VALUE_INVALID);
            }
            discount = originalMinor * value / 100L;
        } else {
            throw new IllegalArgumentException(ShopClientOfferConstants.MSG_DISCOUNT_TYPE_INVALID);
        }
        return requirePayable(originalMinor - discount);
    }

    /**
     * 저장할 방식별 값. NONE 은 0, PRICE 는 확정 판매 금액, 나머지는 입력 값.
     *
     * @param type 방식
     * @param rawValue 입력 값
     * @param finalPrice {@link #finalPrice} 결과
     * @return discount_value 컬럼 값
     */
    public static long storedValue(String type, Long rawValue, long finalPrice) {
        if (ShopClientOfferConstants.DISCOUNT_TYPE_NONE.equals(type)) {
            return 0L;
        }
        if (ShopClientOfferConstants.DISCOUNT_TYPE_PRICE.equals(type)) {
            return finalPrice;
        }
        return rawValue;
    }

    private static long requirePayable(long result) {
        if (result < ShopCheckoutConstants.MIN_CASH_FOR_PAYMENT_GATEWAY) {
            throw new IllegalArgumentException(ShopClientOfferConstants.MSG_FINAL_PRICE_INVALID);
        }
        return result;
    }
}

package com.coresolution.consultation.util;

import com.coresolution.consultation.constant.ShopCheckoutConstants;
import com.coresolution.consultation.constant.ShopClientOfferConstants;

/**
 * 내담자별 할인 최종가 계산 (서버 확정 단일 로직).
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
     * @param type AMOUNT | RATE
     * @param value 금액(원) 또는 율(%)
     * @return 최종가(원)
     * @throws IllegalArgumentException 방식·값·최종가가 올바르지 않을 때
     */
    public static long finalPrice(long originalMinor, String type, long value) {
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
        long result = originalMinor - discount;
        if (result < ShopCheckoutConstants.MIN_CASH_FOR_PAYMENT_GATEWAY) {
            throw new IllegalArgumentException(ShopClientOfferConstants.MSG_FINAL_PRICE_INVALID);
        }
        return result;
    }
}

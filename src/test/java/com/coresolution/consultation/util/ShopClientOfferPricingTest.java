package com.coresolution.consultation.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import com.coresolution.consultation.constant.ShopClientOfferConstants;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

@DisplayName("ShopClientOfferPricing — 서버 최종가 확정")
class ShopClientOfferPricingTest {

    @Test
    @DisplayName("금액 할인")
    void amount() {
        assertEquals(80000L, ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT, 20000L));
    }

    @Test
    @DisplayName("율 할인(내림)")
    void rate() {
        assertEquals(90000L, ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_RATE, 10L));
        assertEquals(67001L, ShopClientOfferPricing.finalPrice(100001L, ShopClientOfferConstants.DISCOUNT_TYPE_RATE, 33L));
    }

    @Test
    @DisplayName("잘못된 방식·값은 거부")
    void invalid() {
        assertThrows(IllegalArgumentException.class,
                () -> ShopClientOfferPricing.finalPrice(100000L, "X", 10L));
        assertThrows(IllegalArgumentException.class,
                () -> ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT, 0L));
        assertThrows(IllegalArgumentException.class,
                () -> ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT, 100000L));
        assertThrows(IllegalArgumentException.class,
                () -> ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_RATE, 100L));
        assertThrows(IllegalArgumentException.class,
                () -> ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_RATE, 0L));
    }

    @Test
    @DisplayName("최종가가 결제 최소 금액 미만이면 거부")
    void belowMin() {
        assertThrows(IllegalArgumentException.class,
                () -> ShopClientOfferPricing.finalPrice(1001L, ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT, 1000L));
    }
}

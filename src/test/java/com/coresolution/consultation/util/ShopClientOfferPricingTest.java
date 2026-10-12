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

    @Test
    @DisplayName("할인 없음: 정가 그대로")
    void none() {
        assertEquals(100000L, ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_NONE, null));
        assertEquals(100000L, ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_NONE, 0L));
        assertThrows(IllegalArgumentException.class,
                () -> ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_NONE, 5L));
        assertEquals(0L, ShopClientOfferPricing.storedValue(ShopClientOfferConstants.DISCOUNT_TYPE_NONE, null, 100000L));
    }

    @Test
    @DisplayName("직접 입력: 비우면 정가, 정가와 같거나 낮은 금액 허용")
    void price() {
        String type = ShopClientOfferConstants.DISCOUNT_TYPE_PRICE;
        assertEquals(100000L, ShopClientOfferPricing.finalPrice(100000L, type, null));
        assertEquals(100000L, ShopClientOfferPricing.finalPrice(100000L, type, 100000L));
        assertEquals(75000L, ShopClientOfferPricing.finalPrice(100000L, type, 75000L));
        assertEquals(75000L, ShopClientOfferPricing.storedValue(type, 75000L, 75000L));
        assertEquals(100000L, ShopClientOfferPricing.storedValue(type, null, 100000L));
    }

    @Test
    @DisplayName("직접 입력: 0원·음수·정가 초과·최소 금액 미만 거부")
    void priceInvalid() {
        String type = ShopClientOfferConstants.DISCOUNT_TYPE_PRICE;
        assertThrows(IllegalArgumentException.class, () -> ShopClientOfferPricing.finalPrice(100000L, type, 0L));
        assertThrows(IllegalArgumentException.class, () -> ShopClientOfferPricing.finalPrice(100000L, type, -1L));
        assertThrows(IllegalArgumentException.class, () -> ShopClientOfferPricing.finalPrice(100000L, type, 100001L));
        assertThrows(IllegalArgumentException.class, () -> ShopClientOfferPricing.finalPrice(100000L, type, 1L));
        assertThrows(IllegalArgumentException.class,
                () -> ShopClientOfferPricing.finalPrice(100000L, ShopClientOfferConstants.DISCOUNT_TYPE_AMOUNT, null));
    }
}

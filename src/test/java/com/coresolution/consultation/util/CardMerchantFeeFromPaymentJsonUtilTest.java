package com.coresolution.consultation.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;
import org.slf4j.Logger;

import com.coresolution.consultation.entity.Payment;

/**
 * {@link CardMerchantFeeFromPaymentJsonUtil} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-04-17
 */
class CardMerchantFeeFromPaymentJsonUtilTest {

    private final Logger log = mock(Logger.class);

    @Test
    void resolve_tossSettlementFeesArray_sumsFee() {
        String json = "{\"settlement\":{\"fees\":["
                + "{\"type\":\"BASE\",\"fee\":150},"
                + "{\"type\":\"ETC\",\"fee\":50}"
                + "]}}";
        Payment p = Payment.builder()
                .paymentId("pay-fee-array")
                .orderId("ord-1")
                .status(Payment.PaymentStatus.APPROVED)
                .payerId(1L)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS)
                .amount(new BigDecimal("50000.00"))
                .externalResponse(json)
                .build();

        assertEquals(new BigDecimal("200.00"), CardMerchantFeeFromPaymentJsonUtil.resolveCardMerchantFee(p, log));
    }

    @Test
    void resolve_tossAmountMinusPayOut_computesFee() {
        String json = "{\"settlement\":{"
                + "\"amount\":10000,"
                + "\"payOutAmount\":9670"
                + "}}";
        Payment p = Payment.builder()
                .paymentId("pay-payout")
                .orderId("ord-2")
                .status(Payment.PaymentStatus.APPROVED)
                .payerId(1L)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.TOSS)
                .amount(new BigDecimal("10000.00"))
                .externalResponse(json)
                .build();

        assertEquals(new BigDecimal("330.00"), CardMerchantFeeFromPaymentJsonUtil.resolveCardMerchantFee(p, log));
    }

    @Test
    void resolve_genericMerchantFee_whenExplicitKey() {
        String json = "{\"merchantFee\":275.5}";
        Payment p = Payment.builder()
                .paymentId("pay-iamport")
                .orderId("ord-3")
                .status(Payment.PaymentStatus.APPROVED)
                .payerId(1L)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.IAMPORT)
                .amount(new BigDecimal("10000.00"))
                .externalResponse(json)
                .build();

        assertEquals(new BigDecimal("275.50"), CardMerchantFeeFromPaymentJsonUtil.resolveCardMerchantFee(p, log));
    }

    @Test
    void resolve_nonCard_returnsZero() {
        Payment p = Payment.builder()
                .paymentId("pay-noncard")
                .orderId("ord-4")
                .status(Payment.PaymentStatus.APPROVED)
                .payerId(1L)
                .method(Payment.PaymentMethod.BANK_TRANSFER)
                .provider(Payment.PaymentProvider.TOSS)
                .amount(BigDecimal.TEN)
                .externalResponse("{\"merchantFee\":100}")
                .build();

        assertEquals(BigDecimal.ZERO, CardMerchantFeeFromPaymentJsonUtil.resolveCardMerchantFee(p, log));
    }

    @Test
    void resolve_capsAtPaymentAmount() {
        String json = "{\"merchantFee\":999999}";
        Payment p = Payment.builder()
                .paymentId("pay-cap")
                .orderId("ord-5")
                .status(Payment.PaymentStatus.APPROVED)
                .payerId(1L)
                .method(Payment.PaymentMethod.CARD)
                .provider(Payment.PaymentProvider.KAKAO)
                .amount(new BigDecimal("100.00"))
                .externalResponse(json)
                .build();

        assertEquals(new BigDecimal("100.00"), CardMerchantFeeFromPaymentJsonUtil.resolveCardMerchantFee(p, log));
    }
}

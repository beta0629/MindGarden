package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 무료(0원) 청구 판정 — PaymentConstants SSOT.
 *
 * @author CoreSolution
 * @since 2026-11-11
 */
@DisplayName("PaymentConstants 0원 청구 판정")
class PaymentConstantsZeroAmountTest {

    @Test
    @DisplayName("ZERO_PAYMENT_AMOUNT 는 0이고 MIN 은 1000")
    void constants_matchSsot() {
        assertThat(PaymentConstants.ZERO_PAYMENT_AMOUNT).isEqualTo(0L);
        assertThat(PaymentConstants.MIN_PAYMENT_AMOUNT).isEqualTo(1000L);
    }

    @Test
    @DisplayName("isZeroPaymentAmount: 0만 true, null·양수는 false")
    void isZeroPaymentAmount_onlyExactZero() {
        assertThat(PaymentConstants.isZeroPaymentAmount(PaymentConstants.ZERO_PAYMENT_AMOUNT)).isTrue();
        assertThat(PaymentConstants.isZeroPaymentAmount(null)).isFalse();
        assertThat(PaymentConstants.isZeroPaymentAmount(PaymentConstants.MIN_PAYMENT_AMOUNT)).isFalse();
        assertThat(PaymentConstants.isZeroPaymentAmount(-1L)).isFalse();
    }

    @Test
    @DisplayName("isZeroCharge: 패키지 0원 + 결제금액 없음/0원만 true")
    void isZeroCharge_requiresZeroPackageAndNonPositivePayment() {
        assertThat(PaymentConstants.isZeroCharge(PaymentConstants.ZERO_PAYMENT_AMOUNT, null)).isTrue();
        assertThat(PaymentConstants.isZeroCharge(
                PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentConstants.ZERO_PAYMENT_AMOUNT)).isTrue();
        assertThat(PaymentConstants.isZeroCharge(null, PaymentConstants.ZERO_PAYMENT_AMOUNT)).isFalse();
        assertThat(PaymentConstants.isZeroCharge(
                PaymentConstants.ZERO_PAYMENT_AMOUNT, PaymentConstants.MIN_PAYMENT_AMOUNT)).isFalse();
        assertThat(PaymentConstants.isZeroCharge(PaymentConstants.MIN_PAYMENT_AMOUNT, null)).isFalse();
    }
}

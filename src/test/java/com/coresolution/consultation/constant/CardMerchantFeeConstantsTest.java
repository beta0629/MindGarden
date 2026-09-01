package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

/**
 * {@link CardMerchantFeeConstants#isCardPaymentMethod(String)} SSOT 판별 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */
@DisplayName("CardMerchantFeeConstants 테스트")
class CardMerchantFeeConstantsTest {

    @ParameterizedTest
    @ValueSource(strings = {"CARD", "card", "CREDIT_CARD", "credit_card", "DEBIT_CARD", "CARD_TERMINAL", "카드"})
    @DisplayName("매핑 카드 결제 수단 → true")
    void isCardPaymentMethod_cardCodes_returnsTrue(String paymentMethod) {
        assertThat(CardMerchantFeeConstants.isCardPaymentMethod(paymentMethod)).isTrue();
    }

    @ParameterizedTest
    @ValueSource(strings = {"CASH", "BANK_TRANSFER", "OTHER", "VIRTUAL_ACCOUNT", "MOBILE", ""})
    @DisplayName("비카드 결제 수단 → false")
    void isCardPaymentMethod_nonCardCodes_returnsFalse(String paymentMethod) {
        assertThat(CardMerchantFeeConstants.isCardPaymentMethod(paymentMethod)).isFalse();
    }

    @Test
    @DisplayName("null → false")
    void isCardPaymentMethod_null_returnsFalse() {
        assertThat(CardMerchantFeeConstants.isCardPaymentMethod(null)).isFalse();
    }

    @Test
    @DisplayName("MAPPING_CARD_PAYMENT_METHOD_CODES SSOT 목록 포함")
    void mappingCardPaymentMethodCodes_containsExpectedCodes() {
        assertThat(CardMerchantFeeConstants.MAPPING_CARD_PAYMENT_METHOD_CODES)
                .containsExactly("CARD", "CREDIT_CARD", "DEBIT_CARD", "CARD_TERMINAL", "카드");
    }
}

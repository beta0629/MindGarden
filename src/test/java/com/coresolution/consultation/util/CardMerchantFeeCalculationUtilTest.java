package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link CardMerchantFeeCalculationUtil} 테스트.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@DisplayName("CardMerchantFeeCalculationUtil 테스트")
class CardMerchantFeeCalculationUtilTest {

    @Test
    @DisplayName("100,000원 × 2.5% = 2,500원 (반올림)")
    void calculateFee_standardCase() {
        BigDecimal fee = CardMerchantFeeCalculationUtil.calculateFee(
                new BigDecimal("100000"), new BigDecimal("2.5"));
        assertThat(fee).isEqualByComparingTo(new BigDecimal("2500"));
    }

    @Test
    @DisplayName("null·0 입력 → 0")
    void calculateFee_zeroInputs() {
        assertThat(CardMerchantFeeCalculationUtil.calculateFee(null, new BigDecimal("2.5")))
                .isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(CardMerchantFeeCalculationUtil.calculateFee(new BigDecimal("1000"), null))
                .isEqualByComparingTo(BigDecimal.ZERO);
    }
}

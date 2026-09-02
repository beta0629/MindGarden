package com.coresolution.consultation.constant;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link CardMerchantFeeConstants} 정책 상수 테스트.
 */
@DisplayName("CardMerchantFeeConstants 테스트")
class CardMerchantFeeConstantsTest {

    @Test
    @DisplayName("FEE_EFFECTIVE_FROM = 2026-09-01")
    void feeEffectiveFrom_isSeptember2026() {
        assertThat(CardMerchantFeeConstants.FEE_EFFECTIVE_FROM)
                .isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    @DisplayName("DEFAULT_ISSUER_LABELS 비어 있지 않음")
    void defaultIssuerLabels_notEmpty() {
        assertThat(CardMerchantFeeConstants.DEFAULT_ISSUER_LABELS).isNotEmpty();
    }
}

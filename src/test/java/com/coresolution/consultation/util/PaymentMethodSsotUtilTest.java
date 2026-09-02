package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import com.coresolution.consultation.entity.CommonCode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link PaymentMethodSsotUtil} 단위 테스트.
 */
@DisplayName("PaymentMethodSsotUtil 테스트")
class PaymentMethodSsotUtilTest {

    private static CommonCode code(String value, String extraData) {
        return CommonCode.builder()
                .codeGroup("PAYMENT_METHOD")
                .codeValue(value)
                .codeLabel(value)
                .koreanName(value)
                .extraData(extraData)
                .build();
    }

    @Test
    @DisplayName("CREDIT_CARD extra_data → cardMerchantFeeEligible true")
    void parseCardMerchantFeeEligible_creditCard() {
        assertThat(PaymentMethodSsotUtil.parseCardMerchantFeeEligible(
                "{\"cardMerchantFeeEligible\":true,\"legacyAliases\":[\"CARD\",\"카드\"]}"))
                .isTrue();
    }

    @Test
    @DisplayName("CASH extra_data → cardMerchantFeeEligible false")
    void parseCardMerchantFeeEligible_cash() {
        assertThat(PaymentMethodSsotUtil.parseCardMerchantFeeEligible(
                "{\"cardMerchantFeeEligible\":false}"))
                .isFalse();
    }

    @Test
    @DisplayName("legacy alias CARD → CREDIT_CARD canonical")
    void resolveCode_legacyAliasCard() {
        List<CommonCode> codes = List.of(
                code("CREDIT_CARD",
                        "{\"cardMerchantFeeEligible\":true,\"legacyAliases\":[\"CARD\",\"카드\"]}"),
                code("CASH", "{\"cardMerchantFeeEligible\":false}"));
        assertThat(PaymentMethodSsotUtil.resolveCode("CARD", codes))
                .map(CommonCode::getCodeValue)
                .contains("CREDIT_CARD");
        assertThat(PaymentMethodSsotUtil.resolveCode("카드", codes))
                .map(CommonCode::getCodeValue)
                .contains("CREDIT_CARD");
    }
}

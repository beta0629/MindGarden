package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import com.coresolution.consultation.constant.PaymentMethodSsotConstants;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.repository.CommonCodeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link PaymentMethodSsotServiceImpl} 단위 테스트.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("PaymentMethodSsotServiceImpl 테스트")
class PaymentMethodSsotServiceImplTest {

    private static final String TENANT_ID = "tenant-test-001";

    @Mock
    private CommonCodeRepository commonCodeRepository;

    private PaymentMethodSsotServiceImpl service;

    @BeforeEach
    void setUp() {
        service = new PaymentMethodSsotServiceImpl(commonCodeRepository);
    }

    private static CommonCode paymentCode(String value, String extraData) {
        CommonCode code = CommonCode.builder()
                .codeGroup(PaymentMethodSsotConstants.CODE_GROUP)
                .codeValue(value)
                .codeLabel(value)
                .koreanName(value)
                .extraData(extraData)
                .isActive(true)
                .build();
        code.setTenantId(TENANT_ID);
        return code;
    }

    @Test
    @DisplayName("DEBIT_CARD → cardMerchantFeeEligible true")
    void isCardMerchantFeeEligible_debitCard() {
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(PaymentMethodSsotConstants.CODE_GROUP), eq(TENANT_ID)))
                .thenReturn(List.of(
                        paymentCode(PaymentMethodSsotConstants.CODE_CREDIT_CARD,
                                "{\"cardMerchantFeeEligible\":true}"),
                        paymentCode(PaymentMethodSsotConstants.CODE_DEBIT_CARD,
                                "{\"cardMerchantFeeEligible\":true}"),
                        paymentCode(PaymentMethodSsotConstants.CODE_CASH,
                                "{\"cardMerchantFeeEligible\":false}")));

        assertThat(service.isCardMerchantFeeEligible(TENANT_ID, "DEBIT_CARD")).isTrue();
        assertThat(service.isCardMerchantFeeEligible(TENANT_ID, "CASH")).isFalse();
    }

    @Test
    @DisplayName("legacy CARD alias → CREDIT_CARD normalize")
    void normalizeToCanonicalCodeValue_legacyCard() {
        when(commonCodeRepository.findActiveByCodeGroupForTenantWithFallback(
                eq(PaymentMethodSsotConstants.CODE_GROUP), eq(TENANT_ID)))
                .thenReturn(List.of(
                        paymentCode(PaymentMethodSsotConstants.CODE_CREDIT_CARD,
                                "{\"cardMerchantFeeEligible\":true,\"legacyAliases\":[\"CARD\",\"카드\"]}")));

        assertThat(service.normalizeToCanonicalCodeValue(TENANT_ID, "CARD"))
                .isEqualTo(PaymentMethodSsotConstants.CODE_CREDIT_CARD);
    }
}

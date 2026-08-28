package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeIssuerRate;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeIssuerRateRepository;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link CardMerchantFeeResolutionServiceImpl} 카드 수수료 금액 산출 테스트.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CardMerchantFeeResolutionService 테스트")
class CardMerchantFeeResolutionServiceTest {

    private static final String TENANT_ID = "tenant-card-fee";

    @Mock
    private CardMerchantFeeSettingsRepository settingsRepository;

    @Mock
    private CardMerchantFeeIssuerRateRepository issuerRateRepository;

    @InjectMocks
    private CardMerchantFeeResolutionServiceImpl resolutionService;

    private CardMerchantFeeSettings settings;

    @BeforeEach
    void setUp() {
        settings = CardMerchantFeeSettings.builder()
                .averageRatePercent(new BigDecimal("2.5"))
                .build();
        settings.setId(10L);
        settings.setTenantId(TENANT_ID);
    }

    @Test
    @DisplayName("100,000원 × 2.5% → 2,500원")
    void resolveFee_averageRate() {
        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));

        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                CardMerchantFeeConstants.PAYMENT_METHOD_CARD,
                null);

        assertThat(fee).isEqualByComparingTo(new BigDecimal("2500"));
    }

    @Test
    @DisplayName("현금 결제 → 0")
    void resolveFee_cashPayment() {
        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                "CASH",
                null);

        assertThat(fee).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("요율 없음 → 0")
    void resolveFee_missingRate() {
        CardMerchantFeeSettings emptySettings = CardMerchantFeeSettings.builder().build();
        emptySettings.setId(11L);
        emptySettings.setTenantId(TENANT_ID);

        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(emptySettings));

        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                CardMerchantFeeConstants.PAYMENT_METHOD_CARD,
                null);

        assertThat(fee).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("카드사별 요율이 평균보다 우선")
    void resolveFee_issuerRateWins() {
        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));
        CardMerchantFeeIssuerRate issuerRate = CardMerchantFeeIssuerRate.builder()
                .issuerLabel("신한")
                .ratePercent(new BigDecimal("3.0"))
                .sortOrder(0)
                .build();
        when(issuerRateRepository.findByTenantIdAndSettingsIdAndIsDeletedFalseOrderBySortOrderAsc(
                TENANT_ID, 10L)).thenReturn(List.of(issuerRate));

        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                CardMerchantFeeConstants.PAYMENT_METHOD_CARD,
                "신한");

        assertThat(fee).isEqualByComparingTo(new BigDecimal("3000"));
    }
}

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.constant.PaymentMethodSsotConstants;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeSettingsRepository;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * {@link CardMerchantFeeResolutionServiceImpl} 카드 수수료 금액 산출 테스트.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("CardMerchantFeeResolutionService 테스트")
class CardMerchantFeeResolutionServiceTest {

    private static final String TENANT_ID = "tenant-card-fee";
    private static final LocalDate POST_EFFECTIVE = LocalDate.of(2026, 9, 1);
    private static final LocalDate PRE_EFFECTIVE = LocalDate.of(2026, 8, 31);

    @Mock
    private CardMerchantFeeSettingsRepository settingsRepository;

    @Mock
    private PaymentMethodSsotService paymentMethodSsotService;

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

        when(paymentMethodSsotService.normalizeToCanonicalCodeValue(eq(TENANT_ID), anyString()))
                .thenAnswer(invocation -> {
                    String raw = invocation.getArgument(1);
                    if (raw == null) {
                        return null;
                    }
                    if ("CARD".equalsIgnoreCase(raw) || "카드".equals(raw)) {
                        return PaymentMethodSsotConstants.CODE_CREDIT_CARD;
                    }
                    return raw;
                });
        when(paymentMethodSsotService.isCardMerchantFeeEligible(eq(TENANT_ID), eq("CASH")))
                .thenReturn(false);
        when(paymentMethodSsotService.isCardMerchantFeeEligible(eq(TENANT_ID),
                eq(PaymentMethodSsotConstants.CODE_CREDIT_CARD)))
                .thenReturn(true);
        when(paymentMethodSsotService.isCardMerchantFeeEligible(eq(TENANT_ID),
                eq(PaymentMethodSsotConstants.CODE_DEBIT_CARD)))
                .thenReturn(true);
        when(paymentMethodSsotService.isCardMerchantFeeEligible(eq(TENANT_ID),
                eq(PaymentMethodSsotConstants.CODE_CARD_TERMINAL)))
                .thenReturn(true);
    }

    @Test
    @DisplayName("100,000원 × 2.5% → 2,500원 (적용일 이후)")
    void resolveFee_averageRate() {
        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));

        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                PaymentMethodSsotConstants.CODE_CREDIT_CARD,
                null,
                POST_EFFECTIVE);

        assertThat(fee).isEqualByComparingTo(new BigDecimal("2500"));
    }

    @Test
    @DisplayName("현금 결제 → 0")
    void resolveFee_cashPayment() {
        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                "CASH",
                null,
                POST_EFFECTIVE);

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
                PaymentMethodSsotConstants.CODE_CREDIT_CARD,
                null,
                POST_EFFECTIVE);

        assertThat(fee).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("issuer 요율이 있어도 averageRatePercent만 적용")
    void resolveFee_ignoresIssuerOverride_usesAverageOnly() {
        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));

        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                PaymentMethodSsotConstants.CODE_CREDIT_CARD,
                "신한",
                POST_EFFECTIVE);

        assertThat(fee).isEqualByComparingTo(new BigDecimal("2500"));
    }

    @Test
    @DisplayName("2026-08-31(적용일 전) → 수수료 0")
    void resolveFee_beforeEffectiveDate_returnsZero() {
        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                PaymentMethodSsotConstants.CODE_CREDIT_CARD,
                null,
                PRE_EFFECTIVE);

        assertThat(fee).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("거래일 null → 수수료 0")
    void resolveFee_nullTransactionDate_returnsZero() {
        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("100000"),
                PaymentMethodSsotConstants.CODE_CREDIT_CARD,
                null,
                null);

        assertThat(fee).isEqualByComparingTo(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("FEE_EFFECTIVE_FROM 상수는 2026-09-01")
    void feeEffectiveFrom_isSeptemberFirst2026() {
        assertThat(CardMerchantFeeConstants.FEE_EFFECTIVE_FROM)
                .isEqualTo(LocalDate.of(2026, 9, 1));
    }

    @Test
    @DisplayName("CREDIT_CARD 90,000원 × 2.08% → 1,872원 (적용일 이후, 매핑 SSOT)")
    void resolveFee_creditCard_mappingSsot() {
        CardMerchantFeeSettings creditCardSettings = CardMerchantFeeSettings.builder()
                .averageRatePercent(new BigDecimal("2.08"))
                .build();
        creditCardSettings.setId(12L);
        creditCardSettings.setTenantId(TENANT_ID);

        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(creditCardSettings));

        BigDecimal fee = resolutionService.resolveFeeAmount(
                TENANT_ID,
                new BigDecimal("90000"),
                "CREDIT_CARD",
                null,
                POST_EFFECTIVE);

        assertThat(fee).isEqualByComparingTo(new BigDecimal("1872"));
    }

    @Test
    @DisplayName("DEBIT_CARD · CARD_TERMINAL → 카드 수수료 적용")
    void resolveFee_debitAndTerminalCardCodes() {
        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));

        BigDecimal debitFee = resolutionService.resolveFeeAmount(
                TENANT_ID, new BigDecimal("100000"), "DEBIT_CARD", null, POST_EFFECTIVE);
        BigDecimal terminalFee = resolutionService.resolveFeeAmount(
                TENANT_ID, new BigDecimal("100000"), "CARD_TERMINAL", null, POST_EFFECTIVE);

        assertThat(debitFee).isEqualByComparingTo(new BigDecimal("2500"));
        assertThat(terminalFee).isEqualByComparingTo(new BigDecimal("2500"));
    }
}

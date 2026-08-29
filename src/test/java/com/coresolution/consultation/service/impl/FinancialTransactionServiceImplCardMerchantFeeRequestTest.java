package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;

import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;

/**
 * {@link FinancialTransactionServiceImpl} 카드 수수료 요청 해석 테스트.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FinancialTransactionServiceImpl 카드 수수료 요청 해석")
class FinancialTransactionServiceImplCardMerchantFeeRequestTest {

    @Mock
    private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;

    @InjectMocks
    private FinancialTransactionServiceImpl financialTransactionService;

    @Test
    @DisplayName("적용일 이후 PG 수수료는 paymentMethod 없어도 유지")
    void resolveCardMerchantFee_preservesPgFeeWithoutPaymentMethod() throws Exception {
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .amount(new BigDecimal("100000"))
                .transactionDate(LocalDate.of(2026, 9, 1))
                .cardMerchantFeeAmount(new BigDecimal("2500"))
                .build();

        BigDecimal fee = invokeResolveCardMerchantFeeForRequest("tenant-1", request);

        assertThat(fee).isEqualByComparingTo(new BigDecimal("2500"));
        verify(cardMerchantFeeResolutionService, never()).resolveFeeAmount(
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("적용일 전·요청 fee>0이어도 0 강제")
    void resolveCardMerchantFee_forcesZeroBeforeEffectiveEvenIfRequestHasFee() throws Exception {
        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .amount(new BigDecimal("100000"))
                .transactionDate(LocalDate.of(2026, 8, 31))
                .paymentMethod(CardMerchantFeeConstants.PAYMENT_METHOD_CARD)
                .cardMerchantFeeAmount(new BigDecimal("2500"))
                .build();

        BigDecimal fee = invokeResolveCardMerchantFeeForRequest("tenant-1", request);

        assertThat(fee).isEqualByComparingTo(BigDecimal.ZERO);
        verify(cardMerchantFeeResolutionService, never()).resolveFeeAmount(
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("적용일 이후 카드 결제·수수료 미입력 시 평균 요율 산출")
    void resolveCardMerchantFee_computesFromSettingsWhenCard() throws Exception {
        LocalDate txDate = LocalDate.of(2026, 9, 15);
        when(cardMerchantFeeResolutionService.resolveFeeAmount(
                eq("tenant-1"),
                eq(new BigDecimal("100000")),
                eq(CardMerchantFeeConstants.PAYMENT_METHOD_CARD),
                isNull(),
                eq(txDate))).thenReturn(new BigDecimal("2300"));

        FinancialTransactionRequest request = FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .amount(new BigDecimal("100000"))
                .paymentMethod(CardMerchantFeeConstants.PAYMENT_METHOD_CARD)
                .transactionDate(txDate)
                .build();

        BigDecimal fee = invokeResolveCardMerchantFeeForRequest("tenant-1", request);

        assertThat(fee).isEqualByComparingTo(new BigDecimal("2300"));
    }

    private BigDecimal invokeResolveCardMerchantFeeForRequest(String tenantId,
            FinancialTransactionRequest request) throws Exception {
        var method = FinancialTransactionServiceImpl.class.getDeclaredMethod(
                "resolveCardMerchantFeeForRequest", String.class, FinancialTransactionRequest.class);
        method.setAccessible(true);
        return (BigDecimal) method.invoke(financialTransactionService, tenantId, request);
    }
}

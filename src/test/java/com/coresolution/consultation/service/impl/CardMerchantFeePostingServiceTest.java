package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeIssuerRate;
import com.coresolution.consultation.entity.erp.financial.CardMerchantFeeSettings;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeIssuerRateRepository;
import com.coresolution.consultation.repository.erp.financial.CardMerchantFeeSettingsRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link CardMerchantFeePostingServiceImpl} 카드 수수료 자동 기록 테스트.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CardMerchantFeePostingService 테스트")
class CardMerchantFeePostingServiceTest {

    private static final String TENANT_ID = "tenant-card-fee";

    @Mock
    private CardMerchantFeeSettingsRepository settingsRepository;

    @Mock
    private CardMerchantFeeIssuerRateRepository issuerRateRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private FinancialTransactionService financialTransactionService;

    @InjectMocks
    private CardMerchantFeePostingServiceImpl postingService;

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
    @DisplayName("100,000원 × 2.5% → 2,500원 지출 1회 기록")
    void applyFee_createsExpenseOnce() {
        FinancialTransaction income = cardIncome(100L, new BigDecimal("100000"));
        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));
        when(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TENANT_ID, 100L, CardMerchantFeeConstants.RELATED_ENTITY_TYPE))
                .thenReturn(Collections.emptyList());
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), eq(null)))
                .thenReturn(FinancialTransactionResponse.builder().id(200L).build());

        postingService.applyCardMerchantFeeForIncome(income);

        ArgumentCaptor<FinancialTransaction> incomeCaptor = ArgumentCaptor.forClass(FinancialTransaction.class);
        verify(financialTransactionRepository).save(incomeCaptor.capture());
        assertThat(incomeCaptor.getValue().getCardMerchantFeeAmount())
                .isEqualByComparingTo(new BigDecimal("2500"));

        ArgumentCaptor<FinancialTransactionRequest> expenseCaptor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService, times(1))
                .createTransaction(expenseCaptor.capture(), eq(null));
        FinancialTransactionRequest expense = expenseCaptor.getValue();
        assertThat(expense.getAmount()).isEqualByComparingTo(new BigDecimal("2500"));
        assertThat(expense.getRelatedEntityType()).isEqualTo(CardMerchantFeeConstants.RELATED_ENTITY_TYPE);
        assertThat(expense.getRelatedEntityId()).isEqualTo(100L);
        assertThat(expense.getRemarks()).contains(CardMerchantFeeConstants.AUTO_REMARKS);
    }

    @Test
    @DisplayName("두 번째 적용 시 기존 자동 지출 갱신, createTransaction 추가 호출 없음")
    void applyFee_secondCall_updatesExistingNoDuplicate() {
        FinancialTransaction income = cardIncome(100L, new BigDecimal("100000"));
        FinancialTransaction existingExpense = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .amount(new BigDecimal("2500"))
                .remarks(CardMerchantFeeConstants.AUTO_REMARKS)
                .build();
        existingExpense.setId(201L);

        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));
        when(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TENANT_ID, 100L, CardMerchantFeeConstants.RELATED_ENTITY_TYPE))
                .thenReturn(List.of(existingExpense));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        postingService.applyCardMerchantFeeForIncome(income);

        verify(financialTransactionService, never()).createTransaction(any(), any());
        assertThat(existingExpense.getAmount()).isEqualByComparingTo(new BigDecimal("2500"));
    }

    @Test
    @DisplayName("현금 결제 → 수수료 미적용")
    void applyFee_cashPayment_noFee() {
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(new BigDecimal("100000"))
                .paymentMethod("CASH")
                .transactionDate(LocalDate.now())
                .build();
        income.setId(101L);
        income.setTenantId(TENANT_ID);

        postingService.applyCardMerchantFeeForIncome(income);

        verify(settingsRepository, never()).findByTenantIdAndIsDeletedFalse(any());
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("요율 없음 → 수수료 미적용")
    void applyFee_missingRate_noFee() {
        FinancialTransaction income = cardIncome(102L, new BigDecimal("100000"));
        CardMerchantFeeSettings emptySettings = CardMerchantFeeSettings.builder().build();
        emptySettings.setId(11L);
        emptySettings.setTenantId(TENANT_ID);

        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(emptySettings));

        postingService.applyCardMerchantFeeForIncome(income);

        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("카드사별 요율이 평균보다 우선")
    void applyFee_issuerRateWins() {
        FinancialTransaction income = cardIncome(103L, new BigDecimal("100000"));
        income.setCardIssuer("신한");

        CardMerchantFeeIssuerRate issuerRate = CardMerchantFeeIssuerRate.builder()
                .issuerLabel("신한")
                .ratePercent(new BigDecimal("3.0"))
                .sortOrder(0)
                .build();

        when(settingsRepository.findByTenantIdAndIsDeletedFalse(TENANT_ID))
                .thenReturn(Optional.of(settings));
        when(issuerRateRepository.findByTenantIdAndSettingsIdAndIsDeletedFalseOrderBySortOrderAsc(
                eq(TENANT_ID), eq(10L))).thenReturn(List.of(issuerRate));
        when(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                        TENANT_ID, 103L, CardMerchantFeeConstants.RELATED_ENTITY_TYPE))
                .thenReturn(Collections.emptyList());
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(financialTransactionService.createTransaction(any(FinancialTransactionRequest.class), eq(null)))
                .thenReturn(FinancialTransactionResponse.builder().id(300L).build());

        postingService.applyCardMerchantFeeForIncome(income);

        ArgumentCaptor<FinancialTransactionRequest> expenseCaptor =
                ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(expenseCaptor.capture(), eq(null));
        assertThat(expenseCaptor.getValue().getAmount()).isEqualByComparingTo(new BigDecimal("3000"));
    }

    private static FinancialTransaction cardIncome(Long id, BigDecimal amount) {
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(amount)
                .paymentMethod(CardMerchantFeeConstants.PAYMENT_METHOD_CARD)
                .transactionDate(LocalDate.now())
                .build();
        income.setId(id);
        income.setTenantId(TENANT_ID);
        return income;
    }
}

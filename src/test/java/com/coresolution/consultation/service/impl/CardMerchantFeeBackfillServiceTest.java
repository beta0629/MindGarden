package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.CardMerchantFeeConstants;
import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.Payment;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link CardMerchantFeeBackfillServiceImpl} 백필 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-01
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("CardMerchantFeeBackfillService 테스트")
class CardMerchantFeeBackfillServiceTest {

    private static final String TENANT_ID = "tenant-backfill-" + UUID.randomUUID();

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private ConsultantClientMappingRepository mappingRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;
    @Mock
    private PaymentMethodSsotService paymentMethodSsotService;

    @InjectMocks
    private CardMerchantFeeBackfillServiceImpl backfillService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("CREDIT_CARD 매핑 INCOME → cardMerchantFeeAmount 갱신")
    void backfill_updatesMappingCreditCardIncome() {
        FinancialTransaction tx = incomeTransaction(100L, 239L,
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING,
                new BigDecimal("90000"), LocalDate.of(2026, 9, 10));

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPaymentMethod("CREDIT_CARD");

        when(financialTransactionRepository.findIncomeWithZeroOrNullCardMerchantFeeSince(
                TENANT_ID, CardMerchantFeeConstants.FEE_EFFECTIVE_FROM))
                .thenReturn(List.of(tx));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, 239L))
                .thenReturn(Optional.of(mapping));
        when(paymentMethodSsotService.normalizeToCanonicalCodeValue(TENANT_ID, "CREDIT_CARD"))
                .thenReturn("CREDIT_CARD");
        when(paymentMethodSsotService.isCardMerchantFeeEligible(TENANT_ID, "CREDIT_CARD"))
                .thenReturn(true);
        when(cardMerchantFeeResolutionService.resolveFeeAmount(
                eq(TENANT_ID),
                eq(new BigDecimal("90000")),
                eq("CREDIT_CARD"),
                eq(null),
                eq(LocalDate.of(2026, 9, 10))))
                .thenReturn(new BigDecimal("1872"));

        Map<String, Long> result = backfillService.backfillCardMerchantFees(TENANT_ID);

        assertThat(result).containsEntry("scanned", 1L);
        assertThat(result).containsEntry("updated", 1L);
        assertThat(result).containsEntry("skipped", 0L);

        ArgumentCaptor<FinancialTransaction> captor = ArgumentCaptor.forClass(FinancialTransaction.class);
        verify(financialTransactionRepository).save(captor.capture());
        assertThat(captor.getValue().getCardMerchantFeeAmount())
                .isEqualByComparingTo(new BigDecimal("1872"));
    }

    @Test
    @DisplayName("CASH 매핑 INCOME → skip")
    void backfill_skipsNonCardMapping() {
        FinancialTransaction tx = incomeTransaction(101L, 240L,
                FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING,
                new BigDecimal("90000"), LocalDate.of(2026, 9, 10));

        ConsultantClientMapping mapping = new ConsultantClientMapping();
        mapping.setPaymentMethod("CASH");

        when(financialTransactionRepository.findIncomeWithZeroOrNullCardMerchantFeeSince(
                TENANT_ID, CardMerchantFeeConstants.FEE_EFFECTIVE_FROM))
                .thenReturn(List.of(tx));
        when(mappingRepository.findByTenantIdAndId(TENANT_ID, 240L))
                .thenReturn(Optional.of(mapping));
        when(paymentMethodSsotService.normalizeToCanonicalCodeValue(TENANT_ID, "CASH"))
                .thenReturn("CASH");
        when(paymentMethodSsotService.isCardMerchantFeeEligible(TENANT_ID, "CASH"))
                .thenReturn(false);

        Map<String, Long> result = backfillService.backfillCardMerchantFees(TENANT_ID);

        assertThat(result).containsEntry("scanned", 1L);
        assertThat(result).containsEntry("updated", 0L);
        assertThat(result).containsEntry("skipped", 1L);
        verify(financialTransactionRepository, never()).save(any());
        verify(cardMerchantFeeResolutionService, never()).resolveFeeAmount(
                any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("PAYMENT relatedEntity CARD enum → 갱신")
    void backfill_updatesPaymentCardIncome() {
        FinancialTransaction tx = incomeTransaction(102L, 55L,
                FinancialTransactionConstants.RELATED_ENTITY_PAYMENT,
                new BigDecimal("50000"), LocalDate.of(2026, 9, 5));

        Payment payment = new Payment();
        payment.setMethod(Payment.PaymentMethod.CARD);

        when(financialTransactionRepository.findIncomeWithZeroOrNullCardMerchantFeeSince(
                TENANT_ID, CardMerchantFeeConstants.FEE_EFFECTIVE_FROM))
                .thenReturn(List.of(tx));
        when(paymentRepository.findByTenantIdAndId(TENANT_ID, 55L))
                .thenReturn(Optional.of(payment));
        when(paymentMethodSsotService.normalizeToCanonicalCodeValue(TENANT_ID, "CARD"))
                .thenReturn("CREDIT_CARD");
        when(paymentMethodSsotService.isCardMerchantFeeEligible(TENANT_ID, "CREDIT_CARD"))
                .thenReturn(true);
        when(cardMerchantFeeResolutionService.resolveFeeAmount(
                eq(TENANT_ID),
                eq(new BigDecimal("50000")),
                eq("CREDIT_CARD"),
                eq(null),
                eq(LocalDate.of(2026, 9, 5))))
                .thenReturn(new BigDecimal("1250"));

        Map<String, Long> result = backfillService.backfillCardMerchantFees(TENANT_ID);

        assertThat(result).containsEntry("updated", 1L);
        verify(financialTransactionRepository).save(tx);
        assertThat(tx.getCardMerchantFeeAmount()).isEqualByComparingTo(new BigDecimal("1250"));
    }

    private static FinancialTransaction incomeTransaction(
            Long txId, Long relatedId, String relatedType, BigDecimal amount, LocalDate date) {
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(amount)
                .transactionDate(date)
                .relatedEntityId(relatedId)
                .relatedEntityType(relatedType)
                .cardMerchantFeeAmount(BigDecimal.ZERO)
                .build();
        tx.setId(txId);
        tx.setTenantId(TENANT_ID);
        return tx;
    }
}

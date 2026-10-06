package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.ConsultantClientMapping;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.exception.MappingAmountBelowRefundFloorException;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * 패키지 금액 조정 전표 writer — 감액은 음수 INCOME, 하한은 결제액 − 누적 환불.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("MappingPackageLedgerService — 차액 INCOME(감액 음수)·하한")
class MappingPackageLedgerServiceImplTest {

    private static final long PAID = 100_000L;
    private static final long INCREASE = 20_000L;
    private static final long PARTIAL_REFUND = 30_000L;
    private static final long MAPPING_ID = 9_001L;
    private static final long BASE_VERSION = 3L;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private SalaryTaxRateLookupService salaryTaxRateLookupService;

    @InjectMocks
    private MappingPackageLedgerServiceImpl service;

    private String tenantId;
    private ConsultantClientMapping mapping;

    @BeforeEach
    void setUp() {
        tenantId = "mpl-" + UUID.randomUUID().toString().replace("-", "").substring(0, 28);
        mapping = new ConsultantClientMapping();
        mapping.setId(MAPPING_ID);
        mapping.setTenantId(tenantId);
        mapping.setPackageName("mpl-pkg");
        mapping.setPaymentAmount(PAID);
        mapping.setPackagePrice(PAID);
    }

    @Test
    @DisplayName("증액 — 양수 INCOME 차액, 기존 전표 조회·삭제 없음")
    void increase_writesPositiveIncomeDelta() {
        stubVatAndSave();

        Optional<FinancialTransaction> saved = service.recordPackagePriceAdjustment(
                mapping, PAID, PAID + INCREASE, BASE_VERSION, "admin");

        FinancialTransaction ft = capturedSave();
        assertThat(saved).contains(ft);
        assertThat(ft.getTransactionType()).isEqualTo(FinancialTransaction.TransactionType.INCOME);
        assertThat(ft.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(INCREASE));
        assertThat(ft.getAmount().signum()).isPositive();
        assertThat(ft.getRelatedEntityType())
                .isEqualTo(FinancialTransactionConstants.mappingPackageAdjustmentRelatedEntityType(BASE_VERSION));
        assertThat(ft.getRelatedEntityId()).isEqualTo(MAPPING_ID);
        assertThat(ft.getTenantId()).isEqualTo(tenantId);
        assertThat(ft.getTaxAmount().add(ft.getAmountBeforeTax())).isEqualByComparingTo(ft.getAmount());
        verify(financialTransactionRepository, never()).delete(any(FinancialTransaction.class));
    }

    @Test
    @DisplayName("감액 — 음수 INCOME 차액(EXPENSE 아님)")
    void decrease_writesNegativeIncomeDelta() {
        stubVatAndSave();

        service.recordPackagePriceAdjustment(mapping, PAID, PAID - INCREASE, BASE_VERSION, "admin");

        FinancialTransaction ft = capturedSave();
        assertThat(ft.getTransactionType()).isEqualTo(FinancialTransaction.TransactionType.INCOME);
        assertThat(ft.getAmount()).isEqualByComparingTo(BigDecimal.valueOf(-INCREASE));
        assertThat(ft.getAmount().signum()).isNegative();
        assertThat(ft.getSubcategory())
                .isEqualTo(FinancialTransactionConstants.SUBCATEGORY_PACKAGE_PRICE_ADJUSTMENT);
        assertThat(ft.getTaxAmount().add(ft.getAmountBeforeTax())).isEqualByComparingTo(ft.getAmount());
    }

    @Test
    @DisplayName("차액 0 — 전표 없음")
    void zeroDelta_writesNothing() {
        assertThat(service.recordPackagePriceAdjustment(mapping, PAID, PAID, BASE_VERSION, "admin"))
                .isEmpty();
        verify(financialTransactionRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("하한 미만 — 전용 예외, 전표 없음")
    void decreaseBelowFloor_rejected() {
        stubRefundSum(PARTIAL_REFUND);

        assertThatThrownBy(() -> service.assertDecreaseAllowed(mapping, PAID - PARTIAL_REFUND - 1L))
                .isInstanceOf(MappingAmountBelowRefundFloorException.class)
                .extracting(ex -> ((MappingAmountBelowRefundFloorException) ex).getMappingId())
                .isEqualTo(MAPPING_ID);
        verify(financialTransactionRepository, never()).saveAndFlush(any());
    }

    @Test
    @DisplayName("하한과 동일 — 허용")
    void decreaseExactlyToFloor_allowed() {
        stubRefundSum(PARTIAL_REFUND);

        service.assertDecreaseAllowed(mapping, PAID - PARTIAL_REFUND);
    }

    private void stubVatAndSave() {
        when(salaryTaxRateLookupService.getVatRate(tenantId)).thenReturn(new BigDecimal("0.10"));
        when(financialTransactionRepository.saveAndFlush(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    private void stubRefundSum(long partialRefundAmount) {
        FinancialTransaction partial = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .amount(BigDecimal.valueOf(partialRefundAmount))
                .relatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND)
                .status(FinancialTransaction.TransactionStatus.COMPLETED)
                .build();
        partial.setIsDeleted(false);
        when(financialTransactionRepository
                .findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeStartingWithAndIsDeletedFalse(
                        eq(tenantId), eq(MAPPING_ID),
                        eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_PARTIAL_REFUND)))
                .thenReturn(List.of(partial));
        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                eq(tenantId), eq(MAPPING_ID),
                eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING_REFUND)))
                .thenReturn(List.of());
    }

    private FinancialTransaction capturedSave() {
        ArgumentCaptor<FinancialTransaction> captor = ArgumentCaptor.forClass(FinancialTransaction.class);
        verify(financialTransactionRepository).saveAndFlush(captor.capture());
        return captor.getValue();
    }
}

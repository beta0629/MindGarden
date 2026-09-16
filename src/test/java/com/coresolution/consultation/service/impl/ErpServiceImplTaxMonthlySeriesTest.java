package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.constant.salary.SalaryTaxRates;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.BudgetRepository;
import com.coresolution.consultation.repository.ItemRepository;
import com.coresolution.consultation.repository.PurchaseOrderRepository;
import com.coresolution.consultation.repository.PurchaseRequestRepository;
import com.coresolution.consultation.repository.SalaryTaxCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.UserService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.accounting.FinancialStatementService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.service.erp.settlement.SettlementService;
import com.coresolution.core.context.TenantContextHolder;

/**
 * {@link ErpServiceImpl#getTaxMonthlySeries} — 장부 저장 세액 + 급여 저장 세액 SSOT.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ErpServiceImpl 세금 월별 시리즈 (급여 저장 세액)")
class ErpServiceImplTaxMonthlySeriesTest {

    private static final String TENANT_ID = "tenant-tax-ssot";

    @Mock
    private ItemRepository itemRepository;
    @Mock
    private PurchaseRequestRepository purchaseRequestRepository;
    @Mock
    private PurchaseOrderRepository purchaseOrderRepository;
    @Mock
    private BudgetRepository budgetRepository;
    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private UserService userService;
    @Mock
    private FinancialTransactionService financialTransactionService;
    @Mock
    private FinancialStatementService financialStatementService;
    @Mock
    private AccountingService accountingService;
    @Mock
    private SettlementService settlementService;
    @Mock
    private SalaryTaxRateLookupService salaryTaxRateLookupService;
    @Mock
    private SalaryTaxCalculationRepository salaryTaxCalculationRepository;

    @InjectMocks
    private ErpServiceImpl erpService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("월 행·연간 salaryTaxTotals에 급여 저장 세액(국세·지방세·VAT)을 분리 합산")
    void getTaxMonthlySeries_mergesStoredSalaryTaxByMonthAndType() {
        FinancialTransaction incomeMarch = new FinancialTransaction();
        incomeMarch.setTransactionType(FinancialTransaction.TransactionType.INCOME);
        incomeMarch.setAmount(new BigDecimal("1100000"));
        incomeMarch.setTaxAmount(new BigDecimal("100000"));
        incomeMarch.setWithholdingTaxAmount(new BigDecimal("33000"));
        incomeMarch.setTransactionDate(LocalDate.of(2026, 3, 10));

        when(financialTransactionRepository
                .findByTenantIdAndTransactionDateBetweenAndIsDeletedFalse(
                        eq(TENANT_ID),
                        eq(LocalDate.of(2026, 1, 1)),
                        eq(LocalDate.of(2026, 12, 31))))
                .thenReturn(List.of(incomeMarch));

        when(salaryTaxCalculationRepository
                .findStoredTaxSumsByTenantAndPeriodRangeGroupedByMonthAndType(
                        eq(TENANT_ID),
                        eq(SalaryCalculation.SalaryStatus.CALCULATED),
                        eq(LocalDate.of(2026, 1, 1)),
                        eq(LocalDate.of(2026, 12, 31))))
                .thenReturn(List.of(
                        new Object[] {3, SalaryTaxRates.CODE_WITHHOLDING_NATIONAL, new BigDecimal("30000")},
                        new Object[] {3, SalaryTaxRates.CODE_WITHHOLDING_LOCAL, new BigDecimal("3000")},
                        new Object[] {3, SalaryTaxRates.CODE_VAT, new BigDecimal("10000")},
                        new Object[] {4, SalaryTaxRates.CODE_WITHHOLDING_NATIONAL, new BigDecimal("15000")},
                        new Object[] {4, SalaryTaxRates.CODE_WITHHOLDING_LOCAL, new BigDecimal("1500")}
                ));

        Map<String, Object> result = erpService.getTaxMonthlySeries("2026");

        @SuppressWarnings("unchecked")
        List<Map<String, Object>> months = (List<Map<String, Object>>) result.get("months");
        assertThat(months).hasSize(12);

        Map<String, Object> march = months.get(2);
        assertThat(march.get("month")).isEqualTo(3);
        assertThat((BigDecimal) march.get("vatTotal")).isEqualByComparingTo("100000");
        assertThat((BigDecimal) march.get("withholdingTotal")).isEqualByComparingTo("33000");
        assertThat((BigDecimal) march.get("salaryWithholdingNational")).isEqualByComparingTo("30000");
        assertThat((BigDecimal) march.get("salaryWithholdingLocal")).isEqualByComparingTo("3000");
        assertThat((BigDecimal) march.get("salaryVat")).isEqualByComparingTo("10000");

        Map<String, Object> april = months.get(3);
        assertThat((BigDecimal) april.get("salaryWithholdingNational")).isEqualByComparingTo("15000");
        assertThat((BigDecimal) april.get("salaryWithholdingLocal")).isEqualByComparingTo("1500");
        assertThat((BigDecimal) april.get("salaryVat")).isEqualByComparingTo(BigDecimal.ZERO);

        @SuppressWarnings("unchecked")
        Map<String, Object> salaryTaxTotals = (Map<String, Object>) result.get("salaryTaxTotals");
        assertThat((BigDecimal) salaryTaxTotals.get(SalaryTaxRates.CODE_WITHHOLDING_NATIONAL))
                .isEqualByComparingTo("45000");
        assertThat((BigDecimal) salaryTaxTotals.get(SalaryTaxRates.CODE_WITHHOLDING_LOCAL))
                .isEqualByComparingTo("4500");
        assertThat((BigDecimal) salaryTaxTotals.get(SalaryTaxRates.CODE_VAT))
                .isEqualByComparingTo("10000");
    }
}

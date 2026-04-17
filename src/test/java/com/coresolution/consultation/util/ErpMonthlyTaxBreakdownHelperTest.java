package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;

/**
 * {@link ErpMonthlyTaxBreakdownHelper} — {@link com.coresolution.consultation.service.impl.ErpServiceImpl}
 * 월간 세금 집계와 동일한 합산 규칙 검증.
 *
 * @author MindGarden
 * @since 2026-04-17
 */
class ErpMonthlyTaxBreakdownHelperTest {

    @Test
    @DisplayName("월 세금 집계: INCOME 부가세·원천 합, EXPENSE tax_amount 합, 연도 시리즈는 월별 분리")
    void monthlyTaxAggregation_matchesStoredFieldsAndMonthBuckets() {
        FinancialTransaction incomeMarch = new FinancialTransaction();
        incomeMarch.setTransactionType(FinancialTransaction.TransactionType.INCOME);
        incomeMarch.setAmount(BigDecimal.valueOf(11000));
        incomeMarch.setTaxAmount(new BigDecimal("1000.00"));
        incomeMarch.setWithholdingTaxAmount(new BigDecimal("330.00"));
        incomeMarch.setTransactionDate(LocalDate.of(2026, 3, 10));

        FinancialTransaction expenseMarch = new FinancialTransaction();
        expenseMarch.setTransactionType(FinancialTransaction.TransactionType.EXPENSE);
        expenseMarch.setAmount(BigDecimal.valueOf(5000));
        expenseMarch.setTaxAmount(new BigDecimal("500.00"));
        expenseMarch.setWithholdingTaxAmount(BigDecimal.ZERO);
        expenseMarch.setTransactionDate(LocalDate.of(2026, 3, 20));

        FinancialTransaction incomeApril = new FinancialTransaction();
        incomeApril.setTransactionType(FinancialTransaction.TransactionType.INCOME);
        incomeApril.setAmount(BigDecimal.valueOf(5000));
        incomeApril.setTaxAmount(new BigDecimal("200.00"));
        incomeApril.setWithholdingTaxAmount(new BigDecimal("100.00"));
        incomeApril.setTransactionDate(LocalDate.of(2026, 4, 5));

        Map<String, Object> oneMonth = ErpMonthlyTaxBreakdownHelper.buildBreakdown(
            List.of(incomeMarch, expenseMarch, incomeApril));
        assertEquals(0, new BigDecimal("1200.00").compareTo((BigDecimal) oneMonth.get("vatTotal")));
        assertEquals(0, new BigDecimal("430.00").compareTo((BigDecimal) oneMonth.get("withholdingTotal")));
        assertEquals(0, new BigDecimal("500.00").compareTo((BigDecimal) oneMonth.get("expenseVatTotal")));

        List<Map<String, Object>> series = ErpMonthlyTaxBreakdownHelper.buildMonthlySeriesForYear(
            2026, List.of(incomeMarch, expenseMarch, incomeApril));
        assertEquals(12, series.size());
        Map<String, Object> march = series.get(2);
        assertEquals(3, march.get("month"));
        assertEquals(0, new BigDecimal("1000.00").compareTo((BigDecimal) march.get("vatTotal")));
        assertEquals(0, new BigDecimal("330.00").compareTo((BigDecimal) march.get("withholdingTotal")));
        assertEquals(0, new BigDecimal("500.00").compareTo((BigDecimal) march.get("expenseVatTotal")));

        Map<String, Object> april = series.get(3);
        assertEquals(4, april.get("month"));
        assertEquals(0, new BigDecimal("200.00").compareTo((BigDecimal) april.get("vatTotal")));
        assertEquals(0, new BigDecimal("100.00").compareTo((BigDecimal) april.get("withholdingTotal")));
        assertEquals(0, BigDecimal.ZERO.compareTo((BigDecimal) april.get("expenseVatTotal")));
    }
}

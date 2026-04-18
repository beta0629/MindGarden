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

    @Test
    @DisplayName("레거시 INCOME: 원천만 tax_amount, withholding=0, 설명에 원천징수 → 원천 합계만, 부가세 0")
    void legacy_income_withholdingOnlyInTaxAmount_goesToWithholdingNotVat() {
        FinancialTransaction tx = new FinancialTransaction();
        tx.setTransactionType(FinancialTransaction.TransactionType.INCOME);
        tx.setAmount(new BigDecimal("850000.00"));
        tx.setTaxAmount(new BigDecimal("28050.00"));
        tx.setWithholdingTaxAmount(BigDecimal.ZERO);
        tx.setDescription("사업소득 원천징수 3.3% 예정 28,050원(부가세와 별개)");
        tx.setTransactionDate(LocalDate.of(2026, 4, 15));

        Map<String, Object> row = ErpMonthlyTaxBreakdownHelper.buildBreakdown(List.of(tx));
        assertEquals(0, BigDecimal.ZERO.compareTo((BigDecimal) row.get("vatTotal")));
        assertEquals(0, new BigDecimal("28050.00").compareTo((BigDecimal) row.get("withholdingTotal")));
    }

    @Test
    @DisplayName("상담료형 INCOME: calculateTaxFromPayment와 동일 분리 + 원천 동시 집계")
    void consultationFeeStyle_income_vatSplitAndWithholdingTogether() {
        long grossKrw = 1_100_000L;
        TaxCalculationUtil.TaxCalculationResult tax = TaxCalculationUtil.calculateTaxFromPayment(BigDecimal.valueOf(grossKrw));
        BigDecimal expectedVat = tax.getVatAmount();
        BigDecimal expectedWithholding = FreelanceWithholdingTaxUtil.calculateWithholdingTaxAmount(grossKrw);

        FinancialTransaction tx = new FinancialTransaction();
        tx.setTransactionType(FinancialTransaction.TransactionType.INCOME);
        tx.setAmount(tax.getAmountIncludingTax());
        tx.setTaxAmount(expectedVat);
        tx.setWithholdingTaxAmount(expectedWithholding);
        tx.setDescription("상담료 입금 [부가세 분리]");
        tx.setTransactionDate(LocalDate.of(2026, 6, 1));

        Map<String, Object> row = ErpMonthlyTaxBreakdownHelper.buildBreakdown(List.of(tx));
        assertEquals(0, expectedVat.compareTo((BigDecimal) row.get("vatTotal")));
        assertEquals(0, expectedWithholding.compareTo((BigDecimal) row.get("withholdingTotal")));
    }

    @Test
    @DisplayName("EXPENSE 환불·지출: tax_amount(부가세 분리)가 expenseVatTotal에 합산")
    void expense_refundStyle_expenseVatTotalIncludesTaxAmount() {
        FinancialTransaction refundExpense = new FinancialTransaction();
        refundExpense.setTransactionType(FinancialTransaction.TransactionType.EXPENSE);
        refundExpense.setAmount(new BigDecimal("-550000.00"));
        refundExpense.setTaxAmount(new BigDecimal("50000.00"));
        refundExpense.setWithholdingTaxAmount(BigDecimal.ZERO);
        refundExpense.setDescription("상담료 환불 - 테스트 (1회기 환불, 사유: 청약철회)");
        refundExpense.setTransactionDate(LocalDate.of(2026, 7, 1));

        FinancialTransaction normalExpense = new FinancialTransaction();
        normalExpense.setTransactionType(FinancialTransaction.TransactionType.EXPENSE);
        normalExpense.setAmount(new BigDecimal("110000.00"));
        normalExpense.setTaxAmount(new BigDecimal("10000.00"));
        normalExpense.setTransactionDate(LocalDate.of(2026, 7, 15));

        Map<String, Object> row = ErpMonthlyTaxBreakdownHelper.buildBreakdown(
            List.of(refundExpense, normalExpense));
        assertEquals(0, new BigDecimal("60000.00").compareTo((BigDecimal) row.get("expenseVatTotal")));
        assertEquals(0, BigDecimal.ZERO.compareTo((BigDecimal) row.get("vatTotal")));

        List<Map<String, Object>> series = ErpMonthlyTaxBreakdownHelper.buildMonthlySeriesForYear(
            2026, List.of(refundExpense, normalExpense));
        Map<String, Object> july = series.get(6);
        assertEquals(7, july.get("month"));
        assertEquals(0, new BigDecimal("60000.00").compareTo((BigDecimal) july.get("expenseVatTotal")));
    }

    @Test
    @DisplayName("상담료형 EXPENSE 환불: calculateTaxFromPayment와 동일 분리 → expenseVatTotal")
    void consultationFeeStyle_expenseRefund_vatInExpenseVatTotal() {
        long grossKrw = 110_000L;
        TaxCalculationUtil.TaxCalculationResult tax = TaxCalculationUtil.calculateTaxFromPayment(BigDecimal.valueOf(grossKrw));
        BigDecimal expectedExpenseVat = tax.getVatAmount();

        FinancialTransaction tx = new FinancialTransaction();
        tx.setTransactionType(FinancialTransaction.TransactionType.EXPENSE);
        tx.setAmount(tax.getAmountIncludingTax());
        tx.setTaxAmount(expectedExpenseVat);
        tx.setAmountBeforeTax(tax.getAmountExcludingTax());
        tx.setTaxIncluded(true);
        tx.setDescription("상담료 환불 [부가세 분리]");
        tx.setTransactionDate(LocalDate.of(2026, 7, 1));

        Map<String, Object> row = ErpMonthlyTaxBreakdownHelper.buildBreakdown(List.of(tx));
        assertEquals(0, BigDecimal.ZERO.compareTo((BigDecimal) row.get("vatTotal")));
        assertEquals(0, BigDecimal.ZERO.compareTo((BigDecimal) row.get("withholdingTotal")));
        assertEquals(0, expectedExpenseVat.compareTo((BigDecimal) row.get("expenseVatTotal")));
    }

    @Test
    @DisplayName("신규 INCOME: 부가세는 tax_amount, 원천은 withholding_tax_amount로 분리 합산")
    void newPath_income_splitsVatAndWithholdingColumns() {
        FinancialTransaction tx = new FinancialTransaction();
        tx.setTransactionType(FinancialTransaction.TransactionType.INCOME);
        tx.setAmount(new BigDecimal("1000000.00"));
        tx.setTaxAmount(new BigDecimal("10000.00"));
        tx.setWithholdingTaxAmount(new BigDecimal("28050.00"));
        tx.setDescription("D2 분리 저장");
        tx.setTransactionDate(LocalDate.of(2026, 5, 1));

        Map<String, Object> row = ErpMonthlyTaxBreakdownHelper.buildBreakdown(List.of(tx));
        assertEquals(0, new BigDecimal("10000.00").compareTo((BigDecimal) row.get("vatTotal")));
        assertEquals(0, new BigDecimal("28050.00").compareTo((BigDecimal) row.get("withholdingTotal")));
    }
}

package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionType;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link OperatorFinanceAggregation} — 운영자 콕핏 PENDING 포함·전 카테고리·total==sum 불변식.
 *
 * @author CoreSolution
 * @since 2026-10-13
 */
@DisplayName("운영자 재무 집계 SSOT")
class OperatorFinanceAggregationTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 5);

    @Test
    @DisplayName("PENDING 지출이 집계에 포함된다")
    void pendingExpense_isIncluded() {
        List<FinancialTransaction> rows = List.of(
                expense("RENT", "100000", TransactionStatus.PENDING),
                expense("SALARY", "50000", TransactionStatus.COMPLETED));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getTotalExpense()).isEqualByComparingTo("150000");
        assertThat(result.getExpenseByCategory()).containsEntry("RENT", new BigDecimal("100000"));
        assertThat(result.getExpenseByCategory()).containsEntry("SALARY", new BigDecimal("50000"));
    }

    @Test
    @DisplayName("APPROVED 수입도 집계에 포함된다")
    void approvedIncome_isIncluded() {
        List<FinancialTransaction> rows = List.of(
                income("상담료", "20000", TransactionStatus.APPROVED),
                income("상담료", "80000", TransactionStatus.COMPLETED));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getTotalIncome()).isEqualByComparingTo("100000");
        assertThat(result.sumIncomeBreakdown()).isEqualByComparingTo(result.getTotalIncome());
    }

    @Test
    @DisplayName("CANCELLED·REJECTED·삭제 지출은 제외된다")
    void cancelledRejectedDeleted_areExcluded() {
        List<FinancialTransaction> rows = new ArrayList<>();
        rows.add(expense("RENT", "100000", TransactionStatus.COMPLETED));
        rows.add(expense("RENT", "999000", TransactionStatus.CANCELLED));
        rows.add(expense("SALARY", "888000", TransactionStatus.REJECTED));
        FinancialTransaction deleted = expense("TAX", "777000", TransactionStatus.COMPLETED);
        deleted.setIsDeleted(true);
        rows.add(deleted);
        rows.add(expense("MEAL", "50000", null));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getTotalExpense()).isEqualByComparingTo("100000");
        assertThat(result.getExpenseByCategory()).containsOnlyKeys("RENT");
        assertThat(OperatorFinanceAggregation.isCountableForOperatorDashboard(deleted)).isFalse();
        assertThat(OperatorFinanceAggregation.isCountableStatus(null)).isFalse();
    }

    @Test
    @DisplayName("지출 카테고리 7개 이상이면 breakdown 에 7개 이상 나타난다")
    void expenseBreakdown_includesAllDynamicCategories() {
        List<FinancialTransaction> rows = List.of(
                expense("SALARY", "1", TransactionStatus.COMPLETED),
                expense("RENT", "2", TransactionStatus.PENDING),
                expense("UTILITY", "3", TransactionStatus.COMPLETED),
                expense("OFFICE_SUPPLIES", "4", TransactionStatus.APPROVED),
                expense("TAX", "5", TransactionStatus.COMPLETED),
                expense("EQUIPMENT", "6", TransactionStatus.PENDING),
                expense("MEAL", "7", TransactionStatus.COMPLETED),
                expense("CUSTOM_CAT_A", "8", TransactionStatus.COMPLETED));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getExpenseByCategory().size()).isGreaterThanOrEqualTo(7);
        assertThat(result.getExpenseByCategory()).containsKeys(
                "SALARY", "RENT", "UTILITY", "OFFICE_SUPPLIES", "TAX", "EQUIPMENT", "MEAL", "CUSTOM_CAT_A");
        assertThat(result.getTotalExpense()).isEqualByComparingTo("36");
        assertThat(result.sumExpenseBreakdown()).isEqualByComparingTo(result.getTotalExpense());
    }

    @Test
    @DisplayName("totalExpense == sum(expenseCategoryBreakdown) — 카드수수료 포함")
    void totalExpense_equalsSumOfExpenseBreakdown_includingCardFee() {
        FinancialTransaction incomeWithFee = income("상담료", "100000", TransactionStatus.COMPLETED);
        incomeWithFee.setCardMerchantFeeAmount(new BigDecimal("2500"));
        List<FinancialTransaction> rows = List.of(
                incomeWithFee,
                expense("RENT", "50000", TransactionStatus.PENDING));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getTotalCardMerchantFee()).isEqualByComparingTo("2500");
        assertThat(result.getTotalExpense()).isEqualByComparingTo("52500");
        assertThat(result.getExpenseByCategory())
                .containsEntry(OperatorFinanceAggregation.CATEGORY_CARD_MERCHANT_FEE, new BigDecimal("2500"));
        assertThat(result.sumExpenseBreakdown()).isEqualByComparingTo(result.getTotalExpense());
        assertThat(result.getTotalIncome()).isEqualByComparingTo(result.sumIncomeBreakdown());
    }

    @Test
    @DisplayName("totalIncome == sum(incomeCategoryBreakdown)")
    void totalIncome_equalsSumOfIncomeBreakdown() {
        List<FinancialTransaction> rows = List.of(
                income("상담료", "100000", TransactionStatus.COMPLETED),
                income("OTHER", "30000", TransactionStatus.PENDING),
                income("상담료", "20000", TransactionStatus.CANCELLED));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getTotalIncome()).isEqualByComparingTo("130000");
        assertThat(result.sumIncomeBreakdown()).isEqualByComparingTo(result.getTotalIncome());
        assertThat(result.getIncomeByCategory()).hasSize(2);
    }

    @Test
    @DisplayName("기간 필터 — 범위 밖 거래 제외")
    void dateRange_filtersTransactions() {
        List<FinancialTransaction> rows = List.of(
                expenseOn("RENT", "100000", TransactionStatus.COMPLETED, LocalDate.of(2026, 9, 30)),
                expenseOn("RENT", "200000", TransactionStatus.PENDING, LocalDate.of(2026, 10, 15)),
                expenseOn("TAX", "300000", TransactionStatus.COMPLETED, LocalDate.of(2026, 11, 1)));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(
                rows, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));

        assertThat(result.getTotalExpense()).isEqualByComparingTo("200000");
        assertThat(result.getExpenseByCategory()).containsOnlyKeys("RENT");
    }

    @Test
    @DisplayName("FinancialTransactionValidity.isValid 는 COMPLETED only 유지")
    void validity_remainsCompletedOnly() {
        FinancialTransaction pending = expense("RENT", "1", TransactionStatus.PENDING);
        assertThat(FinancialTransactionValidity.isValid(pending)).isFalse();
        assertThat(FinancialTransactionValidity.isCountableForOperatorDashboard(pending)).isTrue();
        assertThat(OperatorFinanceAggregation.isCountableForOperatorDashboard(pending)).isTrue();
    }

    @Test
    @DisplayName("빈·null 입력은 0 집계")
    void emptyInput_returnsZeros() {
        OperatorFinanceAggregation.Result empty = OperatorFinanceAggregation.aggregate(List.of());
        assertThat(empty.getTotalIncome()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(empty.getTotalExpense()).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat(empty.getExpenseByCategory()).isEmpty();

        OperatorFinanceAggregation.Result nil = OperatorFinanceAggregation.aggregate(null);
        assertThat(nil.getTransactionCount()).isZero();
    }

    private static FinancialTransaction income(String category, String amount, TransactionStatus status) {
        return incomeOn(category, amount, status, DAY);
    }

    private static FinancialTransaction incomeOn(String category, String amount,
            TransactionStatus status, LocalDate date) {
        return FinancialTransaction.builder()
                .transactionType(TransactionType.INCOME)
                .category(category)
                .amount(new BigDecimal(amount))
                .status(status)
                .transactionDate(date)
                .build();
    }

    private static FinancialTransaction expense(String category, String amount, TransactionStatus status) {
        return expenseOn(category, amount, status, DAY);
    }

    private static FinancialTransaction expenseOn(String category, String amount,
            TransactionStatus status, LocalDate date) {
        return FinancialTransaction.builder()
                .transactionType(TransactionType.EXPENSE)
                .category(category != null ? category : FinancialTransactionConstants.CATEGORY_OTHER)
                .amount(new BigDecimal(amount))
                .status(status)
                .transactionDate(date)
                .build();
    }
}

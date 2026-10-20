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
 * {@link OperatorFinanceAggregation} — 운영자 콕핏 미삭제 COMPLETED·전 카테고리·total==sum 불변식.
 *
 * @author CoreSolution
 * @since 2026-10-13
 */
@DisplayName("운영자 재무 집계 SSOT")
class OperatorFinanceAggregationTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 5);

    @Test
    @DisplayName("PENDING 지출은 집계에서 제외된다")
    void pendingExpense_isExcluded() {
        List<FinancialTransaction> rows = List.of(
                expense("RENT", "100000", TransactionStatus.PENDING),
                expense("SALARY", "50000", TransactionStatus.COMPLETED));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getTotalExpense()).isEqualByComparingTo("50000");
        assertThat(result.getExpenseByCategory()).doesNotContainKey("RENT");
        assertThat(result.getExpenseByCategory()).containsEntry("SALARY", new BigDecimal("50000"));
    }

    @Test
    @DisplayName("APPROVED 수입은 집계에서 제외된다")
    void approvedIncome_isExcluded() {
        List<FinancialTransaction> rows = List.of(
                income("상담료", "20000", TransactionStatus.APPROVED),
                income("상담료", "80000", TransactionStatus.COMPLETED));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getTotalIncome()).isEqualByComparingTo("80000");
        assertThat(result.getIncomeByCategory()).containsEntry("상담료", new BigDecimal("80000"));
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
                expense("RENT", "2", TransactionStatus.COMPLETED),
                expense("UTILITY", "3", TransactionStatus.COMPLETED),
                expense("OFFICE_SUPPLIES", "4", TransactionStatus.COMPLETED),
                expense("TAX", "5", TransactionStatus.COMPLETED),
                expense("EQUIPMENT", "6", TransactionStatus.COMPLETED),
                expense("MEAL", "7", TransactionStatus.COMPLETED),
                expense("CUSTOM_CAT_A", "8", TransactionStatus.COMPLETED),
                expense("PENDING_ONLY_CAT", "999", TransactionStatus.PENDING),
                expense("APPROVED_ONLY_CAT", "888", TransactionStatus.APPROVED));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getExpenseByCategory().size()).isGreaterThanOrEqualTo(7);
        assertThat(result.getExpenseByCategory()).containsKeys(
                "SALARY", "RENT", "UTILITY", "OFFICE_SUPPLIES", "TAX", "EQUIPMENT", "MEAL", "CUSTOM_CAT_A");
        assertThat(result.getExpenseByCategory()).doesNotContainKeys("PENDING_ONLY_CAT", "APPROVED_ONLY_CAT");
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
                expense("RENT", "50000", TransactionStatus.COMPLETED),
                expense("MEAL", "99999", TransactionStatus.PENDING));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(rows);

        assertThat(result.getTotalCardMerchantFee()).isEqualByComparingTo("2500");
        assertThat(result.getTotalExpense()).isEqualByComparingTo("52500");
        assertThat(result.getExpenseByCategory())
                .containsEntry(OperatorFinanceAggregation.CATEGORY_CARD_MERCHANT_FEE, new BigDecimal("2500"));
        assertThat(result.getExpenseByCategory()).doesNotContainKey("MEAL");
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

        assertThat(result.getTotalIncome()).isEqualByComparingTo("100000");
        assertThat(result.sumIncomeBreakdown()).isEqualByComparingTo(result.getTotalIncome());
        assertThat(result.getIncomeByCategory()).hasSize(1);
        assertThat(result.getIncomeByCategory()).doesNotContainKey("OTHER");
    }

    @Test
    @DisplayName("기간 필터 — 범위 안 PENDING 제외, 범위 안 COMPLETED 만 합산")
    void dateRange_filtersTransactions() {
        List<FinancialTransaction> rows = List.of(
                expenseOn("RENT", "100000", TransactionStatus.COMPLETED, LocalDate.of(2026, 9, 30)),
                expenseOn("RENT", "200000", TransactionStatus.PENDING, LocalDate.of(2026, 10, 15)),
                expenseOn("TAX", "150000", TransactionStatus.COMPLETED, LocalDate.of(2026, 10, 15)),
                expenseOn("TAX", "300000", TransactionStatus.COMPLETED, LocalDate.of(2026, 11, 1)));

        OperatorFinanceAggregation.Result result = OperatorFinanceAggregation.aggregate(
                rows, LocalDate.of(2026, 10, 1), LocalDate.of(2026, 10, 31));

        assertThat(result.getTotalExpense()).isEqualByComparingTo("150000");
        assertThat(result.getExpenseByCategory()).containsOnlyKeys("TAX");
    }

    @Test
    @DisplayName("집계 상태는 COUNTABLE_STATUSES(COMPLETED) 만, isValid 도 COMPLETED only")
    void validity_remainsCompletedOnly() {
        FinancialTransaction pending = expense("RENT", "1", TransactionStatus.PENDING);
        FinancialTransaction completed = expense("SALARY", "1", TransactionStatus.COMPLETED);
        assertThat(FinancialTransactionValidity.isValid(pending)).isFalse();
        assertThat(FinancialTransactionValidity.isCountableForOperatorDashboard(pending)).isFalse();
        assertThat(OperatorFinanceAggregation.isCountableForOperatorDashboard(pending)).isFalse();
        assertThat(OperatorFinanceAggregation.isCountableStatus(TransactionStatus.PENDING)).isFalse();
        assertThat(OperatorFinanceAggregation.isCountableStatus(TransactionStatus.APPROVED)).isFalse();
        assertThat(OperatorFinanceAggregation.isCountableForOperatorDashboard(completed)).isTrue();
        assertThat(FinancialTransactionValidity.isCountableForOperatorDashboard(completed)).isTrue();
        assertThat(OperatorFinanceAggregation.COUNTABLE_STATUSES)
                .containsExactly(TransactionStatus.COMPLETED);
    }

    @Test
    @DisplayName("상점 주문 CANCEL_FAILED 와 무관하게 재무 집계는 COMPLETED 만 센다")
    void countableStatuses_stayCompletedOnly() {
        assertThat(OperatorFinanceAggregation.COUNTABLE_STATUSES)
                .containsExactly(TransactionStatus.COMPLETED);
        for (TransactionStatus status : TransactionStatus.values()) {
            assertThat(OperatorFinanceAggregation.isCountableStatus(status))
                    .isEqualTo(status == TransactionStatus.COMPLETED);
        }
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

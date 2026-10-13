package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionType;

/**
 * 운영자 머니 콕핏·기간 대시보드 집계 SSOT.
 *
 * <p>세금/결산용 {@link FinancialTransactionValidity}(COMPLETED only) 와 분리한다.
 * 운영자 화면은 미삭제이면서 상태가 {@link TransactionStatus#PENDING},
 * {@link TransactionStatus#APPROVED}, {@link TransactionStatus#COMPLETED} 인 거래를 합산한다.
 * {@link TransactionStatus#CANCELLED}/{@link TransactionStatus#REJECTED}/null/삭제 는 제외.</p>
 *
 * <p>카드 가맹점 수수료를 지출 total 에 포함하면 {@link #CATEGORY_CARD_MERCHANT_FEE} 키로
 * expense breakdown 에도 동일 금액을 넣어 {@code totalExpense == sum(expenseByCategory)} 불변식을 지킨다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-13
 */
public final class OperatorFinanceAggregation {

    /**
     * 운영자 대시보드 집계에 포함하는 상태.
     */
    public static final Set<TransactionStatus> COUNTABLE_STATUSES = Collections.unmodifiableSet(
            EnumSet.of(
                    TransactionStatus.PENDING,
                    TransactionStatus.APPROVED,
                    TransactionStatus.COMPLETED));

    /**
     * 지출 breakdown 에 넣는 카드 가맹점 수수료 카테고리 키.
     * FE 라벨({@code FINANCIAL_CARD_MERCHANT_FEE_LABEL})과 매핑한다.
     */
    public static final String CATEGORY_CARD_MERCHANT_FEE = "CARD_MERCHANT_FEE";

    private OperatorFinanceAggregation() {
    }

    /**
     * 운영자 머니 콕핏·기간 대시보드에 넣을 거래인지.
     *
     * @param transaction 거래 (null 이면 false)
     * @return 미삭제이고 상태가 PENDING/APPROVED/COMPLETED 이면 true
     */
    public static boolean isCountableForOperatorDashboard(FinancialTransaction transaction) {
        if (transaction == null || Boolean.TRUE.equals(transaction.getIsDeleted())) {
            return false;
        }
        return isCountableStatus(transaction.getStatus());
    }

    /**
     * 운영자 대시보드 집계에 넣을 상태인지.
     *
     * @param status 거래 상태 (null 이면 제외)
     * @return PENDING/APPROVED/COMPLETED 이면 true
     */
    public static boolean isCountableStatus(TransactionStatus status) {
        return status != null && COUNTABLE_STATUSES.contains(status);
    }

    /**
     * 테넌트·기간으로 이미 좁힌 거래 목록을 집계한다.
     * 호출 측에서 tenantId 필터를 보장해야 한다. 본 메서드는 상태·삭제만 재필터한다.
     *
     * @param transactions 후보 거래 (null 이면 빈 집계)
     * @return 집계 결과 (totalIncome/Expense 와 category 맵 불변식 보장)
     */
    public static Result aggregate(List<FinancialTransaction> transactions) {
        return aggregate(transactions, null, null);
    }

    /**
     * 거래 목록을 운영자 기준으로 필터·집계한다.
     *
     * @param transactions 후보 거래 (null 이면 빈 집계)
     * @param startDate    포함 시작일 (null 이면 하한 없음)
     * @param endDate      포함 종료일 (null 이면 상한 없음)
     * @return 집계 결과
     */
    public static Result aggregate(List<FinancialTransaction> transactions,
            LocalDate startDate, LocalDate endDate) {
        List<FinancialTransaction> countable = filterCountable(transactions, startDate, endDate);
        return buildResult(countable);
    }

    /**
     * 운영자 집계 대상만 남긴다.
     *
     * @param transactions 후보
     * @param startDate    포함 시작일 (null 허용)
     * @param endDate      포함 종료일 (null 허용)
     * @return 필터된 목록 (수정 불가)
     */
    public static List<FinancialTransaction> filterCountable(List<FinancialTransaction> transactions,
            LocalDate startDate, LocalDate endDate) {
        if (transactions == null || transactions.isEmpty()) {
            return List.of();
        }
        return transactions.stream()
                .filter(OperatorFinanceAggregation::isCountableForOperatorDashboard)
                .filter(t -> inDateRange(t.getTransactionDate(), startDate, endDate))
                .collect(Collectors.toUnmodifiableList());
    }

    private static boolean inDateRange(LocalDate date, LocalDate startDate, LocalDate endDate) {
        if (date == null) {
            return false;
        }
        if (startDate != null && date.isBefore(startDate)) {
            return false;
        }
        if (endDate != null && date.isAfter(endDate)) {
            return false;
        }
        return true;
    }

    private static Result buildResult(List<FinancialTransaction> countable) {
        BigDecimal totalIncome = BigDecimal.ZERO;
        BigDecimal expenseBase = BigDecimal.ZERO;
        BigDecimal totalCardMerchantFee = BigDecimal.ZERO;
        Map<String, BigDecimal> incomeByCategory = new HashMap<>();
        Map<String, BigDecimal> expenseByCategory = new HashMap<>();

        for (FinancialTransaction tx : countable) {
            if (tx.getTransactionType() == null) {
                continue;
            }
            BigDecimal amount = nullToZero(tx.getAmount());
            String category = resolveCategory(tx.getCategory());

            if (TransactionType.INCOME.equals(tx.getTransactionType())) {
                totalIncome = totalIncome.add(amount);
                incomeByCategory.merge(category, amount, BigDecimal::add);
                BigDecimal fee = nullToZero(tx.getCardMerchantFeeAmount());
                if (fee.compareTo(BigDecimal.ZERO) > 0) {
                    totalCardMerchantFee = totalCardMerchantFee.add(fee);
                }
            } else if (TransactionType.EXPENSE.equals(tx.getTransactionType())) {
                expenseBase = expenseBase.add(amount);
                expenseByCategory.merge(category, amount, BigDecimal::add);
            }
        }

        if (totalCardMerchantFee.compareTo(BigDecimal.ZERO) > 0) {
            expenseByCategory.merge(CATEGORY_CARD_MERCHANT_FEE, totalCardMerchantFee, BigDecimal::add);
        }

        BigDecimal totalExpense = expenseBase.add(totalCardMerchantFee);
        BigDecimal netProfit = totalIncome.subtract(totalExpense);

        return new Result(
                totalIncome,
                totalExpense,
                totalCardMerchantFee,
                netProfit,
                Collections.unmodifiableMap(incomeByCategory),
                Collections.unmodifiableMap(expenseByCategory),
                List.copyOf(countable));
    }

    private static String resolveCategory(String category) {
        if (category == null || category.isBlank()) {
            return FinancialTransactionConstants.CATEGORY_OTHER;
        }
        return category.trim();
    }

    private static BigDecimal nullToZero(BigDecimal value) {
        return value != null ? value : BigDecimal.ZERO;
    }

    /**
     * 운영자 재무 집계 결과. total 과 breakdown 합이 같다.
     */
    public static final class Result {

        private final BigDecimal totalIncome;
        private final BigDecimal totalExpense;
        private final BigDecimal totalCardMerchantFee;
        private final BigDecimal netProfit;
        private final Map<String, BigDecimal> incomeByCategory;
        private final Map<String, BigDecimal> expenseByCategory;
        private final List<FinancialTransaction> transactions;

        private Result(BigDecimal totalIncome,
                BigDecimal totalExpense,
                BigDecimal totalCardMerchantFee,
                BigDecimal netProfit,
                Map<String, BigDecimal> incomeByCategory,
                Map<String, BigDecimal> expenseByCategory,
                List<FinancialTransaction> transactions) {
            this.totalIncome = Objects.requireNonNull(totalIncome);
            this.totalExpense = Objects.requireNonNull(totalExpense);
            this.totalCardMerchantFee = Objects.requireNonNull(totalCardMerchantFee);
            this.netProfit = Objects.requireNonNull(netProfit);
            this.incomeByCategory = Objects.requireNonNull(incomeByCategory);
            this.expenseByCategory = Objects.requireNonNull(expenseByCategory);
            this.transactions = Objects.requireNonNull(transactions);
        }

        /**
         * @return 수입 합계
         */
        public BigDecimal getTotalIncome() {
            return totalIncome;
        }

        /**
         * @return 지출 합계(카드 수수료 포함)
         */
        public BigDecimal getTotalExpense() {
            return totalExpense;
        }

        /**
         * @return 카드 가맹점 수수료 합
         */
        public BigDecimal getTotalCardMerchantFee() {
            return totalCardMerchantFee;
        }

        /**
         * @return 수입 − 지출
         */
        public BigDecimal getNetProfit() {
            return netProfit;
        }

        /**
         * @return 수입 카테고리별 합 (동적 전 키)
         */
        public Map<String, BigDecimal> getIncomeByCategory() {
            return incomeByCategory;
        }

        /**
         * @return 지출 카테고리별 합 (동적 전 키, 수수료 키 포함 시 total 과 합 일치)
         */
        public Map<String, BigDecimal> getExpenseByCategory() {
            return expenseByCategory;
        }

        /**
         * @return 집계에 포함된 거래
         */
        public List<FinancialTransaction> getTransactions() {
            return transactions;
        }

        /**
         * @return 집계에 포함된 거래 수
         */
        public int getTransactionCount() {
            return transactions.size();
        }

        /**
         * 지출 breakdown 값 합. 테스트·불변식 검증용.
         *
         * @return expenseByCategory values 합
         */
        public BigDecimal sumExpenseBreakdown() {
            return expenseByCategory.values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        /**
         * 수입 breakdown 값 합. 테스트·불변식 검증용.
         *
         * @return incomeByCategory values 합
         */
        public BigDecimal sumIncomeBreakdown() {
            return incomeByCategory.values().stream()
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
        }

        /**
         * 레거시 월간 리포트 6키용 금액 (없으면 0).
         *
         * @param category 카테고리 코드
         * @return 해당 카테고리 지출액
         */
        public BigDecimal expenseOf(String category) {
            return expenseByCategory.getOrDefault(category, BigDecimal.ZERO);
        }

        /**
         * 가변 복사본 expense 맵 (서비스 응답 put 용).
         *
         * @return 새 HashMap
         */
        public Map<String, BigDecimal> copyExpenseByCategory() {
            return new HashMap<>(expenseByCategory);
        }

        /**
         * 가변 복사본 income 맵 (서비스 응답 put 용).
         *
         * @return 새 HashMap
         */
        public Map<String, BigDecimal> copyIncomeByCategory() {
            return new HashMap<>(incomeByCategory);
        }

        /**
         * 집계 거래의 가변 복사 목록.
         *
         * @return 새 ArrayList
         */
        public List<FinancialTransaction> copyTransactions() {
            return new ArrayList<>(transactions);
        }
    }
}

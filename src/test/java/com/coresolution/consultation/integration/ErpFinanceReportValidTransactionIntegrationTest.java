package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.dto.FinancialDashboardResponse;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionType;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

/**
 * 재무 리포트·대시보드·결산 합계의 유효 거래 조건 — H2 실제 리포지토리·서비스.
 *
 * <p>같은 날짜에 완료·대기·승인 수입, 취소·거부 수입, soft delete 수입, 완료·취소 지출을 둔다.
 * 일·연 리포트·결산·COMPLETED 재무 대시보드 SUM 은 {@code FinancialTransactionValidity}
 * (미삭제 COMPLETED) 를 쓴다. 월간 리포트의 수입·지출 콕핏(total·카테고리 breakdown)과
 * 운영자 기간 대시보드는 {@code OperatorFinanceAggregation} (PENDING/APPROVED/COMPLETED) 를 쓰고,
 * 월간 {@code taxExpense}·{@code monthlyTaxBreakdown} 만 Validity(COMPLETED) 다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("ERP 리포트 — 유효 거래는 미삭제 COMPLETED 만, 대시보드와 일치")
class ErpFinanceReportValidTransactionIntegrationTest {

    private static final LocalDate REPORT_DATE = LocalDate.of(2026, 3, 15);
    private static final BigDecimal COMPLETED_INCOME = BigDecimal.valueOf(100_000L);
    /** PENDING 20_000 + APPROVED 15_000 + COMPLETED 100_000 (삭제·취소·거부 제외) */
    private static final BigDecimal OPERATOR_INCOME = BigDecimal.valueOf(135_000L);
    private static final BigDecimal EXPECTED_EXPENSE = BigDecimal.valueOf(40_000L);
    private static final BigDecimal EXPECTED_NET = COMPLETED_INCOME.subtract(EXPECTED_EXPENSE);
    private static final BigDecimal OPERATOR_NET = OPERATOR_INCOME.subtract(EXPECTED_EXPENSE);

    @Autowired private FinancialTransactionRepository financialTransactionRepository;
    @Autowired private ErpService erpService;
    @Autowired private FinancialTransactionService financialTransactionService;

    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = "erpv-" + UUID.randomUUID().toString().replace("-", "").substring(0, 26);
        String otherTenant = "erpv-o-" + UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        TenantContextHolder.setTenantId(tenantId);

        save(tenantId, TransactionType.INCOME, TransactionStatus.COMPLETED, 100_000L, false);
        save(tenantId, TransactionType.INCOME, TransactionStatus.PENDING, 20_000L, false);
        save(tenantId, TransactionType.INCOME, TransactionStatus.APPROVED, 15_000L, false);
        save(tenantId, TransactionType.INCOME, TransactionStatus.CANCELLED, 50_000L, false);
        save(tenantId, TransactionType.INCOME, TransactionStatus.REJECTED, 30_000L, false);
        save(tenantId, TransactionType.INCOME, TransactionStatus.COMPLETED, 10_000L, true);
        save(tenantId, TransactionType.EXPENSE, TransactionStatus.COMPLETED, 40_000L, false);
        save(tenantId, TransactionType.EXPENSE, TransactionStatus.CANCELLED, 5_000L, false);
        save(otherTenant, TransactionType.INCOME, TransactionStatus.COMPLETED, 900_000L, false);
        financialTransactionRepository.flush();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("일간=COMPLETED 대시보드, 월간·운영자 대시보드=OperatorFinanceAggregation")
    void dailyAndMonthlyReports_matchDashboardCompletedTotals() {
        FinancialDashboardResponse dashboard =
                financialTransactionService.getFinancialDashboard(REPORT_DATE, REPORT_DATE);
        Map<String, Object> daily = erpService.getDailyFinanceReport(REPORT_DATE.toString(), null);
        Map<String, Object> monthly = erpService.getMonthlyFinanceReport(
                String.valueOf(REPORT_DATE.getYear()), String.valueOf(REPORT_DATE.getMonthValue()), null);

        assertThat(dashboard.getTotalIncome()).isEqualByComparingTo(COMPLETED_INCOME);
        assertThat(dashboard.getTotalExpense()).isEqualByComparingTo(EXPECTED_EXPENSE);
        assertThat(dashboard.getNetProfit()).isEqualByComparingTo(EXPECTED_NET);
        assertThat(total(daily, "dailyIncome")).isEqualByComparingTo(dashboard.getTotalIncome());
        assertThat(total(daily, "dailyExpenses")).isEqualByComparingTo(dashboard.getTotalExpense());
        assertThat((BigDecimal) daily.get("dailyNetIncome")).isEqualByComparingTo(dashboard.getNetProfit());

        // 머니 콕핏 월간·기간 대시보드: PENDING/APPROVED 포함
        assertThat(total(monthly, "monthlyIncome")).isEqualByComparingTo(OPERATOR_INCOME);
        assertThat(total(monthly, "monthlyExpenses")).isEqualByComparingTo(EXPECTED_EXPENSE);
        assertThat((BigDecimal) monthly.get("monthlyNetIncome")).isEqualByComparingTo(OPERATOR_NET);
        assertThat(operatorDashboardNet()).isEqualByComparingTo(OPERATOR_NET);
        assertThat(operatorDashboardRevenue()).isEqualByComparingTo(OPERATOR_INCOME);
    }

    @Test
    @DisplayName("연간 리포트 — 미삭제 COMPLETED 만, 대시보드와 일치")
    void yearlyReport_matchesDashboard() {
        FinancialDashboardResponse dashboard =
                financialTransactionService.getFinancialDashboard(REPORT_DATE, REPORT_DATE);
        Map<String, Object> report = erpService.getYearlyFinanceReport(String.valueOf(REPORT_DATE.getYear()));

        assertThat(total(report, "yearlyIncome")).isEqualByComparingTo(dashboard.getTotalIncome());
        assertThat(total(report, "yearlyExpenses")).isEqualByComparingTo(dashboard.getTotalExpense());
        assertThat((BigDecimal) report.get("yearlyNetIncome")).isEqualByComparingTo(dashboard.getNetProfit());
    }

    @Test
    @DisplayName("재무 대시보드 월별 데이터도 COMPLETED 만")
    void financialDashboardMonthlyData_completedOnly() {
        FinancialDashboardResponse dashboard =
                financialTransactionService.getFinancialDashboard(REPORT_DATE, REPORT_DATE);

        assertThat(dashboard.getMonthlyData()).hasSize(1);
        assertThat(dashboard.getMonthlyData().get(0).getIncome()).isEqualByComparingTo(COMPLETED_INCOME);
        assertThat(dashboard.getMonthlyData().get(0).getExpense()).isEqualByComparingTo(EXPECTED_EXPENSE);
    }

    @Test
    @DisplayName("결산 합계 — 미삭제 COMPLETED 만, 대시보드와 일치")
    void closeSums_matchDashboard() {
        FinancialDashboardResponse dashboard =
                financialTransactionService.getFinancialDashboard(REPORT_DATE, REPORT_DATE);
        assertThat(financialTransactionRepository.sumAmountForCloseByType(
                tenantId, TransactionType.INCOME, REPORT_DATE, REPORT_DATE))
                .isEqualByComparingTo(dashboard.getTotalIncome());
        assertThat(financialTransactionRepository.sumAmountForCloseByType(
                tenantId, TransactionType.EXPENSE, REPORT_DATE, REPORT_DATE))
                .isEqualByComparingTo(dashboard.getTotalExpense());
    }

    @Test
    @DisplayName("월간 taxExpense·monthlyTaxBreakdown=COMPLETED만, 지출 total/breakdown은 Operator(PENDING·APPROVED 포함)")
    void monthlyTaxFields_completedOnly_whileOperatorExpenseKeepsPendingApproved() {
        // setUp: COMPLETED OFFICE_SUPPLIES 40_000. TAX·세액 필드는 이 테스트에서만 추가.
        BigDecimal completedTaxExpense = BigDecimal.valueOf(10_000L);
        BigDecimal pendingTaxExpense = BigDecimal.valueOf(7_000L);
        BigDecimal approvedTaxExpense = BigDecimal.valueOf(3_000L);
        BigDecimal completedExpenseVat = BigDecimal.valueOf(5_000L);
        BigDecimal pendingExpenseVat = BigDecimal.valueOf(2_000L);
        BigDecimal approvedExpenseVat = BigDecimal.valueOf(1_000L);

        saveExpense(tenantId, FinancialTransactionConstants.CATEGORY_TAX, TransactionStatus.COMPLETED,
                completedTaxExpense.longValue(), BigDecimal.ZERO);
        saveExpense(tenantId, FinancialTransactionConstants.CATEGORY_TAX, TransactionStatus.PENDING,
                pendingTaxExpense.longValue(), BigDecimal.ZERO);
        saveExpense(tenantId, FinancialTransactionConstants.CATEGORY_TAX, TransactionStatus.APPROVED,
                approvedTaxExpense.longValue(), BigDecimal.ZERO);
        // monthlyTaxBreakdown 은 카테고리와 무관하게 세액 필드 합 — COMPLETED만 포함되어야 함
        saveExpense(tenantId, "OFFICE_SUPPLIES", TransactionStatus.COMPLETED, 1_000L, completedExpenseVat);
        saveExpense(tenantId, "OFFICE_SUPPLIES", TransactionStatus.PENDING, 1_000L, pendingExpenseVat);
        saveExpense(tenantId, "OFFICE_SUPPLIES", TransactionStatus.APPROVED, 1_000L, approvedExpenseVat);
        financialTransactionRepository.flush();

        Map<String, Object> monthly = erpService.getMonthlyFinanceReport(
                String.valueOf(REPORT_DATE.getYear()), String.valueOf(REPORT_DATE.getMonthValue()), null);

        @SuppressWarnings("unchecked")
        Map<String, Object> monthlyExpenses = (Map<String, Object>) monthly.get("monthlyExpenses");
        assertThat((BigDecimal) monthlyExpenses.get("taxExpense"))
                .as("taxExpense는 Validity(COMPLETED) TAX만")
                .isEqualByComparingTo(completedTaxExpense);

        @SuppressWarnings("unchecked")
        Map<String, Object> taxBreakdown = (Map<String, Object>) monthly.get("monthlyTaxBreakdown");
        assertThat((BigDecimal) taxBreakdown.get("expenseVatTotal"))
                .as("monthlyTaxBreakdown expenseVat는 COMPLETED 세액만")
                .isEqualByComparingTo(completedExpenseVat);
        assertThat((BigDecimal) taxBreakdown.get("vatTotal")).isEqualByComparingTo(BigDecimal.ZERO);
        assertThat((BigDecimal) taxBreakdown.get("withholdingTotal")).isEqualByComparingTo(BigDecimal.ZERO);

        // 지출 콕핏: setUp 40_000 + TAX 20_000 + OFFICE 세액시드 amount 3_000 = 63_000
        BigDecimal operatorExpenseTotal = EXPECTED_EXPENSE
                .add(completedTaxExpense).add(pendingTaxExpense).add(approvedTaxExpense)
                .add(BigDecimal.valueOf(3_000L));
        assertThat(total(monthly, "monthlyExpenses"))
                .as("월간 지출 total은 Operator(PENDING/APPROVED 포함) 유지")
                .isEqualByComparingTo(operatorExpenseTotal);

        @SuppressWarnings("unchecked")
        Map<String, BigDecimal> expenseBreakdown =
                (Map<String, BigDecimal>) monthlyExpenses.get("expenseCategoryBreakdown");
        assertThat(expenseBreakdown.get(FinancialTransactionConstants.CATEGORY_TAX))
                .as("expenseCategoryBreakdown TAX는 Operator 합(COMPLETED+PENDING+APPROVED)")
                .isEqualByComparingTo(completedTaxExpense.add(pendingTaxExpense).add(approvedTaxExpense));
    }

    private BigDecimal operatorDashboardNet() {
        Map<String, Object> summary = operatorDashboardSummary();
        return BigDecimal.valueOf(((Number) summary.get("netProfit")).longValue());
    }

    private BigDecimal operatorDashboardRevenue() {
        Map<String, Object> summary = operatorDashboardSummary();
        return BigDecimal.valueOf(((Number) summary.get("totalRevenue")).longValue());
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> operatorDashboardSummary() {
        Map<String, Object> data = financialTransactionService.getBranchFinancialData(
                null, REPORT_DATE, REPORT_DATE, null, null);
        return (Map<String, Object>) data.get("summary");
    }

    @SuppressWarnings("unchecked")
    private static BigDecimal total(Map<String, Object> report, String key) {
        return (BigDecimal) ((Map<String, Object>) report.get(key)).get("total");
    }

    private void save(String tenant, TransactionType type, TransactionStatus status, long amount, boolean deleted) {
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(type)
                .category(type == TransactionType.INCOME ? "CONSULTATION" : "OFFICE_SUPPLIES")
                .amount(BigDecimal.valueOf(amount))
                .description("erpv-it")
                .transactionDate(REPORT_DATE)
                .taxIncluded(false)
                .taxAmount(BigDecimal.ZERO)
                .withholdingTaxAmount(BigDecimal.ZERO)
                .amountBeforeTax(BigDecimal.valueOf(amount))
                .cardMerchantFeeAmount(BigDecimal.ZERO)
                .status(status)
                .build();
        tx.setTenantId(tenant);
        tx.setIsDeleted(deleted);
        financialTransactionRepository.save(tx);
    }

    private void saveExpense(String tenant, String category, TransactionStatus status, long amount,
            BigDecimal taxAmount) {
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(TransactionType.EXPENSE)
                .category(category)
                .amount(BigDecimal.valueOf(amount))
                .description("erpv-it-tax")
                .transactionDate(REPORT_DATE)
                .taxIncluded(false)
                .taxAmount(taxAmount)
                .withholdingTaxAmount(BigDecimal.ZERO)
                .amountBeforeTax(BigDecimal.valueOf(amount))
                .cardMerchantFeeAmount(BigDecimal.ZERO)
                .status(status)
                .build();
        tx.setTenantId(tenant);
        tx.setIsDeleted(false);
        financialTransactionRepository.save(tx);
    }
}

package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionStatus;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction.TransactionType;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.ErpService;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.consultation.util.FinancialTransactionValidity;
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
 * 일·월·연 리포트와 결산은 취소·거부·삭제를 빼고, COMPLETED 대시보드 SUM 은 기존처럼 COMPLETED 만 합산한다.
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("ERP 리포트 — 취소 INCOME 제외, 대시보드 COMPLETED 합계와 범위 비교")
class ErpFinanceReportCancelledIncomeIntegrationTest {

    private static final LocalDate DAY = LocalDate.of(2026, 10, 6);
    private static final BigDecimal COMPLETED_INCOME = new BigDecimal("10000.00");
    private static final BigDecimal PENDING_INCOME = new BigDecimal("3000.00");
    private static final BigDecimal CANCELLED_INCOME = new BigDecimal("7000.00");
    private static final BigDecimal REJECTED_INCOME = new BigDecimal("2000.00");
    private static final BigDecimal DELETED_INCOME = new BigDecimal("4000.00");
    private static final BigDecimal COMPLETED_EXPENSE = new BigDecimal("1000.00");

    @Autowired private ErpService erpService;
    @Autowired private FinancialTransactionService financialTransactionService;
    @Autowired private FinancialTransactionRepository financialTransactionRepository;

    private String tenantId;

    @BeforeEach
    void setUp() {
        tenantId = "erp-rep-" + UUID.randomUUID().toString().replace("-", "").substring(0, 22);
        TenantContextHolder.setTenantId(tenantId);
        save(TransactionType.INCOME, TransactionStatus.COMPLETED, COMPLETED_INCOME, false,
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        save(TransactionType.INCOME, TransactionStatus.PENDING, PENDING_INCOME, false,
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        save(TransactionType.INCOME, TransactionStatus.CANCELLED, CANCELLED_INCOME, false,
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        save(TransactionType.INCOME, TransactionStatus.REJECTED, REJECTED_INCOME, false,
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        save(TransactionType.INCOME, TransactionStatus.COMPLETED, DELETED_INCOME, true,
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        save(TransactionType.EXPENSE, TransactionStatus.COMPLETED, COMPLETED_EXPENSE, false,
                FinancialTransactionConstants.CATEGORY_SALARY);
        financialTransactionRepository.flush();
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("일·월·연 리포트 수입은 취소·거부·삭제를 빼고 PENDING+COMPLETED 만 합산")
    void reports_excludeCancelledRejectedDeletedIncome() {
        BigDecimal expectedReportIncome = COMPLETED_INCOME.add(PENDING_INCOME);
        BigDecimal expectedReportNet = expectedReportIncome.subtract(COMPLETED_EXPENSE);

        Map<String, Object> daily = erpService.getDailyFinanceReport(DAY.toString(), null);
        Map<String, Object> monthly = erpService.getMonthlyFinanceReport("2026", "10", null);
        Map<String, Object> yearly = erpService.getYearlyFinanceReport("2026");

        assertThat(incomeTotal(daily, "dailyIncome")).isEqualByComparingTo(expectedReportIncome);
        assertThat((BigDecimal) daily.get("dailyNetIncome")).isEqualByComparingTo(expectedReportNet);
        assertThat(incomeTotal(monthly, "monthlyIncome")).isEqualByComparingTo(expectedReportIncome);
        assertThat((BigDecimal) monthly.get("monthlyNetIncome")).isEqualByComparingTo(expectedReportNet);
        assertThat(incomeTotal(yearly, "yearlyIncome")).isEqualByComparingTo(expectedReportIncome);
        assertThat((BigDecimal) yearly.get("yearlyNetIncome")).isEqualByComparingTo(expectedReportNet);

        BigDecimal closeIncome = financialTransactionRepository.sumAmountForCloseByType(
                tenantId, TransactionType.INCOME, DAY, DAY);
        assertThat(closeIncome).isEqualByComparingTo(expectedReportIncome);
    }

    @Test
    @DisplayName("COMPLETED 대시보드 SUM 은 PENDING 을 넣지 않아 일간 리포트와 다를 수 있다")
    void completedDashboard_doesNotIncludePending_unlikeDailyReport() {
        BigDecimal dashboardIncome = financialTransactionService.getTotalIncome(DAY, DAY);
        BigDecimal dashboardExpense = financialTransactionService.getTotalExpense(DAY, DAY);
        BigDecimal dashboardNet = financialTransactionService.getNetProfit(DAY, DAY);
        Map<String, Object> daily = erpService.getDailyFinanceReport(DAY.toString(), null);
        BigDecimal dailyIncome = incomeTotal(daily, "dailyIncome");
        BigDecimal dailyNet = (BigDecimal) daily.get("dailyNetIncome");

        assertThat(dashboardIncome).isEqualByComparingTo(COMPLETED_INCOME);
        assertThat(dashboardExpense).isEqualByComparingTo(COMPLETED_EXPENSE);
        assertThat(dashboardNet).isEqualByComparingTo(COMPLETED_INCOME.subtract(COMPLETED_EXPENSE));
        assertThat(dailyIncome).isEqualByComparingTo(COMPLETED_INCOME.add(PENDING_INCOME));
        assertThat(dailyNet).isNotEqualByComparingTo(dashboardNet);
        assertThat(dailyIncome.subtract(dashboardIncome)).isEqualByComparingTo(PENDING_INCOME);

        assertThat(FinancialTransactionValidity.isCompletedAndValid(tx(TransactionStatus.PENDING, false))).isFalse();
        assertThat(FinancialTransactionValidity.isValid(tx(TransactionStatus.PENDING, false))).isTrue();
    }

    @SuppressWarnings("unchecked")
    private static BigDecimal incomeTotal(Map<String, Object> report, String key) {
        Map<String, Object> income = (Map<String, Object>) report.get(key);
        return (BigDecimal) income.get("total");
    }

    private static FinancialTransaction tx(TransactionStatus status, boolean deleted) {
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setStatus(status);
        transaction.setIsDeleted(deleted);
        return transaction;
    }

    private void save(TransactionType type, TransactionStatus status, BigDecimal amount, boolean deleted,
            String category) {
        FinancialTransaction transaction = new FinancialTransaction();
        transaction.setTenantId(tenantId);
        transaction.setTransactionType(type);
        transaction.setStatus(status);
        transaction.setAmount(amount);
        transaction.setTransactionDate(DAY);
        transaction.setCategory(category);
        transaction.setDescription("erp-rep-it");
        transaction.setIsDeleted(deleted);
        financialTransactionRepository.save(transaction);
    }
}

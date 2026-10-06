package com.coresolution.consultation.integration;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

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
 * 재무 리포트·대시보드·결산 합계의 유효 거래 조건 일치 — H2 실제 리포지토리·서비스.
 *
 * <p>같은 날짜에 완료·대기·승인 수입, 취소·거부 수입, soft delete 수입, 완료·취소 지출을 둔다.
 * 일·월·연 리포트, 운영자 기간 대시보드, 결산 합계, COMPLETED 재무 대시보드 SUM 은 모두
 * {@code FinancialTransactionValidity} (미삭제 COMPLETED) 로 같은 숫자다.</p>
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
    private static final BigDecimal EXPECTED_EXPENSE = BigDecimal.valueOf(40_000L);
    private static final BigDecimal EXPECTED_NET = COMPLETED_INCOME.subtract(EXPECTED_EXPENSE);

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
    @DisplayName("일간·월간 리포트와 재무 대시보드 합계가 같다 (PENDING/APPROVED/CANCELLED/REJECTED 존재)")
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
        assertThat(total(monthly, "monthlyIncome")).isEqualByComparingTo(dashboard.getTotalIncome());
        assertThat(total(monthly, "monthlyExpenses")).isEqualByComparingTo(dashboard.getTotalExpense());
        assertThat((BigDecimal) monthly.get("monthlyNetIncome")).isEqualByComparingTo(dashboard.getNetProfit());
        assertThat((BigDecimal) daily.get("dailyNetIncome")).isEqualByComparingTo(operatorDashboardNet());
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

    private BigDecimal operatorDashboardNet() {
        Map<String, Object> data = financialTransactionService.getBranchFinancialData(
                null, REPORT_DATE, REPORT_DATE, null, null);
        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) data.get("summary");
        return BigDecimal.valueOf(((Number) summary.get("netProfit")).longValue());
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
}

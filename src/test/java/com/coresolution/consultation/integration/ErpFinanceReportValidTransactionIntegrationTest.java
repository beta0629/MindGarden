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
 * <p>같은 날짜에 완료·대기 수입, 취소·거부 수입, soft delete 수입, 완료·취소 지출을 두고
 * 일·월·연 리포트, 운영자 재무 대시보드, 재무 대시보드 합계, 결산 합계가 모두 같은 수입·지출·순익을 내는지 본다.
 * 다른 테넌트 거래는 어느 합계에도 섞이지 않는다.</p>
 *
 * @author CoreSolution
 * @since 2026-10-06
 */
@SpringBootTest(classes = com.coresolution.consultation.ConsultationManagementApplication.class)
@ActiveProfiles("test")
@Transactional
@DisplayName("ERP 리포트 — 취소·거부·삭제 거래 제외, 대시보드 순익과 일치")
class ErpFinanceReportValidTransactionIntegrationTest {

    private static final LocalDate REPORT_DATE = LocalDate.of(2026, 3, 15);
    private static final BigDecimal EXPECTED_INCOME = BigDecimal.valueOf(120_000L);
    private static final BigDecimal EXPECTED_EXPENSE = BigDecimal.valueOf(40_000L);
    private static final BigDecimal EXPECTED_NET = EXPECTED_INCOME.subtract(EXPECTED_EXPENSE);

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
    @DisplayName("일간 리포트 — 취소·거부·삭제 수입 제외, 순익 = 대시보드 순익")
    void dailyReport_excludesInvalidAndMatchesDashboard() {
        Map<String, Object> report = erpService.getDailyFinanceReport(REPORT_DATE.toString(), null);

        assertThat(total(report, "dailyIncome")).isEqualByComparingTo(EXPECTED_INCOME);
        assertThat(total(report, "dailyExpenses")).isEqualByComparingTo(EXPECTED_EXPENSE);
        assertThat((BigDecimal) report.get("dailyNetIncome")).isEqualByComparingTo(EXPECTED_NET);
        assertThat((BigDecimal) report.get("dailyNetIncome")).isEqualByComparingTo(operatorDashboardNet());
    }

    @Test
    @DisplayName("월간 리포트 — 취소·거부·삭제 수입 제외, 순익 = 대시보드 순익")
    void monthlyReport_excludesInvalidAndMatchesDashboard() {
        Map<String, Object> report = erpService.getMonthlyFinanceReport(
                String.valueOf(REPORT_DATE.getYear()), String.valueOf(REPORT_DATE.getMonthValue()), null);

        assertThat(total(report, "monthlyIncome")).isEqualByComparingTo(EXPECTED_INCOME);
        assertThat(total(report, "monthlyExpenses")).isEqualByComparingTo(EXPECTED_EXPENSE);
        assertThat((BigDecimal) report.get("monthlyNetIncome")).isEqualByComparingTo(operatorDashboardNet());
    }

    @Test
    @DisplayName("연간 리포트 — 취소·거부·삭제 수입 제외")
    void yearlyReport_excludesInvalid() {
        Map<String, Object> report = erpService.getYearlyFinanceReport(String.valueOf(REPORT_DATE.getYear()));

        assertThat(total(report, "yearlyIncome")).isEqualByComparingTo(EXPECTED_INCOME);
        assertThat(total(report, "yearlyExpenses")).isEqualByComparingTo(EXPECTED_EXPENSE);
        assertThat((BigDecimal) report.get("yearlyNetIncome")).isEqualByComparingTo(EXPECTED_NET);
    }

    @Test
    @DisplayName("재무 대시보드 합계(JPQL) = 운영자 대시보드 = 리포트")
    void financialDashboardTotals_matchOperatorDashboard() {
        FinancialDashboardResponse dashboard = financialTransactionService.getFinancialDashboard(REPORT_DATE, REPORT_DATE);

        assertThat(dashboard.getTotalIncome()).isEqualByComparingTo(EXPECTED_INCOME);
        assertThat(dashboard.getTotalExpense()).isEqualByComparingTo(EXPECTED_EXPENSE);
        assertThat(dashboard.getNetProfit()).isEqualByComparingTo(operatorDashboardNet());
        assertThat(dashboard.getMonthlyData()).hasSize(1);
        assertThat(dashboard.getMonthlyData().get(0).getIncome()).isEqualByComparingTo(EXPECTED_INCOME);
        assertThat(dashboard.getMonthlyData().get(0).getExpense()).isEqualByComparingTo(EXPECTED_EXPENSE);
    }

    @Test
    @DisplayName("결산 합계 — 취소·거부·삭제 거래 제외")
    void closeSums_excludeInvalid() {
        assertThat(financialTransactionRepository.sumAmountForCloseByType(
                tenantId, TransactionType.INCOME, REPORT_DATE, REPORT_DATE)).isEqualByComparingTo(EXPECTED_INCOME);
        assertThat(financialTransactionRepository.sumAmountForCloseByType(
                tenantId, TransactionType.EXPENSE, REPORT_DATE, REPORT_DATE)).isEqualByComparingTo(EXPECTED_EXPENSE);
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

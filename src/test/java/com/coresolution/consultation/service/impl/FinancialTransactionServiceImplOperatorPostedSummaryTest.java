package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PurchaseRequestRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialPeriodRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.util.OperatorFinanceAggregation;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;

/**
 * OFD·장부 KPI posted 필터·기간 전체 합계·수입 전용 breakdown 회귀.
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FinancialTransactionServiceImpl 운영자 posted 합계")
class FinancialTransactionServiceImplOperatorPostedSummaryTest {

    private static final String TENANT_ID = "tenant-ofd-parity";
    private static final LocalDate START = LocalDate.of(2026, 8, 1);
    private static final LocalDate END = LocalDate.of(2026, 8, 31);

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;
    @Mock
    private SalaryCalculationRepository salaryCalculationRepository;
    @Mock
    private PurchaseRequestRepository purchaseRequestRepository;
    @Mock
    private PaymentRepository paymentRepository;
    @Mock
    private ConsultantClientMappingRepository consultantClientMappingRepository;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private RealTimeStatisticsService realTimeStatisticsService;
    @Mock
    private UserRepository userRepository;
    @Mock
    private AccountingService accountingService;
    @Mock
    private UserPersonalDataCacheService userPersonalDataCacheService;
    @Mock
    private PersonalDataEncryptionUtil encryptionUtil;
    @Mock
    private FinancialPeriodRepository financialPeriodRepository;
    @Mock
    private CardMerchantFeeResolutionService cardMerchantFeeResolutionService;

    @InjectMocks
    private FinancialTransactionServiceImpl service;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("getBranchFinancialData: posted INCOME 합 = totalRevenue, CANCELLED/REJECTED 제외")
    void getBranchFinancialData_excludesCancelledAndRejectedFromRevenue() {
        List<FinancialTransaction> rows = new ArrayList<>();
        rows.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "1500000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 5)));
        rows.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "300000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 10)));
        rows.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "999000",
                FinancialTransaction.TransactionStatus.CANCELLED, LocalDate.of(2026, 8, 12)));
        rows.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "888000",
                FinancialTransaction.TransactionStatus.REJECTED, LocalDate.of(2026, 8, 13)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_RENT, "1540000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 1)));

        when(financialTransactionRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
                .thenReturn(rows);

        Map<String, Object> result = service.getBranchFinancialData(null, START, END, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) result.get("summary");
        assertThat(summary.get("totalRevenue")).isEqualTo(1_800_000L);
        assertThat(summary.get("totalExpenses")).isEqualTo(1_540_000L);
        assertThat(summary.get("totalCardMerchantFee")).isEqualTo(0L);
        assertThat(summary.get("netProfit")).isEqualTo(260_000L);

        @SuppressWarnings("unchecked")
        Map<String, BigDecimal> incomeBreakdown =
                (Map<String, BigDecimal>) result.get("incomeCategoryBreakdown");
        assertThat(incomeBreakdown.get(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE))
                .isEqualByComparingTo(new BigDecimal("1800000"));

        @SuppressWarnings("unchecked")
        Map<String, BigDecimal> expenseBreakdown =
                (Map<String, BigDecimal>) result.get("expenseCategoryBreakdown");
        assertThat(expenseBreakdown.get(FinancialTransactionConstants.CATEGORY_RENT))
                .isEqualByComparingTo(new BigDecimal("1540000"));

        // categoryBreakdown 은 수입 전용 (환불 EXPENSE 상담료 mix 오염 방지)
        @SuppressWarnings("unchecked")
        Map<String, BigDecimal> categoryBreakdown =
                (Map<String, BigDecimal>) result.get("categoryBreakdown");
        assertThat(categoryBreakdown)
                .containsOnlyKeys(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE);
        assertThat(categoryBreakdown).doesNotContainKey(FinancialTransactionConstants.CATEGORY_RENT);
    }

    @Test
    @DisplayName("getBranchFinancialData: 카드수수료는 totalExpenses·expenseCategoryBreakdown 양쪽에 동일 반영")
    void getBranchFinancialData_includesCardFeeInExpenses() {
        FinancialTransaction incomeWithFee = income(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "100000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 5));
        incomeWithFee.setCardMerchantFeeAmount(new BigDecimal("2500"));

        when(financialTransactionRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
                .thenReturn(List.of(incomeWithFee));

        Map<String, Object> result = service.getBranchFinancialData(null, START, END, null, null);
        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) result.get("summary");
        assertThat(summary.get("totalRevenue")).isEqualTo(100_000L);
        assertThat(summary.get("totalCardMerchantFee")).isEqualTo(2_500L);
        assertThat(summary.get("totalExpenses")).isEqualTo(2_500L);
        assertThat(summary.get("netProfit")).isEqualTo(97_500L);

        @SuppressWarnings("unchecked")
        Map<String, BigDecimal> expenseBreakdown =
                (Map<String, BigDecimal>) result.get("expenseCategoryBreakdown");
        assertThat(expenseBreakdown.get(OperatorFinanceAggregation.CATEGORY_CARD_MERCHANT_FEE))
                .isEqualByComparingTo(new BigDecimal("2500"));
        BigDecimal breakdownSum = expenseBreakdown.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(breakdownSum).isEqualByComparingTo(new BigDecimal("2500"));
    }

    @Test
    @DisplayName("getBranchFinancialData: PENDING·APPROVED 제외, COMPLETED만 total==sum(breakdown)")
    void getBranchFinancialData_excludesPendingAndApprovedFromTotals() {
        List<FinancialTransaction> rows = new ArrayList<>();
        rows.add(expense(FinancialTransactionConstants.CATEGORY_RENT, "100000",
                FinancialTransaction.TransactionStatus.PENDING, LocalDate.of(2026, 8, 2)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_SALARY, "200000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 3)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_TAX, "30000",
                FinancialTransaction.TransactionStatus.APPROVED, LocalDate.of(2026, 8, 4)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_TAX, "30000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 4)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_MEAL, "15000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 5)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_EQUIPMENT, "40000",
                FinancialTransaction.TransactionStatus.PENDING, LocalDate.of(2026, 8, 6)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_EQUIPMENT, "40000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 6)));
        rows.add(expense("OFFICE_SUPPLIES", "10000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 7)));
        rows.add(expense("CUSTOM_MARKETING", "5000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 8)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_UTILITY, "8000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 8)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_RENT, "12000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 9)));
        rows.add(expense(FinancialTransactionConstants.CATEGORY_RENT, "999000",
                FinancialTransaction.TransactionStatus.CANCELLED, LocalDate.of(2026, 8, 9)));
        rows.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "500000",
                FinancialTransaction.TransactionStatus.PENDING, LocalDate.of(2026, 8, 10)));
        rows.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "250000",
                FinancialTransaction.TransactionStatus.APPROVED, LocalDate.of(2026, 8, 11)));
        rows.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "180000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 12)));

        when(financialTransactionRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
                .thenReturn(rows);

        Map<String, Object> result = service.getBranchFinancialData(null, START, END, null, null);
        @SuppressWarnings("unchecked")
        Map<String, Object> summary = (Map<String, Object>) result.get("summary");
        assertThat(summary.get("totalRevenue")).isEqualTo(180_000L);
        assertThat(summary.get("totalExpenses")).isEqualTo(320_000L);

        @SuppressWarnings("unchecked")
        Map<String, BigDecimal> expenseBreakdown =
                (Map<String, BigDecimal>) result.get("expenseCategoryBreakdown");
        assertThat(expenseBreakdown.size()).isGreaterThanOrEqualTo(7);
        assertThat(expenseBreakdown).containsKeys(
                FinancialTransactionConstants.CATEGORY_SALARY,
                FinancialTransactionConstants.CATEGORY_TAX,
                FinancialTransactionConstants.CATEGORY_MEAL,
                FinancialTransactionConstants.CATEGORY_EQUIPMENT,
                "OFFICE_SUPPLIES",
                "CUSTOM_MARKETING",
                FinancialTransactionConstants.CATEGORY_UTILITY,
                FinancialTransactionConstants.CATEGORY_RENT);
        assertThat(expenseBreakdown.get(FinancialTransactionConstants.CATEGORY_RENT))
                .isEqualByComparingTo(new BigDecimal("12000"));
        assertThat(expenseBreakdown.get(FinancialTransactionConstants.CATEGORY_TAX))
                .isEqualByComparingTo(new BigDecimal("30000"));
        BigDecimal expenseSum = expenseBreakdown.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(expenseSum).isEqualByComparingTo(new BigDecimal("320000"));

        @SuppressWarnings("unchecked")
        Map<String, BigDecimal> incomeBreakdown =
                (Map<String, BigDecimal>) result.get("incomeCategoryBreakdown");
        BigDecimal incomeSum = incomeBreakdown.values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(incomeSum).isEqualByComparingTo(new BigDecimal("180000"));
    }

    @Test
    @DisplayName("getTransactionsFilteredSummary: >20건 INCOME 전량 합 (페이지 무관)")
    void getTransactionsFilteredSummary_sumsBeyondPageSize() {
        List<FinancialTransaction> many = new ArrayList<>();
        for (int i = 0; i < 25; i++) {
            many.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "100000",
                    FinancialTransaction.TransactionStatus.COMPLETED,
                    LocalDate.of(2026, 8, 1).plusDays(i % 28)));
        }
        many.add(income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "500000",
                FinancialTransaction.TransactionStatus.CANCELLED, LocalDate.of(2026, 8, 20)));

        when(financialTransactionRepository.findAll(any(Specification.class))).thenReturn(many);

        Map<String, Object> summary = service.getTransactionsFilteredSummary(null, null, START, END);

        assertThat(summary.get("totalIncome")).isEqualTo(2_500_000L);
        assertThat(summary.get("totalExpense")).isEqualTo(0L);
        assertThat(summary.get("remaining")).isEqualTo(2_500_000L);
        @SuppressWarnings("unchecked")
        Map<String, Object> taxBreakdown = (Map<String, Object>) summary.get("taxBreakdown");
        assertThat(taxBreakdown).isNotNull();
        assertThat(taxBreakdown.get("vatTotal")).isEqualTo(0L);
        assertThat(taxBreakdown.get("withholdingTotal")).isEqualTo(0L);
        assertThat(taxBreakdown.get("expenseVatTotal")).isEqualTo(0L);
        verify(financialTransactionRepository).findAll(any(Specification.class));
    }

    @Test
    @DisplayName("getTransactionsFilteredSummary: taxBreakdown은 COMPLETED 저장 세액만(세율 재계산 없음)")
    void getTransactionsFilteredSummary_includesStoredTaxBreakdown() {
        FinancialTransaction incomeWithTax = income(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "1100000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 5));
        incomeWithTax.setTaxAmount(new BigDecimal("100000"));
        incomeWithTax.setWithholdingTaxAmount(new BigDecimal("33000"));

        FinancialTransaction expenseWithTax = expense(
                FinancialTransactionConstants.CATEGORY_RENT, "550000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 8));
        expenseWithTax.setTaxAmount(new BigDecimal("50000"));

        FinancialTransaction pendingIncome = income(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "700000",
                FinancialTransaction.TransactionStatus.PENDING, LocalDate.of(2026, 8, 9));
        pendingIncome.setTaxAmount(new BigDecimal("70000"));
        pendingIncome.setWithholdingTaxAmount(new BigDecimal("11000"));

        FinancialTransaction approvedExpense = expense(
                FinancialTransactionConstants.CATEGORY_RENT, "90000",
                FinancialTransaction.TransactionStatus.APPROVED, LocalDate.of(2026, 8, 10));
        approvedExpense.setTaxAmount(new BigDecimal("9000"));

        when(financialTransactionRepository.findAll(any(Specification.class)))
                .thenReturn(List.of(incomeWithTax, expenseWithTax, pendingIncome, approvedExpense));

        Map<String, Object> summary = service.getTransactionsFilteredSummary(null, null, START, END);

        @SuppressWarnings("unchecked")
        Map<String, Object> taxBreakdown = (Map<String, Object>) summary.get("taxBreakdown");
        assertThat(taxBreakdown.get("vatTotal")).isEqualTo(100_000L);
        assertThat(taxBreakdown.get("withholdingTotal")).isEqualTo(33_000L);
        assertThat(taxBreakdown.get("expenseVatTotal")).isEqualTo(50_000L);
    }

    @Test
    @DisplayName("getBranchFinancialData: taxBreakdown은 COMPLETED 저장 세액만, PENDING·APPROVED 제외")
    void getBranchFinancialData_includesTopLevelTaxBreakdown() {
        FinancialTransaction incomeWithTax = income(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "1100000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 5));
        incomeWithTax.setTaxAmount(new BigDecimal("100000"));
        incomeWithTax.setWithholdingTaxAmount(new BigDecimal("33000"));

        FinancialTransaction cancelled = income(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "220000",
                FinancialTransaction.TransactionStatus.CANCELLED, LocalDate.of(2026, 8, 6));
        cancelled.setTaxAmount(new BigDecimal("20000"));
        cancelled.setWithholdingTaxAmount(new BigDecimal("6600"));

        FinancialTransaction pending = income(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "400000",
                FinancialTransaction.TransactionStatus.PENDING, LocalDate.of(2026, 8, 7));
        pending.setTaxAmount(new BigDecimal("40000"));
        pending.setWithholdingTaxAmount(new BigDecimal("8000"));

        FinancialTransaction approvedExpense = expense(
                FinancialTransactionConstants.CATEGORY_RENT, "120000",
                FinancialTransaction.TransactionStatus.APPROVED, LocalDate.of(2026, 8, 8));
        approvedExpense.setTaxAmount(new BigDecimal("12000"));

        when(financialTransactionRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
                .thenReturn(List.of(incomeWithTax, cancelled, pending, approvedExpense));

        Map<String, Object> result = service.getBranchFinancialData(null, START, END, null, null);

        @SuppressWarnings("unchecked")
        Map<String, Object> taxBreakdown = (Map<String, Object>) result.get("taxBreakdown");
        assertThat(taxBreakdown.get("vatTotal")).isEqualTo(100_000L);
        assertThat(taxBreakdown.get("withholdingTotal")).isEqualTo(33_000L);
        assertThat(taxBreakdown.get("expenseVatTotal")).isEqualTo(0L);
    }

    @Test
    @DisplayName("cancelRelatedPostedIncomeTransactions: COMPLETED INCOME만 CANCELLED, 멱등")
    void cancelRelatedPostedIncomeTransactions_cancelsActiveIncomeOnly() {
        FinancialTransaction active = income(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "800000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 5));
        active.setId(11L);
        active.setRelatedEntityId(228L);
        active.setRelatedEntityType(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING);

        FinancialTransaction alreadyCancelled = income(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "800000",
                FinancialTransaction.TransactionStatus.CANCELLED, LocalDate.of(2026, 8, 5));
        alreadyCancelled.setId(12L);

        FinancialTransaction expenseRefund = expense(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "800000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 6));
        expenseRefund.setId(13L);

        when(financialTransactionRepository.findByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndIsDeletedFalse(
                eq(TENANT_ID), eq(228L),
                eq(FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING)))
                .thenReturn(List.of(active, alreadyCancelled, expenseRefund));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        int first = service.cancelRelatedPostedIncomeTransactions(
                228L, FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING);
        assertThat(first).isEqualTo(1);
        assertThat(active.getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.CANCELLED);

        int second = service.cancelRelatedPostedIncomeTransactions(
                228L, FinancialTransactionConstants.RELATED_ENTITY_CONSULTANT_CLIENT_MAPPING);
        assertThat(second).isZero();

        ArgumentCaptor<FinancialTransaction> saved = ArgumentCaptor.forClass(FinancialTransaction.class);
        verify(financialTransactionRepository).save(saved.capture());
        assertThat(saved.getValue().getId()).isEqualTo(11L);
    }

    @Test
    @DisplayName("장부 summary.totalIncome === OFD totalRevenue (동일 posted 집합)")
    void ledgerSummaryMatchesBranchFinancialDataRevenue() {
        List<FinancialTransaction> rows = List.of(
                income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "4620000",
                        FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 3)),
                expense(FinancialTransactionConstants.CATEGORY_RENT, "1540000",
                        FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 1)),
                income(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "500000",
                        FinancialTransaction.TransactionStatus.CANCELLED, LocalDate.of(2026, 8, 8))
        );
        when(financialTransactionRepository.findByTenantIdAndIsDeletedFalse(eq(TENANT_ID)))
                .thenReturn(rows);
        when(financialTransactionRepository.findAll(any(Specification.class))).thenReturn(rows);

        Map<String, Object> ofd = service.getBranchFinancialData(null, START, END, null, null);
        Map<String, Object> ledgerSummary = service.getTransactionsFilteredSummary(null, null, START, END);

        @SuppressWarnings("unchecked")
        Map<String, Object> ofdSummary = (Map<String, Object>) ofd.get("summary");
        assertThat(ledgerSummary.get("totalIncome")).isEqualTo(ofdSummary.get("totalRevenue"));
        assertThat(ledgerSummary.get("totalExpense")).isEqualTo(ofdSummary.get("totalExpenses"));
    }

    @Test
    @DisplayName("getTransactionsFilteredSummary: refundAmount는 기간 posted EXPENSE 환불만, CANCELLED·REJECTED 제외")
    void getTransactionsFilteredSummary_refundAmountExcludesCancelledAndSumsPeriod() {
        List<FinancialTransaction> rows = new ArrayList<>();

        FinancialTransaction consultationRefund = expense(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "100000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 5));
        consultationRefund.setSubcategory("CONSULTATION_REFUND");
        rows.add(consultationRefund);

        for (int i = 0; i < 21; i++) {
            FinancialTransaction partial = expense(
                    FinancialTransactionConstants.CATEGORY_OTHER, "1000",
                    FinancialTransaction.TransactionStatus.COMPLETED,
                    LocalDate.of(2026, 8, 1).plusDays(i % 28));
            partial.setSubcategory("PARTIAL_SESSION_REFUND");
            if (i == 0) {
                partial.setStatus(null);
            }
            rows.add(partial);
        }

        rows.add(expense("CONSULTATION_PARTIAL_REFUND", "7000",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 10)));

        FinancialTransaction approved = expense(
                "CONSULTATION_PARTIAL_REFUND", "9000",
                FinancialTransaction.TransactionStatus.APPROVED, LocalDate.of(2026, 8, 11));
        approved.setSubcategory("SESSION_REFUND");
        rows.add(approved);

        FinancialTransaction cancelled = expense(
                FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE, "4135000",
                FinancialTransaction.TransactionStatus.CANCELLED, LocalDate.of(2026, 8, 12));
        cancelled.setSubcategory("CONSULTATION_REFUND");
        rows.add(cancelled);

        FinancialTransaction rejected = expense(
                FinancialTransactionConstants.CATEGORY_OTHER, "500000",
                FinancialTransaction.TransactionStatus.REJECTED, LocalDate.of(2026, 8, 13));
        rejected.setSubcategory("SESSION_REFUND");
        rows.add(rejected);

        rows.add(expense(FinancialTransactionConstants.CATEGORY_RENT, "90896",
                FinancialTransaction.TransactionStatus.COMPLETED, LocalDate.of(2026, 8, 14)));

        when(financialTransactionRepository.findAll(any(Specification.class))).thenReturn(rows);

        Map<String, Object> summary = service.getTransactionsFilteredSummary(null, null, START, END);

        long expectedRefund = 100_000L + 20L * 1_000L + 7_000L;
        assertThat(summary.get("refundAmount")).isEqualTo(expectedRefund);
        assertThat(summary.get("refundAmount")).isNotEqualTo(4_135_000L);
        assertThat(summary.get("totalExpense")).isEqualTo(expectedRefund + 90_896L);
        assertThat(summary.get("totalIncome")).isEqualTo(0L);
        assertThat(summary.get("totalCardMerchantFee")).isEqualTo(0L);
        assertThat(summary.get("remaining")).isEqualTo(-(expectedRefund + 90_896L));
    }

    @Test
    @DisplayName("getTransactionsFilteredSummary: tenant 없으면 refundAmount 0")
    void getTransactionsFilteredSummary_emptySummaryIncludesRefundAmount() {
        TenantContextHolder.clear();

        Map<String, Object> summary = service.getTransactionsFilteredSummary(null, null, START, END);

        assertThat(summary.get("refundAmount")).isEqualTo(0L);
        assertThat(summary.get("totalIncome")).isEqualTo(0L);
        assertThat(summary.get("totalExpense")).isEqualTo(0L);
        assertThat(summary.get("remaining")).isEqualTo(0L);
    }

    private static FinancialTransaction income(String category, String amount,
            FinancialTransaction.TransactionStatus status, LocalDate date) {
        return FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(category)
                .amount(new BigDecimal(amount))
                .status(status)
                .transactionDate(date)
                .build();
    }

    private static FinancialTransaction expense(String category, String amount,
            FinancialTransaction.TransactionStatus status, LocalDate date) {
        return FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .category(category)
                .amount(new BigDecimal(amount))
                .status(status)
                .transactionDate(date)
                .build();
    }
}

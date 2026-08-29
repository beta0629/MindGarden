package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.FinancialDashboardResponse;
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
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;

/**
 * {@link FinancialTransactionServiceImpl#getSalaryFinancialData} — EXPENSE 급여 합산 회귀.
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("FinancialTransactionServiceImpl 급여 재무 집계")
class FinancialTransactionServiceImplSalaryFinancialDataTest {

    private static final String TENANT_ID = "tenant-salary-financial";
    private static final String SALARY_CATEGORY = "SALARY";
    private static final String EXPENSE_TYPE = "EXPENSE";

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
    @DisplayName("totalSalaryPaid는 EXPENSE+SALARY 합만 반영하고 INCOME은 제외")
    void getSalaryFinancialData_sumsExpenseSalaryOnly() throws Exception {
        when(commonCodeService.getCodeName("TRANSACTION_TYPE", "EXPENSE")).thenReturn(EXPENSE_TYPE);

        FinancialTransaction expenseSalary = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .category(SALARY_CATEGORY)
                .amount(new BigDecimal("1500000"))
                .transactionDate(LocalDate.of(2026, 8, 1))
                .build();
        FinancialTransaction anotherExpenseSalary = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .category(SALARY_CATEGORY)
                .amount(new BigDecimal("500000"))
                .transactionDate(LocalDate.of(2026, 8, 15))
                .build();
        FinancialTransaction incomeSalary = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(SALARY_CATEGORY)
                .amount(new BigDecimal("999999"))
                .transactionDate(LocalDate.of(2026, 8, 10))
                .build();

        when(financialTransactionRepository.findByTenantIdAndCategoryAndIsDeletedFalse(
                eq(TENANT_ID), eq(SALARY_CATEGORY)))
                .thenReturn(List.of(expenseSalary, anotherExpenseSalary, incomeSalary));
        when(userRepository.findByRoleAndIsActiveTrue(eq(TENANT_ID), eq(UserRole.CONSULTANT)))
                .thenReturn(Collections.emptyList());

        FinancialDashboardResponse.SalaryFinancialData result = invokeGetSalaryFinancialData();

        assertThat(result.getTotalSalaryPaid()).isEqualByComparingTo(new BigDecimal("2000000"));
        assertThat(result.getTotalSalaryPaid()).isNotEqualByComparingTo(new BigDecimal("999999"));
        assertThat(result.getConsultantCount()).isZero();
        assertThat(result.getAverageSalary()).isEqualByComparingTo(BigDecimal.ZERO);
    }

    private FinancialDashboardResponse.SalaryFinancialData invokeGetSalaryFinancialData()
            throws Exception {
        var method = FinancialTransactionServiceImpl.class.getDeclaredMethod("getSalaryFinancialData");
        method.setAccessible(true);
        return (FinancialDashboardResponse.SalaryFinancialData) method.invoke(service);
    }
}

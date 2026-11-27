package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.Collections;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PurchaseRequestRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;

/**
 * {@link FinancialTransactionServiceImpl#getTransactionsFiltered} 단위 검증.
 *
 * @author CoreSolution
 * @since 2026-04-25
 */
@ExtendWith(MockitoExtension.class)
class FinancialTransactionServiceImplGetTransactionsFilteredTest {

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

    @InjectMocks
    private FinancialTransactionServiceImpl financialTransactionService;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId("tenant-filter-test");
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    void getTransactionsFiltered_delegatesToRepositoryFindAll() {
        Pageable pageable = PageRequest.of(0, 20);
        when(financialTransactionRepository.findAll(any(Specification.class), eq(pageable)))
                .thenReturn(new PageImpl<>(Collections.emptyList(), pageable, 0));

        Page<?> result = financialTransactionService.getTransactionsFiltered(
                null, "ALL", null, null, pageable);

        assertThat(result.getTotalElements()).isZero();
        verify(financialTransactionRepository).findAll(any(Specification.class), eq(pageable));
    }

    @Test
    void getTransactionsFiltered_invalidTypeThrows() {
        Pageable pageable = PageRequest.of(0, 20);

        assertThatThrownBy(() -> financialTransactionService.getTransactionsFiltered(
                "NOT_A_TYPE", "ALL", LocalDate.now(), LocalDate.now(), pageable))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("유효하지 않은");
    }
}

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialPeriod;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.PeriodStatus;
import com.coresolution.consultation.entity.erp.financial.PeriodType;
import com.coresolution.consultation.exception.PeriodClosedException;
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
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.coresolution.consultation.dto.FinancialTransactionRequest;

/**
 * {@link FinancialTransactionServiceImpl} 마감 기간 가드 테스트 (T2, T3, T8 회귀).
 *
 * <p>합의서 §6:
 * <ul>
 *   <li>T2 — 마감 후 거래 수정 시도 → {@link PeriodClosedException} (HTTP 409)</li>
 *   <li>T3 — REOPENED 기간 거래 수정 → 가드 통과</li>
 *   <li>T8 회귀 — 미마감(OPEN) 기간 거래 수정 → 정상 통과</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
class FinancialTransactionServiceImplPeriodGuardTest {

    private static final String TENANT_ID = "tenant-period-guard";
    private static final LocalDate TX_DATE = LocalDate.of(2026, 5, 27);

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
    @DisplayName("T2: 마감(CLOSED) 기간 거래 수정 시도 → PeriodClosedException")
    void updateTransaction_periodClosed_throws() {
        User admin = adminUser();
        FinancialTransaction tx = txOnDate(TX_DATE);
        when(financialTransactionRepository.findByTenantIdAndId(eq(TENANT_ID), eq(10L)))
                .thenReturn(Optional.of(tx));
        when(financialPeriodRepository.findClosedByTenantIdAndDate(
                eq(TENANT_ID), eq(TX_DATE), eq(PeriodType.DAY)))
                .thenReturn(Optional.of(closedPeriod(PeriodStatus.CLOSED)));

        FinancialTransactionRequest req = simpleRequest();

        assertThatThrownBy(() -> service.updateTransaction(10L, req, admin))
                .isInstanceOf(PeriodClosedException.class)
                .hasMessageContaining("마감된 기간");
        verify(financialTransactionRepository, never()).save(any(FinancialTransaction.class));
    }

    @Test
    @DisplayName("T3: REOPENED 기간 거래 수정 → 가드 통과 (ADMIN 수정 성공)")
    void updateTransaction_periodReopened_passesGuard() {
        User admin = adminUser();
        FinancialTransaction tx = txOnDate(TX_DATE);
        when(financialTransactionRepository.findByTenantIdAndId(eq(TENANT_ID), eq(11L)))
                .thenReturn(Optional.of(tx));
        when(financialPeriodRepository.findClosedByTenantIdAndDate(
                eq(TENANT_ID), eq(TX_DATE), eq(PeriodType.DAY)))
                .thenReturn(Optional.of(closedPeriod(PeriodStatus.REOPENED)));
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        FinancialTransactionRequest req = simpleRequest();

        // REOPENED 가드 통과 → 정상 update 수행 (PeriodClosedException 발생 안 함)
        var response = service.updateTransaction(11L, req, admin);

        assertThat(response).isNotNull();
        verify(financialTransactionRepository, times(1)).save(any(FinancialTransaction.class));
    }

    @Test
    @DisplayName("T8 회귀: OPEN(미마감) 기간 거래 수정 → 정상 통과")
    void updateTransaction_periodOpen_passesGuard() {
        User admin = adminUser();
        FinancialTransaction tx = txOnDate(TX_DATE);
        when(financialTransactionRepository.findByTenantIdAndId(eq(TENANT_ID), eq(12L)))
                .thenReturn(Optional.of(tx));
        when(financialPeriodRepository.findClosedByTenantIdAndDate(
                eq(TENANT_ID), eq(TX_DATE), eq(PeriodType.DAY)))
                .thenReturn(Optional.empty());
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        FinancialTransactionRequest req = simpleRequest();

        var response = service.updateTransaction(12L, req, admin);

        assertThat(response).isNotNull();
        verify(financialTransactionRepository, times(1)).save(any(FinancialTransaction.class));
    }

    @Test
    @DisplayName("T2 (delete 회귀): CLOSED 기간 거래 삭제 → PeriodClosedException")
    void deleteTransaction_periodClosed_throws() {
        User admin = adminUser();
        FinancialTransaction tx = txOnDate(TX_DATE);
        when(financialTransactionRepository.findByTenantIdAndId(eq(TENANT_ID), eq(13L)))
                .thenReturn(Optional.of(tx));
        when(financialPeriodRepository.findClosedByTenantIdAndDate(
                eq(TENANT_ID), eq(TX_DATE), eq(PeriodType.DAY)))
                .thenReturn(Optional.of(closedPeriod(PeriodStatus.CLOSED)));

        assertThatThrownBy(() -> service.deleteTransaction(13L, admin))
                .isInstanceOf(PeriodClosedException.class);
        verify(financialTransactionRepository, never()).save(any(FinancialTransaction.class));
    }

    private User adminUser() {
        User user = new User();
        user.setId(1L);
        user.setRole(UserRole.ADMIN);
        user.setTenantId(TENANT_ID);
        return user;
    }

    private FinancialTransaction txOnDate(LocalDate date) {
        FinancialTransaction tx = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .amount(new BigDecimal("100000"))
                .transactionDate(date)
                .status(FinancialTransaction.TransactionStatus.PENDING)
                .build();
        tx.setTenantId(TENANT_ID);
        return tx;
    }

    private FinancialPeriod closedPeriod(PeriodStatus status) {
        return FinancialPeriod.builder()
                .id(99L)
                .tenantId(TENANT_ID)
                .periodType(PeriodType.DAY)
                .periodStart(TX_DATE)
                .periodEnd(TX_DATE)
                .status(status)
                .build();
    }

    private FinancialTransactionRequest simpleRequest() {
        return FinancialTransactionRequest.builder()
                .transactionType("INCOME")
                .category("상담료")
                .amount(new BigDecimal("100000"))
                .transactionDate(TX_DATE)
                .build();
    }
}

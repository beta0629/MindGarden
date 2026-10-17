package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.PlatformTransactionManager;

import com.coresolution.consultation.constant.FinancialTransactionConstants;
import com.coresolution.consultation.constant.RecordedExpenseCompletionMessages;
import com.coresolution.consultation.constant.UserRole;
import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.dto.FinancialTransactionResponse;
import com.coresolution.consultation.entity.User;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.PeriodType;
import com.coresolution.consultation.repository.ConsultantClientMappingRepository;
import com.coresolution.consultation.repository.PaymentRepository;
import com.coresolution.consultation.repository.PurchaseRequestRepository;
import com.coresolution.consultation.repository.SalaryCalculationRepository;
import com.coresolution.consultation.repository.UserRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialPeriodRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.PaymentMethodSsotService;
import com.coresolution.consultation.service.RealTimeStatisticsService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.consultation.service.UserPersonalDataCacheService;
import com.coresolution.consultation.service.erp.accounting.AccountingService;
import com.coresolution.consultation.service.erp.financial.CardMerchantFeeResolutionService;
import com.coresolution.consultation.util.PersonalDataEncryptionUtil;
import com.coresolution.core.context.TenantContextHolder;

/**
 * 빠른 지출은 저장 시 완료, 일반 생성(결제·환불·입금)은 대기를 유지한다.
 * 재무 합계는 기존 COMPLETED 집계 테스트를 유지한다.
 *
 * @author CoreSolution
 * @since 2026-10-17
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("빠른 지출 완료 저장과 장부 완료 처리")
class FinancialTransactionServiceImplQuickExpenseCompleteTest {

    private static final String TENANT_ID = "tenant-quick-expense";

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
    @Mock
    private SalaryTaxRateLookupService salaryTaxRateLookupService;
    @Mock
    private PaymentMethodSsotService paymentMethodSsotService;
    @Mock
    private PlatformTransactionManager transactionManager;

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
    @DisplayName("일반 createTransaction 은 지출도 PENDING 으로 남긴다")
    void createTransaction_keepsExpensePending() {
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(invocation -> {
                    FinancialTransaction saved = invocation.getArgument(0);
                    saved.setId(11L);
                    return saved;
                });

        FinancialTransactionResponse response = service.createTransaction(expenseRequest("RENT", "OFFICE_RENT"), admin());

        ArgumentCaptor<FinancialTransaction> captor = ArgumentCaptor.forClass(FinancialTransaction.class);
        verify(financialTransactionRepository).save(captor.capture());
        assertThat(captor.getValue().getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.PENDING);
        assertThat(response.getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.PENDING.name());
    }

    @Test
    @DisplayName("빠른 지출은 저장 직후 COMPLETED 다")
    void createCompletedQuickExpense_savesCompleted() {
        AtomicReference<FinancialTransaction> stored = new AtomicReference<>();
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(invocation -> {
                    FinancialTransaction saved = invocation.getArgument(0);
                    if (saved.getId() == null) {
                        saved.setId(21L);
                    }
                    stored.set(saved);
                    return saved;
                });
        when(financialTransactionRepository.findByTenantIdAndId(eq(TENANT_ID), eq(21L)))
                .thenAnswer(invocation -> Optional.ofNullable(stored.get()));
        when(financialPeriodRepository.findClosedByTenantIdAndDate(eq(TENANT_ID), any(LocalDate.class), eq(PeriodType.DAY)))
                .thenReturn(Optional.empty());

        FinancialTransactionResponse response = service.createCompletedQuickExpense(
                expenseRequest("RENT", "OFFICE_RENT"), admin());

        assertThat(response.getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.COMPLETED.name());
        assertThat(response.getTransactionType()).isEqualTo(FinancialTransaction.TransactionType.EXPENSE.name());
    }

    @Test
    @DisplayName("대기 지출은 화면 완료 처리로 COMPLETED 가 된다")
    void completeRecordedExpense_pendingBecomesCompleted() {
        FinancialTransaction pending = expenseEntity(
                31L, FinancialTransactionConstants.CATEGORY_SALARY, "CONSULTANT_SALARY",
                FinancialTransaction.TransactionStatus.PENDING);
        when(financialTransactionRepository.findByTenantIdAndId(TENANT_ID, 31L)).thenReturn(Optional.of(pending));
        when(financialPeriodRepository.findClosedByTenantIdAndDate(eq(TENANT_ID), any(LocalDate.class), eq(PeriodType.DAY)))
                .thenReturn(Optional.empty());
        when(financialTransactionRepository.save(any(FinancialTransaction.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        FinancialTransactionResponse response = service.completeRecordedExpense(31L, admin());

        assertThat(response.getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.COMPLETED.name());
        assertThat(pending.getStatus()).isEqualTo(FinancialTransaction.TransactionStatus.COMPLETED);
    }

    @Test
    @DisplayName("수입 상담료와 환불 지출은 완료 처리하지 않는다")
    void completeRecordedExpense_rejectsIncomeAndRefund() {
        FinancialTransaction income = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.INCOME)
                .category(FinancialTransactionConstants.CATEGORY_CONSULTATION_FEE)
                .amount(new BigDecimal("90000"))
                .status(FinancialTransaction.TransactionStatus.PENDING)
                .transactionDate(LocalDate.of(2026, 10, 2))
                .build();
        income.setId(41L);
        when(financialTransactionRepository.findByTenantIdAndId(TENANT_ID, 41L)).thenReturn(Optional.of(income));

        assertThatThrownBy(() -> service.completeRecordedExpense(41L, admin()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(RecordedExpenseCompletionMessages.REASON_NOT_EXPENSE);

        FinancialTransaction refund = expenseEntity(
                42L, FinancialTransactionConstants.CATEGORY_OTHER, "CONSULTATION_REFUND",
                FinancialTransaction.TransactionStatus.PENDING);
        when(financialTransactionRepository.findByTenantIdAndId(TENANT_ID, 42L)).thenReturn(Optional.of(refund));

        assertThatThrownBy(() -> service.completeRecordedExpense(42L, admin()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(RecordedExpenseCompletionMessages.REASON_REFUND);
        verify(financialTransactionRepository, never()).save(any(FinancialTransaction.class));
    }

    @Test
    @DisplayName("빠른 지출 요청이 환불이면 저장하지 않는다")
    void createCompletedQuickExpense_rejectsRefundBeforeSave() {
        FinancialTransactionRequest request = expenseRequest(
                FinancialTransactionConstants.CATEGORY_OTHER, "CONSULTATION_REFUND");

        assertThatThrownBy(() -> service.createCompletedQuickExpense(request, admin()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage(RecordedExpenseCompletionMessages.REASON_REFUND);
        verify(financialTransactionRepository, never()).save(any(FinancialTransaction.class));
    }

    private static User admin() {
        User user = new User();
        user.setRole(UserRole.ADMIN);
        user.setTenantId(TENANT_ID);
        user.setEmail("admin@example.com");
        return user;
    }

    private static FinancialTransactionRequest expenseRequest(String category, String subcategory) {
        return FinancialTransactionRequest.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE.name())
                .category(category)
                .subcategory(subcategory)
                .amount(new BigDecimal("100000"))
                .transactionDate(LocalDate.of(2026, 10, 3))
                .description("임대")
                .build();
    }

    private static FinancialTransaction expenseEntity(Long id, String category, String subcategory,
            FinancialTransaction.TransactionStatus status) {
        FinancialTransaction transaction = FinancialTransaction.builder()
                .transactionType(FinancialTransaction.TransactionType.EXPENSE)
                .category(category)
                .subcategory(subcategory)
                .amount(new BigDecimal("100000"))
                .status(status)
                .transactionDate(LocalDate.of(2026, 10, 3))
                .description("급여")
                .build();
        transaction.setId(id);
        transaction.setTenantId(TENANT_ID);
        return transaction;
    }
}

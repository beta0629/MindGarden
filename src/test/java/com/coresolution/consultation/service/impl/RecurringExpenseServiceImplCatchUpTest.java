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
import java.time.YearMonth;
import java.time.ZoneId;
import java.util.List;

import com.coresolution.consultation.dto.FinancialTransactionRequest;
import com.coresolution.consultation.entity.RecurringExpense;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.repository.RecurringExpenseRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.erp.financial.FinancialTransactionService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link RecurringExpenseServiceImpl} 월별 catch-up 멱등·기간·일자 클램프 테스트.
 *
 * @author CoreSolution
 * @since 2026-08-28
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RecurringExpenseServiceImpl catch-up 테스트")
class RecurringExpenseServiceImplCatchUpTest {

    private static final ZoneId SEOUL = ZoneId.of("Asia/Seoul");
    private static final String TENANT_ID = "tenant-test";

    @Mock
    private RecurringExpenseRepository recurringExpenseRepository;

    @Mock
    private FinancialTransactionService financialTransactionService;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @InjectMocks
    private RecurringExpenseServiceImpl recurringExpenseService;

    @BeforeEach
    void setUp() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("catch-up 두 번 호출해도 같은 달에는 createTransaction 1회만")
    void catchUp_isIdempotentForSameMonth() {
        YearMonth current = YearMonth.now(SEOUL);
        RecurringExpense rule = activeMonthlyRule(
            1L, current.atDay(1), new BigDecimal("1000000"), 1);
        when(recurringExpenseRepository.findByTenantIdAndIsActiveTrue(TENANT_ID))
            .thenReturn(List.of(rule));
        when(financialTransactionRepository
            .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                eq(TENANT_ID),
                eq(1L),
                eq(RecurringExpenseServiceImpl.buildRelatedEntityType(current)),
                eq(FinancialTransaction.TransactionType.EXPENSE)))
            .thenReturn(false)
            .thenReturn(true);
        when(recurringExpenseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        int first = recurringExpenseService.catchUpMonthlyRecurringExpenses();
        int second = recurringExpenseService.catchUpMonthlyRecurringExpenses();

        assertThat(first).isEqualTo(1);
        assertThat(second).isEqualTo(0);
        verify(financialTransactionService, times(1))
            .createTransaction(any(FinancialTransactionRequest.class), eq(null));
    }

    @Test
    @DisplayName("시작 달부터 현재 달까지 누락 월만 기록 (5개월 창)")
    void catchUp_postsWindowFromStartMonthThroughCurrent() {
        YearMonth current = YearMonth.now(SEOUL);
        YearMonth start = current.minusMonths(4);
        RecurringExpense rule = activeMonthlyRule(
            2L, start.atDay(1), new BigDecimal("500000"), 1);
        when(recurringExpenseRepository.findByTenantIdAndIsActiveTrue(TENANT_ID))
            .thenReturn(List.of(rule));
        when(financialTransactionRepository
            .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                eq(TENANT_ID), eq(2L), any(), eq(FinancialTransaction.TransactionType.EXPENSE)))
            .thenReturn(false);
        when(recurringExpenseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        int created = recurringExpenseService.catchUpMonthlyRecurringExpenses();

        assertThat(created).isEqualTo(5);
        verify(financialTransactionService, times(5))
            .createTransaction(any(FinancialTransactionRequest.class), eq(null));
    }

    @Test
    @DisplayName("비활성 규칙은 catch-up 대상에서 제외")
    void catchUp_skipsInactiveRules() {
        when(recurringExpenseRepository.findByTenantIdAndIsActiveTrue(TENANT_ID))
            .thenReturn(List.of());

        int created = recurringExpenseService.catchUpMonthlyRecurringExpenses();

        assertThat(created).isEqualTo(0);
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("매월 31일은 2월 마지막 날(28/29)로 클램프")
    void resolveTransactionDate_clampsDay31InFebruary() {
        LocalDate feb2026 = RecurringExpenseServiceImpl.resolveTransactionDate(YearMonth.of(2026, 2), 31);
        assertThat(feb2026).isEqualTo(LocalDate.of(2026, 2, 28));

        LocalDate feb2024 = RecurringExpenseServiceImpl.resolveTransactionDate(YearMonth.of(2024, 2), 31);
        assertThat(feb2024).isEqualTo(LocalDate.of(2024, 2, 29));
    }

    @Test
    @DisplayName("지급액은 부가세 포함 그대로 ledger amount에 저장")
    void postExpense_storesVatInclusiveAmountAsIs() {
        YearMonth current = YearMonth.now(SEOUL);
        RecurringExpense rule = activeMonthlyRule(
            3L, current.atDay(1), new BigDecimal("1100000"), 5);
        when(recurringExpenseRepository.findByTenantIdAndIsActiveTrue(TENANT_ID))
            .thenReturn(List.of(rule));
        when(financialTransactionRepository
            .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                any(), any(), any(), any()))
            .thenReturn(false);
        when(recurringExpenseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        recurringExpenseService.catchUpMonthlyRecurringExpenses();

        ArgumentCaptor<FinancialTransactionRequest> captor =
            ArgumentCaptor.forClass(FinancialTransactionRequest.class);
        verify(financialTransactionService).createTransaction(captor.capture(), eq(null));
        FinancialTransactionRequest request = captor.getValue();
        assertThat(request.getAmount()).isEqualByComparingTo(new BigDecimal("1100000"));
        assertThat(request.getTaxIncluded()).isTrue();
        assertThat(request.getDescription()).isEqualTo("월 임대료");
        assertThat(request.getRelatedEntityType())
            .isEqualTo(RecurringExpenseServiceImpl.buildRelatedEntityType(current));
        assertThat(request.getRelatedEntityId()).isEqualTo(3L);
    }

    @Test
    @DisplayName("autoProcess=false(카드대금) 규칙은 catch-up에서 거래를 만들지 않음")
    void catchUp_skipsVariableAmountRules() {
        YearMonth current = YearMonth.now(SEOUL);
        RecurringExpense rule = activeMonthlyRule(
            4L, current.minusMonths(2).atDay(1), BigDecimal.ZERO, 15);
        rule.setAutoProcess(false);
        rule.setExpenseName("카드대금");
        when(recurringExpenseRepository.findByTenantIdAndIsActiveTrue(TENANT_ID))
            .thenReturn(List.of(rule));

        int created = recurringExpenseService.catchUpMonthlyRecurringExpenses();

        assertThat(created).isEqualTo(0);
        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    @Test
    @DisplayName("record-month: 2026-08 1,234,000원 1회 기록, 두 번째 호출은 중복 없음")
    void recordMonth_postsOnceAndIsIdempotent() {
        YearMonth target = YearMonth.of(2026, 8);
        RecurringExpense rule = activeMonthlyRule(
            5L, LocalDate.of(2026, 4, 1), BigDecimal.ZERO, 15);
        rule.setAutoProcess(false);
        rule.setExpenseName("카드대금");
        when(recurringExpenseRepository.findByTenantIdAndId(TENANT_ID, 5L))
            .thenReturn(java.util.Optional.of(rule));
        when(financialTransactionRepository
            .existsByTenantIdAndRelatedEntityIdAndRelatedEntityTypeAndTransactionTypeAndIsDeletedFalse(
                eq(TENANT_ID),
                eq(5L),
                eq(RecurringExpenseServiceImpl.buildRelatedEntityType(target)),
                eq(FinancialTransaction.TransactionType.EXPENSE)))
            .thenReturn(false)
            .thenReturn(true);
        when(recurringExpenseRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        boolean first = recurringExpenseService.recordRecurringExpenseMonth(
            5L, "2026-08", new BigDecimal("1234000"));
        boolean second = recurringExpenseService.recordRecurringExpenseMonth(
            5L, "2026-08", new BigDecimal("1234000"));

        assertThat(first).isTrue();
        assertThat(second).isFalse();
        verify(financialTransactionService, times(1))
            .createTransaction(any(FinancialTransactionRequest.class), eq(null));
    }

    @Test
    @DisplayName("record-month: 0원 이하 금액 거부")
    void recordMonth_rejectsZeroOrNegativeAmount() {
        RecurringExpense rule = activeMonthlyRule(
            6L, LocalDate.of(2026, 4, 1), BigDecimal.ZERO, 15);
        rule.setAutoProcess(false);
        when(recurringExpenseRepository.findByTenantIdAndId(TENANT_ID, 6L))
            .thenReturn(java.util.Optional.of(rule));

        assertThatThrownBy(() -> recurringExpenseService.recordRecurringExpenseMonth(
            6L, "2026-08", BigDecimal.ZERO))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("0보다");

        verify(financialTransactionService, never()).createTransaction(any(), any());
    }

    private RecurringExpense activeMonthlyRule(
            Long id, LocalDate startDate, BigDecimal amount, int day) {
        RecurringExpense rule = new RecurringExpense();
        rule.setId(id);
        rule.setExpenseName("월 임대료");
        rule.setCategory("RENT");
        rule.setAmount(amount);
        rule.setRecurrenceType("MONTHLY");
        rule.setRecurrenceDay(day);
        rule.setStartDate(startDate);
        rule.setAutoProcess(true);
        rule.setIsActive(true);
        rule.setIsVatApplicable(true);
        rule.setTotalProcessedCount(0);
        return rule;
    }
}

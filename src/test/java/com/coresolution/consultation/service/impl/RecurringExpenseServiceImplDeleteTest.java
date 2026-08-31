package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import com.coresolution.consultation.entity.RecurringExpense;
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
 * {@link RecurringExpenseServiceImpl} soft-delete / isActive 토글 분리 테스트.
 *
 * @author CoreSolution
 * @since 2026-08-31
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RecurringExpenseServiceImpl delete / toggle 테스트")
class RecurringExpenseServiceImplDeleteTest {

    private static final String TENANT_ID = "tenant-test";
    private static final Long RULE_ID = 10L;

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
    @DisplayName("A) DELETE: soft-delete 후 목록 경로에서 규칙이 나오지 않음")
    void delete_softDeletesAndExcludesFromTenantList() {
        RecurringExpense rule = activeMonthlyRule(RULE_ID);
        when(recurringExpenseRepository.findByTenantIdAndId(TENANT_ID, RULE_ID))
            .thenReturn(Optional.of(rule));
        when(recurringExpenseRepository.save(any(RecurringExpense.class)))
            .thenAnswer(inv -> inv.getArgument(0));
        // soft-delete된 행은 findAllByTenantId 가 반환하지 않는다고 가정
        when(recurringExpenseRepository.findAllByTenantId(TENANT_ID))
            .thenReturn(List.of());

        boolean deleted = recurringExpenseService.deleteRecurringExpense(RULE_ID);

        assertThat(deleted).isTrue();

        ArgumentCaptor<RecurringExpense> saveCaptor = ArgumentCaptor.forClass(RecurringExpense.class);
        verify(recurringExpenseRepository).save(saveCaptor.capture());
        RecurringExpense saved = saveCaptor.getValue();
        assertThat(saved.getIsDeleted()).isTrue();
        assertThat(saved.getDeletedAt()).isNotNull();
        // isActive=false 로 삭제 대체하지 않음
        assertThat(saved.getIsActive()).isTrue();

        List<RecurringExpense> listed = recurringExpenseService.getAllRecurringExpensesForTenant();
        assertThat(listed).isEmpty();
        verify(recurringExpenseRepository).findAllByTenantId(TENANT_ID);
    }

    @Test
    @DisplayName("B) DELETE: 기등록 financial_transactions 삭제/제거를 호출하지 않음")
    void delete_neverTouchesPostedFinancialTransactions() {
        RecurringExpense rule = activeMonthlyRule(RULE_ID);
        when(recurringExpenseRepository.findByTenantIdAndId(TENANT_ID, RULE_ID))
            .thenReturn(Optional.of(rule));
        when(recurringExpenseRepository.save(any(RecurringExpense.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        recurringExpenseService.deleteRecurringExpense(RULE_ID);

        verifyNoInteractions(financialTransactionService);
        verifyNoInteractions(financialTransactionRepository);
    }

    @Test
    @DisplayName("C) toggle: updateRecurringExpense 는 isActive만 변경하고 isDeleted는 건드리지 않음")
    void update_togglesIsActiveWithoutTouchingIsDeleted() {
        RecurringExpense existing = activeMonthlyRule(RULE_ID);
        existing.setIsActive(true);
        existing.setIsDeleted(false);
        when(recurringExpenseRepository.findByTenantIdAndId(TENANT_ID, RULE_ID))
            .thenReturn(Optional.of(existing));
        when(recurringExpenseRepository.save(any(RecurringExpense.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        RecurringExpense patch = activeMonthlyRule(RULE_ID);
        patch.setIsActive(false);

        RecurringExpense result = recurringExpenseService.updateRecurringExpense(RULE_ID, patch);

        assertThat(result.getIsActive()).isFalse();
        assertThat(result.getIsDeleted()).isFalse();
        assertThat(result.getDeletedAt()).isNull();

        ArgumentCaptor<RecurringExpense> saveCaptor = ArgumentCaptor.forClass(RecurringExpense.class);
        verify(recurringExpenseRepository).save(saveCaptor.capture());
        RecurringExpense saved = saveCaptor.getValue();
        assertThat(saved.getIsActive()).isFalse();
        assertThat(saved.getIsDeleted()).isFalse();
        assertThat(saved.getDeletedAt()).isNull();
    }

    private RecurringExpense activeMonthlyRule(Long id) {
        RecurringExpense rule = new RecurringExpense();
        rule.setId(id);
        rule.setExpenseName("월 임대료");
        rule.setExpenseType("RENT");
        rule.setCategory("RENT");
        rule.setAmount(new BigDecimal("1000000"));
        rule.setRecurrenceType("MONTHLY");
        rule.setRecurrenceDay(1);
        rule.setStartDate(LocalDate.of(2026, 1, 1));
        rule.setAutoProcess(true);
        rule.setIsActive(true);
        rule.setIsVatApplicable(true);
        rule.setTotalProcessedCount(0);
        rule.setIsDeleted(false);
        return rule;
    }
}

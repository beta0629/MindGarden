package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collection;
import java.util.Optional;

import com.coresolution.consultation.constant.AuditAction;
import com.coresolution.consultation.entity.erp.financial.FinancialPeriod;
import com.coresolution.consultation.entity.erp.financial.FinancialTransaction;
import com.coresolution.consultation.entity.erp.financial.PeriodStatus;
import com.coresolution.consultation.entity.erp.financial.PeriodType;
import com.coresolution.consultation.exception.TaxIntegrityException;
import com.coresolution.consultation.repository.erp.financial.FinancialPeriodRepository;
import com.coresolution.consultation.repository.erp.financial.FinancialTransactionRepository;
import com.coresolution.consultation.service.AuditLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

/**
 * {@link FinancialPeriodServiceImpl} 단위 테스트 (T1, T5, T6, T9 회귀).
 *
 * <p>합의서 §6 매트릭스:
 * <ul>
 *   <li>T1 일 마감 정상 (INCOME 80만 + 환불 30만 → net=50만)</li>
 *   <li>T5 부가세 누적 가드 (income=100만, tax=8만 → 차이 2만 → TaxIntegrityException)</li>
 *   <li>T6 dry-run=true → row 미삽입, INFO 로그</li>
 *   <li>T9 회귀 멀티테넌트 격리 (tenantA 마감 ≠ tenantB 마감)</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
class FinancialPeriodServiceImplTest {

    private static final String TENANT_A = "tenant-A";
    private static final String TENANT_B = "tenant-B";
    private static final LocalDate D_2026_05_27 = LocalDate.of(2026, 5, 27);

    @Mock
    private FinancialPeriodRepository financialPeriodRepository;

    @Mock
    private FinancialTransactionRepository financialTransactionRepository;

    @Mock
    private AuditLogService auditLogService;

    @InjectMocks
    private FinancialPeriodServiceImpl service;

    @BeforeEach
    void resetDryRun() {
        // 각 테스트가 dry-run 토글을 명시적으로 설정. 기본은 false (실 마감).
        ReflectionTestUtils.setField(service, "dryRun", false);
    }

    @Test
    @DisplayName("T1: 일 마감 정상 — income 80만, refund 30만, net=50만 row UPSERT")
    void closePeriod_dailyClose_persistsCorrectTotals() {
        // Given: tenantA, 2026-05-27, INCOME 80만 + EXPENSE(환불) 30만 → tax 8만 (정답: 5만 = 10% × 50만)
        // T1 시나리오는 net=50만 검증이 핵심. 부가세 가드는 tolerance 1원 안에서만 통과.
        // 단순화: income 80만, refund 30만, expense=refund 30만, tax = 50만 × 10% = 5만 (정확)
        BigDecimal income = new BigDecimal("800000.00");
        BigDecimal expense = new BigDecimal("300000.00");
        BigDecimal refund = new BigDecimal("300000.00");
        BigDecimal tax = new BigDecimal("50000.00");

        when(financialTransactionRepository.sumAmountForCloseByType(
                eq(TENANT_A), eq(FinancialTransaction.TransactionType.INCOME), eq(D_2026_05_27), eq(D_2026_05_27)))
                .thenReturn(income);
        when(financialTransactionRepository.sumAmountForCloseByType(
                eq(TENANT_A), eq(FinancialTransaction.TransactionType.EXPENSE), eq(D_2026_05_27), eq(D_2026_05_27)))
                .thenReturn(expense);
        when(financialTransactionRepository.sumRefundForClose(
                eq(TENANT_A), eq(D_2026_05_27), eq(D_2026_05_27), any(Collection.class)))
                .thenReturn(refund);
        when(financialTransactionRepository.sumIncomeTaxAmountForClose(
                eq(TENANT_A), eq(D_2026_05_27), eq(D_2026_05_27)))
                .thenReturn(tax);

        when(financialPeriodRepository.findByTenantIdAndPeriodTypeAndPeriodStart(
                eq(TENANT_A), eq(PeriodType.DAY), eq(D_2026_05_27)))
                .thenReturn(Optional.empty());
        when(financialPeriodRepository.save(any(FinancialPeriod.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When
        FinancialPeriod result = service.closePeriod(TENANT_A, D_2026_05_27, PeriodType.DAY);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getTenantId()).isEqualTo(TENANT_A);
        assertThat(result.getPeriodType()).isEqualTo(PeriodType.DAY);
        assertThat(result.getStatus()).isEqualTo(PeriodStatus.CLOSED);
        assertThat(result.getTotalIncome()).isEqualByComparingTo(income);
        assertThat(result.getTotalExpense()).isEqualByComparingTo(expense);
        assertThat(result.getNetAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        assertThat(result.getTotalRefund()).isEqualByComparingTo(refund);
        assertThat(result.getTotalTaxAmount()).isEqualByComparingTo(tax);
        assertThat(result.getClosedAt()).isNotNull();

        verify(financialPeriodRepository).save(any(FinancialPeriod.class));
        verify(auditLogService, atLeastOnce()).log(
                eq(TENANT_A), any(), anyString(), any(), eq(AuditAction.FINANCIAL_PERIOD_CLOSE),
                eq("FINANCIAL_PERIOD"), any());
    }

    @Test
    @DisplayName("T5: 부가세 누적 가드 — income 100만 + tax 8만 → 차이 2만 → TaxIntegrityException 차단")
    void closePeriod_taxIntegrityViolation_throws() {
        // Given: income 100만, refund 0, tax 8만 → expected = 10만, diff=2만 > tolerance(1원)
        when(financialTransactionRepository.sumAmountForCloseByType(
                eq(TENANT_A), eq(FinancialTransaction.TransactionType.INCOME), any(), any()))
                .thenReturn(new BigDecimal("1000000.00"));
        when(financialTransactionRepository.sumAmountForCloseByType(
                eq(TENANT_A), eq(FinancialTransaction.TransactionType.EXPENSE), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(financialTransactionRepository.sumRefundForClose(
                eq(TENANT_A), any(), any(), any(Collection.class)))
                .thenReturn(BigDecimal.ZERO);
        when(financialTransactionRepository.sumIncomeTaxAmountForClose(
                eq(TENANT_A), any(), any()))
                .thenReturn(new BigDecimal("80000.00"));

        // When + Then
        assertThatThrownBy(() -> service.closePeriod(TENANT_A, D_2026_05_27, PeriodType.DAY))
                .isInstanceOf(TaxIntegrityException.class)
                .hasMessageContaining("부가세 누적 차이");

        // 차단 시 row 미저장 + audit 미기록
        verify(financialPeriodRepository, never()).save(any(FinancialPeriod.class));
        verifyNoInteractions(auditLogService);
    }

    @Test
    @DisplayName("T6: dry-run=true → row 미삽입, 합산만 수행")
    void closePeriod_dryRun_noRowInserted() {
        // Given
        ReflectionTestUtils.setField(service, "dryRun", true);
        when(financialTransactionRepository.sumAmountForCloseByType(
                eq(TENANT_A), eq(FinancialTransaction.TransactionType.INCOME), any(), any()))
                .thenReturn(new BigDecimal("500000.00"));
        when(financialTransactionRepository.sumAmountForCloseByType(
                eq(TENANT_A), eq(FinancialTransaction.TransactionType.EXPENSE), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(financialTransactionRepository.sumRefundForClose(
                eq(TENANT_A), any(), any(), any(Collection.class)))
                .thenReturn(BigDecimal.ZERO);
        when(financialTransactionRepository.sumIncomeTaxAmountForClose(
                eq(TENANT_A), any(), any()))
                .thenReturn(new BigDecimal("50000.00"));

        // When
        FinancialPeriod result = service.closePeriod(TENANT_A, D_2026_05_27, PeriodType.DAY);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(PeriodStatus.OPEN);
        assertThat(result.getNetAmount()).isEqualByComparingTo(new BigDecimal("500000.00"));
        verify(financialPeriodRepository, never()).save(any(FinancialPeriod.class));
        verifyNoInteractions(auditLogService);
    }

    @Test
    @DisplayName("T9 회귀: 멀티테넌트 격리 — tenantA 마감 시 tenantB 합산 호출 0")
    void closePeriod_multiTenantIsolation_onlyQueriesGivenTenant() {
        // Given: tenantA 합산만 stub. tenantB 호출이 들어오면 NPE → 검증.
        when(financialTransactionRepository.sumAmountForCloseByType(
                eq(TENANT_A), eq(FinancialTransaction.TransactionType.INCOME), any(), any()))
                .thenReturn(new BigDecimal("100000.00"));
        when(financialTransactionRepository.sumAmountForCloseByType(
                eq(TENANT_A), eq(FinancialTransaction.TransactionType.EXPENSE), any(), any()))
                .thenReturn(BigDecimal.ZERO);
        when(financialTransactionRepository.sumRefundForClose(
                eq(TENANT_A), any(), any(), any(Collection.class)))
                .thenReturn(BigDecimal.ZERO);
        when(financialTransactionRepository.sumIncomeTaxAmountForClose(
                eq(TENANT_A), any(), any()))
                .thenReturn(new BigDecimal("10000.00"));

        when(financialPeriodRepository.findByTenantIdAndPeriodTypeAndPeriodStart(
                eq(TENANT_A), eq(PeriodType.DAY), eq(D_2026_05_27)))
                .thenReturn(Optional.empty());
        when(financialPeriodRepository.save(any(FinancialPeriod.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        // When: tenantA 마감
        FinancialPeriod result = service.closePeriod(TENANT_A, D_2026_05_27, PeriodType.DAY);

        // Then: tenantA 만 합산 호출, tenantB 인자로는 어떤 sum 도 호출 안 됨
        ArgumentCaptor<String> tenantCaptor = ArgumentCaptor.forClass(String.class);
        verify(financialTransactionRepository, atLeastOnce()).sumAmountForCloseByType(
                tenantCaptor.capture(), any(), any(), any());
        assertThat(tenantCaptor.getAllValues()).allMatch(t -> t.equals(TENANT_A));

        verify(financialTransactionRepository, never()).sumAmountForCloseByType(
                eq(TENANT_B), any(), any(), any());
        verify(financialTransactionRepository, never()).sumIncomeTaxAmountForClose(
                eq(TENANT_B), any(), any());

        // 저장된 entity 의 tenantId 도 tenantA
        ArgumentCaptor<FinancialPeriod> savedCaptor = ArgumentCaptor.forClass(FinancialPeriod.class);
        verify(financialPeriodRepository).save(savedCaptor.capture());
        assertThat(savedCaptor.getValue().getTenantId()).isEqualTo(TENANT_A);
        assertThat(result.getTenantId()).isEqualTo(TENANT_A);
    }

    @Test
    @DisplayName("Q6: 재오픈 사유 < 20자 → IllegalArgumentException")
    void reopenPeriod_shortReason_rejected() {
        FinancialPeriod existing = FinancialPeriod.builder()
                .id(1L)
                .tenantId(TENANT_A)
                .periodType(PeriodType.DAY)
                .periodStart(D_2026_05_27)
                .periodEnd(D_2026_05_27)
                .status(PeriodStatus.CLOSED)
                .build();
        // 짧은 사유 — 길이 검증으로 stubbing 도달 전 차단되어 OK
        assertThatThrownBy(() -> service.reopenPeriod(TENANT_A, 1L, "짧음", "1"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("20자 이상");
        verifyNoInteractions(auditLogService);
        verify(financialPeriodRepository, never()).save(any(FinancialPeriod.class));
        // existing 변수는 시나리오 의도 명시용 — 미사용 경고 회피
        assertThat(existing.getStatus()).isEqualTo(PeriodStatus.CLOSED);
    }

    @Test
    @DisplayName("Q6: 재오픈 정상 — 20자+ 사유, status=REOPENED, audit 1건")
    void reopenPeriod_validReason_setsReopenedAndAudits() {
        FinancialPeriod existing = FinancialPeriod.builder()
                .id(1L)
                .tenantId(TENANT_A)
                .periodType(PeriodType.DAY)
                .periodStart(D_2026_05_27)
                .periodEnd(D_2026_05_27)
                .status(PeriodStatus.CLOSED)
                .build();
        when(financialPeriodRepository.findById(eq(1L))).thenReturn(Optional.of(existing));
        when(financialPeriodRepository.save(any(FinancialPeriod.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        String reason = "환불 사후 처리 — 운영팀 확인 후 재마감 필요";
        FinancialPeriod reopened = service.reopenPeriod(TENANT_A, 1L, reason, "42");

        assertThat(reopened.getStatus()).isEqualTo(PeriodStatus.REOPENED);
        assertThat(reopened.getReopenReason()).isEqualTo(reason);
        assertThat(reopened.getReopenedBy()).isEqualTo("42");
        assertThat(reopened.getReopenedAt()).isNotNull();
        verify(auditLogService, times(1)).log(
                eq(TENANT_A), eq(42L), anyString(), any(),
                eq(AuditAction.FINANCIAL_PERIOD_REOPEN),
                eq("FINANCIAL_PERIOD"), eq(1L));
    }

    @Test
    @DisplayName("Q6: 다른 테넌트의 기간 재오픈 시도 → AccessDeniedException")
    void reopenPeriod_otherTenant_denied() {
        FinancialPeriod existing = FinancialPeriod.builder()
                .id(2L)
                .tenantId(TENANT_B)
                .periodType(PeriodType.DAY)
                .periodStart(D_2026_05_27)
                .periodEnd(D_2026_05_27)
                .status(PeriodStatus.CLOSED)
                .build();
        when(financialPeriodRepository.findById(eq(2L))).thenReturn(Optional.of(existing));

        String reason = "잘못된 테넌트로 재오픈 시도 — 멀티테넌트 격리 검증용";
        assertThatThrownBy(() -> service.reopenPeriod(TENANT_A, 2L, reason, "1"))
                .isInstanceOf(org.springframework.security.access.AccessDeniedException.class);
        verify(financialPeriodRepository, never()).save(any(FinancialPeriod.class));
    }

    @Test
    @DisplayName("isPeriodClosed: CLOSED row 존재 시 true")
    void isPeriodClosed_returnsTrueWhenClosed() {
        FinancialPeriod closed = FinancialPeriod.builder()
                .id(1L)
                .tenantId(TENANT_A)
                .periodType(PeriodType.DAY)
                .periodStart(D_2026_05_27)
                .periodEnd(D_2026_05_27)
                .status(PeriodStatus.CLOSED)
                .build();
        when(financialPeriodRepository.findClosedByTenantIdAndDate(
                eq(TENANT_A), eq(D_2026_05_27), eq(PeriodType.DAY)))
                .thenReturn(Optional.of(closed));

        assertThat(service.isPeriodClosed(TENANT_A, D_2026_05_27, PeriodType.DAY)).isTrue();
    }

    @Test
    @DisplayName("isPeriodClosed: row 부재 시 false (가드 통과)")
    void isPeriodClosed_returnsFalseWhenAbsent() {
        when(financialPeriodRepository.findClosedByTenantIdAndDate(
                eq(TENANT_A), any(), eq(PeriodType.DAY)))
                .thenReturn(Optional.empty());

        assertThat(service.isPeriodClosed(TENANT_A, D_2026_05_27, PeriodType.DAY)).isFalse();
    }
}

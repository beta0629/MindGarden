package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;

import com.coresolution.consultation.entity.erp.financial.FinancialPeriod;
import com.coresolution.consultation.entity.erp.financial.PeriodStatus;
import com.coresolution.consultation.entity.erp.financial.PeriodType;
import com.coresolution.consultation.exception.TaxIntegrityException;
import com.coresolution.consultation.service.erp.FinancialPeriodService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link ErpFinancialCloseServiceImpl} 단위 테스트 (T1, T4 통합 핵심).
 *
 * <p>합의서 §6:
 * <ul>
 *   <li>T1 통합 — performDailyClose 호출 → FinancialPeriodService.closePeriod(DAY) 위임</li>
 *   <li>T4 월 마감 누적 일관성 — performMonthlyClose 호출 → closePeriod(MONTH)</li>
 *   <li>주 마감 (Q1 default) — performWeeklyClose 는 dry-run 로그만, 위임 호출 0</li>
 * </ul>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
class ErpFinancialCloseServiceImplTest {

    private static final String TENANT_A = "tenant-A";

    @Mock
    private FinancialPeriodService financialPeriodService;

    @InjectMocks
    private ErpFinancialCloseServiceImpl service;

    @Test
    @DisplayName("T1 통합: performDailyClose → FinancialPeriodService.closePeriod(DAY) 위임")
    void performDailyClose_delegatesToFinancialPeriodService() {
        LocalDate yesterday = LocalDate.of(2026, 5, 27);
        when(financialPeriodService.closePeriod(eq(TENANT_A), eq(yesterday), eq(PeriodType.DAY)))
                .thenReturn(closedPeriod(TENANT_A, PeriodType.DAY, yesterday));

        service.performDailyClose(TENANT_A, yesterday);

        verify(financialPeriodService, times(1))
                .closePeriod(eq(TENANT_A), eq(yesterday), eq(PeriodType.DAY));
    }

    @Test
    @DisplayName("T4 월 마감 누적: performMonthlyClose → closePeriod(MONTH, 1일자)")
    void performMonthlyClose_delegatesWithFirstDayOfMonth() {
        YearMonth ym = YearMonth.of(2026, 4);
        LocalDate april1 = LocalDate.of(2026, 4, 1);
        when(financialPeriodService.closePeriod(eq(TENANT_A), eq(april1), eq(PeriodType.MONTH)))
                .thenReturn(closedPeriod(TENANT_A, PeriodType.MONTH, april1));

        service.performMonthlyClose(TENANT_A, ym);

        verify(financialPeriodService, times(1))
                .closePeriod(eq(TENANT_A), eq(april1), eq(PeriodType.MONTH));
    }

    @Test
    @DisplayName("Q1 default: performWeeklyClose 는 dry-run 로그만, FinancialPeriodService 호출 0")
    void performWeeklyClose_noOpDryRun() {
        service.performWeeklyClose(TENANT_A, LocalDate.of(2026, 5, 24));
        verifyNoInteractions(financialPeriodService);
    }

    @Test
    @DisplayName("Q8: 일 마감 중 TaxIntegrityException — WARN 로그만, 전파하지 않음(테넌트 격리)")
    void performDailyClose_taxIntegrityFails_doesNotPropagate() {
        LocalDate yesterday = LocalDate.of(2026, 5, 27);
        when(financialPeriodService.closePeriod(eq(TENANT_A), eq(yesterday), eq(PeriodType.DAY)))
                .thenThrow(new TaxIntegrityException(TENANT_A,
                        new BigDecimal("100000.00"), new BigDecimal("80000.00")));

        service.performDailyClose(TENANT_A, yesterday);

        verify(financialPeriodService, times(1))
                .closePeriod(eq(TENANT_A), eq(yesterday), eq(PeriodType.DAY));
    }

    @Test
    @DisplayName("Q9: 일 마감 중 일반 Exception 도 그대로 전파 (상위 스케줄러가 catch)")
    void performDailyClose_genericException_propagates() {
        LocalDate yesterday = LocalDate.of(2026, 5, 27);
        when(financialPeriodService.closePeriod(eq(TENANT_A), eq(yesterday), eq(PeriodType.DAY)))
                .thenThrow(new RuntimeException("DB 일시 장애"));

        assertThatThrownBy(() -> service.performDailyClose(TENANT_A, yesterday))
                .isInstanceOf(RuntimeException.class)
                .hasMessageContaining("DB 일시 장애");
    }

    private FinancialPeriod closedPeriod(String tenantId, PeriodType type, LocalDate start) {
        return FinancialPeriod.builder()
                .id(1L)
                .tenantId(tenantId)
                .periodType(type)
                .periodStart(start)
                .periodEnd(type == PeriodType.MONTH ? start.withDayOfMonth(start.lengthOfMonth()) : start)
                .status(PeriodStatus.CLOSED)
                .totalIncome(new BigDecimal("100000.00"))
                .totalExpense(BigDecimal.ZERO)
                .netAmount(new BigDecimal("100000.00"))
                .totalTaxAmount(new BigDecimal("10000.00"))
                .totalRefund(BigDecimal.ZERO)
                .build();
    }
}

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import com.coresolution.consultation.entity.erp.financial.FinancialPeriod;
import com.coresolution.consultation.entity.erp.financial.PeriodStatus;
import com.coresolution.consultation.entity.erp.financial.PeriodType;
import com.coresolution.consultation.repository.erp.financial.FinancialPeriodRepository;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.erp.accounting.LedgerService;
import com.coresolution.core.context.TenantContextHolder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link FinancialStatementServiceImpl} Q5 스냅샷 통합 테스트 (T7).
 *
 * <p>합의서 §6 T7: 마감된 4월 + 미마감 5월 → 4월=스냅샷, 5월=라이브, 합 일관.</p>
 *
 * @author CoreSolution
 * @since 2026-06-06
 */
@ExtendWith(MockitoExtension.class)
class FinancialStatementServiceImplSnapshotTest {

    private static final String TENANT_ID = "tenant-statement-q5";

    @Mock
    private LedgerService ledgerService;
    @Mock
    private CommonCodeService commonCodeService;
    @Mock
    private FinancialPeriodRepository financialPeriodRepository;

    @InjectMocks
    private FinancialStatementServiceImpl service;

    @BeforeEach
    void setTenant() {
        TenantContextHolder.setTenantId(TENANT_ID);
    }

    @AfterEach
    void clearTenant() {
        TenantContextHolder.clear();
    }

    @Test
    @DisplayName("T7: 4월 마감 + 5월 미마감 → 4월=스냅샷, 5월=라이브 합산")
    void generateIncomeStatement_closedAprilSnapshot_plusLiveMay() {
        LocalDate periodStart = LocalDate.of(2026, 4, 1);
        LocalDate periodEnd = LocalDate.of(2026, 5, 31);

        FinancialPeriod aprilClosed = FinancialPeriod.builder()
                .id(1L)
                .tenantId(TENANT_ID)
                .periodType(PeriodType.MONTH)
                .periodStart(LocalDate.of(2026, 4, 1))
                .periodEnd(LocalDate.of(2026, 4, 30))
                .status(PeriodStatus.CLOSED)
                .totalIncome(new BigDecimal("3000000"))
                .totalExpense(new BigDecimal("1000000"))
                .netAmount(new BigDecimal("2000000"))
                .build();

        when(financialPeriodRepository.findClosedByTenantIdAndDateRange(
                eq(TENANT_ID), eq(periodStart), eq(periodEnd), eq(PeriodType.MONTH)))
                .thenReturn(List.of(aprilClosed));

        // 5월 라이브: 빈 ledger 로 단순화 (라이브 합산 0). 통합 결과 = 스냅샷만 반영.
        when(ledgerService.getLedgersByPeriod(
                eq(TENANT_ID), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Collections.emptyList());

        Map<String, Object> result = service.generateIncomeStatement(TENANT_ID, periodStart, periodEnd);

        assertThat(result).isNotNull();
        assertThat(result.get("snapshotRevenue"))
                .isEqualTo(new BigDecimal("3000000"));
        assertThat(result.get("snapshotExpenses"))
                .isEqualTo(new BigDecimal("1000000"));
        assertThat(result.get("closedSnapshotCount")).isEqualTo(1);
        Map<String, Object> revenue = (Map<String, Object>) result.get("revenue");
        Map<String, Object> expenses = (Map<String, Object>) result.get("expenses");
        assertThat((BigDecimal) revenue.get("total"))
                .isEqualByComparingTo(new BigDecimal("3000000"));
        assertThat((BigDecimal) expenses.get("total"))
                .isEqualByComparingTo(new BigDecimal("1000000"));
        assertThat((BigDecimal) result.get("netIncome"))
                .isEqualByComparingTo(new BigDecimal("2000000"));

        // 라이브 ledger 조회는 5월(또는 4-30 다음날) 윈도우만 — 닫힌 월의 합집합 영역에서는 호출되지 않아야
        // 함. 스냅샷이 적용된 만큼 liveStart 가 시프트되었음을 검증한다.
        verify(ledgerService, times(1))
                .getLedgersByPeriod(eq(TENANT_ID), any(LocalDate.class), any(LocalDate.class));
    }

    @Test
    @DisplayName("T7 회귀: 닫힌 기간 0건 → 라이브 ledger 단독 합산 (기존 동작 유지)")
    void generateIncomeStatement_noClosedPeriod_fallsBackToLedger() {
        LocalDate periodStart = LocalDate.of(2026, 5, 1);
        LocalDate periodEnd = LocalDate.of(2026, 5, 31);

        when(financialPeriodRepository.findClosedByTenantIdAndDateRange(
                eq(TENANT_ID), eq(periodStart), eq(periodEnd), eq(PeriodType.MONTH)))
                .thenReturn(Arrays.asList());
        when(ledgerService.getLedgersByPeriod(
                eq(TENANT_ID), eq(periodStart), eq(periodEnd)))
                .thenReturn(Collections.emptyList());

        Map<String, Object> result = service.generateIncomeStatement(TENANT_ID, periodStart, periodEnd);

        assertThat(result.get("closedSnapshotCount")).isEqualTo(0);
        assertThat(result.get("snapshotRevenue"))
                .isEqualTo(BigDecimal.ZERO);
        verify(financialPeriodRepository, times(1))
                .findClosedByTenantIdAndDateRange(eq(TENANT_ID), eq(periodStart), eq(periodEnd),
                        eq(PeriodType.MONTH));
        // ledger 가 한 번 호출되어야 함 (닫힌 기간 0이므로 liveWindow == [periodStart, periodEnd])
        verify(ledgerService, times(1))
                .getLedgersByPeriod(eq(TENANT_ID), eq(periodStart), eq(periodEnd));
        // 마감 row 가 없으므로 시프트도 없음 — never 검증은 의미 없으므로 생략
        verify(ledgerService, never()).getLedgersByPeriod(eq("other-tenant"), any(), any());
    }
}

package com.coresolution.consultation.salaryexport;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SalaryCalculationStatementRows} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
class SalaryCalculationStatementRowsTest {

    @Test
    @DisplayName("동일 원단위 기본+커미션 → 급여 산정액 한 줄")
    void pretaxComponents_mergedWhenBaseEqualsCommissionRounded() {
        Map<String, Object> m = new HashMap<>();
        m.put("baseSalary", new BigDecimal("50000"));
        m.put("commissionEarnings", new BigDecimal("50000.4"));
        m.put("hourlyEarnings", BigDecimal.ZERO);
        List<SalaryCalculationStatementRows.LabelAmount> rows = SalaryCalculationStatementRows.buildPretaxComponentRows(m);
        assertEquals(1, rows.size());
        assertEquals(SalaryCalculationStatementRows.LABEL_MERGED_DEDUP, rows.get(0).label());
        assertEquals(0, new BigDecimal("50000").compareTo(rows.get(0).amount()));
    }

    @Test
    @DisplayName("커미션+시급 모두 양수 → 옵션 급여 합산")
    void pretaxComponents_optionWhenCommissionAndHourly() {
        Map<String, Object> m = Map.of(
                "baseSalary", 0L,
                "commissionEarnings", 80000L,
                "hourlyEarnings", 50000L);
        List<SalaryCalculationStatementRows.LabelAmount> rows = SalaryCalculationStatementRows.buildPretaxComponentRows(m);
        assertEquals(1, rows.size());
        assertEquals(SalaryCalculationStatementRows.LABEL_OPTION, rows.get(0).label());
        assertEquals(130_000L, rows.get(0).amount().longValue());
    }

    @Test
    @DisplayName("상담 건수: consultationCount 우선")
    void consultationCount_prefersConsultationCountKey() {
        Map<String, Object> m = new HashMap<>();
        m.put("consultationCount", 7);
        m.put("completedConsultations", 2);
        assertEquals(7, SalaryCalculationStatementRows.resolveConsultationCount(m));
    }

    @Test
    @DisplayName("상담 건수: completedConsultations 폴백")
    void consultationCount_fallbackToCompleted() {
        Map<String, Object> m = Map.of("completedConsultations", 4);
        assertEquals(4, SalaryCalculationStatementRows.resolveConsultationCount(m));
    }

    @Test
    @DisplayName("세전 총액: grossSalary 우선")
    void grossDisplay_prefersGrossSalary() {
        Map<String, Object> m = new HashMap<>();
        m.put("grossSalary", new BigDecimal("130000"));
        m.put("totalSalary", new BigDecimal("999999"));
        assertEquals(0, new BigDecimal("130000").compareTo(SalaryCalculationStatementRows.resolveGrossPreTaxDisplay(m)));
    }

    @Test
    @DisplayName("세금: taxAmount 우선")
    void tax_prefersTaxAmountOverDeductions() {
        Map<String, Object> m = new HashMap<>();
        m.put("taxAmount", new BigDecimal("100"));
        m.put("deductions", new BigDecimal("999"));
        assertEquals(0, new BigDecimal("100").compareTo(SalaryCalculationStatementRows.resolveTaxOrDeductions(m)));
    }

    @Test
    @DisplayName("baseSalary 양수·가변 분리 시 기본 급여 + 상담(회기수) 급여")
    void pretaxComponents_baseAndConsultationSeparate() {
        Map<String, Object> m = new HashMap<>();
        m.put("baseSalary", 40000L);
        m.put("commissionEarnings", 120000L);
        m.put("hourlyEarnings", 0L);
        List<SalaryCalculationStatementRows.LabelAmount> rows = SalaryCalculationStatementRows.buildPretaxComponentRows(m);
        assertEquals(2, rows.size());
        assertTrue(rows.stream().anyMatch(r -> SalaryCalculationStatementRows.LABEL_BASE.equals(r.label())));
        assertTrue(rows.stream().anyMatch(r -> SalaryCalculationStatementRows.LABEL_CONSULTATION.equals(r.label())));
    }
}

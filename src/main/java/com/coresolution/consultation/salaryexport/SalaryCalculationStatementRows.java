package com.coresolution.consultation.salaryexport;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import com.coresolution.consultation.entity.SalaryCalculation;

/**
 * 급여 계산서·이메일·PDF에서 동일하게 쓰는 세전 구성 행·요약 금액 규칙.
 * 프론트 {@code buildSalaryCalculationComponentRows} 및 {@code salaryConstants.js} 라벨과 동일.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
public final class SalaryCalculationStatementRows {

    /** {@code salaryConstants.SALARY_CALC_DETAIL_BASE_LABEL} */
    public static final String LABEL_BASE = "기본 급여";

    /** {@code salaryConstants.SALARY_CALC_DETAIL_OPTION_LABEL} */
    public static final String LABEL_OPTION = "옵션 급여";

    /** {@code salaryConstants.SALARY_CALC_DETAIL_CONSULTATION_LABEL} */
    public static final String LABEL_CONSULTATION = "상담(건당) 급여";

    /** {@code salaryConstants.SALARY_CALC_DETAIL_HOURLY_LABEL} */
    public static final String LABEL_HOURLY = "시간당 급여";

    /** {@code salaryConstants.SALARY_CALC_DETAIL_MERGED_DEDUP_LABEL} */
    public static final String LABEL_MERGED_DEDUP = "급여 산정액";

    /** {@code salaryConstants.SALARY_PREVIEW_SPECIAL_SUPPORT_LABEL} */
    public static final String LABEL_SPECIAL_SUPPORT = "특별지원금";

    /** {@code salaryConstants.SALARY_CALC_DETAIL_TAX_DEDUCTIONS_LABEL} */
    public static final String LABEL_TAX_DEDUCTIONS = "세금·공제";

    public static final String LABEL_GROSS_PRETAX = "총 급여 (세전)";

    public static final String LABEL_NET = "실지급액 (세후)";

    public static final String LABEL_CONSULTATION_COUNT = "상담 건수";

    /**
     * 세전 구성 행(기본·가변·중복 병합).
     *
     * @param salaryData {@code baseSalary}, {@code commissionEarnings}, {@code hourlyEarnings} 등
     * @return 라벨·금액 목록
     */
    public static List<LabelAmount> buildPretaxComponentRows(Map<String, Object> salaryData) {
        BigDecimal base = toBigDecimal(salaryData.get("baseSalary"));
        BigDecimal comm = toBigDecimal(salaryData.get("commissionEarnings"));
        BigDecimal hourly = toBigDecimal(salaryData.get("hourlyEarnings"));
        if (base.compareTo(BigDecimal.ZERO) > 0 && comm.compareTo(BigDecimal.ZERO) > 0
                && base.setScale(0, RoundingMode.HALF_UP).compareTo(comm.setScale(0, RoundingMode.HALF_UP)) == 0) {
            return List.of(new LabelAmount(LABEL_MERGED_DEDUP, base));
        }
        List<LabelAmount> rows = new ArrayList<>();
        if (base.compareTo(BigDecimal.ZERO) > 0) {
            rows.add(new LabelAmount(LABEL_BASE, base));
        }
        if (comm.compareTo(BigDecimal.ZERO) > 0 && hourly.compareTo(BigDecimal.ZERO) > 0) {
            rows.add(new LabelAmount(LABEL_OPTION, comm.add(hourly)));
        } else if (comm.compareTo(BigDecimal.ZERO) > 0) {
            rows.add(new LabelAmount(LABEL_CONSULTATION, comm));
        } else if (hourly.compareTo(BigDecimal.ZERO) > 0) {
            rows.add(new LabelAmount(LABEL_HOURLY, hourly));
        }
        return rows;
    }

    /**
     * {@link SalaryCalculation} 엔티티로 세전 구성 행 생성.
     *
     * @param calc 급여 계산
     * @return 라벨·금액 목록
     */
    public static List<LabelAmount> buildPretaxComponentRows(SalaryCalculation calc) {
        Objects.requireNonNull(calc, "calc");
        BigDecimal base = nz(calc.getBaseSalary());
        BigDecimal comm = nz(calc.getCommissionEarnings());
        BigDecimal hourly = nz(calc.getHourlyEarnings());
        if (base.compareTo(BigDecimal.ZERO) > 0 && comm.compareTo(BigDecimal.ZERO) > 0
                && base.setScale(0, RoundingMode.HALF_UP).compareTo(comm.setScale(0, RoundingMode.HALF_UP)) == 0) {
            return List.of(new LabelAmount(LABEL_MERGED_DEDUP, base));
        }
        List<LabelAmount> rows = new ArrayList<>();
        if (base.compareTo(BigDecimal.ZERO) > 0) {
            rows.add(new LabelAmount(LABEL_BASE, base));
        }
        if (comm.compareTo(BigDecimal.ZERO) > 0 && hourly.compareTo(BigDecimal.ZERO) > 0) {
            rows.add(new LabelAmount(LABEL_OPTION, comm.add(hourly)));
        } else if (comm.compareTo(BigDecimal.ZERO) > 0) {
            rows.add(new LabelAmount(LABEL_CONSULTATION, comm));
        } else if (hourly.compareTo(BigDecimal.ZERO) > 0) {
            rows.add(new LabelAmount(LABEL_HOURLY, hourly));
        }
        return rows;
    }

    /**
     * 총 급여(세전) 표시값: {@code grossSalary}가 있으면 사용, 없으면 {@code totalSalary}.
     *
     * @param salaryData 데이터 맵
     * @return 금액
     */
    public static BigDecimal resolveGrossPreTaxDisplay(Map<String, Object> salaryData) {
        if (salaryData != null && salaryData.containsKey("grossSalary") && salaryData.get("grossSalary") != null) {
            return toBigDecimal(salaryData.get("grossSalary"));
        }
        return toBigDecimal(salaryData != null ? salaryData.get("totalSalary") : null);
    }

    /**
     * 엔티티 기준 총 급여(세전) 표시값.
     *
     * @param calc 급여 계산
     * @return 금액
     */
    public static BigDecimal resolveGrossPreTaxDisplay(SalaryCalculation calc) {
        if (calc.getGrossSalary() != null) {
            return calc.getGrossSalary();
        }
        return nz(calc.getTotalSalary());
    }

    /**
     * 세금·공제 표시: {@code taxAmount} 우선, 없으면 {@code deductions}.
     *
     * @param salaryData 데이터 맵
     * @return 금액(0 이상)
     */
    public static BigDecimal resolveTaxOrDeductions(Map<String, Object> salaryData) {
        if (salaryData == null) {
            return BigDecimal.ZERO;
        }
        if (salaryData.containsKey("taxAmount") && salaryData.get("taxAmount") != null) {
            return toBigDecimal(salaryData.get("taxAmount")).max(BigDecimal.ZERO);
        }
        if (salaryData.containsKey("deductions") && salaryData.get("deductions") != null) {
            return toBigDecimal(salaryData.get("deductions")).max(BigDecimal.ZERO);
        }
        return BigDecimal.ZERO;
    }

    /**
     * 실지급액(세후): {@code netSalary}가 있으면 사용, 없으면 {@code totalSalary - tax}.
     *
     * @param salaryData 데이터 맵
     * @return 금액
     */
    public static BigDecimal resolveNetSalaryDisplay(Map<String, Object> salaryData) {
        if (salaryData == null) {
            return BigDecimal.ZERO;
        }
        if (salaryData.containsKey("netSalary") && salaryData.get("netSalary") != null) {
            return toBigDecimal(salaryData.get("netSalary"));
        }
        BigDecimal total = toBigDecimal(salaryData.get("totalSalary"));
        BigDecimal tax = resolveTaxOrDeductions(salaryData);
        return total.subtract(tax);
    }

    /**
     * 상담 건수: {@code consultationCount} 우선, 없으면 {@code completedConsultations}.
     *
     * @param salaryData 데이터 맵
     * @return 건수
     */
    public static int resolveConsultationCount(Map<String, Object> salaryData) {
        if (salaryData == null) {
            return 0;
        }
        Object c = salaryData.get("consultationCount");
        if (c == null) {
            c = salaryData.get("completedConsultations");
        }
        if (c == null) {
            return 0;
        }
        if (c instanceof Number n) {
            return n.intValue();
        }
        try {
            return Integer.parseInt(c.toString().trim());
        } catch (NumberFormatException e) {
            return 0;
        }
    }

    /**
     * 특별지원금.
     *
     * @param salaryData 데이터 맵
     * @return 금액
     */
    public static BigDecimal resolveBonusEarnings(Map<String, Object> salaryData) {
        if (salaryData == null || !salaryData.containsKey("bonusEarnings") || salaryData.get("bonusEarnings") == null) {
            return BigDecimal.ZERO;
        }
        return toBigDecimal(salaryData.get("bonusEarnings")).max(BigDecimal.ZERO);
    }

    public static BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number n) {
            return BigDecimal.valueOf(n.doubleValue());
        }
        String s = value.toString().trim();
        if (s.isEmpty()) {
            return BigDecimal.ZERO;
        }
        try {
            return new BigDecimal(s);
        } catch (NumberFormatException e) {
            return BigDecimal.ZERO;
        }
    }

    private static BigDecimal nz(BigDecimal v) {
        return v != null ? v : BigDecimal.ZERO;
    }

    /**
     * 라벨·금액 한 줄.
     *
     * @param label 표시 라벨
     * @param amount 금액
     */
    public record LabelAmount(String label, BigDecimal amount) {
    }
}

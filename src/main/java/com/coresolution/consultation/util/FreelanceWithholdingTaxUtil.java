package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 프리랜서(사업소득) 원천징수 계산.
 * <p>
 * 국세({@link #NATIONAL_RATE})와 지방세({@link #LOCAL_RATE})를 각각 FLOOR 후 합산한다.
 * 결합 요율 3.3% 단일 곱셈은 사용하지 않는다. SP({@code FREELANCE_WITHHOLDING_TAX}
 * common_codes)와 동일 공식: {@code FLOOR(g×n)+FLOOR(g×l)}.
 * </p>
 * <p>
 * 부가세(VAT) 계산과 별도이며, 저장 시 {@link com.coresolution.consultation.entity.erp.financial.FinancialTransaction#getWithholdingTaxAmount()}에
 * 원천징수 예정액(국세+지방세 합)을 기록합니다({@code taxAmount}는 VAT 전용).
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
public final class FreelanceWithholdingTaxUtil {

    /** 사업소득 원천징수 국세율 3% */
    public static final BigDecimal NATIONAL_RATE = new BigDecimal("0.03");

    /** 사업소득 원천징수 지방세율 0.3% (국세와 별도; REGULAR 지방소득세 10%와 구분) */
    public static final BigDecimal LOCAL_RATE = new BigDecimal("0.003");

    /** salary_tax_calculations.tax_type — 국세 원천징수 */
    public static final String TAX_TYPE_NATIONAL = "WITHHOLDING_TAX";

    /** salary_tax_calculations.tax_type — 지방세 원천징수 (REGULAR {@code LOCAL_INCOME_TAX}와 구분) */
    public static final String TAX_TYPE_LOCAL = "LOCAL_WITHHOLDING_TAX";

    /** 급여 프로필 {@code salaryType} 값 — 프리랜서 */
    public static final String CONSULTANT_SALARY_TYPE_FREELANCE = "FREELANCE";

    private FreelanceWithholdingTaxUtil() {
    }

    /**
     * 국세 원천징수 예정액 — {@code FLOOR(gross × 국세율)}.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateNationalWithholdingTaxAmount(long grossAmountKrw) {
        return calculateNationalWithholdingTaxAmount(BigDecimal.valueOf(grossAmountKrw));
    }

    /**
     * 국세 원천징수 예정액 — {@code FLOOR(gross × 국세율)}.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateNationalWithholdingTaxAmount(BigDecimal grossAmountKrw) {
        return floorRate(grossAmountKrw, NATIONAL_RATE);
    }

    /**
     * 지방세 원천징수 예정액 — {@code FLOOR(gross × 지방세율)}.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateLocalWithholdingTaxAmount(long grossAmountKrw) {
        return calculateLocalWithholdingTaxAmount(BigDecimal.valueOf(grossAmountKrw));
    }

    /**
     * 지방세 원천징수 예정액 — {@code FLOOR(gross × 지방세율)}.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateLocalWithholdingTaxAmount(BigDecimal grossAmountKrw) {
        return floorRate(grossAmountKrw, LOCAL_RATE);
    }

    /**
     * 원 단위 지급(총액)에 대한 원천징수 예정액 합계 —
     * {@code FLOOR(g×국세율)+FLOOR(g×지방세율)}.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateWithholdingTaxAmount(long grossAmountKrw) {
        return calculateWithholdingTaxAmount(BigDecimal.valueOf(grossAmountKrw));
    }

    /**
     * 원 단위 지급(총액)에 대한 원천징수 예정액 합계 —
     * {@code FLOOR(g×국세율)+FLOOR(g×지방세율)}.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateWithholdingTaxAmount(BigDecimal grossAmountKrw) {
        if (grossAmountKrw == null || grossAmountKrw.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return calculateNationalWithholdingTaxAmount(grossAmountKrw)
                .add(calculateLocalWithholdingTaxAmount(grossAmountKrw));
    }

    private static BigDecimal floorRate(BigDecimal grossAmountKrw, BigDecimal rate) {
        if (grossAmountKrw == null || grossAmountKrw.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return grossAmountKrw.multiply(rate).setScale(0, RoundingMode.FLOOR);
    }
}

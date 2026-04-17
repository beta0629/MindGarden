package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * 프리랜서(사업소득) 원천징수 3.3% 계산.
 * <p>
 * 부가세(VAT) 계산과 별도이며, 저장 시 {@link com.coresolution.consultation.entity.erp.financial.FinancialTransaction#getWithholdingTaxAmount()}에
 * 원천징수 예정액을 기록합니다({@code taxAmount}는 VAT 전용).
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
public final class FreelanceWithholdingTaxUtil {

    /** 사업소득 원천징수율 (3.3%) */
    public static final BigDecimal FREELANCE_WITHHOLDING_RATE = new BigDecimal("0.033");

    /** 급여 프로필 {@code salaryType} 값 — 프리랜서 */
    public static final String CONSULTANT_SALARY_TYPE_FREELANCE = "FREELANCE";

    private FreelanceWithholdingTaxUtil() {
    }

    /**
     * 원 단위 지급(총액)에 대한 원천징수 예정액 — 원 미만 절사.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateWithholdingTaxAmount(long grossAmountKrw) {
        return calculateWithholdingTaxAmount(BigDecimal.valueOf(grossAmountKrw));
    }

    /**
     * 원 단위 지급(총액)에 대한 원천징수 예정액 — 원 미만 절사.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateWithholdingTaxAmount(BigDecimal grossAmountKrw) {
        if (grossAmountKrw == null || grossAmountKrw.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return grossAmountKrw.multiply(FREELANCE_WITHHOLDING_RATE).setScale(0, RoundingMode.FLOOR);
    }
}

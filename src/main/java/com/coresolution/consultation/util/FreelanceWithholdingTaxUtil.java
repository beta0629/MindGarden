package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.math.RoundingMode;

import com.coresolution.consultation.constant.salary.SalaryTaxRates;

/**
 * 프리랜서(사업소득) 원천징수 계산.
 * <p>
 * 국세({@link SalaryTaxRates#WITHHOLDING_NATIONAL_RATE})와 지방세(
 * {@link SalaryTaxRates#WITHHOLDING_LOCAL_RATE})를 각각 적용한 뒤 합산한다.
 * 합산 효과는 3.3%와 동일하나 제품 경로에 0.033 리터럴을 두지 않는다.
 * DB SSOT: {@code common_codes} 그룹 {@code SALARY_TAX_RATE}.
 * </p>
 * <p>
 * 부가세(VAT) 계산과 별도이며, 저장 시
 * {@link com.coresolution.consultation.entity.erp.financial.FinancialTransaction#getWithholdingTaxAmount()}에
 * 원천징수 예정액을 기록합니다({@code taxAmount}는 VAT 전용).
 * </p>
 *
 * @author CoreSolution
 * @since 2026-04-15
 */
public final class FreelanceWithholdingTaxUtil {

    /** 급여 프로필 {@code salaryType} 값 — 프리랜서 */
    public static final String CONSULTANT_SALARY_TYPE_FREELANCE = "FREELANCE";

    private FreelanceWithholdingTaxUtil() {
    }

    /**
     * 원 단위 지급(총액)에 대한 원천징수 예정액 — 국세·지방세 각각 원 미만 절사 후 합산.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateWithholdingTaxAmount(long grossAmountKrw) {
        return calculateWithholdingTaxAmount(BigDecimal.valueOf(grossAmountKrw));
    }

    /**
     * 원 단위 지급(총액)에 대한 원천징수 예정액 — 국세·지방세 각각 원 미만 절사 후 합산.
     *
     * @param grossAmountKrw 총 입금(매출) 금액(원)
     * @return 0 이상의 원 단위 세액
     */
    public static BigDecimal calculateWithholdingTaxAmount(BigDecimal grossAmountKrw) {
        if (grossAmountKrw == null || grossAmountKrw.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        BigDecimal national = grossAmountKrw.multiply(SalaryTaxRates.WITHHOLDING_NATIONAL_RATE)
                .setScale(0, RoundingMode.FLOOR);
        BigDecimal local = grossAmountKrw.multiply(SalaryTaxRates.WITHHOLDING_LOCAL_RATE)
                .setScale(0, RoundingMode.FLOOR);
        return national.add(local);
    }
}

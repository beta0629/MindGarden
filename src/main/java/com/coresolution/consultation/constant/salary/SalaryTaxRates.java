package com.coresolution.consultation.constant.salary;

/**
 * 급여 세율·보험요율 Java 상수.
 * <p>
 * DB SSOT는 {@code common_codes} 그룹 {@code SALARY_TAX_RATE} (code_value 아래 상수와 동일).
 * 제품 계산 경로에 합산 0.033 리터럴을 두지 않는다. 원천 = 국세 + 지방세.
 * </p>
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
public final class SalaryTaxRates {

    /** common_codes.code_group */
    public static final String CODE_GROUP = "SALARY_TAX_RATE";

    /** 프리랜서 원천 국세 — common_codes WITHHOLDING_NATIONAL */
    public static final String CODE_WITHHOLDING_NATIONAL = "WITHHOLDING_NATIONAL";

    /** 프리랜서 원천 지방세 — common_codes WITHHOLDING_LOCAL */
    public static final String CODE_WITHHOLDING_LOCAL = "WITHHOLDING_LOCAL";

    /** 부가세 — common_codes VAT */
    public static final String CODE_VAT = "VAT";

    /** 정규직 지방소득세(소득세의 %) — common_codes LOCAL_INCOME_OF_INCOME_TAX */
    public static final String CODE_LOCAL_INCOME_OF_INCOME_TAX = "LOCAL_INCOME_OF_INCOME_TAX";

    private SalaryTaxRates() {
    }
}

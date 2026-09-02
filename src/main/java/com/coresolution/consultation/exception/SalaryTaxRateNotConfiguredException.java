package com.coresolution.consultation.exception;

/**
 * {@code common_codes} 그룹 {@code SALARY_TAX_RATE} 에서 세율을 조회하지 못했거나 유효하지 않을 때 발생.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
public class SalaryTaxRateNotConfiguredException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final String codeGroup;
    private final String codeValue;
    private final String tenantId;

    public SalaryTaxRateNotConfiguredException(String codeGroup, String codeValue, String tenantId) {
        super(String.format(
                "급여 세율 공통코드가 설정되지 않았습니다: group=%s, value=%s, tenantId=%s",
                codeGroup, codeValue, tenantId != null ? tenantId : "(context)"));
        this.codeGroup = codeGroup;
        this.codeValue = codeValue;
        this.tenantId = tenantId;
    }

    public SalaryTaxRateNotConfiguredException(
            String codeGroup, String codeValue, String tenantId, Throwable cause) {
        super(String.format(
                "급여 세율 공통코드가 설정되지 않았습니다: group=%s, value=%s, tenantId=%s",
                codeGroup, codeValue, tenantId != null ? tenantId : "(context)"), cause);
        this.codeGroup = codeGroup;
        this.codeValue = codeValue;
        this.tenantId = tenantId;
    }

    public String getCodeGroup() {
        return codeGroup;
    }

    public String getCodeValue() {
        return codeValue;
    }

    public String getTenantId() {
        return tenantId;
    }
}

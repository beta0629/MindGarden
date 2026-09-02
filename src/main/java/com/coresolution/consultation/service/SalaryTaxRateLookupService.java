package com.coresolution.consultation.service;

import java.math.BigDecimal;

/**
 * {@code common_codes} 그룹 {@code SALARY_TAX_RATE} 세율 SSOT 조회.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
public interface SalaryTaxRateLookupService {

    /**
     * 현재 테넌트 컨텍스트 기준 프리랜서 원천징수 국세율.
     *
     * @return 세율 (0 초과)
     */
    BigDecimal getWithholdingNationalRate();

    /**
     * 현재 테넌트 컨텍스트 기준 프리랜서 원천징수 지방세율.
     *
     * @return 세율 (0 초과)
     */
    BigDecimal getWithholdingLocalRate();

    /**
     * 현재 테넌트 컨텍스트 기준 부가세율.
     *
     * @return 세율 (0 초과)
     */
    BigDecimal getVatRate();

    /**
     * 지정 테넌트 기준 프리랜서 원천징수 국세율 (테넌트 → 코어 폴백).
     *
     * @param tenantId 테넌트 ID
     * @return 세율 (0 초과)
     */
    BigDecimal getWithholdingNationalRate(String tenantId);

    /**
     * 지정 테넌트 기준 프리랜서 원천징수 지방세율 (테넌트 → 코어 폴백).
     *
     * @param tenantId 테넌트 ID
     * @return 세율 (0 초과)
     */
    BigDecimal getWithholdingLocalRate(String tenantId);

    /**
     * 지정 테넌트 기준 부가세율 (테넌트 → 코어 폴백).
     *
     * @param tenantId 테넌트 ID
     * @return 세율 (0 초과)
     */
    BigDecimal getVatRate(String tenantId);
}

package com.coresolution.consultation.service.impl;

import java.math.BigDecimal;
import java.util.Optional;
import com.coresolution.consultation.constant.salary.SalaryTaxRates;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.exception.SalaryTaxRateNotConfiguredException;
import com.coresolution.consultation.service.CommonCodeService;
import com.coresolution.consultation.service.SalaryTaxRateLookupService;
import com.coresolution.core.context.TenantContextHolder;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * {@code SALARY_TAX_RATE} 공통코드 extra_data.rate 조회 구현.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SalaryTaxRateLookupServiceImpl implements SalaryTaxRateLookupService {

    private final CommonCodeService commonCodeService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getWithholdingNationalRate() {
        return getWithholdingNationalRate(resolveContextTenantId());
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getWithholdingLocalRate() {
        return getWithholdingLocalRate(resolveContextTenantId());
    }

    @Override
    @Transactional(readOnly = true)
    public BigDecimal getVatRate() {
        return getVatRate(resolveContextTenantId());
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "salaryTaxRates",
            key = "(#tenantId != null ? #tenantId : 'ctx') + ':' + T(com.coresolution.consultation.constant.salary.SalaryTaxRates).CODE_WITHHOLDING_NATIONAL")
    public BigDecimal getWithholdingNationalRate(String tenantId) {
        return resolveRate(tenantId, SalaryTaxRates.CODE_WITHHOLDING_NATIONAL);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "salaryTaxRates",
            key = "(#tenantId != null ? #tenantId : 'ctx') + ':' + T(com.coresolution.consultation.constant.salary.SalaryTaxRates).CODE_WITHHOLDING_LOCAL")
    public BigDecimal getWithholdingLocalRate(String tenantId) {
        return resolveRate(tenantId, SalaryTaxRates.CODE_WITHHOLDING_LOCAL);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(
            value = "salaryTaxRates",
            key = "(#tenantId != null ? #tenantId : 'ctx') + ':' + T(com.coresolution.consultation.constant.salary.SalaryTaxRates).CODE_VAT")
    public BigDecimal getVatRate(String tenantId) {
        return resolveRate(tenantId, SalaryTaxRates.CODE_VAT);
    }

    private String resolveContextTenantId() {
        return TenantContextHolder.getTenantId();
    }

    private BigDecimal resolveRate(String tenantId, String codeValue) {
        CommonCode code = resolveCode(tenantId, codeValue);
        return parseRate(code, codeValue, tenantId);
    }

    private CommonCode resolveCode(String tenantId, String codeValue) {
        if (tenantId != null && !tenantId.isEmpty()) {
            Optional<CommonCode> tenantCode = commonCodeService.getTenantCodeByGroupAndValue(
                    tenantId, SalaryTaxRates.CODE_GROUP, codeValue);
            if (tenantCode.isPresent()) {
                return tenantCode.get();
            }
            Optional<CommonCode> coreCode = commonCodeService.getCoreCodeByGroupAndValue(
                    SalaryTaxRates.CODE_GROUP, codeValue);
            if (coreCode.isPresent()) {
                return coreCode.get();
            }
            throw new SalaryTaxRateNotConfiguredException(
                    SalaryTaxRates.CODE_GROUP, codeValue, tenantId);
        }
        try {
            return commonCodeService.getCommonCodeByGroupAndValue(
                    SalaryTaxRates.CODE_GROUP, codeValue);
        } catch (RuntimeException ex) {
            throw new SalaryTaxRateNotConfiguredException(
                    SalaryTaxRates.CODE_GROUP, codeValue, null, ex);
        }
    }

    private BigDecimal parseRate(CommonCode code, String codeValue, String tenantId) {
        if (code == null || code.getExtraData() == null || code.getExtraData().isBlank()) {
            throw new SalaryTaxRateNotConfiguredException(
                    SalaryTaxRates.CODE_GROUP, codeValue, tenantId);
        }
        try {
            JsonNode extraData = objectMapper.readTree(code.getExtraData());
            JsonNode rateNode = extraData.get("rate");
            if (rateNode == null || rateNode.isNull()) {
                throw new SalaryTaxRateNotConfiguredException(
                        SalaryTaxRates.CODE_GROUP, codeValue, tenantId);
            }
            BigDecimal rate = rateNode.decimalValue();
            if (rate.compareTo(BigDecimal.ZERO) <= 0) {
                throw new SalaryTaxRateNotConfiguredException(
                        SalaryTaxRates.CODE_GROUP, codeValue, tenantId);
            }
            return rate;
        } catch (SalaryTaxRateNotConfiguredException ex) {
            throw ex;
        } catch (Exception ex) {
            log.error("급여 세율 extra_data.rate 파싱 실패: group={}, value={}, tenantId={}",
                    SalaryTaxRates.CODE_GROUP, codeValue, tenantId, ex);
            throw new SalaryTaxRateNotConfiguredException(
                    SalaryTaxRates.CODE_GROUP, codeValue, tenantId, ex);
        }
    }
}

package com.coresolution.consultation.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import com.coresolution.consultation.constant.salary.SalaryTaxRates;
import com.coresolution.consultation.entity.CommonCode;
import com.coresolution.consultation.exception.SalaryTaxRateNotConfiguredException;
import com.coresolution.consultation.service.CommonCodeService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * {@link SalaryTaxRateLookupServiceImpl} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-09-02
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("SalaryTaxRateLookupService 단위 테스트")
class SalaryTaxRateLookupServiceTest {

    @Mock
    private CommonCodeService commonCodeService;

    private SalaryTaxRateLookupServiceImpl lookupService;

    @BeforeEach
    void setUp() {
        lookupService = new SalaryTaxRateLookupServiceImpl(commonCodeService, new ObjectMapper());
    }

    @Test
    @DisplayName("테넌트 코드 extra_data.rate 파싱 성공")
    void getVatRate_tenantCode_returnsRate() {
        CommonCode code = CommonCode.builder()
                .codeGroup(SalaryTaxRates.CODE_GROUP)
                .codeValue(SalaryTaxRates.CODE_VAT)
                .extraData("{\"rate\":0.10}")
                .build();
        when(commonCodeService.getTenantCodeByGroupAndValue(
                "T1", SalaryTaxRates.CODE_GROUP, SalaryTaxRates.CODE_VAT))
                .thenReturn(Optional.of(code));

        assertThat(lookupService.getVatRate("T1")).isEqualByComparingTo("0.10");
    }

    @Test
    @DisplayName("코어 폴백: 테넌트 없으면 core 코드 사용")
    void getWithholdingNationalRate_fallsBackToCore() {
        CommonCode core = CommonCode.builder()
                .codeGroup(SalaryTaxRates.CODE_GROUP)
                .codeValue(SalaryTaxRates.CODE_WITHHOLDING_NATIONAL)
                .extraData("{\"rate\":0.03}")
                .build();
        when(commonCodeService.getTenantCodeByGroupAndValue(
                "T1", SalaryTaxRates.CODE_GROUP, SalaryTaxRates.CODE_WITHHOLDING_NATIONAL))
                .thenReturn(Optional.empty());
        when(commonCodeService.getCoreCodeByGroupAndValue(
                SalaryTaxRates.CODE_GROUP, SalaryTaxRates.CODE_WITHHOLDING_NATIONAL))
                .thenReturn(Optional.of(core));

        assertThat(lookupService.getWithholdingNationalRate("T1")).isEqualByComparingTo("0.03");
    }

    @Test
    @DisplayName("코드 없음 → SalaryTaxRateNotConfiguredException")
    void getVatRate_missingCode_throws() {
        when(commonCodeService.getTenantCodeByGroupAndValue(
                "T1", SalaryTaxRates.CODE_GROUP, SalaryTaxRates.CODE_VAT))
                .thenReturn(Optional.empty());
        when(commonCodeService.getCoreCodeByGroupAndValue(
                SalaryTaxRates.CODE_GROUP, SalaryTaxRates.CODE_VAT))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> lookupService.getVatRate("T1"))
                .isInstanceOf(SalaryTaxRateNotConfiguredException.class);
    }

    @Test
    @DisplayName("rate <= 0 → SalaryTaxRateNotConfiguredException")
    void getWithholdingLocalRate_nonPositiveRate_throws() {
        CommonCode code = CommonCode.builder()
                .codeGroup(SalaryTaxRates.CODE_GROUP)
                .codeValue(SalaryTaxRates.CODE_WITHHOLDING_LOCAL)
                .extraData("{\"rate\":0}")
                .build();
        when(commonCodeService.getTenantCodeByGroupAndValue(
                "T1", SalaryTaxRates.CODE_GROUP, SalaryTaxRates.CODE_WITHHOLDING_LOCAL))
                .thenReturn(Optional.of(code));

        assertThatThrownBy(() -> lookupService.getWithholdingLocalRate("T1"))
                .isInstanceOf(SalaryTaxRateNotConfiguredException.class);
    }
}

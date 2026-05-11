package com.coresolution.consultation.constant.salary;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * {@link SalaryTaxTypeDisplayLabels} 단위 테스트.
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
class SalaryTaxTypeDisplayLabelsTest {

    @Test
    @DisplayName("WITHHOLDING_TAX → 프론트와 동일 한글 라벨")
    void withholdingTax_matchesFrontendConstant() {
        assertEquals(
                "원천징수(국세 3%, 지방세 0.3%, 합계 3.3%)",
                SalaryTaxTypeDisplayLabels.labelForTaxType("WITHHOLDING_TAX"));
    }

    @Test
    @DisplayName("미등록 코드는 기타(코드) 형식")
    void unknownCode_miscFormat() {
        assertEquals("기타(UNKNOWN_TAX_X)", SalaryTaxTypeDisplayLabels.labelForTaxType("UNKNOWN_TAX_X"));
    }

    @Test
    @DisplayName("공백·null → 빈 문자열")
    void blank_returnsEmpty() {
        assertEquals("", SalaryTaxTypeDisplayLabels.labelForTaxType(null));
        assertEquals("", SalaryTaxTypeDisplayLabels.labelForTaxType("   "));
    }

    @Test
    @DisplayName("코드 trim 적용")
    void trimsCode() {
        assertTrue(SalaryTaxTypeDisplayLabels.labelForTaxType("  VAT  ").contains("부가가치세"));
    }
}

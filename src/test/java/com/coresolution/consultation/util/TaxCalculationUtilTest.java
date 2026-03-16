package com.coresolution.consultation.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import com.coresolution.consultation.util.TaxCalculationUtil.TaxCalculationResult;

/**
 * 급여·세금 영역 TaxCalculationUtil 단위 테스트
 * 시나리오: docs/project-management/SALARY_TAX_TEST_SCENARIOS.md §1.1
 *
 * @author MindGarden
 * @since 2026-03-16
 */
@DisplayName("TaxCalculationUtil 단위 테스트")
class TaxCalculationUtilTest {

    @Nested
    @DisplayName("calculateVatFromAmountIncludingTax")
    class CalculateVatFromAmountIncludingTax {

        @Test
        @DisplayName("U-TAX-01: 부가세 포함 금액에서 부가세 계산 (110000 → 10000, HALF_UP)")
        void amountIncludingTax_returnsVat() {
            BigDecimal input = new BigDecimal("110000");
            BigDecimal actual = TaxCalculationUtil.calculateVatFromAmountIncludingTax(input);
            assertThat(actual).isEqualByComparingTo(new BigDecimal("10000"));
        }

        @Test
        @DisplayName("U-TAX-02: null 입력 시 ZERO 반환 (NPE 방지)")
        void nullInput_returnsZero() {
            assertThat(TaxCalculationUtil.calculateVatFromAmountIncludingTax(null))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }

        @Test
        @DisplayName("U-TAX-03: 0 이하 입력 시 ZERO 반환")
        void zeroOrNegative_returnsZero() {
            assertThat(TaxCalculationUtil.calculateVatFromAmountIncludingTax(BigDecimal.ZERO))
                    .isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(TaxCalculationUtil.calculateVatFromAmountIncludingTax(new BigDecimal("-1000")))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("calculateAmountExcludingTax")
    class CalculateAmountExcludingTax {

        @Test
        @DisplayName("U-TAX-04: 부가세 포함 → 제외 금액 (110000 - 부가세)")
        void amountIncludingTax_returnsExcluding() {
            BigDecimal input = new BigDecimal("110000");
            BigDecimal actual = TaxCalculationUtil.calculateAmountExcludingTax(input);
            assertThat(actual).isEqualByComparingTo(new BigDecimal("100000"));
        }

        @Test
        @DisplayName("U-TAX-05: null/0 이하 시 ZERO 반환")
        void nullOrZero_returnsZero() {
            assertThat(TaxCalculationUtil.calculateAmountExcludingTax(null))
                    .isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(TaxCalculationUtil.calculateAmountExcludingTax(BigDecimal.ZERO))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("calculateVatFromAmountExcludingTax")
    class CalculateVatFromAmountExcludingTax {

        @Test
        @DisplayName("U-TAX-06: 부가세 제외 금액에서 부가세 (100000 → 10000)")
        void amountExcludingTax_returnsVat() {
            BigDecimal input = new BigDecimal("100000");
            BigDecimal actual = TaxCalculationUtil.calculateVatFromAmountExcludingTax(input);
            assertThat(actual).isEqualByComparingTo(new BigDecimal("10000"));
        }

        @Test
        @DisplayName("U-TAX-07: null/0 이하 시 ZERO 반환")
        void nullOrZero_returnsZero() {
            assertThat(TaxCalculationUtil.calculateVatFromAmountExcludingTax(null))
                    .isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(TaxCalculationUtil.calculateVatFromAmountExcludingTax(BigDecimal.ZERO))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("calculateAmountIncludingTax")
    class CalculateAmountIncludingTax {

        @Test
        @DisplayName("U-TAX-08: 부가세 제외 → 포함 금액 (100000 → 110000)")
        void amountExcludingTax_returnsIncluding() {
            BigDecimal input = new BigDecimal("100000");
            BigDecimal actual = TaxCalculationUtil.calculateAmountIncludingTax(input);
            assertThat(actual).isEqualByComparingTo(new BigDecimal("110000"));
        }

        @Test
        @DisplayName("U-TAX-09: null/0 이하 시 ZERO 반환")
        void nullOrZero_returnsZero() {
            assertThat(TaxCalculationUtil.calculateAmountIncludingTax(null))
                    .isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(TaxCalculationUtil.calculateAmountIncludingTax(BigDecimal.ZERO))
                    .isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("calculateTaxFromPayment")
    class CalculateTaxFromPayment {

        @Test
        @DisplayName("U-TAX-10: 결제 금액에서 부가세 분리 (110000 → amountIncludingTax, amountExcludingTax, vatAmount)")
        void paymentAmount_returnsResult() {
            BigDecimal input = new BigDecimal("110000");
            TaxCalculationResult actual = TaxCalculationUtil.calculateTaxFromPayment(input);
            assertThat(actual.getAmountIncludingTax()).isEqualByComparingTo(new BigDecimal("110000"));
            assertThat(actual.getAmountExcludingTax()).isEqualByComparingTo(new BigDecimal("100000"));
            assertThat(actual.getVatAmount()).isEqualByComparingTo(new BigDecimal("10000"));
        }

        @Test
        @DisplayName("U-TAX-11: null/0 이하 시 ZERO 결과")
        void nullOrZero_returnsZeroResult() {
            TaxCalculationResult nullResult = TaxCalculationUtil.calculateTaxFromPayment(null);
            assertThat(nullResult.getAmountIncludingTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(nullResult.getAmountExcludingTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(nullResult.getVatAmount()).isEqualByComparingTo(BigDecimal.ZERO);

            TaxCalculationResult zeroResult = TaxCalculationUtil.calculateTaxFromPayment(BigDecimal.ZERO);
            assertThat(zeroResult.getAmountIncludingTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(zeroResult.getAmountExcludingTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(zeroResult.getVatAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("calculateTaxForExpense")
    class CalculateTaxForExpense {

        @Test
        @DisplayName("U-TAX-12: 지출 금액에 부가세 추가 (100000 → 110000 포함, 100000 제외, 10000 부가세)")
        void expenseAmount_returnsResult() {
            BigDecimal input = new BigDecimal("100000");
            TaxCalculationResult actual = TaxCalculationUtil.calculateTaxForExpense(input);
            assertThat(actual.getAmountIncludingTax()).isEqualByComparingTo(new BigDecimal("110000"));
            assertThat(actual.getAmountExcludingTax()).isEqualByComparingTo(new BigDecimal("100000"));
            assertThat(actual.getVatAmount()).isEqualByComparingTo(new BigDecimal("10000"));
        }

        @Test
        @DisplayName("U-TAX-13: null/0 이하 시 ZERO 결과")
        void nullOrZero_returnsZeroResult() {
            TaxCalculationResult nullResult = TaxCalculationUtil.calculateTaxForExpense(null);
            assertThat(nullResult.getAmountIncludingTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(nullResult.getAmountExcludingTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(nullResult.getVatAmount()).isEqualByComparingTo(BigDecimal.ZERO);

            TaxCalculationResult zeroResult = TaxCalculationUtil.calculateTaxForExpense(BigDecimal.ZERO);
            assertThat(zeroResult.getAmountIncludingTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(zeroResult.getAmountExcludingTax()).isEqualByComparingTo(BigDecimal.ZERO);
            assertThat(zeroResult.getVatAmount()).isEqualByComparingTo(BigDecimal.ZERO);
        }
    }

    @Nested
    @DisplayName("isVatApplicable")
    class IsVatApplicable {

        @Test
        @DisplayName("U-TAX-14: 급여 관련 카테고리 → false")
        void salaryCategory_returnsFalse() {
            assertThat(TaxCalculationUtil.isVatApplicable("급여")).isFalse();
            assertThat(TaxCalculationUtil.isVatApplicable("월급")).isFalse();
            assertThat(TaxCalculationUtil.isVatApplicable("연봉")).isFalse();
            assertThat(TaxCalculationUtil.isVatApplicable("상담사 급여")).isFalse();
            assertThat(TaxCalculationUtil.isVatApplicable("기본 월급")).isFalse();
        }

        @Test
        @DisplayName("U-TAX-15: 부가세 적용 카테고리 → true")
        void vatApplicableCategory_returnsTrue() {
            assertThat(TaxCalculationUtil.isVatApplicable("임대료")).isTrue();
            assertThat(TaxCalculationUtil.isVatApplicable("사무용품")).isTrue();
            assertThat(TaxCalculationUtil.isVatApplicable("마케팅")).isTrue();
        }

        @Test
        @DisplayName("U-TAX-16: null → false")
        void nullCategory_returnsFalse() {
            assertThat(TaxCalculationUtil.isVatApplicable(null)).isFalse();
        }
    }
}

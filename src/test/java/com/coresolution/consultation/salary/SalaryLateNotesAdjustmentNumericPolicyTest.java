package com.coresolution.consultation.salary;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coresolution.consultation.constant.salary.SalaryTaxRates;
import com.coresolution.consultation.util.FreelanceWithholdingTaxUtil;

/**
 * 늦은 회기 Recalc/Adjustment 금액 정책(expected vs actual) 단위 검증.
 * SP 본문 SSOT와 동일 규칙: FREELANCE rate×sessions, 원천 = 국세+지방, silent 30000 fallback 금지.
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@DisplayName("Salary late-notes adjustment 숫자 정책")
class SalaryLateNotesAdjustmentNumericPolicyTest {

    private static final BigDecimal FREELANCE_RATE = new BigDecimal("30000");

    @Test
    @DisplayName("Confirm 2 sessions × 30000 = 60000; Recalc 3 → 90000")
    void freelanceConfirmThenRecalcGross() {
        BigDecimal confirmGross = FREELANCE_RATE.multiply(BigDecimal.valueOf(2));
        BigDecimal recalcGross = FREELANCE_RATE.multiply(BigDecimal.valueOf(3));

        assertThat(confirmGross).isEqualByComparingTo("60000");
        assertThat(recalcGross).isEqualByComparingTo("90000");
        assertThat(recalcGross).isEqualByComparingTo(confirmGross.add(FREELANCE_RATE));
    }

    @Test
    @DisplayName("Adjustment delta 1 × 30000; tax = 30000×0.03 + 30000×0.003 = 900+90 = 990; net = 29010")
    void freelanceAdjustmentTaxOnDeltaOnly() {
        BigDecimal gross = FREELANCE_RATE.multiply(BigDecimal.valueOf(1));
        BigDecimal national = gross.multiply(SalaryTaxRates.WITHHOLDING_NATIONAL_RATE)
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal local = gross.multiply(SalaryTaxRates.WITHHOLDING_LOCAL_RATE)
                .setScale(0, RoundingMode.HALF_UP);
        BigDecimal tax = national.add(local);
        BigDecimal net = gross.subtract(tax);

        assertThat(gross).isEqualByComparingTo("30000");
        assertThat(national).isEqualByComparingTo("900");
        assertThat(local).isEqualByComparingTo("90");
        assertThat(tax).isEqualByComparingTo("990");
        assertThat(net).isEqualByComparingTo("29010");
        assertThat(FreelanceWithholdingTaxUtil.calculateWithholdingTaxAmount(gross))
                .isEqualByComparingTo("990");
    }

    @Test
    @DisplayName("delta<=0 이면 추가 정산 금액 0 (거절 대상)")
    void adjustmentDeltaNonPositive_hasZeroGross() {
        int primaryCompleted = 3;
        int adjCompletedSum = 1;
        int currentCompleted = 4;
        int delta = currentCompleted - (primaryCompleted + adjCompletedSum);

        assertThat(delta).isZero();
        assertThat(FREELANCE_RATE.multiply(BigDecimal.valueOf(Math.max(delta, 0))))
                .isEqualByComparingTo(BigDecimal.ZERO);
    }
}

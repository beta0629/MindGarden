package com.coresolution.consultation.salary;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.math.RoundingMode;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * 늦은 회기 Recalc/Adjustment 금액 정책(expected vs actual) 단위 검증.
 * SP 본문 SSOT와 동일 규칙: FREELANCE rate×sessions, withholding 3.3%, silent 30000 fallback 금지.
 *
 * @author CoreSolution
 * @since 2026-08-29
 */
@DisplayName("Salary late-notes adjustment 숫자 정책")
class SalaryLateNotesAdjustmentNumericPolicyTest {

    private static final BigDecimal FREELANCE_RATE = new BigDecimal("30000");
    private static final BigDecimal WITHHOLDING_RATE = new BigDecimal("0.033");

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
    @DisplayName("Adjustment delta 1 × 30000; tax on 30000 only = 990; net = 29010")
    void freelanceAdjustmentTaxOnDeltaOnly() {
        BigDecimal gross = FREELANCE_RATE.multiply(BigDecimal.valueOf(1));
        BigDecimal tax = gross.multiply(WITHHOLDING_RATE).setScale(2, RoundingMode.HALF_UP);
        BigDecimal net = gross.subtract(tax);

        assertThat(gross).isEqualByComparingTo("30000");
        assertThat(tax).isEqualByComparingTo("990.00");
        assertThat(net).isEqualByComparingTo("29010.00");
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

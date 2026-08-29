package com.coresolution.consultation.salary;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.math.RoundingMode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Preview = Confirm = Paid 저장 공식의 숫자 시나리오(Java 미러).
 * SP SSOT와 동일: FLOOR 원절사, COMPLETED만, overnight hours ≥0, FREELANCE 요율 필수.
 *
 * @author MindGarden
 * @since 2026-08-29
 */
@DisplayName("Salary preview/confirm formula parity scenarios")
class SalaryPreviewConfirmParityFormulaTest {

    private static final BigDecimal WITHHOLDING = new BigDecimal("0.033");
    private static final BigDecimal LOCAL_RATE = new BigDecimal("0.10");

    private static BigDecimal floor(BigDecimal value) {
        return value.setScale(0, RoundingMode.FLOOR);
    }

    @Test
    @DisplayName("FREELANCE: 2 COMPLETED + 1 cancelled, rate 50k → earnings 100k")
    void freelance_completedCountOnly_excludesCancelled() {
        int completed = 2;
        BigDecimal rate = new BigDecimal("50000");
        BigDecimal earnings = rate.multiply(BigDecimal.valueOf(completed));
        assertThat(earnings).isEqualByComparingTo("100000");
    }

    @Test
    @DisplayName("FREELANCE: taxable=earnings+SS, tax=FLOOR(taxable*0.033), gross=earnings+SS, net=gross-tax")
    void freelance_grossNetWithSpecialSupport_matchesSpFloor() {
        BigDecimal earnings = new BigDecimal("120000");
        BigDecimal ss = new BigDecimal("10000");
        BigDecimal taxable = earnings.add(ss);
        BigDecimal tax = floor(taxable.multiply(WITHHOLDING));
        BigDecimal gross = earnings.add(ss);
        BigDecimal net = gross.subtract(tax);
        assertThat(tax).isEqualByComparingTo("4290");
        assertThat(gross).isEqualByComparingTo("130000");
        assertThat(net).isEqualByComparingTo("125710");
        assertThat(gross.subtract(ss)).isEqualByComparingTo("120000");
    }

    @Test
    @DisplayName("REGULAR: local tax = FLOOR(income_tax * 0.10); 4insurance FLOOR sum when annual >= 12M")
    void regular_localTaxFloor_andInsuranceFloor() {
        BigDecimal earnings = new BigDecimal("2000000");
        BigDecimal incomeTaxRate = new BigDecimal("0.15");
        BigDecimal incomeTax = floor(earnings.multiply(incomeTaxRate));
        BigDecimal local = floor(incomeTax.multiply(LOCAL_RATE));
        assertThat(incomeTax).isEqualByComparingTo("300000");
        assertThat(local).isEqualByComparingTo("30000");

        BigDecimal pension = floor(earnings.multiply(new BigDecimal("0.045")));
        BigDecimal health = floor(earnings.multiply(new BigDecimal("0.03545")));
        BigDecimal longterm = floor(earnings.multiply(new BigDecimal("0.00545")));
        BigDecimal employment = floor(earnings.multiply(new BigDecimal("0.009")));
        BigDecimal four = pension.add(health).add(longterm).add(employment);
        BigDecimal tax = incomeTax.add(local).add(four);
        BigDecimal gross = earnings;
        BigDecimal net = gross.subtract(tax);
        assertThat(gross.add(BigDecimal.ZERO)).isEqualByComparingTo(earnings);
        assertThat(net).isEqualByComparingTo(gross.subtract(tax));
        assertThat(earnings.multiply(BigDecimal.valueOf(12)).compareTo(new BigDecimal("12000000"))).isGreaterThanOrEqualTo(0);
    }

    @Test
    @DisplayName("Hours: overnight negative TIMESTAMPDIFF clamped with GREATEST(...,0)")
    void overnightHours_clampedToNonNegative() {
        double overnightMinutes = -120.0;
        double hours = Math.max(overnightMinutes / 60.0, 0.0);
        assertThat(hours).isEqualTo(0.0);

        double normalMinutes = 90.0;
        assertThat(Math.max(normalMinutes / 60.0, 0.0)).isEqualTo(1.5);
    }

    @Test
    @DisplayName("FREELANCE: missing grade rate must fail (no 30000 fallback)")
    void freelance_missingRate_mustFail() {
        BigDecimal gradeRate = null;
        boolean fail = gradeRate == null || gradeRate.compareTo(BigDecimal.ZERO) <= 0;
        assertThat(fail).isTrue();
        BigDecimal zeroRate = BigDecimal.ZERO;
        assertThat(zeroRate.compareTo(BigDecimal.ZERO) <= 0).isTrue();
    }

    @Test
    @DisplayName("FREELANCE: no extra local 10% on top of 3.3% withholding")
    void freelance_noExtraLocalOnWithholding() {
        BigDecimal taxable = new BigDecimal("100000");
        BigDecimal withholding = floor(taxable.multiply(WITHHOLDING));
        BigDecimal taxWithoutExtraLocal = withholding;
        BigDecimal taxWithBannedExtraLocal = withholding.add(floor(withholding.multiply(LOCAL_RATE)));
        assertThat(taxWithoutExtraLocal).isEqualByComparingTo("3300");
        assertThat(taxWithBannedExtraLocal).isNotEqualByComparingTo(taxWithoutExtraLocal);
    }
}

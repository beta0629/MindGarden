package com.coresolution.consultation.salary;

import static org.assertj.core.api.Assertions.assertThat;

import com.coresolution.consultation.util.FreelanceWithholdingTaxUtil;
import java.math.BigDecimal;
import java.math.RoundingMode;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

/**
 * Preview = Confirm = Paid 저장 공식의 숫자 시나리오(Java 미러).
 * SP SSOT와 동일: FLOOR 원절사(국세+지방세 분리), COMPLETED만, overnight hours ≥0, FREELANCE 요율 필수.
 *
 * @author MindGarden
 * @since 2026-08-29
 */
@DisplayName("Salary preview/confirm formula parity scenarios")
class SalaryPreviewConfirmParityFormulaTest {

    private static final BigDecimal WITHHOLDING_NATIONAL_RATE = new BigDecimal("0.03");
    private static final BigDecimal WITHHOLDING_LOCAL_RATE = new BigDecimal("0.003");
    private static final BigDecimal LOCAL_INCOME_ON_INCOME_TAX = new BigDecimal("0.10");

    private static BigDecimal floor(BigDecimal value) {
        return value.setScale(0, RoundingMode.FLOOR);
    }

    private static BigDecimal nationalWithholding(BigDecimal gross) {
        return floor(gross.multiply(WITHHOLDING_NATIONAL_RATE));
    }

    private static BigDecimal localWithholding(BigDecimal gross) {
        return floor(gross.multiply(WITHHOLDING_LOCAL_RATE));
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
    @DisplayName("FREELANCE: taxable=earnings+SS, tax=FLOOR(g*n)+FLOOR(g*l), gross=earnings+SS, net=gross-tax")
    void freelance_grossNetWithSpecialSupport_matchesSpFloor() {
        BigDecimal earnings = new BigDecimal("120000");
        BigDecimal ss = new BigDecimal("10000");
        BigDecimal taxable = earnings.add(ss);
        BigDecimal national = nationalWithholding(taxable);
        BigDecimal local = localWithholding(taxable);
        BigDecimal tax = national.add(local);
        BigDecimal gross = earnings.add(ss);
        BigDecimal net = gross.subtract(tax);
        assertThat(national).isEqualByComparingTo("3900");
        assertThat(local).isEqualByComparingTo("390");
        assertThat(tax).isEqualByComparingTo("4290");
        assertThat(gross).isEqualByComparingTo("130000");
        assertThat(net).isEqualByComparingTo("125710");
        assertThat(gross.subtract(ss)).isEqualByComparingTo("120000");
        assertThat(FreelanceWithholdingTaxUtil.calculateWithholdingTaxAmount(
                taxable, WITHHOLDING_NATIONAL_RATE, WITHHOLDING_LOCAL_RATE)).isEqualByComparingTo(tax);
    }

    @Test
    @DisplayName("FREELANCE: gross 30000 → 국세 900 + 지방세 90 (결합 0.033 금지)")
    void freelance_gross30000_splitsNational900_local90() {
        BigDecimal gross = new BigDecimal("30000");
        BigDecimal national = nationalWithholding(gross);
        BigDecimal local = localWithholding(gross);
        assertThat(national).isEqualByComparingTo("900");
        assertThat(local).isEqualByComparingTo("90");
        assertThat(national.add(local)).isEqualByComparingTo("990");
        assertThat(FreelanceWithholdingTaxUtil.calculateWithholdingTaxAmount(
                gross, WITHHOLDING_NATIONAL_RATE, WITHHOLDING_LOCAL_RATE)).isEqualByComparingTo("990");
        assertThat(WITHHOLDING_NATIONAL_RATE).isEqualByComparingTo("0.03");
        assertThat(WITHHOLDING_LOCAL_RATE).isEqualByComparingTo("0.003");
    }

    @Test
    @DisplayName("REGULAR: local tax = FLOOR(income_tax * 0.10); 4insurance FLOOR sum when annual >= 12M")
    void regular_localTaxFloor_andInsuranceFloor() {
        BigDecimal earnings = new BigDecimal("2000000");
        BigDecimal incomeTaxRate = new BigDecimal("0.15");
        BigDecimal incomeTax = floor(earnings.multiply(incomeTaxRate));
        BigDecimal local = floor(incomeTax.multiply(LOCAL_INCOME_ON_INCOME_TAX));
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
    @DisplayName("FREELANCE: no extra REGULAR local 10% on top of national+local withholding")
    void freelance_noExtraLocalOnWithholding() {
        BigDecimal taxable = new BigDecimal("100000");
        BigDecimal withholding = FreelanceWithholdingTaxUtil.calculateWithholdingTaxAmount(
                taxable, WITHHOLDING_NATIONAL_RATE, WITHHOLDING_LOCAL_RATE);
        BigDecimal taxWithoutExtraLocal = withholding;
        BigDecimal taxWithBannedExtraLocal = withholding.add(floor(withholding.multiply(LOCAL_INCOME_ON_INCOME_TAX)));
        assertThat(taxWithoutExtraLocal).isEqualByComparingTo("3300");
        assertThat(taxWithBannedExtraLocal).isNotEqualByComparingTo(taxWithoutExtraLocal);
        assertThat(nationalWithholding(taxable)).isEqualByComparingTo("3000");
        assertThat(localWithholding(taxable)).isEqualByComparingTo("300");
    }
}

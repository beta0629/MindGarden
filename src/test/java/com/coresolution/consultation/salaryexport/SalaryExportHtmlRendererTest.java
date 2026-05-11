package com.coresolution.consultation.salaryexport;

import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import com.coresolution.consultation.constant.salary.SalaryExportConstants;
import com.coresolution.consultation.dto.SalaryExportRequest;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryProfile;
import com.coresolution.consultation.entity.User;

/**
 * {@link SalaryExportHtmlRenderer} 단위 테스트(표시명 인자·세금 라벨).
 *
 * @author CoreSolution
 * @since 2026-05-11
 */
class SalaryExportHtmlRendererTest {

    @Test
    @DisplayName("전달한 표시용 상담사명이 HTML에 포함된다")
    void consultantDisplayName_passedThrough() {
        SalaryCalculation calc = minimalCalc("legacy::KOzkSNN1HL9xwLpOCuKEGA==");
        SalaryExportRequest request = new SalaryExportRequest();
        request.setIncludeTaxDetails(false);
        request.setIncludeCalculationDetails(true);

        String html = SalaryExportHtmlRenderer.buildSalaryExportXhtml(calc, Map.of(), request, "단위테스트표시명");

        assertTrue(html.contains("단위테스트표시명"));
        assertTrue(!html.contains("legacy::KOzkSNN1HL9xwLpOCuKEGA=="));
    }

    @Test
    @DisplayName("WITHHOLDING_TAX 행은 한글 세목 라벨로 출력된다")
    void taxRow_withholdingTax_koreanLabel() {
        SalaryCalculation calc = minimalCalc("이름");
        SalaryExportRequest request = new SalaryExportRequest();
        request.setIncludeTaxDetails(true);
        request.setIncludeCalculationDetails(true);

        Map<String, Object> taxRow = new HashMap<>();
        taxRow.put(SalaryExportConstants.TAX_ROW_KEY_TAX_TYPE, "WITHHOLDING_TAX");
        taxRow.put(SalaryExportConstants.TAX_ROW_KEY_TAX_AMOUNT, new BigDecimal("3300"));
        Map<String, Object> taxDetails = new HashMap<>();
        taxDetails.put("grossSalary", new BigDecimal("100000"));
        taxDetails.put("netSalary", new BigDecimal("96700"));
        taxDetails.put(SalaryExportConstants.TAX_PAYLOAD_KEY_TAX_DETAILS, List.of(taxRow));

        String html = SalaryExportHtmlRenderer.buildSalaryExportXhtml(calc, taxDetails, request, "이름");

        assertTrue(html.contains("원천징수"));
        assertTrue(html.contains("국세 3%"));
        assertTrue(html.contains("합계 3.3%"));
    }

    private static SalaryCalculation minimalCalc(String consultantDbName) {
        User consultant = new User();
        consultant.setName(consultantDbName);
        SalaryProfile profile = new SalaryProfile();
        SalaryCalculation calc = SalaryCalculation.builder()
                .consultant(consultant)
                .salaryProfile(profile)
                .calculationPeriodStart(LocalDate.of(2025, 6, 1))
                .calculationPeriodEnd(LocalDate.of(2025, 6, 30))
                .totalConsultations(0)
                .completedConsultations(0)
                .baseSalary(BigDecimal.ZERO)
                .grossSalary(BigDecimal.ZERO)
                .deductions(BigDecimal.ZERO)
                .netSalary(BigDecimal.ZERO)
                .totalSalary(BigDecimal.ZERO)
                .hourlyEarnings(BigDecimal.ZERO)
                .commissionEarnings(BigDecimal.ZERO)
                .status(SalaryCalculation.SalaryStatus.CALCULATED)
                .calculatedAt(LocalDateTime.now())
                .build();
        calc.setId(1L);
        return calc;
    }
}

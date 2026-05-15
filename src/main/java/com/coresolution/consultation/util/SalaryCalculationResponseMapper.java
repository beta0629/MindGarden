package com.coresolution.consultation.util;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import com.coresolution.consultation.entity.SalaryCalculation;

/**
 * 급여 계산 엔티티를 관리자·상담사 공용 API 응답 Map으로 변환합니다.
 *
 * @author CoreSolution
 * @since 2026-05-15
 */
public final class SalaryCalculationResponseMapper {

    private SalaryCalculationResponseMapper() {
    }

    /**
     * {@link com.coresolution.consultation.controller.SalaryManagementController}와 동일 스키마의 DTO 맵을 생성합니다.
     *
     * @param calc 급여 계산 엔티티
     * @return JSON 직렬화용 맵
     */
    public static Map<String, Object> toCalculationDto(SalaryCalculation calc) {
        Map<String, Object> dto = new HashMap<>();
        dto.put("id", calc.getId());
        dto.put("calculationPeriod", calc.getCalculationPeriod());
        dto.put("calculationPeriodStart", calc.getCalculationPeriodStart());
        dto.put("calculationPeriodEnd", calc.getCalculationPeriodEnd());
        dto.put("baseSalary", calc.getBaseSalary() != null ? calc.getBaseSalary() : BigDecimal.ZERO);
        dto.put("totalHoursWorked", calc.getTotalHoursWorked());
        BigDecimal hourlyEarnings = calc.getHourlyEarnings() != null ? calc.getHourlyEarnings() : BigDecimal.ZERO;
        dto.put("hourlyEarnings", hourlyEarnings);
        dto.put("totalConsultations", calc.getTotalConsultations());
        dto.put("completedConsultations", calc.getCompletedConsultations());
        dto.put("consultationCount", calc.getCompletedConsultations());
        BigDecimal commissionEarnings = calc.getCommissionEarnings() != null ? calc.getCommissionEarnings() : BigDecimal.ZERO;
        dto.put("commissionEarnings", commissionEarnings);
        dto.put("bonusEarnings", calc.getBonusEarnings() != null ? calc.getBonusEarnings() : BigDecimal.ZERO);
        dto.put("deductions", calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO);
        dto.put("grossSalary", calc.getGrossSalary() != null ? calc.getGrossSalary() : BigDecimal.ZERO);
        dto.put("netSalary", calc.getNetSalary() != null ? calc.getNetSalary() : BigDecimal.ZERO);
        dto.put("totalSalary", calc.getTotalSalary() != null ? calc.getTotalSalary() : BigDecimal.ZERO);
        dto.put("status", calc.getStatus());
        dto.put("calculatedAt", calc.getCalculatedAt());
        dto.put("approvedAt", calc.getApprovedAt());
        dto.put("paidAt", calc.getPaidAt());
        dto.put("branchCode", calc.getBranchCode());
        dto.put("optionSalary", commissionEarnings.add(hourlyEarnings));
        dto.put("taxAmount", calc.getDeductions() != null ? calc.getDeductions() : BigDecimal.ZERO);
        if (calc.getConsultant() != null) {
            dto.put("consultantId", calc.getConsultant().getId());
            dto.put("consultantName", calc.getConsultant().getName());
        }
        return dto;
    }
}

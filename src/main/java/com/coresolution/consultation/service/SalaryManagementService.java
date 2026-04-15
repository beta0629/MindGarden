package com.coresolution.consultation.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.dto.ConsultantSalaryOptionItemRequest;
import com.coresolution.consultation.dto.ConsultantSalaryProfileResponse;
import com.coresolution.consultation.dto.TaxCalculateRequest;
import com.coresolution.consultation.entity.ConsultantSalaryProfile;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.SalaryTaxCalculation;

public interface SalaryManagementService {
    
    // Salary Profile 관리
    List<ConsultantSalaryProfile> getAllSalaryProfiles();
    ConsultantSalaryProfile getSalaryProfileById(Long id);
    ConsultantSalaryProfile createSalaryProfile(ConsultantSalaryProfile salaryProfile,
            List<ConsultantSalaryOptionItemRequest> optionRequests);

    ConsultantSalaryProfile updateSalaryProfile(ConsultantSalaryProfile salaryProfile,
            List<ConsultantSalaryOptionItemRequest> optionRequests);

    void deleteSalaryProfile(Long id);

    /**
     * 상담사별 활성 급여 프로필과 옵션(optionTypes) 포함 상세 조회.
     * 동일 테넌트·상담사에 활성 프로필이 복수인 경우 {@code updatedAt} 최신 1건을 사용합니다.
     *
     * @param consultantId 상담사 ID
     * @return 프로필 없으면 null
     */
    ConsultantSalaryProfileResponse getSalaryProfileDetailForConsultant(Long consultantId);
    
    // Consultant 관리 (상담사 목록은 공통 API GET /api/v1/admin/consultants/with-stats 사용)
    List<Map<String, Object>> getConsultantSalarySummary(Long consultantId, String period);
    
    // Salary Calculation 관리
    List<SalaryCalculation> getSalaryCalculations(LocalDate startDate, LocalDate endDate);
    SalaryCalculation calculateSalary(Long consultantId, Long profileId, LocalDate periodStart, LocalDate periodEnd);
    SalaryCalculation approveSalaryCalculation(Long calculationId, String approvedBy);
    SalaryCalculation markAsPaid(Long calculationId, String paidBy);
    
    // 프론트엔드 호환성을 위한 메서드들
    List<SalaryCalculation> getSalaryCalculations(Long consultantId);
    Map<String, Object> getTaxDetails(Long calculationId);
    /**
     * 세금 통계 (기간별). {@code consultantId}가 있으면 해당 상담사 급여 계산만 집계.
     *
     * @param period       YYYY-MM
     * @param consultantId 선택 상담사 (null이면 테넌트 전체)
     */
    Map<String, Object> getTaxStatistics(String period, Long consultantId);
    
    /**
     * 추가 세금 계산 (POST tax/calculate). SalaryTaxCalculation 생성·저장 및 salary_calculations.deductions 반영.
     *
     * @param request calculationId, grossAmount, taxType, taxRate 등
     * @return 생성된 세금 계산 정보
     */
    SalaryTaxCalculation calculateAdditionalTax(TaxCalculateRequest request);
    
    // 통계 및 분석
    Map<String, Object> getSalaryStatistics(LocalDate startDate, LocalDate endDate);
    List<Map<String, Object>> getTopPerformers(LocalDate startDate, LocalDate endDate, int limit);
    BigDecimal calculateTotalSalaryCost(LocalDate startDate, LocalDate endDate);
}

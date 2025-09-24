package com.mindgarden.consultation.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.User;

public interface SalaryManagementService {
    
    // Salary Profile 관리
    List<ConsultantSalaryProfile> getAllSalaryProfiles(String branchCode);
    ConsultantSalaryProfile getSalaryProfileById(Long id);
    ConsultantSalaryProfile createSalaryProfile(ConsultantSalaryProfile salaryProfile);
    ConsultantSalaryProfile updateSalaryProfile(ConsultantSalaryProfile salaryProfile);
    void deleteSalaryProfile(Long id);
    
    // Consultant 관리
    List<User> getConsultantsForSalary(String branchCode);
    List<Map<String, Object>> getConsultantSalarySummary(Long consultantId, String period);
    
    // Salary Calculation 관리
    List<SalaryCalculation> getSalaryCalculations(String branchCode, LocalDate startDate, LocalDate endDate);
    SalaryCalculation calculateSalary(Long consultantId, Long profileId, LocalDate periodStart, LocalDate periodEnd);
    SalaryCalculation approveSalaryCalculation(Long calculationId, String approvedBy);
    SalaryCalculation markAsPaid(Long calculationId, String paidBy);
    
    // 프론트엔드 호환성을 위한 메서드들
    List<SalaryCalculation> getSalaryCalculations(Long consultantId, String branchCode);
    Map<String, Object> getTaxDetails(Long calculationId, String branchCode);
    Map<String, Object> getTaxStatistics(String period, String branchCode);
    
    // 통계 및 분석
    Map<String, Object> getSalaryStatistics(String branchCode, LocalDate startDate, LocalDate endDate);
    List<Map<String, Object>> getTopPerformers(String branchCode, LocalDate startDate, LocalDate endDate, int limit);
    BigDecimal calculateTotalSalaryCost(String branchCode, LocalDate startDate, LocalDate endDate);
}

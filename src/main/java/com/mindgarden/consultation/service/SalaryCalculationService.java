package com.mindgarden.consultation.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.ConsultantSalaryOption;
import com.mindgarden.consultation.entity.ConsultantSalaryProfile;
import com.mindgarden.consultation.entity.SalaryCalculation;

/**
 * 급여 계산 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
public interface SalaryCalculationService {
    
    // ==================== 급여 프로필 관리 ====================
    
    /**
     * 상담사 급여 프로필 생성
     */
    ConsultantSalaryProfile createSalaryProfile(Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms);
    ConsultantSalaryProfile createSalaryProfile(Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms, Boolean isBusinessRegistered);
    ConsultantSalaryProfile createSalaryProfile(Long consultantId, String salaryType, BigDecimal baseSalary, String contractTerms, Boolean isBusinessRegistered, String businessRegistrationNumber, String businessName);
    
    /**
     * 상담사 급여 프로필 조회
     */
    ConsultantSalaryProfile getSalaryProfile(Long consultantId);
    
    /**
     * 상담사 급여 프로필 수정
     */
    ConsultantSalaryProfile updateSalaryProfile(Long consultantId, ConsultantSalaryProfile updatedProfile);
    
    /**
     * 상담사 급여 프로필 비활성화
     */
    boolean deactivateSalaryProfile(Long consultantId);
    
    /**
     * 모든 급여 프로필 조회
     */
    List<ConsultantSalaryProfile> getAllSalaryProfiles();
    
    // ==================== 급여 옵션 관리 ====================
    
    /**
     * 급여 옵션 추가
     */
    ConsultantSalaryOption addSalaryOption(Long salaryProfileId, String optionType, BigDecimal optionAmount, String description);
    
    /**
     * 급여 옵션 조회
     */
    List<ConsultantSalaryOption> getSalaryOptions(Long salaryProfileId);
    
    /**
     * 급여 옵션 수정
     */
    ConsultantSalaryOption updateSalaryOption(Long optionId, BigDecimal optionAmount, String description);
    
    /**
     * 급여 옵션 삭제
     */
    boolean removeSalaryOption(Long optionId);
    
    // ==================== 급여 계산 ====================
    
    /**
     * 중복된 급여 계산 기록 정리 (0원 계산 제거)
     */
    int cleanupDuplicateCalculations();
    
    /**
     * 프리랜서 급여 계산 (기본 급여일: 10일)
     */
    SalaryCalculation calculateFreelanceSalary(Long consultantId, String period, List<Map<String, Object>> consultations);
    
    /**
     * 프리랜서 급여 계산 (지정 급여일)
     */
    SalaryCalculation calculateFreelanceSalary(Long consultantId, String period, List<Map<String, Object>> consultations, String payDayCode);
    
    /**
     * 정규직 급여 계산 (기본 급여일: 10일)
     */
    SalaryCalculation calculateRegularSalary(Long consultantId, String period, BigDecimal baseSalary);
    
    /**
     * 정규직 급여 계산 (지정 급여일)
     */
    SalaryCalculation calculateRegularSalary(Long consultantId, String period, BigDecimal baseSalary, String payDayCode);
    
    /**
     * 급여 계산 내역 조회
     */
    List<SalaryCalculation> getSalaryCalculations(Long consultantId);
    
    /**
     * 특정 기간 급여 계산 조회
     */
    SalaryCalculation getSalaryCalculationByPeriod(Long consultantId, String period);
    
    /**
     * 급여 계산 승인
     */
    boolean approveSalaryCalculation(Long calculationId);
    
    /**
     * 급여 지급 완료 처리
     */
    boolean markSalaryAsPaid(Long calculationId);
    
    // ==================== 급여 통계 ====================
    
    /**
     * 상담사별 총 급여 조회
     */
    BigDecimal getTotalSalaryByConsultant(Long consultantId);
    
    /**
     * 월별 급여 통계
     */
    Map<String, Object> getMonthlySalaryStatistics(String period);
    
    /**
     * 급여 유형별 통계
     */
    Map<String, Object> getSalaryTypeStatistics();
    
    /**
     * 승인 대기 중인 급여 목록
     */
    List<SalaryCalculation> getPendingApprovalSalaries();
    
    /**
     * 지급 대기 중인 급여 목록
     */
    List<SalaryCalculation> getPendingPaymentSalaries();
}

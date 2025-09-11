package com.mindgarden.consultation.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import com.mindgarden.consultation.entity.SalaryTaxCalculation;

/**
 * 세금 계산 서비스 인터페이스
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
public interface TaxCalculationService {
    
    // ==================== 세금 계산 ====================
    
    /**
     * 프리랜서 세금 계산 (원천징수 3.3%)
     */
    List<SalaryTaxCalculation> calculateFreelanceTax(Long calculationId, BigDecimal grossAmount);
    
    /**
     * 프리랜서 세금 계산 (사업자 등록 여부에 따라)
     */
    List<SalaryTaxCalculation> calculateFreelanceTax(Long calculationId, BigDecimal grossAmount, boolean isBusinessRegistered);
    
    /**
     * 정규직 세금 계산 (소득세 누진세율)
     */
    List<SalaryTaxCalculation> calculateRegularTax(Long calculationId, BigDecimal grossAmount);
    
    /**
     * 센터 부가세 계산 (10%)
     */
    List<SalaryTaxCalculation> calculateCenterVAT(Long calculationId, BigDecimal grossAmount);
    
    /**
     * 추가 세금 계산 (사용자 정의)
     */
    List<SalaryTaxCalculation> calculateAdditionalTax(Long calculationId, BigDecimal grossAmount, String taxType, BigDecimal taxRate);
    
    // ==================== 세금 조회 ====================
    
    /**
     * 급여 계산 ID로 세금 내역 조회
     */
    List<SalaryTaxCalculation> getTaxCalculationsByCalculationId(Long calculationId);
    
    /**
     * 세금 유형별 세금 내역 조회
     */
    List<SalaryTaxCalculation> getTaxCalculationsByType(String taxType);
    
    /**
     * 기간별 세금 총액 조회
     */
    BigDecimal getTotalTaxAmountByPeriod(String period);
    
    /**
     * 상담사별 세금 총액 조회
     */
    BigDecimal getTotalTaxAmountByConsultantId(Long consultantId);
    
    /**
     * 세금 통계 조회
     */
    Map<String, Object> getTaxStatistics(String period);
    
    // ==================== 세금 관리 ====================
    
    /**
     * 세금 계산 생성
     */
    SalaryTaxCalculation createTaxCalculation(Long calculationId, String taxType, String taxName, 
                                            BigDecimal taxRate, BigDecimal taxableAmount, String description);
    
    /**
     * 세금 계산 수정
     */
    SalaryTaxCalculation updateTaxCalculation(Long taxCalculationId, BigDecimal taxRate, 
                                            BigDecimal taxableAmount, String description);
    
    /**
     * 세금 계산 삭제 (비활성화)
     */
    boolean deactivateTaxCalculation(Long taxCalculationId);
    
    /**
     * 세금 계산 저장
     */
    SalaryTaxCalculation saveTaxCalculation(SalaryTaxCalculation taxCalculation);
}

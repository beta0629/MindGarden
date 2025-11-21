package com.coresolution.consultation.repository;

import java.util.List;
import com.coresolution.consultation.entity.SalaryTaxCalculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 급여 세금 계산 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Repository
public interface SalaryTaxCalculationRepository extends JpaRepository<SalaryTaxCalculation, Long> {
    
    /**
     * 급여 계산 ID로 세금 계산 내역 조회
     */
    List<SalaryTaxCalculation> findByCalculationIdOrderByCreatedAtDesc(Long calculationId);
    
    /**
     * 급여 계산 ID와 활성 상태로 세금 계산 내역 조회
     */
    List<SalaryTaxCalculation> findByCalculationIdAndIsActiveTrueOrderByCreatedAtDesc(Long calculationId);
    
    /**
     * 세금 유형별 세금 계산 내역 조회
     */
    List<SalaryTaxCalculation> findByTaxTypeAndIsActiveTrueOrderByCreatedAtDesc(String taxType);
    
    /**
     * 기간별 세금 총액 조회
     */
    @Query("SELECT SUM(stc.taxAmount) FROM SalaryTaxCalculation stc " +
           "WHERE stc.isActive = true")
    java.math.BigDecimal getTotalTaxAmountByPeriod(@Param("period") String period);
    
    /**
     * 상담사별 세금 총액 조회
     */
    @Query("SELECT SUM(stc.taxAmount) FROM SalaryTaxCalculation stc " +
           "JOIN SalaryCalculation sc ON stc.calculationId = sc.id " +
           "WHERE sc.consultant.id = :consultantId AND stc.isActive = true")
    java.math.BigDecimal getTotalTaxAmountByConsultantId(@Param("consultantId") Long consultantId);
    
    /**
     * 세금 유형별 총액 조회
     */
    @Query("SELECT stc.taxType, SUM(stc.taxAmount) FROM SalaryTaxCalculation stc " +
           "WHERE stc.isActive = true " +
           "GROUP BY stc.taxType")
    List<Object[]> getTotalTaxAmountByTaxType();
    
    /**
     * 프론트엔드 호환성을 위한 세금 상세 조회
     */
    @Query("SELECT new map(stc.taxType as taxType, stc.taxAmount as taxAmount, " +
           "stc.taxRate as taxRate, stc.baseAmount as baseAmount, " +
           "stc.description as description) " +
           "FROM SalaryTaxCalculation stc " +
           "JOIN SalaryCalculation sc ON stc.calculationId = sc.id " +
           "WHERE stc.calculationId = :calculationId " +
           "AND sc.consultant.branchCode = :branchCode " +
           "AND stc.isActive = true " +
           "ORDER BY stc.createdAt DESC")
    List<java.util.Map<String, Object>> findByCalculationIdAndBranchCode(
            @Param("calculationId") Long calculationId,
            @Param("branchCode") String branchCode);
}

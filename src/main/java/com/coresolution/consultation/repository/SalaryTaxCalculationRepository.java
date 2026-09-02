package com.coresolution.consultation.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import com.coresolution.consultation.entity.SalaryCalculation;
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
    BigDecimal getTotalTaxAmountByPeriod(@Param("period") String period);
    
    /**
     * 상담사별 세금 총액 조회
     */
    @Query("SELECT SUM(stc.taxAmount) FROM SalaryTaxCalculation stc " +
           "JOIN SalaryCalculation sc ON stc.calculationId = sc.id " +
           "WHERE sc.consultant.id = :consultantId AND stc.isActive = true")
    BigDecimal getTotalTaxAmountByConsultantId(@Param("consultantId") Long consultantId);
    
    /**
     * 세금 유형별 총액 조회
     */
    @Query("SELECT stc.taxType, SUM(stc.taxAmount) FROM SalaryTaxCalculation stc " +
           "WHERE stc.isActive = true " +
           "GROUP BY stc.taxType")
    List<Object[]> getTotalTaxAmountByTaxType();
    
    /**
     * 급여 계산 ID 목록에 대한 세목별 세금 합계 (2차 세금 연동 - 통계 breakdown)
     */
    @Query("SELECT stc.taxType, SUM(stc.taxAmount) FROM SalaryTaxCalculation stc " +
           "WHERE stc.calculationId IN :calculationIds AND stc.isActive = true " +
           "GROUP BY stc.taxType")
    List<Object[]> findTaxAmountSumsByCalculationIds(@Param("calculationIds") List<Long> calculationIds);

    /**
     * 테넌트·기간·상태 기준 저장된 급여 세액을 월·세목별로 합산한다 (세율 재계산 없음).
     * <p>
     * 반환 행: [0]=month(Integer 1~12), [1]=taxType(String), [2]=SUM(taxAmount)(BigDecimal)
     * </p>
     *
     * @param tenantId  테넌트 ID
     * @param status    급여 상태 (예: CALCULATED)
     * @param startDate 기간 시작 (포함)
     * @param endDate   기간 종료 (포함)
     * @return 월·세목별 저장 세액 합계 행
     */
    @Query("SELECT MONTH(sc.calculationPeriodStart), stc.taxType, COALESCE(SUM(stc.taxAmount), 0) "
            + "FROM SalaryTaxCalculation stc "
            + "JOIN SalaryCalculation sc ON stc.calculationId = sc.id "
            + "WHERE sc.tenantId = :tenantId "
            + "AND sc.status = :status "
            + "AND sc.isDeleted = false "
            + "AND stc.isActive = true "
            + "AND sc.calculationPeriodStart BETWEEN :startDate AND :endDate "
            + "GROUP BY MONTH(sc.calculationPeriodStart), stc.taxType "
            + "ORDER BY MONTH(sc.calculationPeriodStart), stc.taxType")
    List<Object[]> findStoredTaxSumsByTenantAndPeriodRangeGroupedByMonthAndType(
            @Param("tenantId") String tenantId,
            @Param("status") SalaryCalculation.SalaryStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
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
    List<Map<String, Object>> findByCalculationIdAndBranchCode(
            @Param("calculationId") Long calculationId,
            @Param("branchCode") String branchCode);
}

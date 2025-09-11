package com.mindgarden.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.SalaryCalculation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 급여 계산 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-11
 */
@Repository
public interface SalaryCalculationRepository extends JpaRepository<SalaryCalculation, Long> {
    
    /**
     * 상담사 ID로 급여 계산 내역 조회
     */
    List<SalaryCalculation> findByConsultantIdOrderByCreatedAtDesc(Long consultantId);
    
    /**
     * 상담사 ID와 기간으로 급여 계산 내역 조회
     */
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.consultantId = :consultantId AND sc.calculationPeriod = :period")
    Optional<SalaryCalculation> findByConsultantIdAndPeriod(@Param("consultantId") Long consultantId, @Param("period") String period);
    
    /**
     * 상담사 ID와 기간으로 급여 계산 내역 조회 (리스트)
     */
    List<SalaryCalculation> findByConsultantIdAndCalculationPeriod(Long consultantId, String calculationPeriod);
    
    /**
     * 상담사 ID로 급여 계산 내역 조회 (정렬 없음)
     */
    List<SalaryCalculation> findByConsultantId(Long consultantId);
    
    /**
     * 고유한 상담사 ID 목록 조회
     */
    @Query("SELECT DISTINCT sc.consultantId FROM SalaryCalculation sc")
    List<Long> findDistinctConsultantIds();
    
    /**
     * 상태별 급여 계산 내역 조회
     */
    List<SalaryCalculation> findByStatusOrderByCreatedAtDesc(String status);
    
    /**
     * 기간별 급여 계산 내역 조회
     */
    List<SalaryCalculation> findByCalculationPeriodOrderByCreatedAtDesc(String period);
    
    /**
     * 상담사 ID와 상태로 급여 계산 내역 조회
     */
    List<SalaryCalculation> findByConsultantIdAndStatusOrderByCreatedAtDesc(Long consultantId, String status);
    
    /**
     * 승인 대기 중인 급여 계산 내역 조회
     */
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.status = 'CALCULATED' ORDER BY sc.createdAt ASC")
    List<SalaryCalculation> findPendingApproval();
    
    /**
     * 지급 대기 중인 급여 계산 내역 조회
     */
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.status = 'APPROVED' ORDER BY sc.approvedAt ASC")
    List<SalaryCalculation> findPendingPayment();
    
    /**
     * 특정 기간의 급여 계산 내역 조회
     */
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.createdAt BETWEEN :startDate AND :endDate ORDER BY sc.createdAt DESC")
    List<SalaryCalculation> findByDateRange(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);
    
    /**
     * 상담사별 총 급여 합계 조회
     */
    @Query("SELECT SUM(sc.totalSalary) FROM SalaryCalculation sc WHERE sc.consultantId = :consultantId AND sc.status = 'PAID'")
    java.math.BigDecimal getTotalPaidSalaryByConsultantId(@Param("consultantId") Long consultantId);
    
    /**
     * 월별 급여 통계 조회
     */
    @Query("SELECT sc.calculationPeriod, COUNT(sc), SUM(sc.totalSalary), AVG(sc.totalSalary) " +
           "FROM SalaryCalculation sc WHERE sc.status = 'PAID' " +
           "GROUP BY sc.calculationPeriod ORDER BY sc.calculationPeriod DESC")
    List<Object[]> getMonthlySalaryStatistics();
}

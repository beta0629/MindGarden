package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaryCalculationRepository extends JpaRepository<SalaryCalculation, Long> {
    
    List<SalaryCalculation> findByConsultantAndCalculationPeriodStartBetween(
            User consultant, LocalDate startDate, LocalDate endDate);
    
    List<SalaryCalculation> findByBranchCodeAndCalculationPeriodStartBetween(
            String branchCode, LocalDate startDate, LocalDate endDate);
    
    List<SalaryCalculation> findByStatusAndCalculationPeriodStartBetween(
            SalaryCalculation.SalaryStatus status, LocalDate startDate, LocalDate endDate);
    
    /**
     * 테넌트별 상담사와 기간으로 급여 계산 조회 (테넌트 필터링)
     */
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.tenantId = :tenantId AND sc.consultant = :consultant " +
           "AND sc.calculationPeriodStart = :periodStart " +
           "AND sc.calculationPeriodEnd = :periodEnd")
    Optional<SalaryCalculation> findByTenantIdAndConsultantAndPeriod(
            @Param("tenantId") String tenantId,
            @Param("consultant") User consultant,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 상담사 급여 기간별 데이터 노출!
     */
    @Deprecated
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.consultant = :consultant " +
           "AND sc.calculationPeriodStart = :periodStart " +
           "AND sc.calculationPeriodEnd = :periodEnd")
    Optional<SalaryCalculation> findByConsultantAndPeriod(
            @Param("consultant") User consultant,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd);
    
    /**
     * 테넌트별 지점별 최근 급여 계산 조회 (테넌트 필터링)
     */
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.tenantId = :tenantId AND sc.branchCode = :branchCode " +
           "AND sc.calculationPeriodStart BETWEEN :startDate AND :endDate " +
           "ORDER BY sc.calculatedAt DESC")
    List<SalaryCalculation> findRecentCalculationsByTenantIdAndBranch(
            @Param("tenantId") String tenantId,
            @Param("branchCode") String branchCode,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    /**
     * @Deprecated - 🚨 극도로 위험: 모든 테넌트 지점별 급여 계산 데이터 노출!
     */
    @Deprecated
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.branchCode = :branchCode " +
           "AND sc.calculationPeriodStart BETWEEN :startDate AND :endDate " +
           "ORDER BY sc.calculatedAt DESC")
    List<SalaryCalculation> findRecentCalculationsByBranch(
            @Param("branchCode") String branchCode,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);
    
    // 프론트엔드 호환성을 위한 메서드
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.consultant.id = :consultantId " +
           "AND sc.consultant.branchCode = :branchCode " +
           "ORDER BY sc.calculatedAt DESC")
    List<SalaryCalculation> findByConsultantIdAndConsultantBranchCode(
            @Param("consultantId") Long consultantId,
            @Param("branchCode") String branchCode);
    
    /**
     * 만료된 급여 데이터 조회 (파기용)
     */
    @Query("SELECT sc.id, u.name FROM SalaryCalculation sc JOIN User u ON sc.consultant.id = u.id WHERE sc.updatedAt < ?1")
    List<Object[]> findExpiredSalariesForDestruction(java.time.LocalDateTime cutoffDate);
}
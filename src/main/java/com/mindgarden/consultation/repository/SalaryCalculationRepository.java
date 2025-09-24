package com.mindgarden.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.SalaryCalculation;
import com.mindgarden.consultation.entity.User;
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
    
    @Query("SELECT sc FROM SalaryCalculation sc WHERE sc.consultant = :consultant " +
           "AND sc.calculationPeriodStart = :periodStart " +
           "AND sc.calculationPeriodEnd = :periodEnd")
    Optional<SalaryCalculation> findByConsultantAndPeriod(
            @Param("consultant") User consultant,
            @Param("periodStart") LocalDate periodStart,
            @Param("periodEnd") LocalDate periodEnd);
    
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
}
package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.SalaryCalculation;
import com.coresolution.consultation.entity.User;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Repository;

@Repository
public interface SalaryCalculationRepository extends BaseRepository<SalaryCalculation, Long> {
    
    /**
     * @deprecated 테넌트 격리 없음. {@link #findByTenantIdAndConsultantAndCalculationPeriodStartBetween} 사용
     */
    @Deprecated
    List<SalaryCalculation> findByConsultantAndCalculationPeriodStartBetween(
            User consultant, LocalDate startDate, LocalDate endDate);

    /**
     * @deprecated 테넌트 격리 없음. {@link #findRecentCalculationsByTenantIdAndBranch} 사용
     */
    @Deprecated
    List<SalaryCalculation> findByBranchCodeAndCalculationPeriodStartBetween(
            String branchCode, LocalDate startDate, LocalDate endDate);

    /**
     * @deprecated 테넌트 격리 없음. {@link #findByTenantIdAndStatusAndCalculationPeriodStartBetween} 사용
     */
    @Deprecated
    List<SalaryCalculation> findByStatusAndCalculationPeriodStartBetween(
            SalaryCalculation.SalaryStatus status, LocalDate startDate, LocalDate endDate);

    /**
     * 테넌트·상담사별 급여 계산 조회 (테넌트 격리 필수)
     *
     * @param tenantId     테넌트 ID
     * @param consultantId 상담사 ID
     * @return 해당 테넌트·상담사의 급여 계산 목록 (최신순)
     */
    List<SalaryCalculation> findByTenantIdAndConsultant_IdOrderByCalculatedAtDesc(
            String tenantId, Long consultantId);

    /**
     * ID로 급여 계산 조회 (consultant fetch join, 세금 상세 등에서 NPE 방지)
     *
     * @param id 급여 계산 ID
     * @return 급여 계산 (consultant 로딩됨) 또는 empty
     */
    @Query("SELECT sc FROM SalaryCalculation sc LEFT JOIN FETCH sc.consultant WHERE sc.id = :id")
    Optional<SalaryCalculation> findByIdWithConsultant(@Param("id") @NonNull Long id);

    /**
     * 테넌트·상태·기간별 급여 계산 조회 (테넌트 격리 필수)
     *
     * @param tenantId   테넌트 ID
     * @param status     급여 상태
     * @param startDate  기간 시작
     * @param endDate    기간 종료
     * @return 해당 테넌트의 기간 내 급여 계산 목록
     */
    List<SalaryCalculation> findByTenantIdAndStatusAndCalculationPeriodStartBetween(
            String tenantId,
            SalaryCalculation.SalaryStatus status,
            LocalDate startDate,
            LocalDate endDate);

    /**
     * 테넌트·상담사·기간별 급여 계산 조회 (getConsultantSalarySummary용, 테넌트 격리 필수)
     *
     * @param tenantId   테넌트 ID
     * @param consultant 상담사 엔티티
     * @param startDate  기간 시작
     * @param endDate    기간 종료
     * @return 해당 테넌트·상담사의 기간 내 급여 계산 목록
     */
    List<SalaryCalculation> findByTenantIdAndConsultantAndCalculationPeriodStartBetween(
            String tenantId,
            User consultant,
            LocalDate startDate,
            LocalDate endDate);

    /**
     * 테넌트·상태·기간별 급여 계산 조회 (consultant fetch join, getTopPerformers NPE 방지)
     *
     * @param tenantId   테넌트 ID
     * @param status     급여 상태
     * @param startDate  기간 시작
     * @param endDate    기간 종료
     * @return 해당 테넌트의 기간 내 급여 계산 목록 (consultant 로딩됨)
     */
    @Query("SELECT sc FROM SalaryCalculation sc LEFT JOIN FETCH sc.consultant " +
           "WHERE sc.tenantId = :tenantId AND sc.status = :status " +
           "AND sc.calculationPeriodStart BETWEEN :startDate AND :endDate")
    List<SalaryCalculation> findByTenantIdAndStatusAndCalculationPeriodStartBetweenWithConsultant(
            @Param("tenantId") String tenantId,
            @Param("status") SalaryCalculation.SalaryStatus status,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate);

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
    
    /**
     * @deprecated 테넌트 격리 없음. {@link #findByTenantIdAndConsultant_IdOrderByCalculatedAtDesc} 사용
     */
    @Deprecated
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
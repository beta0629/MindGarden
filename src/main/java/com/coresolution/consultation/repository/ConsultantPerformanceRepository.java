package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ConsultantPerformance;
import com.coresolution.consultation.entity.ConsultantPerformanceId;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담사 성과 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Repository
/**
 * @Deprecated - 표준화 2025-12-07: branchCode 파라미터는 레거시 호환용
 */
public interface ConsultantPerformanceRepository extends JpaRepository<ConsultantPerformance, ConsultantPerformanceId> {

    // ==================== tenantId 필터링 메서드 ====================

    /**
     * 특정 상담사의 기간별 성과 조회 (tenantId 필터링)
     */
    @Query("SELECT cp FROM ConsultantPerformance cp WHERE cp.tenantId = :tenantId AND cp.consultantId = :consultantId AND cp.performanceDate BETWEEN :startDate AND :endDate ORDER BY cp.performanceDate DESC")
    List<ConsultantPerformance> findByTenantIdAndConsultantIdAndPerformanceDateBetweenOrderByPerformanceDateDesc(
            @Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate);

    /**
     * 테넌트·상담사·일자 단건 성과 조회 (복합 PK 대체, 크로스 테넌트 방지)
     */
    @Query("SELECT cp FROM ConsultantPerformance cp WHERE cp.tenantId = :tenantId AND cp.consultantId = :consultantId AND cp.performanceDate = :performanceDate")
    Optional<ConsultantPerformance> findByTenantIdAndConsultantIdAndPerformanceDate(
            @Param("tenantId") String tenantId,
            @Param("consultantId") Long consultantId,
            @Param("performanceDate") LocalDate performanceDate);

    /**
     * 특정 날짜의 모든 상담사 성과 조회 (tenantId 필터링)
     */
    @Query("SELECT cp FROM ConsultantPerformance cp WHERE cp.tenantId = :tenantId AND cp.performanceDate = :performanceDate ORDER BY cp.performanceScore DESC")
    List<ConsultantPerformance> findByTenantIdAndPerformanceDateOrderByPerformanceScoreDesc(@Param("tenantId") String tenantId, @Param("performanceDate") LocalDate performanceDate);

    /**
     * 성과 점수 기준 상위 상담사 조회 (지점별) (tenantId 필터링)
     */
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.tenantId = :tenantId " +
           "AND cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND cp.consultant.branchCode = :branchCode " +
           "ORDER BY cp.performanceScore DESC")
    Page<ConsultantPerformance> findTopPerformersByTenantIdAndBranch(@Param("tenantId") String tenantId,
                                                                      @Param("startDate") LocalDate startDate,
                                                                      @Param("endDate") LocalDate endDate,
                                                                      @Param("branchCode") String branchCode,
                                                                      Pageable pageable);

    /**
     * 전체 상위 성과자 조회 (tenantId 필터링)
     */
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.tenantId = :tenantId " +
           "AND cp.performanceDate BETWEEN :startDate AND :endDate " +
           "ORDER BY cp.performanceScore DESC")
    Page<ConsultantPerformance> findTopPerformersByTenantId(@Param("tenantId") String tenantId,
                                                             @Param("startDate") LocalDate startDate,
                                                             @Param("endDate") LocalDate endDate,
                                                             Pageable pageable);

    /**
     * 상담사의 최근 성과 조회 (tenantId 필터링)
     */
    @Query("SELECT cp FROM ConsultantPerformance cp WHERE cp.tenantId = :tenantId AND cp.consultantId = :consultantId ORDER BY cp.performanceDate DESC")
    Optional<ConsultantPerformance> findTopByTenantIdAndConsultantIdOrderByPerformanceDateDesc(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);

    /**
     * 성과 저하 상담사 조회 (완료율 기준) (tenantId 필터링)
     */
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.tenantId = :tenantId " +
           "AND cp.performanceDate = :date " +
           "AND cp.completionRate < :threshold " +
           "AND cp.consultant.branchCode = :branchCode " +
           "ORDER BY cp.completionRate ASC")
    List<ConsultantPerformance> findUnderperformingConsultantsByTenantId(@Param("tenantId") String tenantId,
                                                                          @Param("date") LocalDate date,
                                                                          @Param("threshold") Double threshold,
                                                                          @Param("branchCode") String branchCode);

    /**
     * 등급별 상담사 수 조회 (tenantId 필터링)
     */
    @Query("SELECT cp.grade, COUNT(cp) FROM ConsultantPerformance cp " +
           "WHERE cp.tenantId = :tenantId " +
           "AND cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND (CAST(:branchCode AS string) IS NULL OR cp.consultant.branchCode = :branchCode) " +
           "GROUP BY cp.grade " +
           "ORDER BY cp.grade")
    List<Object[]> getGradeDistributionByTenantId(@Param("tenantId") String tenantId,
                                                   @Param("startDate") LocalDate startDate,
                                                   @Param("endDate") LocalDate endDate,
                                                   @Param("branchCode") String branchCode);

    /**
     * 상담사별 성과 트렌드 분석 (tenantId 필터링)
     */
    @Query("SELECT cp.consultantId, cp.performanceDate, cp.performanceScore, " +
           "LAG(cp.performanceScore) OVER (PARTITION BY cp.consultantId ORDER BY cp.performanceDate) as prevScore " +
           "FROM ConsultantPerformance cp " +
           "WHERE cp.tenantId = :tenantId " +
           "AND cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND cp.consultantId = :consultantId " +
           "ORDER BY cp.performanceDate")
    List<Object[]> getPerformanceTrendByTenantId(@Param("tenantId") String tenantId,
                                                  @Param("consultantId") Long consultantId,
                                                  @Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate);

    /**
     * 지점별 평균 성과 조회 (tenantId 필터링)
     */
    @Query("SELECT cp.consultant.branchCode, " +
           "AVG(cp.performanceScore) as avgScore, " +
           "AVG(cp.completionRate) as avgCompletionRate, " +
           "AVG(cp.avgRating) as avgRating, " +
           "COUNT(cp) as consultantCount " +
           "FROM ConsultantPerformance cp " +
           "WHERE cp.tenantId = :tenantId " +
           "AND cp.performanceDate BETWEEN :startDate AND :endDate " +
           "GROUP BY cp.consultant.branchCode " +
           "ORDER BY avgScore DESC")
    List<Object[]> getBranchPerformanceAveragesByTenantId(@Param("tenantId") String tenantId,
                                                           @Param("startDate") LocalDate startDate,
                                                           @Param("endDate") LocalDate endDate);

    /**
     * 월별 성과 집계 (tenantId 필터링)
     */
    @Query("SELECT FUNCTION('DATE_FORMAT', cp.performanceDate, '%Y-%m') as month, " +
           "AVG(cp.performanceScore) as avgScore, " +
           "AVG(cp.completionRate) as avgCompletionRate, " +
           "COUNT(cp) as consultantCount " +
           "FROM ConsultantPerformance cp " +
           "WHERE cp.tenantId = :tenantId " +
           "AND cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND (CAST(:branchCode AS string) IS NULL OR cp.consultant.branchCode = :branchCode) " +
           "GROUP BY FUNCTION('DATE_FORMAT', cp.performanceDate, '%Y-%m') " +
           "ORDER BY month")
    List<Object[]> getMonthlyPerformanceAggregateByTenantId(@Param("tenantId") String tenantId,
                                                             @Param("startDate") LocalDate startDate,
                                                             @Param("endDate") LocalDate endDate,
                                                             @Param("branchCode") String branchCode);

    // ==================== @Deprecated 메서드 (하위 호환성) ====================

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantIdAndPerformanceDateBetweenOrderByPerformanceDateDesc 사용하세요.
     */
    @Deprecated
    List<ConsultantPerformance> findByConsultantIdAndPerformanceDateBetweenOrderByPerformanceDateDesc(
            Long consultantId, LocalDate startDate, LocalDate endDate);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndPerformanceDateOrderByPerformanceScoreDesc 사용하세요.
     */
    @Deprecated
    List<ConsultantPerformance> findByPerformanceDateOrderByPerformanceScoreDesc(LocalDate performanceDate);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findTopPerformersByTenantIdAndBranch 사용하세요.
     */
    @Deprecated
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND cp.consultant.branchCode = :branchCode " +
           "ORDER BY cp.performanceScore DESC")
    Page<ConsultantPerformance> findTopPerformersByBranch(@Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate,
                                                          @Param("branchCode") String branchCode,
                                                          Pageable pageable);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findTopPerformersByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "ORDER BY cp.performanceScore DESC")
    Page<ConsultantPerformance> findTopPerformers(@Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate,
                                                  Pageable pageable);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findTopByTenantIdAndConsultantIdOrderByPerformanceDateDesc 사용하세요.
     */
    @Deprecated
    Optional<ConsultantPerformance> findTopByConsultantIdOrderByPerformanceDateDesc(Long consultantId);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findUnderperformingConsultantsByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate = :date " +
           "AND cp.completionRate < :threshold " +
           "AND cp.consultant.branchCode = :branchCode " +
           "ORDER BY cp.completionRate ASC")
    List<ConsultantPerformance> findUnderperformingConsultants(@Param("date") LocalDate date,
                                                               @Param("threshold") Double threshold,
                                                               @Param("branchCode") String branchCode);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! getGradeDistributionByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT cp.grade, COUNT(cp) FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND (CAST(:branchCode AS string) IS NULL OR cp.consultant.branchCode = :branchCode) " +
           "GROUP BY cp.grade " +
           "ORDER BY cp.grade")
    List<Object[]> getGradeDistribution(@Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate,
                                       @Param("branchCode") String branchCode);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! getPerformanceTrendByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT cp.consultantId, cp.performanceDate, cp.performanceScore, " +
           "LAG(cp.performanceScore) OVER (PARTITION BY cp.consultantId ORDER BY cp.performanceDate) as prevScore " +
           "FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND cp.consultantId = :consultantId " +
           "ORDER BY cp.performanceDate")
    List<Object[]> getPerformanceTrend(@Param("consultantId") Long consultantId,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! getBranchPerformanceAveragesByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT cp.consultant.branchCode, " +
           "AVG(cp.performanceScore) as avgScore, " +
           "AVG(cp.completionRate) as avgCompletionRate, " +
           "AVG(cp.avgRating) as avgRating, " +
           "COUNT(cp) as consultantCount " +
           "FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "GROUP BY cp.consultant.branchCode " +
           "ORDER BY avgScore DESC")
    List<Object[]> getBranchPerformanceAverages(@Param("startDate") LocalDate startDate,
                                               @Param("endDate") LocalDate endDate);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! getMonthlyPerformanceAggregateByTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT FUNCTION('DATE_FORMAT', cp.performanceDate, '%Y-%m') as month, " +
           "AVG(cp.performanceScore) as avgScore, " +
           "AVG(cp.completionRate) as avgCompletionRate, " +
           "COUNT(cp) as consultantCount " +
           "FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND (CAST(:branchCode AS string) IS NULL OR cp.consultant.branchCode = :branchCode) " +
           "GROUP BY FUNCTION('DATE_FORMAT', cp.performanceDate, '%Y-%m') " +
           "ORDER BY month")
    List<Object[]> getMonthlyPerformanceAggregate(@Param("startDate") LocalDate startDate,
                                                 @Param("endDate") LocalDate endDate,
                                                 @Param("branchCode") String branchCode);
}

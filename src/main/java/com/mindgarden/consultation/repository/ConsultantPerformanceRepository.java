package com.mindgarden.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.mindgarden.consultation.entity.ConsultantPerformance;
import com.mindgarden.consultation.entity.ConsultantPerformanceId;
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
public interface ConsultantPerformanceRepository extends JpaRepository<ConsultantPerformance, ConsultantPerformanceId> {

    /**
     * 특정 상담사의 기간별 성과 조회
     */
    List<ConsultantPerformance> findByConsultantIdAndPerformanceDateBetweenOrderByPerformanceDateDesc(
            Long consultantId, LocalDate startDate, LocalDate endDate);

    /**
     * 특정 날짜의 모든 상담사 성과 조회
     */
    List<ConsultantPerformance> findByPerformanceDateOrderByPerformanceScoreDesc(LocalDate performanceDate);

    /**
     * 성과 점수 기준 상위 상담사 조회
     */
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND cp.consultant.branchCode = :branchCode " +
           "ORDER BY cp.performanceScore DESC")
    Page<ConsultantPerformance> findTopPerformersByBranch(@Param("startDate") LocalDate startDate,
                                                          @Param("endDate") LocalDate endDate,
                                                          @Param("branchCode") String branchCode,
                                                          Pageable pageable);

    /**
     * 전체 상위 성과자 조회
     */
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "ORDER BY cp.performanceScore DESC")
    Page<ConsultantPerformance> findTopPerformers(@Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate,
                                                  Pageable pageable);

    /**
     * 상담사의 최근 성과 조회
     */
    Optional<ConsultantPerformance> findTopByConsultantIdOrderByPerformanceDateDesc(Long consultantId);

    /**
     * 성과 저하 상담사 조회 (완료율 기준)
     */
    @Query("SELECT cp FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate = :date " +
           "AND cp.completionRate < :threshold " +
           "AND cp.consultant.branchCode = :branchCode " +
           "ORDER BY cp.completionRate ASC")
    List<ConsultantPerformance> findUnderperformingConsultants(@Param("date") LocalDate date,
                                                               @Param("threshold") Double threshold,
                                                               @Param("branchCode") String branchCode);

    /**
     * 등급별 상담사 수 조회
     */
    @Query("SELECT cp.grade, COUNT(cp) FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND (:branchCode IS NULL OR cp.consultant.branchCode = :branchCode) " +
           "GROUP BY cp.grade " +
           "ORDER BY cp.grade")
    List<Object[]> getGradeDistribution(@Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate,
                                       @Param("branchCode") String branchCode);

    /**
     * 상담사별 성과 트렌드 분석
     */
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
     * 지점별 평균 성과 조회
     */
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
     * 월별 성과 집계
     */
    @Query("SELECT FUNCTION('DATE_FORMAT', cp.performanceDate, '%Y-%m') as month, " +
           "AVG(cp.performanceScore) as avgScore, " +
           "AVG(cp.completionRate) as avgCompletionRate, " +
           "COUNT(cp) as consultantCount " +
           "FROM ConsultantPerformance cp " +
           "WHERE cp.performanceDate BETWEEN :startDate AND :endDate " +
           "AND (:branchCode IS NULL OR cp.consultant.branchCode = :branchCode) " +
           "GROUP BY FUNCTION('DATE_FORMAT', cp.performanceDate, '%Y-%m') " +
           "ORDER BY month")
    List<Object[]> getMonthlyPerformanceAggregate(@Param("startDate") LocalDate startDate,
                                                 @Param("endDate") LocalDate endDate,
                                                 @Param("branchCode") String branchCode);
}

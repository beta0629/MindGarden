package com.coresolution.consultation.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.DailyStatistics;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 일별 통계 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Repository
public interface DailyStatisticsRepository extends JpaRepository<DailyStatistics, Long> {

    /**
     * 특정 날짜와 지점의 통계 조회
     */
    Optional<DailyStatistics> findByStatDateAndBranchCode(LocalDate statDate, String branchCode);

    /**
     * 특정 지점의 기간별 통계 조회
     */
    List<DailyStatistics> findByBranchCodeAndStatDateBetweenOrderByStatDateDesc(
            String branchCode, LocalDate startDate, LocalDate endDate);

    /**
     * 전체 지점의 기간별 통계 조회
     */
    List<DailyStatistics> findByStatDateBetweenOrderByStatDateDesc(
            LocalDate startDate, LocalDate endDate);

    /**
     * 최근 N일간의 통계 조회
     */
    @Query("SELECT ds FROM DailyStatistics ds " +
           "WHERE ds.statDate >= :startDate " +
           "AND (:branchCode IS NULL OR ds.branchCode = :branchCode) " +
           "ORDER BY ds.statDate DESC")
    List<DailyStatistics> findRecentStatistics(@Param("startDate") LocalDate startDate, 
                                               @Param("branchCode") String branchCode);

    /**
     * 지점별 월별 집계 통계
     */
    @Query("SELECT ds.branchCode, " +
           "SUM(ds.totalConsultations) as totalConsultations, " +
           "SUM(ds.completedConsultations) as completedConsultations, " +
           "SUM(ds.totalRevenue) as totalRevenue, " +
           "AVG(ds.avgRating) as avgRating " +
           "FROM DailyStatistics ds " +
           "WHERE ds.statDate BETWEEN :startDate AND :endDate " +
           "AND (:branchCode IS NULL OR ds.branchCode = :branchCode) " +
           "GROUP BY ds.branchCode " +
           "ORDER BY totalRevenue DESC")
    List<Object[]> getMonthlyAggregatedStatistics(@Param("startDate") LocalDate startDate,
                                                  @Param("endDate") LocalDate endDate,
                                                  @Param("branchCode") String branchCode);

    /**
     * 트렌드 분석을 위한 일별 증감률 계산
     */
    @Query("SELECT ds.statDate, ds.branchCode, ds.totalConsultations, " +
           "LAG(ds.totalConsultations) OVER (PARTITION BY ds.branchCode ORDER BY ds.statDate) as prevConsultations " +
           "FROM DailyStatistics ds " +
           "WHERE ds.statDate BETWEEN :startDate AND :endDate " +
           "AND (:branchCode IS NULL OR ds.branchCode = :branchCode) " +
           "ORDER BY ds.branchCode, ds.statDate")
    List<Object[]> getTrendAnalysisData(@Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate,
                                       @Param("branchCode") String branchCode);

    /**
     * 상위 성과 지점 조회
     */
    @Query("SELECT ds.branchCode, " +
           "SUM(ds.totalRevenue) as totalRevenue, " +
           "AVG(ds.avgRating) as avgRating, " +
           "SUM(ds.completedConsultations) as completedConsultations " +
           "FROM DailyStatistics ds " +
           "WHERE ds.statDate BETWEEN :startDate AND :endDate " +
           "GROUP BY ds.branchCode " +
           "ORDER BY totalRevenue DESC")
    List<Object[]> getTopPerformingBranches(@Param("startDate") LocalDate startDate,
                                           @Param("endDate") LocalDate endDate);

    /**
     * 특정 날짜의 모든 지점 통계 조회
     */
    List<DailyStatistics> findByStatDateOrderByBranchCode(LocalDate statDate);

    /**
     * 통계가 없는 날짜 조회 (데이터 무결성 체크용)
     */
    @Query("SELECT DISTINCT ds.statDate FROM DailyStatistics ds " +
           "WHERE ds.statDate BETWEEN :startDate AND :endDate " +
           "ORDER BY ds.statDate")
    List<LocalDate> findStatisticsDates(@Param("startDate") LocalDate startDate,
                                       @Param("endDate") LocalDate endDate);
}

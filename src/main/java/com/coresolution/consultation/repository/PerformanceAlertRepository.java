package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.entity.PerformanceAlert;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 성과 알림 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-24
 */
@Repository
public interface PerformanceAlertRepository extends JpaRepository<PerformanceAlert, Long> {

    /**
     * 특정 상담사의 알림 조회
     */
    List<PerformanceAlert> findByConsultantIdOrderByCreatedAtDesc(Long consultantId);

    /**
     * 상태별 알림 조회
     */
    List<PerformanceAlert> findByStatusOrderByCreatedAtDesc(PerformanceAlert.AlertStatus status);

    /**
     * 알림 레벨별 조회
     */
    List<PerformanceAlert> findByAlertLevelOrderByCreatedAtDesc(PerformanceAlert.AlertLevel alertLevel);

    /**
     * 미처리 알림 조회 (PENDING 상태)
     */
    @Query("SELECT pa FROM PerformanceAlert pa " +
           "WHERE pa.status = 'PENDING' " +
           "ORDER BY pa.alertLevel DESC, pa.createdAt ASC")
    List<PerformanceAlert> findPendingAlerts();

    /**
     * 특정 기간의 알림 조회
     */
    List<PerformanceAlert> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDate, LocalDateTime endDate);

    /**
     * 상담사별 최근 알림 조회
     */
    @Query("SELECT pa FROM PerformanceAlert pa " +
           "WHERE pa.consultantId = :consultantId " +
           "AND pa.createdAt >= :sinceDate " +
           "ORDER BY pa.createdAt DESC")
    List<PerformanceAlert> findRecentAlertsByConsultant(@Param("consultantId") Long consultantId,
                                                        @Param("sinceDate") LocalDateTime sinceDate);

    /**
     * 긴급 알림 조회 (CRITICAL 레벨)
     */
    @Query("SELECT pa FROM PerformanceAlert pa " +
           "WHERE pa.alertLevel = 'CRITICAL' " +
           "AND pa.status IN ('PENDING', 'SENT') " +
           "ORDER BY pa.createdAt DESC")
    List<PerformanceAlert> findCriticalAlerts();

    /**
     * 상담사별 알림 통계
     */
    @Query("SELECT pa.consultantId, pa.consultantName, " +
           "COUNT(CASE WHEN pa.alertLevel = 'CRITICAL' THEN 1 END) as criticalCount, " +
           "COUNT(CASE WHEN pa.alertLevel = 'WARNING' THEN 1 END) as warningCount, " +
           "COUNT(CASE WHEN pa.alertLevel = 'INFO' THEN 1 END) as infoCount " +
           "FROM PerformanceAlert pa " +
           "WHERE pa.createdAt >= :sinceDate " +
           "GROUP BY pa.consultantId, pa.consultantName " +
           "ORDER BY criticalCount DESC, warningCount DESC")
    List<Object[]> getAlertStatisticsByConsultant(@Param("sinceDate") LocalDateTime sinceDate);

    /**
     * 일별 알림 발생 통계
     */
    @Query("SELECT DATE(pa.createdAt) as alertDate, " +
           "COUNT(pa) as totalAlerts, " +
           "COUNT(CASE WHEN pa.alertLevel = 'CRITICAL' THEN 1 END) as criticalAlerts " +
           "FROM PerformanceAlert pa " +
           "WHERE pa.createdAt BETWEEN :startDate AND :endDate " +
           "GROUP BY DATE(pa.createdAt) " +
           "ORDER BY alertDate")
    List<Object[]> getDailyAlertStatistics(@Param("startDate") LocalDateTime startDate,
                                          @Param("endDate") LocalDateTime endDate);

    /**
     * 읽지 않은 알림 수 조회
     */
    @Query("SELECT COUNT(pa) FROM PerformanceAlert pa " +
           "WHERE pa.consultantId = :consultantId " +
           "AND pa.status = 'SENT' " +
           "AND pa.readAt IS NULL")
    Long countUnreadAlertsByConsultant(@Param("consultantId") Long consultantId);

    /**
     * 페이징된 알림 조회
     */
    Page<PerformanceAlert> findByConsultantIdOrderByCreatedAtDesc(Long consultantId, Pageable pageable);

    /**
     * 중복 알림 방지를 위한 최근 알림 확인
     */
    @Query("SELECT COUNT(pa) FROM PerformanceAlert pa " +
           "WHERE pa.consultantId = :consultantId " +
           "AND pa.alertLevel = :alertLevel " +
           "AND pa.createdAt >= :sinceDate")
    Long countRecentSimilarAlerts(@Param("consultantId") Long consultantId,
                                 @Param("alertLevel") PerformanceAlert.AlertLevel alertLevel,
                                 @Param("sinceDate") LocalDateTime sinceDate);
}

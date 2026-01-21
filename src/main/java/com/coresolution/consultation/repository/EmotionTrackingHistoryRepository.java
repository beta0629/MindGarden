package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.EmotionTrackingHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 감정 변화 추적 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface EmotionTrackingHistoryRepository extends JpaRepository<EmotionTrackingHistory, Long> {

    List<EmotionTrackingHistory> findByClientIdAndIsDeletedFalseOrderBySessionNumberAsc(Long clientId);

    List<EmotionTrackingHistory> findByClientIdAndEmotionTypeAndIsDeletedFalseOrderBySessionNumberAsc(
        Long clientId, String emotionType);

    @Query("SELECT e FROM EmotionTrackingHistory e " +
           "WHERE e.clientId = :clientId " +
           "AND e.measuredAt BETWEEN :startDate AND :endDate " +
           "AND e.isDeleted = false " +
           "ORDER BY e.measuredAt ASC")
    List<EmotionTrackingHistory> findByClientIdAndDateRange(
        @Param("clientId") Long clientId,
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate);

    @Query("SELECT e FROM EmotionTrackingHistory e " +
           "WHERE e.clientId = :clientId " +
           "AND e.trend = 'WORSENING' " +
           "AND e.isDeleted = false " +
           "ORDER BY e.measuredAt DESC")
    List<EmotionTrackingHistory> findWorseningTrendsByClientId(@Param("clientId") Long clientId);
}

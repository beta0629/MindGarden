package com.mindgarden.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.mindgarden.consultation.entity.OpenAIUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * OpenAI 사용 로그 Repository
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-21
 */
@Repository
public interface OpenAIUsageLogRepository extends JpaRepository<OpenAIUsageLog, Long> {
    
    /**
     * 기간별 사용 내역 조회
     */
    List<OpenAIUsageLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
        LocalDateTime startDate, 
        LocalDateTime endDate
    );
    
    /**
     * 월별 총 비용 계산
     */
    @Query("SELECT COALESCE(SUM(log.estimatedCost), 0) FROM OpenAIUsageLog log " +
           "WHERE log.createdAt >= :startDate AND log.createdAt < :endDate " +
           "AND log.isSuccess = true")
    Double calculateMonthlyCost(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * 월별 총 토큰 사용량
     */
    @Query("SELECT COALESCE(SUM(log.totalTokens), 0) FROM OpenAIUsageLog log " +
           "WHERE log.createdAt >= :startDate AND log.createdAt < :endDate " +
           "AND log.isSuccess = true")
    Long calculateMonthlyTokens(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * 월별 API 호출 횟수
     */
    @Query("SELECT COUNT(log) FROM OpenAIUsageLog log " +
           "WHERE log.createdAt >= :startDate AND log.createdAt < :endDate " +
           "AND log.isSuccess = true")
    Long countMonthlyRequests(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * 타입별 사용 통계
     */
    @Query("SELECT log.requestType, COUNT(log), SUM(log.estimatedCost) " +
           "FROM OpenAIUsageLog log " +
           "WHERE log.createdAt >= :startDate AND log.createdAt < :endDate " +
           "AND log.isSuccess = true " +
           "GROUP BY log.requestType")
    List<Object[]> getUsageStatsByType(
        @Param("startDate") LocalDateTime startDate,
        @Param("endDate") LocalDateTime endDate
    );
    
    /**
     * 최근 N개 로그 조회
     */
    List<OpenAIUsageLog> findTop10ByOrderByCreatedAtDesc();
}


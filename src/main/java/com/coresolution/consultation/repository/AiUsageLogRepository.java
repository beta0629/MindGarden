package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.entity.AiUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * AI 사용 로그 Repository (멀티 프로바이더 통합).
 *
 * <p>트랙 B PR-2 리네임 (기획서 §7 Q5=a): 기존 {@code OpenAIUsageLogRepository} 가
 * OpenAI 외 Gemini 등의 호출도 적재함에 따라 provider-prefix 를 제거한다.</p>
 *
 * @author CoreSolution
 * @author MindGarden
 * @since 2025-01-21
 */
@Repository
public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {

    /**
     * 기간별 사용 내역 조회.
     */
    List<AiUsageLog> findByCreatedAtBetweenOrderByCreatedAtDesc(
            LocalDateTime startDate,
            LocalDateTime endDate
    );

    /**
     * 월별 총 비용 계산.
     */
    @Query("SELECT COALESCE(SUM(log.estimatedCost), 0) FROM AiUsageLog log "
            + "WHERE log.createdAt >= :startDate AND log.createdAt < :endDate "
            + "AND log.isSuccess = true")
    Double calculateMonthlyCost(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 월별 총 토큰 사용량.
     */
    @Query("SELECT COALESCE(SUM(log.totalTokens), 0) FROM AiUsageLog log "
            + "WHERE log.createdAt >= :startDate AND log.createdAt < :endDate "
            + "AND log.isSuccess = true")
    Long calculateMonthlyTokens(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 월별 API 호출 횟수.
     */
    @Query("SELECT COUNT(log) FROM AiUsageLog log "
            + "WHERE log.createdAt >= :startDate AND log.createdAt < :endDate "
            + "AND log.isSuccess = true")
    Long countMonthlyRequests(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 타입별 사용 통계.
     */
    @Query("SELECT log.requestType, COUNT(log), SUM(log.estimatedCost) "
            + "FROM AiUsageLog log "
            + "WHERE log.createdAt >= :startDate AND log.createdAt < :endDate "
            + "AND log.isSuccess = true "
            + "GROUP BY log.requestType")
    List<Object[]> getUsageStatsByType(
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 최근 N개 로그 조회.
     */
    List<AiUsageLog> findTop10ByOrderByCreatedAtDesc();

    /**
     * 특정 시점 이후 호출 횟수.
     */
    long countByCreatedAtAfter(LocalDateTime since);

    /**
     * 특정 시점 이후 총 비용.
     */
    @Query("SELECT COALESCE(SUM(log.estimatedCost), 0) FROM AiUsageLog log "
            + "WHERE log.createdAt >= :since AND log.isSuccess = true")
    Double sumEstimatedCostByCreatedAtAfter(@Param("since") LocalDateTime since);
}

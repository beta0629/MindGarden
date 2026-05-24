package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;

import com.coresolution.consultation.entity.AiUsageLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // ============================================================================
    // 트랙 B PR-4 (2026-05-24) — 어드민 AI 프로바이더 관리 페이지 통계·로그 조회
    // 멀티테넌트: 모든 쿼리는 tenantId 필수 필터 (테넌트 격리).
    // ============================================================================

    /**
     * 테넌트별 특정 기간 호출 건수.
     *
     * @param tenantId  테넌트 ID
     * @param startDate 시작 시각 (포함)
     * @param endDate   종료 시각 (제외)
     * @return 호출 건수
     */
    @Query("SELECT COUNT(log) FROM AiUsageLog log "
            + "WHERE log.tenantId = :tenantId "
            + "AND log.createdAt >= :startDate AND log.createdAt < :endDate")
    long countByTenantAndPeriod(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 테넌트별 특정 기간 성공 호출 건수.
     */
    @Query("SELECT COUNT(log) FROM AiUsageLog log "
            + "WHERE log.tenantId = :tenantId "
            + "AND log.createdAt >= :startDate AND log.createdAt < :endDate "
            + "AND log.isSuccess = true")
    long countSuccessByTenantAndPeriod(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 테넌트별 특정 기간 총 토큰 사용량.
     */
    @Query("SELECT COALESCE(SUM(log.totalTokens), 0) FROM AiUsageLog log "
            + "WHERE log.tenantId = :tenantId "
            + "AND log.createdAt >= :startDate AND log.createdAt < :endDate")
    Long sumTokensByTenantAndPeriod(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 테넌트별 특정 기간 평균 응답 시간(ms).
     *
     * @return 평균 응답 시간(ms) 또는 null (데이터 없음)
     */
    @Query("SELECT AVG(log.responseTimeMs) FROM AiUsageLog log "
            + "WHERE log.tenantId = :tenantId "
            + "AND log.createdAt >= :startDate AND log.createdAt < :endDate "
            + "AND log.responseTimeMs IS NOT NULL")
    Double averageDurationByTenantAndPeriod(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 테넌트별 caller(requestType) 기준 호출 수 집계.
     *
     * @return Object[] {caller(String), count(Long)} 행 배열
     */
    @Query("SELECT log.requestType, COUNT(log) FROM AiUsageLog log "
            + "WHERE log.tenantId = :tenantId "
            + "AND log.createdAt >= :startDate AND log.createdAt < :endDate "
            + "GROUP BY log.requestType")
    List<Object[]> countByCallerInPeriod(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 테넌트별 model 기준 호출 수 집계 (provider 라벨 매핑은 서비스 계층에서 수행).
     *
     * @return Object[] {model(String), count(Long)} 행 배열
     */
    @Query("SELECT log.model, COUNT(log) FROM AiUsageLog log "
            + "WHERE log.tenantId = :tenantId "
            + "AND log.createdAt >= :startDate AND log.createdAt < :endDate "
            + "GROUP BY log.model")
    List<Object[]> countByModelInPeriod(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 테넌트별 일자별 호출 수 (최근 N일 차트용).
     *
     * @return Object[] {date(java.sql.Date), count(Long)} 행 배열
     */
    @Query(value = "SELECT DATE(created_at) AS d, COUNT(*) AS c FROM ai_usage_logs "
            + "WHERE tenant_id = :tenantId "
            + "AND created_at >= :startDate AND created_at < :endDate "
            + "GROUP BY DATE(created_at) "
            + "ORDER BY d ASC",
            nativeQuery = true)
    List<Object[]> countDailyByTenantAndPeriod(
            @Param("tenantId") String tenantId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    /**
     * 테넌트별 로그 페이징 조회 (필터: caller, status).
     *
     * <p>provider 필터는 model prefix 기반이라 SQL 수준 필터링이 어려워 서비스 계층에서 후처리한다.
     * (현 entity 가 aiProvider 컬럼을 갖지 않음 — 트랙 B PR-2 보존)
     *
     * @param tenantId  테넌트 ID
     * @param caller    caller(requestType) 또는 null/blank → 미지정
     * @param isSuccess 성공 여부 또는 null → 미지정
     * @param pageable  페이지 설정
     */
    @Query("SELECT log FROM AiUsageLog log "
            + "WHERE log.tenantId = :tenantId "
            + "AND (:caller IS NULL OR :caller = '' OR log.requestType = :caller) "
            + "AND (:isSuccess IS NULL OR log.isSuccess = :isSuccess) "
            + "ORDER BY log.createdAt DESC")
    Page<AiUsageLog> findPageByTenantWithFilters(
            @Param("tenantId") String tenantId,
            @Param("caller") String caller,
            @Param("isSuccess") Boolean isSuccess,
            Pageable pageable
    );
}

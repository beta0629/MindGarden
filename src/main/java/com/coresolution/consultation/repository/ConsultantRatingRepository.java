package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.ConsultantRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 상담사 평가 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Repository
public interface ConsultantRatingRepository extends BaseRepository<ConsultantRating, Long> {

    // ==================== tenantId 필터링 메서드 ====================

    /**
     * 테넌트별 모든 평가 조회 (tenantId 필터링)
     */
    @Query("SELECT cr FROM ConsultantRating cr WHERE cr.tenantId = :tenantId")
    List<ConsultantRating> findByTenantId(@Param("tenantId") String tenantId);
    
    /**
     * 스케줄별 평가 조회 (중복 평가 방지용) (tenantId 필터링)
     */
    @Query("SELECT cr FROM ConsultantRating cr WHERE cr.tenantId = :tenantId AND cr.schedule.id = :scheduleId AND cr.status = :status")
    Optional<ConsultantRating> findByTenantIdAndScheduleIdAndStatus(@Param("tenantId") String tenantId, @Param("scheduleId") Long scheduleId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * 내담자가 특정 스케줄에 평가했는지 확인 (tenantId 필터링)
     */
    @Query("SELECT CASE WHEN COUNT(cr) > 0 THEN true ELSE false END FROM ConsultantRating cr WHERE cr.tenantId = :tenantId AND cr.schedule.id = :scheduleId AND cr.client.id = :clientId AND cr.status = :status")
    boolean existsByTenantIdAndScheduleIdAndClientIdAndStatus(@Param("tenantId") String tenantId, @Param("scheduleId") Long scheduleId, @Param("clientId") Long clientId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * 상담사별 평가 목록 조회 (페이징) (tenantId 필터링)
     */
    @Query("SELECT cr FROM ConsultantRating cr WHERE cr.tenantId = :tenantId AND cr.consultant.id = :consultantId AND cr.status = :status ORDER BY cr.ratedAt DESC")
    Page<ConsultantRating> findByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * 내담자별 평가 목록 조회 (페이징) (tenantId 필터링)
     */
    @Query("SELECT cr FROM ConsultantRating cr WHERE cr.tenantId = :tenantId AND cr.client.id = :clientId AND cr.status = :status ORDER BY cr.ratedAt DESC")
    Page<ConsultantRating> findByTenantIdAndClientIdAndStatusOrderByRatedAtDesc(@Param("tenantId") String tenantId, @Param("clientId") Long clientId, @Param("status") ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * 상담사별 평균 하트 점수 계산 (tenantId 필터링)
     */
    @Query("SELECT AVG(r.heartScore) FROM ConsultantRating r WHERE r.tenantId = :tenantId AND r.consultant.id = :consultantId AND r.status = :status")
    Double getAverageHeartScoreByTenantIdAndConsultant(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * 상담사별 총 평가 개수 (tenantId 필터링)
     */
    @Query("SELECT COUNT(r) FROM ConsultantRating r WHERE r.tenantId = :tenantId AND r.consultant.id = :consultantId AND r.status = :status")
    Long getTotalRatingCountByTenantIdAndConsultant(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * 상담사별 하트 점수별 개수 (tenantId 필터링)
     */
    @Query("SELECT r.heartScore, COUNT(r) FROM ConsultantRating r WHERE r.tenantId = :tenantId AND r.consultant.id = :consultantId AND r.status = :status GROUP BY r.heartScore ORDER BY r.heartScore DESC")
    List<Object[]> getHeartScoreDistributionByTenantIdAndConsultant(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * 기간별 상담사 평가 조회 (tenantId 필터링)
     */
    @Query("SELECT r FROM ConsultantRating r WHERE r.tenantId = :tenantId AND r.consultant.id = :consultantId AND r.status = :status AND r.ratedAt BETWEEN :startDate AND :endDate ORDER BY r.ratedAt DESC")
    List<ConsultantRating> findByTenantIdAndConsultantAndDateRange(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 최근 평가 조회 (상담사별) (tenantId 필터링)
     */
    @Query("SELECT r FROM ConsultantRating r WHERE r.tenantId = :tenantId AND r.consultant.id = :consultantId AND r.status = :status ORDER BY r.ratedAt DESC")
    List<ConsultantRating> findTop10ByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * 높은 평가 조회 (4점 이상) (tenantId 필터링)
     */
    @Query("SELECT r FROM ConsultantRating r WHERE r.tenantId = :tenantId AND r.consultant.id = :consultantId AND r.status = :status AND r.heartScore >= 4 ORDER BY r.ratedAt DESC")
    List<ConsultantRating> findHighRatingsByTenantIdAndConsultant(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * 전체 상담사 평균 점수 랭킹 (활성 상담사만) (tenantId 필터링)
     */
    @Query("SELECT r.consultant, AVG(r.heartScore) as avgScore, COUNT(r) as totalCount FROM ConsultantRating r WHERE r.tenantId = :tenantId AND r.status = :status AND r.consultant.isActive = true GROUP BY r.consultant ORDER BY avgScore DESC, totalCount DESC")
    List<Object[]> getConsultantRankingByAverageScoreAndTenantId(@Param("tenantId") String tenantId, @Param("status") ConsultantRating.RatingStatus status, Pageable pageable);

    // ==================== @Deprecated 메서드 (하위 호환성) ====================

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndScheduleIdAndStatus 사용하세요.
     */
    @Deprecated
    Optional<ConsultantRating> findByScheduleIdAndStatus(Long scheduleId, ConsultantRating.RatingStatus status);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! existsByTenantIdAndScheduleIdAndClientIdAndStatus 사용하세요.
     */
    @Deprecated
    boolean existsByScheduleIdAndClientIdAndStatus(Long scheduleId, Long clientId, ConsultantRating.RatingStatus status);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc 사용하세요.
     */
    @Deprecated
    Page<ConsultantRating> findByConsultantIdAndStatusOrderByRatedAtDesc(Long consultantId, ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndClientIdAndStatusOrderByRatedAtDesc 사용하세요.
     */
    @Deprecated
    Page<ConsultantRating> findByClientIdAndStatusOrderByRatedAtDesc(Long clientId, ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! getAverageHeartScoreByTenantIdAndConsultant 사용하세요.
     */
    @Deprecated
    @Query("SELECT AVG(r.heartScore) FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status")
    Double getAverageHeartScoreByConsultant(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! getTotalRatingCountByTenantIdAndConsultant 사용하세요.
     */
    @Deprecated
    @Query("SELECT COUNT(r) FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status")
    Long getTotalRatingCountByConsultant(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! getHeartScoreDistributionByTenantIdAndConsultant 사용하세요.
     */
    @Deprecated
    @Query("SELECT r.heartScore, COUNT(r) FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status GROUP BY r.heartScore ORDER BY r.heartScore DESC")
    List<Object[]> getHeartScoreDistributionByConsultant(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findByTenantIdAndConsultantAndDateRange 사용하세요.
     */
    @Deprecated
    @Query("SELECT r FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status AND r.ratedAt BETWEEN :startDate AND :endDate ORDER BY r.ratedAt DESC")
    List<ConsultantRating> findByConsultantAndDateRange(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findTop10ByTenantIdAndConsultantIdAndStatusOrderByRatedAtDesc 사용하세요.
     */
    @Deprecated
    List<ConsultantRating> findTop10ByConsultantIdAndStatusOrderByRatedAtDesc(Long consultantId, ConsultantRating.RatingStatus status);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! findHighRatingsByTenantIdAndConsultant 사용하세요.
     */
    @Deprecated
    @Query("SELECT r FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status AND r.heartScore >= 4 ORDER BY r.ratedAt DESC")
    List<ConsultantRating> findHighRatingsByConsultant(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * @Deprecated - 🚨 위험: tenantId 필터링 없음! getConsultantRankingByAverageScoreAndTenantId 사용하세요.
     */
    @Deprecated
    @Query("SELECT r.consultant, AVG(r.heartScore) as avgScore, COUNT(r) as totalCount FROM ConsultantRating r WHERE r.status = :status AND r.consultant.isActive = true GROUP BY r.consultant ORDER BY avgScore DESC, totalCount DESC")
    List<Object[]> getConsultantRankingByAverageScore(@Param("status") ConsultantRating.RatingStatus status, Pageable pageable);
}

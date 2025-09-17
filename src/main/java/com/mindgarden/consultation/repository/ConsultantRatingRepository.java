package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.ConsultantRating;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * 상담사 평가 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-09-17
 */
@Repository
public interface ConsultantRatingRepository extends JpaRepository<ConsultantRating, Long> {

    /**
     * 스케줄별 평가 조회 (중복 평가 방지용)
     */
    Optional<ConsultantRating> findByScheduleIdAndStatus(Long scheduleId, ConsultantRating.RatingStatus status);

    /**
     * 내담자가 특정 스케줄에 평가했는지 확인
     */
    boolean existsByScheduleIdAndClientIdAndStatus(Long scheduleId, Long clientId, ConsultantRating.RatingStatus status);

    /**
     * 상담사별 평가 목록 조회 (페이징)
     */
    Page<ConsultantRating> findByConsultantIdAndStatusOrderByRatedAtDesc(Long consultantId, ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * 내담자별 평가 목록 조회 (페이징)
     */
    Page<ConsultantRating> findByClientIdAndStatusOrderByRatedAtDesc(Long clientId, ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * 상담사별 평균 하트 점수 계산
     */
    @Query("SELECT AVG(r.heartScore) FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status")
    Double getAverageHeartScoreByConsultant(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * 상담사별 총 평가 개수
     */
    @Query("SELECT COUNT(r) FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status")
    Long getTotalRatingCountByConsultant(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * 상담사별 하트 점수별 개수
     */
    @Query("SELECT r.heartScore, COUNT(r) FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status GROUP BY r.heartScore ORDER BY r.heartScore DESC")
    List<Object[]> getHeartScoreDistributionByConsultant(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status);

    /**
     * 기간별 상담사 평가 조회
     */
    @Query("SELECT r FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status AND r.ratedAt BETWEEN :startDate AND :endDate ORDER BY r.ratedAt DESC")
    List<ConsultantRating> findByConsultantAndDateRange(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    /**
     * 최근 평가 조회 (상담사별)
     */
    List<ConsultantRating> findTop10ByConsultantIdAndStatusOrderByRatedAtDesc(Long consultantId, ConsultantRating.RatingStatus status);

    /**
     * 높은 평가 조회 (4점 이상)
     */
    @Query("SELECT r FROM ConsultantRating r WHERE r.consultant.id = :consultantId AND r.status = :status AND r.heartScore >= 4 ORDER BY r.ratedAt DESC")
    List<ConsultantRating> findHighRatingsByConsultant(@Param("consultantId") Long consultantId, @Param("status") ConsultantRating.RatingStatus status, Pageable pageable);

    /**
     * 전체 상담사 평균 점수 랭킹
     */
    @Query("SELECT r.consultant, AVG(r.heartScore) as avgScore, COUNT(r) as totalCount FROM ConsultantRating r WHERE r.status = :status GROUP BY r.consultant ORDER BY avgScore DESC, totalCount DESC")
    List<Object[]> getConsultantRankingByAverageScore(@Param("status") ConsultantRating.RatingStatus status, Pageable pageable);
}

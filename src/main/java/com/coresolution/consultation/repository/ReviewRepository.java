package com.coresolution.consultation.repository;

import java.util.List;
import java.util.Optional;
import com.coresolution.consultation.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 리뷰 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    
    List<Review> findByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    /**
     * 테넌트별 상담사 ID로 리뷰 조회 (consultant.tenantId를 통한 간접 필터링)
     */
    @Query("SELECT r FROM Review r WHERE r.tenantId = :tenantId AND r.consultantId = :consultantId AND r.isDeleted = false")
    List<Review> findByTenantIdAndConsultantIdAndIsDeletedFalse(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: 모든 테넌트 상담사 리뷰 노출!
     */
    @Deprecated
    List<Review> findByConsultantIdAndIsDeletedFalse(Long consultantId);
    
    List<Review> findByClientIdAndIsDeletedFalse(Long clientId);
    
    Optional<Review> findByConsultationIdAndClientIdAndIsDeletedFalse(Long consultationId, Long clientId);
    
    /**
     * 테넌트별 상담사 평균 평점 조회 (consultant.tenantId를 통한 간접 필터링)
     */
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.tenantId = :tenantId AND r.consultantId = :consultantId AND r.isDeleted = false")
    Double findAverageRatingByTenantIdAndConsultantId(@Param("tenantId") String tenantId, @Param("consultantId") Long consultantId);
    
    /**
     * @Deprecated - 🚨 위험: 모든 테넌트 상담사 평균 평점 노출!
     */
    @Deprecated
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.consultantId = :consultantId AND r.isDeleted = false")
    Double findAverageRatingByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.consultantId = :consultantId AND r.isDeleted = false")
    Long countByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT r FROM Review r WHERE r.consultantId = :consultantId AND r.rating >= :minRating AND r.isDeleted = false")
    List<Review> findByConsultantIdAndRatingGreaterThanEqual(@Param("consultantId") Long consultantId, @Param("minRating") Integer minRating);
}

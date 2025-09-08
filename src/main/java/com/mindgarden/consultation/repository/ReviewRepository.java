package com.mindgarden.consultation.repository;

import com.mindgarden.consultation.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

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
    
    List<Review> findByConsultantIdAndIsDeletedFalse(Long consultantId);
    
    List<Review> findByClientIdAndIsDeletedFalse(Long clientId);
    
    Optional<Review> findByConsultationIdAndClientIdAndIsDeletedFalse(Long consultationId, Long clientId);
    
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.consultantId = :consultantId AND r.isDeleted = false")
    Double findAverageRatingByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT COUNT(r) FROM Review r WHERE r.consultantId = :consultantId AND r.isDeleted = false")
    Long countByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT r FROM Review r WHERE r.consultantId = :consultantId AND r.rating >= :minRating AND r.isDeleted = false")
    List<Review> findByConsultantIdAndRatingGreaterThanEqual(@Param("consultantId") Long consultantId, @Param("minRating") Integer minRating);
}

package com.coresolution.consultation.repository;

import java.time.LocalDateTime;
import java.util.List;
import com.coresolution.consultation.entity.QualityEvaluation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * 품질 평가 리포지토리
 * 
 * @author MindGarden
 * @version 1.0.0
 * @since 2025-01-05
 */
@Repository
public interface QualityEvaluationRepository extends JpaRepository<QualityEvaluation, Long> {
    
    List<QualityEvaluation> findByConsultationIdAndIsDeletedFalse(Long consultationId);
    
    List<QualityEvaluation> findByConsultantIdAndIsDeletedFalse(Long consultantId);
    
    List<QualityEvaluation> findByEvaluatorIdAndIsDeletedFalse(String evaluatorId);
    
    List<QualityEvaluation> findByEvaluationStatusAndIsDeletedFalse(String evaluationStatus);
    
    @Query("SELECT AVG(qe.overallScore) FROM QualityEvaluation qe WHERE qe.consultantId = :consultantId AND qe.isDeleted = false")
    Double findAverageOverallScoreByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT AVG(qe.communicationScore) FROM QualityEvaluation qe WHERE qe.consultantId = :consultantId AND qe.isDeleted = false")
    Double findAverageCommunicationScoreByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT AVG(qe.professionalismScore) FROM QualityEvaluation qe WHERE qe.consultantId = :consultantId AND qe.isDeleted = false")
    Double findAverageProfessionalismScoreByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT AVG(qe.effectivenessScore) FROM QualityEvaluation qe WHERE qe.consultantId = :consultantId AND qe.isDeleted = false")
    Double findAverageEffectivenessScoreByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT AVG(qe.clientSatisfactionScore) FROM QualityEvaluation qe WHERE qe.consultantId = :consultantId AND qe.isDeleted = false")
    Double findAverageClientSatisfactionScoreByConsultantId(@Param("consultantId") Long consultantId);
    
    @Query("SELECT qe FROM QualityEvaluation qe WHERE qe.consultantId = :consultantId AND qe.createdAt BETWEEN :startDate AND :endDate AND qe.isDeleted = false")
    List<QualityEvaluation> findByConsultantIdAndCreatedAtBetween(@Param("consultantId") Long consultantId, 
                                                                  @Param("startDate") LocalDateTime startDate, 
                                                                  @Param("endDate") LocalDateTime endDate);
}

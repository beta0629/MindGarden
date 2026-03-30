package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.TextEmotionAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 텍스트 감정 분석 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface TextEmotionAnalysisRepository extends JpaRepository<TextEmotionAnalysis, Long> {

    Optional<TextEmotionAnalysis> findByIdAndIsDeletedFalse(Long id);

    Optional<TextEmotionAnalysis> findByConsultationRecordIdAndIsDeletedFalse(Long consultationRecordId);

    List<TextEmotionAnalysis> findByConsultationRecordIdAndSourceTypeAndIsDeletedFalse(
        Long consultationRecordId, String sourceType);

    @Query("SELECT t FROM TextEmotionAnalysis t " +
           "WHERE t.tenantId = :tenantId " +
           "AND t.distortionRiskLevel = 'HIGH' " +
           "AND t.isDeleted = false " +
           "ORDER BY t.createdAt DESC")
    List<TextEmotionAnalysis> findHighRiskDistortionsByTenantId(@Param("tenantId") String tenantId);
}

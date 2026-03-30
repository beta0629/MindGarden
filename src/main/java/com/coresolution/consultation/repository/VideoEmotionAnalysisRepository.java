package com.coresolution.consultation.repository;

import com.coresolution.consultation.entity.VideoEmotionAnalysis;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * 비디오 감정 분석 리포지토리
 *
 * @author MindGarden
 * @version 1.0.0
 * @since 2026-01-21
 */
@Repository
public interface VideoEmotionAnalysisRepository extends JpaRepository<VideoEmotionAnalysis, Long> {

    Optional<VideoEmotionAnalysis> findByIdAndIsDeletedFalse(Long id);

    Optional<VideoEmotionAnalysis> findByConsultationRecordIdAndIsDeletedFalse(Long consultationRecordId);

    List<VideoEmotionAnalysis> findByTenantIdAndIsDeletedFalseOrderByCreatedAtDesc(String tenantId);
}

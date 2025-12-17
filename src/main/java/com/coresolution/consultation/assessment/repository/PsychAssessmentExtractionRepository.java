package com.coresolution.consultation.assessment.repository;

import com.coresolution.consultation.assessment.entity.PsychAssessmentExtraction;
import com.coresolution.consultation.assessment.model.PsychAssessmentExtractionStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PsychAssessmentExtractionRepository extends JpaRepository<PsychAssessmentExtraction, Long> {
    Optional<PsychAssessmentExtraction> findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(String tenantId, Long documentId);

    List<PsychAssessmentExtraction> findByTenantIdAndStatus(String tenantId, PsychAssessmentExtractionStatus status);
}



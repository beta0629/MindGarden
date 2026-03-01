package com.coresolution.consultation.assessment.repository;

import com.coresolution.consultation.assessment.entity.PsychAssessmentMetric;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PsychAssessmentMetricRepository extends JpaRepository<PsychAssessmentMetric, Long> {

    List<PsychAssessmentMetric> findByTenantIdAndDocumentId(String tenantId, Long documentId);

    void deleteByTenantIdAndExtractionId(String tenantId, Long extractionId);
}



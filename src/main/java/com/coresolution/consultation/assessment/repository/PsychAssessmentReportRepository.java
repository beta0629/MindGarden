package com.coresolution.consultation.assessment.repository;

import com.coresolution.consultation.assessment.entity.PsychAssessmentReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PsychAssessmentReportRepository extends JpaRepository<PsychAssessmentReport, Long> {
    Optional<PsychAssessmentReport> findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(String tenantId, Long documentId);
}



package com.coresolution.consultation.assessment.repository;

import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PsychAssessmentDocumentRepository extends JpaRepository<PsychAssessmentDocument, Long> {
    Optional<PsychAssessmentDocument> findByTenantIdAndId(String tenantId, Long id);
}



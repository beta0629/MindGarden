package com.coresolution.consultation.assessment.repository;

import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PsychAssessmentDocumentRepository extends JpaRepository<PsychAssessmentDocument, Long> {
    Optional<PsychAssessmentDocument> findByTenantIdAndId(String tenantId, Long id);

    List<PsychAssessmentDocument> findTop20ByTenantIdAndStatusOrderByCreatedAtDesc(String tenantId, PsychAssessmentDocumentStatus status);

    List<PsychAssessmentDocument> findTop20ByTenantIdOrderByCreatedAtDesc(String tenantId);
}



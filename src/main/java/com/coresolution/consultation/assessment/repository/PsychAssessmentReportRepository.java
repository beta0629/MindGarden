package com.coresolution.consultation.assessment.repository;

import com.coresolution.consultation.assessment.entity.PsychAssessmentReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PsychAssessmentReportRepository extends JpaRepository<PsychAssessmentReport, Long> {
    long countByTenantId(String tenantId);

    Optional<PsychAssessmentReport> findTopByTenantIdAndDocumentIdOrderByCreatedAtDesc(String tenantId, Long documentId);

    /**
     * 문서별 최신 GENERATED 리포트 (상담일지·내담자 요약 노출 기준).
     */
    Optional<PsychAssessmentReport> findFirstByTenantIdAndDocumentIdAndStatusOrderByCreatedAtDesc(
            String tenantId,
            Long documentId,
            String status);
}



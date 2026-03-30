package com.coresolution.consultation.assessment.repository;

import com.coresolution.consultation.assessment.entity.PsychAssessmentDocument;
import com.coresolution.consultation.assessment.model.PsychAssessmentDocumentStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PsychAssessmentDocumentRepository extends JpaRepository<PsychAssessmentDocument, Long> {
    long countByTenantId(String tenantId);

    Optional<PsychAssessmentDocument> findByTenantIdAndId(String tenantId, Long id);

    List<PsychAssessmentDocument> findTop20ByTenantIdAndStatusOrderByCreatedAtDesc(String tenantId, PsychAssessmentDocumentStatus status);

    List<PsychAssessmentDocument> findTop20ByTenantIdOrderByCreatedAtDesc(String tenantId);

    /** tenant + original_filename 포함 패턴 기준 최신 문서 조회 (MMPI 리포트 테스트 등) */
    Optional<PsychAssessmentDocument> findFirstByTenantIdAndOriginalFilenameContainingOrderByCreatedAtDesc(
            String tenantId, String filenamePattern);

    /** 상담일지용: clientId 기준 심리검사 문서 목록 (최신순) */
    List<PsychAssessmentDocument> findByTenantIdAndClientIdOrderByCreatedAtDesc(String tenantId, Long clientId);
}


